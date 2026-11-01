import { beforeEach, describe, expect, it } from 'vitest';
import { StorageService } from './storage';
import { Appointment } from '../types';

const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const makeAppointment = (id: string, overrides: Partial<Appointment> = {}): Appointment => ({
  id,
  date: future,
  status: 'confirmado',
  ...overrides
} as Appointment);

// The global test setup stubs localStorage; these tests need one that keeps values.
const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => Array.from(data.keys())[index] ?? null,
    removeItem: key => { data.delete(key); },
    setItem: (key, value) => { data.set(key, String(value)); }
  };
};

describe('StorageService.getClientBookings', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage(), configurable: true, writable: true });
    // Run the one-time cleanups first so they don't wipe the fixtures below.
    StorageService.getAppointments();
  });

  it('não mostra a agenda do studio para a cliente', () => {
    localStorage.setItem('lev_coworking_appointments_v1', JSON.stringify([
      makeAppointment('studio-1'),
      makeAppointment('studio-2')
    ]));
    expect(StorageService.getClientBookings()).toEqual([]);
  });

  it('mostra apenas os agendamentos feitos neste dispositivo', () => {
    localStorage.setItem('lev_coworking_appointments_v1', JSON.stringify([
      makeAppointment('studio-1'),
      makeAppointment('minha-reserva'),
      makeAppointment('cancelada', { status: 'cancelado_cliente' })
    ]));
    StorageService.rememberClientBooking('minha-reserva');
    StorageService.rememberClientBooking('cancelada');
    expect(StorageService.getClientBookings().map(item => item.id)).toEqual(['minha-reserva']);
  });
});
