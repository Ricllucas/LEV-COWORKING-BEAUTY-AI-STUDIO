import { describe, expect, it } from 'vitest';
import { findMaintenanceDue, isDueForConfirmation, isDueForThanks, isWithinSendingHours, messages, type AutomatedAppointment } from './automatedMessages';
import { toBrazilianNumber } from './openwa';

const apt = (overrides: Partial<AutomatedAppointment>): AutomatedAppointment => ({
  id: 'a1',
  clientName: 'Ana Paula',
  clientPhone: '(41) 99999-1111',
  professionalId: 'prof_nayara',
  professionalName: 'Nayara',
  serviceNames: ['Esmaltação em Gel'],
  date: '2026-11-02',
  startTime: '10:00',
  endTime: '11:00',
  status: 'concluido',
  ...overrides
});

// Horários em UTC; Brasília = UTC-3
const at = (iso: string) => new Date(iso);

describe('mensagens automáticas', () => {
  it('só envia entre 8h e 20h de Brasília', () => {
    expect(isWithinSendingHours(at('2026-11-02T10:59:00Z'))).toBe(false);
    expect(isWithinSendingHours(at('2026-11-02T11:00:00Z'))).toBe(true);
    expect(isWithinSendingHours(at('2026-11-02T23:00:00Z'))).toBe(false);
  });

  it('agradece 1 hora depois do fim do atendimento concluído', () => {
    expect(isDueForThanks(apt({}), at('2026-11-02T14:30:00Z'))).toBe(false);
    expect(isDueForThanks(apt({}), at('2026-11-02T15:00:00Z'))).toBe(true);
    expect(isDueForThanks(apt({ status: 'confirmado' }), at('2026-11-02T18:00:00Z'))).toBe(false);
    expect(isDueForThanks(apt({ date: '2026-10-30' }), at('2026-11-02T18:00:00Z'))).toBe(false);
  });

  it('chama para manutenção no prazo, se não houver horário marcado', () => {
    const gel = apt({ date: '2026-10-18' });
    expect(findMaintenanceDue([gel], new Set(), '2026-11-02')).toHaveLength(1);
    expect(findMaintenanceDue([gel], new Set(), '2026-11-01')).toHaveLength(0);
    expect(findMaintenanceDue([gel], new Set(['99991111']), '2026-11-02')).toHaveLength(0);
    expect(findMaintenanceDue([apt({ serviceNames: ['Maquiagem Social'] })], new Set(), '2026-12-30')).toHaveLength(0);
  });

  it('não chama manutenções vencidas antes de o robô ser ligado', () => {
    expect(findMaintenanceDue([apt({ date: '2026-10-10' })], new Set(), '2026-11-05')).toHaveLength(0);
  });

  it('monta a mensagem de manutenção com o primeiro nome e o prazo', () => {
    const [due] = findMaintenanceDue([apt({ date: '2026-10-18' })], new Set(), '2026-11-02');
    expect(messages.maintenance(due)).toContain('Ana, maravilhosa');
    expect(messages.maintenance(due)).toContain('linda');
    expect(messages.maintenance(due)).toContain('15 dias');
  });

  it('confirma para a cliente só depois que a equipe confirma o horário', () => {
    const futuro = { date: '2026-11-05', startTime: '10:00', createdAt: '2026-11-02T16:00:00.000Z' };
    const agora = at('2026-11-02T17:00:00Z');
    expect(isDueForConfirmation(apt({ ...futuro, status: 'aguardando_confirmacao' }), agora)).toBe(false);
    expect(isDueForConfirmation(apt({ ...futuro, status: 'confirmado' }), agora)).toBe(true);
  });

  it('não confirma horário passado, muito próximo ou criado antes do robô', () => {
    const base = { status: 'confirmado', createdAt: '2026-11-02T16:00:00.000Z' };
    // Começa em 1 hora: o lembrete de 1 hora já cobre
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-02', startTime: '15:00' }), at('2026-11-02T17:00:00Z'))).toBe(false);
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-01', startTime: '15:00' }), at('2026-11-02T17:00:00Z'))).toBe(false);
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-05', createdAt: '2026-10-20T12:00:00.000Z' }), at('2026-11-02T17:00:00Z'))).toBe(false);
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-05', createdAt: undefined }), at('2026-11-02T17:00:00Z'))).toBe(false);
  });

  it('monta a confirmação com data, horário, profissional e serviço', () => {
    const text = messages.confirmation(apt({ date: '2026-11-05', startTime: '10:00', status: 'confirmado' }));
    expect(text).toContain('Ana, maravilhosa');
    expect(text).toContain('linda');
    expect(text).toContain('05/11/2026');
    expect(text).toContain('10:00');
    expect(text).toContain('Nayara');
    expect(text).toContain('Esmaltação em Gel');
  });

  it('todas as mensagens para a cliente são carinhosas e elogiam a cliente', () => {
    const a = apt({ date: '2026-11-05', startTime: '10:00', status: 'confirmado' });
    for (const text of [messages.confirmation(a), messages.reminder1Day(a), messages.reminder1Hour(a), messages.thanks(a)]) {
      expect(text).toContain('Ana');
      expect(text).toMatch(/maravilhosa|linda/);
      expect(text).toMatch(/deslumbrante|linda/);
    }
  });

  it('normaliza telefones brasileiros para o WhatsApp', () => {
    expect(toBrazilianNumber('(41) 99999-1111')).toBe('5541999991111');
    expect(toBrazilianNumber('5541999991111')).toBe('5541999991111');
    expect(toBrazilianNumber('123')).toBe('');
  });
});
