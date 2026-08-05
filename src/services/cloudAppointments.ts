import { Appointment, User } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

type StoredSession = { accessToken?: string };

const getAccessToken = (role?: User['role']): string | undefined => {
  if (typeof sessionStorage === 'undefined') return undefined;
  const keys = role === 'admin'
    ? ['lev_admin_session_v1']
    : role === 'profissional'
      ? ['lev_professional_session_v1']
      : ['lev_admin_session_v1', 'lev_professional_session_v1'];

  for (const key of keys) {
    try {
      const token = (JSON.parse(sessionStorage.getItem(key) || '{}') as StoredSession).accessToken;
      if (token) return token;
    } catch {
      // Continue checking the other active staff session.
    }
  }
  return undefined;
};

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

  async list(user: User): Promise<Appointment[]> {
    const { url, key } = config();
    const token = getAccessToken(user.role);
    if (!token) return [];

    const response = await fetch(
      `${url}/rest/v1/appointments?select=payload&order=appointment_date.asc,start_time.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Não foi possível atualizar a agenda compartilhada.');
    }

    const rows = await response.json() as Array<{ payload: Appointment }>;
    return rows.map(row => row.payload);
  }
};
