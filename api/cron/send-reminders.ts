import { getTemplate, replaceTemplateVariables } from '../_lib/whatsappTemplates.js';
import { sendWhatsAppText, supabaseRequest } from '../_lib/whatsapp.js';
import {
  isCronAuthorized,
  isDueFor1Day,
  isDueFor1Hour,
  mergeRemindersSent,
  toReminderCandidate,
  type ReminderCandidate,
  type ReminderType,
} from '../_lib/reminderRules.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const digits = (value: string) => String(value || '').replace(/\D/g, '');

// Datas de hoje, amanhã e depois de amanhã no horário de Brasília (cobre a janela de 26h)
const upcomingDatesBR = (now: Date) => [0, 1, 2].map(offset =>
  new Date(now.getTime() - 3 * 60 * 60 * 1000 + offset * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
);

const getUpcomingAppointments = async (now: Date) => {
  const response = await supabaseRequest(
    `appointments?select=id,payload,reminders_sent&appointment_date=in.(${upcomingDatesBR(now).join(',')})`
  );
  if (!response.ok) throw new Error(`Falha ao buscar agendamentos (${response.status}).`);
  const rows = await response.json() as Array<Parameters<typeof toReminderCandidate>[0]>;
  return rows.map(toReminderCandidate).filter((apt): apt is ReminderCandidate => apt !== null);
};

const logReminder = async (appointmentId: string, reminderType: ReminderType, success: boolean, errorMsg?: string) => {
  await supabaseRequest('reminder_history', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ appointment_id: appointmentId, reminder_type: reminderType, success, error_message: errorMsg || null }),
  });
};

const markReminderSent = async (apt: ReminderCandidate, reminderType: ReminderType) => {
  apt.remindersSent = mergeRemindersSent(apt.remindersSent, reminderType);
  await supabaseRequest(`appointments?id=eq.${encodeURIComponent(apt.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ reminders_sent: apt.remindersSent }),
  });
};

function formatDateBR(date: string): string {
  const [year, month, day] = date.split('-');
  const monthNames = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return `${day} de ${monthNames[parseInt(month) - 1]} de ${year}`;
}

const sendReminder = async (apt: ReminderCandidate, reminderType: ReminderType) => {
  try {
    const template = getTemplate(apt.professionalId, reminderType === '1dia' ? 'lembrete1Dia' : 'lembrete1Hora');
    const message = replaceTemplateVariables(template, {
      clientName: apt.clientName,
      date: formatDateBR(apt.date),
      time: apt.startTime,
      service: apt.serviceNames.join(', ') || 'Serviço',
      price: apt.totalPrice?.toString() || '',
    });
    await sendWhatsAppText(digits(apt.clientPhone), message);
    await markReminderSent(apt, reminderType);
    await logReminder(apt.id, reminderType, true);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar WhatsApp';
    console.error(`[REMINDER CRON] Falha no lembrete ${reminderType} para ${apt.id}:`, errorMessage);
    await logReminder(apt.id, reminderType, false, errorMessage).catch(() => undefined);
    return false;
  }
};

export const config = { maxDuration: 60 };

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.CRON_SECRET) return json(res, 500, { error: 'CRON_SECRET não configurado.' });
  if (!isCronAuthorized(req.headers?.authorization, process.env.CRON_SECRET)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const appointments = await getUpcomingAppointments(now);
    const sent = { '1dia': 0, '1hora': 0 };
    let failed = 0;

    for (const apt of appointments) {
      for (const [type, isDue] of [['1dia', isDueFor1Day], ['1hora', isDueFor1Hour]] as const) {
        if (apt.remindersSent[type] || !isDue(apt, now)) continue;
        if (await sendReminder(apt, type)) sent[type]++;
        else failed++;
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      sent: { ...sent, total: sent['1dia'] + sent['1hora'] },
      failed,
      appointments_checked: appointments.length,
    };
    console.log('[REMINDER CRON] Resultado:', result);
    return json(res, 200, result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[REMINDER CRON] Erro:', errorMessage);
    return json(res, 500, { success: false, error: errorMessage, timestamp: new Date().toISOString() });
  }
}
