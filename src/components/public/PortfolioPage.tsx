import React, { useEffect, useMemo, useState } from 'react';
import { Professional, Service, CoworkingSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudServiceCatalog } from '../../services/cloudServiceCatalog';
import { formatCurrency, buildProfessionalWhatsAppLink } from '../../utils/formatters';
import { LoopVideo } from '../common/LoopVideo';
import { Calendar, MapPin, Clock, MessageCircle, Instagram, X } from 'lucide-react';
import { LEV_PORTFOLIO, PortfolioWorkCategory, PortfolioWorkItem } from '../../data/levBrand';

const displayFont = "font-['Cormorant_Garamond',Georgia,serif]";

type WorkCategory = PortfolioWorkCategory;
type WorkItem = PortfolioWorkItem;

// Fotos, vídeos e destaques: dados só da LEV (a página de portfólio é só dela).
const LEV_WORKS = LEV_PORTFOLIO.works;

const WORK_FILTERS: Array<'Todos' | WorkCategory> = [
  'Todos',
  ...(['Noivas', 'Maquiagem', 'Penteados', 'Sobrancelhas', 'Unhas', 'SPA dos pés'] as WorkCategory[])
    .filter(category => LEV_WORKS.some(work => work.category === category))
];

const PROFESSIONAL_HIGHLIGHTS = LEV_PORTFOLIO.highlights;
const BRIDES = LEV_PORTFOLIO.brides;
const BRIDAL_BACKSTAGE = LEV_PORTFOLIO.bridalBackstage;
const BEHIND_THE_SCENES = LEV_PORTFOLIO.behindTheScenes;

const MediaTile: React.FC<{ item: WorkItem; className?: string }> = ({ item, className = 'w-full h-full object-cover' }) =>
  item.video
    ? <LoopVideo src={item.video} poster={item.src} label={item.alt} className={className} />
    : <img src={item.src} alt={item.alt} loading="lazy" className={className} />;

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8C7249]">{children}</span>
);

const PriceRow: React.FC<{ name: string; price: number }> = ({ name, price }) => (
  <li className="flex items-baseline gap-3 py-3 border-b border-[#3D312A]/10 last:border-b-0">
    <span className={`${displayFont} text-lg text-[#3D312A]`}>{name}</span>
    <span className="flex-1 border-b border-dotted border-[#3D312A]/20 translate-y-[-4px]" />
    <span className="text-sm font-medium text-[#8C7249] whitespace-nowrap">
      {price > 0 ? formatCurrency(price) : 'sob consulta'}
    </span>
  </li>
);

const BookButton: React.FC<{ label: string; variant?: 'solid' | 'outline' }> = ({ label, variant = 'solid' }) => (
  <a
    href="/"
    className={variant === 'solid'
      ? 'inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#A1865B] hover:bg-[#8C7249] text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors'
      : 'inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-[#A1865B] hover:bg-[#A1865B] hover:text-white text-[#8C7249] text-xs font-semibold uppercase tracking-[0.2em] transition-colors'}
  >
    <Calendar className="w-4 h-4" />
    {label}
  </a>
);

export const PortfolioPage: React.FC = () => {
  const [settings] = useState<CoworkingSettings>(() => StorageService.getSettings());
  const [professionals] = useState<Professional[]>(() => StorageService.getProfessionals());
  const [services, setServices] = useState<Service[]>(() => StorageService.getServices());
  const [workFilter, setWorkFilter] = useState<'Todos' | WorkCategory>('Todos');
  const [openPhoto, setOpenPhoto] = useState<WorkItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    CloudServiceCatalog.load()
      .then(cloudServices => {
        StorageService.replaceServices(cloudServices);
        if (isMounted) setServices(StorageService.getServices());
      })
      .catch(error => console.error('Erro ao atualizar catálogo do portfólio:', error));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!openPhoto) return;
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPhoto(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [openPhoto]);

  const activeServices = useMemo(() => services.filter(s => s.active), [services]);
  const servicesOf = (profId: string) => activeServices.filter(s => s.professionalId === profId);
  const findService = (id: string) => activeServices.find(s => s.id === id);
  const visibleWorks = workFilter === 'Todos' ? LEV_WORKS : LEV_WORKS.filter(w => w.category === workFilter);

  const makeup = findService(LEV_PORTFOLIO.bridalServiceIds.makeup);
  const hairstyle = findService(LEV_PORTFOLIO.bridalServiceIds.hairstyle);
  const bridalProduction = findService(LEV_PORTFOLIO.bridalServiceIds.bridalProduction);
  const bridalProfessional = professionals.find(p => p.id === LEV_PORTFOLIO.bridalProfessionalId);
  const bridalWhatsApp = bridalProfessional
    ? buildProfessionalWhatsAppLink(bridalProfessional.id, LEV_PORTFOLIO.bridalWhatsAppText, bridalProfessional)
    : undefined;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;
  const instagramHandle = settings.instagram.replace('@', '');

  return (
    <div className="min-h-screen bg-[#FCF9F2] text-[#3D312A] selection:bg-[#E6D7C3]">
      {/* Topo */}
      <header className="px-6 py-5 max-w-6xl mx-auto flex items-center justify-between">
        <a
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D312A]/60 hover:text-[#3D312A] transition-colors"
        >
          ← Início
        </a>
        <BookButton label="Agendar" variant="outline" />
      </header>

      {/* Banner da marca */}
      <section className="px-6 pt-6 pb-10 sm:pt-10 sm:pb-14">
        <h1 className="sr-only">Portfólio {LEV_PORTFOLIO.bannerTitle}</h1>
        <a href="/" aria-label="Página inicial LEV" className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <img
            src="/brand/lev-logo-horizontal.webp"
            alt={LEV_PORTFOLIO.bannerTitle}
            width={1437}
            height={438}
            loading="eager"
            className="w-full h-auto mix-blend-multiply"
          />
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.4em] text-[#8C7249]">Portfólio · Centro · Curitiba</span>
        </a>
      </section>

      {/* Hero */}
      <section className="px-6 pt-6 pb-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
          <SectionLabel>Nossos trabalhos</SectionLabel>
          <h2 className={`${displayFont} text-5xl sm:text-7xl leading-[0.95] text-[#3D312A]`}>
            Trabalhos reais,<br /><span className="italic text-[#A1865B]">feitos aqui</span>
          </h2>
          <p className="text-base leading-8 text-[#3D312A]/70 font-light max-w-md mx-auto lg:mx-0">{settings.slogan}</p>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <BookButton label="Reservar horário" />
            <a
              href="#noivas"
              className="inline-flex items-center px-8 py-3.5 rounded-full text-[#3D312A]/70 hover:text-[#3D312A] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              Noivas
            </a>
            <a
              href="#trabalhos"
              className="inline-flex items-center px-8 py-3.5 rounded-full text-[#3D312A]/70 hover:text-[#3D312A] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              Ver trabalhos
            </a>
          </div>
        </div>
        <div className="lg:col-span-6 relative">
          <img
            src={LEV_PORTFOLIO.heroImage.src}
            alt={LEV_PORTFOLIO.heroImage.alt}
            className="relative w-full aspect-[4/5] object-cover rounded-[2rem]"
          />
        </div>
      </section>

      {/* Sobre */}
      <section className="px-6 py-20 bg-white border-y border-[#3D312A]/[0.06]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src={LEV_PORTFOLIO.aboutImage.src}
            alt={LEV_PORTFOLIO.aboutImage.alt}
            loading="lazy"
            className="w-full aspect-[3/2] object-cover rounded-[2rem]"
          />
          <div className="space-y-6 text-center lg:text-left">
            <SectionLabel>Sobre a LEV</SectionLabel>
            <h2 className={`${displayFont} text-4xl sm:text-5xl`}>Três especialistas, um só endereço</h2>
            <p className="text-base leading-8 text-[#3D312A]/70 font-light">
              O LEV é um coworking de beleza no Centro de Curitiba onde cada profissional atende em sua própria sala,
              com privacidade e cuidado em cada detalhe. Unhas, cílios, sobrancelhas, maquiagem e penteados reunidos
              para que você resolva tudo em uma única visita, do dia a dia ao seu grande dia.
            </p>
          </div>
        </div>
      </section>

      {/* Por dentro da LEV */}
      <section className="px-6 pt-24 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <SectionLabel>Por dentro da LEV</SectionLabel>
          <h2 className={`${displayFont} text-4xl sm:text-5xl`}>Momentos que acontecem aqui</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {BEHIND_THE_SCENES.map(reel => (
            <figure key={reel.video} className="space-y-3">
              <div className="rounded-2xl overflow-hidden aspect-[9/16] bg-[#F3EBDD]">
                <LoopVideo
                  src={reel.video}
                  poster={reel.poster}
                  label={reel.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className={`${displayFont} text-xl text-center`}>{reel.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Especialistas */}
      <section id="especialistas" className="px-6 py-24 max-w-6xl mx-auto space-y-28">
        {professionals.map((prof, index) => {
          const profServices = servicesOf(prof.id);
          const whatsappLink = buildProfessionalWhatsAppLink(prof.id, `Olá, ${prof.name}! Vi o portfólio da LEV e gostaria de saber mais sobre seus serviços.`, prof);
          const reversed = index % 2 === 1;
          return (
            <article key={prof.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className={`lg:col-span-5 ${reversed ? 'lg:order-2' : ''}`}>
                <div className="relative rounded-[2rem] overflow-hidden bg-[#F3EBDD] aspect-square flex items-center justify-center">
                  <span className={`${displayFont} text-8xl text-[#A1865B]`}>{prof.name.charAt(0)}</span>
                  {prof.avatarUrl && (
                    <img src={prof.avatarUrl} alt={prof.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
              </div>

              <div className={`lg:col-span-7 space-y-6 ${reversed ? 'lg:order-1' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <span className={`${displayFont} text-5xl text-[#A1865B]/50`}>{String(index + 1).padStart(2, '0')}</span>
                    <SectionLabel>{prof.title}</SectionLabel>
                  </div>
                  <h3 className={`${displayFont} text-5xl sm:text-6xl`}>{prof.name}</h3>
                  <p className="text-base leading-8 text-[#3D312A]/70 font-light">{prof.bio}</p>
                </div>

                {PROFESSIONAL_HIGHLIGHTS[prof.id] && (
                  <div className="grid grid-cols-3 gap-3">
                    {PROFESSIONAL_HIGHLIGHTS[prof.id].map(item => (
                      <div key={item.src} className="rounded-2xl overflow-hidden aspect-[3/4] bg-[#F3EBDD]">
                        <MediaTile item={item} />
                      </div>
                    ))}
                  </div>
                )}

                {profServices.length > 0 && (
                  <div className="rounded-3xl bg-white border border-[#3D312A]/[0.06] p-7 shadow-[0_20px_60px_-30px_rgba(61,49,42,0.25)]">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[#3D312A]/50 mb-2">Investimento</p>
                    <ul>
                      {profServices.map(service => (
                        <PriceRow key={service.id} name={service.name} price={service.price} />
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <BookButton label={`Agendar com ${prof.name}`} />
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#3D312A]/15 hover:bg-white text-[#3D312A]/80 text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Trabalhos da Talitha */}
      <section id="trabalhos" className="px-6 py-24 bg-white border-y border-[#3D312A]/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <SectionLabel>Trabalhos</SectionLabel>
            <h2 className={`${displayFont} text-4xl sm:text-5xl`}>Feito aqui, na LEV</h2>
            <p className="text-base leading-8 text-[#3D312A]/70 font-light">
              Unhas, maquiagens, penteados e noivas atendidas pelas especialistas da casa.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {WORK_FILTERS.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setWorkFilter(filter)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    workFilter === filter
                      ? 'bg-[#3D312A] text-[#FCF9F2]'
                      : 'bg-[#FCF9F2] text-[#3D312A]/60 hover:text-[#3D312A]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="columns-2 md:columns-3 gap-4 [&>*]:mb-4">
            {visibleWorks.map(item => (
              <button
                key={item.src}
                type="button"
                onClick={() => setOpenPhoto(item)}
                className="group relative block w-full overflow-hidden rounded-2xl break-inside-avoid bg-[#F3EBDD]"
              >
                <MediaTile item={item} className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                <span className="absolute left-3 bottom-3 px-3 py-1 rounded-full bg-white/90 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3D312A] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.category}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {LEV_PORTFOLIO.instagramProfiles.map(profile => (
              <a
                key={profile.handle}
                href={`https://www.instagram.com/${profile.handle}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#8C7249] hover:text-[#3D312A] transition-colors"
              >
                <Instagram className="w-4 h-4" />
                {profile.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Noivas */}
      {(bridalProduction || makeup || hairstyle) && (
        <section id="noivas" className="py-24 space-y-20">
          {bridalProduction && (
            <div className="bg-[#3D312A] text-[#FCF9F2]">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-stretch">
                <div className="relative min-h-[420px] lg:min-h-[640px]">
                  <img
                    src={LEV_PORTFOLIO.bridalImage.src}
                    alt={LEV_PORTFOLIO.bridalImage.alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="px-8 py-16 sm:px-14 lg:py-24 flex flex-col justify-center space-y-8">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#D9C29A]">Dia da noiva</span>
                  <h2 className={`${displayFont} text-5xl sm:text-7xl leading-[0.95]`}>
                    O seu sim<br /><span className="italic text-[#D9C29A]">merece este cuidado</span>
                  </h2>
                  <p className="text-base leading-8 text-[#FCF9F2]/75 font-light max-w-md">
                    Maquiagem e penteado assinados pela Talitha, especialista em noivas, do pré-wedding ao grande dia.
                    Combine com as nail designers da casa e viva cada etapa com calma, em um só lugar.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-[#FCF9F2]/15 py-6">
                    {['Pré-wedding', 'Casamento civil', 'Dia da noiva'].map(moment => (
                      <li key={moment} className={`${displayFont} text-2xl`}>{moment}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-6">
                    <a
                      href={bridalWhatsApp ?? '/'}
                      target={bridalWhatsApp ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#A1865B] hover:bg-[#B39A70] text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Solicitar orçamento
                    </a>
                    <span className="text-sm text-[#FCF9F2]/60">
                      Investimento: {bridalProduction.price > 0 ? formatCurrency(bridalProduction.price) : 'sob consulta'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 max-w-6xl mx-auto space-y-20">
            {bridalProduction && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <SectionLabel>Noivas LEV</SectionLabel>
                  <h3 className={`${displayFont} text-4xl sm:text-5xl`}>Noivas que se prepararam aqui</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {BRIDES.map(item => (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setOpenPhoto(item)}
                      className="rounded-2xl overflow-hidden aspect-[3/4] bg-[#F3EBDD]"
                    >
                      <MediaTile item={item} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bridalProduction && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className={`${displayFont} text-3xl sm:text-4xl`}>Bastidores de uma noiva</h3>
                  <p className="text-sm text-[#3D312A]/65 font-light">Noiva Rayssa, produzida pela Talitha.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {BRIDAL_BACKSTAGE.map(item => (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setOpenPhoto(item)}
                      className="rounded-2xl overflow-hidden aspect-[3/4] bg-[#F3EBDD]"
                    >
                      <MediaTile item={item} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(makeup || hairstyle) && (
              <div className="max-w-2xl mx-auto text-center space-y-5 pt-6">
                <h3 className={`${displayFont} text-3xl sm:text-4xl`}>Para quem vive esse dia ao seu lado</h3>
                <p className="text-sm leading-7 text-[#3D312A]/65 font-light">
                  Madrinhas, mães, formandas e convidadas também podem ser produzidas no LEV, com o mesmo cuidado
                  e atendimento personalizado. Fale com a gente para montar o cronograma do seu grupo.
                </p>
                <ul className="max-w-md mx-auto text-left">
                  {makeup && <PriceRow name={makeup.name} price={makeup.price} />}
                  {hairstyle && <PriceRow name={hairstyle.name} price={hairstyle.price} />}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Espaço */}
      <section className="px-6 py-24 bg-white border-y border-[#3D312A]/[0.06]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <SectionLabel>Nosso espaço</SectionLabel>
            <h2 className={`${displayFont} text-4xl sm:text-5xl`}>Cada detalhe pensado para você</h2>
            <p className="text-base leading-8 text-[#3D312A]/70 font-light">
              Salas individuais, atendimento com privacidade e uma recepção acolhedora no coração de Curitiba.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {LEV_PORTFOLIO.spacePhotos.map(img => (
              <figure key={img.url} className="space-y-3">
                <div className="rounded-2xl overflow-hidden h-96">
                  <img src={img.url} alt={img.title} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <figcaption className={`${displayFont} text-xl text-center`}>{img.title}</figcaption>
              </figure>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#3D312A]/70">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#A1865B]" />{settings.address}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#A1865B]" />{settings.businessHoursText}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#A1865B] hover:bg-[#A1865B] hover:text-white text-[#8C7249] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Ver localização
            </a>
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#3D312A]/15 hover:bg-[#FCF9F2] text-[#3D312A]/80 text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              <Instagram className="w-4 h-4" />
              {settings.instagram}
            </a>
          </div>
        </div>
      </section>

      {/* Como reservar */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <SectionLabel>Como reservar</SectionLabel>
            <h2 className={`${displayFont} text-4xl`}>Facilidades para viver sua experiência</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white border border-[#3D312A]/[0.06] p-7 space-y-2">
              <h3 className={`${displayFont} text-2xl text-[#8C7249]`}>Sinal de {settings.depositPercentage}%</h3>
              <p className="text-sm leading-7 text-[#3D312A]/65 font-light">
                O horário é garantido com um sinal de {settings.depositPercentage}% do valor do serviço, pago via Pix
                diretamente à profissional escolhida.
              </p>
            </div>
            <div className="rounded-3xl bg-white border border-[#3D312A]/[0.06] p-7 space-y-2">
              <h3 className={`${displayFont} text-2xl text-[#8C7249]`}>Cancelamento</h3>
              <p className="text-sm leading-7 text-[#3D312A]/65 font-light">{settings.cancellationPolicy}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-24 text-center space-y-6 bg-[#F3EBDD]">
        <h2 className={`${displayFont} text-5xl sm:text-6xl`}>Agora só falta o seu horário</h2>
        <p className="text-base text-[#3D312A]/65 font-light max-w-lg mx-auto">
          Escolha a profissional, o serviço e o melhor dia para você. O agendamento é online e leva poucos minutos.
        </p>
        <BookButton label="Quero reservar meu horário" />
      </section>

      {/* Foto ampliada */}
      {openPhoto && (
        <div
          className="fixed inset-0 z-50 bg-[#3D312A]/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenPhoto(null)}
          role="dialog"
          aria-label={openPhoto.alt}
        >
          <button
            type="button"
            onClick={() => setOpenPhoto(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/90 text-[#3D312A]"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          {openPhoto.video ? (
            <video
              src={openPhoto.video}
              poster={openPhoto.src}
              aria-label={openPhoto.alt}
              autoPlay
              muted
              loop
              playsInline
              className="max-h-[88vh] max-w-full rounded-2xl object-contain"
            />
          ) : (
            <img src={openPhoto.src} alt={openPhoto.alt} className="max-h-[88vh] max-w-full rounded-2xl object-contain" />
          )}
        </div>
      )}
    </div>
  );
};
