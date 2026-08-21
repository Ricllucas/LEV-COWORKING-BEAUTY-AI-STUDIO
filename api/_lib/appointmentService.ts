import { syncGoogleCalendarEvent } from './googleCalendar.js';
import { notificationService } from './notificationService.js';
import { BOOKING_SERVICES } from './bookingCatalog.js';

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
const active = (status: string) => !['cancelado_cliente', 'cancelado_coworking'].includes(status);
const worksOnDate = (professionalId: string, date: string) => {
  const weekday = new Date(`${date}T12:00:00-03:00`).getDay();
  if (weekday === 0) return false;
  if (professionalId === 'prof_talitha') return weekday >= 2 && weekday <= 6;
  return weekday >= 1 && weekday <= 6;
};

type CatalogService = {
  id: string; name: string; professionalId: string; professionalName: string;
  durationMinutes: number; price: number; promotionalPrice?: number;
  active?: boolean; onlineBookingEnabled?: boolean;
};

const canonicalServices = async (ids: string[]): Promise<CatalogService[]> => {
  const requested = [...new Set(ids)].slice(0, 12);
  if (!requested.length || requested.some(id => !/^[a-zA-Z0-9_-]{1,80}$/.test(id))) {
    const error = new Error('Selecione ao menos um serviço válido.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const { url, key } = config();
  const response = await fetch(
    `${url}/rest/v1/catalog_services?select=id,payload,deleted&id=in.(${requested.join(',')})`,
    { headers: authHeaders(key) }
  );
  const cloudRows = response.ok
    ? await response.json() as Array<{ id: string; payload?: CatalogService; deleted?: boolean }>
    : [];
  const cloud = new Map(cloudRows.filter(row => !row.deleted && row.payload).map(row => [row.id, row.payload!]));
  const fallback = new Map(BOOKING_SERVICES.map(service => [service.id, {
    ...service, durationMinutes: service.duration, active: true, onlineBookingEnabled: true
  }]));
  const services = requested.map(id => cloud.get(id) || fallback.get(id)).filter(Boolean) as CatalogService[];
  if (services.length !== requested.length || services.some(service => service.active === false || service.onlineBookingEnabled === false)) {
    const error = new Error('Um dos serviços selecionados não está disponível para agendamento online.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  return services;
};

const canonicalizePublicAppointment = async (appointment: UnifiedAppointment): Promise<UnifiedAppointment> => {
  const services = await canonicalServices(appointment.serviceIds);
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

export const listAppointmentsByDate = async (date: string): Promise<UnifiedAppointment[]> => {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/appointments?appointment_date=eq.${encodeURIComponent(date)}&select=payload`, { headers: authHeaders(key) });
  if (!response.ok) throw new Error('Não foi possível consultar a agenda.');
  const rows = await response.json() as Array<{ payload: UnifiedAppointment }>;
  return rows.map(row => row.payload).filter(item => item && active(item.status));
};

export const assertAvailable = async (appointment: UnifiedAppointment) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const start = toMinutes(appointment.startTime); const end = toMinutes(appointment.endTime);
  if (appointment.date < today || start < 9 * 60 || end > 18 * 60 || end <= start) {
    const error = new Error('Escolha uma data futura e um horário entre 09:00 e 18:00.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  if (!worksOnDate(appointment.professionalId, appointment.date)) {
    const error = new Error(appointment.professionalId === 'prof_talitha'
      ? 'Talitha atende de terça a sábado. Escolha outra data.'
      : 'Esta profissional atende de segunda a sábado. Escolha outra data.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const occupied = await listAppointmentsByDate(appointment.date);
  if (occupied.some(current =>
    current.id !== appointment.id &&
    current.professionalId === appointment.professionalId &&
    start < toMinutes(current.endTime) &&
    end > toMinutes(current.startTime)
  )) {
    const error = new Error('Este horário já está reservado no Studio LEV. Escolha outro horário disponível.');
    (error as Error & { status?: number }).status = 409; throw error;
  }
};

export const availableStartTimes = async (date: string, duration: number, professionalId?: string) => {
  if (professionalId && !worksOnDate(professionalId, date)) return [];
  const occupied = (await listAppointmentsByDate(date)).filter(item =>
    !professionalId || item.professionalId === professionalId
  );
  const result: string[] = [];
  for (let start = 9 * 60; start + duration <= 18 * 60; start += 30) {
    const end = start + duration;
    if (!occupied.some(item => start < toMinutes(item.endTime) && end > toMinutes(item.startTime))) {
      result.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
    }
  }
  return result;
};

export const createUnifiedAppointment = async (appointment: UnifiedAppointment) => {
  const payload = appointment.source === 'site' || !appointment.source
    ? await canonicalizePublicAppointment(appointment)
    : appointment;
  await assertAvailable(payload);
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/appointments?on_conflict=id`, {
    method: 'POST', headers: { ...authHeaders(key), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: payload.id, professional_id: payload.professionalId, appointment_date: payload.date, start_time: payload.startTime, status: payload.status, payload, updated_at: new Date().toISOString() })
  });
  if (!response.ok) {
    const error = new Error(response.status === 409 ? 'Este horário acabou de ser reservado. Escolha outro horário disponível.' : `O servidor recusou o agendamento (${response.status}).`);
    (error as Error & { status?: number }).status = response.status === 409 ? 409 : 500; throw error;
  }
  let calendar: Record<string, unknown> = { synced: false };
  try { calendar = { synced: true, ...await syncGoogleCalendarEvent(payload) }; }
  catch (error) { console.error('Google Calendar sync error:', error); }
  notificationService.notifyNewAppointment({ appointmentId: payload.id, clientName: payload.clientName, clientPhone: payload.clientPhone, professionalName: payload.professionalName, serviceNames: payload.serviceNames, date: payload.date, startTime: payload.startTime, endTime: payload.endTime, status: payload.status }, payload.professionalId)
    .catch(error => console.error('Notification error:', error));
  return { saved: true, calendar, appointment: payload };
};

