import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publicSalonId, resetSalonHostCache, resolveSalonFromHost } from './salonFromRequest';

const rpcAnswer = (value: unknown) => vi.fn(async () => new Response(JSON.stringify(value), { status: 200 }));

const fakeRes = () => {
  const res = { statusCode: 0, body: undefined as unknown, status(code: number) { res.statusCode = code; return res; }, json(body: unknown) { res.body = body; return res; } };
  return res;
};

beforeEach(() => {
  resetSalonHostCache();
  vi.stubEnv('SUPABASE_URL', 'https://banco.exemplo');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'chave-servico');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('resolveSalonFromHost', () => {
  it('endereço da LEV não consulta o banco', async () => {
    const fetchMock = rpcAnswer('outro');
    vi.stubGlobal('fetch', fetchMock);
    await expect(resolveSalonFromHost('lev-coworking-beauty.vercel.app')).resolves.toBe('lev');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('domínio próprio pergunta ao banco sem o www', async () => {
    const fetchMock = rpcAnswer('demo');
    vi.stubGlobal('fetch', fetchMock);
    await expect(resolveSalonFromHost('www.salaobonito.com.br')).resolves.toBe('demo');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://banco.exemplo/rest/v1/rpc/salon_for_address');
    expect(JSON.parse(String(init.body))).toEqual({ p_slug: null, p_domain: 'salaobonito.com.br' });
  });

  it('endereço sem salão devolve null', async () => {
    vi.stubGlobal('fetch', rpcAnswer(null));
    await expect(resolveSalonFromHost('nao-existe.com')).resolves.toBeNull();
  });

  it('endereço inválido devolve null sem consultar o banco', async () => {
    const fetchMock = rpcAnswer('demo');
    vi.stubGlobal('fetch', fetchMock);
    await expect(resolveSalonFromHost('a b')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('guarda a resposta por um tempo', async () => {
    const fetchMock = rpcAnswer('demo');
    vi.stubGlobal('fetch', fetchMock);
    await resolveSalonFromHost('demo.localhost');
    await resolveSalonFromHost('demo.localhost');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('banco fora do ar vira erro 503 e não fica guardado', async () => {
    const failing = vi.fn(async () => { throw new Error('rede'); });
    vi.stubGlobal('fetch', failing);
    await expect(resolveSalonFromHost('demo.localhost')).rejects.toMatchObject({ status: 503 });
    vi.stubGlobal('fetch', rpcAnswer('demo'));
    await expect(resolveSalonFromHost('demo.localhost')).resolves.toBe('demo');
  });

  it('resposta de erro do banco também vira 503', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
    await expect(resolveSalonFromHost('demo.localhost')).rejects.toMatchObject({ status: 503 });
  });
});

describe('publicSalonId', () => {
  it('endereço desconhecido responde 404', async () => {
    vi.stubGlobal('fetch', rpcAnswer(null));
    const res = fakeRes();
    await expect(publicSalonId({ headers: { host: 'nao-existe.com' } }, res)).resolves.toBeNull();
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Salão não encontrado.' });
  });

  it('endereço conhecido devolve o salão', async () => {
    vi.stubGlobal('fetch', rpcAnswer('demo'));
    await expect(publicSalonId({ headers: { host: 'demo.localhost:3000' } }, fakeRes())).resolves.toBe('demo');
  });
});

describe('rota pública fica no salão do endereço', () => {
  it('pelo endereço do salão demo, cancelar procura só no demo', async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('/rpc/') ? 'demo' : []), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const cancel = (await import('../appointments/cancel')).default;
    const res = Object.assign(fakeRes(), { setHeader: vi.fn() });
    await cancel({
      method: 'POST',
      headers: { host: 'demo.localhost', 'content-type': 'application/json' },
      socket: { remoteAddress: '10.9.9.9' },
      body: { appointmentId: 'apt_da_lev', clientPhone: '41999990000' }
    }, res);
    const lookup = fetchMock.mock.calls.map(call => String(call[0])).find(url => url.includes('/rest/v1/appointments'));
    expect(lookup).toContain('salon_id=eq.demo');
    expect(res.statusCode).toBe(404);
  });

  it('endereço desconhecido não consulta agendamentos', async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response('null', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const availability = (await import('../appointments/availability')).default;
    const res = Object.assign(fakeRes(), { setHeader: vi.fn() });
    await availability({ method: 'GET', query: { date: '2099-01-12' }, headers: { host: 'nao-existe.com' }, socket: { remoteAddress: '10.9.9.8' } }, res);
    expect(res.statusCode).toBe(404);
    expect(fetchMock.mock.calls.every(call => String(call[0]).includes('/rpc/'))).toBe(true);
  });
});
