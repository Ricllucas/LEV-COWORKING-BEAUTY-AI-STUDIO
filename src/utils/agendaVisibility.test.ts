import { describe, expect, it } from 'vitest';
import { canSeeAppointmentPrice, visibleAgendaAppointments } from './agendaVisibility';
import type { Appointment, User } from '../types';

const apt = (id: string, professionalId: string) => ({ id, professionalId } as Appointment);
const all = [apt('a1', 'prof_elisangela'), apt('a2', 'prof_talitha'), apt('a3', 'prof_nayara')];
const talitha = { role: 'profissional', professionalId: 'prof_talitha' } as User;
const admin = { role: 'admin' } as User;

describe('agenda compartilhada entre profissionais', () => {
  it('ligada: a profissional vê os atendimentos de todas', () => {
    expect(visibleAgendaAppointments(all, talitha, true).map(a => a.id)).toEqual(['a1', 'a2', 'a3']);
  });

  it('desligada: a profissional vê só os próprios', () => {
    expect(visibleAgendaAppointments(all, talitha, false).map(a => a.id)).toEqual(['a2']);
  });

  it('a admin vê todos, ligada ou desligada', () => {
    expect(visibleAgendaAppointments(all, admin, false)).toHaveLength(3);
  });

  it('valor do atendimento: a profissional só vê o dos próprios', () => {
    expect(canSeeAppointmentPrice(all[1], talitha)).toBe(true);
    expect(canSeeAppointmentPrice(all[0], talitha)).toBe(false);
    expect(canSeeAppointmentPrice(all[0], admin)).toBe(true);
  });
});
