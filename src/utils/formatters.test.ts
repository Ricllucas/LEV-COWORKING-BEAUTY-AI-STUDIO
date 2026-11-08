import { afterEach, describe, it, expect, vi } from 'vitest';

const salon = vi.hoisted(() => ({ id: 'lev' }));
vi.mock('../config/salon', async importOriginal => {
  const original = await importOriginal<typeof import('../config/salon')>();
  return {
    ...original,
    get CURRENT_SALON_ID() { return salon.id; },
    isDefaultSalon: () => salon.id === 'lev'
  };
});

import {
  getProfessionalWhatsApp,
  formatCurrency,
  formatDateBR,
  getDayOfWeekName,
  formatPhone,
  buildWhatsAppLink,
  generateWhatsAppMessage,
} from './formatters';

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(100)).toMatch(/R\$\s*100,00/);
    expect(formatCurrency(1500.5)).toMatch(/R\$\s*1\.500,50/);
  });

  it('should handle zero values', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
  });

  it('should handle NaN', () => {
    expect(formatCurrency(NaN)).toBe('R$ 0,00');
  });

  it('should handle negative values', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('-');
  });

  it('should handle large values', () => {
    expect(formatCurrency(1000000)).toMatch(/R\$\s*1\.000\.000,00/);
  });
});

describe('formatDateBR', () => {
  it('should format YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDateBR('2026-08-01')).toBe('01/08/2026');
    expect(formatDateBR('2025-12-25')).toBe('25/12/2025');
  });

  it('should handle empty strings', () => {
    expect(formatDateBR('')).toBe('');
  });

  it('should handle invalid format', () => {
    expect(formatDateBR('01/08/2026')).toBe('01/08/2026');
  });
});

describe('getDayOfWeekName', () => {
  it('should return correct day names', () => {
    expect(getDayOfWeekName('2026-08-01')).toBe('Sábado'); // 01/08/2026 is Saturday
    expect(getDayOfWeekName('2026-08-02')).toBe('Domingo'); // 02/08/2026 is Sunday
    expect(getDayOfWeekName('2026-08-03')).toBe('Segunda-feira'); // 03/08/2026 is Monday
  });

  it('should handle empty strings', () => {
    expect(getDayOfWeekName('')).toBe('');
  });
});

describe('formatPhone', () => {
  it('should format 11-digit phone numbers', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('41984979940')).toBe('(41) 98497-9940');
  });

  it('should handle numbers with special chars', () => {
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
  });

  it('should handle empty strings', () => {
    expect(formatPhone('')).toBe('');
  });

  it('should not format non-11-digit numbers', () => {
    expect(formatPhone('1234567')).toBe('1234567');
  });
});

describe('buildWhatsAppLink', () => {
  it('should build correct WhatsApp link', () => {
    const link = buildWhatsAppLink('11987654321', 'Olá!');
    expect(link).toContain('https://wa.me/5511987654321');
    expect(link).toContain('text=');
  });

  it('should add country code if missing', () => {
    const link = buildWhatsAppLink('11987654321', 'Test');
    expect(link).toContain('5511987654321');
  });

  it('should handle phone with country code already', () => {
    const link = buildWhatsAppLink('5511987654321', 'Test');
    expect(link).toContain('5511987654321');
  });

  it('should encode message text', () => {
    const link = buildWhatsAppLink('11987654321', 'Olá mundo!');
    expect(link).toContain('wa.me');
    expect(link).toMatch(/text=[^&]*ol/i);
  });
});

describe('generateWhatsAppMessage', () => {
  const mockData = {
    clientName: 'Maria Silva',
    professionalName: 'Elisangela',
    serviceName: 'Manicure',
    date: '2026-08-15',
    time: '14:00',
    coworkingName: 'LEV COWORKING BEAUTY',
  };

  it('should generate confirmation message', () => {
    const msg = generateWhatsAppMessage('confirmacao', mockData);
    expect(msg).toContain('Maria Silva');
    expect(msg).toContain('Elisangela');
    expect(msg).toContain('15/08/2026');
    expect(msg).toContain('14:00');
  });

  it('should generate reminder message', () => {
    const msg = generateWhatsAppMessage('lembrete', mockData);
    expect(msg).toContain('Maria Silva');
    expect(msg).toContain('amanhã');
  });

  it('should generate payment confirmation message', () => {
    const msg = generateWhatsAppMessage('confirmacao_pagamento', mockData);
    expect(msg).toContain('100% confirmado');
  });

  it('should generate rescheduling message', () => {
    const msg = generateWhatsAppMessage('reagendamento', mockData);
    expect(msg).toContain('foi alterado');
  });

  it('should generate cancellation message', () => {
    const msg = generateWhatsAppMessage('cancelamento', mockData);
    expect(msg).toContain('cancelamento');
  });

  it('should use default coworking name if not provided', () => {
    const dataWithoutCoworking = { ...mockData, coworkingName: undefined };
    const msg = generateWhatsAppMessage('confirmacao', dataWithoutCoworking);
    expect(msg).toContain('LEV COWORKING BEAUTY');
  });

  it('should handle deposit value formatting', () => {
    const msgData = { ...mockData, depositValue: 100, pixKey: '123abc' };
    const msg = generateWhatsAppMessage('solicitacao_sinal', msgData);
    expect(msg).toContain('100');
    expect(msg).toContain('123abc');
    expect(msg).toContain('sinal');
  });

  it('should handle default case', () => {
    const msg = generateWhatsAppMessage('unknown_type', mockData);
    expect(msg).toContain('Maria Silva');
  });
});

describe('getProfessionalWhatsApp por salão', () => {
  afterEach(() => { salon.id = 'lev'; });

  it('outro salão sem contato cadastrado não recebe número da LEV', () => {
    salon.id = 'demo';
    expect(getProfessionalWhatsApp('prof_aurora_ana', {})).toBe('');
    expect(getProfessionalWhatsApp('prof_nayara', {})).toBe('');
  });

  it('LEV continua com o número de cada profissional', () => {
    expect(getProfessionalWhatsApp('prof_nayara', {})).toBe('5541996556742');
  });

  it('ignora o número geral do salão informado', () => {
    salon.id = 'demo';
    expect(getProfessionalWhatsApp('prof_aurora_ana', { whatsapp: '5511999990000' }, '5511999990000')).toBe('');
    expect(getProfessionalWhatsApp('prof_aurora_ana', { whatsapp: '11999990000', phone: '11988887777' }, '5511999990000')).toBe('11988887777');
  });

  it('LEV ignora o número geral da LEV por padrão', () => {
    expect(getProfessionalWhatsApp('prof_elisangela', { whatsapp: '41984979940' })).toBe('5541992461203');
  });
});
