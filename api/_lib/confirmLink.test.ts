import { describe, expect, it } from 'vitest';
import { appointmentStartEpoch, createConfirmToken, verifyConfirmToken } from './confirmLink';

const secret = 'segredo-de-teste';
const start = appointmentStartEpoch('2026-11-05', '10:00');
const before = new Date('2026-11-04T12:00:00-03:00').getTime();

describe('link de confirmação da profissional', () => {
  it('aceita o token assinado antes do horário', () => {
    const token = createConfirmToken('apt_123e4567-e89b-12d3-a456-426614174000', start, secret)!;
    expect(verifyConfirmToken(token, before, secret)).toEqual({ ok: true, appointmentId: 'apt_123e4567-e89b-12d3-a456-426614174000' });
  });

  it('expira quando o horário do atendimento chega', () => {
    const token = createConfirmToken('apt_abc', start, secret)!;
    expect(verifyConfirmToken(token, start * 1000, secret)).toEqual({ ok: false, reason: 'expired' });
  });

  it('recusa token adulterado, de outro agendamento ou com outra chave', () => {
    const token = createConfirmToken('apt_abc', start, secret)!;
    const [, exp, sig] = token.split('.');
    expect(verifyConfirmToken(`apt_outro.${exp}.${sig}`, before, secret).ok).toBe(false);
    expect(verifyConfirmToken(`apt_abc.${Number(exp) + 9999}.${sig}`, before, secret).ok).toBe(false);
    expect(verifyConfirmToken(token, before, 'outra-chave').ok).toBe(false);
    expect(verifyConfirmToken('lixo', before, secret).ok).toBe(false);
    expect(verifyConfirmToken(undefined, before, secret).ok).toBe(false);
  });

  it('sem chave configurada não gera nem aceita links', () => {
    expect(createConfirmToken('apt_abc', start, '')).toBeNull();
    expect(verifyConfirmToken('a.1.b', before, '').ok).toBe(false);
  });
});
