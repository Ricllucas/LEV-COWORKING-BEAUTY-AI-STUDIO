import { describe, it, expect } from 'vitest';
import { getProfessionalWhatsApp, buildProfessionalWhatsAppLink } from './formatters';
describe('Contato direto da profissional', () => {
 it('substitui o contato legado da LEV pelo contato de cada responsável', () => {
  expect(getProfessionalWhatsApp('prof_elisangela', { whatsapp: '5541984979940' })).toBe('5541992461203');
  expect(getProfessionalWhatsApp('prof_talitha')).toBe('5541999983228');
  expect(getProfessionalWhatsApp('prof_nayara')).toBe('5541996556742');
 });
 it('respeita o contato individual atualizado', () => {
  expect(getProfessionalWhatsApp('prof_nayara', { whatsapp: '41912345678' })).toBe('41912345678');
 });
 it('não direciona profissionais sem contato ao número da LEV', () => {
  expect(buildProfessionalWhatsAppLink('nova', 'Olá', { whatsapp: '41984979940' })).toBeUndefined();
 });
});
