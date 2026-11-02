// Prazos de manutenção por serviço. Sem imports: também é usado pelo servidor (api/).
export const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Prazos de manutenção definidos pelas profissionais da LEV (em dias).
// A ordem importa: a primeira regra que bater com o nome do serviço vale.
export const MAINTENANCE_RULES: { match: (name: string) => boolean; days: number; label: string }[] = [
  { match: n => n.includes('brow lamination'), days: 45, label: 'Brow Lamination' },
  { match: n => n.includes('design de sobrancelha'), days: 20, label: 'Design de Sobrancelhas' },
  { match: n => n.includes('alongamento'), days: 20, label: 'Alongamento' },
  { match: n => n.includes('esmaltacao em gel') || n.includes('manutencao em gel'), days: 15, label: 'Esmaltação em Gel' },
  { match: n => n.includes('pedicure tradicional') || n.includes('pe tradicional'), days: 15, label: 'Pé Tradicional' },
  { match: n => n.includes('mao tradicional') || n.includes('manicure tradicional'), days: 7, label: 'Mão Tradicional' }
];

export const maintenanceDaysFor = (serviceName: string): number | undefined =>
  MAINTENANCE_RULES.find(rule => rule.match(normalize(serviceName)))?.days;
