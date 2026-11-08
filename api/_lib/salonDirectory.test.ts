import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// As rotas testadas aqui não devem gravar nada nem mandar WhatsApp.
vi.mock('./appointmentService.js', async importOriginal => ({
  ...await importOriginal<typeof import('./appointmentService')>(),
  assertPublicBookingLimit: vi.fn().mockResolvedValue(undefined),
  createUnifiedAppointment: vi.fn().mockResolvedValue({ saved: true, appointment: null })
}));
vi.mock('./whatsappProfessionalNotification.js', () => ({ sendProfessionalNotification: vi.fn().mockResolvedValue(true) }));
vi.mock('./openwa.js', () => ({ isOpenWaConfigured: () => true, sendOpenWaText: vi.fn().mockResolvedValue({}) }));
vi.mock('./staffAuth.js', async importOriginal => ({
  ...await importOriginal<typeof import('./staffAuth')>(),
  authenticateStaff: vi.fn().mockResolvedValue(null)
}));

import { calendarIdFor, findProfessional, loadSalonDirectory, resetSalonDirectoryCache } from './salonDirectory';
import { authenticateStaff } from './staffAuth';
import { syncGoogleCalendarEvent } from './googleCalendar';
import { sendOpenWaText } from './openwa';
import createHandler from '../appointments/create';
import blockHandler from '../calendar/block';

type Answer = { status: number; body: unknown };
type Answers = Partial<Record<'salons' | 'salon_settings' | 'professionals' | 'professional_calendars', Answer>>;

const ok = (body: unknown): Answer => ({ status: 200, body });
const down: Answer = { status: 500, body: { message: 'fora do ar' } };

const levRows = [
  { id: 'prof_elisangela', payload: { id: 'prof_elisangela', name: 'Elisangela', whatsapp: '5541992461203' } },
  { id: 'prof_talitha', payload: { id: 'prof_talitha', name: 'Talitha', whatsapp: '5541999983228' } },
  { id: 'prof_nayara', payload: { id: 'prof_nayara', name: 'Nayara', whatsapp: '5541996556742' } }
];
const demoRows = [
  { id: 'prof_aurora_ana', payload: { id: 'prof_aurora_ana', name: 'Ana', whatsapp: '5548900000001' } },
  { id: 'prof_aurora_bia', payload: { id: 'prof_aurora_bia', name: 'Bia', whatsapp: '5548900000002' } }
];

let answers: Answers = {};
const fetchMock = vi.fn(async (input: string | URL, _init?: RequestInit) => {
  const url = String(input);
  const table = (['professional_calendars', 'salon_settings', 'professionals', 'salons'] as const)
    .find(name => url.includes(`/rest/v1/${name}?`));
  const answer = (table && answers[table]) || down;
  return new Response(JSON.stringify(answer.body), { status: answer.status });
});

const ENV_KEYS = ['GOOGLE_CALENDAR_ID', 'GOOGLE_CALENDAR_ID_ELISANGELA', 'GOOGLE_CALENDAR_ID_TALITHA', 'GOOGLE_CALENDAR_ID_NAYARA'];

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://exemplo.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-teste';
  for (const key of ENV_KEYS) delete process.env[key];
  answers = {};
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  resetSalonDirectoryCache();
  vi.mocked(authenticateStaff).mockResolvedValue(null);
});
afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.unstubAllGlobals();
});

describe('diretório do salão (profissionais e Google Agenda)', () => {
  it('LEV: a agenda da Talitha vem de professional_calendars', async () => {
    answers = {
      salons: ok([{ name: 'LEV Coworking Beauty' }]),
      salon_settings: ok([{ payload: {} }]),
      professionals: ok(levRows),
      professional_calendars: ok([{ professional_id: 'prof_talitha', google_calendar_id: 'cal-da-talitha@group.calendar.google.com' }])
    };
    process.env.GOOGLE_CALENDAR_ID_TALITHA = 'cal-antiga';
    const dir = await loadSalonDirectory('lev');
    expect(dir.professionals.map(p => p.id)).toEqual(['prof_elisangela', 'prof_talitha', 'prof_nayara']);
    expect(calendarIdFor(dir, 'prof_talitha')).toBe('cal-da-talitha@group.calendar.google.com');
    // Lê a tabela das agendas com a chave de serviço e só do salão pedido
    const call = fetchMock.mock.calls.find(([url]) => String(url).includes('professional_calendars'));
    expect(String(call?.[0])).toContain('salon_id=eq.lev');
    expect((call?.[1] as RequestInit | undefined)?.headers).toMatchObject({ Authorization: 'Bearer chave-teste' });
  });

  it('LEV: sem a tabela professional_calendars (404), usa GOOGLE_CALENDAR_ID_TALITHA', async () => {
    answers = {
      salons: ok([{ name: 'LEV Coworking Beauty' }]),
      salon_settings: ok([]),
      professionals: ok(levRows),
      professional_calendars: { status: 404, body: { code: 'PGRST205' } }
    };
    process.env.GOOGLE_CALENDAR_ID_TALITHA = 'cal-t';
    const dir = await loadSalonDirectory('lev');
    expect(calendarIdFor(dir, 'prof_talitha')).toBe('cal-t');
  });

  it('LEV: banco fora do ar → nomes, telefones, cores e nome do salão de fábrica', async () => {
    const dir = await loadSalonDirectory('lev');
    expect(dir.name).toBe('LEV Coworking Beauty');
    expect(dir.shortName).toBe('LEV');
    expect(dir.professionals).toHaveLength(3);
    expect(findProfessional(dir, 'prof_talitha')).toMatchObject({ name: 'Talitha', whatsapp: '5541999983228', googleColorId: '6' });
    expect(findProfessional(dir, 'prof_elisangela')).toMatchObject({ name: 'Elisangela', whatsapp: '5541992461203', googleColorId: '5' });
    expect(findProfessional(dir, 'prof_nayara')).toMatchObject({ name: 'Nayara', whatsapp: '5541996556742', googleColorId: '8' });
  });

  it('LEV: profissional sem agenda própria cai na agenda geral GOOGLE_CALENDAR_ID', async () => {
    process.env.GOOGLE_CALENDAR_ID = 'cal-lev';
    const dir = await loadSalonDirectory('lev');
    expect(calendarIdFor(dir, 'prof_nayara')).toBe('cal-lev');
  });

  it('outro salão sem linha em professional_calendars nunca usa a agenda da LEV', async () => {
    answers = {
      salons: ok([{ name: 'Studio Aurora' }]),
      salon_settings: ok([{ payload: { brand: { shortName: 'Aurora' } } }]),
      professionals: ok(demoRows),
      professional_calendars: ok([])
    };
    process.env.GOOGLE_CALENDAR_ID = 'cal-lev';
    process.env.GOOGLE_CALENDAR_ID_TALITHA = 'cal-t';
    const dir = await loadSalonDirectory('demo');
    expect(dir).toMatchObject({ salonId: 'demo', name: 'Studio Aurora', shortName: 'Aurora' });
    expect(dir.professionals.map(p => p.name)).toEqual(['Ana', 'Bia']);
    expect(findProfessional(dir, 'prof_aurora_ana')).toMatchObject({ whatsapp: '5548900000001', googleColorId: '0', googleCalendarId: null });
    expect(calendarIdFor(dir, 'prof_aurora_ana')).toBeNull();
    expect(calendarIdFor(dir, 'prof_talitha')).toBeNull();
  });

  it('outro salão com o banco fora do ar → nenhuma profissional (nunca as da LEV)', async () => {
    process.env.GOOGLE_CALENDAR_ID = 'cal-lev';
    const dir = await loadSalonDirectory('demo');
    expect(dir.professionals).toEqual([]);
    expect(findProfessional(dir, 'prof_talitha')).toBeUndefined();
    expect(calendarIdFor(dir, 'prof_talitha')).toBeNull();
  });

  it('guarda o diretório por 60 s para não ler o banco a cada pedido', async () => {
    answers = { salons: ok([{ name: 'Studio Aurora' }]), salon_settings: ok([]), professionals: ok(demoRows), professional_calendars: ok([]) };
    await loadSalonDirectory('demo');
    const calls = fetchMock.mock.calls.length;
    await loadSalonDirectory('demo');
    expect(fetchMock.mock.calls.length).toBe(calls);
  });
});

const fakeRes = () => {
  const res = { statusCode: 0, body: undefined as unknown, setHeader: vi.fn(), status(code: number) { res.statusCode = code; return res; }, json(body: unknown) { res.body = body; return res; } };
  return res;
};
let ip = 0;
const request = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
  socket: { remoteAddress: `10.0.0.${++ip}` },
  body
});

describe('rotas recusam profissional que não é do salão', () => {
  const booking = (professionalId: string) => ({
    professionalId, clientName: 'Maria', clientPhone: '41999990000', date: '2099-01-12', startTime: '10:00', endTime: '11:00', serviceIds: ['srv_tal_7']
  });

  it('agendamento público (LEV) com profissional de outro salão → 400', async () => {
    const res = fakeRes();
    await createHandler(request(booking('prof_aurora_ana')), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Profissional inválida.' });
  });

  it('agendamento público (LEV) com profissional inventada → 400', async () => {
    const res = fakeRes();
    await createHandler(request(booking('prof_inventada')), res);
    expect(res.body).toEqual({ error: 'Profissional inválida.' });
  });

  it('agendamento público (LEV) com a Talitha segue (mesmo com o banco fora do ar)', async () => {
    const res = fakeRes();
    await createHandler(request(booking('prof_talitha')), res);
    expect(res.statusCode).toBe(201);
  });

  it('bloqueio: profissional fora do diretório do salão do login → Profissional inválida.', async () => {
    vi.mocked(authenticateStaff).mockResolvedValue({ userId: 'u1', role: 'admin', salonId: 'demo' });
    answers = { salons: ok([{ name: 'Studio Aurora' }]), salon_settings: ok([]), professionals: ok(demoRows), professional_calendars: ok([]) };
    const res = fakeRes();
    await blockHandler(request({ id: 'b1', professionalId: 'prof_talitha', date: '2099-01-12', startTime: '10:00', endTime: '11:00', type: 'pausa' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Profissional inválida.' });
  });
});

describe('Google Agenda por salão', () => {
  const appointment = (professionalId: string, status = 'confirmado') => ({
    id: 'apt_1', professionalId, professionalName: 'Nome', clientName: 'Maria', clientPhone: '41999990000',
    serviceNames: ['Corte'], date: '2099-01-12', startTime: '10:00', endTime: '11:00', status, value: 50
  });
  const googleCalls = () => fetchMock.mock.calls.map(([url]) => String(url)).filter(url => url.includes('googleapis.com'));

  const withGoogle = (google: (url: string, init?: RequestInit) => Response) => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024 });
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'robo@exemplo.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com')) return new Response(JSON.stringify({ access_token: 'tk' }), { status: 200 });
      if (url.includes('googleapis.com/calendar')) return google(url, init);
      return base(input, init);
    });
  };
  afterEach(() => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  });

  it('agendamento de outro salão sem agenda própria não vai para a agenda da LEV', async () => {
    process.env.GOOGLE_CALENDAR_ID = 'cal-lev';
    answers = { salons: ok([{ name: 'Studio Aurora' }]), salon_settings: ok([]), professionals: ok(demoRows), professional_calendars: ok([]) };
    withGoogle(() => new Response('{}', { status: 200 }));
    expect(await syncGoogleCalendarEvent(appointment('prof_aurora_ana'), 'demo')).toEqual({ skipped: 'sem agenda do Google' });
    expect(await syncGoogleCalendarEvent(appointment('prof_aurora_ana', 'cancelado_cliente'), 'demo')).toEqual({ skipped: 'sem agenda do Google' });
    expect(googleCalls()).toEqual([]);
  });

  it('LEV: evento novo vai para a agenda da profissional, com a cor dela e a descrição nova', async () => {
    process.env.GOOGLE_CALENDAR_ID_TALITHA = 'cal-t';
    const sent: Array<{ url: string; body: { description: string; colorId: string } }> = [];
    withGoogle((url, init) => {
      if (init?.method === 'POST') sent.push({ url, body: JSON.parse(String(init.body)) });
      return new Response('{}', { status: init?.method ? 200 : 404 });
    });
    expect(await syncGoogleCalendarEvent(appointment('prof_talitha'), 'lev')).toMatchObject({ action: 'created' });
    expect(sent[0].url).toContain(`/calendars/${encodeURIComponent('cal-t')}/events`);
    expect(sent[0].body.colorId).toBe('6');
    expect(sent[0].body.description).toContain('🔗 Agendamento: apt_1');
  });

  it('LEV: cancelamento acha eventos com a descrição antiga e com a nova', async () => {
    process.env.GOOGLE_CALENDAR_ID_TALITHA = 'cal-t';
    const deleted: string[] = [];
    withGoogle((url, init) => {
      if (init?.method === 'DELETE') { deleted.push(url.split('/events/')[1]); return new Response('', { status: 200 }); }
      return new Response(JSON.stringify({ items: [
        { id: 'antigo', description: '🔗 Agendamento LEV: apt_1' },
        { id: 'novo', description: '🔗 Agendamento: apt_1' },
        { id: 'outro', description: '🔗 Agendamento: apt_2' }
      ] }), { status: 200 });
    });
    await syncGoogleCalendarEvent(appointment('prof_talitha', 'cancelado_cliente'), 'lev');
    expect(deleted).toContain('antigo');
    expect(deleted).toContain('novo');
    expect(deleted).not.toContain('outro');
  });
});

describe('aviso de novo agendamento para a profissional', () => {
  const data = (professionalId: string) => ({
    clientName: 'Maria', clientPhone: '41999990000', professionalId, professionalName: 'X',
    date: '2099-01-12', startTime: '10:00', endTime: '11:00', serviceNames: ['Corte'], totalPrice: 50
  });
  const realModule = () => vi.importActual<typeof import('./whatsappProfessionalNotification')>('./whatsappProfessionalNotification');

  it('LEV com o banco fora do ar: número de fábrica e textos iguais aos de hoje', async () => {
    vi.mocked(sendOpenWaText).mockClear();
    const { sendProfessionalNotification } = await realModule();
    expect(await sendProfessionalNotification(data('prof_talitha'), 'lev')).toBe(true);
    const [phone, message] = vi.mocked(sendOpenWaText).mock.calls[0];
    expect(phone).toBe('5541999983228');
    expect(message).toContain('📅 *Novo agendamento — LEV*');
    expect(message).toContain('Confira e confirme pelo painel da LEV.');
  });

  it('outro salão: número e nome curto do próprio salão; profissional da LEV não recebe', async () => {
    vi.mocked(sendOpenWaText).mockClear();
    answers = { salons: ok([{ name: 'Studio Aurora' }]), salon_settings: ok([{ payload: { brand: { shortName: 'Aurora' } } }]), professionals: ok(demoRows), professional_calendars: ok([]) };
    const { sendProfessionalNotification } = await realModule();
    expect(await sendProfessionalNotification(data('prof_talitha'), 'demo')).toBe(false);
    expect(await sendProfessionalNotification(data('prof_aurora_ana'), 'demo')).toBe(true);
    const [phone, message] = vi.mocked(sendOpenWaText).mock.calls[0];
    expect(phone).toBe('5548900000001');
    expect(message).toContain('Novo agendamento — Aurora');
  });
});

describe('agendamento pelo WhatsApp usa o diretório do salão', () => {
  const conversation = (step: string | null, draft: Record<string, unknown> = {}) => ({ id: 'conv_1', booking_step: step, booking_draft: draft });
  beforeEach(() => {
    Object.assign(process.env, { WHATSAPP_ACCESS_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '1' });
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input: string | URL, init?: RequestInit) =>
      String(input).includes('/rest/v1/whatsapp_conversations?') ? new Response(null, { status: 204 }) : base(input, init));
  });
  afterEach(() => { delete process.env.WHATSAPP_ACCESS_TOKEN; delete process.env.WHATSAPP_PHONE_NUMBER_ID; });
  const run = async (salonId: string, step: string | null, text: string, draft?: Record<string, unknown>) => {
    const { processWhatsAppBooking } = await import('./whatsappBooking');
    return processWhatsAppBooking({ conversation: conversation(step, draft), text, clientName: 'Maria', clientPhone: '5541999990000', salonId });
  };

  it('LEV com o banco fora do ar: menu igual ao de hoje', async () => {
    expect(await run('lev', null, 'agendar')).toBe('Vamos agendar pelo fluxo oficial da LEV.\n\nEscolha a profissional:\n1. Elisangela\n2. Talitha\n3. Nayara\n\nResponda apenas com o número.');
    const services = await run('lev', 'professional', '3');
    expect(services).toContain('Escolha o serviço:\n1. Aplicação de Alongamento — R$ 160,00\n2. Manutenção em Gel — R$ 145,00');
  });

  it('outro salão: só as profissionais dele', async () => {
    answers = { salons: ok([{ name: 'Studio Aurora' }]), salon_settings: ok([{ payload: { brand: { shortName: 'Aurora' } } }]), professionals: ok(demoRows), professional_calendars: ok([]) };
    expect(await run('demo', null, 'agendar')).toBe('Vamos agendar pelo fluxo oficial da Aurora.\n\nEscolha a profissional:\n1. Ana\n2. Bia\n\nResponda apenas com o número.');
    expect(await run('demo', 'professional', '3')).toContain('Opção inválida.');
  });
});

describe('sincronização geral da agenda só no salão padrão', () => {
  it('equipe do salão demo → skipped, sem chamar o Google e sem a agenda da LEV', async () => {
    process.env.GOOGLE_CALENDAR_ID = 'cal-lev';
    vi.mocked(authenticateStaff).mockResolvedValue({ userId: 'u1', role: 'admin', salonId: 'demo' });
    const { default: syncHandler } = await import('../calendar/sync');
    const res = fakeRes();
    await syncHandler({ method: 'GET', headers: { authorization: 'Bearer token' }, socket: { remoteAddress: `10.0.1.${++ip}` } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ skipped: 'sem agenda do Google' });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some(url => url.includes('googleapis.com'))).toBe(false);
    expect(urls.some(url => url.includes('cal-lev'))).toBe(false);
  });
});

describe('textos de horário ocupado usam o nome curto do salão', () => {
  // Terça-feira futura; já existe um agendamento das 10:00 às 11:00
  const day = '2099-01-13';
  const busy = { id: 'apt_outro', professionalId: 'prof_x', date: day, startTime: '10:00', endTime: '11:00', status: 'confirmado' };
  beforeEach(() => {
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input: string | URL, init?: RequestInit) =>
      String(input).includes('/rest/v1/appointments?') ? new Response(JSON.stringify([{ payload: busy }]), { status: 200 }) : base(input, init));
  });
  const attempt = async (salonId: string) => {
    const { assertAvailable } = await import('./appointmentService');
    return assertAvailable(salonId, { id: 'apt_novo', professionalId: 'prof_x', date: day, startTime: '10:30', endTime: '11:30' } as Parameters<typeof assertAvailable>[1]);
  };

  it('LEV: texto igual ao de hoje', async () => {
    await expect(attempt('lev')).rejects.toThrow(/^Este horário já está reservado no Studio LEV\. Escolha outro horário disponível\.$/);
  });

  it('outro salão: nome curto dele, sem LEV', async () => {
    answers = { salons: ok([{ name: 'Studio Aurora' }]), salon_settings: ok([{ payload: { brand: { shortName: 'Aurora' } } }]), professionals: ok(demoRows), professional_calendars: ok([]) };
    const error = await attempt('demo').catch((e: Error) => e);
    expect((error as Error).message).toBe('Este horário já está reservado no Studio Aurora. Escolha outro horário disponível.');
    expect((error as Error).message).not.toContain('LEV');
  });
});
