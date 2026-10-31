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

// As notificações pelo número central da LEV foram desativadas.
export const notificationService = {
 notifyNewAppointment: async (_appointmentData: NotificationData, _professionalId: string): Promise<{ sent: boolean }> => ({ sent: false }),
 notifyAppointmentStatusChange: async (_appointmentData: NotificationData): Promise<{ sent: boolean }> => ({ sent: false })
};
