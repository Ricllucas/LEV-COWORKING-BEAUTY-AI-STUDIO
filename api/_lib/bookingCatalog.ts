export type BookingService = { id: string; name: string; professionalId: string; professionalName: string; duration: number; price: number };
export const PROFESSIONALS = [{ id: 'prof_elisangela', name: 'Elisangela' }, { id: 'prof_talitha', name: 'Talitha' }, { id: 'prof_nayara', name: 'Nayara' }];
export const BOOKING_SERVICES: BookingService[] = [
  ['srv_eli_1','Mão Tradicional','prof_elisangela','Elisangela',40,35],
  ['srv_eli_2','Pedicure Tradicional','prof_elisangela','Elisangela',45,45],
  ['srv_eli_5','Mão — Esmaltação em Gel','prof_elisangela','Elisangela',50,55],
  ['srv_eli_6','Pé — Esmaltação em Gel','prof_elisangela','Elisangela',60,80],
  ['srv_eli_7','SPA dos Pés','prof_elisangela','Elisangela',60,65],
  ['srv_eli_8','Combo Pé Tradicional + SPA dos Pés','prof_elisangela','Elisangela',105,105],
  ['srv_tal_1','Maquiagem Social','prof_talitha','Talitha',90,170],['srv_tal_2','Penteado','prof_talitha','Talitha',90,170],['srv_tal_3','Produção Beauty','prof_talitha','Talitha',150,300],['srv_tal_4','Baby Liss','prof_talitha','Talitha',60,140],['srv_tal_5','Penteado para Cabelos Cacheados','prof_talitha','Talitha',120,200],['srv_tal_6','Produção Noivas','prof_talitha','Talitha',180,0],['srv_tal_7','Design de Sobrancelhas','prof_talitha','Talitha',40,45],['srv_tal_8','Brow Lamination','prof_talitha','Talitha',60,200],['srv_tal_9','Microblading','prof_talitha','Talitha',120,450],
['srv_nay_1','Alongamento','prof_nayara','Nayara',150,130],['srv_nay_2','Manutenção em Gel','prof_nayara','Nayara',120,100],['srv_nay_3','Banho de Gel','prof_nayara','Nayara',90,90],['srv_nay_4','Esmaltação em Gel','prof_nayara','Nayara',60,55],['srv_nay_5','Blindagem','prof_nayara','Nayara',60,70],['srv_nay_6','Cuticulagem','prof_nayara','Nayara',60,35]
].map(([id,name,professionalId,professionalName,duration,price]) => ({ id, name, professionalId, professionalName, duration, price } as BookingService));
export const servicesFor = (professionalId: string) => BOOKING_SERVICES.filter(service => service.professionalId === professionalId);

