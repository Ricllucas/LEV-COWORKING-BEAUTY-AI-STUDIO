import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEV_BOOKING_SERVICES as BOOKING_SERVICES } from './levDefaults';
import { loadBookingServices } from './bookingCatalog';
import { INITIAL_SERVICES } from '../../src/data/initialData';

describe('catálogo do servidor x catálogo do site', () => {
  it('preço, duração e versão iguais para os serviços em comum', () => {
    const site = new Map(INITIAL_SERVICES.map(s => [s.id, s]));
    BOOKING_SERVICES.filter(s => site.has(s.id) && site.get(s.id)!.price !== undefined).forEach(server => {
      const s = site.get(server.id)!;
      expect({ id: server.id, price: server.price, duration: server.duration, version: server.catalogVersion || 0 })
        .toEqual({ id: s.id, price: s.price, duration: s.durationMinutes, version: server.catalogVersion ? s.catalogVersion : 0 });
    });
  });

  it('tabela nova da Nayara', () => {
    const along = BOOKING_SERVICES.find(s => s.id === 'srv_nay_1')!;
    const manut = BOOKING_SERVICES.find(s => s.id === 'srv_nay_2')!;
    expect([along.name, along.duration, along.price]).toEqual(['Aplicação de Alongamento', 120, 160]);
    expect([manut.duration, manut.price]).toEqual([120, 145]);
  });
});

describe('ajustes de 03/11/2026', () => {
  it('Combo e Henna da Elisangela retirados; Brow Lamination com a Talitha por R$ 130', async () => {
    const { RETIRED_SERVICE_IDS } = await import('../../src/data/retiredServices');
    const ids = new Set(BOOKING_SERVICES.map(s => s.id));
    expect(ids.has('srv_eli_8')).toBe(false);
    expect(ids.has('srv_1787094380315')).toBe(false);
    expect(RETIRED_SERVICE_IDS.has('srv_eli_8') && RETIRED_SERVICE_IDS.has('srv_1787094380315')).toBe(true);
    const brow = BOOKING_SERVICES.find(s => s.id === 'srv_tal_8')!;
    expect([brow.professionalId, brow.price]).toEqual(['prof_talitha', 130]);
    const site = INITIAL_SERVICES.find(s => s.id === 'srv_tal_8')!;
    expect([site.professionalId, site.price, site.catalogVersion]).toEqual(['prof_talitha', 130, brow.catalogVersion]);
  });
});

describe('serviços agendáveis lidos do banco por salão', () => {
  const answer = (status: number, body: unknown) => vi.fn(async (_input: string | URL) => new Response(JSON.stringify(body), { status }));
  const row = (id: string, professionalId: string, extra: Record<string, unknown> = {}) => ({
    id, deleted: false, payload: { name: `Serviço ${id}`, professionalId, professionalName: 'X', durationMinutes: 60, price: 100, ...extra }
  });
  const setup = (fetchMock: ReturnType<typeof answer>) => {
    process.env.SUPABASE_URL = 'https://exemplo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-teste';
    vi.stubGlobal('fetch', fetchMock);
  };
  afterEach(() => vi.unstubAllGlobals());

  it('LEV com o banco fora do ar → lista de fábrica, na mesma ordem', async () => {
    setup(answer(500, {}));
    expect((await loadBookingServices('lev')).map(s => s.id)).toEqual(BOOKING_SERVICES.map(s => s.id));
  });

  it('outro salão com o banco fora do ar → nenhum serviço (nunca os da LEV)', async () => {
    setup(answer(500, {}));
    expect(await loadBookingServices('demo')).toEqual([]);
  });

  it('outro salão: só os serviços do banco, sem apagados nem desativados', async () => {
    const fetchMock = answer(200, [row('srv_aurora_1', 'prof_aurora_ana'), { ...row('srv_aurora_2', 'prof_aurora_ana'), deleted: true }, row('srv_aurora_3', 'prof_aurora_bia', { onlineBookingEnabled: false })]);
    setup(fetchMock);
    const services = await loadBookingServices('demo');
    expect(services.map(s => [s.id, s.duration, s.price])).toEqual([['srv_aurora_1', 60, 100]]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('salon_id=eq.demo');
  });

  it('LEV: serviço novo do banco entra no fim; desativado no banco sai do menu', async () => {
    setup(answer(200, [row('srv_novo', 'prof_talitha'), row('srv_eli_1', 'prof_elisangela', { active: false })]));
    const ids = (await loadBookingServices('lev')).map(s => s.id);
    expect(ids).not.toContain('srv_eli_1');
    expect(ids.at(-1)).toBe('srv_novo');
    expect(ids).toContain('srv_tal_7');
  });
});
