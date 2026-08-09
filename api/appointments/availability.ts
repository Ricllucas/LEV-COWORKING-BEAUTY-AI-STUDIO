import { listAppointmentsByDate } from '../_lib/appointmentService.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  const date = String(req.query?.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: 'Data inválida.' });
  try {
    return json(res, 200, { appointments: await listAppointmentsByDate(date) });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao consultar a disponibilidade.' });
  }
}
