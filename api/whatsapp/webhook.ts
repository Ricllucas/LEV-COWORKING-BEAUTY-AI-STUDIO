import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizePhone, professionalName, sendWhatsAppText, supabaseRequest } from '../_lib/whatsapp.js';
import { processWhatsAppBooking } from '../_lib/whatsappBooking.js';

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

// Processar mensagens de cliente com inteligência
const processClientMessage = async (clientPhone: string, clientName: string, text: string): Promise<string> => {
  const lowerText = text.toLowerCase();

  // Cancelamento de agendamento
  if (lowerText.includes('cancelar') || lowerText.includes('desmarcar') || lowerText.includes('remover')) {
    return `Entendi que você gostaria de cancelar seu agendamento. 💔

Para cancelar com segurança, você precisa:
1. Nos avisar com *no mínimo 24 horas* de antecedência
2. Fazer isso por aqui via WhatsApp

Qual é o agendamento que você gostaria de cancelar? Envie a data e horário, por favor!

Estamos aqui para te ajudar! ✨`;
  }

  // Remarcar agendamento
  if (lowerText.includes('remarcar') || lowerText.includes('mudar') || lowerText.includes('outro horário')) {
    return `Legal! Podemos sim remarcar seu agendamento! 📅

Para remarcar:
1. Me fala qual agendamento você quer mudar (data e horário atual)
2. Me fala o novo dia e horário que você prefere
3. Verifique a disponibilidade com a gente!

Qual agendamento você gostaria de remarcar? 😊`;
  }

  // Dúvidas sobre serviços
  if (lowerText.includes('dúvida') || lowerText.includes('pergunta') || lowerText.includes('como') || lowerText.includes('quanto')) {
    return `Ótimo ter você aqui com dúvidas! Vou te ajudar! 😊

Para perguntas sobre:
- 💅 *Serviços e preços:* Me conta que tipo de serviço você quer
- ⏰ *Disponibilidade:* Me fala a data que você quer e vejo com a gente
- 💰 *Formas de pagamento:* Aceitamos PIX, dinheiro e cartão na hora!
- 👩‍💼 *Qual profissional:* Elisangela, Talitha ou Nayara - cada uma tem sua especialidade!

Qual sua dúvida? 💕`;
  }

  // Feedback positivo
  if (lowerText.includes('obrigada') || lowerText.includes('obrigado') || lowerText.includes('muito bom') || lowerText.includes('perfeito')) {
    return `Que alegria ouvir isso! 💕 Sua satisfação é nosso melhor prêmio!

Volta sempre, tá? Estamos sempre aqui para deixar você mais linda ainda! ✨

Beijos! 💋`;
  }

  // Mensagem genérica
  return `Oi, ${clientName}! 👋 Recebi sua mensagem com carinho!

*Como posso te ajudar?*
- 📅 Marcar um agendamento
- 💅 Conhecer nossos serviços
- ⏰ Ver disponibilidade
- ❓ Tirar uma dúvida
- ⚠️ Cancelar ou remarcar

Me fala aí! Estou aqui pra deixar você linda! ✨`;
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

          const bookingReply = await processWhatsAppBooking({
            conversation: conversation as any,
            text,
            clientName,
            clientPhone: waContactId
          });
          if (bookingReply) {
            const sent = await sendWhatsAppText(waContactId, bookingReply);
            await supabaseRequest('whatsapp_messages', {
              method: 'POST',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                conversation_id: conversation.id,
                whatsapp_message_id: sent.messages?.[0]?.id || null,
                direction: 'saida',
                sender_type: 'bot',
                sender_name: 'Agenda LEV',
                body: bookingReply,
                message_type: 'text',
                status: 'enviada',
                sent_at: now
              })
            });
            continue;
          }

          // Enviar resposta automática (bot + profissional)
          if (!existing && conversationRow.bot_enabled) {
            let automaticText: string;

            if (selectedProfessional) {
              // Cliente selecionou profissional
              const profName = professionalName(selectedProfessional);
              automaticText = `Oi, ${clientName}! 👋 Que alegria saber que você quer falar com ${profName}!

${profName} continuará a conversa por aqui assim que estiver disponível. Enquanto isso, você pode me tirar qualquer dúvida! 😊

Estamos aqui para deixar você linda! ✨`;

              // Notificar profissional sobre novo cliente
              const professionalPhones: Record<string, string> = {
                'prof_elisangela': process.env.ELISANGELA_PHONE || '',
                'prof_talitha': process.env.TALITHA_PHONE || '',
                'prof_nayara': process.env.NAYARA_PHONE || ''
              };

              const profPhone = professionalPhones[selectedProfessional];
              if (profPhone) {
                await sendWhatsAppText(
                  profPhone,
                  `📱 *Novo cliente esperando!*\n\n👤 ${clientName}\n💬 "${text}"\n\nResponda por aqui quando estiver disponível! ✨`
                );
              }
            } else {
              // Cliente não selecionou - mostrar opções
              automaticText = `Oi, ${clientName}! Bem-vinda ao LEV Coworking Beauty! 💅✨

*Com quem você deseja conversar?*
1️⃣ *Elisangela* — Unhas impecáveis (Manicure, Pedicure, SPA)
2️⃣ *Talitha* — Maquiagem, Penteados & Sobrancelhas
3️⃣ *Nayara* — Unhas em Gel Lindíssimas

Responda com o número ou com o nome! 😊`;
            }

            const sent = await sendWhatsAppText(waContactId, automaticText);
            await supabaseRequest('whatsapp_messages', {
              method: 'POST',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                conversation_id: conversation.id,
                whatsapp_message_id: sent.messages?.[0]?.id || null,
                direction: 'saida',
                sender_type: selectedProfessional ? 'bot' : 'bot',
                sender_name: selectedProfessional ? professionalName(selectedProfessional) : 'Assistente LEV',
                body: automaticText,
                message_type: 'text',
                status: 'enviada',
                sent_at: now
              })
            });
          } else if (existing && conversationRow.bot_enabled && !selectedProfessional) {
            // Cliente já foi convertido, responder inteligentemente
            const botResponse = await processClientMessage(waContactId, clientName, text);
            const sent = await sendWhatsAppText(waContactId, botResponse);
            await supabaseRequest('whatsapp_messages', {
              method: 'POST',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({
                conversation_id: conversation.id,
                whatsapp_message_id: sent.messages?.[0]?.id || null,
                direction: 'saida',
                sender_type: 'bot',
                sender_name: 'Assistente LEV',
                body: botResponse,
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
