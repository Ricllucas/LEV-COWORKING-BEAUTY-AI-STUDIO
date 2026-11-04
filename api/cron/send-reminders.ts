import { supabaseConfig, serviceHeaders } from '../_lib/staffAuth.js';
import { assertSalonId, salonFilter } from '../_lib/tenant.js';
import { isOpenWaConfigured, sendOpenWaText } from '../_lib/openwa.js';
import { isCronAuthorized, isDueFor1Day, isDueFor1Hour, type RemindersSent } from '../_lib/reminderRules.js';
import {
  addDays,
  brasiliaNow,
  findMaintenanceDue,
  isDueForConfirmation,
  isDueForThanks,
  isWithinSendingHours,
  messages,
  type AutomatedAppointment
} from '../_lib/automatedMessages.js';

// Disparado a cada 5 minutos pelo Supabase (pg_cron). Envia pelo robô de
// WhatsApp da LEV: lembretes (1 dia e 1 hora antes), agradecimento e manutenção.
// Processa salão por salão (só os ativos); o limite de envios por rodada vale
// para todos juntos, porque hoje todos usam o mesmo número de WhatsApp.

type Row = { id: string; payload?: Record<string, any> | null; reminders_sent?: RemindersSent | null };
type Kind = 'confirmacao' | '1dia' | '1hora' | 'agradecimento' | 'manutencao';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const ACTIVE = new Set(['aguardando_confirmacao', 'confirmado']);
// Poucas mensagens por rodada e com intervalo, para proteger o número da LEV
const MAX_PER_RUN = 6;
const PAUSE_MS = 4000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const query = async (path: string, init: RequestInit = {}) => {
  const { url, serviceKey } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(serviceKey), ...(init.headers || {}) }
  });
  if (!response.ok) throw new Error(`Supabase recusou ${path.split('?')[0]} (${response.status}).`);
  return response;
};

type CronAppointment = AutomatedAppointment & { sent: RemindersSent; salonId: string };

const toAppointment = (row: Row, salonId: string): CronAppointment | null => {
  const p = row.payload;
  if (!p?.clientPhone || !p?.date || !p?.startTime) return null;
  return {
    id: row.id,
    clientName: p.clientName || '',
    clientPhone: p.clientPhone,
    professionalId: p.professionalId,
    professionalName: p.professionalName,
    serviceNames: Array.isArray(p.serviceNames) ? p.serviceNames : [],
    date: p.date,
    startTime: p.startTime,
    endTime: p.endTime,
    status: p.status,
    createdAt: p.createdAt,
    sent: row.reminders_sent || {},
    salonId
  };
};

const markSent = async (apt: { id: string; sent: RemindersSent; salonId: string }, kind: Kind) => {
  apt.sent = { ...apt.sent, [kind]: true };
  await query(`appointments?id=eq.${encodeURIComponent(apt.id)}&${salonFilter(apt.salonId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ reminders_sent: apt.sent })
  });
};

type QueueItem = { apt: CronAppointment; kind: Kind; text: string };

// Sem a lista de salões não há o que processar: a rodada falha com mensagem clara.
// Um id inválido não derruba a rodada; ele falha só no próprio salão (queueForSalon).
const activeSalonIds = async (): Promise<string[]> => {
  try {
    const rows = await (await query('salons?status=eq.ativo&select=id&order=id.asc')).json() as Array<{ id: unknown }>;
    return rows.map(row => String(row.id));
  } catch (error) {
    throw new Error(`Não foi possível ler a lista de salões ativos: ${error instanceof Error ? error.message : 'falha'}`);
  }
};

// Monta a fila de mensagens de um salão, só com os agendamentos dele.
const queueForSalon = async (rawSalonId: string, now: Date, today: string): Promise<QueueItem[]> => {
  const salonId = assertSalonId(rawSalonId);
  const from = addDays(today, -75);
  const until = addDays(today, 2);
  const rows = await (await query(
    `appointments?select=id,payload,reminders_sent&appointment_date=gte.${from}&appointment_date=lte.${until}&${salonFilter(salonId)}`
  )).json() as Row[];
  const appointments = rows
    .map(row => toAppointment(row, salonId))
    .filter((apt): apt is CronAppointment => apt !== null);

  const queue: QueueItem[] = [];
  appointments.forEach(apt => {
    // Lembrete só para horários confirmados pela profissional: um número digitado
    // no site público não recebe mensagens até a equipe confirmar o agendamento.
    if (apt.status === 'confirmado') {
      if (!apt.sent['1hora'] && isDueFor1Hour(apt, now)) queue.push({ apt, kind: '1hora', text: messages.reminder1Hour(apt) });
      else if (!apt.sent['1dia'] && isDueFor1Day(apt, now)) queue.push({ apt, kind: '1dia', text: messages.reminder1Day(apt) });
      else if (!apt.sent.confirmacao && isDueForConfirmation(apt, now, apt.sent)) queue.push({ apt, kind: 'confirmacao', text: messages.confirmation(apt) });
    }
    if (!apt.sent.agradecimento && isDueForThanks(apt, now)) queue.push({ apt, kind: 'agradecimento', text: messages.thanks(apt) });
  });

  const upcomingPhones = new Set(
    appointments
      .filter(apt => apt.date >= today && ACTIVE.has(apt.status))
      .map(apt => apt.clientPhone.replace(/\D/g, '').slice(-8))
  );
  const done = appointments.filter(apt => apt.status === 'concluido' && apt.date <= today);
  findMaintenanceDue(done, upcomingPhones, today).forEach(due => {
    const apt = appointments.find(item => item.id === due.appointment.id);
    if (apt && !apt.sent.manutencao) queue.push({ apt, kind: 'manutencao', text: messages.maintenance(due) });
  });
  return queue;
};

export const config = { maxDuration: 60 };

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!process.env.CRON_SECRET) return json(res, 500, { error: 'CRON_SECRET não configurado.' });
  if (!isCronAuthorized(req.headers?.authorization, process.env.CRON_SECRET)) return json(res, 401, { error: 'Unauthorized' });
  if (!isOpenWaConfigured()) return json(res, 200, { automationDisabled: true, sent: 0 });

  const now = new Date();
  if (!isWithinSendingHours(now)) return json(res, 200, { outsideSendingHours: true, sent: 0 });

  try {
    const today = brasiliaNow(now).date;
    const failures: string[] = [];
    const queue: QueueItem[] = [];
    const salonIds = await activeSalonIds();
    if (!salonIds.length) console.warn('[MENSAGENS AUTOMATICAS] Nenhum salão ativo encontrado; nada a enviar.');
    for (const salonId of salonIds) {
      // A falha de um salão não impede os outros de receberem as mensagens
      try {
        queue.push(...await queueForSalon(salonId, now, today));
      } catch (error) {
        failures.push(`salao:${salonId}: ${error instanceof Error ? error.message : 'falha'}`);
      }
    }

    const sent: Record<Kind, number> = { confirmacao: 0, '1dia': 0, '1hora': 0, agradecimento: 0, manutencao: 0 };
    // Lembretes e confirmações primeiro: são os que têm hora certa
    const urgent = (kind: Kind) => kind === '1hora' || kind === '1dia' || kind === 'confirmacao';
    const ordered = queue.sort((a, b) => Number(!urgent(a.kind)) - Number(!urgent(b.kind)));
    for (const [index, item] of ordered.slice(0, MAX_PER_RUN).entries()) {
      if (index > 0) await sleep(PAUSE_MS);
      try {
        await sendOpenWaText(item.apt.clientPhone, item.text);
      } catch (error) {
        failures.push(`${item.kind}:${item.apt.id}: ${error instanceof Error ? error.message : 'falha'}`);
        // Número sem WhatsApp não adianta tentar de novo a cada 5 minutos
        if (error instanceof Error && error.message.includes('não tem WhatsApp')) await markSent(item.apt, item.kind);
        continue;
      }
      // Se não der para registrar o envio, para tudo para não repetir mensagens
      await markSent(item.apt, item.kind);
      sent[item.kind]++;
    }

    const result = { success: true, timestamp: now.toISOString(), sent, pending: Math.max(0, queue.length - MAX_PER_RUN), failures };
    console.log('[MENSAGENS AUTOMATICAS]', JSON.stringify(result));
    return json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[MENSAGENS AUTOMATICAS] Erro:', message);
    return json(res, 500, { success: false, error: message });
  }
}
