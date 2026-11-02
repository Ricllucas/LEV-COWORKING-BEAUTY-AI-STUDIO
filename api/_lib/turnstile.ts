// Verificação anti-robô (Cloudflare Turnstile) do agendamento público.
// Fica desligada até TURNSTILE_SECRET_KEY ser configurada na Vercel.
export const isTurnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export const verifyTurnstile = async (token: unknown, ip?: string): Promise<boolean> => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
};
