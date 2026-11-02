import { isOpenWaConfigured, sendOpenWaText } from './openwa.js';

interface AppointmentData {
  clientName: string;
  clientPhone: string;
  professionalId: string;
  professionalName: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceNames: string[];
  totalPrice: number;
}

// Números de WhatsApp das profissionais
const PROFESSIONAL_PHONES: Record<string, string> = {
  prof_elisangela: '5541992461203',
  prof_talitha: '5541999983228',
  prof_nayara: '5541996556742',
};

const formatDateBR = (date: string) => date.split('-').reverse().join('/');

// Texto vindo do site público: sem links nem formatação, para não virar propaganda no WhatsApp
const plain = (value: unknown, max: number) => String(value || '')
  .replace(/https?:\/\/\S+|www\.\S+/gi, '')
  .replace(/[*_~`]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

// Avisa a profissional pelo robô de WhatsApp da LEV quando entra um agendamento.
export const sendProfessionalNotification = async (appointment: AppointmentData): Promise<boolean> => {
  const professionalPhone = PROFESSIONAL_PHONES[appointment.professionalId];
  if (!professionalPhone || !isOpenWaConfigured()) return false;

  const price = Number(appointment.totalPrice || 0).toFixed(2).replace('.', ',');
  const message = `📅 *Novo agendamento — LEV*

👤 *Cliente:* ${plain(appointment.clientName, 80)}
📞 *Telefone:* ${plain(appointment.clientPhone, 24)}
💅 *Serviço:* ${plain(appointment.serviceNames.join(', '), 200)}
🗓️ *Data:* ${formatDateBR(appointment.date)}
⏰ *Horário:* ${appointment.startTime} às ${appointment.endTime}
💰 *Valor:* R$ ${price}

Confira e confirme pelo painel da LEV.`;

  try {
    await sendOpenWaText(professionalPhone, message);
    return true;
  } catch (error) {
    console.error(`[AVISO PROFISSIONAL] Falha ao avisar ${appointment.professionalName}:`, error instanceof Error ? error.message : error);
    return false;
  }
};
