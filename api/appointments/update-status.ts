import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';
import { authenticateStaff, serviceHeaders, supabaseConfig } from '../_lib/staffAuth.js';
import { applyApiSecurity, rateLimit, safeText, validJsonRequest } from '../_lib/security.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const allowedStatuses = new Set([
  'aguardando_confirmacao', 'confirmado', 'cliente_presente', 'em_atendimento',
  'concluido', 'reagendamento_solicitado', 'reagendado', 'nao_compareceu'
]);

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'appointment-status', 60, 60_000) || !validJsonRequest(req, res)) return;

  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe LEV.' });

    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const appointmentId = safeText(raw?.appointmentId, 120);
    const status = safeText(raw?.status, 50);
    if (!appointmentId || !allowedStatuses.has(status)) {
      return json(res, 400, { error: 'Status do atendimento inválido.' });
    }

    const { url, serviceKey } = supabaseConfig();
    const headers = serviceHeaders(serviceKey);
    const storedResponse = await fetch(
      `${url}/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}&select=id,professional_id,payload&limit=1`,
      { headers }
    );
    const rows = storedResponse.ok
      ? await storedResponse.json() as Array<{ id: string; professional_id: string; payload: Record<string, any> }>
      : [];
    const stored = rows[0];
    if (!stored) return json(res, 404, { error: 'Agendamento não encontrado.' });
    if (staff.role === 'profissional' && staff.professionalId !== stored.professional_id) {
      return json(res, 403, { error: 'Você só pode finalizar os seus próprios atendimentos.' });
    }

    const updatedAt = new Date().toISOString();
    const appointment = { ...stored.payload, id: stored.id, professionalId: stored.professional_id, status, updatedAt };
    const updateResponse = await fetch(`${url}/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status, payload: appointment, updated_at: updatedAt })
    });
    if (!updateResponse.ok) {
      console.error('Appointment status update failed:', updateResponse.status, await updateResponse.text().catch(() => ''));
      return json(res, 502, { error: 'Não foi possível salvar o status do atendimento.' });
    }

    try {
      await syncGoogleCalendarEvent(appointment);
    } catch (calendarError) {
      console.error('Google Calendar status sync failed:', calendarError);
    }

    return json(res, 200, { appointment });
  } catch (error) {
    console.error('Appointment status handler failed:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao atualizar o atendimento.' });
  }
}

