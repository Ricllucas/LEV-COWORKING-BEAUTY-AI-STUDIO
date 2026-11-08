import { afterEach, describe, expect, it, vi } from 'vitest';

const salon = vi.hoisted(() => ({ id: 'lev' }));
vi.mock('../config/salon', async importOriginal => {
  const original = await importOriginal<typeof import('../config/salon')>();
  return {
    ...original,
    get CURRENT_SALON_ID() { return salon.id; },
    isDefaultSalon: () => salon.id === 'lev'
  };
});

import { contactSalonName, salonNames } from './salonNames';
import { bundledDataFor } from '../data/salonDefaults';
import type { CoworkingSettings } from '../types';

const other = (overrides: Partial<CoworkingSettings>): CoworkingSettings => ({ ...bundledDataFor('demo').settings, ...overrides });

describe('salonNames', () => {
  afterEach(() => { salon.id = 'lev'; });

  it('LEV: nomes como as mensagens já escreviam', () => {
    const lev = bundledDataFor('lev').settings;
    expect(salonNames(lev)).toEqual({ name: 'LEV Coworking Beauty', shortName: 'LEV' });
    expect(contactSalonName(lev)).toBe('LEV COWORKING BEAUTY');
    // Mesmo com o nome mudado no painel, o texto às clientes não muda
    expect(salonNames({ ...lev, name: 'Outro nome' }).name).toBe('LEV Coworking Beauty');
  });

  it('outro salão: nome do cadastro e nome curto da marca', () => {
    salon.id = 'demo';
    expect(salonNames(other({ name: 'Studio Aurora', brand: { shortName: 'Aurora' } }))).toEqual({ name: 'Studio Aurora', shortName: 'Aurora' });
    expect(salonNames(other({ name: 'Studio Aurora' }))).toEqual({ name: 'Studio Aurora', shortName: 'Studio Aurora' });
    expect(contactSalonName(other({ name: 'Studio Aurora' }))).toBe('Studio Aurora');
  });

  it('nome curto da marca vale também para a LEV', () => {
    expect(salonNames({ ...bundledDataFor('lev').settings, brand: { shortName: 'Lev' } }).shortName).toBe('Lev');
  });
});
