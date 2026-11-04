import { verifyConfirmToken } from '../_lib/confirmLink.js';
import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';
import { applyApiSecurity, publicErrorMessage, rateLimit, validJsonRequest } from '../_lib/security.js';
import { DEFAULT_SALON_ID, salonFilter } from '../_lib/tenant.js';

// Confirmação do horário pela profissional, a partir do link enviado no WhatsApp.
// GET  ?t=<token>  → mostra o resumo do horário (não altera nada; o WhatsApp abre links sozinho para gerar prévia)
// POST { t }       → confirma o horário; a cliente recebe a confirmação pelo robô em até 5 minutos

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

interface StoredRow { id: string; status: string; payload: any }

const summary = (row: StoredRow) => ({
  status: row.status,
  clientFirstName: String(row.payload?.clientName || '').trim().split(/\s+/)[0] || 'Cliente',
  professionalName: row.payload?.professionalName || '',
  serviceNames: Array.isArray(row.payload?.serviceNames) ? row.payload.serviceNames : [],
  date: row.payload?.date || '',
  startTime: row.payload?.startTime || '',
  endTime: row.payload?.endTime || ''
});

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'confirm-link', 30, 60_000)) return;
  if (req.method === 'POST' && !validJsonRequest(req, res)) return;

  try {
    const body = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : null;
    const token = req.method === 'GET' ? req.query?.t : body?.t;
    const check = verifyConfirmToken(token);
    if (check.ok === false) {
      return check.reason === 'expired'
        ? json(res, 410, { error: 'Este link expirou porque o horário já passou.' })
        : json(res, 400, { error: 'Link de confirmação inválido.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('Servidor de agendamentos não configurado.');
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
    const id = encodeURIComponent(check.appointmentId);
    // Link público: LEV por enquanto (a fase 4 usa o endereço)
    const salonId = DEFAULT_SALON_ID;

    const found = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${id}&select=id,status,payload&limit=1&${salonFilter(salonId)}`, { headers });
    const rows = found.ok ? await found.json() as StoredRow[] : [];
    if (!rows[0]) return json(res, 404, { error: 'Agendamento não encontrado. Ele pode ter sido cancelado.' });

    if (req.method === 'GET') return json(res, 200, summary(rows[0]));

    if (rows[0].status === 'confirmado') return json(res, 200, { ...summary(rows[0]), alreadyConfirmed: true });
    if (rows[0].status !== 'aguardando_confirmacao') {
      return json(res, 409, { error: 'Este horário não está mais aguardando confirmação. Confira no painel da LEV.', ...summary(rows[0]) });
    }

    const updatedAt = new Date().toISOString();
    const appointment = {
      ...rows[0].payload,
      id: rows[0].id,
      status: 'confirmado',
      confirmedVia: 'whatsapp_link',
      updatedAt
    };
    // Só confirma se ainda estiver pendente (evita sobrescrever um cancelamento feito ao mesmo tempo)
    const update = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${id}&status=eq.aguardando_confirmacao&${salonFilter(salonId)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'confirmado', payload: appointment, updated_at: updatedAt })
    });
    const updated = update.ok ? await update.json() as StoredRow[] : [];
    if (!update.ok) return json(res, 502, { error: 'Não foi possível confirmar agora. Tente de novo em instantes.' });
    if (!updated[0]) return json(res, 409, { error: 'Este horário mudou enquanto você confirmava. Confira no painel da LEV.' });

    try {
      await syncGoogleCalendarEvent(appointment);
    } catch (calendarError) {
      console.error('[CONFIRMAR LINK] Confirmado, mas falhou a sincronização com o Google Agenda:', calendarError);
    }
    return json(res, 200, { ...summary(updated[0]), confirmed: true });
  } catch (error) {
    console.error('[CONFIRMAR LINK] Erro:', error);
    return json(res, 500, { error: publicErrorMessage(error, 'Não foi possível confirmar o horário.') });
  }
}
