import { describe, expect, it } from 'vitest';
import { Professional } from '../types';
import { joinProfessional, PRIVATE_PROFESSIONAL_FIELDS, splitProfessional } from './professionalSplit';

const professional: Professional = {
  id: 'prof_x',
  name: 'Talitha',
  title: 'Unhas em Gel',
  meiName: 'Talitha MEI',
  cnpjCpf: '12.345.678/0001-90',
  pixKey: 'pix@lev',
  bankName: 'Banco X',
  phone: '41999999999',
  whatsapp: '41999999999',
  email: 'talitha@lev.com',
  bio: 'Bio',
  avatarUrl: '/a.png',
  categories: ['Outros'],
  color: '#fff',
  workingHours: { 1: { active: true, startTime: '08:00', endTime: '18:00' } },
  slotBufferMinutes: 10,
  offDays: [],
  vacations: []
};

describe('professionalSplit', () => {
  it('tira os campos privados da parte pública', () => {
    const { publicPart, privatePart } = splitProfessional(professional);
    for (const field of PRIVATE_PROFESSIONAL_FIELDS) expect(publicPart).not.toHaveProperty(field);
    expect(publicPart).not.toHaveProperty('cnpjCpf');
    expect(privatePart).toEqual({ meiName: 'Talitha MEI', cnpjCpf: '12.345.678/0001-90', bankName: 'Banco X', email: 'talitha@lev.com' });
    expect(publicPart.pixKey).toBe('pix@lev');
  });

  it('joinProfessional(split) devolve o original', () => {
    const { publicPart, privatePart } = splitProfessional(professional);
    expect(joinProfessional(publicPart, privatePart)).toEqual(professional);
  });

  it('sem parte privada, os campos privados viram vazio', () => {
    const { publicPart } = splitProfessional(professional);
    const joined = joinProfessional(publicPart);
    expect(joined.cnpjCpf).toBe('');
    expect(joined.meiName).toBe('');
    expect(joined.bankName).toBe('');
    expect(joined.email).toBe('');
  });
});
