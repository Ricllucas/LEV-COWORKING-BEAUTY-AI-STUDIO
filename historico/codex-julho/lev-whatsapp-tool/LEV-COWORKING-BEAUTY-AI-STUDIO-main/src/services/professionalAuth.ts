const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const SESSION_KEY = 'lev_professional_session_v1';
const REQUEST_KEY = 'lev_professional_pending_request_v1';

export type ProfessionalProfileId = 'prof_elisangela' | 'prof_talitha' | 'prof_nayara';
export type ProfessionalAccess = {
  user_id: string;
  professional_id: ProfessionalProfileId;
  display_name: string;
  email?: string;
  status: 'pending' | 'approved' | 'blocked';
};
export type ProfessionalSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
  email: string;
  access: ProfessionalAccess;
};

const config = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('O acesso profissional ainda não foi configurado.');
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY };
};

const requestHeaders = (token: string) => {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const readAccess = async (token: string, userId: string): Promise<ProfessionalAccess | null> => {
  const { url } = config();
  const response = await fetch(`${url}/rest/v1/professional_access?user_id=eq.${userId}&select=*&limit=1`, {
    headers: requestHeaders(token)
  });
  if (!response.ok) return null;
  const rows = await response.json() as ProfessionalAccess[];
  return rows[0] ?? null;
};

const createPendingAccess = async (token: string, userId: string, request: Omit<ProfessionalAccess, 'user_id' | 'status'>) => {
  const { url } = config();
  const response = await fetch(`${url}/rest/v1/professional_access`, {
    method: 'POST',
    headers: { ...requestHeaders(token), Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: userId, ...request, status: 'pending' })
  });
  if (!response.ok) throw new Error('Não foi possível enviar a solicitação para aprovação.');
  const rows = await response.json() as ProfessionalAccess[];
  return rows[0];
};

export const ProfessionalAuthService = {
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_KEY),

  async signUp(data: { email: string; password: string; professionalId: ProfessionalProfileId; displayName: string }) {
    const { url, key } = config();
    const pending = { professional_id: data.professionalId, display_name: data.displayName, email: data.email.trim().toLowerCase() };
    localStorage.setItem(REQUEST_KEY, JSON.stringify(pending));
    const response = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pending.email, password: data.password, data: { full_name: data.displayName } })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.msg || result.message || 'Não foi possível criar a conta.');
    if (result.access_token && result.user?.id) {
      await createPendingAccess(result.access_token, result.user.id, pending);
      localStorage.removeItem(REQUEST_KEY);
    }
    return { needsConfirmation: !result.access_token };
  },

  async signIn(email: string, password: string): Promise<ProfessionalSession> {
    const { url, key } = config();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error('E-mail ou senha inválidos. Confirme também seu e-mail antes de entrar.');

    let access = await readAccess(result.access_token, result.user.id);
    const pendingRaw = localStorage.getItem(REQUEST_KEY);
    if (!access && pendingRaw) {
      const pending = JSON.parse(pendingRaw);
      if (pending.email === email.trim().toLowerCase()) {
        access = await createPendingAccess(result.access_token, result.user.id, pending);
        localStorage.removeItem(REQUEST_KEY);
      }
    }
    if (!access) throw new Error('Esta conta não está vinculada a um perfil profissional.');
    if (access.status === 'blocked') throw new Error('Este acesso foi bloqueado pela administração.');

    const session = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + Number(result.expires_in || 3600),
      userId: result.user.id,
      email: result.user.email || email,
      access
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async restore(): Promise<ProfessionalSession | null> {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as ProfessionalSession;
      if (session.expiresAt <= Math.floor(Date.now() / 1000)) throw new Error();
      const access = await readAccess(session.accessToken, session.userId);
      if (!access || access.status !== 'approved') throw new Error();
      return { ...session, access };
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  signOut() {
    sessionStorage.removeItem(SESSION_KEY);
  }
};
