import React, { useState, useEffect, useMemo } from 'react';
import { Logo } from '../brand/Logo';
import { Professional, Service, CoworkingSettings, Review } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';
import { getSpecialtyIcon } from '../common/SpecialtyIcons';
import { ProfessionalAvatar } from '../common/ProfessionalAvatar';
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
  Camera
} from 'lucide-react';

interface PublicLandingPageProps {
  onOpenBookingModal: (profId?: string, serviceId?: string) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onOpenBookingModal }) => {
  const [currentUser, setCurrentUser] = useState(() => StorageService.getCurrentUser());
  const [settings, setSettings] = useState<CoworkingSettings>(() => StorageService.getSettings());
  const [professionals, setProfessionals] = useState<Professional[]>(() => StorageService.getProfessionals());
  const [services, setServices] = useState<Service[]>(() => StorageService.getServices());
  const [reviews, setReviews] = useState<Review[]>(() => StorageService.getReviews().filter(r => r.approved));
  const [selectedProfCategory, setSelectedProfCategory] = useState<string>('todas');

  const isAdmin = currentUser?.role === 'admin';

  const handleDirectAvatarUpload = async (prof: Professional, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedBase64 = await compressImageToDataUrl(file, 320, 0.78);
      const updatedProf: Professional = {
        ...prof,
        avatarUrl: resizedBase64,
      };
      StorageService.saveProfessional(updatedProf);
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
          setReviews(StorageService.getReviews().filter(r => r.approved));
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

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0e0e0e] via-[#0a0a0a] to-[#050505] pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Ambient Gold Aura Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#c4b491]/10 blur-[120px] rounded-full pointer-events-none -z-0" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block mb-4 p-3 bg-white/[0.02] backdrop-blur-md rounded-2xl shadow-xl border border-[#c4b491]/20 hover:border-[#c4b491]/40 transition-all">
            <Logo size="lg" variant="horizontal" theme="dark" />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-medium text-white mt-4 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-white via-[#f3ebe0] to-[#c4b491] bg-clip-text text-transparent block">
              Sua Beleza Completa: Unhas, Cílios, Sobrancelhas, Maquiagem & Penteados.
            </span>
          </h1>

          <p className="mt-5 max-w-3xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed font-light">
            Do cuidado impecável com <strong className="text-[#c4b491] font-semibold">unhas, cílios e sobrancelhas</strong> à produção completa para momentos especiais, com <strong className="text-[#c4b491] font-semibold">maquiagem, penteados e atendimento para noivas</strong>. Viva uma experiência personalizada com nossas especialistas, em ambientes acolhedores, reservados e cuidadosamente preparados para você.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de agendar um atendimento no LEV Coworking Beauty.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-[#c4b491] via-[#d6c7a7] to-[#b5a37f] hover:from-[#b5a37f] hover:to-[#a3926f] text-[#050505] font-semibold text-sm transition-all shadow-[0_0_25px_rgba(196,180,145,0.25)] flex items-center justify-center gap-2 group hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5 text-[#050505] group-hover:scale-110 transition-transform" />
              Agendar pelo WhatsApp
            </a>
          </div>

          {/* Highlights Badges */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { title: "Atendimento Exclusivo", desc: "Cuidado personalizado em cada detalhe", icon: <Sparkles className="w-4 h-4 text-[#c4b491]" /> },
              { title: "Especialistas LEV", desc: "Elisangela, Talitha e Nayara", icon: <Star className="w-4 h-4 text-[#c4b491]" /> },
              { title: "Agendamento Online 24h", desc: "Agende quando quiser. Atendimentos até as 18h", icon: <Calendar className="w-4 h-4 text-[#c4b491]" /> },
              { title: "Espaço Glamour", desc: "Ambiente reservado e aconchegante", icon: <Heart className="w-4 h-4 text-[#c4b491]" /> }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-[#0d0d0d]/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-[#c4b491]/40 text-left transition-all hover:shadow-[0_0_15px_rgba(196,180,145,0.1)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-[#c4b491]/10 border border-[#c4b491]/20">
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold text-white">{item.title}</span>
                </div>
                <span className="text-[11px] text-[#c4b491] font-medium block">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ambiance Gallery */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest text-[#c4b491] uppercase">
            Nosso Espaço
          </span>
          <h2 className="text-2xl font-serif text-white font-medium mt-1">
            Ambientes Individuais, Atendimento com Privacidade
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              url: "/spaces/sala-elisangela-nayara-final.jpg",
              title: "Salas Individuais de Nail Design",
              desc: "Elisangela e Nayara atendem em salas distintas, com privacidade e cuidado"
            },
            {
              url: "/spaces/private-makeup-room.webp?v=real-room-2",
              title: "Sala Exclusiva de Maquiagem",
              desc: "Atendimento personalizado com Talitha em um ambiente próprio e reservado"
            },
            {
              url: "/spaces/reception-welcome.webp",
              title: "Recepção LEV Beauty",
              desc: "Um espaço acolhedor para receber você com atenção e cuidado"
            }
          ].map((img, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden shadow-xs border border-white/10 h-60">
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 text-white">
                <span className="font-medium text-sm font-serif">{img.title}</span>
                <span className="text-xs text-white/60 font-light mt-0.5">{img.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spa de Noivas & Produção VIP Experience Banner */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#12100d] via-[#1a1610] to-[#0a0a0a] border border-[#c4b491]/40 p-6 sm:p-10 overflow-hidden shadow-[0_0_50px_rgba(196,180,145,0.15)]">
          {/* Decorative Gold Sparkles Background */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#c4b491]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#c4b491]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c4b491]/20 border border-[#c4b491]/40 text-[#c4b491] text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#c4b491]" />
                <span>Experiência Exclusiva LEV</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif font-semibold text-white leading-tight">
                Beleza para <span className="text-[#c4b491] italic">Noivas & Momentos Especiais</span>
              </h2>

              <p className="text-sm text-white/80 leading-relaxed font-light">
                Conte com especialistas dedicadas a valorizar sua beleza em cada etapa. Reúna cuidados personalizados e uma produção completa para viver seu momento com tranquilidade, confiança e elegância:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { title: "Elisangela — Nail Designer", desc: "Manicure, pedicure e cuidados personalizados para mãos e pés impecáveis." },
                  { title: "Talitha — Maquiagem", desc: "Maquiagem personalizada para diferentes ocasiões, com atendimento em sala exclusiva." },
                  { title: "Nayara — Nail Designer", desc: "Cuidados com as unhas em atendimento individual, realizado em sua própria sala." },
                  { title: "Produções Integradas", desc: "Experiências personalizadas para noivas, formandas e ocasiões especiais." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-[#c4b491] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                      <p className="text-[11px] text-white/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenBookingModal()}
                  className="px-7 py-3.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Montar Minha Experiência / Agendar
                </button>

                <a
                  href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de informações sobre o Spa de Noivas e Pacote Completo de Beleza no LEV Beauty!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-white/[0.05] border border-white/15 hover:bg-white/10 text-white font-medium text-xs transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Consultar Produção para Noivas
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-[#c4b491]/30 shadow-2xl group">
                <img
                  src="/spaces/producao-integrada-lev.jpg"
                  alt="Dia de Noiva e Spa no LEV Beauty"
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-5">
                  <span className="text-xs font-serif text-[#c4b491] font-semibold">Produção Integrada LEV Beauty</span>
                  <span className="text-sm font-medium text-white">Sua transformação completa com quem mais entende de beleza.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Section */}
      <section className="py-12 bg-[#0a0a0a] border-y border-white/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold tracking-widest text-[#c4b491] uppercase">
              Profissionais do Coworking
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium mt-1">
              Conheça nossas especialistas
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-xl mx-auto">
              Cada especialista oferece atendimento personalizado, com excelência, cuidado e dedicação em sua área.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {professionals.map(prof => (
              <div
                key={prof.id}
                className="bg-[#050505] rounded-2xl border border-white/10 p-6 shadow-xs hover:border-[#c4b491]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-28 h-28 mx-auto mb-4 group flex items-center justify-center">
                    <ProfessionalAvatar
                      src={prof.avatarUrl}
                      name={prof.name}
                      sizeClassName="w-28 h-28"
                      textClassName="text-3xl"
                    />
                    {isAdmin && (
                      <>
                        <label
                          htmlFor={`avatar-upload-${prof.id}`}
                          className="absolute bottom-0 right-0 p-2 bg-[#c4b491] hover:bg-[#d8c8a5] text-black rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 border-2 border-[#050505] flex items-center justify-center"
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
                    <h3 className="text-lg font-serif font-semibold text-white">
                      {prof.name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-[#c4b491]/15 text-[#c4b491] font-medium text-xs border border-[#c4b491]/30">
                      {getSpecialtyIcon(prof.name + ' ' + prof.title, "w-3.5 h-3.5 text-[#c4b491]")}
                      <span>{prof.title}</span>
                    </div>

                    <p className="text-xs text-white/60 mt-3 leading-relaxed">
                      {prof.bio}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <button
                    onClick={() => onOpenBookingModal(prof.id)}
                    className="w-full py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Agendar com {prof.name}
                  </button>

                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white/80 font-medium text-xs transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
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
          <span className="text-xs font-semibold tracking-widest text-[#c4b491] uppercase">
            Serviços & Procedimentos
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium mt-1">
            Menu de Atendimentos
          </h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedProfCategory('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedProfCategory === 'todas'
                ? 'bg-[#c4b491] text-[#050505] font-semibold shadow-2xs'
                : 'bg-white/[0.03] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white'
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
                  ? 'bg-[#c4b491] text-[#050505] font-semibold shadow-2xs'
                  : 'bg-white/[0.03] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white'
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
              className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 shadow-2xs hover:border-[#c4b491] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[#c4b491] uppercase tracking-wider block mb-1">
                      {service.professionalName} • {service.category}
                    </span>
                    <h3 className="font-serif text-base font-semibold text-white">
                      {service.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-serif font-bold text-[#c4b491]">
                      {service.price <= 0 ? 'Sob consulta' : formatCurrency(service.promotionalPrice || service.price)}
                    </span>
                    {service.promotionalPrice && (
                      <span className="text-xs text-white/40 line-through block">
                        {formatCurrency(service.price)}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-[#c4b491] flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#c4b491]" />
                  Duração: {service.durationMinutes} min
                </span>

                <button
                  onClick={() => onOpenBookingModal(service.professionalId, service.id)}
                  className="px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-[#c4b491] text-white/80 hover:text-[#050505] font-medium text-xs transition-colors flex items-center gap-1"
                >
                  Agendar <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-12 bg-[#0a0a0a] border-t border-white/10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <span className="text-xs font-semibold tracking-widest text-[#c4b491] uppercase">
              Depoimentos de Clientes
            </span>
            <h2 className="text-2xl font-serif text-white font-medium mt-1 mb-8">
              O que dizem sobre nosso espaço
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-[#050505] p-5 rounded-2xl border border-white/10 text-left shadow-2xs">
                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{rev.clientName}</span>
                    <span className="text-[10px] text-[#c4b491]">{rev.professionalName} ({rev.serviceName})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer & Info Section */}
      <footer className="bg-[#050505] border-t border-white/10 text-white/70 py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo size="md" theme="dark" variant="horizontal" />
            <p className="text-xs text-white/60 mt-4 leading-relaxed">
              {settings.slogan}
            </p>
            <p className="text-[11px] text-white/40 mt-2">
              © {new Date().getFullYear()} LEV COWORKING BEAUTY. Todos os direitos reservados.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#c4b491] mb-3 uppercase tracking-wider">
              Localização & Horários
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#c4b491] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c4b491] shrink-0" />
                <span>{settings.businessHoursText}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#c4b491] shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#c4b491] shrink-0" />
                <span>{settings.instagram}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#c4b491] mb-3 uppercase tracking-wider">
              Políticas & Acesso
            </h4>
            <p className="text-xs text-white/60 leading-relaxed mb-3">
              {settings.cancellationPolicy}
            </p>
            <div className="flex items-center gap-2 text-xs text-white/70 mb-3">
              <CreditCard className="w-4 h-4 text-[#c4b491]" />
              <span>Aceitamos Pix, cartão de crédito, cartão de débito e dinheiro.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp booking launcher */}
      <div className="fixed bottom-20 right-4 z-20">
        <a
          href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de agendar um atendimento no LEV Coworking Beauty.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-full bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
          title="Agendar pelo WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-semibold">Agendar pelo WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
