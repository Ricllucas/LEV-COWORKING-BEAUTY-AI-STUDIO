import { describe, it, expect } from 'vitest';
import { DEFAULT_SALON_ID, assertSalonId, salonFilter, withSalon } from './tenant';

describe('assertSalonId', () => {
  it('aceita ids validos', () => {
    expect(assertSalonId('lev')).toBe('lev');
    expect(assertSalonId('salao-da-ana')).toBe('salao-da-ana');
  });

  it('rejeita ids invalidos', () => {
    expect(() => assertSalonId('LEV')).toThrow('salon_id inválido');
    expect(() => assertSalonId('a')).toThrow('salon_id inválido');
    expect(() => assertSalonId('lev;drop')).toThrow('salon_id inválido');
    expect(() => assertSalonId('')).toThrow('salon_id inválido');
    expect(() => assertSalonId('a'.repeat(41))).toThrow('salon_id inválido');
  });
});

describe('salonFilter', () => {
  it('monta o filtro', () => {
    expect(salonFilter('lev')).toBe('salon_id=eq.lev');
  });
  it('valida antes de montar', () => {
    expect(() => salonFilter('lev&x=1')).toThrow('salon_id inválido');
  });
});

describe('withSalon', () => {
  it('adiciona o salon_id', () => {
    expect(withSalon({ a: 1 }, 'lev')).toEqual({ a: 1, salon_id: 'lev' });
  });
  it('o servidor sempre ganha e nao altera a entrada', () => {
    const input = { salon_id: 'x' };
    expect(withSalon(input, 'lev').salon_id).toBe('lev');
    expect(input.salon_id).toBe('x');
  });
  it('valida o id', () => {
    expect(() => withSalon({}, 'LEV')).toThrow('salon_id inválido');
  });
  it('DEFAULT_SALON_ID e lev', () => {
    expect(DEFAULT_SALON_ID).toBe('lev');
  });
});
