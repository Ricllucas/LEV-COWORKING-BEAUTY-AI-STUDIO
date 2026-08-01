const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

export const env = () => ({
  supabaseUrl: requireEnv('SUPABASE_URL').replace(/\/$/, ''),
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  whatsappToken: requireEnv('WHATSAPP_ACCESS_TOKEN'),
  whatsappPhoneNumberId: requireEnv('WHATSAPP_PHONE_NUMBER_ID'),
  graphVersion: process.env.WHATSAPP_GRAPH_VERSION || 'v23.0'
});

export const serviceHeaders = () => {
  const { supabaseServiceKey } = env();
  return {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json'
  };
};

export const supabaseRequest = async (path: string, init: RequestInit = {}) => {
  const { supabaseUrl } = env();
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(), ...(init.headers || {}) }
  });
};

export type StaffActor = {
  userId: string;
  role: 'admin' | 'profissional';
  name: string;
  professionalId?: string;
};

export const authenticateStaff = async (authorization?: string): Promise<StaffActor | null> => {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { supabaseUrl, supabaseServiceKey } = env();
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${token}` }
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id: string; email?: string };

  const adminResponse = await supabaseRequest(
    `admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=display_name&limit=1`
  );
  const admins = adminResponse.ok ? await adminResponse.json() as Array<{ display_name: string }> : [];
  if (admins[0]) return { userId: user.id, role: 'admin', name: admins[0].display_name || 'Administração LEV' };

  const professionalResponse = await supabaseRequest(
    `professional_access?user_id=eq.${encodeURIComponent(user.id)}&status=eq.approved&select=professional_id,display_name&limit=1`
  );
  const professionals = professionalResponse.ok
    ? await professionalResponse.json() as Array<{ professional_id: string; display_name: string }>
    : [];
  if (!professionals[0]) return null;
  return {
    userId: user.id,
    role: 'profissional',
    name: professionals[0].display_name,
    professionalId: professionals[0].professional_id
  };
};

export const sendWhatsAppText = async (to: string, body: string) => {
  const { whatsappToken, whatsappPhoneNumberId, graphVersion } = env();
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body } })
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || 'A Meta recusou o envio da mensagem.');
  return result as { messages?: Array<{ id: string }> };
};

export const sendWhatsAppTemplate = async (
  to: string,
  name: string,
  parameters: string[],
  languageCode = 'pt_BR'
) => {
  const { whatsappToken, whatsappPhoneNumberId, graphVersion } = env();
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name,
          language: { code: languageCode },
          components: [{
            type: 'body',
            parameters: parameters.map(text => ({ type: 'text', text }))
          }]
        }
      })
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || 'A Meta recusou o modelo de mensagem.');
  return result as { messages?: Array<{ id: string }> };
};

export const professionalName = (id?: string | null) => ({
  prof_elisangela: 'Elisangela',
  prof_talitha: 'Talitha',
  prof_nayara: 'Nayara'
} as Record<string, string>)[id || ''];

export const normalizePhone = (value: string) => value.replace(/\D/g, '');
