// Salão das rotas públicas (sem login), descoberto pelo endereço do site.
// O salão nunca vem do corpo nem da URL da requisição: só do cabeçalho host.
import { classifyHost } from './salonAddress.js';
import { serviceHeaders, supabaseConfig } from './staffAuth.js';
import { DEFAULT_SALON_ID, assertSalonId } from './tenant.js';

const CACHE_MS = 60_000;
const cache = new Map<string, { expiresAt: number; salonId: string | null }>();

// Só para os testes
export const resetSalonHostCache = () => cache.clear();

const unavailable = () => Object.assign(new Error('Não foi possível identificar o salão agora. Tente de novo em instantes.'), { status: 503 });

const askDatabase = async (body: { p_slug: string | null; p_domain: string | null }): Promise<string | null> => {
  let answer: unknown;
  try {
    const { url, serviceKey } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/rpc/salon_for_address`, {
      method: 'POST', headers: serviceHeaders(serviceKey), body: JSON.stringify(body)
    });
    if (!response.ok) throw unavailable();
    answer = await response.json() as unknown;
  } catch {
    throw unavailable();
  }
  if (typeof answer !== 'string') return null;
  try { return assertSalonId(answer); } catch { return null; }
};

// Endereço da LEV → 'lev' sem rede. Desconhecido → null. Banco fora do ar → erro com status 503.
export async function resolveSalonFromHost(host: unknown): Promise<string | null> {
  const kind = classifyHost(host);
  if (kind.kind === 'default') return DEFAULT_SALON_ID;
  if (kind.kind === 'invalid') return null;
  const key = kind.kind === 'slug' ? `slug:${kind.slug}` : `domain:${kind.domain}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.salonId;
  const salonId = await askDatabase(kind.kind === 'slug'
    ? { p_slug: kind.slug, p_domain: null }
    : { p_slug: null, p_domain: kind.domain });
  cache.set(key, { expiresAt: Date.now() + CACHE_MS, salonId });
  return salonId;
}

type JsonResponse = { status(code: number): { json(body: unknown): unknown } };

// Para as rotas públicas: endereço sem salão já responde 404 e devolve null.
export async function publicSalonId(req: { headers?: Record<string, unknown> }, res: JsonResponse): Promise<string | null> {
  const salonId = await resolveSalonFromHost(req.headers?.host);
  if (!salonId) res.status(404).json({ error: 'Salão não encontrado.' });
  return salonId;
}
