import { applyApiSecurity, rateLimit, safeText, validJsonRequest } from '../_lib/security.js';
import { authenticateStaff } from '../_lib/staffAuth.js';
import { isOpenWaConfigured, sendOpenWaText } from '../_lib/openwa.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

// GET: a equipe consulta se o robô de WhatsApp está ligado.
// POST: a administração envia uma mensagem de teste para um número.
export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  res.setHeader('Cache-Control', 'no-store');
  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe LEV.' });

    if (req.method === 'GET') return json(res, 200, { automatic: isOpenWaConfigured() });
    if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
    if (staff.role !== 'admin') return json(res, 403, { error: 'Apenas a administração pode enviar testes.' });
    if (!rateLimit(req, res, 'whatsapp-test', 5, 10 * 60_000) || !validJsonRequest(req, res)) return;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const phone = safeText(body.phone, 24);
    if (phone.replace(/\D/g, '').length < 10) return json(res, 400, { error: 'Informe um telefone com DDD.' });
    await sendOpenWaText(phone, 'Teste do robô de WhatsApp da LEV Coworking Beauty ✅ Se você recebeu esta mensagem, as mensagens automáticas estão funcionando.');
    return json(res, 200, { sent: true });
  } catch (error) {
    return json(res, 502, { error: error instanceof Error ? error.message : 'Não foi possível enviar pelo robô de WhatsApp.' });
  }
}
