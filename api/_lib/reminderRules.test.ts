import { describe, it, expect } from 'vitest';
import {
  isCronAuthorized,
  isDueFor1Day,
  isDueFor1Hour,
  mergeRemindersSent,
  toReminderCandidate,
} from './reminderRules';

const row = (payload: Record<string, unknown>, reminders_sent?: Record<string, boolean>) => ({
  id: 'apt_1',
  payload: {
    id: 'apt_1',
    clientName: 'Maria',
    clientPhone: '5511999999999',
    professionalId: 'prof_elisangela',
    serviceNames: ['Manicure'],
    date: '2026-10-02',
    startTime: '14:00',
    totalPrice: 50,
    status: 'confirmado',
    ...payload,
  },
  reminders_sent,
});

describe('toReminderCandidate', () => {
  it('lê os campos camelCase do payload', () => {
    expect(toReminderCandidate(row({}))).toEqual({
      id: 'apt_1',
      clientName: 'Maria',
      clientPhone: '5511999999999',
      professionalId: 'prof_elisangela',
      serviceNames: ['Manicure'],
      date: '2026-10-02',
      startTime: '14:00',
      totalPrice: 50,
      remindersSent: {},
    });
  });

  it('mantém os lembretes já enviados', () => {
    expect(toReminderCandidate(row({}, { '1dia': true }))?.remindersSent).toEqual({ '1dia': true });
  });

  it('descarta agendamento sem telefone', () => {
    expect(toReminderCandidate(row({ clientPhone: '' }))).toBeNull();
  });

  it('descarta agendamentos cancelados, concluídos ou com falta', () => {
    for (const status of ['cancelado_cliente', 'cancelado_coworking', 'concluido', 'nao_compareceu']) {
      expect(toReminderCandidate(row({ status }))).toBeNull();
    }
  });

  it('aceita agendamento aguardando confirmação', () => {
    expect(toReminderCandidate(row({ status: 'aguardando_confirmacao' }))).not.toBeNull();
  });

  it('descarta linha sem payload', () => {
    expect(toReminderCandidate({ id: 'x', payload: null })).toBeNull();
  });
});

describe('janelas de envio (horário de Brasília)', () => {
  const apt = { date: '2026-10-02', startTime: '14:00' }; // 17:00 UTC

  it('lembrete de 1 dia: entre 20h e 26h antes', () => {
    expect(isDueFor1Day(apt, new Date('2026-10-01T17:00:00Z'))).toBe(true); // 24h antes
    expect(isDueFor1Day(apt, new Date('2026-10-01T21:30:00Z'))).toBe(false); // 19,5h antes
    expect(isDueFor1Day(apt, new Date('2026-10-01T14:00:00Z'))).toBe(false); // 27h antes
  });

  it('lembrete de 1 hora: entre 50 e 70 minutos antes', () => {
    expect(isDueFor1Hour(apt, new Date('2026-10-02T16:00:00Z'))).toBe(true); // 60 min antes
    expect(isDueFor1Hour(apt, new Date('2026-10-02T16:15:00Z'))).toBe(false); // 45 min antes
    expect(isDueFor1Hour(apt, new Date('2026-10-02T15:45:00Z'))).toBe(false); // 75 min antes
  });
});

describe('mergeRemindersSent', () => {
  it('preserva os lembretes anteriores', () => {
    expect(mergeRemindersSent({ '1dia': true }, '1hora')).toEqual({ '1dia': true, '1hora': true });
  });
});

describe('isCronAuthorized', () => {
  it('aceita o Bearer com o segredo correto', () => {
    expect(isCronAuthorized('Bearer segredo-longo', 'segredo-longo')).toBe(true);
  });

  it('recusa segredo errado ou ausente', () => {
    expect(isCronAuthorized('Bearer outro', 'segredo-longo')).toBe(false);
    expect(isCronAuthorized(undefined, 'segredo-longo')).toBe(false);
  });

  it('recusa tudo quando CRON_SECRET não está configurado', () => {
    expect(isCronAuthorized('Bearer undefined', undefined)).toBe(false);
    expect(isCronAuthorized('Bearer ', '')).toBe(false);
  });
});
