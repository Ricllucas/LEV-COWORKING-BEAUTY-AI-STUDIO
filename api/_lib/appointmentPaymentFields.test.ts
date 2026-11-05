import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parsePaymentFields } from './appointmentPaymentFields';

vi.mock('./googleCalendar.js', () => ({ syncGoogleCalendarEvent: vi.fn().mockResolvedValue({}) }));
vi.mock('./staffAuth.js', () => ({
  authenticateStaff: vi.fn(async () => ({ userId: 'u_admin', role: 'admin', salonId: 'lev' }))
}));

type TestResponse = {
  headers: Record<string, string>;
  statusCode: number;
  body: { error?: string; appointment?: Record<string, unknown> } | undefined;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => TestResponse;
  json: (body: TestResponse['body']) => TestResponse;
};

const makeRes = (): TestResponse => {
  const res: TestResponse = {
    headers: {},
    statusCode: 0,
    body: undefined,
    setHeader: (key, value) => { res.headers[key] = value; },
    status: code => { res.statusCode = code; return res; },
    json: body => { res.body = body; return res; }
  };
  return res;
};

const storedRow = {
  id: 'apt_1',
  professional_id: 'prof_x',
  payload: { id: 'apt_1', clientName: 'Ana', date: '2099-01-10', startTime: '10:00', endTime: '11:00', totalPrice: 100, remainingPrice: 100, depositPaid: 0, paymentStatus: 'pendente' }
};

describe('parsePaymentFields', () => {
  it('aceita os campos de pagamento válidos', () => {
    expect(parsePaymentFields({ depositPaid: 30, paymentStatus: 'parcial', paymentMethod: 'pix', paymentDate: '2026-11-04' }))
      .toEqual({ fields: { depositPaid: 30, paymentStatus: 'parcial', paymentMethod: 'pix', paymentDate: '2026-11-04' } });
  });

  it('sem campos de pagamento → nada muda', () => {
    expect(parsePaymentFields({ clientName: 'Ana' })).toEqual({ fields: {} });
    expect(parsePaymentFields(undefined)).toEqual({ fields: {} });
  });

  it('status ou forma de pagamento fora da lista → erro', () => {
    expect(parsePaymentFields({ paymentStatus: 'qualquer' }).error).toBe('Status de pagamento inválido.');
    expect(parsePaymentFields({ paymentMethod: 'cheque' }).error).toBe('Forma de pagamento inválida.');
  });

  it('valor negativo, não numérico ou data longa demais são ignorados', () => {
    expect(parsePaymentFields({ depositPaid: -5, paymentDate: 'x'.repeat(21) })).toEqual({ fields: {} });
    expect(parsePaymentFields({ depositPaid: Number.NaN })).toEqual({ fields: {} });
    expect(parsePaymentFields({ depositPaid: '10' })).toEqual({ fields: {} });
  });
});

describe('rota /api/calendar/appointment: campos de pagamento', () => {
  const fetchMock = vi.fn();
  let handler: (req: unknown, res: TestResponse) => Promise<unknown>;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://db.exemplo';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    handler = (await import('../calendar/appointment')).default;
  });
  afterEach(() => vi.unstubAllGlobals());

  const post = (changes: Record<string, unknown>) => ({
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
    body: { appointmentId: 'apt_1', changes }
  });

  it("updateDetails com paymentStatus 'pago' grava os campos de pagamento", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [storedRow] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const res = makeRes();
    await handler(post({ depositPaid: 100, remainingPrice: 0, paymentStatus: 'pago', paymentMethod: 'pix', paymentDate: '2026-11-04' }), res);

    expect(res.statusCode).toBe(200);
    const [url, init] = fetchMock.mock.calls[1] as [string, { method: string; body: string }];
    expect(init.method).toBe('PATCH');
    expect(url).toContain('salon_id=eq.lev');
    const saved = JSON.parse(init.body) as { payload: Record<string, unknown> };
    expect(saved.payload).toMatchObject({ depositPaid: 100, remainingPrice: 0, paymentStatus: 'pago', paymentMethod: 'pix', paymentDate: '2026-11-04' });
  });

  it("paymentStatus 'qualquer' → 400 sem gravar", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [storedRow] });
    const res = makeRes();
    await handler(post({ paymentStatus: 'qualquer' }), res);

    expect(res.statusCode).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("paymentMethod inválido → 400 sem gravar", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [storedRow] });
    const res = makeRes();
    await handler(post({ paymentMethod: 'cheque' }), res);

    expect(res.statusCode).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
