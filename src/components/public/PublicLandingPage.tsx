import React, { useState, useEffect, useMemo } from 'react';
import { Logo } from '../brand/Logo';
import { Professional, Service, CoworkingSettings, Appointment } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudAppointmentService } from '../../services/cloudAppointments';
import { formatCurrency, buildProfessionalWhatsAppLink } from '../../utils/formatters';
import { getSpecialtyIcon } from '../common/SpecialtyIcons';
import { ProfessionalAvatar } from '../common/ProfessionalAvatar';
import { LoopVideo } from '../common/LoopVideo';
import { brandStyle, currentBrand, emphasisParts, withProfessionalNames } from '../../utils/salonBrand';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import {
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  Instagram,
  Star,
  CheckCircle2,
  Heart,
  ChevronRight,
  MessageCircle,
  CreditCard,
  Lock,
  Camera,
  XCircle
} from 'lucide-react';

interface PublicLandingPageProps {
  onOpenBookingModal: (profId?: string, serviceId?: string) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onOpenBookingModal }) => {
  const [currentUser, setCurrentUser] = useState(() => StorageService.getCurrentUser());
  const [settings, setSettings] = useState<CoworkingSettings>(() => StorageService.getSettings());
  const [professionals, setProfessionals] = useState<Professional[]>(() => StorageService.getProfessionals());
  const [services, setServices] = useState<Service[]>(() => StorageService.getServices());
  const [selectedProfCategory, setSelectedProfCategory] = useState<string>('todas');
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(() => StorageService.getClientBookings());
  const [cancellingId, setCancellingId] = useState<string>('');

  const isAdmin = currentUser?.role === 'admin';
  const brand = useMemo(() => currentBrand(settings), [settings]);
  const highlightIcons = [Sparkles, Star, Calendar, Heart];
  const spacePhotos = brand.spacePhotos ?? [];
  const featureItems = brand.featureItems ?? [];

  const handleDirectAvatarUpload = async (prof: Professional, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedBase64 = await compressImageToDataUrl(file, 320, 0.78);
      const updatedProf: Professional = {
        ...prof,
        avatarUrl: resizedBase64,
      };
      StorageService.publishProfessional(updatedProf);
      setProfessionals(StorageService.getProfessionals());
      alert(`Foto de ${prof.name} atualizada e salva com sucesso!`);
    } catch (err) {
      console.error('Erro ao processar upload:', err);
      alert('Não foi possível processar esta imagem. Tente outra foto do celular.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const refreshData = () => {
      if (!isMounted) return;
      Promise.resolve().then(() => {
        if (isMounted) {
          setCurrentUser(StorageService.getCurrentUser());
          setSettings(StorageService.getSettings());
          setProfessionals(StorageService.getProfessionals());
          setServices(StorageService.getServices());
          setLocalAppointments(StorageService.getClientBookings());
        }
      });
    };
    const unsubscribe = StorageService.subscribeStorage(refreshData);
    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const filteredServices = useMemo(() => {
    if (selectedProfCategory === 'todas') {
      return services.filter(s => s.active && s.onlineBookingEnabled);
    }
    return services.filter(s => s.active && s.onlineBookingEnabled && s.professionalId === selectedProfCategory);
  }, [services, selectedProfCategory]);

  const handleClientCancellation = async (appointment: Appointment) => {
    if (!window.confirm(`Cancelar o atendimento de ${appointment.serviceNames.join(', ')} em ${appointment.date} às ${appointment.startTime}?`)) return;
    setCancellingId(appointment.id);
    try {
      await CloudAppointmentService.cancel(appointment.id, appointment.clientPhone, 'Cancelado pela cliente pelo site');
      StorageService.cancelAppointment(appointment.id, 'Cancelado pela cliente pelo site', true);
      setLocalAppointments(items => items.filter(item => item.id !== appointment.id));
      alert('Agendamento cancelado. O horário foi liberado e o Google Agenda foi atualizado.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível cancelar o agendamento.');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="min-h-screen bg-(--brand-bg) text-(--brand-text) pb-20" style={brandStyle(brand)}>
      {/* Brand Banner */}
      <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-6 sm:pt-20 sm:pb-10">
        <h1 className="sr-only">{settings.name}</h1>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          {brand.bannerLogoUrl ? (
            <img
              src={brand.bannerLogoUrl}
              alt={settings.name}
              width={1437}
              height={438}
              loading="eager"
              className="w-full h-auto mix-blend-multiply"
            />
          ) : (
            <Logo size="lg" />
          )}
          {brand.heroKicker && (
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.4em] text-(--brand-primary)">
              {brand.heroKicker}
            </p>
          )}
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative pt-6 pb-20 px-4 sm:px-6 lg:px-8 border-b border-(--brand-text)/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-medium text-(--brand-text) mt-4 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-(--brand-text) via-(--brand-primary) to-(--brand-accent) bg-clip-text text-transparent block">
              {brand.heroTitle}
            </span>
          </h2>

          <p className="mt-5 max-w-3xl mx-auto text-sm sm:text-base text-(--brand-text)/80 leading-relaxed font-light">
            {emphasisParts(brand.heroText).map((part, i) => part.emphasis
              ? <strong key={i} className="text-(--brand-primary) font-semibold">{part.text}</strong>
              : <React.Fragment key={i}>{part.text}</React.Fragment>)}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button" onClick={() => onOpenBookingModal()}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-(--brand-accent) via-(--brand-accent) to-(--brand-primary) hover:from-(--brand-primary) hover:to-(--brand-primary) text-white font-semibold text-sm transition-all shadow-[0_0_25px_color-mix(in_srgb,var(--brand-accent)_25%,transparent)] flex items-center justify-center gap-2 group hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5 text-(--brand-text) group-hover:scale-110 transition-transform" />
              Escolher profissional e agendar
            </button>
            {brand.portfolioEnabled && <a
              href="/portfolio"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-(--brand-text)/[0.05] border border-(--brand-accent)/40 hover:bg-(--brand-text)/10 text-(--brand-primary) font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Ver portfólio
            </a>}
          </div>

          {/* Highlights Badges */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {brand.highlights.map((item, idx) => {
              const Icon = highlightIcons[idx % highlightIcons.length];
              const desc = withProfessionalNames(item.desc, professionals.map(p => p.name)).trim();
              return (
              <div key={idx} className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-(--brand-text)/10 hover:border-(--brand-accent)/40 text-left transition-all hover:shadow-[0_0_15px_color-mix(in_srgb,var(--brand-accent)_10%,transparent)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-(--brand-accent)/10 border border-(--brand-accent)/20">
                    <Icon className="w-4 h-4 text-(--brand-primary)" />
                  </div>
                  <span className="text-xs font-semibold text-(--brand-text)">{item.title}</span>
                </div>
                {desc && <span className="text-[11px] text-(--brand-primary) font-medium block">{desc}</span>}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {localAppointments.length > 0 && (
        <section className="px-4 -mt-8 relative z-20">
          <div className="max-w-4xl mx-auto rounded-2xl border border-(--brand-accent)/30 bg-white p-4 shadow-xl">
            <div className="mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-(--brand-primary)">Neste dispositivo</span>
              <h2 className="text-base font-semibold text-(--brand-text)">Meus agendamentos</h2>
            </div>
            <div className="space-y-2">
              {localAppointments.map(appointment => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-(--brand-text)/10 bg-(--brand-bg) p-3">
                  <div className="text-xs">
                    <p className="font-semibold text-(--brand-text)">{appointment.serviceNames.join(', ')} — {appointment.professionalName}</p>
                    <p className="text-(--brand-text)/55">{appointment.date.split('-').reverse().join('/')} às {appointment.startTime}</p>
                  </div>
                  <button
                    onClick={() => handleClientCancellation(appointment)}
                    disabled={cancellingId === appointment.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-50/30 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {cancellingId === appointment.id ? 'Cancelando...' : 'Cancelar agendamento'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ambiance Gallery */}
      {spacePhotos.length > 0 && (
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest text-(--brand-primary) uppercase">
            {brand.spaceKicker}
          </span>
          <h2 className="text-2xl font-serif text-(--brand-text) font-medium mt-1">
            {brand.spaceTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {spacePhotos.map((img, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden h-60">
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-(--brand-text)/80 via-(--brand-text)/20 to-transparent flex flex-col justify-end p-4 text-white">
                <span className="font-medium text-sm font-serif">{img.title}</span>
                <span className="text-xs text-white/80 font-light mt-0.5">{img.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Portfolio Teaser (fotos de trabalhos; o link só quando o salão tem página de portfólio) */}
      {brand.works.length > 0 && (
        <section className="py-12 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold tracking-widest text-(--brand-primary) uppercase">
              Portfólio
            </span>
            <h2 className="text-2xl font-serif text-(--brand-text) font-medium mt-1">
              {brand.worksTitle}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {brand.works.map(item => (
              <a key={item.url} href={brand.portfolioEnabled ? '/portfolio' : undefined} className="group block rounded-2xl overflow-hidden aspect-[3/4] bg-(--brand-surface)">
                {item.video ? (
                  <LoopVideo src={item.video} poster={item.url} label={item.alt} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
              </a>
            ))}
          </div>

          {brand.portfolioEnabled && <div className="mt-6 text-center">
            <a
              href="/portfolio"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-(--brand-accent) text-(--brand-primary) hover:bg-(--brand-accent) hover:text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              Ver portfólio completo
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>}
        </section>
      )}

      {/* Spa de Noivas & Produção VIP Experience Banner */}
      {brand.featureTitle && (
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-br from-(--brand-surface) via-(--brand-surface) to-(--brand-bg) border border-(--brand-accent)/40 p-6 sm:p-10 overflow-hidden shadow-[0_0_50px_color-mix(in_srgb,var(--brand-accent)_15%,transparent)]">
          {/* Decorative Gold Sparkles Background */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-(--brand-accent)/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-(--brand-accent)/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              {brand.featureKicker && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--brand-accent)/20 border border-(--brand-accent)/40 text-(--brand-primary) text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-(--brand-primary)" />
                <span>{brand.featureKicker}</span>
              </div>}

              <h2 className="text-2xl sm:text-4xl font-serif font-semibold text-(--brand-text) leading-tight">
                {emphasisParts(brand.featureTitle).map((part, i) => part.emphasis
                  ? <span key={i} className="text-(--brand-primary) italic">{part.text}</span>
                  : <React.Fragment key={i}>{part.text}</React.Fragment>)}
              </h2>

              <p className="text-sm text-(--brand-text)/80 leading-relaxed font-light">
                {brand.featureText}
              </p>

              {featureItems.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {featureItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-(--brand-text)/[0.03] border border-(--brand-text)/10">
                    <CheckCircle2 className="w-4 h-4 text-(--brand-primary) shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-(--brand-text)">{item.title}</h4>
                      <p className="text-[11px] text-(--brand-text)/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>}

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenBookingModal()}
                  className="px-7 py-3.5 rounded-xl bg-(--brand-accent) hover:bg-(--brand-primary) text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {brand.featureCtaLabel || 'Agendar'}
                </button>

                {brand.featureSecondaryCtaLabel && <button type="button" onClick={() => onOpenBookingModal()}
                  className="px-6 py-3.5 rounded-xl bg-(--brand-text)/[0.05] border border-(--brand-text)/15 hover:bg-(--brand-text)/10 text-(--brand-text) font-medium text-xs transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  {brand.featureSecondaryCtaLabel}
                </button>}
              </div>
            </div>

            {brand.featureImageUrl && <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden group">
                <img
                  src={brand.featureImageUrl}
                  alt={brand.featureImageAlt || brand.featureTitle.split('*').join('')}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                {(brand.featureImageTitle || brand.featureImageText) && <div className="absolute inset-0 bg-gradient-to-t from-(--brand-text)/85 via-(--brand-text)/20 to-transparent flex flex-col justify-end p-5">
                  <span className="text-xs font-serif text-(--brand-surface) font-semibold">{brand.featureImageTitle}</span>
                  <span className="text-sm font-medium text-white">{brand.featureImageText}</span>
                </div>}
              </div>
            </div>}
          </div>
        </div>
      </section>
      )}

      {/* Professionals Section */}
      <section className="py-12 bg-white border-y border-(--brand-text)/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold tracking-widest text-(--brand-primary) uppercase">
              {brand.professionalsKicker || 'Profissionais'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-(--brand-text) font-medium mt-1">
              {brand.professionalsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-(--brand-text)/60 mt-1 max-w-xl mx-auto">
              {brand.professionalsText}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {professionals.map(prof => (
              <div
                key={prof.id}
                className="bg-(--brand-bg) rounded-2xl border border-(--brand-text)/10 p-6 shadow-xs hover:border-(--brand-accent)/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-28 h-28 mx-auto mb-4 group flex items-center justify-center">
                    <ProfessionalAvatar
                      src={prof.avatarUrl}
                      name={prof.name}
                      sizeClassName="w-28 h-28"
                      textClassName="text-3xl"
                      bordered={false}
                    />
                    {isAdmin && (
                      <>
                        <label
                          htmlFor={`avatar-upload-${prof.id}`}
                          className="absolute bottom-0 right-0 p-2 bg-(--brand-accent) hover:bg-(--brand-accent) text-black rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 border-2 border-(--brand-bg) flex items-center justify-center"
                          title="Toque para enviar a foto real da sua galeria"
                        >
                          <Camera className="w-4 h-4 text-black" />
                        </label>
                        <input
                          id={`avatar-upload-${prof.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleDirectAvatarUpload(prof, e)}
                        />
                      </>
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-serif font-semibold text-(--brand-text)">
                      {prof.name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-(--brand-accent)/15 text-(--brand-primary) font-medium text-xs border border-(--brand-accent)/30">
                      {getSpecialtyIcon(prof.name + ' ' + prof.title, "w-3.5 h-3.5 text-(--brand-primary)")}
                      <span>{prof.title}</span>
                    </div>

                    <p className="text-xs text-(--brand-text)/60 mt-3 leading-relaxed">
                      {prof.bio}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-(--brand-text)/10 flex flex-col gap-2">
                  <button
                    onClick={() => onOpenBookingModal(prof.id)}
                    className="w-full py-2.5 rounded-xl bg-(--brand-accent) hover:bg-(--brand-primary) text-white font-semibold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Agendar com {prof.name}
                  </button>

                  <a
                    href={buildProfessionalWhatsAppLink(prof.id, `Olá, ${prof.name}! Gostaria de falar sobre seus serviços.`, prof)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-(--brand-text)/[0.03] border border-(--brand-text)/10 hover:bg-(--brand-text)/[0.08] text-(--brand-text)/80 font-medium text-xs transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Direto
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Menu Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest text-(--brand-primary) uppercase">
            Serviços & Procedimentos
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-(--brand-text) font-medium mt-1">
            Menu de Atendimentos
          </h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedProfCategory('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedProfCategory === 'todas'
                ? 'bg-(--brand-accent) text-white font-semibold shadow-2xs'
                : 'bg-(--brand-text)/[0.03] text-(--brand-text)/60 border border-(--brand-text)/10 hover:bg-(--brand-text)/[0.08] hover:text-(--brand-text)'
            }`}
          >
            Todos os Serviços
          </button>
          {professionals.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProfCategory(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedProfCategory === p.id
                  ? 'bg-(--brand-accent) text-white font-semibold shadow-2xs'
                  : 'bg-(--brand-text)/[0.03] text-(--brand-text)/60 border border-(--brand-text)/10 hover:bg-(--brand-text)/[0.08] hover:text-(--brand-text)'
              }`}
            >
              {p.name} ({p.title})
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-(--brand-text)/10 p-5 shadow-2xs hover:border-(--brand-accent) transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-(--brand-primary) uppercase tracking-wider block mb-1">
                      {service.professionalName} • {service.category}
                    </span>
                    <h3 className="font-serif text-base font-semibold text-(--brand-text)">
                      {service.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-serif font-bold text-(--brand-primary)">
                      {service.price <= 0 ? 'Sob consulta' : formatCurrency(service.promotionalPrice || service.price)}
                    </span>
                    {service.promotionalPrice && (
                      <span className="text-xs text-(--brand-text)/40 line-through block">
                        {formatCurrency(service.price)}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-(--brand-text)/60 mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-(--brand-text)/10 flex items-center justify-between">
                <span className="text-[11px] text-(--brand-primary) flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-(--brand-primary)" />
                  Duração: {service.durationMinutes} min
                </span>

                <button
                  onClick={() => onOpenBookingModal(service.professionalId, service.id)}
                  className="px-4 py-1.5 rounded-xl bg-(--brand-text)/[0.03] border border-(--brand-text)/10 hover:bg-(--brand-accent) text-white/80 hover:text-(--brand-text) font-medium text-xs transition-colors flex items-center gap-1"
                >
                  Agendar <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      {brand.googleReviews && brand.googleReviews.reviews.length > 0 && (
        <section className="py-12 bg-white border-t border-(--brand-text)/10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <span className="text-xs font-semibold tracking-widest text-(--brand-primary) uppercase">
              Avaliações reais no Google
            </span>
            <h2 className="text-2xl font-serif text-(--brand-text) font-medium mt-1 mb-2">
              O que dizem sobre nosso espaço
            </h2>
            <a
              href={brand.googleReviews.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-(--brand-text)/70 hover:text-(--brand-primary) mb-8"
            >
              <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
              <span className="font-semibold text-(--brand-text)">{brand.googleReviews.rating.toFixed(1).replace('.', ',')}</span>
              <span>· {brand.googleReviews.total} avaliações no Google</span>
            </a>

            <div className="flex flex-wrap justify-center gap-4">
              {brand.googleReviews.reviews.map((rev, idx) => (
                <div key={`${rev.author}-${idx}`} className="w-full md:w-[calc(33.333%-0.75rem)] bg-(--brand-bg) p-5 rounded-2xl border border-(--brand-text)/10 text-left shadow-2xs flex flex-col">
                  <div className="flex items-center gap-1 text-amber-600 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-(--brand-text)/70 italic leading-relaxed flex-1">
                    "{rev.text}"
                  </p>
                  <div className="mt-4 pt-3 border-t border-(--brand-text)/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-(--brand-text)">{rev.author}</span>
                    <span className="text-[10px] text-(--brand-primary) text-right">
                      {rev.service || 'Avaliação no Google'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={brand.googleReviews.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-6 text-xs font-medium text-(--brand-primary) hover:underline"
            >
              Ver todas as avaliações no Google <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      )}

      {/* Footer & Info Section */}
      <footer className="bg-(--brand-bg) border-t border-(--brand-text)/10 text-(--brand-text)/70 py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo size="md" theme="dark" variant="horizontal" />
            <p className="text-xs text-(--brand-text)/60 mt-4 leading-relaxed">
              {settings.slogan}
            </p>
            <p className="text-[11px] text-(--brand-text)/40 mt-2">
              © {new Date().getFullYear()} {brand.footerNote || `${settings.name ? `${settings.name}. ` : ''}Todos os direitos reservados.`}
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-(--brand-primary) mb-3 uppercase tracking-wider">
              Localização & Horários
            </h4>
            <ul className="space-y-2 text-xs text-(--brand-text)/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-(--brand-primary) shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-(--brand-primary) shrink-0" />
                <span>{settings.businessHoursText}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-(--brand-primary) shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-(--brand-primary) shrink-0" />
                <span>{settings.instagram}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-(--brand-primary) mb-3 uppercase tracking-wider">
              Políticas & Acesso
            </h4>
            <p className="text-xs text-(--brand-text)/60 leading-relaxed mb-3">
              {settings.cancellationPolicy}
            </p>
            <div className="flex items-center gap-2 text-xs text-(--brand-text)/70 mb-3">
              <CreditCard className="w-4 h-4 text-(--brand-primary)" />
              <span>Aceitamos Pix, cartão de crédito, cartão de débito e dinheiro.</span>
            </div>
            <div className="mt-6 pt-5 border-t border-(--brand-text)/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--brand-primary) mb-1">Área da equipe</p>
              <p className="text-xs text-(--brand-text)/60 leading-relaxed mb-3">
                {brand.staffAreaText || 'Acesso para profissionais e administração do salão gerenciarem agendamentos e serviços.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/profissional"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-(--brand-accent)/40 text-(--brand-primary) hover:bg-(--brand-accent) hover:text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sou profissional
                </a>
                <a
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-(--brand-text)/20 text-(--brand-text)/70 hover:bg-(--brand-text) hover:text-white text-xs font-semibold transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Administração
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp booking launcher */}
      <div className="fixed bottom-20 right-4 z-20">
        <button
          type="button" onClick={() => onOpenBookingModal()}
          className="px-4 py-3 rounded-full bg-(--brand-accent) hover:bg-(--brand-primary) text-white font-semibold text-xs shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
          title="Escolher profissional e agendar"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-semibold">Escolher profissional e agendar</span>
        </button>
      </div>
    </div>
  );
};
