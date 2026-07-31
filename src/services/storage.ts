import {
  Professional,
  Service,
  Client,
  Appointment,
  CoworkingSettings,
  Review,
  WaitlistEntry,
  AuditLog,
  SystemNotification,
  ScheduleBlock,
  PaymentRecord,
  User
} from '../types';

import {
  INITIAL_SETTINGS,
  INITIAL_PROFESSIONALS,
  INITIAL_SERVICES,
  INITIAL_CLIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_REVIEWS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

const STORAGE_KEYS = {
  SETTINGS: 'lev_coworking_settings_v1',
  PROFESSIONALS: 'lev_coworking_professionals_v10',
  SERVICES: 'lev_coworking_services_v2',
  CLIENTS: 'lev_coworking_clients_v1',
  APPOINTMENTS: 'lev_coworking_appointments_v1',
  REVIEWS: 'lev_coworking_reviews_v1',
  WAITLIST: 'lev_coworking_waitlist_v1',
  BLOCKS: 'lev_coworking_blocks_v1',
  FUTURE_SCHEDULE_RESET: 'lev_future_schedule_reset_v1',
  PAYMENTS: 'lev_coworking_payments_v1',
  LOGS: 'lev_coworking_logs_v1',
  NOTIFICATIONS: 'lev_coworking_notifications_v1',
  CURRENT_USER: 'lev_coworking_user_v3',
  USERS: 'lev_coworking_users_v1'
};

// Event emitter listener setup
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeStorage = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(fn => fn());
};

// Helper getter/setters
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (err) {
    console.warn(`Error writing ${key} to storage, attempting cleanup:`, err);
    try {
      // Clear non-critical history/logs to free up quota on mobile
      localStorage.removeItem('lev_coworking_logs_v1');
      localStorage.removeItem('lev_coworking_notifications_v1');
      localStorage.setItem(key, JSON.stringify(value));
      notifyListeners();
    } catch (quotaErr) {
      console.error(`LocalStorage quota exceeded for ${key}:`, quotaErr);
    }
  }
}

// Default current user (Visitor / Guest)
export const DEFAULT_CURRENT_USER: User = {
  id: "visitor_guest",
  name: "Visitante",
  email: "cliente@visitante.com",
  role: "cliente"
};

export const INITIAL_USERS: (User & { password?: string })[] = [
  {
    id: "admin_1",
    name: "Administração LEV",
    email: "admin@levcoworkingbeauty.com.br",
    role: "admin",
    password: "123"
  },
  {
    id: "prof_elisangela_user",
    name: "Elisangela",
    email: "elisangela@levcoworkingbeauty.com.br",
    role: "profissional",
    professionalId: "prof_elisangela",
    password: "123"
  },
  {
    id: "prof_talitha_user",
    name: "Talitha",
    email: "talitha@levcoworkingbeauty.com.br",
    role: "profissional",
    professionalId: "prof_talitha",
    password: "123"
  },
  {
    id: "prof_nayara_user",
    name: "Nayara",
    email: "nayara@levcoworkingbeauty.com.br",
    role: "profissional",
    professionalId: "prof_nayara",
    password: "123"
  },
  {
    id: "recepcao_1",
    name: "Recepção LEV",
    email: "recepcao@levcoworkingbeauty.com.br",
    role: "recepcao",
    password: "123"
  },
  {
    id: "client_camila_user",
    name: "Camila Rodrigues",
    email: "camila@gmail.com",
    role: "cliente",
    clientId: "cli_1",
    phone: "(11) 98888-7766",
    password: "123"
  }
];

export class StorageService {
  static subscribeStorage = subscribeStorage;

  // Users List & Auth
  static getUsers(): (User & { password?: string })[] {
    return getStored<(User & { password?: string })[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static authenticateUser(identifier: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, '');
    const cleanPass = password.trim();

    const found = users.find(u => {
      const uEmail = u.email ? u.email.toLowerCase() : '';
      const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';

      if (uEmail && uEmail === cleanId) return true;
      if (digitsOnly.length >= 8 && uPhoneDigits && uPhoneDigits === digitsOnly) return true;
      return false;
    });

    if (!found) {
      return { success: false, error: 'Usuário não encontrado com este E-mail ou Celular. Verifique os dados ou cadastre-se.' };
    }

    if (found.role !== 'cliente') {
      return { success: false, error: 'Este acesso é exclusivo para clientes cadastrados.' };
    }

    if (found.password && found.password !== cleanPass) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    // Convert to User type (without sensitive password in active session state)
    const activeUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      professionalId: found.professionalId,
      clientId: found.clientId,
      phone: found.phone,
      avatarUrl: found.avatarUrl
    };

    this.setCurrentUser(activeUser);
    this.addAuditLog("LOGIN_USUARIO", activeUser.name, `Usuário ${activeUser.name} (${activeUser.role}) efetuou login no sistema.`);
    return { success: true, user: activeUser };
  }

  static registerClientUser(data: { name: string; email?: string; phone?: string; password: string }): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : '';
    const cleanPhone = data.phone ? data.phone.trim() : '';
    const digitsPhone = cleanPhone.replace(/\D/g, '');

    if (!cleanEmail && !cleanPhone) {
      return { success: false, error: 'Informe pelo menos seu E-mail ou Celular/WhatsApp para realizar o cadastro.' };
    }

    // Check duplicate email
    if (cleanEmail && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema. Faça login com ele para continuar.' };
    }

    // Check duplicate phone
    if (digitsPhone.length >= 8 && users.some(u => u.phone && u.phone.replace(/\D/g, '') === digitsPhone)) {
      return { success: false, error: 'Este número de celular já está cadastrado no sistema. Faça login para continuar.' };
    }

    const generatedEmail = cleanEmail || `${digitsPhone || Date.now()}@cliente.com`;

    // Create client entry first
    const newClientId = `cli_${Date.now()}`;
    const newClientObj: Client = {
      id: newClientId,
      fullName: data.name,
      email: generatedEmail,
      phone: cleanPhone || '(11) 99999-9999',
      whatsapp: digitsPhone,
      noShowCount: 0,
      cancellationCount: 0,
      imageConsent: true,
      communicationConsent: true,
      active: true,
      createdAt: new Date().toISOString()
    };

    const currentClients = this.getClients();
    currentClients.push(newClientObj);
    setStored(STORAGE_KEYS.CLIENTS, currentClients);

    // Create user account
    const newUserId = `user_cli_${Date.now()}`;
    const newUserRecord: User & { password?: string } = {
      id: newUserId,
      name: data.name,
      email: generatedEmail,
      role: 'cliente',
      clientId: newClientId,
      phone: cleanPhone,
      password: data.password.trim()
    };

    users.push(newUserRecord);
    setStored(STORAGE_KEYS.USERS, users);

    const activeUser: User = {
      id: newUserRecord.id,
      name: newUserRecord.name,
      email: newUserRecord.email,
      role: newUserRecord.role,
      clientId: newUserRecord.clientId,
      phone: newUserRecord.phone
    };

    this.setCurrentUser(activeUser);
    this.addAuditLog("CADASTRO_CLIENTE", activeUser.name, `Nova conta de cliente registrada: ${activeUser.name}`);
    return { success: true, user: activeUser };
  }

  static changePassword(userId: string, currentPass: string, newPass: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const cleanCurrent = currentPass.trim();
    const cleanNew = newPass.trim();

    if (!cleanNew || cleanNew.length < 3) {
      return { success: false, error: 'A nova senha deve possuir pelo menos 3 caracteres.' };
    }

    const userIndex = users.findIndex(u => u.id === userId || u.email === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const user = users[userIndex];
    if (user.password && user.password !== cleanCurrent) {
      return { success: false, error: 'A senha atual informada está incorreta.' };
    }

    users[userIndex].password = cleanNew;
    setStored(STORAGE_KEYS.USERS, users);
    this.addAuditLog("ALTERACAO_SENHA", user.name, `Senha alterada com sucesso para a conta ${user.name} (${user.email}).`);

    return { success: true };
  }

  static resetPassword(identifier: string, newPass: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, '');
    const cleanNew = newPass.trim();

    if (!cleanId && !digitsOnly) {
      return { success: false, error: 'Informe seu e-mail ou telefone celular cadastrado.' };
    }

    if (!cleanNew || cleanNew.length < 3) {
      return { success: false, error: 'A nova senha deve ter pelo menos 3 caracteres.' };
    }

    const userIndex = users.findIndex(u => {
      const uEmail = u.email ? u.email.toLowerCase() : '';
      const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
      if (uEmail && uEmail === cleanId) return true;
      if (digitsOnly.length >= 8 && uPhoneDigits && uPhoneDigits === digitsOnly) return true;
      return false;
    });

    if (userIndex === -1) {
      return { success: false, error: 'Nenhuma conta foi encontrada com esse E-mail ou Celular/WhatsApp.' };
    }

    if (users[userIndex].role !== 'cliente') {
      return { success: false, error: 'A recuperação pública de senha é exclusiva para clientes.' };
    }

    users[userIndex].password = cleanNew;
    setStored(STORAGE_KEYS.USERS, users);

    const updatedUser = users[userIndex];
    const activeUser: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      professionalId: updatedUser.professionalId,
      clientId: updatedUser.clientId,
      phone: updatedUser.phone
    };

    this.addAuditLog("RECUPERACAO_SENHA", updatedUser.name, `Senha redefinida com sucesso para o usuário ${updatedUser.name}.`);

    return { success: true, user: activeUser };
  }

  static logout(): void {
    const defaultVisitor: User = {
      id: "visitor_guest",
      name: "Visitante",
      email: "cliente@visitante.com",
      role: "cliente"
    };
    this.setCurrentUser(defaultVisitor);
  }

  // Current User
  static getCurrentUser(): User {
    const user = getStored<User>(STORAGE_KEYS.CURRENT_USER, DEFAULT_CURRENT_USER);
    if (user.role !== 'cliente') {
      setStored<User>(STORAGE_KEYS.CURRENT_USER, DEFAULT_CURRENT_USER);
      return DEFAULT_CURRENT_USER;
    }
    return user;
  }

  static setCurrentUser(user: User): void {
    setStored<User>(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Settings
  static getSettings(): CoworkingSettings {
    const settings = getStored<CoworkingSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    let updated = false;
    if (!settings.address || settings.address.includes('Rua das Flores') || settings.address.includes('São Paulo')) {
      settings.address = INITIAL_SETTINGS.address;
      updated = true;
    }
    if (settings.phone !== INITIAL_SETTINGS.phone || settings.whatsapp !== INITIAL_SETTINGS.whatsapp) {
      settings.phone = INITIAL_SETTINGS.phone;
      settings.whatsapp = INITIAL_SETTINGS.whatsapp;
      updated = true;
    }
    if (updated) {
      setStored(STORAGE_KEYS.SETTINGS, settings);
    }
    return settings;
  }

  static saveSettings(settings: CoworkingSettings): void {
    setStored(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog("CONFIG_ATUALIZADA", "Configurações Gerais", "Atualização das configurações do coworking.");
  }

  // Professionals
  static getProfessionals(): Professional[] {
    const list = getStored<Professional[]>(STORAGE_KEYS.PROFESSIONALS, INITIAL_PROFESSIONALS);
    const officialAvatars: Record<string, string> = {
      prof_elisangela: '/profiles/elisangela.webp',
      prof_talitha: '/profiles/talitha.webp',
      prof_nayara: '/profiles/nayara.webp'
    };

    let updated = false;
    const sanitized = list.map(p => {
      const officialAvatar = officialAvatars[p.id];
      const shouldUseOfficialAvatar = Boolean(
        officialAvatar && (
          !p.avatarUrl ||
          p.avatarUrl.startsWith('/') ||
          p.avatarUrl.includes('images.unsplash.com')
        )
      );

      if (shouldUseOfficialAvatar && p.avatarUrl !== officialAvatar) {
        updated = true;
        return { ...p, avatarUrl: officialAvatar };
      }

      return p;
    });

    if (updated) {
      setStored(STORAGE_KEYS.PROFESSIONALS, sanitized);
    }

    return sanitized;
  }

  static getProfessionalById(id: string): Professional | undefined {
    return this.getProfessionals().find(p => p.id === id);
  }

  static saveProfessional(prof: Professional): void {
    const list = this.getProfessionals();
    const index = list.findIndex(p => p.id === prof.id);
    if (index >= 0) {
      list[index] = prof;
    } else {
      list.push(prof);
    }
    setStored(STORAGE_KEYS.PROFESSIONALS, list);

    // Also update matching User avatarUrl if present
    const users = this.getUsers();
    let updatedUsers = false;
    const newUsers = users.map(u => {
      if (u.professionalId === prof.id || (u.email && u.email.toLowerCase() === prof.email.toLowerCase())) {
        updatedUsers = true;
        return { ...u, name: prof.name, avatarUrl: prof.avatarUrl };
      }
      return u;
    });
    if (updatedUsers) {
      setStored(STORAGE_KEYS.USERS, newUsers);
    }

    this.addAuditLog("PROFISSIONAL_SALVA", prof.name, `Dados profissionais e MEI de ${prof.name} atualizados.`);
  }

  // Services
  static getServices(): Service[] {
    return getStored<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }

  static saveService(service: Service): void {
    const list = this.getServices();
    const index = list.findIndex(s => s.id === service.id);
    if (index >= 0) {
      list[index] = service;
    } else {
      list.push(service);
    }
    setStored(STORAGE_KEYS.SERVICES, list);
    this.addAuditLog("SERVICO_SALVO", service.name, `Serviço ${service.name} (${service.professionalName}) atualizado/criado.`);
  }

  static deleteService(id: string): void {
    const list = this.getServices().filter(s => s.id !== id);
    setStored(STORAGE_KEYS.SERVICES, list);
    this.addAuditLog("SERVICO_EXCLUIDO", id, "Serviço removido do sistema.");
  }

  // Clients
  static getClients(): Client[] {
    return getStored<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }

  static getClientById(id: string): Client | undefined {
    return this.getClients().find(c => c.id === id);
  }

  static saveClient(client: Client): Client {
    const list = this.getClients();
    const index = list.findIndex(c => c.id === client.id);
    if (index >= 0) {
      list[index] = client;
    } else {
      list.push(client);
    }
    setStored(STORAGE_KEYS.CLIENTS, list);
    this.addAuditLog("CLIENTE_SALVO", client.fullName, `Cadastro de cliente ${client.fullName} salvo.`);
    return client;
  }

  // Appointments
  private static clearFutureScheduleOnce(): void {
    try {
      if (localStorage.getItem(STORAGE_KEYS.FUTURE_SCHEDULE_RESET)) return;

      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('-');

      const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
      const pastAndTodayAppointments = appointments.filter(appointment => appointment.date <= today);
      setStored(STORAGE_KEYS.APPOINTMENTS, pastAndTodayAppointments);

      const blocks = getStored<ScheduleBlock[]>(STORAGE_KEYS.BLOCKS, []);
      const pastAndTodayBlocks = blocks.filter(block => block.date <= today);
      setStored(STORAGE_KEYS.BLOCKS, pastAndTodayBlocks);

      localStorage.setItem(STORAGE_KEYS.FUTURE_SCHEDULE_RESET, new Date().toISOString());
    } catch (error) {
      console.warn('Não foi possível limpar a agenda futura anterior:', error);
    }
  }

  static getAppointments(): Appointment[] {
    this.clearFutureScheduleOnce();
    return getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }

  static getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find(a => a.id === id);
  }

  static saveAppointment(apt: Appointment): void {
    const list = this.getAppointments();
    const index = list.findIndex(a => a.id === apt.id);
    if (index >= 0) {
      list[index] = apt;
    } else {
      list.unshift(apt);
    }
    setStored(STORAGE_KEYS.APPOINTMENTS, list);

    // Notify
    this.addNotification({
      title: "Agendamento Salvo/Atualizado",
      message: `${apt.clientName} - ${apt.serviceNames.join(', ')} com ${apt.professionalName} em ${apt.date} às ${apt.startTime}.`,
      type: "booking",
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      linkTo: "agenda"
    });

    this.addAuditLog("AGENDAMENTO_SALVO", apt.id, `Agendamento de ${apt.clientName} com ${apt.professionalName} em ${apt.date} ${apt.startTime}.`);
  }

  static cancelAppointment(id: string, reason: string, isByClient: boolean = false): void {
    const apt = this.getAppointmentById(id);
    if (!apt) return;

    apt.status = isByClient ? 'cancelado_cliente' : 'cancelado_coworking';
    apt.cancellationReason = reason;
    apt.updatedAt = new Date().toISOString();

    this.saveAppointment(apt);

    // Increment client cancellation count
    const client = this.getClientById(apt.clientId);
    if (client) {
      client.cancellationCount = (client.cancellationCount || 0) + 1;
      this.saveClient(client);
    }

    this.addNotification({
      title: "Agendamento Cancelado",
      message: `Atendimento de ${apt.clientName} com ${apt.professionalName} foi cancelado. Motivo: ${reason}`,
      type: "cancellation",
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      linkTo: "agenda"
    });

    this.addAuditLog("AGENDAMENTO_CANCELADO", id, `Cancelado por ${isByClient ? 'Cliente' : 'Coworking'}. Motivo: ${reason}`);
  }

  static rescheduleAppointment(id: string, newDate: string, newStartTime: string, newEndTime: string, reason?: string): void {
    const apt = this.getAppointmentById(id);
    if (!apt) return;

    const historyEntry = {
      id: "resch_" + Date.now(),
      previousDate: apt.date,
      previousTime: apt.startTime,
      newDate,
      newTime: newStartTime,
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      changedBy: this.getCurrentUser().name,
      reason
    };

    apt.rescheduleHistory = [...(apt.rescheduleHistory || []), historyEntry];
    apt.date = newDate;
    apt.startTime = newStartTime;
    apt.endTime = newEndTime;
    apt.status = 'reagendado';
    apt.updatedAt = new Date().toISOString();

    this.saveAppointment(apt);

    this.addAuditLog("AGENDAMENTO_REAGENDADO", id, `Reagendado de ${historyEntry.previousDate} ${historyEntry.previousTime} para ${newDate} ${newStartTime}.`);
  }

  // Schedule Blocks
  static getScheduleBlocks(): ScheduleBlock[] {
    this.clearFutureScheduleOnce();
    return getStored<ScheduleBlock[]>(STORAGE_KEYS.BLOCKS, []);
  }

  static saveScheduleBlock(block: ScheduleBlock): void {
    const list = this.getScheduleBlocks();
    list.push(block);
    setStored(STORAGE_KEYS.BLOCKS, list);
    this.addAuditLog("BLOQUEIO_AGENDA", block.professionalId, `Horário bloqueado em ${block.date} das ${block.startTime} às ${block.endTime}.`);
  }

  static deleteScheduleBlock(id: string): void {
    const list = this.getScheduleBlocks().filter(b => b.id !== id);
    setStored(STORAGE_KEYS.BLOCKS, list);
  }

  // Payments
  static getPaymentRecords(): PaymentRecord[] {
    return getStored<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
  }

  static savePaymentRecord(record: PaymentRecord): void {
    const list = this.getPaymentRecords();
    list.push(record);
    setStored(STORAGE_KEYS.PAYMENTS, list);

    // Update appointment payment state
    const apt = this.getAppointmentById(record.appointmentId);
    if (apt) {
      if (record.type === 'sinal') {
        apt.depositPaid = (apt.depositPaid || 0) + record.amount;
        apt.remainingPrice = Math.max(0, apt.totalPrice - apt.depositPaid);
        apt.paymentStatus = apt.remainingPrice === 0 ? 'pago' : 'parcial';
      } else if (record.type === 'restante' || record.type === 'integral') {
        apt.remainingPrice = Math.max(0, apt.remainingPrice - record.amount);
        apt.paymentStatus = apt.remainingPrice === 0 ? 'pago' : 'parcial';
      }
      apt.paymentMethod = record.method;
      apt.paymentDate = record.paidAt;
      this.saveAppointment(apt);
    }

    this.addAuditLog("PAGAMENTO_REGISTRADO", record.appointmentId, `Pagamento R$ ${record.amount.toFixed(2)} (${record.method}) registrado para ${record.clientName}.`);
  }

  // Reviews
  static getReviews(): Review[] {
    return getStored<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  }

  static saveReview(review: Review): void {
    const list = this.getReviews();
    const index = list.findIndex(r => r.id === review.id);
    if (index >= 0) {
      list[index] = review;
    } else {
      list.unshift(review);
    }
    setStored(STORAGE_KEYS.REVIEWS, list);
  }

  // Waitlist
  static getWaitlist(): WaitlistEntry[] {
    return getStored<WaitlistEntry[]>(STORAGE_KEYS.WAITLIST, []);
  }

  static saveWaitlistEntry(entry: WaitlistEntry): void {
    const list = this.getWaitlist();
    const index = list.findIndex(w => w.id === entry.id);
    if (index >= 0) {
      list[index] = entry;
    } else {
      list.unshift(entry);
    }
    setStored(STORAGE_KEYS.WAITLIST, list);
    this.addAuditLog("LISTA_ESPERA_ENTRADA", entry.clientName, `Cliente entrou na lista de espera.`);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(action: string, target: string, details: string, oldValue?: string, newValue?: string): void {
    const user = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      target,
      details,
      oldValue,
      newValue,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    logs.unshift(newLog);
    // Keep max 500 logs
    setStored(STORAGE_KEYS.LOGS, logs.slice(0, 500));
  }

  // Notifications
  static getNotifications(): SystemNotification[] {
    return getStored<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static addNotification(notif: Omit<SystemNotification, 'id'>): void {
    const list = this.getNotifications();
    const newNotif: SystemNotification = {
      ...notif,
      id: "notif_" + Date.now()
    };
    list.unshift(newNotif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 100));
  }

  static markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  static clearAllNotifications(): void {
    setStored(STORAGE_KEYS.NOTIFICATIONS, []);
  }
}
