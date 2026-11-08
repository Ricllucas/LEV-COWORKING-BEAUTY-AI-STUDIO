import { afterEach, describe, expect, it, vi } from 'vitest';
import { Professional } from '../types';

const salon = vi.hoisted(() => ({ id: 'lev' }));
vi.mock('../config/salon', async importOriginal => {
  const original = await importOriginal<typeof import('../config/salon')>();
  return {
    ...original,
    get CURRENT_SALON_ID() { return salon.id; },
    isDefaultSalon: () => salon.id === 'lev'
  };
});

import { agendaColorFor, agendaToneFor, FALLBACK_PALETTE } from './professionalColors';

const prof = (id: string, color: string) => ({ id, color } as Professional);

describe('agendaColorFor', () => {
  afterEach(() => { salon.id = 'lev'; });

  it('LEV mantém a cor de hoje de cada profissional na agenda', () => {
    expect(agendaColorFor(prof('prof_elisangela', '#D4AF37'), 0)).toBe('#d8c7a4');
    expect(agendaColorFor(prof('prof_talitha', '#B8860B'), 1)).toBe('#b59662');
    expect(agendaColorFor(prof('prof_nayara', '#996515'), 2)).toBe('#a98d7a');
  });

  it('outro salão usa a cor cadastrada da profissional quando é hex', () => {
    salon.id = 'demo';
    expect(agendaColorFor(prof('prof_aurora_ana', '#2F6F73'), 0)).toBe('#2F6F73');
  });

  it('cor que não é hex cai na paleta reserva pela posição', () => {
    salon.id = 'demo';
    expect(agendaColorFor(prof('prof_aurora_ana', 'gold'), 7)).toBe(FALLBACK_PALETTE[1]);
    expect(FALLBACK_PALETTE).toHaveLength(6);
  });

  it('id da LEV em outro salão não herda a cor da LEV', () => {
    salon.id = 'demo';
    expect(agendaColorFor(prof('prof_elisangela', '#123456'), 0)).toBe('#123456');
  });
});

describe('agendaToneFor', () => {
  afterEach(() => { salon.id = 'lev'; });

  it('LEV mantém os tons exatos dos cartões da agenda', () => {
    expect(agendaToneFor(prof('prof_elisangela', '#D4AF37'), 0)).toEqual({
      borderColor: 'rgba(216, 199, 164, 0.8)',
      backgroundColor: 'rgba(58, 50, 38, 0.95)',
      color: '#f8f1e4'
    });
    expect(agendaToneFor(prof('prof_nayara', '#996515'), 2).backgroundColor).toBe('rgba(52, 41, 35, 0.95)');
  });

  it('outro salão deriva o tom da cor da profissional', () => {
    salon.id = 'demo';
    const tone = agendaToneFor(prof('prof_aurora_ana', '#2F6F73'), 0);
    expect(tone.borderColor).toBe('rgba(47, 111, 115, 0.8)');
    expect(tone.backgroundColor).toMatch(/^rgba\(\d+, \d+, \d+, 0\.95\)$/);
    expect(tone.color).toBe('#f7f0e5');
  });

  it('profissional sem cor conhecida mantém o tom reserva de antes', () => {
    expect(agendaToneFor(prof('prof_nova', ''), 0)).toEqual({
      borderColor: 'rgba(196, 180, 145, 0.8)',
      backgroundColor: 'rgba(51, 45, 36, 0.95)',
      color: '#f7f0e5'
    });
  });
});
