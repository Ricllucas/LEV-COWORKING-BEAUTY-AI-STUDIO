import { User } from '../types';

// Dados antigos da LEV usados só pelas correções de aparelhos que já tinham a
// LEV gravada (fotos, Pix, catálogos). Rodam apenas quando o site é da LEV
// (isDefaultSalon()); outro salão nunca vê nada daqui.

export const LEV_OFFICIAL_AVATARS: Readonly<Record<string, string>> = {
  prof_elisangela: '/profiles/elisangela-2026.webp',
  prof_talitha: '/profiles/talitha.webp',
  prof_nayara: '/profiles/nayara-2026.webp'
};

export const LEV_OFFICIAL_PIX_KEYS: Readonly<Record<string, string>> = {
  prof_elisangela: '(41)992461203',
  prof_talitha: '(41)999983228',
  prof_nayara: '61573046000194'
};

// Logo da LEV gravado uma vez nos aparelhos antigos (correção de 05/08/2026).
export const LEV_BRAND_LOGO_URL = '/branding/lev-logo.jpeg';

// Endereço de exemplo antigo que ainda pode estar gravado em aparelhos.
export const LEV_PLACEHOLDER_ADDRESS_HINTS: readonly string[] = ['Rua das Flores', 'São Paulo'];

// Telefones de teste apagados uma vez dos aparelhos (limpeza de 15/08/2026).
export const LEV_TEST_PHONES: readonly string[] = [
  '11998881122',
  '11997773344',
  '11996665566',
  '41991011975'
];

// Ids usados nas correções antigas do catálogo.
export const LEV_ELISANGELA_ID = 'prof_elisangela';
export const LEV_TALITHA_ID = 'prof_talitha';
export const LEV_TALITHA_ADDITION_IDS: readonly string[] = ['srv_tal_10', 'srv_tal_11', 'srv_tal_12', 'srv_tal_13', 'srv_tal_14'];
export const LEV_TALITHA_ADDITIONS_KEY = 'lev_talitha_additions_20260904';

// Usuários de exemplo da LEV (valor inicial da lista de usuários do aparelho).
export const LEV_EXAMPLE_USERS: (User & { password?: string })[] = [
  {
    id: "admin_1",
    name: "Administração LEV",
    email: "admin@levcoworkingbeauty.com.br",
    role: "admin"
  },
  {
    id: "prof_elisangela_user",
    name: "Elisangela",
    email: "elisangela@levcoworkingbeauty.com.br",
    role: "profissional",
    professionalId: "prof_elisangela"
  },
  {
    id: "prof_talitha_user",
    name: "Talitha",
    email: "talithakumbeauty@gmail.com",
    role: "profissional",
    professionalId: "prof_talitha"
  },
  {
    id: "prof_nayara_user",
    name: "Nayara",
    email: "nayara@levcoworkingbeauty.com.br",
    role: "profissional",
    professionalId: "prof_nayara"
  },
  {
    id: "recepcao_1",
    name: "Recepção LEV",
    email: "recepcao@levcoworkingbeauty.com.br",
    role: "recepcao"
  }
];
