import { maintenanceDaysFor } from '../../src/utils/maintenanceRules.js';

// Textos e regras de horário das mensagens automáticas do robô (um texto para todos os salões).

export type AutomatedAppointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  professionalId: string;
  professionalName?: string;
  serviceNames: string[];
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
  createdAt?: string;
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const formatDate = (date: string) => date.split('-').reverse().join('/');
// "17:30" → "17h30"; "09:00" → "9h"
const formatHour = (time: string) => {
  const [h, m] = time.split(':');
  return `${Number(h)}h${m && m !== '00' ? m : ''}`;
};

// Horário de Brasília (UTC-3, sem horário de verão)
export const brasiliaNow = (now: Date) => {
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return {
    date: local.toISOString().slice(0, 10),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes()
  };
};

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Nada de mensagem de madrugada: só entre 8h e 23h. Fora disso fica na fila
// e sai na primeira rodada das 8h do dia seguinte.
export const isWithinSendingHours = (now: Date) => {
  const { minutes } = brasiliaNow(now);
  return minutes >= 8 * 60 && minutes < 23 * 60;
};

// Agradecimento: 1 hora depois do fim do atendimento concluído, até o dia seguinte.
export const isDueForThanks = (apt: AutomatedAppointment, now: Date) => {
  if (apt.status !== 'concluido') return false;
  const { date, minutes } = brasiliaNow(now);
  if (apt.date === date) return minutes >= toMinutes(apt.endTime || apt.startTime) + 60;
  return apt.date === addDays(date, -1);
};

// Confirmação para a cliente: sai quando a equipe confirma o horário (nunca antes,
// para o site público não disparar mensagens a números quaisquer). Só para
// agendamentos feitos depois que a mensagem foi criada, para não reenviar a clientes antigas.
export const CONFIRMATION_START = '2026-11-01T20:00:00-03:00';

// Sai sempre que o horário ainda não começou, mesmo em encaixe de última hora.
// Se o lembrete de 1 hora já saiu, ele fez o papel da confirmação (sem mensagem dupla).
// No cron, o lembrete de 1 hora tem prioridade quando os dois vencem juntos.
export const isDueForConfirmation = (apt: AutomatedAppointment, now: Date, sent: { '1hora'?: boolean } = {}) => {
  if (apt.status !== 'confirmado' || !apt.createdAt) return false;
  if (sent['1hora']) return false;
  const created = new Date(apt.createdAt).getTime();
  if (!Number.isFinite(created) || created < new Date(CONFIRMATION_START).getTime()) return false;
  const start = new Date(`${apt.date}T${apt.startTime}:00-03:00`).getTime();
  return start > now.getTime();
};

const MAINTENANCE_WINDOW_DAYS = 30;
// Decisão de 02/11/2026: ao ligar o robô, só chamar quem vencer a partir desta data
export const MAINTENANCE_START_DATE = '2026-11-02';

export type MaintenanceDue = { appointment: AutomatedAppointment; serviceName: string; days: number };

// Para cada cliente, o último atendimento concluído com prazo de manutenção.
// Avisa quando o prazo vence (até 30 dias depois) e ela não tem horário marcado.
export const findMaintenanceDue = (
  done: AutomatedAppointment[],
  upcomingPhones: Set<string>,
  today: string
): MaintenanceDue[] => {
  const phoneKey = (phone: string) => phone.replace(/\D/g, '').slice(-8);
  const latest = new Map<string, MaintenanceDue>();
  done.forEach(apt => {
    apt.serviceNames.forEach(serviceName => {
      const days = maintenanceDaysFor(serviceName);
      if (!days) return;
      const key = `${phoneKey(apt.clientPhone)}::${serviceName}`;
      const current = latest.get(key);
      if (!current || current.appointment.date < apt.date) latest.set(key, { appointment: apt, serviceName, days });
    });
  });
  return Array.from(latest.values()).filter(({ appointment, days }) => {
    const due = addDays(appointment.date, days);
    return due <= today
      && due >= addDays(today, -MAINTENANCE_WINDOW_DAYS)
      && due >= MAINTENANCE_START_DATE
      && !upcomingPhones.has(phoneKey(appointment.clientPhone));
  });
};

// Nome do salão nas mensagens: completo (ex.: "Studio Aurora") e curto (ex.: "Aurora").
export type SalonNames = { name: string; shortName: string };

type TemplateKey = 'confirmation' | 'reminder1Day' | 'reminder1Hour' | 'thanks' | 'maintenance';

// Tom das mensagens às clientes: alegre, carinhoso e entusiasmado.
// Confirmação e lembretes: texto aprovado pela dona do salão principal em 04/11/2026;
// a saída para esse salão é idêntica à de antes (conferido no teste).
export const MESSAGE_TEMPLATES: Record<TemplateKey, string> = {
  confirmation: `Olá, {cliente}! Tudo bem? Seu horário no {salao} está confirmado!

📅 {data}
🕒 Às {hora}
💅 {rotuloServico}: {servicos}
👩 Profissional: {profissional}

Agradecemos pela preferência! Será um prazer recebê-la. ✨
Caso precise remarcar, pedimos que nos avise com antecedência.`,

  reminder1Day: 'Olá, {cliente}! Passando para lembrar que seu horário no {salaoCurto} é amanhã, às {hora}, com {profissional}. Esperamos você! Até mais. 🤍',

  reminder1Hour: 'Olá, {cliente}! Passando para lembrar que seu horário no {salaoCurto} é hoje, às {hora}, com {profissional}. Esperamos você! Até mais. 🤍',

  thanks: `{cliente}, que linda você ficou! 😍💖 Muito obrigada por escolher o {salao} para o seu atendimento de {servicos}. Foi um prazer cuidar de você, maravilhosa!

Qualquer dúvida sobre os cuidados, é só chamar por aqui. ✨`,

  maintenance: `Oi, {cliente}, maravilhosa! 💖 Já faz {dias} dias do seu atendimento de {servico} aqui no {salaoCurto}, e chegou o momento perfeito da manutenção para você continuar linda e deslumbrante! ✨

Quer que a {profissional} reserve um horário especial para você? É só responder esta mensagem. 😍`
};

// Troca cada {marcador} pelo valor; marcador sem valor vira texto vazio.
// Uma passada só: um valor que contenha "{...}" não é trocado de novo.
export const renderMessage = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
const baseVars = (apt: AutomatedAppointment, salon: SalonNames) => ({
  cliente: firstName(apt.clientName),
  salao: salon.name,
  salaoCurto: salon.shortName,
  hora: formatHour(apt.startTime),
  profissional: apt.professionalName || 'a sua profissional'
});

export const messages = {
  confirmation: (apt: AutomatedAppointment, salon: SalonNames) => renderMessage(MESSAGE_TEMPLATES.confirmation, {
    ...baseVars(apt, salon),
    data: formatDate(apt.date),
    rotuloServico: apt.serviceNames.length > 1 ? 'Serviços' : 'Serviço',
    servicos: apt.serviceNames.join(', ')
  }),

  reminder1Day: (apt: AutomatedAppointment, salon: SalonNames) => renderMessage(MESSAGE_TEMPLATES.reminder1Day, baseVars(apt, salon)),

  reminder1Hour: (apt: AutomatedAppointment, salon: SalonNames) => renderMessage(MESSAGE_TEMPLATES.reminder1Hour, baseVars(apt, salon)),

  thanks: (apt: AutomatedAppointment, salon: SalonNames) => renderMessage(MESSAGE_TEMPLATES.thanks, {
    ...baseVars(apt, salon),
    servicos: apt.serviceNames.join(', ')
  }),

  maintenance: ({ appointment, serviceName, days }: MaintenanceDue, salon: SalonNames) => renderMessage(MESSAGE_TEMPLATES.maintenance, {
    ...baseVars(appointment, salon),
    servico: serviceName,
    dias: String(days),
    // "Quer que a {profissional}": aqui a reserva é "sua profissional", sem outro "a"
    profissional: appointment.professionalName || 'sua profissional'
  })
};
