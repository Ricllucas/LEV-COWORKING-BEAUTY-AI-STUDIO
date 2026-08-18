Exit code: 0
Wall time: 0.6 seconds
Output:
import { Appointment } from '../../src/types/index.js';
import { whatsappService } from './whatsappService.js';
import { getTemplate, replaceTemplateVariables } from './whatsappTemplates.js';

// Store para rastrear lembretes já enviados (em produção usar Redis/DB)
const sentReminders = new Set<string>();

interface ScheduledReminder {
  appointmentId: string;
  type: '1dia' | '1hora';
  scheduledFor: Date;
}

// Lembretes agendados na memória (em produção usar cron job real)
const scheduledReminders: ScheduledReminder[] = [];

export const reminderScheduler = {
  // Agendar lembretes para um agendamento
  scheduleReminders: async (appointment: Appointment): Promise<void> => {
    if (appointment.status !== 'confirmado') return;

    const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}:00`);

    // Lembrete 1 dia antes
    const oneDayBefore = new Date(appointmentDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(10, 0, 0, 0); // 10:00 AM

    scheduledReminders.push({
      appointmentId: appointment.id,
      type: '1dia',
      scheduledFor: oneDayBefore
    });

    // Lembrete 1 hora antes
    const oneHourBefore = new Date(appointmentDate);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    scheduledReminders.push({
      appointmentId: appointment.id,
      type: '1hora',
      scheduledFor: oneHourBefore
    });
  },

  // Processar lembretes pendentes (chamar periodicamente)
  processReminders: async (
    appointments: Appointment[]
  ): Promise<{ sent: number; failed: number }> => {
    const now = new Date();
    let sent = 0;
    let failed = 0;

    for (const reminder of scheduledReminders) {
      // Verificar se é hora de enviar
      if (now >= reminder.scheduledFor) {
        const appointment = appointments.find(a => a.id === reminder.appointmentId);

        if (appointment && appointment.status === 'confirmado') {
          const reminderId = `${reminder.appointmentId}-${reminder.type}`;

          // Evitar enviar o mesmo lembrete duas vezes
          if (!sentReminders.has(reminderId)) {
            try {
              const template = getTemplate(
                appointment.professionalId,
                reminder.type === '1dia' ? 'lembrete1Dia' : 'lembrete1Hora'
              );

              const message = replaceTemplateVariables(template, {
                clientName: appointment.clientName,
                date: formatDateBR(appointment.date),
                time: appointment.startTime,
                service: appointment.serviceNames.join(', '),
                price: appointment.totalPrice?.toString()
              });

              await whatsappService.sendMessage(appointment.clientPhone, message);

              sentReminders.add(reminderId);
              sent++;
            } catch (error) {
              console.error(`Failed to send reminder for ${reminder.appointmentId}:`, error);
              failed++;
            }
          }
        }

        // Remover lembrete já processado
        scheduledReminders.splice(scheduledReminders.indexOf(reminder), 1);
      }
    }

    return { sent, failed };
  },

  // Enviar confirmação imediata
  sendConfirmation: async (appointment: Appointment): Promise<boolean> => {
    try {
      const template = getTemplate(appointment.professionalId, 'confirmacao');

      const message = replaceTemplateVariables(template, {
        clientName: appointment.clientName,
        date: formatDateBR(appointment.date),
        time: appointment.startTime,
        service: appointment.serviceNames.join(', '),
        price: appointment.totalPrice?.toString()
      });

      await whatsappService.sendMessage(appointment.clientPhone, message);
      return true;
    } catch (error) {
      console.error('Failed to send confirmation:', error);
      return false;
    }
  },

  // Enviar mensagem de agradecimento
  sendThankYou: async (appointment: Appointment): Promise<boolean> => {
    try {
      const template = getTemplate(appointment.professionalId, 'obrigada');

      const message = replaceTemplateVariables(template, {
        clientName: appointment.clientName,
        date: formatDateBR(appointment.date),
        time: appointment.startTime
      });

      await whatsappService.sendMessage(appointment.clientPhone, message);
      return true;
    } catch (error) {
      console.error('Failed to send thank you message:', error);
      return false;
    }
  },

  // Notificar profissional sobre mensagem de cliente
  notifyProfessional: async (
    professionalPhone: string,
    clientName: string,
    message: string,
    appointmentDate?: string
  ): Promise<boolean> => {
    try {
      const notification = `📱 *Nova mensagem de cliente*

👤 *${clientName}*
💬 "${message}"

${appointmentDate ? `📅 Agendamento: ${appointmentDate}` : ''}

*Responda por aqui!* Use os templates da profissional para responder de forma padronizada.`;

      await whatsappService.sendMessage(professionalPhone, notification);
      return true;
    } catch (error) {
      console.error('Failed to notify professional:', error);
      return false;
    }
  }
};

// Helper para formatar data
function formatDateBR(date: string): string {
  const [year, month, day] = date.split('-');
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return `${day} de ${monthNames[parseInt(month) - 1]} de ${year}`;
}

