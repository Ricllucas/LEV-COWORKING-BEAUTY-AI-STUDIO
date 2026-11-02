import { describe, expect, it } from 'vitest';
import { buildFollowUps, maintenanceDaysFor } from './followUps';
import { Appointment } from '../types';

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
    ], today, new Set());
    expect(kinds(items)).toEqual(['lembrete:hoje', 'lembrete:amanha']);
  });

  it('agradece atendimentos concluídos recentes', () => {
    const items = buildFollowUps([
      apt('recente', { date: '2026-10-31', status: 'concluido', serviceNames: ['Maquiagem Social'] }),
      apt('antigo', { date: '2026-10-20', status: 'concluido', serviceNames: ['Maquiagem Social'] })
    ], today, new Set());
    expect(kinds(items)).toEqual(['agradecimento:recente']);
  });

  it('avisa a manutenção quando o prazo vence e não há horário marcado', () => {
    const gel = apt('gel', { date: '2026-10-17', status: 'concluido' });
    expect(kinds(buildFollowUps([gel], today, new Set()))).toEqual(['manutencao:gel']);
    expect(kinds(buildFollowUps([gel, apt('novo', { date: '2026-11-10' })], today, new Set()))).toEqual([]);
    expect(kinds(buildFollowUps([apt('cedo', { date: '2026-10-20', status: 'concluido' })], today, new Set()))).toEqual([]);
  });

  it('não repete mensagens já enviadas', () => {
    const items = buildFollowUps([apt('hoje', {})], today, new Set(['lembrete:hoje']));
    expect(items).toEqual([]);
  });
});
