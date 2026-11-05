import { Professional, User } from '../types';
import { CloudHttpError, CloudSalonData, CloudTableMissingError, SalonRow, SalonTable } from './cloudSalonData';
import { joinProfessional, ProfessionalPrivate, ProfessionalPublic, splitProfessional } from './professionalSplit';

// Sincroniza os dados do painel (aparelho <-> nuvem do salão).
// Regra de ouro: nada aqui lança erro para quem chama. Sem configuração, sem
// internet ou com a tabela ainda não criada no banco, o aparelho segue como está.

// tenant-guard: sem-filtro nomes dos tipos de dado (não são consultas)
export type SyncKind = 'settings' | 'professionals' | 'payments' | 'blocks' | 'waitlist' | 'logs';

type Role = User['role'];
type StaffRole = Extract<Role, 'admin' | 'profissional'>;
type WithId = { id: string } & Record<string, unknown>;
type OutboxEntry = { kind: SyncKind; op: 'upsert' | 'delete'; item: unknown; role: Role; professionalId?: string };
type TableWrite = { table: SalonTable; rows: SalonRow<unknown>[]; insertOnly?: boolean };

const OUTBOX_KEY = 'lev_cloud_outbox_v1';
const seededKey = (kind: SyncKind) => `lev_cloud_seeded_${kind}_v1`;
const SETTINGS_ROW_ID = 'geral';
const MAX_LOGS = 500;

// Mesmas chaves do StorageService (src/services/storage.ts, STORAGE_KEYS).
const LOCAL_KEYS: Record<SyncKind, string> = {
  settings: 'lev_coworking_settings_v1',
  professionals: 'lev_coworking_professionals_v10',
  payments: 'lev_coworking_payments_v1',
  blocks: 'lev_coworking_blocks_v1',
  waitlist: 'lev_coworking_waitlist_v1',
  logs: 'lev_coworking_logs_v1'
};

// tenant-guard: sem-filtro nomes de tabela; o filtro do salão é aplicado pelo CloudSalonData
const TABLES = { settings: 'salon_settings', professionals: 'professionals', professionalPrivate: 'professional_private', payments: 'payments', blocks: 'schedule_blocks', waitlist: 'waitlist', logs: 'audit_logs' } as const satisfies Record<SyncKind | 'professionalPrivate', SalonTable>;

const isStaff = (role?: Role): role is StaffRole => role === 'admin' || role === 'profissional';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasId = (value: unknown): value is WithId => isRecord(value) && typeof value.id === 'string' && value.id.length > 0;

const statusOf = (error: unknown): number | undefined => {
  if (!(error instanceof Error)) return undefined;
  const status = (error as CloudHttpError).status;
  return typeof status === 'number' ? status : undefined;
};

const isDenied = (error: unknown) => {
  const status = statusOf(error);
  return status === 401 || status === 403;
};

// Vai para a fila: rede caída, sessão a renovar (sem status), erro do servidor,
// 401, 408 e 429. Outros 4xx (403, dado inválido) não melhoram tentando de novo.
const shouldQueue = (error: unknown) => {
  if (error instanceof CloudTableMissingError) return false;
  const status = statusOf(error);
  if (status === undefined) return true;
  return status >= 500 || status === 401 || status === 408 || status === 429;
};

const hasStorage = () => typeof localStorage !== 'undefined';

const readJson = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as unknown : undefined;
  } catch {
    return undefined;
  }
};

// Devolve true se o valor gravado mudou.
const writeJson = (key: string, value: unknown): boolean => {
  try {
    const next = JSON.stringify(value);
    if (localStorage.getItem(key) === next) return false;
    localStorage.setItem(key, next);
    return true;
  } catch (error) {
    console.warn(`Não foi possível gravar ${key} no aparelho:`, error);
    return false;
  }
};

const readLocalList = (kind: SyncKind): WithId[] => {
  const value = readJson(LOCAL_KEYS[kind]);
  return Array.isArray(value) ? value.filter(hasId) : [];
};

const isSeeded = (kind: SyncKind) => localStorage.getItem(seededKey(kind)) !== null;
const markSeeded = (kind: SyncKind) => {
  try { localStorage.setItem(seededKey(kind), new Date().toISOString()); } catch { /* sem espaço: tenta de novo na próxima */ }
};

// ---------------------------------------------------------------------------
// Fila de envio
// ---------------------------------------------------------------------------

const isOutboxEntry = (value: unknown): value is OutboxEntry =>
  isRecord(value) && typeof value.kind === 'string' && (value.op === 'upsert' || value.op === 'delete') && typeof value.role === 'string';

const readOutbox = (): OutboxEntry[] => {
  const value = readJson(OUTBOX_KEY);
  return Array.isArray(value) ? value.filter(isOutboxEntry) : [];
};

const entryId = (entry: Pick<OutboxEntry, 'kind' | 'item'>): string | undefined =>
  entry.kind === 'settings' ? SETTINGS_ROW_ID : hasId(entry.item) ? entry.item.id : undefined;

// Um item tem no máximo uma pendência: a mais nova substitui a anterior.
const enqueue = (entry: OutboxEntry) => {
  const id = entryId(entry);
  const others = readOutbox().filter(existing => !(existing.kind === entry.kind && entryId(existing) === id));
  writeJson(OUTBOX_KEY, [...others, entry]);
};

// ---------------------------------------------------------------------------
// Envio para a nuvem
// ---------------------------------------------------------------------------

const ownerOf = (item: WithId): string | undefined =>
  typeof item.professionalId === 'string' && item.professionalId ? item.professionalId : undefined;

const writesFor = (kind: SyncKind, items: WithId[], professionalId?: string): TableWrite[] => {
  switch (kind) {
    case 'settings':
      return [{ table: TABLES.settings, rows: items.map(item => ({ id: SETTINGS_ROW_ID, payload: item })) }];
    // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
    case 'professionals': {
      const parts = items.map(item => ({ id: item.id, ...splitProfessional(item as unknown as Professional) }));
      return [
        { table: TABLES.professionals, rows: parts.map(part => ({ id: part.id, professionalId: part.id, payload: part.publicPart })) },
        { table: TABLES.professionalPrivate, rows: parts.map(part => ({ id: part.id, professionalId: part.id, payload: part.privatePart })) }
      ];
    }
    case 'logs':
      // audit_logs só aceita inclusão. Profissional só grava log com o próprio id.
      return [{
        table: TABLES.logs,
        rows: items.map(item => ({ id: item.id, ...(professionalId ? { professionalId } : {}), payload: item })),
        insertOnly: true
      }];
    default: {
      return [{ table: TABLES[kind], rows: items.map(item => ({ id: item.id, ...(ownerOf(item) ? { professionalId: ownerOf(item) } : {}), payload: item })) }];
    }
  }
};

const writeItems = async (kind: SyncKind, items: WithId[], role: StaffRole, professionalId?: string) => {
  for (const write of writesFor(kind, items, professionalId)) {
    if (write.insertOnly) await CloudSalonData.upsert(write.table, write.rows, role, { insertOnly: true });
    else await CloudSalonData.upsert(write.table, write.rows, role);
  }
};

const runEntry = async (entry: OutboxEntry) => {
  if (!isStaff(entry.role)) return;
  if (entry.op === 'delete') {
    const id = entryId(entry);
    if (id && entry.kind === 'blocks') await CloudSalonData.remove(TABLES.blocks, id, entry.role);
    return;
  }
  if (!isRecord(entry.item) || (entry.kind !== 'settings' && !hasId(entry.item))) return;
  // settings: a linha é sempre 'geral'; o objeto vai como está no payload.
  await writeItems(entry.kind, [entry.item as WithId], entry.role, entry.professionalId);
};

// Reenvia a fila. Só tira da fila o que foi enviado (ou recusado com 403); itens
// que chegarem à fila durante o reenvio são preservados.
const flushOutbox = async () => {
  const entries = readOutbox();
  if (!entries.length) return;
  const done = new Set<string>();
  for (const entry of entries) {
    try {
      await runEntry(entry);
      done.add(JSON.stringify(entry));
    } catch (error) {
      if (statusOf(error) === 403) {
        console.warn('A nuvem recusou um envio pendente (sem permissão); ele foi descartado.', entry.kind);
        done.add(JSON.stringify(entry));
      }
    }
  }
  writeJson(OUTBOX_KEY, readOutbox().filter(entry => !done.has(JSON.stringify(entry))));
};

// ---------------------------------------------------------------------------
// Leitura da nuvem
// ---------------------------------------------------------------------------

// Lista da nuvem com as pendências da fila por cima (a pendência é mais nova).
const applyPending = (kind: SyncKind, items: WithId[], pending: OutboxEntry[]): WithId[] => {
  const byId = new Map(items.map(item => [item.id, item]));
  for (const entry of pending) {
    if (entry.kind !== kind) continue;
    const id = entryId(entry);
    if (!id) continue;
    if (entry.op === 'delete') byId.delete(id);
    else if (hasId(entry.item)) byId.set(id, entry.item);
  }
  return [...byId.values()];
};

// Profissional só sobe o que a regra do banco permite.
const canSeed = (kind: SyncKind, item: WithId, role: StaffRole, professionalId?: string): boolean => {
  if (role === 'admin') return true;
  // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
  if (kind === 'waitlist') return true;
  if (kind === 'logs' || kind === 'settings') return false;
  if (!professionalId) return true; // sem o id: a nuvem decide (403 é descartado)
  // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
  return kind === 'professionals' ? item.id === professionalId : ownerOf(item) === professionalId;
};

const rowsToItems = (rows: SalonRow<unknown>[]): WithId[] =>
  rows.filter(row => isRecord(row.payload)).map(row => ({ ...(row.payload as Record<string, unknown>), id: row.id }));

type SyncListOptions = {
  role?: Role;
  professionalId?: string;
  pending: OutboxEntry[];
  readCloud: () => Promise<WithId[]>;
  // Nuvem vazia não substitui o aparelho (ex.: lista de profissionais do site).
  keepLocalWhenCloudEmpty?: boolean;
};

const syncList = async (kind: SyncKind, options: SyncListOptions): Promise<boolean> => {
  const { role, professionalId, pending } = options;
  const items = await options.readCloud();

  if (isStaff(role) && !isSeeded(kind)) {
    const cloudIds = new Set(items.map(item => item.id));
    const toSend = readLocalList(kind).filter(item => !cloudIds.has(item.id) && canSeed(kind, item, role, professionalId));
    if (toSend.length) {
      try {
        await writeItems(kind, toSend, role, kind === 'logs' ? undefined : professionalId);
        items.push(...toSend);
      } catch (error) {
        // 401/403: a nuvem não aceita estes itens; ficam fora da subida e da fila.
        // Outro erro: não marca a subida e não mexe no aparelho; tenta no próximo pull.
        if (!isDenied(error)) throw error;
      }
    }
    markSeeded(kind);
  }

  let merged = applyPending(kind, items, pending);
  if (kind === 'logs') {
    merged = merged
      .sort((a, b) => String(b.timestamp ?? '').localeCompare(String(a.timestamp ?? '')))
      .slice(0, MAX_LOGS);
  }
  if (options.keepLocalWhenCloudEmpty && merged.length === 0) return false;
  return writeJson(LOCAL_KEYS[kind], merged);
};

const readProfessionals = async (role?: Role): Promise<WithId[]> => {
  const publicRows = await CloudSalonData.list<ProfessionalPublic>(TABLES.professionals);
  const privateById = new Map<string, Partial<ProfessionalPrivate>>();
  if (isStaff(role)) {
    const privateRows = await CloudSalonData.list<ProfessionalPrivate>(TABLES.professionalPrivate, role);
    privateRows.forEach(row => { if (isRecord(row.payload)) privateById.set(row.id, row.payload); });
  }
  return publicRows
    .filter(row => isRecord(row.payload))
    .map(row => joinProfessional({ ...row.payload, id: row.id }, privateById.get(row.id)) as unknown as WithId);
};

const syncSettings = async (role: Role | undefined, pending: OutboxEntry[]): Promise<boolean> => {
  const rows = await CloudSalonData.list<unknown>(TABLES.settings);
  const row = rows.find(candidate => candidate.id === SETTINGS_ROW_ID && isRecord(candidate.payload));
  const pendingEntry = [...pending].reverse().find(entry => entry.kind === 'settings' && entry.op === 'upsert' && isRecord(entry.item));
  if (pendingEntry) return writeJson(LOCAL_KEYS.settings, pendingEntry.item);
  if (row) return writeJson(LOCAL_KEYS.settings, row.payload);

  // Nuvem sem configuração: a admin sobe a do aparelho. Se falhar, não vai para a
  // fila: o próximo pull tenta de novo (e não sobrescreve se outra admin subir antes).
  const local = readJson(LOCAL_KEYS.settings);
  if (role === 'admin' && isRecord(local)) await writeItems('settings', [local as WithId], role);
  return false;
};

// Cada tipo é independente: um erro em um não impede os outros.
const safely = async (task: () => Promise<boolean>): Promise<boolean> => {
  try {
    return await task();
  } catch (error) {
    if (!(error instanceof CloudTableMissingError)) console.warn('Sincronização com a nuvem adiada:', error);
    return false;
  }
};

const doPull = async (role?: Role, professionalId?: string): Promise<boolean> => {
  await flushOutbox();
  const pending = readOutbox();
  const base = { role, professionalId, pending };
  const results: boolean[] = [];

  results.push(await safely(() => syncSettings(role, pending)));
  // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
  results.push(await safely(() => syncList('professionals', { ...base, readCloud: () => readProfessionals(role), keepLocalWhenCloudEmpty: true })));

  if (isStaff(role)) {
    // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
    for (const kind of ['payments', 'blocks', 'waitlist'] as const) {
      results.push(await safely(() => syncList(kind, { ...base, readCloud: async () => rowsToItems(await CloudSalonData.list(TABLES[kind], role)) })));
    }
  }
  if (role === 'admin') {
    // A leitura traz todos os logs do salão; o aparelho guarda só os 500 mais novos.
    results.push(await safely(() => syncList('logs', { ...base, readCloud: async () => rowsToItems(await CloudSalonData.list(TABLES.logs, role)) })));
  }
  return results.some(Boolean);
};

export const SalonDataSync = {
  // Puxa da nuvem para o aparelho. Devolve true se alguma chave do aparelho mudou
  // (o StorageService precisa avisar as telas). Nunca lança erro.
  // `professionalId`: id da profissional logada, usado para subir só o que é dela.
  async pull(role?: Role, professionalId?: string): Promise<boolean> {
    if (!hasStorage()) return false;
    try {
      if (!CloudSalonData.isConfigured()) return false;
      return await doPull(role, professionalId);
    } catch (error) {
      console.warn('Sincronização com a nuvem adiada:', error);
      return false;
    }
  },

  // Envia um item para a nuvem. Falha de rede/servidor → fila. Tabela ainda não
  // criada, sem configuração ou sem permissão → não faz nada. Nunca lança erro.
  // `professionalId` (4º parâmetro): só para `logs`, id da profissional logada
  // (o banco só aceita log de profissional marcado com o próprio id).
  async push(kind: SyncKind, item: unknown, role: Role, professionalId?: string): Promise<void> {
    if (!hasStorage() || !isStaff(role) || !isRecord(item)) return;
    if (kind !== 'settings' && !hasId(item)) return;
    const logOwner = kind === 'logs' ? professionalId : undefined;
    try {
      if (!CloudSalonData.isConfigured()) return;
      await writeItems(kind, [item as WithId], role, logOwner);
    } catch (error) {
      if (shouldQueue(error)) enqueue({ kind, op: 'upsert', item, role, ...(logOwner ? { professionalId: logOwner } : {}) });
      else if (!(error instanceof CloudTableMissingError)) console.warn('A nuvem recusou o envio:', error);
    }
  },

  async removeBlock(id: string, role: Role): Promise<void> {
    if (!hasStorage() || !isStaff(role) || !id) return;
    try {
      if (!CloudSalonData.isConfigured()) return;
      await CloudSalonData.remove(TABLES.blocks, id, role);
    } catch (error) {
      if (shouldQueue(error)) enqueue({ kind: 'blocks', op: 'delete', item: { id }, role });
      else if (!(error instanceof CloudTableMissingError)) console.warn('A nuvem recusou a exclusão:', error);
    }
  }
};
