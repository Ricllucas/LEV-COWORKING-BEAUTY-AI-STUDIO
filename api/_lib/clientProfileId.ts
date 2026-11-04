import { DEFAULT_SALON_ID, assertSalonId } from './tenant.js';

// Id da cliente em client_profiles. A LEV mantém o formato antigo (cli_<telefone>)
// para não mudar nenhum id existente; os outros salões levam o salão no id,
// para o mesmo telefone em dois salões não colidir na chave primária.
export const clientProfileId = (salonId: string, phoneDigits: string): string =>
  assertSalonId(salonId) === DEFAULT_SALON_ID ? `cli_${phoneDigits}` : `cli_${salonId}_${phoneDigits}`;
