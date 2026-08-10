import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';
import { notificationService } from '../_lib/notificationService.js';
import { sendWhatsAppText } from '../_lib/whatsapp.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const digits = (value: string) => String(value || '').replace(/\D/g, '');
const samePhone = (left: string, right: string) => {
  const a = digits(left); const b = digits(right);
  return Boolean(a.length >= 8 && b.length >= 8 && (a === b || a.endsWith(b) || b.endsWith(a)));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const { appointmentId, clientPhone, reason } = req.body || {};
    if (!appointmentId || !clientPhone) return json(res, 400, { error: 'Informe o agendamento e o telefone utilizado na reserva.' });
    const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Servidor de agendamentos não configurado.');
    const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    const lookup = await fetch(`${url}/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}&select=payload&limit=1`, { headers });
    if (!lookup.ok) throw new Error('Não foi possível localizar o agendamento.');
    const rows = await lookup.json() as Array<{ payload: any }>;
    const current = rows[0]?.payload;
    if (!current || !samePhone(current.clientPhone, clientPhone)) return json(res, 404, { error: 'Agendamento não encontrado para este telefone.' });
    if (['cancelado_cliente', 'cancelado_coworking'].includes(current.status)) return json(res, 200, { appointment: current, alreadyCancelled: true });

    const updated = {
      ...current,
      status: 'cancelado_cliente',
      cancellationReason: String(reason || 'Cancelado pela cliente pelo site'),
      updatedAt: new Date().toISOString()
    };
    const save = await fetch(`${url}/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: updated.status, payload: updated, updated_at: updated.updatedAt })
    });
    if (!save.ok) throw new Error('Não foi possível cancelar o agendamento no servidor.');

    let calendarSynced = false;
    try { await syncGoogleCalendarEvent(updated); calendarSynced = true; }
    catch (error) { console.error('Google Calendar cancellation error:', error); }

    notificationService.notifyAppointmentStatusChange({
      appointmentId: updated.id, clientName: updated.clientName, clientPhone: updated.clientPhone,
      professionalName: updated.professionalName, serviceNames: updated.serviceNames,
      date: updated.date, startTime: updated.startTime, endTime: updated.endTime, status: updated.status
    }).catch(error => console.error('Cancellation notification error:', error));
    sendWhatsAppText(digits(updated.clientPhone), `Seu agendamento LEV de ${updated.serviceNames.join(', ')} com ${updated.professionalName}, em ${updated.date} às ${updated.startTime}, foi cancelado. O horário já foi liberado.`)
      .catch(error => console.error('Client cancellation WhatsApp error:', error));
    fetch(`${url}/rest/v1/whatsapp_conversations?appointment_id=eq.${encodeURIComponent(appointmentId)}`, {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'encerrada', last_message: 'Agendamento cancelado pela cliente', updated_at: updated.updatedAt })
    }).catch(error => console.error('WhatsApp conversation cancellation error:', error));

    return json(res, 200, { appointment: updated, calendarSynced });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Não foi possível cancelar o agendamento.' });
  }
}
