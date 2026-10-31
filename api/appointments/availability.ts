import { listAppointmentsByDate } from '../_lib/appointmentService.js';
import { applyApiSecurity, rateLimit } from '../_lib/security.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'availability', 120, 60_000)) return;
  const date = String(req.query?.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: 'Data inválida.' });
  try {
    const appointments = (await listAppointmentsByDate(date)).map(item => ({
      id: item.id,
      professionalId: item.professionalId,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status
    }));
    return json(res, 200, { appointments });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao consultar a disponibilidade.' });
  }
}

