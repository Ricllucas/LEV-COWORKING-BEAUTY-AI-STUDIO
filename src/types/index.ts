export type UserRole = 'admin' | 'profissional' | 'recepcao' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  professionalId?: string; // Linked professional if role === 'profissional'
  clientId?: string; // Linked client ID if role === 'cliente'
  phone?: string;
  avatarUrl?: string;
}

export type CategoryType = 
  | 'Unha Raiz' 
  | 'Maquiagem e Sobrancelhas' 
  | 'Unhas em Gel' 
  | 'Sobrancelhas & Cílios' 
  | 'Micropigmentação' 
  | 'Estética Labial' 
  | 'Produções'
  | 'Brows'
  | 'Outros';

export interface Professional {
  id: string;
  name: string;
  title: string; // e.g. 'Unha Raiz', 'Maquiagem e Sobrancelhas', 'Unhas em Gel'
  meiName: string;
  cnpjCpf: string;
  pixKey: string;
  bankName: string;
  phone: string;
  whatsapp: string;
  email: string;
  bio: string;
  avatarUrl: string;
  categories: CategoryType[];
  color: string; // Tailwind color or hex for calendar identification
  workingHours: {
    [dayOfWeek: number]: { // 0 = Sun, 1 = Mon ... 6 = Sat
      active: boolean;
      startTime: string; // "08:00"
      endTime: string;   // "18:00"
      lunchStart?: string; // "12:00"
      lunchEnd?: string;   // "13:00"
    };
  };
  slotBufferMinutes: number; // Interval between appointments
  maxDailyAppointments?: number;
  offDays: string[]; // ISO date strings "YYYY-MM-DD"
  vacations: { start: string; end: string; reason?: string }[];
}

export interface Service {
  id: string;
  catalogVersion?: number;
  name: string;
  category: CategoryType;
  description: string;
  professionalId: string; // Responsible professional ID
  professionalName: string;
  durationMinutes: number;
  bufferAfterMinutes: number;
  price: number; // R$
  promotionalPrice?: number;
  depositRequired: boolean;
  depositValue: number; // R$ or percentage
  color: string;
  active: boolean;
  onlineBookingEnabled: boolean;
  minNoticeHours: number;
  maxCancellationNoticeHours: number;
  preInstructions?: string;
  postInstructions?: string;
  internalNotes?: string;
}

export type AppointmentStatus =
  | 'aguardando_confirmacao'
  | 'confirmado'
  | 'cliente_presente'
  | 'em_atendimento'
  | 'concluido'
  | 'reagendamento_solicitado'
  | 'reagendado'
  | 'cancelado_cliente'
  | 'cancelado_coworking'
  | 'nao_compareceu';

export type PaymentStatus =
  | 'nao_informado'
  | 'pendente'
  | 'parcial'
  | 'pago'
  | 'estornado'
  | 'isento';

export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'transferencia'
  | 'cortesia'
  | 'outro';

export interface RescheduleHistory {
  id: string;
  previousDate: string;
  previousTime: string;
  newDate: string;
  newTime: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  professionalId: string;
  professionalName: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  totalDurationMinutes: number;
  totalPrice: number;
  discountPrice?: number;
  extraPrice?: number;
  depositPaid: number;
  remainingPrice: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  cancellationReason?: string;
  rescheduleHistory?: RescheduleHistory[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email?: string;
  birthDate?: string;
  address?: string;
  preferredProfessionalId?: string;
  preferredServiceId?: string;
  firstAppointmentDate?: string;
  lastAppointmentDate?: string;
  notes?: string;
  healthSensitivities?: string; // Health sensitivities declared by client
  noShowCount: number;
  cancellationCount: number;
  imageConsent: boolean;
  communicationConsent: boolean;
  active: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  professionalId: string;
  clientId: string;
  clientName: string;
  amount: number;
  method: PaymentMethod;
  type: 'sinal' | 'restante' | 'integral';
  paidAt: string;
  receivedBy: string;
  notes?: string;
}

export interface ScheduleBlock {
  id: string;
  professionalId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  title: string;
  reason?: string;
}

export interface WaitlistEntry {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  preferredDates: string[]; // ["2026-07-29"]
  preferredTimeSlots?: string;
  notes?: string;
  status: 'aguardando' | 'contatada' | 'horario_oferecido' | 'convertida' | 'recusou' | 'encerrada';
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  code?: string;
  description: string;
  professionalId?: string;
  discountPercentage?: number;
  fixedDiscount?: number;
  validUntil: string;
  active: boolean;
}

export interface LoyaltyCard {
  id: string;
  clientId: string;
  professionalId: string;
  stampsCount: number;
  stampsRequired: number; // e.g. 10 stamps = 1 free service
  rewardDescription: string;
}

export interface Review {
  id: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  serviceName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  approved: boolean;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'reschedule' | 'waitlist' | 'payment' | 'general';
  read: boolean;
  createdAt: string;
  linkTo?: string;
}

export interface CoworkingSettings {
  name: string;
  subName: string;
  slogan: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  businessHoursText: string;
  cancellationPolicy: string;
  depositPercentage: number;
  privacyPolicy: string;
  termsOfService: string;
  logoUrl?: string;
  heroBannerUrl?: string;
  galleryImages?: { url: string; title: string; desc: string }[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export type WhatsAppConversationStatus = 'bot' | 'aguardando' | 'em_atendimento' | 'encerrada';

export interface WhatsAppConversation {
  id: string;
  waContactId: string;
  clientPhone: string;
  clientName: string;
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  appointmentId?: string;
  status: WhatsAppConversationStatus;
  botEnabled: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppMessageDirection = 'entrada' | 'saida';

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  direction: WhatsAppMessageDirection;
  senderType: 'cliente' | 'bot' | 'profissional' | 'admin' | 'sistema';
  senderName: string;
  body: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'unknown';
  status: 'recebida' | 'pendente' | 'enviada' | 'entregue' | 'lida' | 'falhou';
  sentAt: string;
}
