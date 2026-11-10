import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Teste-guarda (fase 4): rota pública descobre o salão pelo endereço, nunca pela LEV fixa.
const API_DIR = join(process.cwd(), 'api');
const PUBLIC_ROUTES = [
  'appointments/availability.ts',
  'appointments/cancel.ts',
  'appointments/create.ts',
  'whatsapp/appointment.ts'
];
// Tarefa agendada (sem endereço): continua no salão padrão
const DEFAULT_ALLOWED = ['calendar/sync.ts'];

const routeFiles = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const full = join(dir, name);
  if (statSync(full).isDirectory()) return name === '_lib' ? [] : routeFiles(full);
  return name.endsWith('.ts') && !name.endsWith('.test.ts') ? [full] : [];
});

const rel = (file: string) => relative(API_DIR, file).replace(/\\/g, '/');

describe('rotas públicas usam o salão do endereço', () => {
  it('DEFAULT_SALON_ID só aparece na tarefa agendada', () => {
    const offenders = routeFiles(API_DIR)
      .filter(file => !DEFAULT_ALLOWED.includes(rel(file)))
      .filter(file => readFileSync(file, 'utf8').includes('DEFAULT_SALON_ID'))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it.each(PUBLIC_ROUTES)('%s usa publicSalonId(', route => {
    expect(readFileSync(join(API_DIR, route), 'utf8')).toContain('publicSalonId(');
  });
});
