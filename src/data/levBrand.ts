// Dados de marca e de equipe que são só da LEV. Nenhum outro salão usa estes
// valores: quem lê daqui confere antes `isDefaultSalon()`.

import type { SalonBrand } from '../types';
import { GOOGLE_REVIEWS, GOOGLE_REVIEWS_SUMMARY, GOOGLE_REVIEWS_URL } from './initialData';
import { LEV_LOGO_DATA_URL } from '../assets/brandImages';

// --- Profissionais ---------------------------------------------------------

// Cor de cada profissional na agenda do painel (bolinha e borda do cartão).
export const LEV_AGENDA_COLORS: Record<string, string> = {
  prof_elisangela: '#d8c7a4',
  prof_talitha: '#b59662',
  prof_nayara: '#a98d7a'
};

// Fundo e texto dos cartões da agenda, como eram antes (tons escuros escolhidos
// à mão para cada profissional).
export const LEV_AGENDA_TONES: Record<string, { background: string; text: string }> = {
  prof_elisangela: { background: '#3a3226', text: '#f8f1e4' },
  prof_talitha: { background: '#352817', text: '#f6ead4' },
  prof_nayara: { background: '#342923', text: '#f5e9e1' }
};

// WhatsApp direto de cada profissional, usado quando o cadastro dela não tem número.
export const LEV_PROFESSIONAL_WHATSAPP: Record<string, string> = {
  prof_nayara: '5541996556742',
  prof_elisangela: '5541992461203',
  prof_talitha: '5541999983228'
};

// Número geral da LEV (recepção). Não serve como contato direto de profissional.
export const LEV_OFFICIAL_WHATSAPP = '5541984979940';

// Profissional que faz a produção de noivas mostrada no portfólio.
export const LEV_BRIDAL_PROFESSIONAL_ID = 'prof_talitha';

// --- Portfólio -------------------------------------------------------------

export type PortfolioWorkCategory = 'Noivas' | 'Maquiagem' | 'Penteados' | 'Unhas' | 'Sobrancelhas' | 'SPA dos pés';

export interface PortfolioWorkItem {
  src: string;
  alt: string;
  category: PortfolioWorkCategory;
  /** When set, `src` is the poster and the tile plays this muted clip. */
  video?: string;
}

export interface PortfolioImage {
  src: string;
  alt: string;
}

const clip = (name: string, alt: string, category: PortfolioWorkCategory): PortfolioWorkItem => ({
  src: `/portfolio/videos/${name}.webp`,
  video: `/portfolio/videos/${name}.mp4`,
  alt,
  category
});

export const LEV_PORTFOLIO = {
  // Trabalhos publicados no Instagram da LEV (@levcoworkingbeauty), da Talitha (@talithakum_beauty)
  // e da Nayara (@studiobynayara). Cada foto ou vídeo aparece uma única vez no site:
  // as que estão nos destaques, nas seções de noivas ou na página inicial não se repetem aqui.
  works: [
    { src: '/portfolio/talitha/noiva-leticia-make.webp', alt: 'Noiva Letícia sendo maquiada', category: 'Noivas' },
    { src: '/portfolio/talitha/make-raffa.webp', alt: 'Maquiagem social com olhos esfumados', category: 'Maquiagem' },
    { src: '/portfolio/talitha/penteado-rabo-ondulado.webp', alt: 'Rabo de cavalo com ondas', category: 'Penteados' },
    { src: '/portfolio/talitha/make-samela.webp', alt: 'Maquiagem elegante com pele luminosa', category: 'Maquiagem' },
    { src: '/portfolio/lev/pes-vermelho-2.webp', alt: 'Pés com esmaltação vermelha', category: 'SPA dos pés' },
    { src: '/portfolio/talitha/noiva-leticia-batom.webp', alt: 'Noiva Letícia finalizando a maquiagem', category: 'Noivas' },
    { src: '/portfolio/talitha/penteado-coque-lateral.webp', alt: 'Coque baixo com torções', category: 'Penteados' },
    { src: '/portfolio/lev/make-beleza-completa.webp', alt: 'Maquiagem e penteado para evento', category: 'Maquiagem' },
    { src: '/portfolio/lev/unhas-antes-depois.webp', alt: 'Antes e depois de um cuidado com as mãos', category: 'Unhas' },
    { src: '/portfolio/talitha/noiva-adri-sorriso.webp', alt: 'Noiva Adri sorrindo', category: 'Noivas' },
    { src: '/portfolio/lev/make-iluminada.webp', alt: 'Maquiagem iluminada com cabelo preso', category: 'Maquiagem' }
  ] as PortfolioWorkItem[],

  // Destaques de cada especialista, conforme o serviço que só ela realiza no catálogo
  // ou a autoria indicada na publicação.
  highlights: {
    prof_elisangela: [
      { src: '/portfolio/lev/unhas-lilas.webp', alt: 'Manicure tradicional com esmaltação lilás', category: 'Unhas' },
      { src: '/portfolio/lev/espaco-spa-pes.webp', alt: 'Cesta preparada para o SPA dos pés', category: 'SPA dos pés' },
      { src: '/portfolio/lev/pes-vermelho.webp', alt: 'Pedicure com esmaltação vermelha', category: 'SPA dos pés' }
    ],
    prof_talitha: [
      { src: '/portfolio/lev/make-fox.webp', alt: 'Maquiagem fox para alongar o olhar', category: 'Maquiagem' },
      { src: '/portfolio/talitha/penteado-coque-baixo.webp', alt: 'Coque baixo com ondas', category: 'Penteados' },
      { src: '/portfolio/talitha/make-jessica.webp', alt: 'Maquiagem com olhos iluminados', category: 'Maquiagem' }
    ],
    prof_nayara: [
      { src: '/portfolio/lev/unhas-nude.webp', alt: 'Alongamento em tom nude', category: 'Unhas' },
      clip('unhas-preto', 'Esmaltação preta clássica', 'Unhas'),
      { src: '/portfolio/lev/unhas-blindagem-azul.webp', alt: 'Blindagem com esmaltação azul', category: 'Unhas' }
    ]
  } as Record<string, PortfolioWorkItem[]>,

  brides: [
    { src: '/portfolio/talitha/noiva-leticia-veu.webp', alt: 'Noiva Letícia com véu', category: 'Noivas' },
    { src: '/portfolio/talitha/noiva-adri-close.webp', alt: 'Noiva Adri', category: 'Noivas' },
    { src: '/portfolio/talitha/noiva-leticia-sorriso.webp', alt: 'Noiva Letícia sorrindo', category: 'Noivas' },
    { src: '/portfolio/talitha/noiva-rayssa.webp', alt: 'Noiva Rayssa com buquê', category: 'Noivas' }
  ] as PortfolioWorkItem[],

  bridalBackstage: [
    { src: '/portfolio/talitha/bastidores-rayssa-penteado.webp', alt: 'Talitha finalizando o penteado da noiva Rayssa', category: 'Noivas' },
    { src: '/portfolio/talitha/bastidores-rayssa-espelho.webp', alt: 'Noiva Rayssa durante a produção', category: 'Noivas' },
    { src: '/portfolio/talitha/noiva-rayssa-retrato.webp', alt: 'Noiva Rayssa pronta', category: 'Noivas' },
    { src: '/portfolio/talitha/noiva-rayssa-alianca.webp', alt: 'Detalhe das mãos e aliança da noiva', category: 'Noivas' }
  ] as PortfolioWorkItem[],

  behindTheScenes: [
    { name: 'inauguracao', title: 'Inauguração da LEV' },
    { name: 'spa-dos-pes', title: 'Ritual do SPA dos pés' },
    { name: 'brow-lamination', title: 'Brow lamination' },
    { name: 'make-rose', title: 'Make rosé iluminada' }
  ].map(reel => ({ title: reel.title, video: `/portfolio/videos/${reel.name}.mp4`, poster: `/portfolio/videos/${reel.name}.webp` })) as Array<{ title: string; video: string; poster: string }>,

  heroImage: { src: '/portfolio/talitha/noiva-adri.webp', alt: 'Noiva produzida pela Talitha no LEV' } as PortfolioImage,
  aboutImage: { src: '/portfolio/lev/equipe-tres-especialistas.webp', alt: 'Elisangela, Talitha e Nayara no LEV Coworking Beauty' } as PortfolioImage,
  bridalImage: { src: '/portfolio/talitha/noiva-rayssa-janela.webp', alt: 'Noiva Rayssa pronta para o grande dia' } as PortfolioImage,

  instagramProfiles: [
    { handle: 'levcoworkingbeauty', label: '@levcoworkingbeauty' },
    { handle: 'talithakum_beauty', label: '@talithakum_beauty' }
  ] as Array<{ handle: string; label: string }>,

  spacePhotos: [
    { url: '/portfolio/lev/fachada.webp', title: 'Nossa fachada' },
    { url: '/portfolio/lev/equipe-inauguracao.webp', title: 'Nossa recepção' }
  ] as Array<{ url: string; title: string }>,

  // Serviços da Talitha mostrados na seção de noivas.
  bridalServiceIds: { makeup: 'srv_tal_1', hairstyle: 'srv_tal_2', bridalProduction: 'srv_tal_6' },
  bridalProfessionalId: LEV_BRIDAL_PROFESSIONAL_ID,
  bridalWhatsAppText: 'Olá, Talitha! Vi o portfólio da LEV e gostaria de um orçamento para Produção Noivas.'
};
// --- Nome nas mensagens --------------------------------------------------

// Nome curto ("seu horário no LEV").
export const LEV_SHORT_NAME = 'LEV';
// Nome completo como as mensagens às clientes escrevem (robô e lembretes do painel).
export const LEV_MESSAGE_NAME = 'LEV Coworking Beauty';
// Nome em maiúsculas usado nos contatos montados pelo site (links de WhatsApp).
export const LEV_CONTACT_NAME = 'LEV COWORKING BEAUTY';

// --- Página pública ------------------------------------------------------

// Marca da LEV na página pública: textos, fotos e cores exatamente como a
// página já mostrava (aprovados pela dona). `shortName` precisa ser 'LEV':
// as mensagens às clientes usam esse nome.
export const LEV_BRAND: SalonBrand = {
  shortName: LEV_SHORT_NAME,
  colors: {
    text: '#3D312A',
    primary: '#8C7249',
    accent: '#A1865B',
    background: '#FCF9F2',
    surface: '#F3EBDD'
  },
  logoUrl: LEV_LOGO_DATA_URL,
  bannerLogoUrl: '/brand/lev-logo-horizontal.webp',
  heroKicker: 'Centro · Curitiba',
  heroTitle: 'Sua Beleza Completa: Unhas, Cílios, Sobrancelhas, Maquiagem & Penteados.',
  heroText: 'Do cuidado impecável com *unhas, cílios e sobrancelhas* à produção completa para momentos especiais, com *maquiagem, penteados e atendimento para noivas*. Viva uma experiência personalizada com nossas especialistas, em ambientes acolhedores, reservados e cuidadosamente preparados para você.',
  highlights: [
    { title: 'Atendimento Exclusivo', desc: 'Cuidado personalizado em cada detalhe' },
    { title: 'Especialistas LEV', desc: '{profissionais}' },
    { title: 'Agendamento Online 24h', desc: 'Agende quando quiser. Atendimentos até as 18h' },
    { title: 'Espaço Glamour', desc: 'Ambiente reservado e aconchegante' }
  ],
  spaceKicker: 'Nosso Espaço',
  spaceTitle: 'Ambientes Individuais, Atendimento com Privacidade',
  spacePhotos: [
    { url: '/spaces/sala-unhas-elisangela.webp', title: 'Sala de Unhas da Elisangela', desc: 'Ambiente próprio de nail design, com privacidade e cuidado' },
    { url: '/spaces/sala-unhas-nayara.webp', title: 'Sala de Unhas da Nayara', desc: 'Ambiente próprio de nail design, com privacidade e cuidado' },
    { url: '/spaces/private-makeup-room.webp?v=real-room-2', title: 'Sala Exclusiva de Maquiagem', desc: 'Atendimento personalizado com Talitha em um ambiente próprio e reservado' },
    { url: '/portfolio/lev/equipe.webp', title: 'Nossa Equipe', desc: 'Elisangela, Talitha e Nayara, especialistas que atendem no LEV' }
  ],
  worksTitle: 'Trabalhos Feitos Aqui na LEV',
  works: [
    { url: '/portfolio/talitha/noiva-leticia-janela.webp', alt: 'Noiva Letícia produzida no LEV' },
    { url: '/portfolio/videos/unhas-macaron-limpo.webp', video: '/portfolio/videos/unhas-macaron-limpo.mp4', alt: 'Unhas Macaron de Amora' },
    { url: '/portfolio/videos/make-penteado.webp', video: '/portfolio/videos/make-penteado.mp4', alt: 'Maquiagem e penteado' },
    { url: '/portfolio/lev/make-fox-2.webp', alt: 'Maquiagem fox' }
  ],
  featureKicker: 'Experiência Exclusiva LEV',
  featureTitle: 'Beleza para *Noivas & Momentos Especiais*',
  featureText: 'Conte com especialistas dedicadas a valorizar sua beleza em cada etapa. Reúna cuidados personalizados e uma produção completa para viver seu momento com tranquilidade, confiança e elegância:',
  featureItems: [
    { title: 'Elisangela — Nail Designer', desc: 'Manicure, pedicure e cuidados personalizados para mãos e pés impecáveis.' },
    { title: 'Talitha — Maquiagem', desc: 'Maquiagem personalizada para diferentes ocasiões, com atendimento em sala exclusiva.' },
    { title: 'Nayara — Nail Designer', desc: 'Cuidados com as unhas em atendimento individual, realizado em sua própria sala.' },
    { title: 'Produções Integradas', desc: 'Experiências personalizadas para noivas, formandas e ocasiões especiais.' }
  ],
  featureCtaLabel: 'Montar Minha Experiência / Agendar',
  featureSecondaryCtaLabel: 'Consultar Produção para Noivas',
  featureImageUrl: '/spaces/producao-integrada-lev.jpg',
  featureImageAlt: 'Dia de Noiva e Spa no LEV Beauty',
  featureImageTitle: 'Produção Integrada LEV Beauty',
  featureImageText: 'Sua transformação completa com quem mais entende de beleza.',
  professionalsKicker: 'Profissionais do Coworking',
  professionalsTitle: 'Conheça nossas especialistas',
  professionalsText: 'Cada especialista oferece atendimento personalizado, com excelência, cuidado e dedicação em sua área.',
  googleReviews: {
    rating: GOOGLE_REVIEWS_SUMMARY.rating,
    total: GOOGLE_REVIEWS_SUMMARY.total,
    url: GOOGLE_REVIEWS_URL,
    reviews: GOOGLE_REVIEWS.map(review => ({
      author: review.clientName,
      text: review.comment,
      rating: review.rating,
      date: review.date,
      ...(review.serviceName ? { service: review.serviceName } : {})
    }))
  },
  portfolioEnabled: true,
  staffAreaText: 'Acesso para profissionais e administração do Studio LEV gerenciarem agendamentos e serviços.',
  footerNote: 'LEV COWORKING BEAUTY. Todos os direitos reservados.'
};
