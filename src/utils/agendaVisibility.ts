import type { Appointment, User } from '../types';

// Quais atendimentos a pessoa logada vê no painel.
// Agenda compartilhada ligada: a profissional vê os horários de todas as colegas
// (só leitura; mexer no atendimento de outra continua bloqueado no servidor).
export const visibleAgendaAppointments = (appointments: Appointment[], user: User, sharedAgenda: boolean) => {
  if (user.role !== 'profissional' || !user.professionalId || sharedAgenda) return appointments;
  return appointments.filter(apt => apt.professionalId === user.professionalId);
};

// Valor é informação financeira de cada MEI: a profissional só vê o dos próprios atendimentos.
export const canSeeAppointmentPrice = (appointment: Appointment, user: User) =>
  user.role !== 'profissional' || appointment.professionalId === user.professionalId;
