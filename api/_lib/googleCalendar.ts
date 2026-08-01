import { createHash, createSign } from 'node:crypto';

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

export const calendarEventId = (appointmentId: string) =>
  `lev${createHash('sha256').update(appointmentId).digest('hex').slice(0, 40)}`;

export const syncGoogleCalendarEvent = async (appointment: any) => {
  const calendarId = requireEnv('GOOGLE_CALENDAR_ID');
  const token = await getAccessToken();
  const eventId = calendarEventId(appointment.id);
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  if (['cancelado_cliente', 'cancelado_coworking'].includes(appointment.status)) {
    const response = await fetch(`${baseUrl}/${eventId}`, { method: 'DELETE', headers });
    if (!response.ok && response.status !== 404 && response.status !== 410) throw new Error(`O Google Agenda recusou o cancelamento (${response.status}).`);
    return { action: 'deleted', eventId };
  }

  const services = Array.isArray(appointment.serviceNames) ? appointment.serviceNames.join(', ') : 'Atendimento LEV';
  const event = {
    id: eventId,
    summary: `${appointment.professionalName} — ${services}`,
    description: [
      `Cliente: ${appointment.clientName}`,
      `Telefone: ${appointment.clientPhone}`,
      appointment.clientEmail ? `E-mail: ${appointment.clientEmail}` : '',
      `Serviço: ${services}`,
      `Status: ${appointment.status}`,
      appointment.notes ? `Observações: ${appointment.notes}` : '',
      `Agendamento LEV: ${appointment.id}`
    ].filter(Boolean).join('\n'),
    start: { dateTime: `${appointment.date}T${appointment.startTime}:00`, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: `${appointment.date}T${appointment.endTime}:00`, timeZone: 'America/Sao_Paulo' },
    extendedProperties: { private: { levAppointmentId: appointment.id, professionalId: appointment.professionalId } }
  };
  const existing = await fetch(`${baseUrl}/${eventId}`, { headers });
  const response = await fetch(existing.ok ? `${baseUrl}/${eventId}` : baseUrl, {
    method: existing.ok ? 'PUT' : 'POST', headers, body: JSON.stringify(event)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(error.error?.message || `O Google Agenda recusou o evento (${response.status}).`);
  }
  return { action: existing.ok ? 'updated' : 'created', eventId };
};

