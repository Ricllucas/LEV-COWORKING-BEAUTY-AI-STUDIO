const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

interface WhatsAppMessage {
  from: string;
  to: string;
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: string[];
}

interface WebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
    }>;
  }>;
}

export const whatsappService = {
  // Enviar mensagem de texto simples
  sendMessage: async (recipientPhone: string, message: string): Promise<boolean> => {
    try {
      const accessToken = requireEnv('WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = requireEnv('WHATSAPP_PHONE_NUMBER_ID');

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipientPhone.replace(/\D/g, ''),
            type: 'text',
            text: { body: message }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('WhatsApp send error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('WhatsApp service error:', error);
      return false;
    }
  },

  // Enviar mensagem usando template
  sendTemplate: async (
    recipientPhone: string,
    templateName: string,
    parameters: string[]
  ): Promise<boolean> => {
    try {
      const accessToken = requireEnv('WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = requireEnv('WHATSAPP_PHONE_NUMBER_ID');

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipientPhone.replace(/\D/g, ''),
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: 'pt_BR'
              },
              parameters: {
                body: {
                  parameters: parameters.map(p => ({ type: 'text', text: p }))
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('WhatsApp template send error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('WhatsApp template service error:', error);
      return false;
    }
  },

  // Marcar mensagem como lida
  markAsRead: async (messageId: string): Promise<boolean> => {
    try {
      const accessToken = requireEnv('WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = requireEnv('WHATSAPP_PHONE_NUMBER_ID');

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Mark as read error:', error);
      return false;
    }
  },

  // Validar webhook
  validateWebhook: (
    verifyToken: string,
    incomingToken: string
  ): boolean => {
    return verifyToken === incomingToken;
  },

  // Processar webhook de entrada
  processWebhook: async (
    event: WebhookEvent,
    onMessageReceived?: (from: string, message: string, timestamp: string) => Promise<void>
  ): Promise<void> => {
    for (const entry of event.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Processar mensagens recebidas
        if (value.messages) {
          for (const message of value.messages) {
            if (message.type === 'text' && message.text?.body) {
              // Marcar como lida
              await whatsappService.markAsRead(message.id);

              // Chamar callback se fornecido
              if (onMessageReceived) {
                await onMessageReceived(message.from, message.text.body, message.timestamp);
              }
            }
          }
        }

        // Processar status de entrega
        if (value.statuses) {
          for (const status of value.statuses) {
            console.log(`Message ${status.id} status: ${status.status}`);
            // Aqui você pode atualizar o banco de dados com status de entrega
          }
        }
      }
    }
  },

  // Extrair info de cliente de número de telefone (helper)
  parsePhoneNumber: (phone: string): string => {
    return phone.replace(/\D/g, '');
  },

  // Formatar número para exibição
  formatPhoneForDisplay: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      // Formato: (XX) XXXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  }
};
