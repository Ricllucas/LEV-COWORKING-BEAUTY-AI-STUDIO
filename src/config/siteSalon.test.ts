import { describe, expect, it, vi } from 'vitest';
import { resolveSiteSalon } from './siteSalon';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return { getItem: vi.fn((key: string) => data.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { data.set(key, value); }) };
};
const rpc = (value: unknown) => vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(value), { status: 200 }));

describe('resolveSiteSalon', () => {
  it('endereço da LEV abre a LEV sem consultar o banco', async () => {
    const fetchImpl = rpc('outro');
    await expect(resolveSiteSalon('lev-coworking-beauty.vercel.app', { fetchImpl, storage: memoryStorage() }))
      .resolves.toEqual({ status: 'ok', salonId: 'lev' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('localhost usa VITE_SALON_ID quando é válido', async () => {
    await expect(resolveSiteSalon('localhost:3000', { fetchImpl: rpc(null), storage: memoryStorage(), envSalonId: 'demo' }))
      .resolves.toEqual({ status: 'ok', salonId: 'demo' });
    await expect(resolveSiteSalon('localhost:3000', { fetchImpl: rpc(null), storage: memoryStorage(), envSalonId: 'X!' }))
      .resolves.toEqual({ status: 'ok', salonId: 'lev' });
  });

  it('subdomínio pergunta ao banco e guarda a resposta', async () => {
    const fetchImpl = rpc('demo');
    const storage = memoryStorage();
    await expect(resolveSiteSalon('demo.localhost:3000', { fetchImpl, storage }))
      .resolves.toEqual({ status: 'ok', salonId: 'demo' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/salon_for_address');
    expect(JSON.parse(String(init?.body))).toEqual({ p_slug: 'demo', p_domain: null });
    expect(storage.setItem).toHaveBeenCalledWith('lev_salon_for_host:demo.localhost', 'demo');
  });

  it('banco sem salão para o endereço → não encontrado', async () => {
    await expect(resolveSiteSalon('nao-existe.com', { fetchImpl: rpc(null), storage: memoryStorage() }))
      .resolves.toEqual({ status: 'not_found' });
  });

  it('endereço inválido → não encontrado', async () => {
    await expect(resolveSiteSalon('Salao_X.com', { fetchImpl: rpc('demo'), storage: memoryStorage() }))
      .resolves.toEqual({ status: 'not_found' });
  });

  it('sem internet usa o último salão conhecido do endereço', async () => {
    const failing = vi.fn(async () => { throw new Error('rede'); });
    await expect(resolveSiteSalon('demo.localhost', { fetchImpl: failing, storage: memoryStorage({ 'lev_salon_for_host:demo.localhost': 'demo' }) }))
      .resolves.toEqual({ status: 'ok', salonId: 'demo' });
    await expect(resolveSiteSalon('demo.localhost', { fetchImpl: failing, storage: memoryStorage() }))
      .resolves.toEqual({ status: 'offline' });
  });

  it('resposta de erro do banco também usa o último salão conhecido', async () => {
    const failing = vi.fn(async () => new Response('{}', { status: 500 }));
    await expect(resolveSiteSalon('demo.localhost', { fetchImpl: failing, storage: memoryStorage() }))
      .resolves.toEqual({ status: 'offline' });
  });
});
