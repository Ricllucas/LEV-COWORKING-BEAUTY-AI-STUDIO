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
    'prof_elisangela': '5541992461203',
    'prof_talitha': '5541999983228',
    'prof_nayara': '5541996556742'
  };
  return phones[professionalId] || '';
};

const getProfessionalIdByName = (professionalName: string): string => {
  const professionalIds: Record<string, string> = {
    Elisangela: 'prof_elisangela',
    Talitha: 'prof_talitha',
    Nayara: 'prof_nayara'
  };
  return professionalIds[professionalName] || '';
};

const sendWhatsAppNotification = async (
  recipientPhone: string,
  professionalName: string,
  appointmentData: NotificationData
): Promise<boolean> => {
  try {
    const accessToken = requireEnv('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = requireEnv('WHATSAPP_PHONE_NUMBER_ID');

    const cancelled = appointmentData.status === 'cancelado_cliente' || appointmentData.status === 'cancelado_coworking';
    const message = `
${cancelled ? '❌ *Agendamento Cancelado*' : '🔔 *Novo Agendamento!*'}

📅 Data: ${appointmentData.date}
⏰ Horário: ${appointmentData.startTime} - ${appointmentData.endTime}
👤 Cliente: ${appointmentData.clientName}
📱 Telefone: ${appointmentData.clientPhone}
💅 Serviço: ${appointmentData.serviceNames.join(', ')}

Status: ${cancelled ? '❌ Cancelado pela cliente' : appointmentData.status === 'confirmado' ? '✅ Confirmado' : '⏳ Pendente'}

*${cancelled ? 'O horário já foi liberado no sistema e no Google Agenda.' : 'Confira na agenda do LEV para mais detalhes.'}*
    `.trim();

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
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

const notifyScheduledProfessional = async (
  appointmentData: NotificationData,
  scheduledProfessionalId: string
): Promise<void> => {
  const phone = getProfessionalPhone(scheduledProfessionalId);
  if (phone) await sendWhatsAppNotification(phone, appointmentData.professionalName, appointmentData);
};

export const notificationService = {
  notifyNewAppointment: async (
    appointmentData: NotificationData,
    professionalId: string
  ): Promise<{ sent: boolean; error?: string }> => {
    try {
      await notifyScheduledProfessional(appointmentData, professionalId);
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
      const professionalId = getProfessionalIdByName(appointmentData.professionalName);
      if (professionalId) await notifyScheduledProfessional(appointmentData, professionalId);
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

