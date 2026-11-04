// Salão atendido por este site. Na fase 4 passa a vir do endereço do site.
// O filtro aqui no navegador é só comodidade: a proteção de verdade entre
// salões vem do servidor e das regras do banco (RLS por salão, fases 2 e 5).
export const CURRENT_SALON_ID: string = 'lev';

// Profissionais veem a agenda umas das outras. Na LEV, ligada (decisão da dona,
// 04/11/2026). Na fase 5 vira opção por salão em salon_settings.
export const SHARED_AGENDA: boolean = true;

export { salonFilter, withSalon } from '../../api/_lib/tenant';
