import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./googleCalendar.js', () => ({ syncGoogleCalendarEvent: vi.fn().mockResolvedValue({}) }));

const row = (status: string) => ({
  id: 'apt_teste', status,
  payload: { clientName: 'Ana Paula Souza', professionalName: 'Elisangela', serviceNames: ['Esmaltação em Gel'], date: '2099-01-10', startTime: '10:00', endTime: '11:00' }
});

const makeRes = () => {
  const res: any = { headers: {} as Record<string, string>, statusCode: 0, body: undefined };
  res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: unknown) => { res.body = body; return res; };
  return res;
};

describe('endpoint de confirmação pelo link', () => {
  let token = '';
  let handler: (req: any, res: any) => Promise<unknown>;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://db.exemplo';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    const link = await import('./confirmLink');
    token = link.createConfirmToken('apt_teste', link.appointmentStartEpoch('2099-01-10', '10:00'))!;
    handler = (await import('../whatsapp/appointment')).default;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('abrir o link (GET) só mostra o resumo, sem alterar nada', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [row('aguardando_confirmacao')] });
    const res = makeRes();
    await handler({ method: 'GET', query: { t: token }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.clientFirstName).toBe('Ana');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toContain('salon_id=eq.lev');
  });

  it('o botão (POST) confirma apenas se ainda estiver pendente', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [row('aguardando_confirmacao')] })
      .mockResolvedValueOnce({ ok: true, json: async () => [row('confirmado')] });
    const res = makeRes();
    await handler({ method: 'POST', body: { t: token }, headers: { 'content-type': 'application/json' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.confirmed).toBe(true);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toContain('status=eq.aguardando_confirmacao');
    expect(url).toContain('salon_id=eq.lev');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body).status).toBe('confirmado');
  });

  it('não reabre horário cancelado', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [row('cancelado_cliente')] });
    const res = makeRes();
    await handler({ method: 'POST', body: { t: token }, headers: { 'content-type': 'application/json' } }, res);
    expect(res.statusCode).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('recusa link falso sem consultar o banco', async () => {
    const res = makeRes();
    await handler({ method: 'POST', body: { t: 'apt_teste.4070000000.falso' }, headers: { 'content-type': 'application/json' } }, res);
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
