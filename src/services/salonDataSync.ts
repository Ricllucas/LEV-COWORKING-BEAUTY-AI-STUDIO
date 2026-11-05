import { Professional, User } from '../types';
import { INITIAL_AUDIT_LOGS } from '../data/initialData';
import { CloudHttpError, CloudSalonData, CloudTableMissingError, SalonRow, SalonTable } from './cloudSalonData';
import { joinProfessional, PRIVATE_PROFESSIONAL_FIELDS, ProfessionalPrivate, ProfessionalPublic, splitProfessional } from './professionalSplit';

// Sincroniza os dados do painel (aparelho <-> nuvem do salão).
// Regra de ouro: nada aqui lança erro para quem chama. Sem configuração, sem
// internet ou com a tabela ainda não criada no banco, o aparelho segue como está.
// Segunda regra: a sincronização nunca apaga do aparelho um dado que ainda não
// chegou à nuvem por uma falha passageira.

// tenant-guard: sem-filtro nomes dos tipos de dado (não são consultas)
export type SyncKind = 'settings' | 'professionals' | 'payments' | 'blocks' | 'waitlist' | 'logs';

type Role = User['role'];
type StaffRole = Extract<Role, 'admin' | 'profissional'>;

// Quem está logada. A fila e a marca de primeira subida pertencem a ela.
export type SyncUser = { id: string; role: Role; professionalId?: string };
type StaffUser = SyncUser & { role: StaffRole };

type WithId = { id: string } & Record<string, unknown>;
// A entrada da fila guarda só quem a criou; o envio usa o papel e o token de
// quem está logada na hora do reenvio, nunca um papel lido do aparelho.
type OutboxEntry = { kind: SyncKind; op: 'upsert' | 'delete'; item: unknown; userId: string };
type TableWrite = { table: SalonTable; rows: SalonRow<unknown>[]; insertOnly?: boolean };

const OUTBOX_KEY = 'lev_cloud_outbox_v1';
const seededKey = (kind: SyncKind, userId: string) => `lev_cloud_seeded_${kind}_${userId}_v1`;
// Itens que a nuvem recusou (403) na primeira subida e que só existem no aparelho.
const keptKey = (kind: SyncKind, userId: string) => `lev_cloud_kept_${kind}_${userId}_v1`;
const SETTINGS_ROW_ID = 'geral';
// tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
const PROFESSIONALS = 'professionals' satisfies SyncKind;
const MAX_LOGS = 500;
const DEMO_LOG_IDS = new Set(INITIAL_AUDIT_LOGS.map(log => log.id));

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

const isStaffUser = (user?: SyncUser): user is StaffUser =>
  Boolean(user && user.id && (user.role === 'admin' || user.role === 'profissional'));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasId = (value: unknown): value is WithId => isRecord(value) && typeof value.id === 'string' && value.id.length > 0;

const statusOf = (error: unknown): number | undefined => {
  if (!(error instanceof Error)) return undefined;
  const status = (error as CloudHttpError).status;
  return typeof status === 'number' ? status : undefined;
};

const isForbidden = (error: unknown) => statusOf(error) === 403;

// Erro passageiro: rede caída, sessão a renovar (sem status), 5xx, 401, 408, 429.
const isTemporary = (error: unknown) => {
  if (error instanceof CloudTableMissingError) return false;
  const status = statusOf(error);
  if (status === undefined) return true;
  return status >= 500 || status === 401 || status === 408 || status === 429;
};

// Erro definitivo de requisição (403, dado inválido...): tentar de novo não resolve.
const isPermanent = (error: unknown) => !(error instanceof CloudTableMissingError) && !isTemporary(error);

// O log da profissional vai marcado com o id dela (regra do banco).
const logOwnerOf = (user: StaffUser) => (user.role === 'profissional' ? user.professionalId : undefined);

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

const byIdText = (items: unknown[]) =>
  JSON.stringify(items.filter(hasId).sort((a, b) => a.id.localeCompare(b.id)));

// Lista: só grava (e só conta como mudança) se o conteúdo mudou, sem ligar para a ordem.
const writeList = (key: string, items: WithId[]): boolean => {
  const current = readJson(key);
  if (Array.isArray(current) && current.length === items.length && byIdText(current) === byIdText(items)) return false;
  return writeJson(key, items);
};

const readLocalList = (kind: SyncKind): WithId[] => {
  const value = readJson(LOCAL_KEYS[kind]);
  return Array.isArray(value) ? value.filter(hasId) : [];
};

const isSeeded = (kind: SyncKind, user: StaffUser) => localStorage.getItem(seededKey(kind, user.id)) !== null;
const markSeeded = (kind: SyncKind, user: StaffUser) => {
  try { localStorage.setItem(seededKey(kind, user.id), new Date().toISOString()); } catch { /* sem espaço: tenta de novo na próxima */ }
};

const readKeptIds = (kind: SyncKind, user?: SyncUser): Set<string> => {
  if (!user?.id) return new Set();
  const value = readJson(keptKey(kind, user.id));
  return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
};

// ---------------------------------------------------------------------------
// Fila de envio
// ---------------------------------------------------------------------------

const isOutboxEntry = (value: unknown): value is OutboxEntry =>
  isRecord(value) && typeof value.kind === 'string' && (value.op === 'upsert' || value.op === 'delete') && typeof value.userId === 'string';

const readOutbox = (): OutboxEntry[] => {
  const value = readJson(OUTBOX_KEY);
  return Array.isArray(value) ? value.filter(isOutboxEntry) : [];
};

const pendingOf = (user?: SyncUser): OutboxEntry[] =>
  user?.id ? readOutbox().filter(entry => entry.userId === user.id) : [];

const entryId = (entry: Pick<OutboxEntry, 'kind' | 'item'>): string | undefined =>
  entry.kind === 'settings' ? SETTINGS_ROW_ID : hasId(entry.item) ? entry.item.id : undefined;

// Um item tem no máximo uma pendência por usuária: a mais nova substitui a anterior.
const enqueue = (entry: OutboxEntry) => {
  const id = entryId(entry);
  const others = readOutbox().filter(existing => !(existing.kind === entry.kind && existing.userId === entry.userId && entryId(existing) === id));
  writeJson(OUTBOX_KEY, [...others, entry]);
};

// Tira da fila exatamente esta entrada. Se um salvamento mais novo do mesmo item
// já a substituiu, a mais nova fica (ela tem o próprio envio).
const dequeue = (entry: OutboxEntry) => {
  const text = JSON.stringify(entry);
  const current = readOutbox();
  const next = current.filter(existing => JSON.stringify(existing) !== text);
  if (next.length !== current.length) writeJson(OUTBOX_KEY, next);
};

// Envios diretos (push/removeBlock) em andamento. O pull não reenvia estas
// entradas ao mesmo tempo; elas continuam na fila, então o pull também não
// tira o item do aparelho enquanto o envio não termina.
const inFlight = new Map<string, number>();
const flightKey = (entry: Pick<OutboxEntry, 'kind' | 'item' | 'userId'>) => `${entry.userId}|${entry.kind}|${entryId(entry) ?? ''}`;
const markInFlight = (key: string) => inFlight.set(key, (inFlight.get(key) ?? 0) + 1);
const unmarkInFlight = (key: string) => {
  const count = (inFlight.get(key) ?? 1) - 1;
  if (count > 0) inFlight.set(key, count);
  else inFlight.delete(key);
};

// Pulls em andamento. Um envio que termina durante um pull só sai da fila quando
// o pull acaba: a lista da nuvem que o pull leu pode ser de antes do envio, e é
// a fila que mantém o item no aparelho até lá.
let activePulls = 0;
let deferredDone: OutboxEntry[] = [];

const finishEntry = (entry: OutboxEntry) => {
  if (activePulls > 0) deferredDone.push(entry);
  else dequeue(entry);
};

const releaseDeferred = () => {
  if (activePulls > 0 || !deferredDone.length) return;
  const done = deferredDone;
  deferredDone = [];
  done.forEach(dequeue);
};

// ---------------------------------------------------------------------------
// Envio para a nuvem
// ---------------------------------------------------------------------------

const ownerOf = (item: WithId): string | undefined =>
  typeof item.professionalId === 'string' && item.professionalId ? item.professionalId : undefined;

const professionalParts = (items: WithId[]) =>
  items.map(item => ({ id: item.id, ...splitProfessional(item as unknown as Professional) }));

const publicProfessionalsWrite = (items: WithId[]): TableWrite => ({
  table: TABLES.professionals,
  rows: professionalParts(items).map(part => ({ id: part.id, professionalId: part.id, payload: part.publicPart }))
});

const privateProfessionalsWrite = (items: WithId[]): TableWrite => ({
  table: TABLES.professionalPrivate,
  rows: professionalParts(items).map(part => ({ id: part.id, professionalId: part.id, payload: part.privatePart }))
});

const writesFor = (kind: SyncKind, items: WithId[], logOwner?: string): TableWrite[] => {
  switch (kind) {
    case 'settings':
      return [{ table: TABLES.settings, rows: items.map(item => ({ id: SETTINGS_ROW_ID, payload: item })) }];
    // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
    case 'professionals':
      return [publicProfessionalsWrite(items), privateProfessionalsWrite(items)];
    case 'logs':
      // audit_logs só aceita inclusão.
      return [{
        table: TABLES.logs,
        rows: items.map(item => ({ id: item.id, ...(logOwner ? { professionalId: logOwner } : {}), payload: item })),
        insertOnly: true
      }];
    default:
      return [{ table: TABLES[kind], rows: items.map(item => ({ id: item.id, ...(ownerOf(item) ? { professionalId: ownerOf(item) } : {}), payload: item })) }];
  }
};

const runWrites = async (writes: TableWrite[], role: StaffRole) => {
  for (const write of writes) {
    if (!write.rows.length) continue;
    if (write.insertOnly) await CloudSalonData.upsert(write.table, write.rows, role, { insertOnly: true });
    else await CloudSalonData.upsert(write.table, write.rows, role);
  }
};

const writeItems = (kind: SyncKind, items: WithId[], user: StaffUser) =>
  runWrites(writesFor(kind, items, kind === 'logs' ? logOwnerOf(user) : undefined), user.role);

const runEntry = async (entry: OutboxEntry, user: StaffUser) => {
  if (entry.op === 'delete') {
    const id = entryId(entry);
    if (id && entry.kind === 'blocks') await CloudSalonData.remove(TABLES.blocks, id, user.role);
    return;
  }
  if (!isRecord(entry.item) || (entry.kind !== 'settings' && !hasId(entry.item))) return;
  // settings: a linha é sempre 'geral'; o objeto vai como está no payload.
  await writeItems(entry.kind, [entry.item as WithId], user);
};

// Reenvia só a fila de quem está logada, com o papel e o token dela. Entradas de
// outras usuárias ficam intactas. Sai da fila: o que foi enviado e o que teve erro
// definitivo (403, 400...). Itens que entram na fila durante o reenvio são preservados.
const flushOutbox = async (user: StaffUser) => {
  const entries = pendingOf(user).filter(entry => !inFlight.has(flightKey(entry)));
  if (!entries.length) return;
  const done = new Set<string>();
  for (const entry of entries) {
    try {
      await runEntry(entry, user);
      done.add(JSON.stringify(entry));
    } catch (error) {
      if (isPermanent(error)) {
        console.warn('A nuvem recusou um envio pendente; ele foi descartado.', entry.kind, statusOf(error));
        done.add(JSON.stringify(entry));
      }
    }
  }
  writeJson(OUTBOX_KEY, readOutbox().filter(entry => !done.has(JSON.stringify(entry))));
};

// ---------------------------------------------------------------------------
// Primeira subida
// ---------------------------------------------------------------------------

// Sobe em lote; se o lote levar 403, tenta item por item. Devolve os recusados (403).
// Erro passageiro ou tabela ausente: lança (não marca e não mexe no aparelho).
const seedWrites = async (items: WithId[], buildWrites: (batch: WithId[]) => TableWrite[], role: StaffRole): Promise<WithId[]> => {
  if (!items.length) return [];
  try {
    await runWrites(buildWrites(items), role);
    return [];
  } catch (error) {
    if (!isForbidden(error)) throw error;
  }
  const refused: WithId[] = [];
  for (const item of items) {
    try {
      await runWrites(buildWrites([item]), role);
    } catch (error) {
      if (!isForbidden(error)) throw error;
      refused.push(item);
    }
  }
  if (refused.length) console.warn('A nuvem recusou alguns itens na primeira subida; eles continuam só neste aparelho.', refused.map(item => item.id));
  return refused;
};

// Profissional só sobe o que a regra do banco permite (precisa do próprio id).
// Profissionais (perfil) nunca entram na primeira subida dela: o aparelho dela pode
// ter um perfil antigo ou de demonstração, que venceria a cópia real da admin.
// As edições dela sobem pelo envio explícito (StorageService.publishProfessional).
const canSeed = (kind: SyncKind, item: WithId, user: StaffUser): boolean => {
  if (user.role === 'admin') return kind !== 'logs' || !DEMO_LOG_IDS.has(item.id);
  // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
  if (kind === 'waitlist') return true;
  // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
  if (kind === 'logs' || kind === 'settings' || kind === 'professionals') return false;
  return ownerOf(item) === user.professionalId;
};

// Profissional sem o próprio id não sobe nada (e o tipo segue sem marca).
const seedingBlocked = (user: StaffUser) => user.role === 'profissional' && !user.professionalId;

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

// Grava no aparelho: nuvem + fila (relida agora) + itens recusados que só existem aqui.
const writeMerged = (kind: SyncKind, items: WithId[], user: SyncUser | undefined, options: { keepLocalWhenCloudEmpty?: boolean } = {}): boolean => {
  let merged = applyPending(kind, items, pendingOf(user));
  const kept = readKeptIds(kind, user);
  if (kept.size) {
    const present = new Set(merged.map(item => item.id));
    merged = merged.concat(readLocalList(kind).filter(item => kept.has(item.id) && !present.has(item.id)));
  }
  if (kind === 'logs') {
    merged = merged
      .sort((a, b) => String(b.timestamp ?? '').localeCompare(String(a.timestamp ?? '')))
      .slice(0, MAX_LOGS);
  }
  if (options.keepLocalWhenCloudEmpty && merged.length === 0) return false;
  return writeList(LOCAL_KEYS[kind], merged);
};

const rememberRefused = (kind: SyncKind, user: StaffUser, refused: WithId[], cloudIds: Set<string>) => {
  if (!refused.length) return;
  const kept = readKeptIds(kind, user);
  refused.filter(item => !cloudIds.has(item.id)).forEach(item => kept.add(item.id));
  writeJson(keptKey(kind, user.id), [...kept]);
};

// Envio direto recusado de vez: o item fica no aparelho (como na primeira subida).
const keepRefusedPush = (kind: SyncKind, item: unknown, user: StaffUser) => {
  if (kind === 'settings' || !hasId(item)) return;
  rememberRefused(kind, user, [item], new Set());
};

const rowsToItems = (rows: SalonRow<unknown>[]): WithId[] =>
  rows.filter(row => isRecord(row.payload)).map(row => ({ ...(row.payload as Record<string, unknown>), id: row.id }));

const syncList = async (kind: Exclude<SyncKind, 'settings' | typeof PROFESSIONALS>, user: SyncUser | undefined, readCloud: () => Promise<WithId[]>): Promise<boolean> => {
  const items = await readCloud();

  if (isStaffUser(user) && !isSeeded(kind, user)) {
    if (seedingBlocked(user)) return false; // sem subida, aparelho intacto
    const cloudIds = new Set(items.map(item => item.id));
    const toSend = readLocalList(kind).filter(item => !cloudIds.has(item.id) && canSeed(kind, item, user));
    const refused = await seedWrites(toSend, batch => writesFor(kind, batch, kind === 'logs' ? logOwnerOf(user) : undefined), user.role);
    const refusedIds = new Set(refused.map(item => item.id));
    items.push(...toSend.filter(item => !refusedIds.has(item.id)));
    rememberRefused(kind, user, refused, cloudIds);
    markSeeded(kind, user);
  }

  return writeMerged(kind, items, user);
};

const hasPrivateData = (item: WithId) =>
  PRIVATE_PROFESSIONAL_FIELDS.some(field => typeof item[field] === 'string' && item[field] !== '');

const privatePartOf = (item: WithId | undefined): Partial<ProfessionalPrivate> | undefined => {
  if (!item) return undefined;
  const part: Partial<ProfessionalPrivate> = {};
  for (const field of PRIVATE_PROFESSIONAL_FIELDS) {
    const value = item[field];
    if (typeof value === 'string') part[field] = value;
  }
  return part;
};

// Profissionais: parte pública e parte privada são conferidas e subidas cada uma
// pela própria tabela. Sem linha privada na nuvem (ou sem poder lê-la), os campos
// privados do aparelho são mantidos: nunca viram '' por falta de dado na nuvem.
const syncProfessionals = async (user: SyncUser | undefined): Promise<boolean> => {
  const publicRows = await CloudSalonData.list<ProfessionalPublic>(TABLES.professionals);
  const publicItems = rowsToItems(publicRows);

  let privateById: Map<string, Partial<ProfessionalPrivate>> | undefined;
  if (isStaffUser(user)) {
    try {
      const privateRows = await CloudSalonData.list<ProfessionalPrivate>(TABLES.professionalPrivate, user.role);
      privateById = new Map();
      for (const row of privateRows) if (isRecord(row.payload)) privateById.set(row.id, row.payload);
    } catch (error) {
      if (!(error instanceof CloudTableMissingError)) console.warn('Parte privada das profissionais não carregada:', error);
    }
  }

  const local = readLocalList(PROFESSIONALS);
  const localById = new Map(local.map(item => [item.id, item]));

  // Só a admin faz a primeira subida das profissionais (parte pública e privada).
  if (isStaffUser(user) && user.role === 'admin' && !isSeeded(PROFESSIONALS, user)) {
    const publicIds = new Set(publicItems.map(item => item.id));
    const allowed = local.filter(item => canSeed(PROFESSIONALS, item, user));
    const publicToSend = allowed.filter(item => !publicIds.has(item.id));
    const refusedPublic = await seedWrites(publicToSend, batch => [publicProfessionalsWrite(batch)], user.role);
    const refusedPublicIds = new Set(refusedPublic.map(item => item.id));
    publicItems.push(...publicToSend.filter(item => !refusedPublicIds.has(item.id)));
    rememberRefused(PROFESSIONALS, user, refusedPublic, publicIds);

    // Sem conseguir ler a parte privada não dá para saber o que falta: não marca.
    if (privateById) {
      const privateMap = privateById;
      const privateToSend = allowed.filter(item => !privateMap.has(item.id) && hasPrivateData(item));
      const refusedPrivate = new Set((await seedWrites(privateToSend, batch => [privateProfessionalsWrite(batch)], user.role)).map(item => item.id));
      privateToSend.filter(item => !refusedPrivate.has(item.id)).forEach(item => privateMap.set(item.id, privatePartOf(item) ?? {}));
      markSeeded(PROFESSIONALS, user);
    }
  }

  const joined = publicItems.map(item => {
    const cloudPrivate = privateById?.get(item.id);
    const privatePart = cloudPrivate ?? privatePartOf(localById.get(item.id));
    return joinProfessional(item as unknown as ProfessionalPublic, privatePart) as unknown as WithId;
  });
  return writeMerged(PROFESSIONALS, joined, user, { keepLocalWhenCloudEmpty: true });
};

const syncSettings = async (user: SyncUser | undefined): Promise<boolean> => {
  const rows = await CloudSalonData.list<unknown>(TABLES.settings);
  const row = rows.find(candidate => candidate.id === SETTINGS_ROW_ID && isRecord(candidate.payload));
  const pendingEntry = pendingOf(user).reverse().find(entry => entry.kind === 'settings' && entry.op === 'upsert' && isRecord(entry.item));
  if (pendingEntry) return writeJson(LOCAL_KEYS.settings, pendingEntry.item);
  if (row) return writeJson(LOCAL_KEYS.settings, row.payload);

  // Nuvem sem configuração: a admin sobe a do aparelho. Se falhar, não vai para a
  // fila: o próximo pull tenta de novo (e não sobrescreve se outra admin subir antes).
  const local = readJson(LOCAL_KEYS.settings);
  if (isStaffUser(user) && user.role === 'admin' && isRecord(local)) await writeItems('settings', [local as WithId], user);
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

const doPull = async (user?: SyncUser): Promise<boolean> => {
  if (isStaffUser(user)) await flushOutbox(user);
  const results: boolean[] = [];

  results.push(await safely(() => syncSettings(user)));
  results.push(await safely(() => syncProfessionals(user)));

  if (isStaffUser(user)) {
    const role = user.role;
    // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
    for (const kind of ['payments', 'blocks', 'waitlist'] as const) {
      results.push(await safely(() => syncList(kind, user, async () => rowsToItems(await CloudSalonData.list(TABLES[kind], role)))));
    }
    if (role === 'admin') {
      // A leitura traz todos os logs do salão; o aparelho guarda só os 500 mais novos.
      results.push(await safely(() => syncList('logs', user, async () => rowsToItems(await CloudSalonData.list(TABLES.logs, role)))));
    }
  }
  return results.some(Boolean);
};

export const SalonDataSync = {
  // Puxa da nuvem para o aparelho. `user`: quem está logada (sem login: só os dados
  // públicos). Devolve true se alguma chave do aparelho mudou. Nunca lança erro.
  async pull(user?: SyncUser): Promise<boolean> {
    if (!hasStorage()) return false;
    activePulls += 1;
    try {
      if (!CloudSalonData.isConfigured()) return false;
      return await doPull(user);
    } catch (error) {
      console.warn('Sincronização com a nuvem adiada:', error);
      return false;
    } finally {
      activePulls -= 1;
      releaseDeferred();
    }
  },

  // Envia um item para a nuvem. A entrada vai para a fila (da usuária) ANTES do
  // envio e sai quando a nuvem confirma; assim um pull no meio do envio não tira
  // o item do aparelho. Falha passageira → fica na fila para o próximo pull.
  // Recusa definitiva (403, 400...) → sai da fila, aviso no console, e o item
  // continua no aparelho. Tabela ainda não criada → sai da fila (o pull também
  // não mexe nessa lista). Sem configuração ou sem login de equipe → nada.
  // Log de profissional vai com o id dela. Nunca lança erro.
  async push(kind: SyncKind, item: unknown, user?: SyncUser): Promise<void> {
    if (!hasStorage() || !isStaffUser(user) || !isRecord(item)) return;
    if (kind !== 'settings' && !hasId(item)) return;
    const entry: OutboxEntry = { kind, op: 'upsert', item, userId: user.id };
    const key = flightKey(entry);
    let queuedEntry = false;
    try {
      if (!CloudSalonData.isConfigured()) return;
      enqueue(entry);
      queuedEntry = true;
      markInFlight(key);
      await writeItems(kind, [item as WithId], user);
      finishEntry(entry);
    } catch (error) {
      if (!queuedEntry || isTemporary(error)) return;
      dequeue(entry);
      if (error instanceof CloudTableMissingError) return;
      console.warn('A nuvem recusou o envio; o item continua só neste aparelho.', kind, statusOf(error));
      keepRefusedPush(kind, item, user);
    } finally {
      if (queuedEntry) unmarkInFlight(key);
    }
  },

  // Exclusão de bloqueio, com a mesma regra da fila: entra antes, sai ao confirmar.
  async removeBlock(id: string, user?: SyncUser): Promise<void> {
    if (!hasStorage() || !isStaffUser(user) || !id) return;
    const entry: OutboxEntry = { kind: 'blocks', op: 'delete', item: { id }, userId: user.id };
    const key = flightKey(entry);
    let queuedEntry = false;
    try {
      if (!CloudSalonData.isConfigured()) return;
      enqueue(entry);
      queuedEntry = true;
      markInFlight(key);
      await CloudSalonData.remove(TABLES.blocks, id, user.role);
      finishEntry(entry);
    } catch (error) {
      if (!queuedEntry || isTemporary(error)) return;
      dequeue(entry);
      if (!(error instanceof CloudTableMissingError)) console.warn('A nuvem recusou a exclusão:', statusOf(error));
    } finally {
      if (queuedEntry) unmarkInFlight(key);
    }
  }
};
