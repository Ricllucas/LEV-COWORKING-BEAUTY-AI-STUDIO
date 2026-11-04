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
  'reminder_history'
] as const;

// Exceções explícitas: tabelas que nunca levam filtro de salão.
const EXCEPTIONS = ['rest/v1/salons'] as const;

// Linhas abaixo da ocorrência em que o filtro ainda vale (a chamada fetch mais próxima).
const LOOKAHEAD_LINES = 6;

// Arquivos que montam a URL `rest/v1/${caminho}` de forma dinâmica. As tabelas
// usadas nesses casos são achadas pelos textos que começam com o nome da tabela
// (ex.: `appointments?id=eq.1`). Um arquivo novo nessa lista precisa ser revisto.
const KNOWN_DYNAMIC_HELPERS = ['api/_lib/whatsapp.ts', 'api/cron/send-reminders.ts'];

const SCAN_ROOTS = ['api', 'src/services'];

const FILTER_PATTERN = /\b(salonFilter|withSalon)\(/;
const OPT_OUT_PATTERN = /\/\/\s*tenant-guard:\s*sem-filtro\s+\S/;
const TABLES_ALTERNATION = TENANT_TABLES.join('|');
const REST_PATTERN = /rest\/v1\/([A-Za-z0-9_]+)/g;
const DYNAMIC_REST_PATTERN = /rest\/v1\/\$\{/;
const LITERAL_PATTERN = new RegExp(`(['"\`])(${TABLES_ALTERNATION})(\\?|\\1)`, 'g');

type Violation = { file: string; line: number; table: string };
type Occurrence = { line: number; table: string };

const isCommentLine = (line: string): boolean => /^\s*(\/\/|\/\*|\*)/.test(line);

const isTenantTable = (name: string): boolean =>
  (TENANT_TABLES as readonly string[]).includes(name);

const isException = (line: string, table: string): boolean =>
  EXCEPTIONS.some(exception => exception === `rest/v1/${table}` && line.includes(exception));

const findOccurrences = (lines: string[]): Occurrence[] => {
  const found: Occurrence[] = [];
  lines.forEach((text, index) => {
    if (isCommentLine(text)) return;
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

const hasFilterNearby = (lines: string[], index: number, nextOccurrenceLine: number): boolean => {
  const last = Math.min(index + LOOKAHEAD_LINES, nextOccurrenceLine - 1, lines.length - 1);
  for (let current = index; current <= last; current += 1) {
    const text = lines[current];
    if (current > index && isCommentLine(text)) continue;
    if (FILTER_PATTERN.test(text)) return true;
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

const listSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir).sort();
  return entries.flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === 'node_modules' ? [] : listSourceFiles(full);
    return entry.endsWith('.ts') && !entry.endsWith('.test.ts') ? [full] : [];
  });
};

const toRepoPath = (full: string): string => relative(repoRoot, full).split('\\').join('/');

const loadSources = (): Array<{ file: string; source: string }> =>
  SCAN_ROOTS
    .flatMap(root => listSourceFiles(join(repoRoot, root)))
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
});

describe('tenantGuard: código do projeto', () => {
  it('lê o código de verdade (acha mais de zero ocorrências de rest/v1/)', () => {
    const sources = loadSources();
    const total = sources.reduce((sum, { source }) => sum + (source.match(/rest\/v1\//g) ?? []).length, 0);
    expect(sources.length).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(0);
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

  // A Tarefa 1.5 transforma este it.todo em it normal:
  //   expect(scanCodebase().map(formatViolation)).toEqual([]);
  it.todo('nenhuma consulta em tabela de salão sem filtro de salão');
});
