// Envio pelo robô de WhatsApp da LEV (OpenWA no servidor da Hostinger).
// Endereço e sessão não são segredos; só a chave fica nas variáveis da Vercel.
const DEFAULT_URL = 'https://openwa.7jdn9d.easypanel.host';
const DEFAULT_SESSION = '3fc8d7a0-ed80-4284-b547-bac993812042';

export const isOpenWaConfigured = () => Boolean(process.env.OPENWA_API_KEY);

const config = () => {
  const apiKey = process.env.OPENWA_API_KEY;
  if (!apiKey) throw new Error('Robô de WhatsApp não configurado (OPENWA_API_KEY).');
  return {
    apiKey,
    url: (process.env.OPENWA_URL || DEFAULT_URL).replace(/\/$/, ''),
    session: encodeURIComponent(process.env.OPENWA_SESSION || DEFAULT_SESSION)
  };
};

// Celulares brasileiros: aceita com ou sem DDI 55.
export const toBrazilianNumber = (phone: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
};

const request = async (path: string, init: RequestInit = {}) => {
  const { apiKey, url } = config();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { 'X-API-Key': apiKey, Accept: 'application/json', 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const result = await response.json().catch(() => ({})) as Record<string, any>;
  if (!response.ok) {
    const detail = typeof result.message === 'string' ? result.message : `HTTP ${response.status}`;
    throw new Error(`O robô de WhatsApp recusou o pedido: ${detail}`);
  }
  return result;
};

// Pergunta ao WhatsApp qual é o endereço certo do número (resolve o 9º dígito).
const resolveChatId = async (number: string) => {
  const { session } = config();
  const result = await request(`/api/sessions/${session}/contacts/check/${number}`);
  const data = (result.data ?? result) as { exists?: boolean; whatsappId?: string | null };
  if (!data.exists || !data.whatsappId) throw new Error(`O número ${number} não tem WhatsApp.`);
  return data.whatsappId;
};

export const sendOpenWaText = async (phone: string, text: string) => {
  const number = toBrazilianNumber(phone);
  if (!number) throw new Error('Telefone inválido para WhatsApp.');
  const { session } = config();
  const chatId = await resolveChatId(number);
  return request(`/api/sessions/${session}/messages/send-text`, {
    method: 'POST',
    body: JSON.stringify({ chatId, text })
  });
};
