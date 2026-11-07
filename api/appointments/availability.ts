import { listAppointmentsByDate, listBlocksByDate } from '../_lib/appointmentService.js';
import { applyApiSecurity, rateLimit, publicErrorMessage } from '../_lib/security.js';
import { DEFAULT_SALON_ID } from '../_lib/tenant.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'availability', 120, 60_000)) return;
  const date = String(req.query?.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: 'Data inválida.' });
  try {
    const [list, blocks] = await Promise.all([listAppointmentsByDate(DEFAULT_SALON_ID, date), listBlocksByDate(DEFAULT_SALON_ID, date)]);
    const appointments = list.map(item => ({
      id: item.id,
      professionalId: item.professionalId,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status
    }));
    return json(res, 200, { appointments, blocks });
  } catch (error) {
    return json(res, 500, { error: publicErrorMessage(error, 'Falha ao consultar a disponibilidade.') });
  }
}

