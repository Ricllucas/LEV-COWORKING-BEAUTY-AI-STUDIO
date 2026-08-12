import { addMinutes, availableStartTimes, createUnifiedAppointment } from './appointmentService.js';
import { PROFESSIONALS, servicesFor, type BookingService } from './bookingCatalog.js';
import { normalizePhone, supabaseRequest } from './whatsapp.js';

type Conversation = { id: string; booking_step?: string | null; booking_draft?: Record<string, any>; appointment_id?: string | null };

const update = async (id: string, values: Record<string, unknown>) => {
  const response = await supabaseRequest(`whatsapp_conversations?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ...values, updated_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error('Não foi possível atualizar a etapa do agendamento.');
};
const choice = (text: string) => Number(text.trim().match(/^\d+$/)?.[0] || 0);
const parseDate = (text: string) => {
  const value = text.trim();
  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  if (!iso || Number.isNaN(new Date(`${iso}T12:00:00`).getTime())) return '';
  return iso;
};
const professionalMenu = () => `Vamos agendar pelo fluxo oficial da LEV.\n\nEscolha a profissional:\n${PROFESSIONALS.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}\n\nResponda apenas com o número.`;
const serviceMenu = (professionalId: string) => `Escolha o serviço:\n${servicesFor(professionalId).map((s, i) => `${i + 1}. ${s.name} — ${s.price > 0 ? `R$ ${s.price.toFixed(2).replace('.', ',')}` : 'valor sob consulta'}`).join('\n')}\n\nResponda apenas com o número.`;

export const processWhatsAppBooking = async (params: {
  conversation: Conversation; text: string; clientName: string; clientPhone: string;
}): Promise<string | null> => {
  const { conversation, clientName } = params;
  const text = params.text.trim(); const lower = text.toLowerCase();
  let step = conversation.booking_step || null; let draft = conversation.booking_draft || {};

  if (['sair', 'parar', 'cancelar fluxo'].includes(lower)) {
    await update(conversation.id, { booking_step: null, booking_draft: {} });
    return 'O preenchimento foi encerrado. Quando quiser recomeçar, envie *AGENDAR*.';
  }
  if (!step && /\bagendar\b|\bmarcar\b/.test(lower)) {
    await update(conversation.id, { booking_step: 'professional', booking_draft: { source: 'whatsapp' } });
    return professionalMenu();
  }
  if (!step) return null;

  if (step === 'professional') {
    const professional = PROFESSIONALS[choice(text) - 1];
    if (!professional) return `Opção inválida.\n\n${professionalMenu()}`;
    draft = { ...draft, professionalId: professional.id, professionalName: professional.name };
    await update(conversation.id, { booking_step: 'service', booking_draft: draft });
    return serviceMenu(professional.id);
  }

  if (step === 'service') {
    const service = servicesFor(draft.professionalId)[choice(text) - 1] as BookingService | undefined;
    if (!service) return `Opção inválida.\n\n${serviceMenu(draft.professionalId)}`;
    draft = { ...draft, serviceId: service.id, serviceName: service.name, duration: service.duration, price: service.price };
    await update(conversation.id, { booking_step: 'date', booking_draft: draft });
    return `Ótima escolha: *${service.name}*.\n\nInforme a data desejada no formato *DD/MM/AAAA*.`;
  }

  if (step === 'date') {
    const date = parseDate(text); const today = new Date().toISOString().slice(0, 10);
    if (!date || date < today) return 'Informe uma data futura válida no formato *DD/MM/AAAA*.';
    const weekday = new Date(`${date}T12:00:00-03:00`).getDay();
    const isTalitha = draft.professionalId === 'prof_talitha';
    const invalidDay = weekday === 0 || (isTalitha && weekday === 1);
    if (invalidDay) {
      return isTalitha
        ? 'Talitha atende de terça a sábado. Escolha outra data.'
        : 'Esta profissional atende de segunda a sábado. Escolha outra data.';
    }
    const times = await availableStartTimes(date, Number(draft.duration), draft.professionalId);
    if (!times.length) return 'Essa data está sem horários disponíveis. Envie outra data no formato *DD/MM/AAAA*.';
    draft = { ...draft, date, availableTimes: times };
    await update(conversation.id, { booking_step: 'time', booking_draft: draft });
    return `Horários disponíveis em ${date.split('-').reverse().join('/')}:\n${times.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nResponda com o número do horário.`;
  }

  if (step === 'time') {
    const time = (draft.availableTimes || [])[choice(text) - 1];
    if (!time) return 'Escolha um dos números de horário exibidos acima.';
    draft = { ...draft, startTime: time, endTime: addMinutes(time, Number(draft.duration)) };
    await update(conversation.id, { booking_step: 'confirm', booking_draft: draft });
    const priceLabel = Number(draft.price) > 0 ? `R$ ${Number(draft.price).toFixed(2).replace('.', ',')}` : 'sob consulta';
    return `Confira seu agendamento:\n\nProfissional: *${draft.professionalName}*\nServiço: *${draft.serviceName}*\nData: *${draft.date.split('-').reverse().join('/')}*\nHorário: *${draft.startTime} às ${draft.endTime}*\nValor: *${priceLabel}*\n\nResponda *CONFIRMAR* para concluir ou *SAIR* para cancelar.`;
  }

  if (step === 'confirm') {
    if (lower !== 'confirmar') return 'Para concluir, responda *CONFIRMAR*. Para desistir, responda *SAIR*.';
    const now = new Date(); const id = `apt_wa_${Date.now()}_${normalizePhone(params.clientPhone).slice(-4)}`;
    const result = await createUnifiedAppointment({
      id, clientId: `wa_${normalizePhone(params.clientPhone)}`, clientName, clientPhone: params.clientPhone,
      professionalId: draft.professionalId, professionalName: draft.professionalName,
      serviceIds: [draft.serviceId], serviceNames: [draft.serviceName], date: draft.date,
      startTime: draft.startTime, endTime: draft.endTime, totalDurationMinutes: Number(draft.duration),
      totalPrice: Number(draft.price), depositPaid: 0, remainingPrice: Number(draft.price),
      status: 'aguardando_confirmacao', paymentStatus: 'pendente', createdAt: now.toISOString(),
      updatedAt: now.toISOString(), createdBy: clientName, source: 'whatsapp'
    });
    await update(conversation.id, { booking_step: null, booking_draft: {}, appointment_id: result.appointment.id, assigned_professional_id: draft.professionalId, assigned_professional_name: draft.professionalName, status: 'aguardando' });
    return `Agendamento registrado com sucesso! ✅\n\n${draft.serviceName} com ${draft.professionalName}\n${draft.date.split('-').reverse().join('/')} — ${draft.startTime}\n\nO mesmo horário já foi bloqueado no site e incluído no Google Agenda compartilhado da LEV.`;
  }
  return null;
};
