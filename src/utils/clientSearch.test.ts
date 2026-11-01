import { describe, expect, it } from 'vitest';
import { findClientMatches } from './clientSearch';
import { Client } from '../types';

const client = (id: string, fullName: string, phone: string, active = true): Client => ({
  id,
  fullName,
  phone,
  whatsapp: phone,
  noShowCount: 0,
  cancellationCount: 0,
  imageConsent: true,
  communicationConsent: true,
  active,
  createdAt: '2026-01-01'
});

const base = [
  client('1', 'Ana Paula Souza', '(41) 99999-1111'),
  client('2', 'Mariana Lúcia', '(41) 98888-2222'),
  client('3', 'Ana Inativa', '(41) 97777-3333', false)
];

describe('findClientMatches', () => {
  it('encontra pelo nome ignorando acentos e maiúsculas', () => {
    expect(findClientMatches(base, 'lucia').map(c => c.id)).toEqual(['2']);
    expect(findClientMatches(base, 'ANA').map(c => c.id)).toEqual(['1', '2']);
  });

  it('encontra pelo telefone', () => {
    expect(findClientMatches(base, '98888').map(c => c.id)).toEqual(['2']);
  });

  it('não sugere nada com menos de 2 letras', () => {
    expect(findClientMatches(base, 'a')).toEqual([]);
  });
});
