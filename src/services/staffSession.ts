import { User } from '../types';
import { AdminAuthService } from './adminAuth';
import { ProfessionalAuthService } from './professionalAuth';

type ExpiringStoredSession = { accessToken?: string; expiresAt?: number };

export const getFreshAccessToken = async (role?: User['role']): Promise<string | undefined> => {
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
