import { describe, expect, it } from 'vitest';
import { findMaintenanceDue, isDueForConfirmation, isDueForThanks, isWithinSendingHours, messages, renderMessage, type AutomatedAppointment, type SalonNames } from './automatedMessages';
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

const LEV: SalonNames = { name: 'LEV Coworking Beauty', shortName: 'LEV' };
const AURORA: SalonNames = { name: 'Studio Aurora', shortName: 'Aurora' };

// Horários em UTC; Brasília = UTC-3
const at = (iso: string) => new Date(iso);

describe('mensagens automáticas', () => {
  it('só envia entre 8h e 23h de Brasília', () => {
    expect(isWithinSendingHours(at('2026-11-02T10:59:00Z'))).toBe(false);
    expect(isWithinSendingHours(at('2026-11-02T11:00:00Z'))).toBe(true);
    expect(isWithinSendingHours(at('2026-11-02T23:00:00Z'))).toBe(true);
    expect(isWithinSendingHours(at('2026-11-03T01:59:00Z'))).toBe(true);
    expect(isWithinSendingHours(at('2026-11-03T02:00:00Z'))).toBe(false);
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
    expect(messages.maintenance(due, LEV)).toContain('Ana, maravilhosa');
    expect(messages.maintenance(due, LEV)).toContain('linda');
    expect(messages.maintenance(due, LEV)).toContain('15 dias');
  });

  it('confirma para a cliente só depois que a equipe confirma o horário', () => {
    const futuro = { date: '2026-11-05', startTime: '10:00', createdAt: '2026-11-02T16:00:00.000Z' };
    const agora = at('2026-11-02T17:00:00Z');
    expect(isDueForConfirmation(apt({ ...futuro, status: 'aguardando_confirmacao' }), agora)).toBe(false);
    expect(isDueForConfirmation(apt({ ...futuro, status: 'confirmado' }), agora)).toBe(true);
  });

  it('encaixe de última hora: confirma mesmo faltando menos de 50 minutos', () => {
    const base = { status: 'confirmado', createdAt: '2026-11-02T16:00:00.000Z', date: '2026-11-02', startTime: '14:30' };
    // 14:14 em Brasília, horário às 14:30 (16 minutos)
    expect(isDueForConfirmation(apt(base), at('2026-11-02T17:14:00Z'))).toBe(true);
    expect(isDueForConfirmation(apt(base), at('2026-11-02T17:14:00Z'), {})).toBe(true);
  });

  it('não confirma depois que o lembrete de 1 hora já saiu (evita mensagem dupla)', () => {
    const base = { status: 'confirmado', createdAt: '2026-11-02T16:00:00.000Z', date: '2026-11-02', startTime: '14:30' };
    expect(isDueForConfirmation(apt(base), at('2026-11-02T17:14:00Z'), { '1hora': true })).toBe(false);
  });

  it('não confirma horário passado, muito próximo ou criado antes do robô', () => {
    const base = { status: 'confirmado', createdAt: '2026-11-02T16:00:00.000Z' };
    // Começa em 1 hora e o lembrete de 1 hora já saiu
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-02', startTime: '15:00' }), at('2026-11-02T17:00:00Z'), { '1hora': true })).toBe(false);
    // Já começou
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-02', startTime: '14:00' }), at('2026-11-02T17:00:00Z'))).toBe(false);
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-01', startTime: '15:00' }), at('2026-11-02T17:00:00Z'))).toBe(false);
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-05', createdAt: '2026-10-20T12:00:00.000Z' }), at('2026-11-02T17:00:00Z'))).toBe(false);
    expect(isDueForConfirmation(apt({ ...base, date: '2026-11-05', createdAt: undefined }), at('2026-11-02T17:00:00Z'))).toBe(false);
  });

  it('confirmação no texto aprovado pela LEV', () => {
    const a = apt({ clientName: 'Erica Souza', date: '2026-11-04', startTime: '17:30', status: 'confirmado', professionalName: 'Elisangela', serviceNames: ['Mão tradicional'] });
    expect(messages.confirmation(a, LEV)).toBe(
      'Olá, Erica! Tudo bem? Seu horário no LEV Coworking Beauty está confirmado!\n\n' +
      '📅 04/11/2026\n' +
      '🕒 Às 17h30\n' +
      '💅 Serviço: Mão tradicional\n' +
      '👩 Profissional: Elisangela\n\n' +
      'Agradecemos pela preferência! Será um prazer recebê-la. ✨\n' +
      'Caso precise remarcar, pedimos que nos avise com antecedência.'
    );
  });

  it('confirmação com mais de um serviço e hora cheia', () => {
    const text = messages.confirmation(apt({ date: '2026-11-05', startTime: '09:00', status: 'confirmado', serviceNames: ['Pé', 'Mão'] }), LEV);
    expect(text).toContain('🕒 Às 9h\n');
    expect(text).toContain('💅 Serviços: Pé, Mão\n');
  });

  it('lembrete de 1 hora no texto aprovado pela LEV', () => {
    const a = apt({ clientName: 'Erica Souza', date: '2026-11-04', startTime: '17:30', professionalName: 'Elisangela' });
    expect(messages.reminder1Hour(a, LEV)).toBe('Olá, Erica! Passando para lembrar que seu horário no LEV é hoje, às 17h30, com Elisangela. Esperamos você! Até mais. 🤍');
  });

  it('lembrete da véspera no mesmo estilo', () => {
    const a = apt({ clientName: 'Erica Souza', date: '2026-11-05', startTime: '17:30', professionalName: 'Elisangela' });
    expect(messages.reminder1Day(a, LEV)).toBe('Olá, Erica! Passando para lembrar que seu horário no LEV é amanhã, às 17h30, com Elisangela. Esperamos você! Até mais. 🤍');
  });

  it('agradecimento continua carinhoso e elogia a cliente', () => {
    const text = messages.thanks(apt({ date: '2026-11-05', startTime: '10:00' }), LEV);
    expect(text).toContain('Ana');
    expect(text).toMatch(/maravilhosa|linda/);
  });

  it('normaliza telefones brasileiros para o WhatsApp', () => {
    expect(toBrazilianNumber('(41) 99999-1111')).toBe('5541999991111');
    expect(toBrazilianNumber('5541999991111')).toBe('5541999991111');
    expect(toBrazilianNumber('123')).toBe('');
  });
});
describe('mensagens com o nome do salão', () => {
  // Atendimento fixo; textos copiados da saída de antes da Fase 3 (aprovados pela LEV em 04/11/2026)
  const fixed = apt({
    clientName: 'Maria Souza', professionalId: 'prof_talitha', professionalName: 'Talitha',
    serviceNames: ['Lash Lifting'], date: '2026-11-20', startTime: '14:00', endTime: '15:00', status: 'confirmado'
  });
  const due = { appointment: fixed, serviceName: 'Lash Lifting', days: 21 };

  it('LEV: as 5 mensagens saem iguais, caractere por caractere', () => {
    expect(messages.confirmation(fixed, LEV)).toBe(
      'Olá, Maria! Tudo bem? Seu horário no LEV Coworking Beauty está confirmado!\n\n' +
      '📅 20/11/2026\n' +
      '🕒 Às 14h\n' +
      '💅 Serviço: Lash Lifting\n' +
      '👩 Profissional: Talitha\n\n' +
      'Agradecemos pela preferência! Será um prazer recebê-la. ✨\n' +
      'Caso precise remarcar, pedimos que nos avise com antecedência.'
    );
    expect(messages.reminder1Day(fixed, LEV)).toBe('Olá, Maria! Passando para lembrar que seu horário no LEV é amanhã, às 14h, com Talitha. Esperamos você! Até mais. 🤍');
    expect(messages.reminder1Hour(fixed, LEV)).toBe('Olá, Maria! Passando para lembrar que seu horário no LEV é hoje, às 14h, com Talitha. Esperamos você! Até mais. 🤍');
    expect(messages.thanks(fixed, LEV)).toBe(
      'Maria, que linda você ficou! 😍💖 Muito obrigada por escolher o LEV Coworking Beauty para o seu atendimento de Lash Lifting. Foi um prazer cuidar de você, maravilhosa!\n\n' +
      'Qualquer dúvida sobre os cuidados, é só chamar por aqui. ✨'
    );
    expect(messages.maintenance(due, LEV)).toBe(
      'Oi, Maria, maravilhosa! 💖 Já faz 21 dias do seu atendimento de Lash Lifting aqui no LEV, e chegou o momento perfeito da manutenção para você continuar linda e deslumbrante! ✨\n\n' +
      'Quer que a Talitha reserve um horário especial para você? É só responder esta mensagem. 😍'
    );
  });

  it('outro salão: nenhuma mensagem fala da LEV', () => {
    const texts = [
      messages.confirmation(fixed, AURORA),
      messages.reminder1Day(fixed, AURORA),
      messages.reminder1Hour(fixed, AURORA),
      messages.thanks(fixed, AURORA),
      messages.maintenance(due, AURORA)
    ];
    texts.forEach(text => expect(text).not.toContain('LEV'));
    expect(texts[0]).toContain('no Studio Aurora está confirmado');
    expect(texts[1]).toContain('seu horário no Aurora é amanhã');
    expect(texts[3]).toContain('escolher o Studio Aurora');
    expect(texts[4]).toContain('aqui no Aurora');
  });

  it('sem nome de profissional usa o texto de reserva', () => {
    const semNome = apt({ ...fixed, professionalName: undefined });
    expect(messages.confirmation(semNome, LEV)).toContain('👩 Profissional: a sua profissional\n');
    expect(messages.maintenance({ ...due, appointment: semNome }, LEV)).toContain('Quer que a sua profissional reserve');
  });

  it('renderMessage troca todas as ocorrências e apaga marcador sem valor', () => {
    expect(renderMessage('{a} e {a}, {b}!', { a: 'Oi' })).toBe('Oi e Oi, !');
    expect(renderMessage('{a}', { a: '{b}', b: 'não' })).toBe('{b}');
  });
});
