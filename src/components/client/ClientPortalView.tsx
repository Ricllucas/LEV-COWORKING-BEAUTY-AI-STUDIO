import React, { useState, useEffect } from 'react';
import { User, Appointment, Professional, Service } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDateBR, buildWhatsAppLink } from '../../utils/formatters';
import { ProfessionalAvatar } from '../common/ProfessionalAvatar';
import { Calendar, Clock, User as UserIcon, Sparkles, MessageCircle, CheckCircle2, AlertCircle, Phone, Star, ArrowRight } from 'lucide-react';

interface ClientPortalViewProps {
  currentUser: User;
  onOpenBooking: (profId?: string, serviceId?: string) => void;
  onOpenAuthModal: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  currentUser,
  onOpenBooking,
  onOpenAuthModal
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'explorar' | 'meus-agendamentos'>('explorar');

  useEffect(() => {
    const loadData = () => {
      const allApts = StorageService.getAppointments();
      const profs = StorageService.getProfessionals();
      const srvs = StorageService.getServices();

      // Filter appointments belonging to this client (by email, phone, or name)
      const clientApts = allApts.filter(a => {
        if (currentUser.clientId && a.clientId === currentUser.clientId) return true;
        if (currentUser.email && a.clientEmail?.toLowerCase() === currentUser.email.toLowerCase()) return true;
        if (currentUser.phone && a.clientPhone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) return true;
        return false;
      });

      setAppointments(clientApts);
      setProfessionals(profs);
      setServices(srvs);
    };

    loadData();
    return StorageService.subscribeStorage(loadData);
  }, [currentUser]);

  const upcomingApts = appointments.filter(a => a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking');
  const pastApts = appointments.filter(a => a.status === 'concluido' || a.status === 'cancelado_cliente' || a.status === 'cancelado_coworking');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-white">
      {/* Welcome Banner for Logged Client */}
      <div className="p-6 bg-gradient-to-r from-[#0a0a0a] via-[#121212] to-[#0a0a0a] rounded-3xl border border-[#c4b491]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c4b491]/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#c4b491] px-3 py-1 rounded-full bg-[#c4b491]/10 border border-[#c4b491]/20">
            <Sparkles className="w-3.5 h-3.5" /> Área Exclusiva da Cliente
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-white">
            Olá, <span className="text-[#c4b491]">{currentUser.name || 'Cliente'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
            Escolha sua profissional favorita, consulte agendas e serviços disponíveis ou gerencie seus agendamentos em um só lugar.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenBooking()}
            className="px-5 py-3 rounded-2xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-md flex items-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-[#050505] group-hover:rotate-12 transition-transform" />
            Novo Agendamento
          </button>

          {currentUser.id === 'visitor_guest' && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-[#c4b491] text-white text-xs font-semibold transition-all"
            >
              Criar Conta / Entrar
            </button>
          )}
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex bg-[#050505] p-1.5 rounded-2xl border border-white/10 max-w-md">
        <button
          onClick={() => setActiveSubTab('explorar')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'explorar'
              ? 'bg-[#c4b491] text-[#050505] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Profissionais & Agendas
        </button>

        <button
          onClick={() => setActiveSubTab('meus-agendamentos')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 relative ${
            activeSubTab === 'meus-agendamentos'
              ? 'bg-[#c4b491] text-[#050505] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Meus Agendamentos
          {upcomingApts.length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-black text-[10px] font-bold rounded-full">
              {upcomingApts.length}
            </span>
          )}
        </button>
      </div>

      {/* SUBTAB CONTENT: EXPLORAR PROFISSIONAIS E SERVIÇOS */}
      {activeSubTab === 'explorar' && (
        <div className="space-y-8">
          {/* Professionals list */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
                Equipe Especializada
              </span>
              <h2 className="text-xl font-serif text-white font-medium mt-1">
                Escolha a Profissional para seu Atendimento
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {professionals.map(prof => (
                <div
                  key={prof.id}
                  className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 shadow-sm hover:border-[#c4b491]/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <ProfessionalAvatar
                        src={prof.avatarUrl}
                        name={prof.name}
                        sizeClassName="w-16 h-16"
                        textClassName="text-xl"
                      />
                      <div>
                        <h3 className="font-serif font-semibold text-lg text-white">{prof.name}</h3>
                        <span className="text-xs font-medium text-[#c4b491] block">{prof.title}</span>
                        <span className="text-[10px] text-white/50 block mt-0.5">{prof.meiName}</span>
                      </div>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed">
                      {prof.bio}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                    <button
                      onClick={() => onOpenBooking(prof.id)}
                      className="w-full py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" />
                      Agendar com {prof.name}
                    </button>

                    <a
                      href={`https://wa.me/${StorageService.getSettings().whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white/80 font-medium text-xs transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Dúvidas no WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services catalogue */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
                Catálogo Geral de Serviços
              </span>
              <h2 className="text-xl font-serif text-white font-medium mt-1">
                Serviços Disponíveis para Agendamento Online
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.filter(s => s.active && s.onlineBookingEnabled).map(service => (
                <div
                  key={service.id}
                  className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col justify-between hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-[#c4b491] uppercase tracking-wider block">
                          {service.professionalName} • {service.category}
                        </span>
                        <h3 className="font-serif text-base font-semibold text-white mt-0.5">
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

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[#c4b491] flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.durationMinutes} min
                    </span>

                    <button
                      onClick={() => onOpenBooking(service.professionalId, service.id)}
                      className="px-4 py-1.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      Agendar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: MEUS AGENDAMENTOS */}
      {activeSubTab === 'meus-agendamentos' && (
        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
              Seus Atendimentos Registrados
            </span>
            <h2 className="text-xl font-serif text-white font-medium mt-1">
              Próximos Agendamentos & Histórico
            </h2>
          </div>

          {upcomingApts.length === 0 ? (
            <div className="p-8 text-center bg-[#0a0a0a] rounded-2xl border border-white/10 space-y-3">
              <Calendar className="w-12 h-12 text-[#c4b491]/40 mx-auto" />
              <h3 className="font-serif text-base text-white">Nenhum agendamento futuro encontrado</h3>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                Você ainda não possui horários marcados. Escolha uma profissional e agende seu próximo procedimento!
              </p>
              <button
                onClick={() => onOpenBooking()}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#c4b491] text-[#050505] font-semibold text-xs transition-colors"
              >
                Agendar Procedimento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingApts.map(apt => (
                <div
                  key={apt.id}
                  className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#c4b491]" />
                      <span className="font-serif font-semibold text-sm text-white">
                        {formatDateBR(apt.date)} às {apt.startTime}
                      </span>
                    </div>

                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#c4b491]/20 text-[#c4b491] border border-[#c4b491]/30 font-semibold uppercase">
                      {apt.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-white/50 block text-[10px] uppercase tracking-wider">Profissional</span>
                      <span className="font-semibold text-white block">{apt.professionalName}</span>
                    </div>

                    <div>
                      <span className="text-white/50 block text-[10px] uppercase tracking-wider">Serviços</span>
                      <span className="font-semibold text-white block">{apt.serviceNames.join(', ')}</span>
                    </div>

                    <div>
                      <span className="text-white/50 block text-[10px] uppercase tracking-wider">Valor Total</span>
                      <span className="font-serif font-bold text-[#c4b491] block">{formatCurrency(apt.totalPrice)}</span>
                      {apt.depositPaid > 0 && (
                        <span className="text-[10px] text-emerald-400 block">Sinal pago: {formatCurrency(apt.depositPaid)}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-white/50">
                      Horário estimado de término: {apt.endTime} ({apt.totalDurationMinutes} min)
                    </span>

                    <a
                      href={buildWhatsAppLink(
                        StorageService.getSettings().whatsapp,
                        `Olá! Gostaria de falar sobre o meu agendamento do dia ${formatDateBR(apt.date)} às ${apt.startTime} com a profissional ${apt.professionalName}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Falar sobre Agendamento no WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
