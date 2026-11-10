import { assertSalonId, DEFAULT_SALON_ID } from '../../api/_lib/tenant';
import { bootSalonId } from './siteSalon';

// Salão atendido por este site: o que main.tsx descobriu pelo endereço (siteSalon.ts)
// antes de carregar o App. Sem essa etapa (testes), vem de VITE_SALON_ID;
// sem a variável, ou com valor fora do formato, é o salão padrão — nunca derruba o site.
// O filtro aqui no navegador é só comodidade: a proteção de verdade entre
// salões vem do servidor e das regras do banco (RLS por salão, fases 2 e 5).
const resolveSalonId = (raw: unknown): string => {
  if (typeof raw !== 'string' || !raw) return DEFAULT_SALON_ID;
  try {
    return assertSalonId(raw);
  } catch {
    console.warn('VITE_SALON_ID inválido; usando o salão padrão.');
    return DEFAULT_SALON_ID;
  }
};

export const CURRENT_SALON_ID: string = bootSalonId() ?? resolveSalonId(import.meta.env.VITE_SALON_ID);

export const isDefaultSalon = (): boolean => CURRENT_SALON_ID === DEFAULT_SALON_ID;

// Chave do localStorage separada por salão. O salão padrão mantém as chaves
// antigas (`lev_coworking_*`) para não perder o que já está nos aparelhos.
export const scopedStorageKey = (key: string, salonId: string = CURRENT_SALON_ID): string =>
  salonId === DEFAULT_SALON_ID ? key : `${salonId}__${key}`;

// Profissionais veem a agenda umas das outras. Na LEV, ligada (decisão da dona,
// 04/11/2026). Na fase 5 vira opção por salão em salon_settings.
export const SHARED_AGENDA: boolean = true;

export { DEFAULT_SALON_ID, salonFilter, withSalon } from '../../api/_lib/tenant';
