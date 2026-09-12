import { whatsappService } from './whatsappService.js';

interface AppointmentData {
  clientName: string;
  clientPhone: string;
  professionalId: string;
  professionalName: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceNames: string[];
  totalPrice: number;
}

// Números de WhatsApp das profissionais
const PROFESSIONAL_PHONES: Record<string, string> = {
  prof_elisangela: '+5541992461203',
  prof_talitha: '+5541999983228',
  prof_nayara: '+5541996556742',
};

const formatDateBR = (date: string): string => {
  const [year, month, day] = date.split('-');
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${day} de ${monthNames[parseInt(month) - 1]} de ${year}`;
};

export const sendProfessionalNotification = async (appointment: AppointmentData): Promise<boolean> => {
  try {
    const professionalPhone = PROFESSIONAL_PHONES[appointment.professionalId];

    if (!professionalPhone) {
      console.error(`Phone not found for professional: ${appointment.professionalId}`);
      return false;
    }

    const message = `📱 *NOVO AGENDAMENTO CONFIRMADO*

👤 *Cliente:* ${appointment.clientName}
📞 *Telefone:* ${appointment.clientPhone}

💆‍♀️ *Serviço:* ${appointment.serviceNames.join(', ')}
📅 *Data:* ${formatDateBR(appointment.date)}
⏰ *Horário:* ${appointment.startTime} às ${appointment.endTime}
💰 *Valor:* R$ ${appointment.totalPrice.toFixed(2).replace('.', ',')}

✅ Agendamento confirmado e sincronizado com Google Agenda
🔔 Lembretes automáticos serão enviados 1 dia e 1 hora antes

Responda por aqui se precisar confirmar ou ajustar algo! 💬`;

    const success = await whatsappService.sendMessage(professionalPhone, message);

    if (success) {
      console.log(`[NOTIFICATION] Professional notification sent to ${appointment.professionalName}`);
    } else {
      console.error(`[NOTIFICATION] Failed to send notification to ${appointment.professionalName}`);
    }

    return success;
  } catch (error) {
    console.error('[NOTIFICATION] Error sending professional notification:', error);
    return false;
  }
};
