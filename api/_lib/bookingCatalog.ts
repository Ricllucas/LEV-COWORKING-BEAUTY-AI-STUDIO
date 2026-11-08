import { RETIRED_SERVICE_IDS } from '../../src/data/retiredServices.js';
import { LEV_BOOKING_SERVICES, LEV_SALON_ID } from './levDefaults.js';
import { serviceHeaders, supabaseConfig } from './staffAuth.js';
import { salonFilter } from './tenant.js';

export type BookingService = { id: string; name: string; professionalId: string; professionalName: string; duration: number; price: number; catalogVersion?: number };

type CatalogPayload = {
  name?: unknown; professionalId?: unknown; professionalName?: unknown; durationMinutes?: unknown; price?: unknown;
  promotionalPrice?: unknown; catalogVersion?: unknown; active?: unknown; onlineBookingEnabled?: unknown;
};
type CatalogRow = { id?: unknown; payload?: CatalogPayload | null; deleted?: unknown };

const readCatalog = async (salonId: string): Promise<CatalogRow[] | null> => {
  try {
    const { url, serviceKey } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/catalog_services?select=id,payload,deleted&${salonFilter(salonId)}`, { headers: serviceHeaders(serviceKey) });
    if (!response.ok) return null;
    const rows = await response.json() as unknown;
    return Array.isArray(rows) ? rows as CatalogRow[] : null;
  } catch {
    return null;
  }
};

const toService = (row: CatalogRow): BookingService | null => {
  const id = typeof row.id === 'string' ? row.id : '';
  const p = row.payload;
  if (!id || !p || row.deleted === true || p.active === false || p.onlineBookingEnabled === false) return null;
  const name = typeof p.name === 'string' ? p.name : '';
  const professionalId = typeof p.professionalId === 'string' ? p.professionalId : '';
  const duration = Number(p.durationMinutes);
  const price = Number(p.promotionalPrice ?? p.price ?? 0);
  if (!name || !professionalId || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(price)) return null;
  const catalogVersion = Number(p.catalogVersion) || 0;
  return {
    id, name, professionalId,
    professionalName: typeof p.professionalName === 'string' ? p.professionalName : '',
    duration, price,
    ...(catalogVersion ? { catalogVersion } : {})
  };
};

// Serviços que a cliente pode agendar (menu do WhatsApp), sem os apagados.
// A LEV completa com a lista de fábrica os ids que o banco não tiver; outro salão usa só o banco.
export const loadBookingServices = async (salonId: string): Promise<BookingService[]> => {
  const rows = await readCatalog(salonId);
  const live = (rows || []).filter(row => row.deleted !== true);
  const present = new Set(live.map(row => String(row.id)));
  const online = live.map(toService).filter((service): service is BookingService => Boolean(service));
  if (salonId !== LEV_SALON_ID) return online.filter(service => !RETIRED_SERVICE_IDS.has(service.id));

  const onlineById = new Map(online.map(service => [service.id, service]));
  // Mesma regra do agendamento pelo site: a versão de fábrica vence um registro online mais antigo.
  // A ordem de fábrica vem primeiro, para o menu da LEV não mudar.
  const known = LEV_BOOKING_SERVICES.flatMap(bundled => {
    const current = onlineById.get(bundled.id);
    if (current && (bundled.catalogVersion || 0) <= (current.catalogVersion || 0)) return [current];
    if (current || !present.has(bundled.id)) return [bundled];
    return []; // está no banco, mas desativado para agendamento online
  });
  const extras = online.filter(service => !LEV_BOOKING_SERVICES.some(bundled => bundled.id === service.id));
  return [...known, ...extras].filter(service => !RETIRED_SERVICE_IDS.has(service.id));
};
