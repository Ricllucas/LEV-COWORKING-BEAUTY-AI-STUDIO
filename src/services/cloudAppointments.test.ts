import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudAppointmentService } from './cloudAppointments';

describe('CloudAppointmentService.listPublicByDate', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('devolve os agendamentos e os bloqueios do dia', async () => {
    const body = {
      appointments: [{ id: 'apt_1', professionalId: 'prof_talitha', date: '2026-11-05', startTime: '14:00', endTime: '15:00', status: 'confirmado' }],
      blocks: [{ professionalId: 'prof_talitha', date: '2026-11-05', startTime: '09:30', endTime: '11:00' }]
    };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));
    const result = await CloudAppointmentService.listPublicByDate('2026-11-05');
    expect(result.appointments.map(item => item.id)).toEqual(['apt_1']);
    expect(result.blocks).toEqual(body.blocks);
  });

  it('servidor antigo sem "blocks" → lista de bloqueios vazia', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ appointments: [] }), { status: 200 })));
    expect(await CloudAppointmentService.listPublicByDate('2026-11-05')).toEqual({ appointments: [], blocks: [] });
  });
});
