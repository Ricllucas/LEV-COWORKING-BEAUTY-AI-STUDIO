import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAvailableSlots } from './scheduleHelper';
import type { Professional } from '../types';

// Quarta-feira, 04/11/2026, 15:00 em Brasília (18:00 UTC)
const NOW = new Date('2026-11-04T18:00:00Z');
const TODAY = '2026-11-04';
const TOMORROW = '2026-11-05';

const prof = {
  id: 'prof_teste',
  workingHours: Array.from({ length: 7 }, () => ({ active: true, startTime: '09:00', endTime: '18:00' }))
} as unknown as Professional;

const availableTimes = (date: string, staffMode = false) =>
  getAvailableSlots(date, prof, [], [], [], staffMode).filter(s => s.available).map(s => s.time);

describe('getAvailableSlots: horários que já passaram', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('no site público, hoje só mostra horários depois de agora', () => {
    const times = availableTimes(TODAY);
    expect(times).not.toContain('09:00');
    expect(times).not.toContain('14:30');
    expect(times).not.toContain('15:00');
    expect(times[0]).toBe('15:30');
  });

  it('marca o horário passado como indisponível com o motivo', () => {
    const slot = getAvailableSlots(TODAY, prof, [], [], [], false).find(s => s.time === '10:00');
    expect(slot).toEqual({ time: '10:00', available: false, reason: 'Este horário já passou' });
  });

  it('em outro dia, mostra o dia inteiro', () => {
    expect(availableTimes(TOMORROW)[0]).toBe('09:00');
  });

  it('a equipe ainda consegue lançar atendimento de hoje que já aconteceu', () => {
    expect(availableTimes(TODAY, true)).toContain('09:00');
  });
});
