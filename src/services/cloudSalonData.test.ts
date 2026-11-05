import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./staffSession', () => ({
  getFreshAccessToken: vi.fn(async () => 'token-da-sessao')
}));

import { getFreshAccessToken } from './staffSession';

type FetchCall = [string, RequestInit & { headers: Record<string, string> }];

const loadModule = async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'chave-publica');
  vi.resetModules();
  return import('./cloudSalonData');
};

const respond = (status: number, body: unknown = []) =>
  vi.fn(async () => new Response(status === 204 ? null : typeof body === 'string' ? body : JSON.stringify(body), { status }));

describe('CloudSalonData', () => {
  beforeEach(() => {
    vi.mocked(getFreshAccessToken).mockResolvedValue('token-da-sessao');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('list com role usa o token da sessão e filtra pelo salão', async () => {
    const { CloudSalonData } = await loadModule();
    const fetchMock = respond(200, [{ id: 'pay_1', professional_id: 'prof_x', payload: { valor: 10 } }]);
    vi.stubGlobal('fetch', fetchMock);
    const rows = await CloudSalonData.list<{ valor: number }>('payments', 'admin');
    const [url, init] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toContain('rest/v1/payments?');
    expect(url).toContain('salon_id=eq.lev');
    expect(init.headers.Authorization).toBe('Bearer token-da-sessao');
    expect(rows).toEqual([{ id: 'pay_1', professionalId: 'prof_x', payload: { valor: 10 } }]);
  });

  it('list sem role usa a chave pública', async () => {
    const { CloudSalonData } = await loadModule();
    const fetchMock = respond(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await CloudSalonData.list('professionals');
    const [url, init] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toContain('rest/v1/professionals?');
    expect(init.headers.Authorization).toBe('Bearer chave-publica');
  });

  it('upsert envia as linhas com salon_id e on_conflict', async () => {
    const { CloudSalonData } = await loadModule();
    const fetchMock = respond(201, '');
    vi.stubGlobal('fetch', fetchMock);
    await CloudSalonData.upsert('payments', [{ id: 'pay_1', professionalId: 'prof_x', payload: { valor: 10 } }], 'admin');
    const [url, init] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toContain('on_conflict=salon_id,id');
    expect(init.method).toBe('POST');
    expect(init.headers.Prefer).toBe('resolution=merge-duplicates,return=minimal');
    expect(JSON.parse(init.body as string)).toEqual([
      { id: 'pay_1', professional_id: 'prof_x', payload: { valor: 10 }, salon_id: 'lev', updated_at: expect.any(String) }
    ]);
  });

  it('upsert insertOnly ignora duplicadas e aceita 409 como sucesso', async () => {
    const { CloudSalonData } = await loadModule();
    const fetchMock = respond(409, '{"code":"23505"}');
    vi.stubGlobal('fetch', fetchMock);
    await expect(CloudSalonData.upsert('audit_logs', [{ id: 'a1', payload: {} }], 'admin', { insertOnly: true })).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toContain('on_conflict=salon_id,id');
    expect(init.headers.Prefer).toBe('resolution=ignore-duplicates,return=minimal');
  });

  it('409 sem insertOnly continua sendo erro', async () => {
    const { CloudSalonData } = await loadModule();
    vi.stubGlobal('fetch', respond(409, ''));
    await expect(CloudSalonData.upsert('payments', [{ id: 'p', payload: {} }], 'admin')).rejects.toThrow();
  });

  it('remove apaga por id e salão com o token da sessão', async () => {
    const { CloudSalonData } = await loadModule();
    const fetchMock = respond(204, '');
    vi.stubGlobal('fetch', fetchMock);
    await CloudSalonData.remove('waitlist', 'a b/1', 'profissional');
    const [url, init] = fetchMock.mock.calls[0] as unknown as FetchCall;
    expect(url).toContain('rest/v1/waitlist?id=eq.a%20b%2F1&salon_id=eq.lev');
    expect(init.method).toBe('DELETE');
    expect(init.headers.Authorization).toBe('Bearer token-da-sessao');
  });

  it('404 em qualquer método lança CloudTableMissingError', async () => {
    const { CloudSalonData, CloudTableMissingError } = await loadModule();
    vi.stubGlobal('fetch', respond(404, ''));
    await expect(CloudSalonData.list('payments', 'admin')).rejects.toBeInstanceOf(CloudTableMissingError);
    await expect(CloudSalonData.upsert('payments', [{ id: 'p', payload: {} }], 'admin')).rejects.toBeInstanceOf(CloudTableMissingError);
    await expect(CloudSalonData.remove('payments', 'p', 'admin')).rejects.toBeInstanceOf(CloudTableMissingError);
  });

  it('400 com código PGRST205 ou 42P01 lança CloudTableMissingError; outro 400 não', async () => {
    const { CloudSalonData, CloudTableMissingError } = await loadModule();
    for (const code of ['PGRST205', '42P01']) {
      vi.stubGlobal('fetch', respond(400, { code }));
      await expect(CloudSalonData.list('payments', 'admin')).rejects.toBeInstanceOf(CloudTableMissingError);
    }
    vi.stubGlobal('fetch', respond(400, { code: '22P02' }));
    const error = await CloudSalonData.list('payments', 'admin').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(CloudTableMissingError);
  });

  it('500 lança erro comum', async () => {
    const { CloudSalonData, CloudTableMissingError } = await loadModule();
    vi.stubGlobal('fetch', respond(500, 'boom'));
    const error = await CloudSalonData.list('payments', 'admin').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(CloudTableMissingError);
  });

  it('upsert com sessão expirada lança erro de sessão', async () => {
    const { CloudSalonData } = await loadModule();
    vi.mocked(getFreshAccessToken).mockResolvedValue(undefined);
    const fetchMock = respond(201, '');
    vi.stubGlobal('fetch', fetchMock);
    await expect(CloudSalonData.upsert('payments', [{ id: 'p', payload: {} }], 'admin')).rejects.toThrow(/Sua sessão expirou/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
