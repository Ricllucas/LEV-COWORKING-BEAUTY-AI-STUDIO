// Qual salão um endereço de site representa. Usado pelo site (navegador) e pelo servidor.
// Precisa continuar puro: sem process.env, sem segredos e sem imports do Node.
import { assertSalonId } from './tenant.js';

// Domínio do produto: `<salao>.<dominio>` abre o salão. Vazio até a compra (Tarefa 4.3).
export const PLATFORM_DOMAINS: readonly string[] = [];

// Endereço de sempre da LEV. Ele e as prévias da Vercel abrem a LEV sem consultar o banco.
export const LEGACY_HOST = 'lev-coworking-beauty.vercel.app';
const LEGACY_PREVIEW_PREFIX = 'lev-coworking-beauty-';

export type HostKind =
  | { kind: 'default' }
  | { kind: 'slug'; slug: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'invalid' };

const HOST_PATTERN = /^[a-z0-9.-]{1,253}$/;

export function normalizeHost(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const host = raw.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  if (!HOST_PATTERN.test(host) || host.includes('..') || host.startsWith('.')) return null;
  return host;
}

const isSalonId = (value: string) => {
  try { assertSalonId(value); return true; } catch { return false; }
};

// Só um nível de subdomínio (`demo.exemplo.com.br`); `www` nunca é salão.
const slugUnder = (host: string, parent: string): HostKind | null => {
  if (!host.endsWith(`.${parent}`)) return null;
  const label = host.slice(0, -(parent.length + 1));
  if (label === 'www' || label.includes('.') || !isSalonId(label)) return { kind: 'invalid' };
  return { kind: 'slug', slug: label };
};

export function classifyHost(raw: unknown, platformDomains: readonly string[] = PLATFORM_DOMAINS): HostKind {
  const host = normalizeHost(raw);
  if (!host) return { kind: 'invalid' };
  if (host === 'localhost' || host === '127.0.0.1' || host === LEGACY_HOST) return { kind: 'default' };
  if (host.startsWith(LEGACY_PREVIEW_PREFIX) && host.endsWith('.vercel.app')) return { kind: 'default' };

  for (const parent of ['localhost', ...platformDomains]) {
    if (host === parent) return { kind: 'invalid' };
    const slug = slugUnder(host, parent);
    if (slug) return slug;
  }
  return { kind: 'domain', domain: host.startsWith('www.') ? host.slice(4) : host };
}
