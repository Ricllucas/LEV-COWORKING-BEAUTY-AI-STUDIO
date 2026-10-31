import { createHash } from 'node:crypto';
import { createSign } from 'node:crypto';
import { authenticateStaff } from '../_lib/staffAuth.js';
import { applyApiSecurity, constantTimeSecretEquals, rateLimit } from '../_lib/security.js';

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

const base64Url = (value: string | Buffer) => Buffer.from(value)
  .toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const getAccessToken = async () => {
  const email = requireEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = requireEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const result = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || 'Não foi possível autenticar no Google Agenda.');
  return result.access_token;
};

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!rateLimit(req, res, 'calendar-sync-all', 20, 60_000)) return;
  const bearer = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  const isCron = constantTimeSecretEquals(bearer, process.env.CRON_SECRET);
  const staff = isCron ? null : await authenticateStaff(req.headers?.authorization);
  if (!isCron && !staff) return res.status(401).json({ error: 'Acesso restrito à equipe LEV.' });

  try {
    const calendarId = requireEnv('GOOGLE_CALENDAR_ID');
    const token = await getAccessToken();
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Servidor de agendamentos não configurado.');
    }

    const now = new Date();
    const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const events = data.items || [];

    let syncedCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        const levAppointmentId = event.extendedProperties?.private?.levAppointmentId;
        if (!levAppointmentId) continue;

        const start = new Date(event.start?.dateTime || event.start?.date);
        const end = new Date(event.end?.dateTime || event.end?.date);
        const date = start.toISOString().split('T')[0];
        const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/appointments?id=eq.${encodeURIComponent(levAppointmentId)}`,
          {
            method: 'PATCH',
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              appointment_date: date,
              start_time: startTime,
              synced_from_calendar: true,
              synced_at: new Date().toISOString()
            })
          }
        );

        if (updateResponse.ok) {
          syncedCount++;
        } else {
          errorCount++;
          console.error(`Failed to sync appointment ${levAppointmentId}`);
        }
      } catch (error) {
        errorCount++;
        console.error('Event sync error:', error);
      }
    }

    return res.status(200).json({
      synced: true,
      totalEvents: events.length,
      syncedCount,
      errorCount,
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Falha ao sincronizar a agenda.'
    });
  }
}

