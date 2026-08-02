import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';
import { notificationService } from '../_lib/notificationService.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

const isValidAppointment = (appointment: any) => Boolean(
  appointment?.id && appointment?.professionalId && appointment?.clientName &&
  appointment?.clientPhone && /^\d{4}-\d{2}-\d{2}$/.test(appointment?.date || '') &&
  /^\d{2}:\d{2}$/.test(appointment?.startTime || '') && /^\d{2}:\d{2}$/.test(appointment?.endTime || '')
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const appointment = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!isValidAppointment(appointment)) return json(res, 400, { error: 'Dados do agendamento incompletos.' });

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('Servidor de agendamentos não configurado.');

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?on_conflict=id`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: appointment.id, professional_id: appointment.professionalId,
        appointment_date: appointment.date, start_time: appointment.startTime,
        status: appointment.status, payload: appointment, updated_at: new Date().toISOString()
      })
    });

    if (!saveResponse.ok) {
      const details = await saveResponse.text();
      console.error('Supabase appointment save error:', saveResponse.status, details);
      if (saveResponse.status === 409) return json(res, 409, { error: 'Este horário acabou de ser reservado. Escolha outro horário disponível.' });
      throw new Error(`O servidor recusou o agendamento (${saveResponse.status}).`);
    }

    try {
      const calendarResult = await syncGoogleCalendarEvent(appointment);

      notificationService.notifyNewAppointment({
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        professionalName: appointment.professionalName,
        serviceNames: appointment.serviceNames || [],
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status
      }, appointment.professionalId).catch(err =>
        console.error('Notification send error (non-blocking):', err)
      );

      return json(res, 201, { saved: true, calendar: calendarResult });
    } catch (calendarError) {
      console.error('Appointment saved, Google Calendar sync error:', calendarError);
      return json(res, 201, { saved: true, calendar: { synced: false } });
    }
  } catch (error) {
    console.error('Appointment creation error:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Não foi possível salvar o agendamento no servidor.' });
  }
}
