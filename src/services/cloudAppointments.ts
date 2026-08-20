import { Appointment, User } from '../types';
import { AdminAuthService } from './adminAuth';
import { ProfessionalAuthService } from './professionalAuth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

type ExpiringStoredSession = { accessToken?: string; expiresAt?: number };

const getFreshAccessToken = async (role?: User['role']): Promise<string | undefined> => {
  if (typeof sessionStorage === 'undefined') return undefined;
  const key = role === 'admin' ? 'lev_admin_session_v1' : 'lev_professional_session_v1';
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) || '{}') as ExpiringStoredSession;
    if (stored.accessToken && (!stored.expiresAt || stored.expiresAt > Math.floor(Date.now() / 1000) + 60)) {
      return stored.accessToken;
    }
    const restored = role === 'admin'
      ? await AdminAuthService.restore()
      : await ProfessionalAuthService.restore();
    return restored?.accessToken;
  } catch {
    return undefined;
  }
};

const forceRefreshAccessToken = async (role?: User['role']): Promise<string | undefined> => {
  const refreshed = role === 'admin'
    ? await AdminAuthService.refresh()
    : await ProfessionalAuthService.refresh();
  return refreshed?.accessToken;
};

const fetchSharedAppointments = (token: string) => fetch('/api/appointments/staff-list', {
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  cache: 'no-store'
});

const config = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('A agenda online ainda não está conectada ao servidor.');
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY };
};

export const CloudAppointmentService = {
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_KEY),

  async save(appointment: Appointment, _user?: User): Promise<void> {
    config();
    const response = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 409) {
        throw new Error(result.error || 'Este horário acabou de ser reservado. Escolha outro horário disponível.');
      }
      throw new Error(result.error || 'Não foi possível salvar o agendamento no servidor. Tente novamente.');
    }
  },

  async listPublicByDate(date: string): Promise<Appointment[]> {
    const response = await fetch(`/api/appointments/availability?date=${encodeURIComponent(date)}`);
    if (!response.ok) throw new Error('Não foi possível consultar os horários disponíveis.');
    const result = await response.json() as { appointments?: Appointment[] };
    return result.appointments || [];
  },

  async cancel(appointmentId: string, clientPhone: string, reason?: string): Promise<Appointment> {
    const response = await fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, clientPhone, reason })
    });
    const result = await response.json().catch(() => ({})) as { appointment?: Appointment; error?: string };
    if (!response.ok || !result.appointment) throw new Error(result.error || 'Não foi possível cancelar o agendamento.');
    return result.appointment;
  },

  async list(user: User): Promise<Appointment[]> {
    config();
    const token = await getFreshAccessToken(user.role);
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para carregar a agenda compartilhada.');

    let response = await fetchSharedAppointments(token);

    if (response.status === 401) {
      const renewedToken = await forceRefreshAccessToken(user.role);
      if (!renewedToken) throw new Error('Sua sessão expirou. Saia e entre novamente para carregar a Agenda LEV.');
      response = await fetchSharedAppointments(renewedToken);
    }

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error || `Não foi possível atualizar a agenda compartilhada (${response.status}).`);
    }

    const result = await response.json() as { appointments?: Appointment[] };
    return result.appointments || [];
  }
};

