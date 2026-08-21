import { Client } from '../types';
import { AdminAuthService } from './adminAuth';
import { ProfessionalAuthService } from './professionalAuth';

type StoredSession = { accessToken?: string; expiresAt?: number };

const getToken = async () => {
  for (const [key, restore] of [
    ['lev_admin_session_v1', () => AdminAuthService.restore()],
    ['lev_professional_session_v1', () => ProfessionalAuthService.restore()]
  ] as const) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || '{}') as StoredSession;
      if (stored.accessToken && (!stored.expiresAt || stored.expiresAt > Math.floor(Date.now() / 1000) + 60)) {
        return stored.accessToken;
      }
      const session = await restore();
      if (session?.accessToken) return session.accessToken;
    } catch {
      // Tenta a próxima sessão disponível.
    }
  }
  throw new Error('Sua sessão expirou. Entre novamente para acessar a base de clientes.');
};

const authorizedFetch = async (url: string, init?: RequestInit) => {
  const token = await getToken();
  return fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
};

export const CloudClientService = {
  async list(): Promise<Client[]> {
    const response = await authorizedFetch('/api/clients/list', { cache: 'no-store' });
    const result = await response.json().catch(() => ({})) as { clients?: Client[]; error?: string };
    if (!response.ok) throw new Error(result.error || 'Não foi possível carregar a base compartilhada de clientes.');
    return result.clients || [];
  },

  async save(client: Client): Promise<Client> {
    const response = await authorizedFetch('/api/clients/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
    const result = await response.json().catch(() => ({})) as { client?: Client; error?: string };
    if (!response.ok || !result.client) throw new Error(result.error || 'Não foi possível salvar a cliente no servidor.');
    return result.client;
  }
};

