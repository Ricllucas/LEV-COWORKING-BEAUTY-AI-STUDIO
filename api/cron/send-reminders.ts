import { getTemplate, replaceTemplateVariables } from '../_lib/whatsappTemplates.js';
import { whatsappService } from '../_lib/whatsappService.js';

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  service_names: string[];
  total_price: number;
  reminders_sent?: { '1dia'?: boolean; '1hora'?: boolean };
  payload?: {
    clientName?: string;
    clientPhone?: string;
    professionalId?: string;
    date?: string;
    startTime?: string;
    serviceNames?: string[];
    totalPrice?: number;
  };
}

const supabaseRequest = async (path: string, options?: RequestInit) => {
  const url = requireEnv('SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...options?.headers,
    },
  });

  return response;
};

const logReminder = async (appointmentId: string, reminderType: string, success: boolean, errorMsg?: string) => {
  await supabaseRequest('reminder_history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appointment_id: appointmentId,
      reminder_type: reminderType,
      success,
      error_message: errorMsg || null,
    }),
  });
};

const markReminderSent = async (appointmentId: string, reminderType: string) => {
  const updatePath = `appointments?id=eq.${encodeURIComponent(appointmentId)}`;

  await supabaseRequest(updatePath, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      reminders_sent: {
        [`${reminderType}`]: true,
      },
    }),
  });
};

const getUpcomingAppointments = async () => {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const response = await supabaseRequest(
    `appointments?select=*&appointment_date=in.(${today},${tomorrow})`
  );

  if (!response.ok) return [];

  const appointments = (await response.json()) as Array<{
    id: string;
    payload: Appointment;
    reminders_sent?: Record<string, boolean>;
  }>;

  return appointments
    .map((apt) => ({
      ...apt.payload,
      id: apt.id,
      reminders_sent: apt.reminders_sent || { '1dia': false, '1hora': false },
    }))
    .filter((apt) => apt && apt.id && apt.client_phone);
};

const shouldSend1DayReminder = (appointment: Appointment): boolean => {
  const apptDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}:00-03:00`);
  const now = new Date();
  const diff = apptDateTime.getTime() - now.getTime();
  const hoursUntilAppt = diff / (1000 * 60 * 60);

  return hoursUntilAppt > 20 && hoursUntilAppt <= 26;
};

const shouldSend1HourReminder = (appointment: Appointment): boolean => {
  const apptDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}:00-03:00`);
  const now = new Date();
  const diff = apptDateTime.getTime() - now.getTime();
  const minutesUntilAppt = diff / (1000 * 60);

  return minutesUntilAppt > 50 && minutesUntilAppt <= 70;
};

const sendReminderMessage = async (
  appointment: Appointment,
  reminderType: '1dia' | '1hora'
): Promise<boolean> => {
  try {
    const template = getTemplate(appointment.professional_id, reminderType === '1dia' ? 'lembrete1Dia' : 'lembrete1Hora');

    const message = replaceTemplateVariables(template, {
      clientName: appointment.client_name,
      date: formatDateBR(appointment.appointment_date),
      time: appointment.start_time,
      service: appointment.service_names?.join(', ') || 'Serviço',
      price: appointment.total_price?.toString() || '',
    });

    const success = await whatsappService.sendMessage(appointment.client_phone, message);
    return success;
  } catch (error) {
    console.error(`Erro ao enviar lembrete ${reminderType} para ${appointment.id}:`, error);
    return false;
  }
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

export const config = { maxDuration: 60 };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

  if (
    req.method === 'GET' &&
    req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}` &&
    origin !== vercelUrl
  ) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[REMINDER CRON] Iniciando envio de lembretes...');

    const appointments = await getUpcomingAppointments();
    console.log(`[REMINDER CRON] ${appointments.length} agendamentos encontrados`);

    let sent1Day = 0;
    let sent1Hour = 0;
    let failed = 0;

    for (const apt of appointments) {
      const reminders = apt.reminders_sent || { '1dia': false, '1hora': false };

      if (shouldSend1DayReminder(apt) && !reminders['1dia']) {
        const success = await sendReminderMessage(apt, '1dia');
        if (success) {
          await markReminderSent(apt.id, '1dia');
          await logReminder(apt.id, '1dia', true);
          sent1Day++;
          console.log(`[REMINDER CRON] Lembrete 1 dia enviado para ${apt.client_name}`);
        } else {
          await logReminder(apt.id, '1dia', false, 'Falha ao enviar WhatsApp');
          failed++;
          console.error(`[REMINDER CRON] Falha ao enviar lembrete 1 dia para ${apt.id}`);
        }
      }

      if (shouldSend1HourReminder(apt) && !reminders['1hora']) {
        const success = await sendReminderMessage(apt, '1hora');
        if (success) {
          await markReminderSent(apt.id, '1hora');
          await logReminder(apt.id, '1hora', true);
          sent1Hour++;
          console.log(`[REMINDER CRON] Lembrete 1 hora enviado para ${apt.client_name}`);
        } else {
          await logReminder(apt.id, '1hora', false, 'Falha ao enviar WhatsApp');
          failed++;
          console.error(`[REMINDER CRON] Falha ao enviar lembrete 1 hora para ${apt.id}`);
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      sent: {
        '1dia': sent1Day,
        '1hora': sent1Hour,
        total: sent1Day + sent1Hour,
      },
      failed,
      appointments_checked: appointments.length,
    };

    console.log('[REMINDER CRON] Resultado:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[REMINDER CRON] Erro:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
