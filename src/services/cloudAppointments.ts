import { Appointment, User } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

type StoredSession = { accessToken?: string };

const getAccessToken = (role?: User['role']): string | undefined => {
  if (typeof sessionStorage === 'undefined') return undefined;
  const key = role === 'admin' ? 'lev_admin_session_v1' : role === 'profissional' ? 'lev_professional_session_v1' : '';
  if (!key) return undefined;
  try {
    return (JSON.parse(sessionStorage.getItem(key) || '{}') as StoredSession).accessToken;
  } catch {
    return undefined;
  }
};

const config = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('A agenda online ainda não está conectada ao servidor.');
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY };
};

const rowFromAppointment = (appointment: Appointment) => ({
  id: appointment.id,
  professional_id: appointment.professionalId,
  appointment_date: appointment.date,
  start_time: appointment.startTime,
  status: appointment.status,
  payload: appointment,
  updated_at: new Date().toISOString()
});

export const CloudAppointmentService = {
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_KEY),

  async save(appointment: Appointment, user?: User): Promise<void> {
    const { url, key } = config();
    const token = getAccessToken(user?.role);
    const response = await fetch(`${url}/rest/v1/appointments?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token || key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(rowFromAppointment(appointment))
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Este horário acabou de ser reservado. Escolha outro horário disponível.');
      }
      throw new Error('Não foi possível salvar o agendamento no servidor. Tente novamente.');
    }
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
