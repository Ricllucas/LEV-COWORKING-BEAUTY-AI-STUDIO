import { Appointment } from '../types';

const cancelled = (appointment: Appointment) =>
  appointment.status === 'cancelado_cliente' || appointment.status === 'cancelado_coworking';

const timestamp = (value?: string) => {
  const parsed = Date.parse(String(value || '').replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const auditUniqueAppointments = (appointments: Appointment[]): Appointment[] => {
  const groups = new Map<string, Appointment[]>();
  appointments.forEach(appointment => {
    const client = appointment.clientPhone.replace(/\D/g, '') || appointment.clientName.trim().toLowerCase();
    const key = [appointment.professionalId, appointment.date, appointment.startTime, client].join('::');
    groups.set(key, [...(groups.get(key) || []), appointment]);
  });

  return Array.from(groups.values()).map(group => {
    const ordered = [...group].sort((a, b) =>
      timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt)
    );
    const latestCancelled = ordered.find(cancelled);
    const latestActive = ordered.find(item => !cancelled(item));
    if (!latestCancelled) return latestActive || ordered[0];
    if (!latestActive) return latestCancelled;
    return timestamp(latestActive.createdAt) > timestamp(latestCancelled.updatedAt || latestCancelled.createdAt)
      ? latestActive
      : latestCancelled;
  });
};

export const currentMonthRange = () => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return { today, monthStart: `${today.slice(0, 7)}-01` };
};

