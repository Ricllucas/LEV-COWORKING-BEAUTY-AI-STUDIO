const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  const date = String(req.query?.date || '');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) return json(res, 400, { error: 'Data inválida.' });

  try {
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('Servidor de agendamentos não configurado.');
    const response = await fetch(
      `${supabaseUrl}/rest/v1/appointments?appointment_date=eq.${encodeURIComponent(date)}&select=payload`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!response.ok) throw new Error('Falha ao consultar a agenda.');
    const rows = await response.json() as Array<{ payload: any }>;
    const appointments = rows.map(row => row.payload).filter(appointment =>
      appointment && !['cancelado_cliente', 'cancelado_coworking'].includes(appointment.status)
    );
    return json(res, 200, { appointments });
  } catch (error) {
    console.error('Availability lookup error:', error);
    return json(res, 500, { error: error instanceof Error ? error.message : 'Falha ao consultar a disponibilidade.' });
  }
}
