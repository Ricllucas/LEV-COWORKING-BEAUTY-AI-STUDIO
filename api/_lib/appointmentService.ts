import { syncGoogleCalendarEvent } from './googleCalendar.js';
import { notificationService } from './notificationService.js';
import { LEV_BOOKING_SERVICES, LEV_SALON_ID } from './levDefaults.js';
import { RETIRED_SERVICE_IDS } from '../../src/data/retiredServices.js';
import { salonFilter, withSalon } from './tenant.js';

export type UnifiedAppointment = {
  id: string; clientId: string; clientName: string; clientPhone: string; clientEmail?: string;
  professionalId: string; professionalName: string; serviceIds: string[]; serviceNames: string[];
  date: string; startTime: string; endTime: string; totalDurationMinutes: number; totalPrice: number;
  depositPaid: number; remainingPrice: number; status: string; paymentStatus: string; notes?: string;
  createdAt: string; updatedAt: string; createdBy: string; source?: 'site' | 'whatsapp' | 'admin';
};

const config = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Servidor de agendamentos não configurado.');
  return { url, key };
};
const authHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}` });
const toMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
export const addMinutes = (time: string, duration: number) => {
  const total = toMinutes(time) + duration;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
// Data de hoje e minutos desde a meia-noite, em Brasília
const brasiliaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const brasiliaNowMinutes = () => toMinutes(new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }));
const active = (status: string) => !['cancelado_cliente', 'cancelado_coworking'].includes(status);
const worksOnDate = (professionalId: string, date: string) => {
  const weekday = new Date(`${date}T12:00:00-03:00`).getDay();
  return weekday >= 2 && weekday <= 6;
};

type CatalogService = {
  id: string; name: string; professionalId: string; professionalName: string;
  durationMinutes: number; price: number; promotionalPrice?: number;
  active?: boolean; onlineBookingEnabled?: boolean; catalogVersion?: number;
};

const canonicalServices = async (salonId: string, ids: string[]): Promise<CatalogService[]> => {
  const requested = [...new Set(ids)].slice(0, 12);
  if (!requested.length || requested.some(id => !/^[a-zA-Z0-9_-]{1,80}$/.test(id))) {
    const error = new Error('Selecione ao menos um serviço válido.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const { url, key } = config();
  const response = await fetch(
    `${url}/rest/v1/catalog_services?select=id,payload,deleted&id=in.(${requested.join(',')})&${salonFilter(salonId)}`,
    { headers: authHeaders(key) }
  );
  if (!response.ok) console.error('[CATALOGO] Não foi possível ler catalog_services:', response.status);
  const cloudRows = response.ok
    ? await response.json() as Array<{ id: string; payload?: CatalogService; deleted?: boolean }>
    : [];
  const cloud = new Map(cloudRows.filter(row => !row.deleted && row.payload).map(row => [row.id, row.payload!]));
  // Lista de fábrica só vale para a LEV; outro salão depende só do banco
  const bundledList = salonId === LEV_SALON_ID ? LEV_BOOKING_SERVICES : [];
  const fallback = new Map(bundledList.map(service => [service.id, {
    ...service, durationMinutes: service.duration, active: true, onlineBookingEnabled: true
  }]));
  // Mesma regra do site: a versão oficial do código vence um registro online mais antigo
  const pick = (id: string) => {
    const online = cloud.get(id);
    const bundled = fallback.get(id);
    if (online && bundled && (bundled.catalogVersion || 0) > (online.catalogVersion || 0)) return bundled;
    return online || bundled;
  };
  const services = requested.filter(id => !RETIRED_SERVICE_IDS.has(id)).map(pick).filter(Boolean) as CatalogService[];
  if (services.length !== requested.length || services.some(service => service.active === false || service.onlineBookingEnabled === false)) {
    const error = new Error('Um dos serviços selecionados não está disponível para agendamento online.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  return services;
};

const canonicalizePublicAppointment = async (salonId: string, appointment: UnifiedAppointment): Promise<UnifiedAppointment> => {
  const services = await canonicalServices(salonId, appointment.serviceIds);
  if (services.some(service => service.professionalId !== appointment.professionalId)) {
    const error = new Error('Os serviços selecionados não pertencem à profissional informada.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const duration = services.reduce((sum, service) => sum + Number(service.durationMinutes || 0), 0);
  const total = services.reduce((sum, service) => sum + Number(service.promotionalPrice ?? service.price ?? 0), 0);
  if (duration < 15 || duration > 8 * 60 || total < 0 || !Number.isFinite(total)) {
    const error = new Error('A configuração do serviço selecionado é inválida.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const now = new Date().toISOString();
  return {
    ...appointment,
    professionalName: services[0].professionalName,
    serviceIds: services.map(service => service.id),
    serviceNames: services.map(service => service.name),
    endTime: addMinutes(appointment.startTime, duration),
    totalDurationMinutes: duration,
    totalPrice: total,
    depositPaid: 0,
    remainingPrice: total,
    status: 'aguardando_confirmacao',
    paymentStatus: 'pendente',
    createdAt: now,
    updatedAt: now,
    createdBy: appointment.clientName,
    source: 'site'
  };
};

export const listAppointmentsByDate = async (salonId: string, date: string): Promise<UnifiedAppointment[]> => {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/appointments?appointment_date=eq.${encodeURIComponent(date)}&select=payload&${salonFilter(salonId)}`, { headers: authHeaders(key) });
  if (!response.ok) throw new Error('Não foi possível consultar a agenda.');
  const rows = await response.json() as Array<{ payload: UnifiedAppointment }>;
  return rows.map(row => row.payload).filter(item => item && active(item.status));
};

// Bloqueio de horário visto pelo público: só quem, quando e de que horas a que horas.
// Título e motivo ficam fora (podem ser pessoais).
export type PublicScheduleBlock = { professionalId: string; date: string; startTime: string; endTime: string };

const MISSING_TABLE_CODES = new Set(['PGRST205', '42P01']);
const isTime = (value: unknown): value is string => typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);

// Lê os bloqueios do salão no dia. Tabela ainda não criada (migração não rodada) → lista vazia.
export const listBlocksByDate = async (salonId: string, date: string): Promise<PublicScheduleBlock[]> => {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/schedule_blocks?select=professional_id,payload&payload->>date=eq.${encodeURIComponent(date)}&${salonFilter(salonId)}`, { headers: authHeaders(key) });
  if (!response.ok) {
    if (response.status === 404) return [];
    const body = await response.json().catch(() => null) as { code?: string } | null;
    if (body?.code && MISSING_TABLE_CODES.has(body.code)) return [];
    throw new Error('Não foi possível consultar os bloqueios da agenda.');
  }
  const rows = await response.json() as Array<{ professional_id?: string | null; payload?: Record<string, unknown> | null }>;
  return rows.flatMap(row => {
    const payload = row.payload ?? {};
    // A coluna é a que o banco confere (a profissional só grava a própria).
    // Texto interno apontando outra profissional → linha ignorada.
    const professionalId = row.professional_id;
    if (!professionalId || (payload.professionalId !== undefined && payload.professionalId !== professionalId)) return [];
    if (payload.date !== date || !isTime(payload.startTime) || !isTime(payload.endTime)) return [];
    return [{ professionalId, date, startTime: payload.startTime, endTime: payload.endTime }];
  });
};

const overlaps = (start: number, end: number, item: { startTime: string; endTime: string }) =>
  start < toMinutes(item.endTime) && end > toMinutes(item.startTime);

export const assertAvailable = async (
  salonId: string,
  appointment: UnifiedAppointment,
  options?: { allowStaffMonday?: boolean; allowStaffRetrospective?: boolean; allowStaffOverBlocks?: boolean }
) => {
  const today = brasiliaToday();
  const start = toMinutes(appointment.startTime); const end = toMinutes(appointment.endTime);
  const retrospectiveStaffEntry = options?.allowStaffRetrospective === true && appointment.date <= today;
  const alreadyStarted = appointment.date === today && start <= brasiliaNowMinutes();
  const invalidDate = (appointment.date < today || alreadyStarted) && !retrospectiveStaffEntry;
  const invalidHours = start < 9 * 60 || start >= 18 * 60 || end <= start || (!retrospectiveStaffEntry && end > 18 * 60);
  if (invalidDate || invalidHours) {
    const error = new Error('Escolha uma data futura e um horário entre 09:00 e 18:00.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const weekday = new Date(`${appointment.date}T12:00:00-03:00`).getDay();
  const worksThisDate = worksOnDate(appointment.professionalId, appointment.date)
    || (options?.allowStaffMonday === true && weekday === 1);
  if (!worksThisDate) {
    const error = new Error('Esta profissional atende de terça a sábado. Escolha outra data.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const occupied = await listAppointmentsByDate(salonId, appointment.date);
  if (occupied.some(current =>
    current.id !== appointment.id &&
    current.professionalId === appointment.professionalId &&
    start < toMinutes(current.endTime) &&
    end > toMinutes(current.startTime)
  )) {
    const error = new Error('Este horário já está reservado no Studio LEV. Escolha outro horário disponível.');
    (error as Error & { status?: number }).status = 409; throw error;
  }
  // A equipe pode encaixar em cima de um bloqueio; cliente (site e WhatsApp) não.
  if (options?.allowStaffOverBlocks !== true) {
    const blocks = await listBlocksByDate(salonId, appointment.date);
    if (blocks.some(block => block.professionalId === appointment.professionalId && overlaps(start, end, block))) {
      const error = new Error('Este horário está bloqueado pela profissional. Escolha outro horário.');
      (error as Error & { status?: number }).status = 409; throw error;
    }
  }
};

export const availableStartTimes = async (salonId: string, date: string, duration: number, professionalId?: string) => {
  if (professionalId && !worksOnDate(professionalId, date)) return [];
  const [appointments, blocks] = await Promise.all([listAppointmentsByDate(salonId, date), listBlocksByDate(salonId, date)]);
  const occupied = [...appointments, ...blocks].filter(item =>
    !professionalId || item.professionalId === professionalId
  );
  const result: string[] = [];
  const firstStart = date === brasiliaToday() ? brasiliaNowMinutes() + 1 : 0;
  for (let start = 9 * 60; start + duration <= 18 * 60; start += 30) {
    if (start < firstStart) continue;
    const end = start + duration;
    if (!occupied.some(item => start < toMinutes(item.endTime) && end > toMinutes(item.startTime))) {
      result.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
    }
  }
  return result;
};

export const createUnifiedAppointment = async (
  salonId: string,
  appointment: UnifiedAppointment,
  options?: { allowStaffMonday?: boolean; allowStaffRetrospective?: boolean; allowStaffOverBlocks?: boolean }
) => {
  const payload = appointment.source === 'site' || !appointment.source
    ? await canonicalizePublicAppointment(salonId, appointment)
    : appointment;
  await assertAvailable(salonId, payload, options);
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/appointments?on_conflict=id`, {
    method: 'POST', headers: { ...authHeaders(key), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(withSalon({ id: payload.id, professional_id: payload.professionalId, appointment_date: payload.date, start_time: payload.startTime, status: payload.status, payload, updated_at: new Date().toISOString() }, salonId))
  });
  if (!response.ok) {
    const error = new Error(response.status === 409 ? 'Este horário acabou de ser reservado. Escolha outro horário disponível.' : `O servidor recusou o agendamento (${response.status}).`);
    (error as Error & { status?: number }).status = response.status === 409 ? 409 : 500; throw error;
  }
  let calendar: Record<string, unknown> = { synced: false };
  try {
    const result = await syncGoogleCalendarEvent(payload, salonId);
    calendar = { synced: !('skipped' in result), ...result };
  }
  catch (error) { console.error('Google Calendar sync error:', error); }
  notificationService.notifyNewAppointment({ appointmentId: payload.id, clientName: payload.clientName, clientPhone: payload.clientPhone, professionalName: payload.professionalName, serviceNames: payload.serviceNames, date: payload.date, startTime: payload.startTime, endTime: payload.endTime, status: payload.status }, payload.professionalId)
    .catch(error => console.error('Notification error:', error));
  return { saved: true, calendar, appointment: payload };
};


// Limite do site público: cada telefone pode ter poucos pedidos aguardando
// confirmação, para ninguém lotar a agenda com agendamentos falsos.
export const MAX_PENDING_PER_PHONE = 2;
export const phoneKey = (phone: string) => String(phone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');

export const countPendingForPhone = (appointments: Array<Pick<UnifiedAppointment, 'clientPhone' | 'status'>>, phone: string) => {
  const key = phoneKey(phone);
  return appointments.filter(item => item?.status === 'aguardando_confirmacao' && phoneKey(item.clientPhone) === key).length;
};

export const assertPublicBookingLimit = async (salonId: string, phone: string) => {
  const key = phoneKey(phone);
  if (key.length < 10 || key.length > 11) {
    const error = new Error('Informe um celular válido com DDD.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const { url, key: serviceKey } = config();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const response = await fetch(
    `${url}/rest/v1/appointments?appointment_date=gte.${today}&status=eq.aguardando_confirmacao&select=payload&${salonFilter(salonId)}`,
    { headers: authHeaders(serviceKey) }
  );
  if (!response.ok) throw new Error('Não foi possível consultar a agenda.');
  const rows = await response.json() as Array<{ payload: UnifiedAppointment }>;
  if (countPendingForPhone(rows.map(row => row.payload), phone) >= MAX_PENDING_PER_PHONE) {
    const error = new Error('Você já tem pedidos de agendamento aguardando confirmação. Aguarde a profissional confirmar ou fale com a LEV pelo WhatsApp.');
    (error as Error & { status?: number }).status = 429;
    throw error;
  }
};
