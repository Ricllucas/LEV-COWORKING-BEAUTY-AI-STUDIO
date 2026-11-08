import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';
import { findProfessional, loadSalonDirectory, type SalonDirectory } from '../_lib/salonDirectory.js';
import { authenticateStaff } from '../_lib/staffAuth.js';
import { withSalon } from '../_lib/tenant.js';
import { applyApiSecurity, rateLimit, safeText, secureId, validJsonRequest, publicErrorMessage } from '../_lib/security.js';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

interface TimeBlock {
  id: string;
  professionalId: string;
  professionalName: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'pausa' | 'indisponivel' | 'bloqueio';
  status: 'confirmado';
  serviceNames: string[];
  clientName: string;
  clientPhone: string;
  value: number;
  duration: number;
}

export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Método não permitido.' });
  }
  if (!rateLimit(req, res, 'calendar-block', 60, 60_000) || !validJsonRequest(req, res)) return;
  const staff = await authenticateStaff(req.headers?.authorization);
  if (!staff) return json(res, 401, { error: 'Acesso restrito à equipe do salão.' });

  try {
    const block = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!block?.id || !block?.professionalId || !block?.date || !block?.startTime || !block?.endTime) {
      return json(res, 400, { error: 'Dados do bloqueio incompletos.' });
    }
    const directory = await loadSalonDirectory(staff.salonId);
    const invalid = validateBlock(block, directory);
    if (invalid) return json(res, 400, { error: invalid });
    // Cada profissional só bloqueia a própria agenda; o admin bloqueia qualquer uma
    if (staff.role === 'profissional' && staff.professionalId !== block.professionalId) {
      return json(res, 403, { error: 'Você só pode bloquear a sua própria agenda.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Servidor de agendamentos não configurado.');
    }

    const blockData: TimeBlock = {
      id: secureId('block'),
      professionalId: block.professionalId,
      professionalName: safeText(block.professionalName, 80) || findProfessional(directory, block.professionalId)?.name || '',
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      title: safeText(block.title || 'Bloqueio', 120),
      type: block.type || 'bloqueio',
      status: 'confirmado',
      serviceNames: [safeText(block.title || 'Bloqueio', 120)],
      clientName: `[${String(block.type || 'bloqueio').toUpperCase()}]`,
      clientPhone: '',
      value: 0,
      duration: calculateDuration(block.startTime, block.endTime)
    };

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?on_conflict=id`, {
      body: JSON.stringify(withSalon({
        id: blockData.id,
        professional_id: blockData.professionalId,
        appointment_date: blockData.date,
        start_time: blockData.startTime,
        status: blockData.status,
        payload: blockData,
        updated_at: new Date().toISOString()
      }, staff.salonId)),
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }
    });

    if (!saveResponse.ok) {
      const details = await saveResponse.text();
      console.error('Supabase block save error:', saveResponse.status, details);
      throw new Error(`O servidor recusou o bloqueio (${saveResponse.status}).`);
    }

    try {
      const calendarResult = await syncGoogleCalendarEvent(blockData, staff.salonId);

      return json(res, 201, {
        saved: true,
        block: { id: blockData.id, type: blockData.type },
        calendar: calendarResult
      });
    } catch (calendarError) {
      console.error('Block saved, Google Calendar sync error:', calendarError);
      return json(res, 201, {
        saved: true,
        block: { id: blockData.id, type: blockData.type },
        calendar: { synced: false }
      });
    }
  } catch (error) {
    console.error('Time block creation error:', error);
    return json(res, 500, {
      error: publicErrorMessage(error, 'Não foi possível criar o bloqueio.')
    });
  }
}

const BLOCK_TYPES = new Set(['pausa', 'indisponivel', 'bloqueio']);

// A profissional precisa ser do salão de quem está logada
export function validateBlock(block: any, directory: SalonDirectory): string | null {
  if (typeof block.professionalId !== 'string' || !findProfessional(directory, block.professionalId)) return 'Profissional inválida.';
  if (typeof block.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(block.date)) return 'Data inválida.';
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (typeof block.startTime !== 'string' || !time.test(block.startTime)) return 'Horário inicial inválido.';
  if (typeof block.endTime !== 'string' || !time.test(block.endTime)) return 'Horário final inválido.';
  if (block.endTime <= block.startTime) return 'O horário final precisa ser depois do inicial.';
  if (block.type !== undefined && !BLOCK_TYPES.has(block.type)) return 'Tipo de bloqueio inválido.';
  return null;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH - startH) * 60 + (endM - startM);
}

