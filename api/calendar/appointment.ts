import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';
import { authenticateStaff } from '../_lib/staffAuth.js';
import { applyApiSecurity, rateLimit, validJsonRequest } from '../_lib/security.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const allowedStatuses = new Set([
  'aguardando_confirmacao', 'confirmado', 'cliente_presente', 'em_atendimento',
  'concluido', 'reagendamento_solicitado', 'reagendado', 'nao_compareceu',
  'cancelado_cliente', 'cancelado_coworking'
]);

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'calendar-sync-one', 60, 60_000) || !validJsonRequest(req, res)) return;
  const staff = await authenticateStaff(req.headers?.authorization);
  if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe LEV.' });
  try {
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const appointmentId = input?.appointmentId || input?.id;
    if (!appointmentId) return json(res, 400, { error: 'Agendamento inválido.' });
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('Servidor de agendamentos não configurado.');
    const storedResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}&select=id,professional_id,payload&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    const rows = storedResponse.ok ? await storedResponse.json() as Array<{ id: string; professional_id: string; payload: any }> : [];
    if (!rows[0]?.payload) return json(res, 404, { error: 'Agendamento não encontrado.' });
    if (staff.role === 'profissional' && staff.professionalId !== rows[0].professional_id) {
      return json(res, 403, { error: 'Você só pode finalizar os seus próprios atendimentos.' });
    }

    let appointment = rows[0].payload;
    if (input?.status) {
      if (!allowedStatuses.has(input.status)) return json(res, 400, { error: 'Status do atendimento inválido.' });
      const updatedAt = new Date().toISOString();
      appointment = {
        ...appointment,
        id: rows[0].id,
        professionalId: rows[0].professional_id,
        status: input.status,
        cancellationReason: input.cancellationReason || appointment.cancellationReason,
        updatedAt
      };
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ status: input.status, payload: appointment, updated_at: updatedAt })
      });
      if (!updateResponse.ok) return json(res, 502, { error: 'Não foi possível salvar o status do atendimento.' });
    }

    const calendar = await syncGoogleCalendarEvent(appointment);
    return json(res, 200, { appointment, synced: true, ...calendar });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao sincronizar o Google Agenda.' });
  }
}


