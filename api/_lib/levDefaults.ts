// Dados de fábrica da LEV usados pelo servidor quando o banco não responde ou
// ainda não tem a informação. Único lugar do api/ com dados da LEV (fora dos testes).
import type { BookingService } from './bookingCatalog.js';

export const LEV_SALON_ID = 'lev';

// Número geral (recepção) da LEV: nunca vale como contato direto de uma profissional
export const LEV_SALON_MAIN_WHATSAPP = '5541984979940';

export const LEV_SALON = { name: 'LEV Coworking Beauty', shortName: 'LEV' };

export type LevProfessional = {
  id: string;
  name: string;
  whatsapp: string;
  googleColorId: string;
  // Variável da Vercel com a agenda do Google da profissional (antes da tabela professional_calendars)
  calendarEnv: string;
};

export const LEV_PROFESSIONALS: LevProfessional[] = [
  { id: 'prof_elisangela', name: 'Elisangela', whatsapp: '5541992461203', googleColorId: '5', calendarEnv: 'GOOGLE_CALENDAR_ID_ELISANGELA' }, // Banana (Amarelo Ouro)
  { id: 'prof_talitha', name: 'Talitha', whatsapp: '5541999983228', googleColorId: '6', calendarEnv: 'GOOGLE_CALENDAR_ID_TALITHA' }, // Tangerine (Laranja)
  { id: 'prof_nayara', name: 'Nayara', whatsapp: '5541996556742', googleColorId: '8', calendarEnv: 'GOOGLE_CALENDAR_ID_NAYARA' } // Graphite (Marrom)
];

export const LEV_BOOKING_SERVICES: BookingService[] = [
  ['srv_tal_10','Extensão de Cílios','prof_talitha','Talitha',90,170],
  ['srv_tal_11','Manutenção de Cílios','prof_talitha','Talitha',60,120],
  ['srv_tal_12','Lash Lifting','prof_talitha','Talitha',90,150],
  ['srv_tal_13','Design de Sobrancelhas com Henna','prof_talitha','Talitha',30,65],
  ['srv_tal_14','Depilação de Buço','prof_talitha','Talitha',15,35],
  ['srv_eli_1','Mão Tradicional','prof_elisangela','Elisangela',40,35],
  ['srv_eli_2','Pedicure Tradicional','prof_elisangela','Elisangela',45,45],
  ['srv_eli_5','Mão — Esmaltação em Gel','prof_elisangela','Elisangela',50,55],
  ['srv_eli_6','Pé — Esmaltação em Gel','prof_elisangela','Elisangela',60,80],
  ['srv_eli_7','SPA dos Pés','prof_elisangela','Elisangela',60,80],
  ['srv_1793236813426','SPA dos Pés','prof_elisangela','Elisangela',60,80],
  ['srv_tal_1','Maquiagem Social','prof_talitha','Talitha',90,170],['srv_tal_2','Penteado','prof_talitha','Talitha',90,170],['srv_tal_3','Produção Beauty','prof_talitha','Talitha',150,300],['srv_tal_4','Baby Liss','prof_talitha','Talitha',60,140],['srv_tal_5','Penteado para Cabelos Cacheados','prof_talitha','Talitha',120,200],['srv_tal_6','Produção Noivas','prof_talitha','Talitha',180,0],['srv_tal_7','Design de Sobrancelhas','prof_talitha','Talitha',40,45],['srv_tal_8','Brow Lamination','prof_talitha','Talitha',60,130,2026110301],['srv_tal_9','Microblading','prof_talitha','Talitha',120,450],
['srv_nay_1','Aplicação de Alongamento','prof_nayara','Nayara',120,160,2026110301],['srv_nay_2','Manutenção em Gel','prof_nayara','Nayara',120,145,2026110301],['srv_nay_3','Banho de Gel','prof_nayara','Nayara',90,90],['srv_nay_4','Esmaltação em Gel','prof_nayara','Nayara',60,55],['srv_nay_5','Blindagem','prof_nayara','Nayara',60,70],['srv_nay_6','Cuticulagem','prof_nayara','Nayara',60,35]
].map(([id,name,professionalId,professionalName,duration,price,catalogVersion]) => ({ id, name, professionalId, professionalName, duration, price, ...(catalogVersion ? { catalogVersion } : {}) } as BookingService));
