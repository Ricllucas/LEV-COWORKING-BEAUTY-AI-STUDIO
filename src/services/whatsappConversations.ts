import { User, WhatsAppConversation, WhatsAppMessage, WhatsAppConversationStatus } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

type StoredSession = { accessToken?: string };

const getAccessToken = (role: User['role']): string | undefined => {
  if (typeof sessionStorage === 'undefined') return undefined;
  const key = role === 'admin' ? 'lev_admin_session_v1' : 'lev_professional_session_v1';
  try {
    return (JSON.parse(sessionStorage.getItem(key) || '{}') as StoredSession).accessToken;
  } catch {
    return undefined;
  }
};

const config = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('A central de atendimento ainda não está conectada ao Supabase.');
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY };
};

const headers = (user: User) => {
  const { key } = config();
  const token = getAccessToken(user.role);
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para acessar as conversas.');
  return { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const conversationFromRow = (row: Record<string, any>): WhatsAppConversation => ({
  id: row.id,
  waContactId: row.wa_contact_id,
  clientPhone: row.client_phone,
  clientName: row.client_name || row.client_phone,
  assignedProfessionalId: row.assigned_professional_id || undefined,
  assignedProfessionalName: row.assigned_professional_name || undefined,
  appointmentId: row.appointment_id || undefined,
  status: row.status,
  botEnabled: row.bot_enabled,
  unreadCount: row.unread_count || 0,
  lastMessage: row.last_message || undefined,
  lastMessageAt: row.last_message_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const messageFromRow = (row: Record<string, any>): WhatsAppMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  whatsappMessageId: row.whatsapp_message_id || undefined,
  direction: row.direction,
  senderType: row.sender_type,
  senderName: row.sender_name,
  body: row.body,
  messageType: row.message_type,
  status: row.status,
  sentAt: row.sent_at
});

export const WhatsAppConversationService = {
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_KEY),

  async list(user: User): Promise<WhatsAppConversation[]> {
    const { url } = config();
    const response = await fetch(
      `${url}/rest/v1/whatsapp_conversations?select=*&order=last_message_at.desc&limit=100`,
      { headers: headers(user) }
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error('As tabelas da Central WhatsApp ainda não foram instaladas.');
      throw new Error('Não foi possível carregar as conversas.');
    }
    return ((await response.json()) as Record<string, any>[]).map(conversationFromRow);
  },

  async messages(user: User, conversationId: string): Promise<WhatsAppMessage[]> {
    const { url } = config();
    const response = await fetch(
      `${url}/rest/v1/whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=sent_at.asc&limit=300`,
      { headers: headers(user) }
    );
    if (!response.ok) throw new Error('Não foi possível carregar as mensagens desta conversa.');
    return ((await response.json()) as Record<string, any>[]).map(messageFromRow);
  },

  async send(user: User, conversationId: string, text: string): Promise<WhatsAppMessage> {
    const token = getAccessToken(user.role);
    if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, text: text.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar a mensagem.');
    return messageFromRow(result.message);
  },

  async updateConversation(
    user: User,
    conversationId: string,
    changes: { assignedProfessionalId?: string | null; status?: WhatsAppConversationStatus; botEnabled?: boolean }
  ): Promise<void> {
    const { url } = config();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('assignedProfessionalId' in changes) payload.assigned_professional_id = changes.assignedProfessionalId;
    if (changes.status) payload.status = changes.status;
    if (typeof changes.botEnabled === 'boolean') payload.bot_enabled = changes.botEnabled;
    const response = await fetch(
      `${url}/rest/v1/whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`,
      { method: 'PATCH', headers: { ...headers(user), Prefer: 'return=minimal' }, body: JSON.stringify(payload) }
    );
    if (!response.ok) throw new Error('Não foi possível atualizar esta conversa.');
  },

  async markRead(user: User, conversationId: string): Promise<void> {
    const { url } = config();
    await fetch(`${url}/rest/v1/whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: 'PATCH',
      headers: { ...headers(user), Prefer: 'return=minimal' },
      body: JSON.stringify({ unread_count: 0, updated_at: new Date().toISOString() })
    });
  }
};
