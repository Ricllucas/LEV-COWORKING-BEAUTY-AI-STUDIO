import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./openwa.js', () => ({
  isOpenWaConfigured: () => true,
  sendOpenWaText: vi.fn().mockResolvedValue({})
}));

type MockResponse = { ok: boolean; status: number; json: () => Promise<unknown> };
type Res = {
  statusCode: number;
  body: unknown;
  setHeader: (name: string, value: string) => void;
  status: (code: number) => Res;
  json: (body: unknown) => Res;
};

const makeRes = (): Res => {
  const res: Res = {
    statusCode: 0,
    body: undefined,
    setHeader: () => undefined,
    status: code => { res.statusCode = code; return res; },
    json: body => { res.body = body; return res; }
  };
  return res;
};

const reply = (body: unknown): MockResponse => ({ ok: true, status: 200, json: async () => body });

// Agendamento confirmado para amanhã às 13:00 (lembrete de 1 dia vence agora, às 12:00).
const row = (id: string) => ({
  id,
  reminders_sent: { confirmacao: true },
  payload: {
    clientName: 'Ana Souza', clientPhone: '41999990000', professionalId: 'prof_nayara',
    professionalName: 'Nayara', serviceNames: ['Banho de Gel'], date: '2026-11-11',
    startTime: '13:00', endTime: '14:30', status: 'confirmado', createdAt: '2026-11-01T10:00:00-03:00'
  }
});

describe('cron de mensagens: salão por salão', () => {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<MockResponse>>();

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://db.exemplo';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
    process.env.CRON_SECRET = 'segredo';
    vi.useFakeTimers({ now: new Date('2026-11-10T12:00:00-03:00'), toFake: ['setTimeout', 'Date'] });
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const run = async (rowsBySalon: Record<string, unknown[]>) => {
    fetchMock.mockImplementation(async (url, init) => {
      if (url.includes('/rest/v1/salons?')) return reply(Object.keys(rowsBySalon).map(id => ({ id })));
      if (init?.method === 'PATCH') return reply([]);
      const salon = url.match(/salon_id=eq\.([a-z0-9-]+)/)?.[1] ?? '';
      return reply(rowsBySalon[salon] ?? []);
    });
    const handler = (await import('../cron/send-reminders')).default;
    const res = makeRes();
    const pending = handler({ method: 'GET', headers: { authorization: 'Bearer segredo' } }, res);
    await vi.runAllTimersAsync();
    await pending;
    return res;
  };

  it('busca só salões ativos e lê e grava cada agendamento com o filtro do seu salão', async () => {
    const res = await run({ lev: [row('apt_lev')], outro: [row('apt_outro')] });
    expect(res.statusCode).toBe(200);

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls[0]).toBe('https://db.exemplo/rest/v1/salons?status=eq.ativo&select=id&order=id.asc');

    const reads = fetchMock.mock.calls.filter(([url, init]) => url.includes('/rest/v1/appointments?select=') && !init?.method);
    expect(reads.map(([url]) => url.match(/salon_id=eq\.[a-z0-9-]+/)?.[0])).toEqual(['salon_id=eq.lev', 'salon_id=eq.outro']);
    reads.forEach(([url]) => expect(url).toMatch(/appointment_date=gte\.[\d-]+&appointment_date=lte\.[\d-]+&salon_id=eq\./));

    const writes = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH').map(([url]) => url);
    expect(writes).toEqual([
      'https://db.exemplo/rest/v1/appointments?id=eq.apt_lev&salon_id=eq.lev',
      'https://db.exemplo/rest/v1/appointments?id=eq.apt_outro&salon_id=eq.outro'
    ]);
  });

  it('o limite de envios por rodada vale para todos os salões juntos', async () => {
    const many = (prefix: string) => [1, 2, 3, 4].map(n => row(`${prefix}_${n}`));
    const res = await run({ lev: many('apt_lev'), outro: many('apt_outro') });
    expect(res.statusCode).toBe(200);
    const body = res.body as { sent: Record<string, number>; pending: number };
    expect(body.sent['1dia']).toBe(6);
    expect(body.pending).toBe(2);
  });
});
