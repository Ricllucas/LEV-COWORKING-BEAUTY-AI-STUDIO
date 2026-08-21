import { authenticateStaff, serviceHeaders, supabaseConfig } from '../_lib/staffAuth.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe LEV.' });
    const { url, serviceKey } = supabaseConfig();
    const response = await fetch(
      `${url}/rest/v1/client_profiles?select=id,phone_digits,payload,created_at,updated_at&order=created_at.desc`,
      { headers: serviceHeaders(serviceKey) }
    );
    if (!response.ok) throw new Error(`Não foi possível consultar clientes (${response.status}).`);
    const rows = await response.json() as Array<{ id: string; phone_digits: string; payload: Record<string, unknown> }>;
    const clients = rows.map(row => ({ ...row.payload, id: row.id }));
    return json(res, 200, { clients });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao carregar clientes.' });
  }
}
