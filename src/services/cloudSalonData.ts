import { User } from '../types';
import { CURRENT_SALON_ID, salonFilter, withSalon } from '../config/salon';
import { getFreshAccessToken } from './staffSession';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// tenant-guard: sem-filtro lista de nomes de tabela (tipo), nenhuma consulta aqui
export type SalonTable = 'salon_settings' | 'professionals' | 'professional_private' | 'payments' | 'schedule_blocks' | 'waitlist' | 'audit_logs';

export type SalonRow<T> = { id: string; professionalId?: string; payload: T };

type CloudRecord<T> = { id: string; professional_id: string | null; payload: T };

// A tabela ainda não foi criada no banco (migração não rodada).
export class CloudTableMissingError extends Error {
  constructor(table: string) {
    super(`A tabela ${table} ainda não existe na nuvem.`);
    this.name = 'CloudTableMissingError';
  }
}

const config = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Os dados online do salão ainda não estão configurados.');
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY };
};

const headers = (token?: string) => {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json' };
};

const MISSING_TABLE_CODES = new Set(['PGRST205', '42P01']);

const failIfNotOk = async (response: Response, table: SalonTable, what: string, tolerate409 = false) => {
  if (response.ok) return;
  if (tolerate409 && response.status === 409) return;
  const details = await response.text().catch(() => '');
  if (response.status === 404) throw new CloudTableMissingError(table);
  if (response.status === 400) {
    let code: string | undefined;
    try { code = (JSON.parse(details) as { code?: string }).code; } catch { code = undefined; }
    if (code && MISSING_TABLE_CODES.has(code)) throw new CloudTableMissingError(table);
  }
  console.error(`Falha ao ${what} (${table}):`, response.status, details);
  throw new Error(`Não foi possível ${what} (erro ${response.status}).`);
};

const requireToken = async (role: User['role']) => {
  const token = await getFreshAccessToken(role);
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para sincronizar os dados do salão.');
  return token;
};

export const CloudSalonData = {
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_KEY),

  // Sem `role`: chave pública (só serve para salon_settings e professionals).
  async list<T>(table: SalonTable, role?: User['role']): Promise<SalonRow<T>[]> {
    const { url } = config();
    const token = role ? await requireToken(role) : undefined;
    const response = await fetch(`${url}/rest/v1/${table}?select=id,professional_id,payload&${salonFilter(CURRENT_SALON_ID)}`, {
      headers: headers(token),
      cache: 'no-store'
    });
    await failIfNotOk(response, table, 'carregar os dados do salão');
    const records = await response.json() as CloudRecord<T>[];
    return records.map(record => ({
      id: record.id,
      ...(record.professional_id ? { professionalId: record.professional_id } : {}),
      payload: record.payload
    }));
  },

  // `insertOnly`: tabelas só de inclusão (audit_logs) ignoram duplicadas; 409 conta como sucesso.
  async upsert<T>(table: SalonTable, rows: SalonRow<T>[], role: User['role'], options?: { insertOnly?: boolean }): Promise<void> {
    if (!rows.length) return;
    const { url } = config();
    const token = await requireToken(role);
    const insertOnly = Boolean(options?.insertOnly);
    const response = await fetch(`${url}/rest/v1/${table}?on_conflict=salon_id,id`, {
      method: 'POST',
      headers: {
        ...headers(token),
        Prefer: `resolution=${insertOnly ? 'ignore' : 'merge'}-duplicates,return=minimal`
      },
      body: JSON.stringify(rows.map(row => withSalon({
        id: row.id,
        professional_id: row.professionalId ?? null,
        payload: row.payload,
        updated_at: new Date().toISOString()
      }, CURRENT_SALON_ID)))
    });
    await failIfNotOk(response, table, 'salvar os dados do salão', insertOnly);
  },

  async remove(table: SalonTable, id: string, role: User['role']): Promise<void> {
    const { url } = config();
    const token = await requireToken(role);
    const response = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&${salonFilter(CURRENT_SALON_ID)}`, {
      method: 'DELETE',
      headers: { ...headers(token), Prefer: 'return=minimal' }
    });
    await failIfNotOk(response, table, 'remover o registro');
  }
};
