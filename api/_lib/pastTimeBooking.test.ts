import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertAvailable, availableStartTimes, type UnifiedAppointment } from './appointmentService';

// Quarta-feira, 04/11/2026, 15:00 em Brasília (18:00 UTC)
const NOW = new Date('2026-11-04T18:00:00Z');

const apt = (date: string, startTime: string, endTime: string) =>
  ({ id: 'apt_x', professionalId: 'prof_teste', date, startTime, endTime } as UnifiedAppointment);

describe('servidor recusa horário que já passou', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    process.env.SUPABASE_URL = 'https://exemplo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-teste';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('cliente não consegue marcar hoje num horário que já passou', async () => {
    await expect(assertAvailable('lev', apt('2026-11-04', '10:00', '11:00'))).rejects.toMatchObject({ status: 400 });
  });

  it('cliente consegue marcar hoje num horário que ainda vai chegar', async () => {
    await expect(assertAvailable('lev', apt('2026-11-04', '16:00', '17:00'))).resolves.toBeUndefined();
  });

  it('a equipe ainda consegue lançar atendimento de hoje que já aconteceu', async () => {
    await expect(assertAvailable('lev', apt('2026-11-04', '10:00', '11:00'), { allowStaffRetrospective: true }))
      .resolves.toBeUndefined();
  });

  it('WhatsApp: lista de horários de hoje começa depois de agora', async () => {
    const times = await availableStartTimes('lev', '2026-11-04', 60);
    expect(times[0]).toBe('15:30');
    expect(times).not.toContain('15:00');
  });

  it('WhatsApp: outro dia mostra o dia inteiro', async () => {
    const times = await availableStartTimes('lev', '2026-11-05', 60);
    expect(times[0]).toBe('09:00');
  });
});
