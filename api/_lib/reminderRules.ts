import { constantTimeSecretEquals } from './security.js';

export type ReminderType = '1dia' | '1hora';
export type RemindersSent = Partial<Record<ReminderType | 'confirmacao', boolean>>;

export type ReminderCandidate = {
  id: string;
  clientName: string;
  clientPhone: string;
  professionalId: string;
  serviceNames: string[];
  date: string;
  startTime: string;
  totalPrice?: number;
  remindersSent: RemindersSent;
};

// Lembretes só fazem sentido para atendimentos que ainda vão acontecer
const REMINDABLE_STATUSES = new Set(['aguardando_confirmacao', 'confirmado']);

export const toReminderCandidate = (row: {
  id: string;
  payload?: Record<string, any> | null;
  reminders_sent?: RemindersSent | null;
}): ReminderCandidate | null => {
  const payload = row.payload;
  if (!payload || !payload.clientPhone || !payload.date || !payload.startTime) return null;
  if (!REMINDABLE_STATUSES.has(payload.status)) return null;

  return {
    id: row.id,
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    professionalId: payload.professionalId,
    serviceNames: payload.serviceNames || [],
    date: payload.date,
    startTime: payload.startTime,
    totalPrice: payload.totalPrice,
    remindersSent: row.reminders_sent || {},
  };
};

const minutesUntil = (apt: { date: string; startTime: string }, now: Date) =>
  (new Date(`${apt.date}T${apt.startTime}:00-03:00`).getTime() - now.getTime()) / 60_000;

export const isDueFor1Day = (apt: { date: string; startTime: string }, now: Date) => {
  const minutes = minutesUntil(apt, now);
  return minutes > 20 * 60 && minutes <= 26 * 60;
};

export const isDueFor1Hour = (apt: { date: string; startTime: string }, now: Date) => {
  const minutes = minutesUntil(apt, now);
  return minutes > 50 && minutes <= 70;
};

export const mergeRemindersSent = (current: RemindersSent, type: ReminderType): RemindersSent => ({
  ...current,
  [type]: true,
});

export const isCronAuthorized = (authorization: unknown, secret: string | undefined) =>
  Boolean(secret) && constantTimeSecretEquals(authorization, `Bearer ${secret}`);
