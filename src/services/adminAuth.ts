const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const SESSION_KEY = 'lev_admin_session_v1';

export type AdminSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  userId: string;
  email: string;
  displayName: string;
};

const requireConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('A área administrativa ainda não foi configurada.');
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_PUBLISHABLE_KEY };
};

const verifyAdmin = async (accessToken: string, userId: string) => {
  const { url, key } = requireConfig();
  const response = await fetch(
    `${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id,display_name&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ user_id: string; display_name: string }>;
  return rows[0] ?? null;
};

export const AdminAuthService = {
  isConfigured(): boolean {
    return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
  },

  async signIn(email: string, password: string): Promise<AdminSession> {
    const { url, key } = requireConfig();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });

    if (!response.ok) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const data = await response.json();
    const membership = await verifyAdmin(data.access_token, data.user.id);

    if (!membership) {
      await fetch(`${url}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${data.access_token}` }
      }).catch(() => undefined);
      throw new Error('Esta conta não possui autorização administrativa.');
    }

    const session: AdminSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
      userId: data.user.id,
      email: data.user.email || email,
      displayName: membership.display_name || 'Administração LEV'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async restore(): Promise<AdminSession | null> {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AdminSession;
      if (!session.accessToken || !session.userId || (session.expiresAt && session.expiresAt <= Math.floor(Date.now() / 1000))) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      const membership = await verifyAdmin(session.accessToken, session.userId);
      if (!membership) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return { ...session, displayName: membership.display_name || session.displayName };
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  async signOut(): Promise<void> {
    const raw = sessionStorage.getItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (!raw || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return;
    try {
      const session = JSON.parse(raw) as AdminSession;
      await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.accessToken}`
        }
      });
    } catch {
      // The local session is already cleared.
    }
  }
};
