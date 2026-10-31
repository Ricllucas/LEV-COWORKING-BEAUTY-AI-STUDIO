import { normalizePhone, professionalName, sendWhatsAppTemplate, supabaseRequest } from '../_lib/whatsapp.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!process.env.WHATSAPP_AUTOMATION_SECRET || req.headers['x-automation-secret'] !== process.env.WHATSAPP_AUTOMATION_SECRET) {
    return json(res, 401, { error: 'Assinatura da automação inválida.' });
  }

  try {
    const webhook = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const record = webhook.record || webhook.new || webhook;
    const appointment = record.payload || record;
    if (!appointment?.id || !appointment?.clientPhone || !appointment?.professionalId) {
      return json(res, 400, { error: 'Agendamento incompleto.' });
    }

    const phone = normalizePhone(appointment.clientPhone);
    const templateName = process.env.WHATSAPP_CONFIRMATION_TEMPLATE;
    if (!templateName) return json(res, 503, { error: 'Modelo de confirmação ainda não configurado.' });

    const professional = appointment.professionalName || professionalName(appointment.professionalId);
    const service = Array.isArray(appointment.serviceNames) ? appointment.serviceNames.join(', ') : 'Atendimento LEV';
    const metaResult = await sendWhatsAppTemplate(phone, templateName, [
      appointment.clientName || 'Cliente',
      service,
      professional || 'Profissional LEV',
      appointment.date,
      appointment.startTime
    ]);
    const now = new Date().toISOString();
    const conversationResponse = await supabaseRequest('whatsapp_conversations?on_conflict=wa_contact_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        wa_contact_id: phone,
        client_phone: phone,
        client_name: appointment.clientName || phone,
        assigned_professional_id: appointment.professionalId,
        assigned_professional_name: professional,
        appointment_id: appointment.id,
        status: 'aguardando',
        bot_enabled: true,
        unread_count: 0,
        last_message: 'Confirmação de agendamento enviada',
        last_message_at: now,
        updated_at: now
      })
    });
    if (!conversationResponse.ok) throw new Error('Não foi possível registrar a conversa da cliente.');
    const conversations = await conversationResponse.json() as Array<{ id: string }>;

    await supabaseRequest('whatsapp_messages', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        conversation_id: conversations[0].id,
        whatsapp_message_id: metaResult.messages?.[0]?.id || null,
        direction: 'saida',
        sender_type: 'sistema',
        sender_name: 'Automação LEV',
        body: `Confirmação: ${service} com ${professional}, ${appointment.date} às ${appointment.startTime}.`,
        message_type: 'text',
        status: 'enviada',
        sent_at: now
      })
    });

    return json(res, 200, { sent: true });
  } catch (error) {
    console.error('Appointment WhatsApp automation error:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha na confirmação automática.' });
  }
}
