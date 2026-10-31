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
    if (input?.changes) {
      const changes = input.changes;
      const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : undefined;
      const clientName = text(changes.clientName, 120);
      const date = text(changes.date, 10);
      const startTime = text(changes.startTime, 5);
      const endTime = text(changes.endTime, 5);
      const serviceIds = Array.isArray(changes.serviceIds) ? changes.serviceIds.filter((v: unknown) => typeof v === 'string').slice(0, 20) : undefined;
      const serviceNames = Array.isArray(changes.serviceNames) ? changes.serviceNames.filter((v: unknown) => typeof v === 'string').map((v: string) => v.slice(0, 120)).slice(0, 20) : undefined;

      if (clientName !== undefined && !clientName) return json(res, 400, { error: 'Informe o nome da cliente.' });
      if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: 'Data inválida.' });
      if (startTime !== undefined && !/^\d{2}:\d{2}$/.test(startTime)) return json(res, 400, { error: 'Horário inicial inválido.' });
      if (endTime !== undefined && !/^\d{2}:\d{2}$/.test(endTime)) return json(res, 400, { error: 'Horário final inválido.' });
      if (serviceIds !== undefined && serviceIds.length === 0) return json(res, 400, { error: 'Selecione ao menos um serviço.' });

      const updatedAt = new Date().toISOString();
      const numeric = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
      appointment = {
        ...appointment,
        id: rows[0].id,
        professionalId: rows[0].professional_id,
        ...(clientName !== undefined ? { clientName } : {}),
        ...(date !== undefined ? { date } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        ...(serviceIds !== undefined ? { serviceIds } : {}),
        ...(serviceNames !== undefined ? { serviceNames } : {}),
        totalDurationMinutes: numeric(changes.totalDurationMinutes, appointment.totalDurationMinutes),
        totalPrice: numeric(changes.totalPrice, appointment.totalPrice),
        remainingPrice: numeric(changes.remainingPrice, appointment.remainingPrice),
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
        body: JSON.stringify({ payload: appointment, date: appointment.date, updated_at: updatedAt })
      });
      if (!updateResponse.ok) return json(res, 502, { error: 'Não foi possível salvar as alterações do lançamento.' });
    }
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


