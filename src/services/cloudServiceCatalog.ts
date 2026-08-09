import { INITIAL_SERVICES } from '../data/initialData';
import { Service, User } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

type CatalogRecord = { id: string; professional_id: string; payload: Service | null; deleted: boolean };

const config = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('O catÃ¡logo online ainda nÃ£o estÃ¡ configurado.');
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY };
};

const accessToken = (role?: User['role']) => {
  if (typeof sessionStorage === 'undefined') return undefined;
  const key = role === 'admin' ? 'lev_admin_session_v1' : 'lev_professional_session_v1';
  try { return (JSON.parse(sessionStorage.getItem(key) || '{}') as { accessToken?: string }).accessToken; }
  catch { return undefined; }
};

const headers = (token?: string) => {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json' };
};

const records = (services: Service[]): CatalogRecord[] => services.map(service => ({
  id: service.id, professional_id: service.professionalId, payload: service, deleted: false
}));

const upsert = async (items: CatalogRecord[], role: User['role']) => {
  if (!items.length) return;
  const { url } = config();
  const token = accessToken(role);
  if (!token) throw new Error('Sua sessÃ£o expirou. Entre novamente para publicar as alteraÃ§Ãµes.');
  const response = await fetch(`${url}/rest/v1/catalog_services?on_conflict=id`, {
    method: 'POST',
    headers: { ...headers(token), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(items.map(item => ({ ...item, updated_at: new Date().toISOString() })))
  });
  if (!response.ok) throw new Error('NÃ£o foi possÃ­vel publicar o catÃ¡logo para as clientes.');
};

export const CloudServiceCatalog = {
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_KEY),

  async load(): Promise<Service[]> {
    if (!this.isConfigured()) return INITIAL_SERVICES;
    const { url } = config();
    const response = await fetch(`${url}/rest/v1/catalog_services?select=id,professional_id,payload,deleted`, { headers: headers() });
    if (!response.ok) throw new Error('NÃ£o foi possÃ­vel atualizar o catÃ¡logo de serviÃ§os.');
    const cloud = await response.json() as CatalogRecord[];
    const merged = new Map(INITIAL_SERVICES.map(service => [service.id, service]));
    cloud.forEach(item => {
      if (item.deleted) merged.delete(item.id);
      else if (item.payload) merged.set(item.id, item.payload);
    });
    return Array.from(merged.values());
  },

  async syncProfessional(localServices: Service[], professionalId: string, role: User['role']) {
    const own = localServices.filter(service => service.professionalId === professionalId);
    const currentIds = new Set(own.map(service => service.id));
    const deletedDefaults: CatalogRecord[] = INITIAL_SERVICES
      .filter(service => service.professionalId === professionalId && !currentIds.has(service.id))
      .map(service => ({ id: service.id, professional_id: professionalId, payload: null, deleted: true }));
    await upsert([...records(own), ...deletedDefaults], role);
  },

  save: (service: Service, role: User['role']) => upsert(records([service]), role),
  remove: (service: Service, role: User['role']) => upsert([
    { id: service.id, professional_id: service.professionalId, payload: null, deleted: true }
  ], role)
};

