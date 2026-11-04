import { beforeEach, describe, expect, it } from 'vitest';
import { StorageService } from './storage';
import { INITIAL_PROFESSIONALS } from '../data/initialData';

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => Array.from(data.keys())[index] ?? null,
    removeItem: key => { data.delete(key); },
    setItem: (key, value) => { data.set(key, String(value)); }
  };
};

const PROFESSIONALS_KEY = 'lev_coworking_professionals_v10';
const avatarOf = (id: string) => StorageService.getProfessionals().find(p => p.id === id)?.avatarUrl;

describe('fotos oficiais das profissionais', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage(), configurable: true, writable: true });
  });

  it('aparelho com foto antiga trocada pelo painel passa a mostrar a foto oficial nova', () => {
    const stored = INITIAL_PROFESSIONALS.map(p => p.id === 'prof_nayara'
      ? { ...p, avatarUrl: 'data:image/jpeg;base64,FOTO_ANTIGA' }
      : p.id === 'prof_elisangela' ? { ...p, avatarUrl: 'https://exemplo.com/antiga.jpg' } : p);
    localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(stored));

    expect(avatarOf('prof_nayara')).toBe('/profiles/nayara-2026.webp');
    expect(avatarOf('prof_elisangela')).toBe('/profiles/elisangela-2026.webp');
  });

  it('depois da troca, uma foto escolhida pelo painel volta a ser respeitada', () => {
    StorageService.getProfessionals();
    const nayara = StorageService.getProfessionals().find(p => p.id === 'prof_nayara')!;
    StorageService.saveProfessional({ ...nayara, avatarUrl: 'data:image/jpeg;base64,NOVA_ESCOLHIDA' });
    expect(avatarOf('prof_nayara')).toBe('data:image/jpeg;base64,NOVA_ESCOLHIDA');
  });
});
