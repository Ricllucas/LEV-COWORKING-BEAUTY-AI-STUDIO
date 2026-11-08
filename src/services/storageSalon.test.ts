import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoworkingSettings } from '../types';

// Site configurado para outro salão (não a LEV).
vi.mock('../config/salon', async importOriginal => ({
  ...(await importOriginal<typeof import('../config/salon')>()),
  CURRENT_SALON_ID: 'demo',
  isDefaultSalon: () => false,
  scopedStorageKey: (key: string) => `demo__${key}`
}));

vi.mock('./salonDataSync', () => ({
  SalonDataSync: { pull: vi.fn(async () => false), push: vi.fn(async () => undefined), removeBlock: vi.fn(async () => undefined) }
}));

import { StorageService } from './storage';

const memory = new Map<string, string>();

describe('StorageService em outro salão', () => {
  beforeEach(() => {
    memory.clear();
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => memory.get(key) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => { memory.set(key, String(value)); });
    vi.mocked(localStorage.removeItem).mockImplementation((key: string) => { memory.delete(key); });
  });

  it('começa sem profissionais, serviços, usuários ou avaliações da LEV', () => {
    expect(StorageService.getProfessionals()).toEqual([]);
    expect(StorageService.getServices()).toEqual([]);
    expect(StorageService.getUsers()).toEqual([]);
    expect(StorageService.getReviews()).toEqual([]);
    expect(StorageService.getSettings().name).toBe('');
  });

  it('não lê nem grava as chaves da LEV no aparelho', () => {
    memory.set('lev_coworking_services_v2', JSON.stringify([{ id: 'srv_eli_1' }]));
    StorageService.replaceServices([]);
    StorageService.getServices();
    StorageService.getProfessionals();
    StorageService.getSettings();
    expect(memory.get('lev_coworking_services_v2')).toBe(JSON.stringify([{ id: 'srv_eli_1' }]));
    expect(memory.has('demo__lev_coworking_services_v2')).toBe(true);
    const leaked = [...memory.keys()].filter(key => key !== 'lev_coworking_services_v2' && !key.startsWith('demo__'));
    expect(leaked).toEqual([]);
  });

  it('configurações gravadas do salão não são trocadas pelas da LEV', () => {
    const saved: CoworkingSettings = {
      ...StorageService.getSettings(),
      name: 'Studio Aurora',
      phone: '(11) 90000-0000',
      whatsapp: '5511900000000',
      businessHoursText: 'Seg a sex'
    };
    memory.set('demo__lev_coworking_settings_v1', JSON.stringify(saved));
    expect(StorageService.getSettings()).toEqual(saved);
  });
});
