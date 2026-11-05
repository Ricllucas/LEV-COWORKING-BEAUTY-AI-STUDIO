import type { PaymentMethod, PaymentStatus } from '../../src/types/index.js';

// Campos de pagamento que a equipe pode gravar no atendimento pela rota
// /api/calendar/appointment (lançamento de pagamento na agenda).

const PAYMENT_STATUSES = ['nao_informado', 'pendente', 'parcial', 'pago', 'estornado', 'isento'] as const satisfies readonly PaymentStatus[];
const PAYMENT_METHODS = ['pix', 'dinheiro', 'cartao_debito', 'cartao_credito', 'transferencia', 'cortesia', 'outro'] as const satisfies readonly PaymentMethod[];
const MAX_PAYMENT_DATE_LENGTH = 20;

export type AppointmentPaymentFields = {
  depositPaid?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
};

// `error` preenchido → pedido inválido (400). Sem `error`, `fields` traz o que gravar.
export type PaymentFieldsResult = { fields: AppointmentPaymentFields; error?: string };

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  typeof value === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(value);

const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);

// Lê só os campos de pagamento presentes em `changes`. Campo ausente fica de fora
// (o atendimento mantém o valor atual). Status ou forma de pagamento fora da
// lista → erro (a rota responde 400). Valor ou data inválidos são ignorados,
// como já acontece com os outros números da rota.
export const parsePaymentFields = (changes: unknown): PaymentFieldsResult => {
  if (typeof changes !== 'object' || changes === null) return { fields: {} };
  const input = changes as Record<string, unknown>;
  const fields: AppointmentPaymentFields = {};

  if (input.paymentStatus !== undefined) {
    if (!isPaymentStatus(input.paymentStatus)) return { fields: {}, error: 'Status de pagamento inválido.' };
    fields.paymentStatus = input.paymentStatus;
  }
  if (input.paymentMethod !== undefined) {
    if (!isPaymentMethod(input.paymentMethod)) return { fields: {}, error: 'Forma de pagamento inválida.' };
    fields.paymentMethod = input.paymentMethod;
  }
  if (typeof input.depositPaid === 'number' && Number.isFinite(input.depositPaid) && input.depositPaid >= 0) {
    fields.depositPaid = input.depositPaid;
  }
  if (typeof input.paymentDate === 'string') {
    const paymentDate = input.paymentDate.trim();
    if (paymentDate && paymentDate.length <= MAX_PAYMENT_DATE_LENGTH) fields.paymentDate = paymentDate;
  }
  return { fields };
};
