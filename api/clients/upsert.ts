import { authenticateStaff, serviceHeaders, supabaseConfig } from '../_lib/staffAuth';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const digits = (value: string) => String(value || '').replace(/\D/g, '').slice(-11);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe LEV.' });
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const phoneDigits = digits(input.phone);
    if (!String(input.fullName || '').trim() || phoneDigits.length < 10) {
      return json(res, 400, { error: 'Informe o nome e um telefone válido.' });
    }
    const { url, serviceKey } = supabaseConfig();
    const id = `cli_${phoneDigits}`;
    const now = new Date().toISOString();
    const client = {
      ...input,
      id,
      fullName: String(input.fullName).trim(),
      phone: String(input.phone).trim(),
      whatsapp: String(input.whatsapp || input.phone).trim(),
      email: String(input.email || '').trim().toLowerCase(),
      active: input.active !== false,
      createdAt: input.createdAt || now.slice(0, 10)
    };
    const response = await fetch(`${url}/rest/v1/client_profiles?on_conflict=phone_digits`, {
      method: 'POST',
      headers: { ...serviceHeaders(serviceKey), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id,
        phone_digits: phoneDigits,
        professional_id: staff.professionalId || input.preferredProfessionalId || null,
        payload: client,
        created_by: staff.userId,
        updated_at: now
      })
    });
    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('Client upsert failed:', response.status, details);
      throw new Error(`Não foi possível salvar a cliente (${response.status}).`);
    }
    return json(res, 200, { client });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao salvar cliente.' });
  }
}

