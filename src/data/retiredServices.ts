// Serviços retirados do catálogo. Ficam ocultos no site e são recusados pelo
// servidor mesmo que ainda exista um registro antigo no catálogo online.
// Sem imports: também é usado pelo servidor (api/).
export const RETIRED_SERVICE_IDS: ReadonlySet<string> = new Set([
  'srv_eli_3',
  'srv_eli_4',
  'srv_eli_8',          // Combo Pé Tradicional + SPA dos Pés (retirado em 03/11/2026)
  'srv_1787094380315'   // Designer de Sobrancelhas com Henna da Elisangela (retirado em 03/11/2026)
]);
