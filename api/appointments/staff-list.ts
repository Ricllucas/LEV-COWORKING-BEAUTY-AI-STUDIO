const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
import { applyApiSecurity, rateLimit, publicErrorMessage } from '../_lib/security.js';
import { authenticateStaff } from '../_lib/staffAuth.js';
import { salonFilter } from '../_lib/tenant.js';
import { findProfessional, loadSalonDirectory } from '../_lib/salonDirectory.js';

const config = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Servidor de agendamentos não configurado.');
  return { url, key };
};

const headers = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: 'application/json'
});

const addMinutes = (time: string, minutes: number) => {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'staff-appointments', 120, 60_000)) return;
  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe do salão.' });

    const { url, key } = config();
    const directory = await loadSalonDirectory(staff.salonId);
    const nameOf = (professionalId: string) => findProfessional(directory, professionalId)?.name || 'Profissional';
    const response = await fetch(
      `${url}/rest/v1/appointments?select=id,professional_id,appointment_date,start_time,status,payload,updated_at&order=appointment_date.asc,start_time.asc&${salonFilter(staff.salonId)}`,
      { headers: headers(key) }
    );
    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('Supabase appointments query failed:', response.status, details);
      return json(res, 502, { error: `Não foi possível consultar os agendamentos no servidor (${response.status}).` });
    }
    const rows = await response.json() as Array<{
      id: string;
      professional_id: string;
      appointment_date: string;
      start_time: string;
      status: string;
      payload?: Record<string, unknown> | null;
      updated_at?: string;
    }>;
    const appointments = rows.map(row => {
      if (row.payload && typeof row.payload === 'object') {
        return {
          ...row.payload,
          id: row.id,
          professionalId: row.professional_id,
          professionalName: row.payload.professionalName || nameOf(row.professional_id),
          date: row.appointment_date,
          startTime: row.start_time,
          status: row.status,
          updatedAt: row.updated_at || row.payload.updatedAt
        };
      }
      const duration = 30;
      return {
        id: row.id,
        clientId: `legacy_${row.id}`,
        clientName: 'Cliente não identificado',
        clientPhone: '',
        professionalId: row.professional_id,
        professionalName: nameOf(row.professional_id),
        serviceIds: [],
        serviceNames: ['Atendimento'],
        date: row.appointment_date,
        startTime: row.start_time,
        endTime: addMinutes(row.start_time, duration),
        totalDurationMinutes: duration,
        totalPrice: 0,
        depositPaid: 0,
        remainingPrice: 0,
        status: row.status,
        paymentStatus: 'pendente',
        createdAt: row.updated_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        createdBy: 'Agenda'
      };
    });
    return json(res, 200, { appointments });
  } catch (error) {
    return json(res, 500, { error: publicErrorMessage(error, 'Falha ao carregar a agenda compartilhada.') });
  }
}

