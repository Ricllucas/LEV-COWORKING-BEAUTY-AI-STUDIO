export const DEFAULT_SALON_ID = 'lev';

const SALON_ID_PATTERN = /^[a-z0-9-]{2,40}$/;

export function assertSalonId(id: string): string {
  if (typeof id !== 'string' || !SALON_ID_PATTERN.test(id)) {
    throw new Error('salon_id inválido');
  }
  return id;
}

export function salonFilter(id: string): string {
  return `salon_id=eq.${assertSalonId(id)}`;
}

export function withSalon<T extends object>(row: T, id: string): T & { salon_id: string } {
  return { ...row, salon_id: assertSalonId(id) };
}
