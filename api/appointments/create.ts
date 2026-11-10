import { assertPublicBookingLimit, createUnifiedAppointment } from '../_lib/appointmentService.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { sendProfessionalNotification } from '../_lib/whatsappProfessionalNotification.js';
import { applyApiSecurity, publicErrorMessage, rateLimit, requestIp, safeText, secureId, validJsonRequest } from '../_lib/security.js';
import { authenticateStaff } from '../_lib/staffAuth.js';
import { publicSalonId } from '../_lib/salonFromRequest.js';
import { findProfessional, loadSalonDirectory } from '../_lib/salonDirectory.js';
const json = (res: any, status: number, body: unknown) => res.status(status).json(body);
const valid = (a: any) => Boolean(a?.id && a?.professionalId && a?.clientName && a?.clientPhone && /^\d{4}-\d{2}-\d{2}$/.test(a?.date || '') && /^\d{2}:\d{2}$/.test(a?.startTime || '') && /^\d{2}:\d{2}$/.test(a?.endTime || ''));
export default async function handler(req: any, res: any) {
  applyApiSecurity(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!rateLimit(req, res, 'booking-create', 12, 10 * 60_000) || !validJsonRequest(req, res)) return;
  try {
    const staff = await authenticateStaff(req.headers?.authorization);
    // Equipe: salão do login. Site público: salão do endereço do site.
    const salonId = staff ? staff.salonId : await publicSalonId(req, res);
    if (!salonId) return;
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const appointment = {
      ...raw,
      turnstileToken: undefined,
      id: secureId('apt'),
      clientName: safeText(raw?.clientName, 100),
      clientPhone: safeText(raw?.clientPhone, 24),
      clientEmail: safeText(raw?.clientEmail, 160).toLowerCase(),
      notes: safeText(raw?.notes, 500),
      professionalId: safeText(raw?.professionalId, 40),
      professionalName: safeText(raw?.professionalName, 80),
      serviceIds: Array.isArray(raw?.serviceIds) ? raw.serviceIds.slice(0, 12).map((v: unknown) => safeText(v, 80)) : [],
      serviceNames: Array.isArray(raw?.serviceNames) ? raw.serviceNames.slice(0, 12).map((v: unknown) => safeText(v, 120)) : []
    };
    // Só profissional do próprio salão (outro salão ou inventada → recusado)
    const directory = await loadSalonDirectory(salonId);
    if (!findProfessional(directory, appointment.professionalId)) return json(res, 400, { error: 'Profissional inválida.' });
    if (!valid(appointment)) return json(res, 400, { error: 'Dados do agendamento incompletos.' });
    if (!staff) {
      // Site público: prova de que não é robô e limite de pedidos por telefone
      if (!await verifyTurnstile(raw?.turnstileToken, requestIp(req))) {
        return json(res, 403, { error: 'Não foi possível confirmar que você não é um robô. Atualize a página e tente de novo.' });
      }
      await assertPublicBookingLimit(salonId, appointment.clientPhone);
    }
    const result = await createUnifiedAppointment(
      salonId,
      { ...appointment, source: staff ? 'staff' : 'site' },
      {
        allowStaffMonday: Boolean(staff),
        allowStaffRetrospective: Boolean(staff),
        allowStaffOverBlocks: Boolean(staff)
      }
    );

    // Avisa a profissional pelo WhatsApp do salão, exceto quando ela mesma lançou o horário
    const bookedByOwnProfessional = staff?.role === 'profissional' && staff.professionalId === appointment.professionalId;
    if (result?.appointment && !bookedByOwnProfessional) {
      // Usa os dados conferidos e salvos pelo servidor (serviços e preço do catálogo)
      const saved = result.appointment;
      await sendProfessionalNotification({
        id: saved.id,
        status: saved.status,
        clientName: saved.clientName,
        clientPhone: saved.clientPhone,
        professionalId: saved.professionalId,
        professionalName: saved.professionalName,
        date: saved.date,
        startTime: saved.startTime,
        endTime: saved.endTime,
        serviceNames: saved.serviceNames,
        totalPrice: saved.totalPrice,
      }, salonId);
    }

    return json(res, 201, result);
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 500);
    if (status >= 500) console.error('[AGENDAMENTO] Erro:', error);
    return json(res, status, { error: publicErrorMessage(error, 'Não foi possível salvar o agendamento. Tente novamente.') });
  }
}

