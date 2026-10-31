import { createClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const client = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        experimental: { passkey: true }
      }
    })
  : null;

const requireClient = () => {
  if (!client) throw new Error('O reconhecimento facial ainda não foi configurado.');
  if (!window.PublicKeyCredential) {
    throw new Error('Este aparelho ou navegador não oferece reconhecimento facial por passkey.');
  }
  return client;
};

const friendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/passkey_disabled/i.test(message)) {
    return new Error('O reconhecimento facial precisa ser ativado no Supabase antes do primeiro uso.');
  }
  if (/not.?allowed|cancel/i.test(message)) {
    return new Error('A confirmação facial foi cancelada ou não foi autorizada.');
  }
  return new Error(message || 'Não foi possível validar o reconhecimento facial.');
};

export const PasskeyAuthService = {
  isSupported(): boolean {
    return Boolean(client && window.PublicKeyCredential);
  },

  async register(accessToken: string, refreshToken: string): Promise<void> {
    const supabase = requireClient();
    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (sessionError) throw sessionError;

      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async signIn(): Promise<Session> {
    const supabase = requireClient();
    try {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
      if (!data.session) throw new Error('O Supabase não retornou uma sessão válida.');
      return data.session;
    } catch (error) {
      throw friendlyError(error);
    }
  }
};

