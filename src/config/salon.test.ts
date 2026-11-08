import { afterEach, describe, expect, it, vi } from 'vitest';
import { scopedStorageKey } from './salon';

describe('scopedStorageKey', () => {
  it('na LEV a chave do aparelho continua a mesma', () => {
    expect(scopedStorageKey('lev_coworking_services_v1', 'lev')).toBe('lev_coworking_services_v1');
  });

  it('em outro salão a chave ganha o id do salão na frente', () => {
    expect(scopedStorageKey('lev_coworking_services_v1', 'demo')).toBe('demo__lev_coworking_services_v1');
  });

  it('sem salão informado usa o salão deste site (LEV por padrão)', () => {
    expect(scopedStorageKey('lev_coworking_services_v1')).toBe('lev_coworking_services_v1');
  });
});

describe('CURRENT_SALON_ID', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async (value: string) => {
    vi.stubEnv('VITE_SALON_ID', value);
    vi.resetModules();
    return import('./salon');
  };

  it('usa VITE_SALON_ID quando o formato é válido', async () => {
    const salon = await load('demo');
    expect(salon.CURRENT_SALON_ID).toBe('demo');
    expect(salon.isDefaultSalon()).toBe(false);
    expect(salon.scopedStorageKey('lev_coworking_users_v1')).toBe('demo__lev_coworking_users_v1');
  });

  it('valor inválido não derruba o site: volta para a LEV', async () => {
    const salon = await load('Salão Inválido!');
    expect(salon.CURRENT_SALON_ID).toBe('lev');
    expect(salon.isDefaultSalon()).toBe(true);
  });

  it('sem variável é a LEV', async () => {
    const salon = await load('');
    expect(salon.CURRENT_SALON_ID).toBe('lev');
    expect(salon.isDefaultSalon()).toBe(true);
  });
});
