import { syncGoogleCalendarEvent } from './googleCalendar.js';
import { notificationService } from './notificationService.js';

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

export const listAppointmentsByDate = async (date: string): Promise<UnifiedAppointment[]> => {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/appointments?appointment_date=eq.${encodeURIComponent(date)}&select=payload`, { headers: authHeaders(key) });
  if (!response.ok) throw new Error('Não foi possível consultar a agenda.');
  const rows = await response.json() as Array<{ payload: UnifiedAppointment }>;
  return rows.map(row => row.payload).filter(item => item && active(item.status));
};

export const assertAvailable = async (appointment: UnifiedAppointment) => {
  const occupied = await listAppointmentsByDate(appointment.date);
  const start = toMinutes(appointment.startTime); const end = toMinutes(appointment.endTime);
  if (occupied.some(current => current.id !== appointment.id && start < toMinutes(current.endTime) && end > toMinutes(current.startTime))) {
    const error = new Error('Este horário já está reservado no Studio LEV. Escolha outro horário disponível.');
    (error as Error & { status?: number }).status = 409; throw error;
  }
};

export const availableStartTimes = async (date: string, duration: number) => {
  const occupied = await listAppointmentsByDate(date); const result: string[] = [];
  for (let start = 8 * 60; start + duration <= 18 * 60; start += 30) {
    const end = start + duration;
    if (!occupied.some(item => start < toMinutes(item.endTime) && end > toMinutes(item.startTime))) {
      result.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
    }
  }
  return result;
};

export const createUnifiedAppointment = async (appointment: UnifiedAppointment) => {
  await assertAvailable(appointment);
  const { url, key } = config(); const payload = { ...appointment, source: appointment.source || 'site' };
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
