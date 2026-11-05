import { Professional } from '../types';

// Dados pessoais sensíveis da profissional: nunca vão para a tabela pública.
export const PRIVATE_PROFESSIONAL_FIELDS = ['meiName', 'cnpjCpf', 'bankName', 'email'] as const;

type PrivateField = typeof PRIVATE_PROFESSIONAL_FIELDS[number];
export type ProfessionalPublic = Omit<Professional, PrivateField>;
export type ProfessionalPrivate = Pick<Professional, PrivateField>;

export function splitProfessional(p: Professional): { publicPart: ProfessionalPublic; privatePart: ProfessionalPrivate } {
  const { meiName, cnpjCpf, bankName, email, ...publicPart } = p;
  return { publicPart, privatePart: { meiName, cnpjCpf, bankName, email } };
}

// Campos privados ausentes viram ''. Campos privados que venham por engano na
// parte pública são sempre sobrescritos pela parte privada.
export function joinProfessional(publicPart: ProfessionalPublic, privatePart?: Partial<ProfessionalPrivate>): Professional {
  return {
    ...publicPart,
    meiName: privatePart?.meiName ?? '',
    cnpjCpf: privatePart?.cnpjCpf ?? '',
    bankName: privatePart?.bankName ?? '',
    email: privatePart?.email ?? ''
  };
}
