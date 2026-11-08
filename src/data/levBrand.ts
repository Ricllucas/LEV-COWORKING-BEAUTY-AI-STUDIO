// Dados de marca e de equipe que são só da LEV. Nenhum outro salão usa estes
// valores: quem lê daqui confere antes `isDefaultSalon()`.

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
