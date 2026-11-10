import { classifyHost, normalizeHost } from '../../api/_lib/salonAddress';
import { assertSalonId, DEFAULT_SALON_ID } from '../../api/_lib/tenant';

// Descobre o salão pelo endereço do site, antes de o App carregar (ver main.tsx).
// Não pode importar ./salon: é este módulo que decide o valor que ele vai ler.

export type SiteSalon = { status: 'ok'; salonId: string } | { status: 'not_found' } | { status: 'offline' };

type Deps = {
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  envSalonId?: unknown;
};

const CACHE_PREFIX = 'lev_salon_for_host:';

const validId = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value) return null;
  try { return assertSalonId(value); } catch { return null; }
};

const safeStorage = (): Pick<Storage, 'getItem' | 'setItem'> | undefined => {
  try { return window.localStorage; } catch { return undefined; }
};

export async function resolveSiteSalon(host: string, deps: Deps = {}): Promise<SiteSalon> {
  const kind = classifyHost(host);
  if (kind.kind === 'default') {
    const env = 'envSalonId' in deps ? deps.envSalonId : import.meta.env.VITE_SALON_ID;
    return { status: 'ok', salonId: validId(env) ?? DEFAULT_SALON_ID };
  }
  if (kind.kind === 'invalid') return { status: 'not_found' };

  const fetchImpl: typeof fetch = deps.fetchImpl ?? ((input, init) => fetch(input, init));
  const storage = deps.storage ?? safeStorage();
  const cacheKey = `${CACHE_PREFIX}${normalizeHost(host)}`;
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  const body = kind.kind === 'slug' ? { p_slug: kind.slug, p_domain: null } : { p_slug: null, p_domain: kind.domain };

  let answer: unknown;
  try {
    const response = await fetchImpl(`${url}/rest/v1/rpc/salon_for_address`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    answer = await response.json() as unknown;
  } catch {
    // Sem internet ou banco fora do ar: abre o último salão que este endereço mostrou
    const cached = validId(storage?.getItem(cacheKey));
    return cached ? { status: 'ok', salonId: cached } : { status: 'offline' };
  }

  const salonId = validId(answer);
  if (!salonId) return { status: 'not_found' };
  try { storage?.setItem(cacheKey, salonId); } catch { /* aparelho sem espaço: segue sem guardar */ }
  return { status: 'ok', salonId };
}

let booted: string | null = null;

export function setBootSalonId(id: string): void {
  booted = assertSalonId(id);
}

export function bootSalonId(): string | null {
  return booted;
}
