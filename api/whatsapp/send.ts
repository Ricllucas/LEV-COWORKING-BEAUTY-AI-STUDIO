import { authenticateStaff, professionalName, sendWhatsAppText, supabaseRequest } from '../_lib/whatsapp.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const actor = await authenticateStaff(req.headers.authorization);
    if (!actor) return json(res, 401, { error: 'Sessão inválida ou sem permissão.' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const conversationId = String(body.conversationId || '');
    const text = String(body.text || '').trim();
    if (!conversationId || !text) return json(res, 400, { error: 'Conversa e mensagem são obrigatórias.' });
    if (text.length > 4096) return json(res, 400, { error: 'A mensagem ultrapassa o limite do WhatsApp.' });

    const conversationResponse = await supabaseRequest(
      `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=*&limit=1`
    );
    if (!conversationResponse.ok) throw new Error('Não foi possível localizar a conversa.');
    const conversations = await conversationResponse.json() as Array<Record<string, any>>;
    const conversation = conversations[0];
    if (!conversation) return json(res, 404, { error: 'Conversa não encontrada.' });

    if (
      actor.role === 'profissional' &&
      conversation.assigned_professional_id !== actor.professionalId
    ) {
      return json(res, 403, { error: 'Esta conversa pertence a outra profissional.' });
    }

    const signature = actor.role === 'profissional'
      ? `${professionalName(actor.professionalId) || actor.name} — LEV Beauty`
      : `${actor.name} — LEV Beauty`;
    const outgoingText = `*${signature}:*\n${text}`;
    const metaResult = await sendWhatsAppText(conversation.wa_contact_id, outgoingText);
    const messageId = metaResult.messages?.[0]?.id;
    const now = new Date().toISOString();
    const messageRow = {
      conversation_id: conversationId,
      whatsapp_message_id: messageId || null,
      direction: 'saida',
      sender_type: actor.role,
      sender_name: signature,
      body: text,
      message_type: 'text',
      status: messageId ? 'enviada' : 'pendente',
      sent_at: now
    };
    const insertResponse = await supabaseRequest('whatsapp_messages', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(messageRow)
    });
    if (!insertResponse.ok) throw new Error('A mensagem foi enviada, mas não foi registrada no histórico.');
    const inserted = await insertResponse.json() as Array<Record<string, any>>;

    await supabaseRequest(`whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        last_message: text,
        last_message_at: now,
        status: 'em_atendimento',
        bot_enabled: false,
        updated_at: now
      })
    });

    return json(res, 200, { message: inserted[0] });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Erro interno no envio.' });
  }
}
