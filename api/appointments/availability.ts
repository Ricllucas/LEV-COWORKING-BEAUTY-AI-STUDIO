import { listAppointmentsByDate, listBlocksByDate } from '../_lib/appointmentService.js';
import { applyApiSecurity, rateLimit, publicErrorMessage } from '../_lib/security.js';
import { publicSalonId } from '../_lib/salonFromRequest.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'availability', 120, 60_000)) return;
  const date = String(req.query?.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: 'Data inválida.' });
  try {
    // Site público: salão do endereço do site
    const salonId = await publicSalonId(req, res);
    if (!salonId) return;
    const [list, blocks] = await Promise.all([listAppointmentsByDate(salonId, date), listBlocksByDate(salonId, date)]);
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
    const status = Number((error as Error & { status?: number })?.status || 500);
    return json(res, status, { error: publicErrorMessage(error, 'Falha ao consultar a disponibilidade.') });
  }
}

