import { randomUUID, timingSafeEqual } from 'node:crypto';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const requestIp = (req: any) => String(
  req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
).split(',')[0].trim();

export const applyApiSecurity = (req: any, res: any) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Vary', 'Origin');
  const origin = String(req.headers?.origin || '');
  const allowed = new Set([
    'https://lev-coworking-beauty.vercel.app',
    String(process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '')
  ].filter(Boolean));
  if (origin && allowed.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
};

export const rateLimit = (req: any, res: any, namespace: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const key = `${namespace}:${requestIp(req)}`;
  const bucket = buckets.get(key);
  const current = !bucket || bucket.resetAt <= now ? { count: 0, resetAt: now + windowMs } : bucket;
  current.count += 1;
  buckets.set(key, current);
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - current.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));
  if (current.count <= limit) return true;
  res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
  res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
  return false;
};

export const validJsonRequest = (req: any, res: any, maxBytes = 32_768) => {
  const declared = Number(req.headers?.['content-length'] || 0);
  if (declared > maxBytes) {
    res.status(413).json({ error: 'Requisição muito grande.' });
    return false;
  }
  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (req.method !== 'GET' && !contentType.startsWith('application/json')) {
    res.status(415).json({ error: 'Formato de conteúdo não suportado.' });
    return false;
  }
  return true;
};

export const safeText = (value: unknown, maxLength: number) => String(value || '')
  .replace(/[\u0000-\u001F\u007F]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

export const secureId = (prefix: string) => `${prefix}_${randomUUID()}`;

export const constantTimeSecretEquals = (provided: unknown, expected: unknown) => {
  const left = Buffer.from(String(provided || ''));
  const right = Buffer.from(String(expected || ''));
  return Boolean(left.length && left.length === right.length && timingSafeEqual(left, right));
};


