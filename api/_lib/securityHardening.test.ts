import { afterEach, describe, expect, it, vi } from 'vitest';
import { countPendingForPhone, phoneKey } from './appointmentService';
import { publicErrorMessage } from './security';
import { verifyTurnstile } from './turnstile';
import { validateBlock } from '../calendar/block';

describe('limite de pedidos por telefone', () => {
  it('reconhece o mesmo celular com ou sem DDI e máscara', () => {
    expect(phoneKey('+55 (41) 99999-1111')).toBe('41999991111');
    expect(phoneKey('41999991111')).toBe('41999991111');
  });

  it('conta só pedidos aguardando confirmação do mesmo telefone', () => {
    const list = [
      { clientPhone: '(41) 99999-1111', status: 'aguardando_confirmacao' },
      { clientPhone: '5541999991111', status: 'aguardando_confirmacao' },
      { clientPhone: '41999991111', status: 'confirmado' },
      { clientPhone: '41988887777', status: 'aguardando_confirmacao' }
    ];
    expect(countPendingForPhone(list, '41 99999-1111')).toBe(2);
    expect(countPendingForPhone(list, '41988887777')).toBe(1);
  });
});

describe('mensagens de erro', () => {
  it('mostra erros pensados para a usuária e esconde erros internos', () => {
    const userError = Object.assign(new Error('Data inválida.'), { status: 400 });
    expect(publicErrorMessage(userError, 'Falhou.')).toBe('Data inválida.');
    expect(publicErrorMessage(new Error('Supabase recusou appointments (500)'), 'Falhou.')).toBe('Falhou.');
  });
});

describe('verificação anti-robô', () => {
  afterEach(() => { delete process.env.TURNSTILE_SECRET_KEY; vi.unstubAllGlobals(); });

  it('fica desligada sem a chave secreta', async () => {
    expect(await verifyTurnstile(undefined)).toBe(true);
  });

  it('recusa sem token e aceita só o que a Cloudflare aprovar', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'segredo';
    expect(await verifyTurnstile('')).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));
    expect(await verifyTurnstile('token')).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ success: true }) }));
    expect(await verifyTurnstile('token')).toBe(true);
  });
});

describe('bloqueio de agenda', () => {
  const ok = { professionalId: 'prof_nayara', date: '2026-11-05', startTime: '12:00', endTime: '13:00', type: 'pausa' };
  it('aceita um bloqueio válido', () => expect(validateBlock(ok)).toBeNull());
  it('recusa dados inválidos', () => {
    expect(validateBlock({ ...ok, professionalId: 'prof_x' })).not.toBeNull();
    expect(validateBlock({ ...ok, date: '05/11/2026' })).not.toBeNull();
    expect(validateBlock({ ...ok, startTime: '25:00' })).not.toBeNull();
    expect(validateBlock({ ...ok, endTime: '11:00' })).not.toBeNull();
    expect(validateBlock({ ...ok, type: 'qualquer' })).not.toBeNull();
  });
});
