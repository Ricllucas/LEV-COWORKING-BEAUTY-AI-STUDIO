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

const authenticateStaff = async (authorization?: string) => {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { url, key } = config();
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` }
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id: string };

  const [adminResponse, professionalResponse] = await Promise.all([
    fetch(`${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`, { headers: headers(key) }),
    fetch(`${url}/rest/v1/professional_access?user_id=eq.${encodeURIComponent(user.id)}&status=eq.approved&select=user_id&limit=1`, { headers: headers(key) })
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
      `${url}/rest/v1/appointments?select=payload&order=appointment_date.asc,start_time.asc`,
      { headers: headers(key) }
    );
    if (!response.ok) return json(res, 502, { error: 'Não foi possível carregar a agenda compartilhada.' });
    const rows = await response.json() as Array<{ payload: unknown }>;
    return json(res, 200, { appointments: rows.map(row => row.payload).filter(Boolean) });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao carregar a agenda compartilhada.' });
  }
}

