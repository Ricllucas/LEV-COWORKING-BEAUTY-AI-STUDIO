import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Guarda da Fase 3: dados fixos da LEV so podem viver em src/data/**,
// api/_lib/levDefaults.ts e arquivos de teste.
const RAIZ = path.resolve(__dirname, '../..');
const PADROES: RegExp[] = [/prof_elisangela|prof_talitha|prof_nayara/, /LEV Coworking/i];

function normalizar(p: string): string {
  return p.split(path.sep).join('/');
}

function permitido(rel: string): boolean {
  return (
    rel.startsWith('src/data/') ||
    rel === 'api/_lib/levDefaults.ts' ||
    /\.test\.tsx?$/.test(rel)
  );
}

function listar(dir: string, saida: string[]): void {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name === 'dist') continue;
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listar(completo, saida);
    else if (/\.tsx?$/.test(entrada.name)) saida.push(completo);
  }
}

function arquivosVerificados(): string[] {
  const todos: string[] = [];
  listar(path.join(RAIZ, 'src'), todos);
  listar(path.join(RAIZ, 'api'), todos);
  return todos.map((f) => normalizar(path.relative(RAIZ, f))).filter((rel) => !permitido(rel));
}

describe('sem LEV fixa no codigo', () => {
  it('le uma quantidade razoavel de arquivos (nao passa vazio)', () => {
    expect(arquivosVerificados().length).toBeGreaterThan(50);
  });

  it('nenhum arquivo fora dos lugares permitidos cita a LEV', () => {
    const achados: string[] = [];
    for (const rel of arquivosVerificados()) {
      const linhas = fs.readFileSync(path.join(RAIZ, rel), 'utf8').split(/\r?\n/);
      linhas.forEach((linha, i) => {
        if (PADROES.some((p) => p.test(linha))) achados.push(`${rel}:${i + 1}: ${linha.trim()}`);
      });
    }
    expect(achados, `LEV fixa encontrada:\n${achados.join('\n')}`).toEqual([]);
  });
});
