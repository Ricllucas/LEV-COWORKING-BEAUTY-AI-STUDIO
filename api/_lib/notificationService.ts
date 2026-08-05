const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

interface NotificationData {
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  professionalName: string;
  serviceNames: string[];
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const getProfessionalPhone = (professionalId: string): string => {
  const phones: Record<string, string> = {
    'prof_elisangela': '5541984979940',
    'prof_talitha': '5541984979940',
    'prof_nayara': '5541984979940'
  };
  return phones[professionalId] || '';
};

const sendWhatsAppNotification = async (
  recipientPhone: string,
  professionalName: string,
  appointmentData: NotificationData
): Promise<boolean> => {
  try {
    const accessToken = requireEnv('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = requireEnv('WHATSAPP_PHONE_NUMBER_ID');

    const message = `
🔔 *Novo Agendamento!*

📅 Data: ${appointmentData.date}
⏰ Horário: ${appointmentData.startTime} - ${appointmentData.endTime}
👤 Cliente: ${appointmentData.clientName}
📱 Telefone: ${appointmentData.clientPhone}
💅 Serviço: ${appointmentData.serviceNames.join(', ')}

Status: ${appointmentData.status === 'confirmado' ? '✅ Confirmado' : '⏳ Pendente'}

*Confira na agenda do LEV para mais detalhes.*
    `.trim();

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
          to: recipientPhone,
          type: 'text',
          text: { body: message }
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return false;
  }
};

const notifyAllProfessionals = async (
  appointmentData: NotificationData,
  scheduledProfessionalId: string
): Promise<void> => {
  const allProfessionals = ['prof_elisangela', 'prof_talitha', 'prof_nayara'];

  for (const profId of allProfessionals) {
    const phone = getProfessionalPhone(profId);
    if (phone) {
      await sendWhatsAppNotification(phone, appointmentData.professionalName, appointmentData);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

export const notificationService = {
  notifyNewAppointment: async (
    appointmentData: NotificationData,
    professionalId: string
  ): Promise<{ sent: boolean; error?: string }> => {
    try {
      await notifyAllProfessionals(appointmentData, professionalId);
      return { sent: true };
    } catch (error) {
      console.error('Notification service error:', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar notificações'
      };
    }
  },

  notifyAppointmentStatusChange: async (
    appointmentData: NotificationData
  ): Promise<{ sent: boolean; error?: string }> => {
    try {
      await notifyAllProfessionals(appointmentData, appointmentData.professionalName);
      return { sent: true };
    } catch (error) {
      console.error('Status change notification error:', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar notificações de status'
      };
    }
  }
};
