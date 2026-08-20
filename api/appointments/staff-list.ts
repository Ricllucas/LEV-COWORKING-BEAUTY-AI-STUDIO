const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

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

const professionalNames: Record<string, string> = {
  prof_elisangela: 'Elisangela',
  prof_talitha: 'Talitha',
  prof_nayara: 'Nayara'
};

const addMinutes = (time: string, minutes: number) => {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const authenticateStaff = async (authorization?: string) => {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { url, key } = config();
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || key;
  const userHeaders = { apikey: publicKey, Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: userHeaders
  });
  if (!userResponse.ok) {
    console.error('Staff token validation failed:', userResponse.status, await userResponse.text().catch(() => ''));
    return null;
  }
  const user = await userResponse.json() as { id: string; email?: string };

  const [adminResponse, professionalResponse] = await Promise.all([
    fetch(`${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`, { headers: userHeaders }),
    fetch(`${url}/rest/v1/professional_access?user_id=eq.${encodeURIComponent(user.id)}&status=eq.approved&select=user_id&limit=1`, { headers: userHeaders })
  ]);
  const admins = adminResponse.ok ? await adminResponse.json() as unknown[] : [];
  const professionals = professionalResponse.ok ? await professionalResponse.json() as unknown[] : [];
  return admins.length > 0 || professionals.length > 0 ? user : null;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe LEV.' });

    const { url, key } = config();
    const response = await fetch(
      `${url}/rest/v1/appointments?select=id,professional_id,appointment_date,start_time,status,payload,updated_at&order=appointment_date.asc,start_time.asc`,
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
          professionalName: row.payload.professionalName || professionalNames[row.professional_id] || 'Profissional LEV',
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
        professionalName: professionalNames[row.professional_id] || 'Profissional LEV',
        serviceIds: [],
        serviceNames: ['Atendimento LEV'],
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
        createdBy: 'Agenda LEV'
      };
    });
    return json(res, 200, { appointments });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao carregar a agenda compartilhada.' });
  }
}

