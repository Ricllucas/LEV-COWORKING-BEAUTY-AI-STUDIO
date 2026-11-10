import { describe, expect, it } from 'vitest';
import { classifyHost, normalizeHost } from './salonAddress';

describe('normalizeHost', () => {
  it('tira porta, letras maiúsculas e ponto final', () => {
    expect(normalizeHost('Lev.Exemplo.com.br:443')).toBe('lev.exemplo.com.br');
    expect(normalizeHost('salao.com.br.')).toBe('salao.com.br');
  });

  it('recusa endereço vazio, com espaço ou grande demais', () => {
    expect(normalizeHost('')).toBeNull();
    expect(normalizeHost(undefined)).toBeNull();
    expect(normalizeHost('a b.com')).toBeNull();
    expect(normalizeHost(`${'a'.repeat(250)}.com`)).toBeNull();
    expect(normalizeHost('a..com')).toBeNull();
  });
});

describe('classifyHost', () => {
  it('endereços da LEV não precisam do banco', () => {
    for (const host of ['lev-coworking-beauty.vercel.app', 'lev-coworking-beauty-git-main-equipe.vercel.app', 'localhost:3000', '127.0.0.1']) {
      expect(classifyHost(host)).toEqual({ kind: 'default' });
    }
  });

  it('outro endereço da Vercel é tratado como domínio próprio', () => {
    expect(classifyHost('outro-projeto.vercel.app')).toEqual({ kind: 'domain', domain: 'outro-projeto.vercel.app' });
  });

  it('subdomínio de localhost vira salão (teste no computador)', () => {
    expect(classifyHost('demo.localhost:3000')).toEqual({ kind: 'slug', slug: 'demo' });
  });

  it('subdomínio do domínio da plataforma vira salão', () => {
    const platform = ['exemplo.com.br'];
    expect(classifyHost('lev.exemplo.com.br', platform)).toEqual({ kind: 'slug', slug: 'lev' });
    expect(classifyHost('exemplo.com.br', platform)).toEqual({ kind: 'invalid' });
    expect(classifyHost('www.exemplo.com.br', platform)).toEqual({ kind: 'invalid' });
    expect(classifyHost('a.b.exemplo.com.br', platform)).toEqual({ kind: 'invalid' });
  });

  it('domínio próprio perde o www', () => {
    expect(classifyHost('www.salaobonito.com.br')).toEqual({ kind: 'domain', domain: 'salaobonito.com.br' });
  });

  it('endereço fora do formato é inválido', () => {
    expect(classifyHost('Salao_X.com')).toEqual({ kind: 'invalid' });
    expect(classifyHost(undefined)).toEqual({ kind: 'invalid' });
  });
});
