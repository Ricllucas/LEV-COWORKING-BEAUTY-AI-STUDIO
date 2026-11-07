import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertAvailable, availableStartTimes, listBlocksByDate, type UnifiedAppointment } from './appointmentService';
import availability from '../appointments/availability';

// Quarta-feira, 04/11/2026, 15:00 em Brasília. Os testes usam quinta, 05/11.
const NOW = new Date('2026-11-04T18:00:00Z');
const DAY = '2026-11-05';

const apt = (professionalId: string, startTime: string, endTime: string) =>
  ({ id: 'apt_x', professionalId, date: DAY, startTime, endTime } as UnifiedAppointment);

const blockRow = (professionalId: string, startTime: string, endTime: string) => ({
  professional_id: professionalId,
  payload: { id: `blk_${professionalId}`, professionalId, date: DAY, startTime, endTime, title: 'Consulta médica', reason: 'particular' }
});

type BlocksAnswer = { status: number; body: unknown };
let blocksAnswer: BlocksAnswer;
const fetchMock = vi.fn(async (input: string | URL) => {
  const url = String(input);
  if (url.includes('/rest/v1/schedule_blocks')) return new Response(JSON.stringify(blocksAnswer.body), { status: blocksAnswer.status });
  return new Response('[]', { status: 200 });
});

const fakeRes = () => {
  const res = { statusCode: 0, body: undefined as unknown, setHeader: vi.fn(), status(code: number) { res.statusCode = code; return res; }, json(body: unknown) { res.body = body; return res; } };
  return res;
};

describe('bloqueios da profissional valem para o site público', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    process.env.SUPABASE_URL = 'https://exemplo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-teste';
    blocksAnswer = { status: 200, body: [blockRow('prof_talitha', '09:30', '11:00')] };
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('agendamento às 10:00 com a Talitha bloqueada das 09:30 às 11:00 → 409', async () => {
    await expect(assertAvailable('lev', apt('prof_talitha', '10:00', '11:00'))).rejects.toMatchObject({
      status: 409,
      message: 'Este horário está bloqueado pela profissional. Escolha outro horário.'
    });
  });

  it('mesmo horário com bloqueio só da Nayara → aceito', async () => {
    blocksAnswer = { status: 200, body: [blockRow('prof_nayara', '09:30', '11:00')] };
    await expect(assertAvailable('lev', apt('prof_talitha', '10:00', '11:00'))).resolves.toBeUndefined();
  });

  it('horário encostado no bloqueio (11:00 em diante) → aceito', async () => {
    await expect(assertAvailable('lev', apt('prof_talitha', '11:00', '12:00'))).resolves.toBeUndefined();
  });

  it('equipe pode encaixar em cima do próprio bloqueio', async () => {
    await expect(assertAvailable('lev', apt('prof_talitha', '10:00', '11:00'), { allowStaffOverBlocks: true })).resolves.toBeUndefined();
  });

  it('lê os bloqueios só do salão e da data pedidos', async () => {
    await listBlocksByDate('lev', DAY);
    const url = String(fetchMock.mock.calls.find(call => String(call[0]).includes('schedule_blocks'))?.[0]);
    expect(url).toContain('salon_id=eq.lev');
    expect(url).toContain(`payload->>date=eq.${DAY}`);
  });

  it('devolve só profissional, data e horários (nunca o título nem o motivo)', async () => {
    expect(await listBlocksByDate('lev', DAY)).toEqual([{ professionalId: 'prof_talitha', date: DAY, startTime: '09:30', endTime: '11:00' }]);
  });

  it('vale a profissional da coluna (conferida pelo banco); linha com texto apontando outra é ignorada', async () => {
    const forged = blockRow('prof_nayara', '09:30', '11:00');
    forged.payload.professionalId = 'prof_talitha';
    blocksAnswer = { status: 200, body: [forged, { professional_id: null, payload: blockRow('prof_talitha', '13:00', '14:00').payload }] };
    expect(await listBlocksByDate('lev', DAY)).toEqual([]);
    await expect(assertAvailable('lev', apt('prof_talitha', '10:00', '11:00'))).resolves.toBeUndefined();
  });

  it('tabela ainda não criada (404 ou PGRST205) → lista vazia e o agendamento segue', async () => {
    blocksAnswer = { status: 404, body: { code: 'PGRST205' } };
    expect(await listBlocksByDate('lev', DAY)).toEqual([]);
    blocksAnswer = { status: 400, body: { code: '42P01' } };
    expect(await listBlocksByDate('lev', DAY)).toEqual([]);
    await expect(assertAvailable('lev', apt('prof_talitha', '10:00', '11:00'))).resolves.toBeUndefined();
  });

  it('WhatsApp: horários livres pulam o bloqueio da profissional', async () => {
    const times = await availableStartTimes('lev', DAY, 60, 'prof_talitha');
    expect(times).not.toContain('09:00');
    expect(times).not.toContain('10:00');
    expect(times).toContain('11:00');
  });

  it('availability responde { appointments, blocks } e os bloqueios vêm sem título', async () => {
    const res = fakeRes();
    await availability({ method: 'GET', query: { date: DAY }, headers: {}, socket: { remoteAddress: '1.1.1.1' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      appointments: [],
      blocks: [{ professionalId: 'prof_talitha', date: DAY, startTime: '09:30', endTime: '11:00' }]
    });
    expect(JSON.stringify(res.body)).not.toContain('Consulta médica');
  });
});
