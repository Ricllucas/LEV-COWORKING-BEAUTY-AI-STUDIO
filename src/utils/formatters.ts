/**
 * Formatters (textos, datas, valores e links de WhatsApp)
 */
import { CURRENT_SALON_ID, isDefaultSalon } from '../config/salon';
import { bundledDataFor } from '../data/salonDefaults';
import { LEV_PROFESSIONAL_WHATSAPP } from '../data/levBrand';
import { contactSalonName, salonNames } from './salonNames';

const digitsOnly = (value: string | undefined) => (value || '').replace(/\D/g, '');

// WhatsApp direto da profissional. O número geral do salão (recepção) nunca vale
// como contato dela. Sem número no cadastro, a LEV usa a lista de fábrica; outro
// salão fica sem link.
export function getProfessionalWhatsApp(
  id: string,
  contact?: { whatsapp?: string; phone?: string },
  salonWhatsapp: string = bundledDataFor(CURRENT_SALON_ID).settings.whatsapp
): string {
  const salonNumber = digitsOnly(salonWhatsapp);
  const salonLocal = salonNumber.startsWith('55') ? salonNumber.slice(2) : salonNumber;
  const isSalonNumber = (v: string) => Boolean(salonNumber) && (v === salonNumber || v === salonLocal || v === `55${salonLocal}`);
  const phone = [contact?.whatsapp, contact?.phone].map(digitsOnly).find(v => v.length >= 10 && !isSalonNumber(v));
  if (phone) return phone;
  return isDefaultSalon() ? LEV_PROFESSIONAL_WHATSAPP[id] || '' : '';
}
export function buildProfessionalWhatsAppLink(id: string, text: string, contact?: { whatsapp?: string; phone?: string }): string | undefined {
 const phone = getProfessionalWhatsApp(id, contact);
 return phone ? buildWhatsAppLink(phone, text) : undefined;
}
export function formatCurrency(value: number): string {
  if (isNaN(value)) return "R$ 0,00";
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[date.getDay()];
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  return phone;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  // Default country code 55 if missing
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppMessage(type: string, data: {
  clientName: string;
  professionalName: string;
  serviceName: string;
  date: string;
  time: string;
  depositValue?: number;
  totalPrice?: number;
  pixKey?: string;
  // Nome do salão (contactSalonName) e nome curto (salonNames). Sem eles, usa os
  // dados de fábrica do salão deste site.
  coworkingName?: string;
  salonShortName?: string;
}): string {
  const bundled = bundledDataFor(CURRENT_SALON_ID).settings;
  const coworking = data.coworkingName || contactSalonName(bundled);
  const shortName = data.salonShortName || salonNames(bundled).shortName;
  const dateFormatted = formatDateBR(data.date);

  switch (type) {
    case 'solicitacao_agendamento_cliente':
      return `Olá! Sou *${data.clientName}* e acabei de solicitar um agendamento pelo site da ${shortName}.\n\n👩‍💼 Profissional: *${data.professionalName}*\n💅 Serviço(s): *${data.serviceName}*\n📅 Data: *${dateFormatted}*\n⏰ Horário: *${data.time}*\n💰 Valor total: *${formatCurrency(data.totalPrice || 0)}*${data.depositValue ? `\n💳 Sinal: *${formatCurrency(data.depositValue)}*\n🔑 Chave Pix: *${data.pixKey || 'Consulte a profissional'}*` : ''}\n\nPor favor, confirme o recebimento da minha solicitação.${data.depositValue ? ' Enviarei o comprovante do sinal por aqui.' : ''}`;

    case 'confirmacao':
      return `Olá, ${data.clientName}! ✨ Seu atendimento com ${data.professionalName} no *${coworking}* está agendado para *${dateFormatted}* às *${data.time}* (${data.serviceName}).\n\nCaso precise de suporte ou dúvidas, estamos à disposição. Te esperamos! 🌸`;

    case 'lembrete':
      return `Olá, ${data.clientName}! 🌸 Lembramos do seu agendamento no *${coworking}* amanhã (${dateFormatted}) às *${data.time}* com ${data.professionalName} (${data.serviceName}). Por favor, confirme sua presença respondendo este aviso. Atenciosamente! ✨`;

    case 'solicitacao_sinal':
      return `Olá, ${data.clientName}! Para confirmar seu agendamento de *${data.serviceName}* com ${data.professionalName} para o dia *${dateFormatted} às ${data.time}*, pedimos a transferência do sinal de *${formatCurrency(data.depositValue || 0)}*.\n\nChave Pix: *${data.pixKey || 'Consulte-nos'}*\n\nPor favor, envie o comprovante após realizar o pagamento. Muito obrigada! 💖`;

    case 'confirmacao_pagamento':
      return `Recebemos o seu pagamento referente ao agendamento no *${coworking}*! 🎉 Seu atendimento está 100% confirmado para *${dateFormatted}* às *${data.time}*. Te aguardamos com muito carinho!`;

    case 'reagendamento':
      return `Olá, ${data.clientName}! Seu agendamento no *${coworking}* foi alterado para *${dateFormatted}* às *${data.time}* com ${data.professionalName} (${data.serviceName}). Se precisar de ajustes, avise-nos por aqui! ✨`;

    case 'cancelamento':
      return `Olá, ${data.clientName}. Confirmamos o cancelamento do seu agendamento de *${data.serviceName}* para o dia *${dateFormatted}*. Ficamos à disposição caso deseje remarcar para outra data! 🌸`;

    case 'aniversario':
      return `Parabéns, ${data.clientName}! 🎉 O *${coworking}* deseja um dia iluminado! Preparamos um carinho especial para você neste mês de aniversário. Entre em contato para agendar seu momento de beleza! 💖`;

    case 'pos_atendimento':
      return `Olá, ${data.clientName}! Muito obrigada por escolher o *${coworking}*! 💖 Foi um prazer atender você hoje. Como foi sua experiência com ${data.professionalName}? Ficaremos muito felizes em receber sua avaliação! ✨`;

    default:
      return `Olá, ${data.clientName}! Entramos em contato do *${coworking}* sobre seu atendimento de ${data.serviceName} com ${data.professionalName}.`;
  }
}
// Contato da equipe com uma cliente (lista de clientes).
export const clientContactMessage = (clientName: string, salonName: string): string =>
  `Olá, ${clientName}! Tudo bem? Entramos em contato do ${salonName}.`;

// Aviso de vaga para quem está na lista de espera.
export const waitlistSlotMessage = (clientName: string, serviceName: string, salonName: string): string =>
  `Olá, ${clientName}! Vagou um horário no ${salonName} para ${serviceName}. Gostaria de agendar?`;
