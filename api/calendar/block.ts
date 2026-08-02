import { syncGoogleCalendarEvent } from '../_lib/googleCalendar.js';

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
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Método não permitido.' });
  }

  try {
    const block = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!block?.id || !block?.professionalId || !block?.date || !block?.startTime || !block?.endTime) {
      return json(res, 400, { error: 'Dados do bloqueio incompletos.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Servidor de agendamentos não configurado.');
    }

    const blockData: TimeBlock = {
      id: block.id,
      professionalId: block.professionalId,
      professionalName: block.professionalName,
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      title: block.title || 'Bloqueio',
      type: block.type || 'bloqueio',
      status: 'confirmado',
      serviceNames: [block.title || 'Bloqueio'],
      clientName: `[${block.type?.toUpperCase() || 'BLOQUEIO'}]`,
      clientPhone: '',
      value: 0,
      duration: calculateDuration(block.startTime, block.endTime)
    };

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        id: blockData.id,
        professional_id: blockData.professionalId,
        appointment_date: blockData.date,
        start_time: blockData.startTime,
        status: blockData.status,
        payload: blockData,
        updated_at: new Date().toISOString()
      })
    });

    if (!saveResponse.ok) {
      const details = await saveResponse.text();
      console.error('Supabase block save error:', saveResponse.status, details);
      throw new Error(`O servidor recusou o bloqueio (${saveResponse.status}).`);
    }

    try {
      const calendarResult = await syncGoogleCalendarEvent(blockData);

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
      error: error instanceof Error ? error.message : 'Não foi possível criar o bloqueio.'
    });
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH - startH) * 60 + (endM - startM);
}
