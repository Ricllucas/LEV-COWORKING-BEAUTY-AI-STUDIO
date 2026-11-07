import type { Appointment, ScheduleBlock, User } from '../types';

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

// Desbloquear horário: a admin mexe em qualquer bloqueio; a profissional só nos dela
// (o banco confere a mesma regra).
export const canRemoveScheduleBlock = (block: Pick<ScheduleBlock, 'professionalId'>, user: User) =>
  user.role === 'admin' || (user.role === 'profissional' && !!user.professionalId && block.professionalId === user.professionalId);
