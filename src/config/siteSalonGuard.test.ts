import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// O salão é descoberto antes do App carregar. Se main.tsx importar o App (ou algo que
// lê CURRENT_SALON_ID) de forma estática, o salão seria lido cedo demais e ficaria a LEV.
const read = (file: string) => readFileSync(join(process.cwd(), 'src', file), 'utf8');
const staticImports = (source: string) =>
  [...source.matchAll(/^import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map(match => match[1]);

describe('ordem de abertura do site', () => {
  it('main.tsx não importa o App, o contexto nem os serviços de forma estática', () => {
    const offenders = staticImports(read('main.tsx')).filter(path => /^\.\/(App|context\/|services\/)/.test(path));
    expect(offenders).toEqual([]);
  });

  it('siteSalon.ts não depende de config/salon', () => {
    expect(staticImports(read('config/siteSalon.ts')).some(path => /\/salon$|^\.\/salon$/.test(path))).toBe(false);
  });
});
