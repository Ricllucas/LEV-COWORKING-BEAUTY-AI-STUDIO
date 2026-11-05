import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentRecord, Professional } from '../types';

vi.mock('./cloudSalonData', async importOriginal => {
  const actual = await importOriginal<typeof import('./cloudSalonData')>();
  return {
    ...actual,
    CloudSalonData: {
      isConfigured: vi.fn(() => true),
      list: vi.fn(async () => []),
      upsert: vi.fn(async () => undefined),
      remove: vi.fn(async () => undefined)
    }
  };
});

import { CloudSalonData, CloudTableMissingError, SalonRow, SalonTable } from './cloudSalonData';
import { SalonDataSync } from './salonDataSync';

const PAYMENTS_KEY = 'lev_coworking_payments_v1';
const PROFESSIONALS_KEY = 'lev_coworking_professionals_v10';
const SETTINGS_KEY = 'lev_coworking_settings_v1';
const LOGS_KEY = 'lev_coworking_logs_v1';
const OUTBOX_KEY = 'lev_cloud_outbox_v1';

const payment = (id: string, professionalId = 'prof_x'): PaymentRecord => ({
  id,
  appointmentId: `apt_${id}`,
  professionalId,
  clientId: 'cli_1',
  clientName: 'Cliente',
  amount: 50,
  method: 'pix',
  type: 'integral',
  paidAt: '2026-11-04',
  receivedBy: 'admin'
} as PaymentRecord);

const professional = (id: string): Professional => ({
  id,
  name: id,
  title: 't',
  meiName: `mei ${id}`,
  cnpjCpf: `cnpj ${id}`,
  pixKey: 'pix',
  bankName: 'banco',
  phone: '',
  whatsapp: '',
  email: `${id}@lev.com`,
  bio: '',
  avatarUrl: '',
  categories: [],
  color: '#000',
  workingHours: {},
  slotBufferMinutes: 0,
  offDays: [],
  vacations: []
});

const httpError = (status: number) => Object.assign(new Error(`erro ${status}`), { status });

const list = vi.mocked(CloudSalonData.list);
const upsert = vi.mocked(CloudSalonData.upsert);
const remove = vi.mocked(CloudSalonData.remove);
const isConfigured = vi.mocked(CloudSalonData.isConfigured);

// Responde `list` por tabela; tabelas fora do mapa voltam vazias.
const cloudTables = (tables: Partial<Record<SalonTable, SalonRow<unknown>[]>>) => {
  list.mockImplementation(async (table: SalonTable) => (tables[table] ?? []) as SalonRow<never>[]);
};

const paymentRows = (...ids: string[]): SalonRow<unknown>[] =>
  ids.map(id => ({ id, professionalId: 'prof_x', payload: payment(id) }));

const stored = <T,>(key: string): T => JSON.parse(localStorage.getItem(key) || 'null') as T;
const storedIds = (key: string) => stored<{ id: string }[]>(key).map(item => item.id).sort();
const tablesListed = () => list.mock.calls.map(call => call[0]);
const upsertsTo = (table: SalonTable) => upsert.mock.calls.filter(call => call[0] === table);

// O setup global troca o localStorage por vi.fn() vazios; aqui ele vira memória de verdade.
const memory = new Map<string, string>();
const useMemoryStorage = () => {
  memory.clear();
  vi.mocked(localStorage.getItem).mockImplementation((key: string) => memory.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => { memory.set(key, String(value)); });
  vi.mocked(localStorage.removeItem).mockImplementation((key: string) => { memory.delete(key); });
  vi.mocked(localStorage.clear).mockImplementation(() => memory.clear());
};
const snapshot = () => Object.fromEntries(memory);

describe('SalonDataSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMemoryStorage();
    isConfigured.mockReturnValue(true);
    list.mockImplementation(async () => []);
    upsert.mockImplementation(async () => undefined);
    remove.mockImplementation(async () => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  describe('push', () => {
    it('nuvem fora do ar → pagamento vai para a fila', async () => {
      upsert.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(SalonDataSync.push('payments', payment('pay_1'), 'admin')).resolves.toBeUndefined();
      const outbox = stored<{ kind: string; op: string; item: { id: string }; role: string }[]>(OUTBOX_KEY);
      expect(outbox).toHaveLength(1);
      expect(outbox[0]).toMatchObject({ kind: 'payments', op: 'upsert', role: 'admin', item: { id: 'pay_1' } });
    });

    it('erro 500 também vai para a fila', async () => {
      upsert.mockRejectedValue(httpError(500));
      await SalonDataSync.push('payments', payment('pay_1'), 'admin');
      expect(stored<unknown[]>(OUTBOX_KEY)).toHaveLength(1);
    });

    it('mesmo item enviado duas vezes com falha fica uma vez só na fila', async () => {
      upsert.mockRejectedValue(new TypeError('Failed to fetch'));
      await SalonDataSync.push('payments', payment('pay_1'), 'admin');
      await SalonDataSync.push('payments', { ...payment('pay_1'), amount: 99 }, 'admin');
      const outbox = stored<{ item: PaymentRecord }[]>(OUTBOX_KEY);
      expect(outbox).toHaveLength(1);
      expect(outbox[0].item.amount).toBe(99);
    });

    it('CloudTableMissingError → resolve sem erro e não entra na fila', async () => {
      upsert.mockRejectedValue(new CloudTableMissingError('payments'));
      await expect(SalonDataSync.push('payments', payment('pay_1'), 'admin')).resolves.toBeUndefined();
      expect(localStorage.getItem(OUTBOX_KEY)).toBeNull();
    });

    it('sem configuração → não chama a nuvem nem enfileira', async () => {
      isConfigured.mockReturnValue(false);
      await expect(SalonDataSync.push('payments', payment('pay_1'), 'admin')).resolves.toBeUndefined();
      expect(upsert).not.toHaveBeenCalled();
      expect(localStorage.getItem(OUTBOX_KEY)).toBeNull();
    });

    it('envia com a chave do lançamento e professionalId', async () => {
      await SalonDataSync.push('payments', payment('pay_1', 'prof_y'), 'admin');
      expect(upsert).toHaveBeenCalledWith('payments', [{ id: 'pay_1', professionalId: 'prof_y', payload: payment('pay_1', 'prof_y') }], 'admin');
    });

    it('profissional: parte pública e parte privada vão para tabelas separadas', async () => {
      await SalonDataSync.push('professionals', professional('prof_x'), 'profissional');
      const [publicCall] = upsertsTo('professionals');
      const [privateCall] = upsertsTo('professional_private');
      expect(publicCall[1][0]).toMatchObject({ id: 'prof_x', professionalId: 'prof_x' });
      expect(publicCall[1][0].payload).not.toHaveProperty('cnpjCpf');
      expect(privateCall[1][0]).toEqual({ id: 'prof_x', professionalId: 'prof_x', payload: { meiName: 'mei prof_x', cnpjCpf: 'cnpj prof_x', bankName: 'banco', email: 'prof_x@lev.com' } });
    });

    it('configuração vai com id "geral"', async () => {
      await SalonDataSync.push('settings', { name: 'LEV' }, 'admin');
      expect(upsert).toHaveBeenCalledWith('salon_settings', [{ id: 'geral', payload: { name: 'LEV' } }], 'admin');
    });

    it('log usa insertOnly e o id da profissional', async () => {
      const log = { id: 'log_1', userId: 'u', userName: 'T', userRole: 'profissional', action: 'A', target: 'T', details: '', timestamp: '2026-11-04 10:00' };
      await SalonDataSync.push('logs', log, 'profissional', 'prof_x');
      expect(upsert).toHaveBeenCalledWith('audit_logs', [{ id: 'log_1', professionalId: 'prof_x', payload: log }], 'profissional', { insertOnly: true });
    });

    it('removeBlock com rede fora → exclusão vai para a fila', async () => {
      remove.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(SalonDataSync.removeBlock('blk_1', 'admin')).resolves.toBeUndefined();
      expect(stored<unknown[]>(OUTBOX_KEY)).toEqual([{ kind: 'blocks', op: 'delete', item: { id: 'blk_1' }, role: 'admin' }]);
    });
  });

  describe('pull', () => {
    it('sem configuração → resolve false sem chamar a nuvem', async () => {
      isConfigured.mockReturnValue(false);
      await expect(SalonDataSync.pull('admin')).resolves.toBe(false);
      expect(list).not.toHaveBeenCalled();
    });

    it('sem internet → resolve sem erro e não mexe no aparelho', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a')]));
      list.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(SalonDataSync.pull('admin')).resolves.toBe(false);
      expect(storedIds(PAYMENTS_KEY)).toEqual(['pay_a']);
    });

    it('fila com 1 pagamento e nuvem no ar → reenvia e esvazia a fila', async () => {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify([{ kind: 'payments', op: 'upsert', item: payment('pay_1'), role: 'admin' }]));
      await SalonDataSync.pull('admin');
      expect(upsert).toHaveBeenCalledWith('payments', [{ id: 'pay_1', professionalId: 'prof_x', payload: payment('pay_1') }], 'admin');
      expect(stored<unknown[]>(OUTBOX_KEY)).toEqual([]);
    });

    it('fila que continua falhando: item fica na fila e aparece no aparelho', async () => {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify([{ kind: 'payments', op: 'upsert', item: payment('pay_1'), role: 'admin' }]));
      localStorage.setItem('lev_cloud_seeded_payments_v1', '1');
      upsert.mockRejectedValue(new TypeError('Failed to fetch'));
      cloudTables({ payments: paymentRows('pay_b') });
      await SalonDataSync.pull('admin');
      expect(stored<unknown[]>(OUTBOX_KEY)).toHaveLength(1);
      expect(storedIds(PAYMENTS_KEY)).toEqual(['pay_1', 'pay_b']);
    });

    it('exclusão pendente na fila tira o bloqueio do aparelho', async () => {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify([{ kind: 'blocks', op: 'delete', item: { id: 'blk_1' }, role: 'admin' }]));
      localStorage.setItem('lev_cloud_seeded_blocks_v1', '1');
      remove.mockRejectedValue(new TypeError('Failed to fetch'));
      cloudTables({ schedule_blocks: [{ id: 'blk_1', professionalId: 'prof_x', payload: { id: 'blk_1', professionalId: 'prof_x' } }] });
      await SalonDataSync.pull('admin');
      expect(stored<unknown[]>('lev_coworking_blocks_v1')).toEqual([]);
    });

    it('primeira subida: sobe só o que falta na nuvem e o aparelho fica com tudo', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a'), payment('pay_b')]));
      cloudTables({ payments: paymentRows('pay_b', 'pay_c') });
      const changed = await SalonDataSync.pull('admin');
      const calls = upsertsTo('payments');
      expect(calls).toHaveLength(1);
      expect(calls[0][1].map(row => row.id)).toEqual(['pay_a']);
      expect(storedIds(PAYMENTS_KEY)).toEqual(['pay_a', 'pay_b', 'pay_c']);
      expect(localStorage.getItem('lev_cloud_seeded_payments_v1')).not.toBeNull();
      expect(changed).toBe(true);
    });

    it('já com primeira subida feita e sem fila: a nuvem manda', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a'), payment('pay_b')]));
      localStorage.setItem('lev_cloud_seeded_payments_v1', '1');
      cloudTables({ payments: paymentRows('pay_b', 'pay_c') });
      await SalonDataSync.pull('admin');
      expect(upsertsTo('payments')).toHaveLength(0);
      expect(storedIds(PAYMENTS_KEY)).toEqual(['pay_b', 'pay_c']);
    });

    it('primeira subida que falha por rede → aparelho intacto e sem marcar seeded', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a')]));
      cloudTables({ payments: paymentRows('pay_c') });
      upsert.mockRejectedValue(new TypeError('Failed to fetch'));
      await SalonDataSync.pull('admin');
      expect(storedIds(PAYMENTS_KEY)).toEqual(['pay_a']);
      expect(localStorage.getItem('lev_cloud_seeded_payments_v1')).toBeNull();
      expect(localStorage.getItem(OUTBOX_KEY)).toBeNull();
    });

    it('sem login → não lê payments, blocks, waitlist, logs nem a parte privada', async () => {
      await SalonDataSync.pull();
      const listed = tablesListed();
      for (const table of ['payments', 'schedule_blocks', 'waitlist', 'audit_logs', 'professional_private']) {
        expect(listed).not.toContain(table);
      }
      expect(listed).toContain('salon_settings');
      expect(listed).toContain('professionals');
      expect(upsert).not.toHaveBeenCalled();
    });

    it('profissional não lê os logs; admin lê', async () => {
      await SalonDataSync.pull('profissional', 'prof_x');
      expect(tablesListed()).not.toContain('audit_logs');
      expect(tablesListed()).toContain('payments');
      list.mockClear();
      await SalonDataSync.pull('admin');
      expect(tablesListed()).toContain('audit_logs');
    });

    it('CloudTableMissingError → aparelho igual ao de antes', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a')]));
      localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify([professional('prof_x')]));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ name: 'LEV' }));
      const before = snapshot();
      list.mockImplementation(async (table: SalonTable) => { throw new CloudTableMissingError(table); });
      await expect(SalonDataSync.pull('admin')).resolves.toBe(false);
      expect(snapshot()).toEqual(before);
      expect(upsert).not.toHaveBeenCalled();
    });

    it('profissional: subida recusada com 403 é descartada e não entra na fila', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a', 'prof_x')]));
      upsert.mockRejectedValue(httpError(403));
      await expect(SalonDataSync.pull('profissional', 'prof_x')).resolves.toBeTypeOf('boolean');
      expect(upsertsTo('payments')).toHaveLength(1);
      expect(localStorage.getItem(OUTBOX_KEY)).toBeNull();
      expect(localStorage.getItem('lev_cloud_seeded_payments_v1')).not.toBeNull();
    });

    it('profissional: primeira subida envia só os próprios pagamentos', async () => {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([payment('pay_a', 'prof_x'), payment('pay_b', 'prof_y')]));
      await SalonDataSync.pull('profissional', 'prof_x');
      const calls = upsertsTo('payments');
      expect(calls).toHaveLength(1);
      expect(calls[0][1].map(row => row.id)).toEqual(['pay_a']);
    });

    it('profissionais: junta a parte privada; sem login os dados privados não ficam no aparelho', async () => {
      const prof = professional('prof_x');
      const { meiName, cnpjCpf, bankName, email, ...publicPart } = prof;
      cloudTables({
        professionals: [{ id: 'prof_x', professionalId: 'prof_x', payload: publicPart }],
        professional_private: [{ id: 'prof_x', professionalId: 'prof_x', payload: { meiName, cnpjCpf, bankName, email } }]
      });
      localStorage.setItem('lev_cloud_seeded_professionals_v1', '1');
      await SalonDataSync.pull('admin');
      expect(stored<Professional[]>(PROFESSIONALS_KEY)).toEqual([prof]);
      await SalonDataSync.pull();
      expect(stored<Professional[]>(PROFESSIONALS_KEY)[0].cnpjCpf).toBe('');
    });

    it('profissionais: nuvem vazia não apaga a lista do aparelho de quem não está logada', async () => {
      localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify([professional('prof_x')]));
      await SalonDataSync.pull();
      expect(storedIds(PROFESSIONALS_KEY)).toEqual(['prof_x']);
    });

    it('configuração: nuvem sem linha e admin → sobe a do aparelho', async () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ name: 'LEV' }));
      await SalonDataSync.pull('admin');
      expect(upsert).toHaveBeenCalledWith('salon_settings', [{ id: 'geral', payload: { name: 'LEV' } }], 'admin');
      expect(stored(SETTINGS_KEY)).toEqual({ name: 'LEV' });
    });

    it('configuração: nuvem com linha substitui a do aparelho', async () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ name: 'Velha' }));
      cloudTables({ salon_settings: [{ id: 'geral', payload: { name: 'Nova' } }] });
      await expect(SalonDataSync.pull()).resolves.toBe(true);
      expect(stored(SETTINGS_KEY)).toEqual({ name: 'Nova' });
    });

    it('pull sem mudanças devolve false', async () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ name: 'LEV' }));
      cloudTables({ salon_settings: [{ id: 'geral', payload: { name: 'LEV' } }] });
      await expect(SalonDataSync.pull()).resolves.toBe(false);
    });

    it('logs: subida com insertOnly e no máximo 500 no aparelho, mais novos primeiro', async () => {
      const rows = Array.from({ length: 510 }, (_, i) => {
        const id = `log_${String(i).padStart(3, '0')}`;
        return { id, payload: { id, timestamp: `2026-11-04 ${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}` } };
      });
      localStorage.setItem(LOGS_KEY, JSON.stringify([{ id: 'log_local', timestamp: '2026-11-05 00:00' }]));
      cloudTables({ audit_logs: rows });
      await SalonDataSync.pull('admin');
      const calls = upsertsTo('audit_logs');
      expect(calls).toHaveLength(1);
      expect(calls[0][3]).toEqual({ insertOnly: true });
      const logs = stored<{ id: string }[]>(LOGS_KEY);
      expect(logs).toHaveLength(500);
      expect(logs[0].id).toBe('log_local');
      expect(logs[1].id).toBe('log_509');
    });
  });
});
