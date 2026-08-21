import { createUnifiedAppointment } from '../_lib/appointmentService.js';
import { applyApiSecurity, rateLimit, safeText, secureId, validJsonRequest } from '../_lib/security.js';
const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const valid = (a: any) => Boolean(a?.id && a?.professionalId && a?.clientName && a?.clientPhone && /^\d{4}-\d{2}-\d{2}$/.test(a?.date || '') && /^\d{2}:\d{2}$/.test(a?.startTime || '') && /^\d{2}:\d{2}$/.test(a?.endTime || ''));
export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'booking-create', 12, 10 * 60_000) || !validJsonRequest(req, res)) return;
  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const allowedProfessionals = new Set(['prof_elisangela', 'prof_talitha', 'prof_nayara']);
    const appointment = {
      ...raw,
      id: secureId('apt'),
      clientName: safeText(raw?.clientName, 100),
      clientPhone: safeText(raw?.clientPhone, 24),
      clientEmail: safeText(raw?.clientEmail, 160).toLowerCase(),
      notes: safeText(raw?.notes, 500),
      professionalId: safeText(raw?.professionalId, 40),
      professionalName: safeText(raw?.professionalName, 80),
      serviceIds: Array.isArray(raw?.serviceIds) ? raw.serviceIds.slice(0, 12).map((v: unknown) => safeText(v, 80)) : [],
      serviceNames: Array.isArray(raw?.serviceNames) ? raw.serviceNames.slice(0, 12).map((v: unknown) => safeText(v, 120)) : []
    };
    if (!allowedProfessionals.has(appointment.professionalId)) return json(res, 400, { error: 'Profissional inválida.' });
    if (!valid(appointment)) return json(res, 400, { error: 'Dados do agendamento incompletos.' });
    return json(res, 201, await createUnifiedAppointment({ ...appointment, source: appointment.source || 'site' }));
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 500);
    return json(res, status, { error: error instanceof Error ? error.message : 'Não foi possível salvar o agendamento.' });
  }
}

