import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoworkingSettings, PaymentRecord, Professional, ScheduleBlock, User, WaitlistEntry } from '../types';

vi.mock('./salonDataSync', () => ({
  SalonDataSync: {
    pull: vi.fn(async () => false),
    push: vi.fn(async () => undefined),
    removeBlock: vi.fn(async () => undefined)
  }
}));

import { SalonDataSync } from './salonDataSync';
import { StorageService } from './storage';
import { INITIAL_PROFESSIONALS, INITIAL_SETTINGS } from '../data/initialData';

const push = vi.mocked(SalonDataSync.push);
const removeBlock = vi.mocked(SalonDataSync.removeBlock);

// O setup global troca o localStorage por vi.fn() vazios; aqui ele vira memória de verdade.
const memory = new Map<string, string>();
const useMemoryStorage = () => {
  memory.clear();
  vi.mocked(localStorage.getItem).mockImplementation((key: string) => memory.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => { memory.set(key, String(value)); });
  vi.mocked(localStorage.removeItem).mockImplementation((key: string) => { memory.delete(key); });
  vi.mocked(localStorage.clear).mockImplementation(() => memory.clear());
};

const ADMIN: User = { id: 'u_admin', name: 'Admin', email: 'admin@lev.com', role: 'admin' };
const PROF: User = { id: 'u_prof', name: 'Talitha', email: 'tal@lev.com', role: 'profissional', professionalId: 'prof_talitha' };
const CLIENT: User = { id: 'user_cli_1', name: 'Cliente', email: 'cli@lev.com', role: 'cliente' };

const ADMIN_SYNC = { id: 'u_admin', role: 'admin', professionalId: undefined };
const PROF_SYNC = { id: 'u_prof', role: 'profissional', professionalId: 'prof_talitha' };

const payment: PaymentRecord = {
  id: 'pay_1',
  appointmentId: 'apt_inexistente',
  professionalId: 'prof_talitha',
  clientId: 'cli_1',
  clientName: 'Cliente',
  amount: 50,
  method: 'pix',
  type: 'integral',
  paidAt: '2026-11-04 10:00',
  receivedBy: 'Admin'
};

const block: ScheduleBlock = { id: 'blk_1', professionalId: 'prof_talitha', date: '2099-01-10', startTime: '12:00', endTime: '13:00', title: 'Almoço' };

const waitlistEntry: WaitlistEntry = {
  id: 'wait_1',
  clientName: 'Cliente',
  clientPhone: '41999990000',
  serviceId: 'srv_1',
  serviceName: 'Serviço',
  professionalId: 'prof_talitha',
  preferredDates: ['2099-01-10'],
  status: 'aguardando',
  createdAt: '2026-11-04'
};

const professional: Professional = { ...INITIAL_PROFESSIONALS[0], name: 'Nome novo' };
const settings: CoworkingSettings = { ...INITIAL_SETTINGS };

const pushedKinds = () => push.mock.calls.map(call => call[0]);
const pushesOf = (kind: string) => push.mock.calls.filter(call => call[0] === kind);

describe('StorageService → nuvem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMemoryStorage();
  });

  describe('admin logada', () => {
    beforeEach(() => StorageService.setCurrentUser(ADMIN));

    it("savePaymentRecord(p) → push('payments', p, admin)", () => {
      StorageService.savePaymentRecord(payment);
      expect(push).toHaveBeenCalledWith('payments', payment, ADMIN_SYNC);
      expect(StorageService.getPaymentRecords()).toEqual([payment]);
    });

    it('saveScheduleBlock e saveWaitlistEntry enviam blocks e waitlist', () => {
      StorageService.saveScheduleBlock(block);
      StorageService.saveWaitlistEntry(waitlistEntry);
      expect(push).toHaveBeenCalledWith('blocks', block, ADMIN_SYNC);
      expect(push).toHaveBeenCalledWith('waitlist', waitlistEntry, ADMIN_SYNC);
    });

    it("deleteScheduleBlock('blk_1') → removeBlock('blk_1', admin)", () => {
      StorageService.saveScheduleBlock(block);
      StorageService.deleteScheduleBlock('blk_1');
      expect(removeBlock).toHaveBeenCalledWith('blk_1', ADMIN_SYNC);
      expect(StorageService.getScheduleBlocks()).toEqual([]);
    });

    it('saveSettings envia a configuração', () => {
      StorageService.saveSettings(settings);
      expect(push).toHaveBeenCalledWith('settings', settings, ADMIN_SYNC);
    });

    it('addAuditLog envia o log com a admin como autora', () => {
      StorageService.addAuditLog('TESTE', 'alvo', 'detalhe');
      const [kind, log, user] = pushesOf('logs')[0];
      expect(kind).toBe('logs');
      expect(log).toMatchObject({ action: 'TESTE', userId: 'u_admin', userRole: 'admin' });
      expect(user).toEqual(ADMIN_SYNC);
    });

    it('saveProfessional(p) → nenhum envio (nem profissional nem log)', () => {
      StorageService.saveProfessional(professional);
      expect(push).not.toHaveBeenCalled();
      expect(StorageService.getProfessionalById(professional.id)?.name).toBe('Nome novo');
    });

    it("publishProfessional(p) → push('professionals', p, admin)", () => {
      StorageService.publishProfessional(professional);
      expect(push).toHaveBeenCalledWith('professionals', professional, ADMIN_SYNC);
      expect(StorageService.getProfessionalById(professional.id)?.name).toBe('Nome novo');
    });

    it('getProfessionals não envia nada', () => {
      StorageService.getProfessionals();
      expect(push).not.toHaveBeenCalled();
    });

    it('runLocalOnly (regravação do CoworkingContext) não envia nada', () => {
      StorageService.runLocalOnly(() => {
        StorageService.saveProfessional(professional);
        StorageService.addAuditLog('TESTE', 'alvo', 'detalhe');
      });
      expect(push).not.toHaveBeenCalled();
      StorageService.addAuditLog('DEPOIS', 'alvo', 'detalhe');
      expect(pushedKinds()).toEqual(['logs']);
    });
  });

  describe('profissional logada', () => {
    beforeEach(() => StorageService.setCurrentUser(PROF));

    it('pagamento vai com o usuário dela (id, papel e professionalId)', () => {
      StorageService.savePaymentRecord(payment);
      expect(push).toHaveBeenCalledWith('payments', payment, PROF_SYNC);
    });

    it('saveSettings fica só no aparelho (o log dela sobe)', () => {
      StorageService.saveSettings(settings);
      expect(pushesOf('settings')).toHaveLength(0);
      expect(pushedKinds()).toEqual(['logs']);
    });

    it("publishProfessional(p) → push('professionals', p, profissional)", () => {
      StorageService.publishProfessional(professional);
      expect(push).toHaveBeenCalledWith('professionals', professional, PROF_SYNC);
    });
  });

  describe('cliente ou visitante', () => {
    it('cliente logada: savePaymentRecord → push não chamado', () => {
      StorageService.setCurrentUser(CLIENT);
      StorageService.savePaymentRecord(payment);
      StorageService.saveScheduleBlock(block);
      StorageService.deleteScheduleBlock('blk_1');
      StorageService.saveWaitlistEntry(waitlistEntry);
      StorageService.saveSettings(settings);
      StorageService.publishProfessional(professional);
      expect(push).not.toHaveBeenCalled();
      expect(removeBlock).not.toHaveBeenCalled();
    });

    it('depois do logout (visitante) nada é enviado', () => {
      StorageService.setCurrentUser(ADMIN);
      StorageService.logout();
      StorageService.savePaymentRecord(payment);
      expect(push).not.toHaveBeenCalled();
    });
  });

  it('notifyExternalChange avisa quem assina subscribeStorage', () => {
    const listener = vi.fn();
    const unsubscribe = StorageService.subscribeStorage(listener);
    StorageService.notifyExternalChange();
    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
