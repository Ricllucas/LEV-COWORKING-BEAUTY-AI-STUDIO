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

import { CloudAppointmentService } from './cloudAppointments';
import { SalonDataSync, SyncKind, SyncUser } from './salonDataSync';

import {
  INITIAL_CLIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';
import { bundledDataFor } from '../data/salonDefaults';
import {
  LEV_BRAND_LOGO_URL,
  LEV_ELISANGELA_ID,
  LEV_EXAMPLE_USERS,
  LEV_OFFICIAL_AVATARS,
  LEV_OFFICIAL_PIX_KEYS,
  LEV_PLACEHOLDER_ADDRESS_HINTS,
  LEV_TALITHA_ADDITION_IDS,
  LEV_TALITHA_ADDITIONS_KEY,
  LEV_TALITHA_ID,
  LEV_TEST_PHONES
} from '../data/levLegacy';
import { CURRENT_SALON_ID, isDefaultSalon, scopedStorageKey } from '../config/salon';

// Dados de fábrica do salão deste site (LEV: os de sempre; outro salão: vazio).
const BUNDLED = bundledDataFor(CURRENT_SALON_ID);

// "Unha Raiz" was renamed to "Unha Tradicional"; older browser data and the cloud
// catalog may still carry the legacy label, so it is translated whenever it is read.
const LEGACY_LABELS: Record<string, string> = { 'Unha Raiz': 'Unha Tradicional' };
const renameLegacyLabel = <T extends string>(label: T): T => (LEGACY_LABELS[label] ?? label) as T;
const normalizeServiceLabels = (services: Service[]): Service[] =>
  services.map(s => (LEGACY_LABELS[s.category] ? { ...s, category: renameLegacyLabel(s.category) } : s));

// Chaves do aparelho. Na LEV ficam como sempre foram; em outro salão ganham o
// id do salão na frente (scopedStorageKey), para os dados não se misturarem.
const RAW_STORAGE_KEYS = {
  SETTINGS: 'lev_coworking_settings_v1',
  BRAND_ASSETS_VERSION: 'lev_brand_logo_2026_08_05_v2',
  PROFESSIONALS: 'lev_coworking_professionals_v10',
  PIX_KEYS_VERSION: 'lev_pix_keys_2026_08_25',
  PROFESSIONAL_CONTACT_VERSION: 'lev_professional_contact_2026_08_05',
  PROFESSIONAL_WORKDAYS_VERSION: 'lev_professional_workdays_2026_08_24',
  // Trocar este nome quando houver fotos oficiais novas: força a foto oficial uma vez em cada aparelho
  PROFESSIONAL_AVATARS_VERSION: 'lev_professional_avatars_2026_11_04',
  SERVICES: 'lev_coworking_services_v2',
  TALITHA_CATALOG_VERSION: 'lev_talitha_catalog_2026_07_31',
  ELISANGELA_CATALOG_VERSION: 'lev_elisangela_catalog_2026_08_12_v2',
  CLIENTS: 'lev_coworking_clients_v1',
  APPOINTMENTS: 'lev_coworking_appointments_v1',
  CLIENT_BOOKING_IDS: 'lev_client_booking_ids_v1',
  REVIEWS: 'lev_coworking_reviews_v1',
  WAITLIST: 'lev_coworking_waitlist_v1',
  BLOCKS: 'lev_coworking_blocks_v1',
  FUTURE_SCHEDULE_RESET: 'lev_future_schedule_reset_v1',
  TEST_DATA_PURGE_VERSION: 'lev_test_data_purge_2026_08_15_v1',
  PAYMENTS: 'lev_coworking_payments_v1',
  LOGS: 'lev_coworking_logs_v1',
  NOTIFICATIONS: 'lev_coworking_notifications_v1',
  CURRENT_USER: 'lev_coworking_user_v3',
  USERS: 'lev_coworking_users_v1',
  TALITHA_ADDITIONS_VERSION: LEV_TALITHA_ADDITIONS_KEY
};

const STORAGE_KEYS = Object.fromEntries(
  Object.entries(RAW_STORAGE_KEYS).map(([name, key]) => [name, scopedStorageKey(key)])
) as Record<keyof typeof RAW_STORAGE_KEYS, string>;

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

// Quem está logada nesta aba, só em memória. O aparelho guarda apenas login de
// cliente (getCurrentUser devolve visitante para equipe), então o envio para a
// nuvem usa este registro, preenchido por setCurrentUser.
let sessionUser: User | undefined;

// Enquanto > 0, nada é enviado para a nuvem (regravação em massa do estado).
let localOnlyDepth = 0;

const staffSyncUser = (): SyncUser | undefined => {
  const user = sessionUser;
  if (!user || !user.id || (user.role !== 'admin' && user.role !== 'profissional')) return undefined;
  return { id: user.id, role: user.role, professionalId: user.professionalId };
};

// Envia sem esperar. Cliente, visitante ou regravação em massa: não envia.
const sendToCloud = (kind: SyncKind, item: unknown) => {
  if (localOnlyDepth > 0) return;
  const user = staffSyncUser();
  if (!user) return;
  void SalonDataSync.push(kind, item, user);
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
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
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

// Usuários de exemplo: só a LEV tem; outro salão começa sem nenhum.
export const INITIAL_USERS: (User & { password?: string })[] = isDefaultSalon() ? LEV_EXAMPLE_USERS : [];

export class StorageService {
  static subscribeStorage = subscribeStorage;

  // Avisa as telas que o aparelho mudou por fora do StorageService (ex.: pull da nuvem).
  static notifyExternalChange(): void {
    notifyListeners();
  }

  // Quem está logada para a nuvem (admin ou profissional); senão undefined.
  static getSyncUser(): SyncUser | undefined {
    return staffSyncUser();
  }

  // Executa `task` gravando só no aparelho, sem nenhum envio para a nuvem.
  // Usado pelo CoworkingContext, que regrava listas inteiras a cada mudança.
  static runLocalOnly(task: () => void): void {
    localOnlyDepth += 1;
    try {
      task();
    } finally {
      localOnlyDepth -= 1;
    }
  }

  private static purgeConfirmedTestDataOnce(): void {
    // Limpeza antiga de aparelhos da LEV; outro salão não tem o que limpar.
    if (!isDefaultSalon()) return;
    if (localStorage.getItem(STORAGE_KEYS.TEST_DATA_PURGE_VERSION)) return;

    const testPhones = new Set(LEV_TEST_PHONES);
    const isTestPhone = (phone?: string) => {
      const normalized = (phone || '').replace(/\D/g, '').slice(-11);
      return testPhones.has(normalized);
    };

    const clients = getStored<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS)
      .filter(client => !isTestPhone(client.phone));
    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS)
      .filter(appointment => !isTestPhone(appointment.clientPhone));
    const users = getStored<(User & { password?: string })[]>(STORAGE_KEYS.USERS, INITIAL_USERS)
      .filter(user => !isTestPhone(user.phone));

    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.TEST_DATA_PURGE_VERSION, new Date().toISOString());
    notifyListeners();
  }

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
    sessionUser = user;
    setStored<User>(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Settings
  static getSettings(): CoworkingSettings {
    const settings = getStored<CoworkingSettings>(STORAGE_KEYS.SETTINGS, BUNDLED.settings);
    // Correções antigas dos aparelhos da LEV; em outro salão vale o que foi gravado.
    if (!isDefaultSalon()) return settings;
    const bundledSettings = BUNDLED.settings;
    let updated = false;
    if (!localStorage.getItem(STORAGE_KEYS.BRAND_ASSETS_VERSION)) {
      settings.logoUrl = LEV_BRAND_LOGO_URL;
      settings.heroBannerUrl = LEV_BRAND_LOGO_URL;
      localStorage.setItem(STORAGE_KEYS.BRAND_ASSETS_VERSION, new Date().toISOString());
      updated = true;
    }
    if (!settings.address || LEV_PLACEHOLDER_ADDRESS_HINTS.some(hint => settings.address.includes(hint))) {
      settings.address = bundledSettings.address;
      updated = true;
    }
    if (settings.phone !== bundledSettings.phone || settings.whatsapp !== bundledSettings.whatsapp) {
      settings.phone = bundledSettings.phone;
      settings.whatsapp = bundledSettings.whatsapp;
      updated = true;
    }
    if (settings.businessHoursText !== bundledSettings.businessHoursText) {
      settings.businessHoursText = bundledSettings.businessHoursText;
      updated = true;
    }
    if (updated) {
      setStored(STORAGE_KEYS.SETTINGS, settings);
    }
    return settings;
  }

  static saveSettings(settings: CoworkingSettings): void {
    setStored(STORAGE_KEYS.SETTINGS, settings);
    // O banco só aceita configuração da admin; a da profissional fica no aparelho.
    if (staffSyncUser()?.role === 'admin') sendToCloud('settings', settings);
    this.addAuditLog("CONFIG_ATUALIZADA", "Configurações Gerais", "Atualização das configurações do coworking.");
  }

  // Professionals
  static getProfessionals(): Professional[] {
    const list = getStored<Professional[]>(STORAGE_KEYS.PROFESSIONALS, BUNDLED.professionals);
    // Correções antigas (fotos, Pix, contato, dias de trabalho) só para aparelhos da LEV.
    const legacy = isDefaultSalon();
    const officialAvatars: Readonly<Record<string, string>> = legacy ? LEV_OFFICIAL_AVATARS : {};
    const officialPixKeys: Readonly<Record<string, string>> = legacy ? LEV_OFFICIAL_PIX_KEYS : {};
    const shouldMigratePixKeys = legacy && !localStorage.getItem(STORAGE_KEYS.PIX_KEYS_VERSION);
    const shouldMigrateContact = legacy && !localStorage.getItem(STORAGE_KEYS.PROFESSIONAL_CONTACT_VERSION);
    const shouldMigrateWorkdays = legacy && !localStorage.getItem(STORAGE_KEYS.PROFESSIONAL_WORKDAYS_VERSION);
    const shouldForceOfficialAvatars = legacy && !localStorage.getItem(STORAGE_KEYS.PROFESSIONAL_AVATARS_VERSION);

    let updated = false;
    const sanitized = list.map(p => {
      const officialAvatar = officialAvatars[p.id];
      const officialPixKey = officialPixKeys[p.id];
      const shouldUseOfficialAvatar = Boolean(
        officialAvatar && (
          shouldForceOfficialAvatars ||
          !p.avatarUrl ||
          p.avatarUrl.startsWith('/') ||
          p.avatarUrl.includes('images.unsplash.com')
        )
      );

      const avatarUrl = shouldUseOfficialAvatar ? officialAvatar : p.avatarUrl;
      const pixKey = shouldMigratePixKeys && officialPixKey ? officialPixKey : p.pixKey;
      const phone = shouldMigrateContact ? BUNDLED.settings.phone : p.phone;
      const whatsapp = shouldMigrateContact ? BUNDLED.settings.whatsapp : p.whatsapp;
      const workingHours = shouldMigrateWorkdays
        ? {
            ...p.workingHours,
            0: { ...p.workingHours?.[0], active: false, startTime: '09:00', endTime: '18:00' },
            1: {
              ...p.workingHours?.[1],
              active: false,
              startTime: '09:00',
              endTime: '18:00'
            },
            2: { ...p.workingHours?.[2], active: true, startTime: '09:00', endTime: '18:00' },
            3: { ...p.workingHours?.[3], active: true, startTime: '09:00', endTime: '18:00' },
            4: { ...p.workingHours?.[4], active: true, startTime: '09:00', endTime: '18:00' },
            5: { ...p.workingHours?.[5], active: true, startTime: '09:00', endTime: '18:00' },
            6: { ...p.workingHours?.[6], active: true, startTime: '09:00', endTime: '18:00' }
          }
        : p.workingHours;

      const title = renameLegacyLabel(p.title);
      const categories = p.categories.some(c => LEGACY_LABELS[c]) ? p.categories.map(renameLegacyLabel) : p.categories;

      if (avatarUrl !== p.avatarUrl || pixKey !== p.pixKey || phone !== p.phone || whatsapp !== p.whatsapp || workingHours !== p.workingHours || title !== p.title || categories !== p.categories) {
        updated = true;
        return { ...p, avatarUrl, pixKey, phone, whatsapp, workingHours, title, categories };
      }

      return p;
    });

    if (updated) {
      setStored(STORAGE_KEYS.PROFESSIONALS, sanitized);
    }
    if (shouldMigratePixKeys) {
      localStorage.setItem(STORAGE_KEYS.PIX_KEYS_VERSION, new Date().toISOString());
    }
    if (shouldMigrateContact) {
      localStorage.setItem(STORAGE_KEYS.PROFESSIONAL_CONTACT_VERSION, new Date().toISOString());
    }
    if (shouldMigrateWorkdays) {
      localStorage.setItem(STORAGE_KEYS.PROFESSIONAL_WORKDAYS_VERSION, new Date().toISOString());
    }
    if (shouldForceOfficialAvatars) {
      localStorage.setItem(STORAGE_KEYS.PROFESSIONAL_AVATARS_VERSION, new Date().toISOString());
    }

    return sanitized;
  }

  static getProfessionalById(id: string): Professional | undefined {
    return this.getProfessionals().find(p => p.id === id);
  }

  // Grava só no aparelho (inclusive o log). Não envia para a nuvem: o
  // CoworkingContext chama isto para todas as profissionais a cada mudança, e um
  // aparelho com dados antigos sobrescreveria a nuvem.
  static saveProfessional(prof: Professional): void {
    this.runLocalOnly(() => this.storeProfessional(prof));
  }

  // Edição explícita da usuária: grava no aparelho e envia a profissional (e o log).
  static publishProfessional(prof: Professional): void {
    this.storeProfessional(prof);
    sendToCloud('professionals', prof); // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
  }

  private static storeProfessional(prof: Professional): void {
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
    let current = getStored<Service[]>(STORAGE_KEYS.SERVICES, BUNDLED.services);
    // Correções antigas dos catálogos da LEV; outro salão usa o que está gravado.
    if (!isDefaultSalon()) return normalizeServiceLabels(current);
    const bundledServices = BUNDLED.services;

    // Inclusão aditiva: preserva serviços e alterações anteriores da profissional.
    if (!localStorage.getItem(STORAGE_KEYS.TALITHA_ADDITIONS_VERSION)) {
      const additions = bundledServices.filter(service =>
        LEV_TALITHA_ADDITION_IDS.includes(service.id)
      );
      const ids = new Set(current.map(service => service.id));
      current = [...current, ...additions.filter(service => !ids.has(service.id))];
      setStored(STORAGE_KEYS.SERVICES, current);
      localStorage.setItem(STORAGE_KEYS.TALITHA_ADDITIONS_VERSION, '1');
    }



    try {
      if (!localStorage.getItem(STORAGE_KEYS.ELISANGELA_CATALOG_VERSION)) {
        const otherProfessionals = current.filter(service => service.professionalId !== LEV_ELISANGELA_ID);
        const officialElisangelaCatalog = bundledServices.filter(
          service => service.professionalId === LEV_ELISANGELA_ID
        );
        current = [...otherProfessionals, ...officialElisangelaCatalog];
        setStored(STORAGE_KEYS.SERVICES, current);
        localStorage.setItem(STORAGE_KEYS.ELISANGELA_CATALOG_VERSION, new Date().toISOString());
      }
    } catch (error) {
      console.warn('Não foi possível aplicar a atualização do catálogo da Elisangela:', error);
    }

    try {
      if (!localStorage.getItem(STORAGE_KEYS.TALITHA_CATALOG_VERSION)) {
        const otherProfessionals = current.filter(service => service.professionalId !== LEV_TALITHA_ID);
        const officialTalithaCatalog = bundledServices.filter(
          service => service.professionalId === LEV_TALITHA_ID
        );
        const updatedCatalog = [...otherProfessionals, ...officialTalithaCatalog];

        setStored(STORAGE_KEYS.SERVICES, updatedCatalog);
        localStorage.setItem(STORAGE_KEYS.TALITHA_CATALOG_VERSION, new Date().toISOString());
        return normalizeServiceLabels(updatedCatalog);
      }
    } catch (error) {
      console.warn('Não foi possível aplicar a atualização do catálogo da Talitha:', error);
    }

    return normalizeServiceLabels(current);
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

  static replaceServices(services: Service[]): void {
    setStored(STORAGE_KEYS.SERVICES, normalizeServiceLabels(services));
  }

  // Clients
  static getClients(): Client[] {
    this.purgeConfirmedTestDataOnce();
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

  static replaceClients(clients: Client[]): void {
    setStored(STORAGE_KEYS.CLIENTS, clients);
  }

  // Appointments
  private static clearFutureScheduleOnce(): void {
    // Limpeza única de aparelhos antigos da LEV. Em outro salão apagaria da
    // memória os horários futuros que acabaram de vir da nuvem.
    if (!isDefaultSalon()) return;
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
    this.purgeConfirmedTestDataOnce();
    this.clearFutureScheduleOnce();
    return getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }

  // Bookings the visitor made themselves on this device; the shared appointment
  // cache also holds the studio agenda and must never be shown to clients.
  static rememberClientBooking(id: string): void {
    const ids = getStored<string[]>(STORAGE_KEYS.CLIENT_BOOKING_IDS, []);
    if (ids.includes(id)) return;
    localStorage.setItem(STORAGE_KEYS.CLIENT_BOOKING_IDS, JSON.stringify([...ids, id]));
  }

  static getClientBookings(): Appointment[] {
    const ids = new Set(getStored<string[]>(STORAGE_KEYS.CLIENT_BOOKING_IDS, []));
    if (ids.size === 0) return [];
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    return this.getAppointments().filter(item =>
      ids.has(item.id) &&
      item.date >= today &&
      !['cancelado_cliente', 'cancelado_coworking', 'concluido'].includes(item.status)
    );
  }

  static getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find(a => a.id === id);
  }

  static async saveAppointmentToCloud(apt: Appointment, user?: User, turnstileToken?: string): Promise<void> {
    await CloudAppointmentService.save(apt, user, turnstileToken);
  }

  static async syncAppointmentsFromCloud(user: User): Promise<void> {
    if (!CloudAppointmentService.isConfigured() || (user.role !== 'admin' && user.role !== 'profissional')) return;
    const cloudAppointments = await CloudAppointmentService.list(user);
    // O servidor é a fonte oficial. Substituir o cache remove registros órfãos
    // ou antigos que poderiam voltar a bloquear horários já liberados.
    const synchronizedAppointments = [...cloudAppointments].sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
    );
    setStored(
      STORAGE_KEYS.APPOINTMENTS,
      synchronizedAppointments
    );
    this.syncClientsFromAppointments(cloudAppointments);
  }

  static syncClientsFromAppointments(appointments: Appointment[]): void {
    if (appointments.length === 0) return;

    const clients = this.getClients();
    const byPhone = new Map(
      clients.map((client, index) => [client.phone.replace(/\D/g, ''), index])
    );

    appointments.forEach(appointment => {
      const normalizedPhone = appointment.clientPhone.replace(/\D/g, '');
      if (!normalizedPhone) return;

      const existingIndex = byPhone.get(normalizedPhone);
      if (existingIndex !== undefined) {
        const existing = clients[existingIndex];
        clients[existingIndex] = {
          ...existing,
          fullName: appointment.clientName || existing.fullName,
          phone: appointment.clientPhone,
          whatsapp: appointment.clientPhone,
          email: appointment.clientEmail || existing.email,
          preferredProfessionalId: appointment.professionalId || existing.preferredProfessionalId,
          preferredServiceId: appointment.serviceIds[0] || existing.preferredServiceId,
          firstAppointmentDate: existing.firstAppointmentDate && existing.firstAppointmentDate < appointment.date
            ? existing.firstAppointmentDate
            : appointment.date,
          lastAppointmentDate: existing.lastAppointmentDate && existing.lastAppointmentDate > appointment.date
            ? existing.lastAppointmentDate
            : appointment.date
        };
        return;
      }

      const client: Client = {
        id: appointment.clientId || `cli_${normalizedPhone}`,
        fullName: appointment.clientName,
        phone: appointment.clientPhone,
        whatsapp: appointment.clientPhone,
        email: appointment.clientEmail,
        preferredProfessionalId: appointment.professionalId,
        preferredServiceId: appointment.serviceIds[0],
        firstAppointmentDate: appointment.date,
        lastAppointmentDate: appointment.date,
        noShowCount: 0,
        cancellationCount: 0,
        imageConsent: false,
        communicationConsent: true,
        active: true,
        createdAt: appointment.createdAt || new Date().toISOString()
      };
      byPhone.set(normalizedPhone, clients.length);
      clients.push(client);
    });

    setStored(STORAGE_KEYS.CLIENTS, clients);
  }

  static saveAppointment(apt: Appointment, syncCloud: boolean = false): void {
    const list = this.getAppointments();
    const index = list.findIndex(a => a.id === apt.id);
    if (index >= 0) {
      list[index] = apt;
    } else {
      list.unshift(apt);
    }
    setStored(STORAGE_KEYS.APPOINTMENTS, list);

    if (syncCloud && CloudAppointmentService.isConfigured()) {
      void CloudAppointmentService.save(apt, this.getCurrentUser()).catch(error => {
        console.error('Erro ao sincronizar agendamento:', error);
      });
    }

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
    return getStored<ScheduleBlock[]>(STORAGE_KEYS.BLOCKS, []);  }

  static saveScheduleBlock(block: ScheduleBlock): void {
    const list = this.getScheduleBlocks();
    list.push(block);
    setStored(STORAGE_KEYS.BLOCKS, list);
    sendToCloud('blocks', block);
    this.addAuditLog("BLOQUEIO_AGENDA", block.professionalId, `Horário bloqueado em ${block.date} das ${block.startTime} às ${block.endTime}.`);
  }

  static deleteScheduleBlock(id: string): void {
    const list = this.getScheduleBlocks().filter(b => b.id !== id);
    setStored(STORAGE_KEYS.BLOCKS, list);
    const user = staffSyncUser();
    if (user && localOnlyDepth === 0) void SalonDataSync.removeBlock(id, user);
  }

  // Payments
  static getPaymentRecords(): PaymentRecord[] {
    return getStored<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
  }

  static savePaymentRecord(record: PaymentRecord): void {
    const list = this.getPaymentRecords();
    list.push(record);
    setStored(STORAGE_KEYS.PAYMENTS, list);
    sendToCloud('payments', record); // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta

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
    return getStored<Review[]>(STORAGE_KEYS.REVIEWS, BUNDLED.reviews);
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
    sendToCloud('waitlist', entry); // tenant-guard: sem-filtro tipo de dado (SyncKind), não é consulta
    this.addAuditLog("LISTA_ESPERA_ENTRADA", entry.clientName, `Cliente entrou na lista de espera.`);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.LOGS, BUNDLED.auditLogs);
  }

  static addAuditLog(action: string, target: string, details: string, oldValue?: string, newValue?: string): void {
    // Autora do log: a equipe logada nesta aba; senão a cliente/visitante do aparelho.
    const staff = staffSyncUser() ? sessionUser : undefined;
    const user = staff ?? this.getCurrentUser();
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
    sendToCloud('logs', newLog);
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

