// Quem trabalha em cada salão, com WhatsApp, cor e agenda do Google, lido do banco.
// A LEV completa o que faltar com os dados de fábrica (levDefaults); outro salão
// nunca recebe dados nem a agenda da LEV.
import { LEV_PROFESSIONALS, LEV_SALON, LEV_SALON_ID } from './levDefaults.js';
import { serviceHeaders, supabaseConfig } from './staffAuth.js';
import { assertSalonId, salonFilter } from './tenant.js';

export type SalonProfessional = { id: string; name: string; whatsapp: string; googleColorId: string; googleCalendarId: string | null };
export type SalonDirectory = { salonId: string; name: string; shortName: string; professionals: SalonProfessional[] };

const CACHE_MS = 60_000;
const DEFAULT_COLOR_ID = '0';
const cache = new Map<string, { expiresAt: number; directory: SalonDirectory }>();

// Só para os testes
export const resetSalonDirectoryCache = () => cache.clear();

type ProfessionalRow = { id?: unknown; payload?: { name?: unknown; whatsapp?: unknown } | null };
type CalendarRow = { professional_id?: unknown; google_calendar_id?: unknown };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const digits = (value: unknown) => text(value).replace(/\D/g, '');

// Lê uma tabela com a chave de serviço. Qualquer falha (rede, 4xx, 5xx) → null.
const readRows = async <T>(address: (supabaseUrl: string) => string): Promise<T[] | null> => {
  try {
    const { url, serviceKey } = supabaseConfig();
    const response = await fetch(address(url), { headers: serviceHeaders(serviceKey) });
    if (!response.ok) return null;
    const rows = await response.json() as unknown;
    return Array.isArray(rows) ? rows as T[] : null;
  } catch {
    return null;
  }
};

const byName = (a: SalonProfessional, b: SalonProfessional) => a.name.localeCompare(b.name, 'pt-BR');

const buildDirectory = async (salonId: string): Promise<{ directory: SalonDirectory; complete: boolean }> => {
  const [salons, settings, professionalRows, calendarRows] = await Promise.all([
    readRows<{ name?: unknown }>(base => `${base}/rest/v1/salons?id=eq.${salonId}&select=name`),
    readRows<{ payload?: { brand?: { shortName?: unknown } } | null }>(base => `${base}/rest/v1/salon_settings?id=eq.geral&select=payload&${salonFilter(salonId)}`),
    readRows<ProfessionalRow>(base => `${base}/rest/v1/professionals?select=id,payload&${salonFilter(salonId)}`),
    // Tabela da migração 20261108: se ainda não existir, segue sem ela
    readRows<CalendarRow>(base => `${base}/rest/v1/professional_calendars?select=professional_id,google_calendar_id&${salonFilter(salonId)}`)
  ]);
  const isLev = salonId === LEV_SALON_ID;
  const calendars = new Map<string, string>();
  for (const row of calendarRows || []) {
    const id = text(row.professional_id); const calendarId = text(row.google_calendar_id);
    if (id && calendarId) calendars.set(id, calendarId);
  }

  const fromDb = new Map<string, SalonProfessional>();
  for (const row of professionalRows || []) {
    const id = text(row.id);
    if (!id) continue;
    fromDb.set(id, {
      id,
      name: text(row.payload?.name),
      whatsapp: digits(row.payload?.whatsapp),
      googleColorId: DEFAULT_COLOR_ID,
      googleCalendarId: calendars.get(id) || null
    });
  }

  let professionals: SalonProfessional[];
  if (isLev) {
    // Ordem de fábrica primeiro (o menu do WhatsApp da LEV não muda), extras do banco depois
    const known = LEV_PROFESSIONALS.map(lev => {
      const db = fromDb.get(lev.id);
      return {
        id: lev.id,
        name: db?.name || lev.name,
        whatsapp: db?.whatsapp || lev.whatsapp,
        googleColorId: lev.googleColorId,
        googleCalendarId: calendars.get(lev.id) || text(process.env[lev.calendarEnv]) || null
      };
    });
    const extras = [...fromDb.values()].filter(p => !LEV_PROFESSIONALS.some(lev => lev.id === p.id));
    professionals = [...known, ...extras.map(p => ({ ...p, name: p.name || p.id })).sort(byName)];
  } else {
    professionals = [...fromDb.values()].map(p => ({ ...p, name: p.name || p.id })).sort(byName);
  }

  const dbName = text(salons?.[0]?.name);
  const dbShortName = text(settings?.[0]?.payload?.brand?.shortName);
  const name = dbName || (isLev ? LEV_SALON.name : salonId);
  const shortName = dbShortName || (isLev ? LEV_SALON.shortName : name);
  return {
    directory: { salonId, name, shortName, professionals },
    complete: salons !== null && settings !== null && professionalRows !== null
  };
};

// Nunca lança: banco fora do ar → LEV com os dados de fábrica, outro salão sem profissionais.
export const loadSalonDirectory = async (salonId: string): Promise<SalonDirectory> => {
  const id = assertSalonId(salonId);
  const cached = cache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.directory;
  const { directory, complete } = await buildDirectory(id);
  // Leitura com falha não fica guardada: na próxima chamada tenta o banco de novo
  if (complete) cache.set(id, { expiresAt: Date.now() + CACHE_MS, directory });
  return directory;
};

export const findProfessional = (dir: SalonDirectory, id: string): SalonProfessional | undefined =>
  dir.professionals.find(professional => professional.id === id);

// Agenda do Google da profissional. A agenda geral (GOOGLE_CALENDAR_ID) é só da LEV.
export const calendarIdFor = (dir: SalonDirectory, professionalId: string): string | null => {
  const own = findProfessional(dir, professionalId)?.googleCalendarId;
  if (own) return own;
  if (dir.salonId === LEV_SALON_ID) return text(process.env.GOOGLE_CALENDAR_ID) || null;
  return null;
};
