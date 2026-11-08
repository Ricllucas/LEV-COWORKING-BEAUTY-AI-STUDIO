import { describe, expect, it } from 'vitest';
import { bundledDataFor } from './salonDefaults';
import { INITIAL_PROFESSIONALS, INITIAL_SERVICES, INITIAL_SETTINGS } from './initialData';
import { RETIRED_SERVICE_IDS } from './retiredServices';

describe('bundledDataFor', () => {
  it('salão novo começa vazio, com configurações neutras', () => {
    const data = bundledDataFor('demo');
    expect(data.professionals).toEqual([]);
    expect(data.services).toEqual([]);
    expect(data.settings.name).toBe('');
    expect(data.settings.phone).toBe('');
    expect(data.settings.whatsapp).toBe('');
    expect(data.settings.depositPercentage).toBe(30);
  });

  it('LEV continua com os dados de fábrica de hoje', () => {
    const data = bundledDataFor('lev');
    expect(data.professionals.length).toBe(3);
    expect(data.professionals).toBe(INITIAL_PROFESSIONALS);
    expect(data.settings).toBe(INITIAL_SETTINGS);
    expect(data.services).toEqual(INITIAL_SERVICES.filter(service => !RETIRED_SERVICE_IDS.has(service.id)));
  });

  it('cada chamada de outro salão devolve listas novas (sem estado compartilhado)', () => {
    const a = bundledDataFor('demo');
    a.services.push(INITIAL_SERVICES[0]);
    expect(bundledDataFor('demo').services).toEqual([]);
  });
});
