import { Appointment } from '../types';
import { MAINTENANCE_RULES, normalize } from './maintenanceRules';

export { maintenanceDaysFor } from './maintenanceRules';

export type FollowUpKind = 'lembrete' | 'agradecimento' | 'manutencao';

export interface FollowUp {
  key: string;
  kind: FollowUpKind;
  appointment: Appointment;
  message: string;
  /** Data em que a manutenção vence (só para kind === 'manutencao'). */
  dueDate?: string;
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
// "17:30" → "17h30"; "09:00" → "9h"
const formatHour = (time: string) => {
  const [h, m] = time.split(':');
  return `${Number(h)}h${m && m !== '00' ? m : ''}`;
};
const phoneKey = (phone: string) => phone.replace(/\D/g, '').slice(-11);

const ACTIVE_STATUSES = new Set(['aguardando_confirmacao', 'confirmado']);
const THANK_YOU_WINDOW_DAYS = 3;
const MAINTENANCE_WINDOW_DAYS = 30;

export const buildFollowUps = (appointments: Appointment[], today: string, sent: Set<string>): FollowUp[] => {
  const tomorrow = addDays(today, 1);
  const items: FollowUp[] = [];

  // Lembrete: atendimentos de hoje e de amanhã que ainda vão acontecer
  appointments
    .filter(apt => (apt.date === today || apt.date === tomorrow) && ACTIVE_STATUSES.has(apt.status))
    .forEach(apt => {
      const when = apt.date === today ? 'hoje' : 'amanhã';
      items.push({
        key: `lembrete:${apt.id}`,
        kind: 'lembrete',
        appointment: apt,
        // Mesmo texto do lembrete automático (aprovado pela LEV em 04/11/2026)
        message: `Olá, ${firstName(apt.clientName)}! Passando para lembrar que seu horário no LEV é ${when}, às ${formatHour(apt.startTime)}, com ${apt.professionalName}. Esperamos você! Até mais. 🤍`
      });
    });

  const done = appointments.filter(apt => apt.status === 'concluido' && apt.date <= today);

  // Agradecimento: atendimentos concluídos nos últimos dias
  done
    .filter(apt => apt.date >= addDays(today, -THANK_YOU_WINDOW_DAYS))
    .forEach(apt => {
      items.push({
        key: `agradecimento:${apt.id}`,
        kind: 'agradecimento',
        appointment: apt,
        message: `Olá, ${firstName(apt.clientName)}! Obrigada por escolher o LEV Coworking Beauty para o seu ${apt.serviceNames.join(', ')}. Foi um prazer te atender! 💛 Qualquer dúvida sobre os cuidados, estou por aqui.`
      });
    });

  // Manutenção: último atendimento de cada cliente por tipo de serviço,
  // vencido há no máximo 30 dias e sem novo horário já marcado
  const hasUpcoming = new Set(
    appointments
      .filter(apt => apt.date >= today && ACTIVE_STATUSES.has(apt.status))
      .map(apt => phoneKey(apt.clientPhone))
  );
  const latestByClientAndService = new Map<string, { apt: Appointment; days: number; label: string }>();
  done.forEach(apt => {
    apt.serviceNames.forEach(name => {
      const rule = MAINTENANCE_RULES.find(r => r.match(normalize(name)));
      if (!rule) return;
      const key = `${phoneKey(apt.clientPhone)}::${rule.label}`;
      const current = latestByClientAndService.get(key);
      if (!current || current.apt.date < apt.date) {
        latestByClientAndService.set(key, { apt, days: rule.days, label: rule.label });
      }
    });
  });
  latestByClientAndService.forEach(({ apt, days, label }) => {
    const dueDate = addDays(apt.date, days);
    if (dueDate > today || dueDate < addDays(today, -MAINTENANCE_WINDOW_DAYS)) return;
    if (hasUpcoming.has(phoneKey(apt.clientPhone))) return;
    items.push({
      key: `manutencao:${apt.id}:${label}`,
      kind: 'manutencao',
      appointment: apt,
      dueDate,
      message: `Olá, ${firstName(apt.clientName)}! Já faz ${days} dias do seu ${label} aqui no LEV, e chegou o momento ideal da manutenção para manter tudo lindo. ✨ Quer que eu reserve um horário para você? É só me responder por aqui.`
    });
  });

  return items.filter(item => !sent.has(item.key));
};
