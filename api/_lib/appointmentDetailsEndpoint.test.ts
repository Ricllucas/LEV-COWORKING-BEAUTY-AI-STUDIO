import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Rota /api/calendar/appointment: edição do lançamento (pagamento, data, horário).
// A tabela appointments tem as colunas appointment_date e start_time — não existe
// coluna "date". Gravar "date" fazia o banco recusar (PGRST204) e o pagamento
// lançado na agenda nunca chegava ao atendimento na nuvem.

vi.mock('./googleCalendar.js', () => ({ syncGoogleCalendarEvent: vi.fn().mockResolvedValue({}) }));
vi.mock('./staffAuth.js', () => ({
  authenticateStaff: vi.fn().mockResolvedValue({ role: 'admin', salonId: 'lev', professionalId: undefined })
}));

const APPOINTMENTS_COLUMNS = new Set(['id', 'professional_id', 'appointment_date', 'start_time', 'status', 'payload', 'updated_at', 'reminders_sent', 'salon_id', 'created_at']);

const storedRow = {
  id: 'apt_teste',
  professional_id: 'prof_elisangela',
  payload: {
    id: 'apt_teste', professionalId: 'prof_elisangela', date: '2026-11-07', startTime: '12:30', endTime: '13:10',
    totalPrice: 35, remainingPrice: 35, depositPaid: 0, paymentStatus: 'pendente', status: 'confirmado', totalDurationMinutes: 40
  }
};

const makeRes = () => {
  const res: any = { headers: {} as Record<string, string>, statusCode: 0, body: undefined };
  res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: unknown) => { res.body = body; return res; };
  return res;
};

describe('rota de edição do lançamento', () => {
  let handler: (req: any, res: any) => Promise<unknown>;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://db.exemplo';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (_url: string, init?: { method?: string; body?: string }) => {
      if (init?.method === 'PATCH') {
        const unknown = Object.keys(JSON.parse(init.body || '{}')).filter(col => !APPOINTMENTS_COLUMNS.has(col));
        if (unknown.length) return { ok: false, status: 400, json: async () => ({ code: 'PGRST204' }) };
        return { ok: true, status: 204, json: async () => ({}) };
      }
      return { ok: true, status: 200, json: async () => [structuredClone(storedRow)] };
    });
    handler = (await import('../calendar/appointment')).default;
  });
  afterEach(() => vi.unstubAllGlobals());

  const post = async (body: unknown) => {
    const res = makeRes();
    await handler({ method: 'POST', body, headers: { 'content-type': 'application/json', authorization: 'Bearer x' }, socket: {} }, res);
    return res;
  };

  it('pagamento lançado grava só colunas que existem e chega ao atendimento', async () => {
    const res = await post({
      appointmentId: 'apt_teste',
      changes: { depositPaid: 35, remainingPrice: 0, paymentStatus: 'pago', paymentMethod: 'pix', paymentDate: '2026-11-07 21:23' }
    });
    expect(res.statusCode).toBe(200);
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    const body = JSON.parse(patch[1].body);
    expect(body).not.toHaveProperty('date');
    expect(body.payload).toMatchObject({ paymentStatus: 'pago', depositPaid: 35, remainingPrice: 0, paymentMethod: 'pix' });
  });

  it('mudar data e horário atualiza também as colunas usadas nas buscas', async () => {
    const res = await post({ appointmentId: 'apt_teste', changes: { date: '2026-11-10', startTime: '14:00', endTime: '14:40' } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')![1].body);
    expect(body.appointment_date).toBe('2026-11-10');
    expect(body.start_time).toBe('14:00');
  });
});
