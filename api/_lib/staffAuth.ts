export type StaffIdentity = { userId: string; role: 'admin' | 'profissional'; professionalId?: string };

export const supabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Servidor de dados não configurado.');
  return { url, serviceKey };
};

export const serviceHeaders = (serviceKey: string) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
});

export const authenticateStaff = async (authorization?: string): Promise<StaffIdentity | null> => {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { url, serviceKey } = supabaseConfig();
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || serviceKey;
  const headers = { apikey: publicKey, Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers });
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id: string };

  const [adminResponse, professionalResponse] = await Promise.all([
    fetch(`${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`, { headers }),
    fetch(`${url}/rest/v1/professional_access?user_id=eq.${encodeURIComponent(user.id)}&status=eq.approved&select=professional_id&limit=1`, { headers })
  ]);
  const admins = adminResponse.ok ? await adminResponse.json() as unknown[] : [];
  if (admins.length) return { userId: user.id, role: 'admin' };
  const professionals = professionalResponse.ok
    ? await professionalResponse.json() as Array<{ professional_id: string }>
    : [];
  return professionals[0]
    ? { userId: user.id, role: 'profissional', professionalId: professionals[0].professional_id }
    : null;
};

