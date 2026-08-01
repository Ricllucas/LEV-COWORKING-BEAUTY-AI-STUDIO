import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizePhone, professionalName, sendWhatsAppText, supabaseRequest } from '../_lib/whatsapp.js';

export const config = { api: { bodyParser: false } };

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

const rawBody = async (req: any): Promise<Buffer> => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const validSignature = (body: Buffer, signature?: string): boolean => {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signature?.startsWith('sha256=')) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  return received.length === calculated.length && timingSafeEqual(received, calculated);
};

const requestedProfessional = (text: string): string | undefined => {
  const normalized = text.toLowerCase();
  if (/\belisangela\b|^\s*1\s*$/.test(normalized)) return 'prof_elisangela';
  if (/\btalitha\b|^\s*2\s*$/.test(normalized)) return 'prof_talitha';
  if (/\bnayara\b|^\s*3\s*$/.test(normalized)) return 'prof_nayara';
  return undefined;
};

const findAppointmentProfessional = async (phone: string) => {
  const response = await supabaseRequest(
    'appointments?select=id,professional_id,payload&order=appointment_date.desc,start_time.desc&limit=100'
  );
  if (!response.ok) return undefined;
  const appointments = await response.json() as Array<{ id: string; professional_id: string; payload?: { clientPhone?: string } }>;
  const match = appointments.find(item => normalizePhone(item.payload?.clientPhone || '').endsWith(phone.slice(-11)));
  return match ? { professionalId: match.professional_id, appointmentId: match.id } : undefined;
};

const processStatuses = async (statuses: Array<Record<string, any>>) => {
  for (const status of statuses) {
    if (!status.id || !status.status) continue;
    const mapped = status.status === 'read' ? 'lida' : status.status === 'delivered' ? 'entregue' : status.status === 'failed' ? 'falhou' : 'enviada';
    await supabaseRequest(`whatsapp_messages?whatsapp_message_id=eq.${encodeURIComponent(status.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: mapped })
    });
  }
};

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    if (req.query?.['hub.mode'] === 'subscribe' && req.query?.['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Token de verificação inválido.');
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const buffer = await rawBody(req);
    if (!validSignature(buffer, req.headers['x-hub-signature-256'])) {
      return json(res, 401, { error: 'Assinatura da Meta inválida.' });
    }
    const payload = JSON.parse(buffer.toString('utf8'));

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        await processStatuses(value.statuses || []);

        for (const message of value.messages || []) {
          const waContactId = normalizePhone(message.from || '');
          if (!waContactId || !message.id) continue;
          const contact = (value.contacts || []).find((item: any) => item.wa_id === message.from);
          const clientName = contact?.profile?.name || waContactId;
          const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || `[${message.type || 'mensagem'}]`;

          const existingResponse = await supabaseRequest(
            `whatsapp_conversations?wa_contact_id=eq.${encodeURIComponent(waContactId)}&select=*&limit=1`
          );
          const existingRows = existingResponse.ok ? await existingResponse.json() as Array<Record<string, any>> : [];
          const existing = existingRows[0];
          const appointment = await findAppointmentProfessional(waContactId);
          const selectedProfessional = requestedProfessional(text) || existing?.assigned_professional_id || appointment?.professionalId;
          const now = new Date().toISOString();
          const conversationRow = {
            wa_contact_id: waContactId,
            client_phone: waContactId,
            client_name: clientName,
            assigned_professional_id: selectedProfessional || null,
            assigned_professional_name: professionalName(selectedProfessional) || null,
            appointment_id: existing?.appointment_id || appointment?.appointmentId || null,
            status: selectedProfessional ? 'aguardando' : 'bot',
            bot_enabled: existing ? existing.bot_enabled : true,
            unread_count: Number(existing?.unread_count || 0) + 1,
            last_message: text,
            last_message_at: now,
            updated_at: now
          };
          const upsertResponse = await supabaseRequest('whatsapp_conversations?on_conflict=wa_contact_id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(conversationRow)
          });
          if (!upsertResponse.ok) throw new Error('Não foi possível registrar a conversa recebida.');
          const upserted = await upsertResponse.json() as Array<Record<string, any>>;
          const conversation = upserted[0];

          await supabaseRequest('whatsapp_messages?on_conflict=whatsapp_message_id', {
            method: 'POST',
            headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
            body: JSON.stringify({
              conversation_id: conversation.id,
              whatsapp_message_id: message.id,
              direction: 'entrada',
              sender_type: 'cliente',
              sender_name: clientName,
              body: text,
              message_type: message.type || 'unknown',
              status: 'recebida',
              sent_at: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : now
            })
          });

          if (!existing && conversationRow.bot_enabled) {
            const automaticText = selectedProfessional
              ? `Olá, ${clientName}! Seu atendimento foi direcionado para ${professionalName(selectedProfessional)}. Ela continuará a conversa por aqui assim que estiver disponível.`
              : `Olá, ${clientName}! Bem-vinda ao LEV Coworking Beauty.\n\nCom quem você deseja falar?\n1 — Elisangela\n2 — Talitha\n3 — Nayara\n\nResponda com o número ou com o nome da profissional.`;
            const sent = await sendWhatsAppText(waContactId, automaticText);
            await supabaseRequest('whatsapp_messages', {
              method: 'POST',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                conversation_id: conversation.id,
                whatsapp_message_id: sent.messages?.[0]?.id || null,
                direction: 'saida',
                sender_type: 'bot',
                sender_name: 'Assistente LEV',
                body: automaticText,
                message_type: 'text',
                status: 'enviada',
                sent_at: now
              })
            });
          }
        }
      }
    }
    return json(res, 200, { received: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return json(res, 500, { error: 'Falha ao processar o webhook.' });
  }
}
