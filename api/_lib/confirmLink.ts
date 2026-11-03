import { createHmac } from 'node:crypto';
import { constantTimeSecretEquals } from './security.js';

// Link de confirmação enviado à profissional pelo WhatsApp.
// Formato do token: <idDoAgendamento>.<expiraEmSegundos>.<assinatura>
// A assinatura (HMAC-SHA256) impede criar links falsos ou trocar o agendamento.

const DEFAULT_SITE_URL = 'https://lev-coworking-beauty.vercel.app';

const linkSecret = (): string => {
  const dedicated = process.env.CONFIRM_LINK_SECRET;
  if (dedicated) return dedicated;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return '';
  // Deriva uma chave própria para links, sem reutilizar a chave do banco diretamente
  return createHmac('sha256', serviceKey).update('lev-confirm-link-v1').digest('base64url');
};

const sign = (secret: string, data: string) =>
  createHmac('sha256', secret).update(data).digest('base64url');

// O link vale até o horário de início do atendimento (horário de Brasília)
export const appointmentStartEpoch = (date: string, startTime: string): number =>
  Math.floor(new Date(`${date}T${startTime}:00-03:00`).getTime() / 1000);

export const createConfirmToken = (appointmentId: string, expiresAt: number, secret = linkSecret()): string | null => {
  if (!secret || !appointmentId || appointmentId.includes('.') || !Number.isFinite(expiresAt)) return null;
  const data = `${appointmentId}.${expiresAt}`;
  return `${data}.${sign(secret, data)}`;
};

export type ConfirmTokenCheck =
  | { ok: true; appointmentId: string }
  | { ok: false; appointmentId?: undefined; reason: 'invalid' | 'expired' };

export const verifyConfirmToken = (token: unknown, nowMs = Date.now(), secret = linkSecret()): ConfirmTokenCheck => {
  if (!secret || typeof token !== 'string' || token.length > 200) return { ok: false, reason: 'invalid' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'invalid' };
  const [appointmentId, expiresRaw, signature] = parts;
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(appointmentId) || !/^\d{9,11}$/.test(expiresRaw)) return { ok: false, reason: 'invalid' };
  if (!constantTimeSecretEquals(signature, sign(secret, `${appointmentId}.${expiresRaw}`))) return { ok: false, reason: 'invalid' };
  if (Number(expiresRaw) * 1000 <= nowMs) return { ok: false, reason: 'expired' };
  return { ok: true, appointmentId };
};

export const buildConfirmUrl = (appointmentId: string, date: string, startTime: string): string | null => {
  const token = createConfirmToken(appointmentId, appointmentStartEpoch(date, startTime));
  if (!token) return null;
  const base = (process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  return `${base}/confirmar?t=${encodeURIComponent(token)}`;
};
