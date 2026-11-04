// Salão atendido por este site. Na fase 4 passa a vir do endereço do site.
// O filtro aqui no navegador é só comodidade: a proteção de verdade entre
// salões vem do servidor e das regras do banco (RLS por salão, fases 2 e 5).
export const CURRENT_SALON_ID: string = 'lev';

export { salonFilter, withSalon } from '../../api/_lib/tenant';
