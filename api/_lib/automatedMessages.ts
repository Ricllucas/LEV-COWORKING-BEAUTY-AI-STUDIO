import { maintenanceDaysFor } from '../../src/utils/maintenanceRules.js';

// Textos e regras de horário das mensagens automáticas da LEV.

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

export const isDueForConfirmation = (apt: AutomatedAppointment, now: Date) => {
  if (apt.status !== 'confirmado' || !apt.createdAt) return false;
  const created = new Date(apt.createdAt).getTime();
  if (!Number.isFinite(created) || created < new Date(CONFIRMATION_START).getTime()) return false;
  const start = new Date(`${apt.date}T${apt.startTime}:00-03:00`).getTime();
  // Se falta 70 minutos ou menos, o lembrete de 1 hora já avisa a cliente
  return start - now.getTime() > 70 * 60_000;
};

const MAINTENANCE_WINDOW_DAYS = 30;
// Decisão da LEV: ao ligar o robô, só chamar quem vencer a partir desta data
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

// Tom da LEV para as clientes: alegre, carinhoso e entusiasmado.
export const messages = {
  confirmation: (apt: AutomatedAppointment) =>
    `Olá, ${firstName(apt.clientName)}, maravilhosa! 💖✨ Que alegria: seu horário no LEV Coworking Beauty está confirmadíssimo!

🗓️ ${formatDate(apt.date)} às ${apt.startTime}
💅 ${apt.serviceNames.join(', ')}
👩 Com ${apt.professionalName || 'a sua profissional'}

Prepare-se para sair daqui ainda mais linda e deslumbrante! 😍 Na véspera a gente te lembra. Se precisar remarcar, é só responder esta mensagem.`,

  reminder1Day: (apt: AutomatedAppointment) =>
    `Oi, ${firstName(apt.clientName)}, linda! 💖 Amanhã é o seu dia de brilhar! ✨ Seu horário no LEV Coworking Beauty é ${formatDate(apt.date)} às ${apt.startTime}, com ${apt.professionalName || 'a sua profissional'}, para ${apt.serviceNames.join(', ')}.

Estamos ansiosas para te deixar ainda mais deslumbrante! 😍 Se precisar remarcar, é só responder esta mensagem.`,

  reminder1Hour: (apt: AutomatedAppointment) =>
    `${firstName(apt.clientName)}, maravilhosa! ✨ Falta pouquinho: seu horário no LEV Coworking Beauty é hoje às ${apt.startTime}, com ${apt.professionalName || 'a sua profissional'}. Venha preparada para sair ainda mais linda e deslumbrante! 💖 Até já!`,

  thanks: (apt: AutomatedAppointment) =>
    `${firstName(apt.clientName)}, que linda você ficou! 😍💖 Muito obrigada por escolher o LEV Coworking Beauty para o seu atendimento de ${apt.serviceNames.join(', ')}. Foi um prazer cuidar de você, maravilhosa!

Qualquer dúvida sobre os cuidados, é só chamar por aqui. ✨`,

  maintenance: ({ appointment, serviceName, days }: MaintenanceDue) =>
    `Oi, ${firstName(appointment.clientName)}, maravilhosa! 💖 Já faz ${days} dias do seu atendimento de ${serviceName} aqui no LEV, e chegou o momento perfeito da manutenção para você continuar linda e deslumbrante! ✨

Quer que a ${appointment.professionalName || 'sua profissional'} reserve um horário especial para você? É só responder esta mensagem. 😍`
};

