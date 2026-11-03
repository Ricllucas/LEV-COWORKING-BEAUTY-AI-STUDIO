import { describe, expect, it } from 'vitest';
import { BOOKING_SERVICES } from './bookingCatalog';
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
