import { createUnifiedAppointment } from '../_lib/appointmentService.js';
const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const valid = (a: any) => Boolean(a?.id && a?.professionalId && a?.clientName && a?.clientPhone && /^\d{4}-\d{2}-\d{2}$/.test(a?.date || '') && /^\d{2}:\d{2}$/.test(a?.startTime || '') && /^\d{2}:\d{2}$/.test(a?.endTime || ''));
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const appointment = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!valid(appointment)) return json(res, 400, { error: 'Dados do agendamento incompletos.' });
    return json(res, 201, await createUnifiedAppointment({ ...appointment, source: appointment.source || 'site' }));
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 500);
    return json(res, status, { error: error instanceof Error ? error.message : 'Não foi possível salvar o agendamento.' });
  }
}
