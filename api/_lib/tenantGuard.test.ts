import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Teste-guarda: lê o código como texto e acusa consultas ao Supabase (REST)
// em tabelas de salão que não usam salonFilter( nem withSalon(.

// As 8 tabelas que ganharam a coluna salon_id (Tarefa 1.1).
const TENANT_TABLES = [
  'appointments',
  'catalog_services',
  'client_profiles',
  'professional_access',
  'admin_users',
  'whatsapp_conversations',
  'whatsapp_messages',
  'reminder_history',
  // Tabelas de dados do painel (fase 2).
  'salon_settings',
  'professionals',
  'professional_private',
  'payments',
  'schedule_blocks',
  'waitlist',
  'audit_logs'
] as const;

// Exceções explícitas: tabelas que nunca levam filtro de salão.
const EXCEPTIONS = ['rest/v1/salons'] as const;

// Linhas abaixo da ocorrência em que o filtro ainda vale (a chamada fetch mais próxima).
const LOOKAHEAD_LINES = 6;

// Arquivos que montam a URL `rest/v1/${caminho}` de forma dinâmica. As tabelas
// usadas nesses casos são achadas pelos textos que começam com o nome da tabela
// (ex.: `appointments?id=eq.1`). Um arquivo novo nessa lista precisa ser revisto.
const KNOWN_DYNAMIC_HELPERS = ['api/_lib/whatsapp.ts', 'api/cron/send-reminders.ts', 'src/services/cloudSalonData.ts'];

// Onde o guarda procura: api/**/*.ts e src/**/*.{ts,tsx}, sem arquivos de teste.
const SCAN_ROOTS: ReadonlyArray<{ dir: string; extensions: readonly string[] }> = [
  { dir: 'api', extensions: ['.ts'] },
  { dir: 'src', extensions: ['.ts', '.tsx'] }
];

// Pastas fora da varredura que podem citar rest/v1/ sem risco (cópias antigas,
// build, automações separadas, ferramentas). Qualquer outro arquivo com rest/v1/
// fora de api/ e src/ faz o teste falhar.
const OUTSIDE_EXCLUDED_DIRS = [
  'node_modules',
  'dist',
  'historico',
  'infraestrutura-e-pesquisas',
  'automacoes',
  'sistema',
  'e2e',
  '.superpowers',
  'scripts',
  '.git'
] as const;
const OUTSIDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs'] as const;

const isTestFile = (name: string): boolean => /\.test\.[a-z]+$/.test(name);

const FILTER_PATTERN = /\b(salonFilter|withSalon)\(/;
const OPT_OUT_PATTERN = /\/\/\s*tenant-guard:\s*sem-filtro\s+\S/;
const TABLES_ALTERNATION = TENANT_TABLES.join('|');
const REST_PATTERN = /rest\/v1\/([A-Za-z0-9_]+)/g;
const DYNAMIC_REST_PATTERN = /rest\/v1\/\$\{/;
const LITERAL_PATTERN = new RegExp(`(['"\`])(${TABLES_ALTERNATION})(\\?|\\1)`, 'g');

type Violation = { file: string; line: number; table: string };
type Occurrence = { line: number; table: string };

const isCommentLine = (line: string): boolean => /^\s*(\/\/|\/\*|\*)/.test(line);

// Tira o comentário de fim de linha (preserva `https://`).
const stripLineComment = (line: string): string => line.replace(/(^|[^:])\/\/.*$/, '$1');

// Código da linha sem comentário; linha que é só comentário vira vazia.
const codeOf = (line: string): string => (isCommentLine(line) ? '' : stripLineComment(line));

const bracketDelta = (code: string): number => {
  let delta = 0;
  for (const char of code) {
    if (char === '(' || char === '{' || char === '[') delta += 1;
    else if (char === ')' || char === '}' || char === ']') delta -= 1;
  }
  return delta;
};

const isTenantTable = (name: string): boolean =>
  (TENANT_TABLES as readonly string[]).includes(name);

const isException = (line: string, table: string): boolean =>
  EXCEPTIONS.some(exception => exception === `rest/v1/${table}` && line.includes(exception));

const findOccurrences = (lines: string[]): Occurrence[] => {
  const found: Occurrence[] = [];
  lines.forEach((raw, index) => {
    const text = codeOf(raw);
    for (const match of text.matchAll(REST_PATTERN)) {
      const table = match[1];
      if (isTenantTable(table) && !isException(text, table)) found.push({ line: index, table });
    }
    for (const match of text.matchAll(LITERAL_PATTERN)) {
      found.push({ line: index, table: match[2] });
    }
  });
  return found;
};

const hasOptOut = (lines: string[], index: number): boolean =>
  OPT_OUT_PATTERN.test(lines[index]) || (index > 0 && OPT_OUT_PATTERN.test(lines[index - 1]));

// Procura o filtro na própria linha e nas seguintes (no máximo 6 abaixo), mas só
// dentro da mesma instrução/chamada: para na linha em que os parênteses/chaves
// abertos desde a linha da ocorrência se fecham, ou que termina com `;`.
const hasFilterNearby = (lines: string[], index: number, nextOccurrenceLine: number): boolean => {
  const last = Math.min(index + LOOKAHEAD_LINES, nextOccurrenceLine - 1, lines.length - 1);
  let depth = 0;
  for (let current = index; current <= last; current += 1) {
    const code = codeOf(lines[current]);
    if (FILTER_PATTERN.test(code)) return true;
    depth += bracketDelta(code);
    if (code.trim() !== '' && (depth <= 0 || code.trimEnd().endsWith(';'))) return false;
  }
  return false;
};

const checkSource = (file: string, source: string): Violation[] => {
  const lines = source.split(/\r?\n/);
  const occurrences = findOccurrences(lines);
  const violations: Violation[] = [];
  occurrences.forEach((occurrence, position) => {
    const nextLine = occurrences.slice(position + 1).find(next => next.line > occurrence.line)?.line
      ?? Number.POSITIVE_INFINITY;
    if (hasOptOut(lines, occurrence.line)) return;
    if (hasFilterNearby(lines, occurrence.line, nextLine)) return;
    violations.push({ file, line: occurrence.line + 1, table: occurrence.table });
  });
  return violations;
};

const repoRoot = process.cwd();

const listFiles = (
  dir: string,
  extensions: readonly string[],
  skipDirs: readonly string[] = ['node_modules']
): string[] => {
  const entries = readdirSync(dir).sort();
  return entries.flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return skipDirs.includes(entry) ? [] : listFiles(full, extensions, skipDirs);
    return extensions.some(ext => entry.endsWith(ext)) && !isTestFile(entry) ? [full] : [];
  });
};

const toRepoPath = (full: string): string => relative(repoRoot, full).split('\\').join('/');

const loadSources = (): Array<{ file: string; source: string }> =>
  SCAN_ROOTS
    .flatMap(root => listFiles(join(repoRoot, root.dir), root.extensions))
    .map(full => ({ file: toRepoPath(full), source: readFileSync(full, 'utf8') }))
    .sort((a, b) => a.file.localeCompare(b.file));

const scanCodebase = (): Violation[] =>
  loadSources().flatMap(({ file, source }) => checkSource(file, source));

const formatViolation = (violation: Violation): string =>
  `${violation.file}:${violation.line} (${violation.table})`;

describe('tenantGuard: função de verificação', () => {
  it('controle positivo: acusa consulta sem filtro de salão', () => {
    const source = "const r = await fetch(`${url}/rest/v1/appointments?id=eq.1`, { headers });";
    expect(checkSource('x.ts', source)).toEqual([{ file: 'x.ts', line: 1, table: 'appointments' }]);
  });

  it('controle negativo: não acusa consulta com salonFilter', () => {
    const source = 'const r = await fetch(`${url}/rest/v1/appointments?${salonFilter(id)}`, { headers });';
    expect(checkSource('x.ts', source)).toEqual([]);
  });

  it('aceita withSalon na chamada fetch logo abaixo e recusa depois de 6 linhas', () => {
    const near = [
      'await fetch(`${url}/rest/v1/appointments?on_conflict=id`, {',
      "  method: 'POST',",
      '  body: JSON.stringify(withSalon(row, salonId))',
      '});'
    ].join('\n');
    expect(checkSource('x.ts', near)).toEqual([]);

    const far = [
      'await fetch(`${url}/rest/v1/appointments?on_conflict=id`, {',
      '', '', '', '', '', '',
      '  body: JSON.stringify(withSalon(row, salonId))',
      '});'
    ].join('\n');
    expect(checkSource('x.ts', far)).toHaveLength(1);
  });

  it('o filtro de uma consulta não cobre a consulta vizinha', () => {
    const source = [
      'fetch(`${url}/rest/v1/admin_users?user_id=eq.${id}`),',
      'fetch(`${url}/rest/v1/professional_access?${salonFilter(salonId)}`)'
    ].join('\n');
    expect(checkSource('x.ts', source)).toEqual([{ file: 'x.ts', line: 1, table: 'admin_users' }]);
  });

  it('acusa textos que começam com o nome da tabela (helpers dinâmicos)', () => {
    expect(checkSource('x.ts', 'await query(`appointments?id=eq.${id}`);')).toHaveLength(1);
    expect(checkSource('x.ts', "await supabaseRequest('whatsapp_messages?select=*');")).toHaveLength(1);
    expect(checkSource('x.ts', "await supabaseRequest('reminder_history', { method: 'POST' });")).toHaveLength(1);
    expect(checkSource('x.ts', 'await query(`appointments?id=eq.${id}&${salonFilter(salonId)}`);')).toEqual([]);
  });

  it('acusa as tabelas de dados do painel sem filtro de salão', () => {
    const tables = ['salon_settings', 'professionals', 'professional_private', 'payments', 'schedule_blocks', 'waitlist', 'audit_logs'];
    for (const table of tables) {
      expect(checkSource('x.ts', 'fetch(`${url}/rest/v1/' + table + '?id=eq.1`)')).toHaveLength(1);
      expect(checkSource('x.ts', 'fetch(`${url}/rest/v1/' + table + '?${salonFilter(id)}`)')).toEqual([]);
    }
  });

  it('não acusa a tabela salons (exceção explícita) nem tabelas fora da lista', () => {
    expect(checkSource('x.ts', 'fetch(`${url}/rest/v1/salons?id=eq.lev`)')).toEqual([]);
    expect(checkSource('x.ts', 'fetch(`${url}/rest/v1/${path}`)')).toEqual([]);
  });

  it('marcador com motivo isenta a ocorrência (mesma linha ou linha acima)', () => {
    const above = [
      '// tenant-guard: sem-filtro descobre o salão pelo login',
      'fetch(`${url}/rest/v1/admin_users?user_id=eq.${id}`)'
    ].join('\n');
    expect(checkSource('x.ts', above)).toEqual([]);

    const sameLine = 'fetch(`${url}/rest/v1/admin_users?user_id=eq.${id}`) // tenant-guard: sem-filtro descobre o salão';
    expect(checkSource('x.ts', sameLine)).toEqual([]);
  });

  it('marcador sem motivo, ou distante, não isenta', () => {
    const bare = [
      '// tenant-guard: sem-filtro',
      'fetch(`${url}/rest/v1/admin_users?user_id=eq.${id}`)'
    ].join('\n');
    expect(checkSource('x.ts', bare)).toHaveLength(1);

    const bareSameLine = 'fetch(`${url}/rest/v1/admin_users?user_id=eq.${id}`) // tenant-guard: sem-filtro   ';
    expect(checkSource('x.ts', bareSameLine)).toHaveLength(1);

    const distant = [
      '// tenant-guard: sem-filtro descobre o salão pelo login',
      '',
      'fetch(`${url}/rest/v1/admin_users?user_id=eq.${id}`)'
    ].join('\n');
    expect(checkSource('x.ts', distant)).toHaveLength(1);
  });

  it('salonFilter citado só em comentário não conta', () => {
    const source = [
      'fetch(`${url}/rest/v1/appointments?id=eq.1`, {',
      '  // falta salonFilter( aqui',
      '});'
    ].join('\n');
    expect(checkSource('x.ts', source)).toHaveLength(1);
  });

  it('salonFilter em comentário no fim da linha não conta (e https:// continua valendo)', () => {
    const trailing = 'fetch(`${url}/rest/v1/appointments?id=eq.1`); // salonFilter(salonId)';
    expect(checkSource('x.ts', trailing)).toHaveLength(1);

    const withHttps = "fetch(`https://x.supabase.co/rest/v1/appointments?${salonFilter(id)}`);";
    expect(checkSource('x.ts', withHttps)).toEqual([]);
  });

  it('salonFilter em outra instrução depois do fetch concluído não conta', () => {
    const withSemicolon = [
      'const r = await fetch(`${url}/rest/v1/appointments?id=eq.1`, { headers });',
      'const unused = salonFilter(x);'
    ].join('\n');
    expect(checkSource('x.ts', withSemicolon)).toHaveLength(1);

    const withoutSemicolon = [
      'const r = await fetch(`${url}/rest/v1/appointments?id=eq.1`, { headers })',
      'const unused = salonFilter(x)'
    ].join('\n');
    expect(checkSource('x.ts', withoutSemicolon)).toHaveLength(1);
  });

  it('filtro dentro da mesma chamada, 3 linhas abaixo, conta', () => {
    const query = [
      'const r = await fetch(`${url}/rest/v1/appointments?select=payload` +',
      '  `&order=appointment_date.asc` +',
      '  `&limit=10` +',
      '  `&${salonFilter(id)}`, { headers });'
    ].join('\n');
    expect(checkSource('x.ts', query)).toEqual([]);

    const insert = [
      'const r = await fetch(`${url}/rest/v1/appointments?on_conflict=id`, {',
      "  method: 'POST',",
      '  headers,',
      '  body: JSON.stringify(withSalon(row, salonId))',
      '});'
    ].join('\n');
    expect(checkSource('x.ts', insert)).toEqual([]);
  });
});

describe('tenantGuard: código do projeto', () => {
  it('lê o código de verdade (acha mais de zero ocorrências de rest/v1/)', () => {
    const sources = loadSources();
    const total = sources.reduce((sum, { source }) => sum + (source.match(/rest\/v1\//g) ?? []).length, 0);
    expect(sources.length).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(0);
  });

  it('nenhum arquivo fora de api/ e src/ acessa rest/v1/ (fora das pastas excluídas)', () => {
    const scanned = new Set(loadSources().map(({ file }) => file));
    const outside = listFiles(repoRoot, OUTSIDE_EXTENSIONS, OUTSIDE_EXCLUDED_DIRS)
      .map(full => ({ file: toRepoPath(full), full }))
      .filter(({ file }) => !scanned.has(file))
      .filter(({ full }) => readFileSync(full, 'utf8').includes('rest/v1/'))
      .map(({ file }) => file);
    expect(outside).toEqual([]);
  });

  it('todo helper com URL dinâmica rest/v1/${...} é conhecido', () => {
    const dynamic = loadSources()
      .filter(({ source }) => DYNAMIC_REST_PATTERN.test(source))
      .map(({ file }) => file);
    expect(dynamic).toEqual(KNOWN_DYNAMIC_HELPERS);
  });

  it('a lista de consultas pendentes é determinística', () => {
    const first = scanCodebase().map(formatViolation);
    const second = scanCodebase().map(formatViolation);
    expect(first).toEqual(second);
  });

  it('nenhuma consulta em tabela de salão sem filtro de salão', () => {
    expect(scanCodebase().map(formatViolation)).toEqual([]);
  });
});
