import { describe, expect, it } from 'vitest';
import { buildFollowUps, maintenanceDaysFor } from './followUps';
import { Appointment } from '../types';
import type { SalonNames } from './salonNames';

const LEV: SalonNames = { name: 'LEV Coworking Beauty', shortName: 'LEV' };
const AURORA: SalonNames = { name: 'Studio Aurora', shortName: 'Aurora' };

const apt = (id: string, overrides: Partial<Appointment>): Appointment => ({
  id,
  clientId: 'c1',
  clientName: 'Ana Paula',
  clientPhone: '(41) 99999-1111',
  professionalId: 'p1',
  professionalName: 'Nayara',
  serviceIds: [],
  serviceNames: ['Esmaltação em Gel'],
  date: '2026-11-01',
  startTime: '10:00',
  endTime: '11:00',
  totalDurationMinutes: 60,
  totalPrice: 100,
  depositPaid: 0,
  remainingPrice: 100,
  status: 'confirmado',
  paymentStatus: 'nao_informado',
  createdAt: '',
  updatedAt: '',
  createdBy: '',
  ...overrides
});

const kinds = (items: ReturnType<typeof buildFollowUps>) => items.map(item => `${item.kind}:${item.appointment.id}`);

describe('maintenanceDaysFor', () => {
  it('usa os prazos definidos pela LEV', () => {
    expect(maintenanceDaysFor('Mão — Esmaltação em Gel')).toBe(15);
    expect(maintenanceDaysFor('Manutenção em Gel')).toBe(15);
    expect(maintenanceDaysFor('Alongamento')).toBe(20);
    expect(maintenanceDaysFor('Mão Tradicional')).toBe(7);
    expect(maintenanceDaysFor('Pedicure Tradicional')).toBe(15);
    expect(maintenanceDaysFor('Design de Sobrancelhas com Henna')).toBe(20);
    expect(maintenanceDaysFor('Brow Lamination')).toBe(45);
    expect(maintenanceDaysFor('Maquiagem Social')).toBeUndefined();
  });
});

describe('buildFollowUps', () => {
  const today = '2026-11-01';

  it('lembra atendimentos de hoje e de amanhã', () => {
    const items = buildFollowUps([
      apt('hoje', { date: '2026-11-01' }),
      apt('amanha', { date: '2026-11-02' }),
      apt('depois', { date: '2026-11-05' }),
      apt('cancelado', { date: '2026-11-02', status: 'cancelado_cliente' })
    ], today, new Set(), LEV);
    expect(kinds(items)).toEqual(['lembrete:hoje', 'lembrete:amanha']);
  });

  it('agradece atendimentos concluídos recentes', () => {
    const items = buildFollowUps([
      apt('recente', { date: '2026-10-31', status: 'concluido', serviceNames: ['Maquiagem Social'] }),
      apt('antigo', { date: '2026-10-20', status: 'concluido', serviceNames: ['Maquiagem Social'] })
    ], today, new Set(), LEV);
    expect(kinds(items)).toEqual(['agradecimento:recente']);
  });

  it('avisa a manutenção quando o prazo vence e não há horário marcado', () => {
    const gel = apt('gel', { date: '2026-10-17', status: 'concluido' });
    expect(kinds(buildFollowUps([gel], today, new Set(), LEV))).toEqual(['manutencao:gel']);
    expect(kinds(buildFollowUps([gel, apt('novo', { date: '2026-11-10' })], today, new Set(), LEV))).toEqual([]);
    expect(kinds(buildFollowUps([apt('cedo', { date: '2026-10-20', status: 'concluido' })], today, new Set(), LEV))).toEqual([]);
  });

  it('não repete mensagens já enviadas', () => {
    const items = buildFollowUps([apt('hoje', {})], today, new Set(['lembrete:hoje']), LEV);
    expect(items).toEqual([]);
  });
});
describe('buildFollowUps com o nome do salão', () => {
  const today = '2026-11-01';
  const base = (id: string, overrides: Partial<Appointment>) =>
    apt(id, { clientName: 'Maria Souza', professionalId: 'prof_talitha', professionalName: 'Talitha', startTime: '14:00', endTime: '15:00', ...overrides });
  const list = [
    base('hoje', {}),
    base('amanha', { date: '2026-11-02' }),
    base('feito', { date: '2026-10-31', status: 'concluido' }),
    base('gel', { clientName: 'Bia Lima', clientPhone: '(41) 98888-2222', date: '2026-10-17', status: 'concluido' })
  ];

  // Textos copiados da saída de antes da Fase 3
  it('LEV: as mensagens saem iguais, caractere por caractere', () => {
    expect(buildFollowUps(list, today, new Set(), LEV).map(item => [item.key, item.message])).toEqual([
      ['lembrete:hoje', 'Olá, Maria! Passando para lembrar que seu horário no LEV é hoje, às 14h, com Talitha. Esperamos você! Até mais. 🤍'],
      ['lembrete:amanha', 'Olá, Maria! Passando para lembrar que seu horário no LEV é amanhã, às 14h, com Talitha. Esperamos você! Até mais. 🤍'],
      ['agradecimento:feito', 'Olá, Maria! Obrigada por escolher o LEV Coworking Beauty para o seu Esmaltação em Gel. Foi um prazer te atender! 💛 Qualquer dúvida sobre os cuidados, estou por aqui.'],
      ['manutencao:gel:Esmaltação em Gel', 'Olá, Bia! Já faz 15 dias do seu Esmaltação em Gel aqui no LEV, e chegou o momento ideal da manutenção para manter tudo lindo. ✨ Quer que eu reserve um horário para você? É só me responder por aqui.']
    ]);
  });

  it('outro salão: nenhuma mensagem fala da LEV', () => {
    const messages = buildFollowUps(list, today, new Set(), AURORA).map(item => item.message);
    expect(messages).toHaveLength(4);
    messages.forEach(message => expect(message).not.toContain('LEV'));
    expect(messages[0]).toContain('seu horário no Aurora é hoje');
    expect(messages[2]).toContain('escolher o Studio Aurora');
    expect(messages[3]).toContain('aqui no Aurora');
  });
});
