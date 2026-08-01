import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const appointment = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!appointment?.id) return json(res, 400, { error: 'Agendamento inválido.' });
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('Servidor de agendamentos não configurado.');
    const storedResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${encodeURIComponent(appointment.id)}&select=payload&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    const rows = storedResponse.ok ? await storedResponse.json() as Array<{ payload: any }> : [];
    if (!rows[0]?.payload) return json(res, 404, { error: 'Agendamento não encontrado.' });
    return json(res, 200, { synced: true, ...await syncGoogleCalendarEvent(rows[0].payload) });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao sincronizar o Google Agenda.' });
  }
}

