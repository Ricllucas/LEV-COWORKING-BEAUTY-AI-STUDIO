import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Service } from '../types';

// Site configurado para outro salão (não a LEV).
vi.mock('../config/salon', async importOriginal => ({
  ...(await importOriginal<typeof import('../config/salon')>()),
  CURRENT_SALON_ID: 'demo',
  isDefaultSalon: () => false
}));

const aurora: Service = {
  id: 'srv_aurora_1',
  professionalId: 'prof_aurora_ana',
  professionalName: 'Ana',
  name: 'Corte',
  category: 'Produções',
  description: 'Corte feminino',
  durationMinutes: 60,
  bufferAfterMinutes: 0,
  price: 80,
  depositRequired: false,
  depositValue: 0,
  color: '#000000',
  active: true,
  onlineBookingEnabled: true,
  minNoticeHours: 0,
  maxCancellationNoticeHours: 24
};

let CloudServiceCatalog: typeof import('./cloudServiceCatalog').CloudServiceCatalog;

beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://exemplo.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'chave-publica');
  vi.resetModules();
  ({ CloudServiceCatalog } = await import('./cloudServiceCatalog'));
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('CloudServiceCatalog em outro salão', () => {
  it('load: só os serviços do salão vindos da nuvem, nenhum da LEV', async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify([
      { id: 'srv_aurora_1', professional_id: 'prof_aurora_ana', payload: aurora, deleted: false }
    ]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const services = await CloudServiceCatalog.load();

    expect(services.map(service => service.id)).toEqual(['srv_aurora_1']);
    expect(String(fetchMock.mock.calls[0][0])).toContain('salon_id=eq.demo');
  });

  it('upsert usa a chave (salon_id, id) e grava o salão', async () => {
    sessionStorage.setItem('lev_admin_session_v1', JSON.stringify({ accessToken: 'token-admin' }));
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await CloudServiceCatalog.save(aurora, 'admin');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://exemplo.supabase.co/rest/v1/catalog_services?on_conflict=salon_id,id');
    const body = JSON.parse(String(init?.body)) as { id: string; salon_id: string }[];
    expect(body).toEqual([expect.objectContaining({ id: 'srv_aurora_1', salon_id: 'demo' })]);
  });

  it('syncAll não marca serviços da LEV como apagados no outro salão', async () => {
    sessionStorage.setItem('lev_admin_session_v1', JSON.stringify({ accessToken: 'token-admin' }));
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await CloudServiceCatalog.syncAll([aurora], 'admin');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { id: string }[];
    expect(body.map(row => row.id)).toEqual(['srv_aurora_1']);
  });
});
