import React, { useState, useEffect } from 'react';
import { User, Appointment, Professional, Service, Client } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  Sparkles,
  Plus,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Tag
} from 'lucide-react';

interface DashboardOverviewProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onOpenNewBooking: () => void;
  onOpenNewClient: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentUser,
  onNavigateTab,
  onOpenNewBooking,
  onOpenNewClient
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const load = () => {
      setAppointments(StorageService.getAppointments());
      setProfessionals(StorageService.getProfessionals());
      setClients(StorageService.getClients());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter appointments based on role & user
  let filteredApts = appointments;
  if (currentUser.role === 'profissional' && currentUser.professionalId) {
    filteredApts = appointments.filter(a => a.professionalId === currentUser.professionalId);
  }

  const todayApts = filteredApts.filter(a => a.date === todayStr && a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking');
  const pendingConfirmations = filteredApts.filter(a => a.status === 'aguardando_confirmacao');

  // Revenue Calculations
  const calcRevenueForProf = (profId?: string) => {
    let list = appointments.filter(a => a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking');
    if (profId) list = list.filter(a => a.professionalId === profId);
    return list.reduce((acc, a) => acc + (a.totalPrice - (a.discountPrice || 0)), 0);
  };

  const totalConsolidatedRevenue = calcRevenueForProf();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
            Painel Geral LEV COWORKING BEAUTY
          </span>
          <h1 className="text-2xl font-serif font-medium text-white mt-1">
            Olá, {currentUser.name}! ✨
          </h1>
          <p className="text-xs text-white/60 mt-1">
            {currentUser.role === 'admin'
              ? 'Visão consolidada das três profissionais (Elisangela, Talitha e Nayara) com controle financeiro individual por MEI.'
              : `Atendimento profissional individual - ${currentUser.name}`}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewBooking}
            className="px-4 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>

          <button
            onClick={onOpenNewClient}
            className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-[#c4b491]" />
            Cadastrar Cliente
          </button>

          <button
            onClick={() => onNavigateTab('servicos')}
            className="px-4 py-2.5 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/30 hover:bg-[#c4b491]/20 text-[#c4b491] font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4 text-[#c4b491]" />
            Serviços & Preços
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Appointments */}
        <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xs">
          <div className="flex items-center justify-between text-[#c4b491] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Atendimentos Hoje</span>
            <Calendar className="w-4 h-4 text-[#c4b491]" />
          </div>
          <span className="text-2xl font-serif font-bold text-white block">
            {todayApts.length}
          </span>
          <span className="text-[11px] text-white/60 mt-1 block">
            {todayApts.filter(a => a.status === 'concluido').length} concluído(s)
          </span>
        </div>

        {/* Metric 2: Pending Confirmations */}
        <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xs">
          <div className="flex items-center justify-between text-[#c4b491] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmações Pendentes</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-serif font-bold text-white block">
            {pendingConfirmations.length}
          </span>
          <span className="text-[11px] text-white/60 mt-1 block">
            Aguardando sinal ou envio de mensagem
          </span>
        </div>

        {/* Metric 3: Total Registered Clients */}
        <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xs">
          <div className="flex items-center justify-between text-[#c4b491] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clientes</span>
            <Users className="w-4 h-4 text-[#c4b491]" />
          </div>
          <span className="text-2xl font-serif font-bold text-white block">
            {clients.length}
          </span>
          <span className="text-[11px] text-white/60 mt-1 block">
            Base ativa do coworking
          </span>
        </div>

        {/* Metric 4: Financial Summary (MEI Privacy Aware) */}
        <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xs">
          <div className="flex items-center justify-between text-[#c4b491] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {currentUser.role === 'admin' ? 'Faturamento Total (MEIs)' : 'Seu Faturamento'}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-serif font-bold text-[#c4b491] block">
            {currentUser.role === 'admin'
              ? formatCurrency(totalConsolidatedRevenue)
              : formatCurrency(calcRevenueForProf(currentUser.professionalId))}
          </span>
          <span className="text-[11px] text-white/60 mt-1 block">
            Controle separado por MEI individual
          </span>
        </div>
      </div>

      {/* MEI Separation Breakdown for Admin */}
      {currentUser.role === 'admin' && (
        <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-white">
              Desempenho por MEI Individual
            </h2>
            <button
              onClick={() => onNavigateTab('financeiro')}
              className="text-xs text-[#c4b491] font-semibold hover:underline flex items-center gap-1"
            >
              Ver Detalhes Financeiros <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {professionals.map(p => {
              const profApts = appointments.filter(a => a.professionalId === p.id && a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking');
              const revenue = profApts.reduce((acc, a) => acc + a.totalPrice, 0);

              return (
                <div key={p.id} className="p-4 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">{p.name}</span>
                    <span className="text-[10px] text-[#c4b491] block">{p.title} ({p.meiName})</span>
                    <span className="text-[11px] text-white/60 mt-1 block">{profApts.length} atendimento(s)</span>
                  </div>

                  <span className="font-serif font-bold text-sm text-[#c4b491]">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Schedule Table / Cards */}
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-white">
              Agenda do Dia ({formatDateBR(todayStr)})
            </h2>
            <p className="text-xs text-white/60">Próximos atendimentos agendados</p>
          </div>

          <button
            onClick={() => onNavigateTab('agenda')}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] text-white/80 border border-white/10 hover:bg-white/[0.08] text-xs font-medium transition-colors flex items-center gap-1"
          >
            Ver Agenda Completa <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayApts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <Calendar className="w-10 h-10 text-[#c4b491]/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Nenhum atendimento para hoje</p>
            <p className="text-xs text-white/60 mt-1">
              Clique em "Novo Agendamento" para incluir uma cliente na pauta.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayApts.map(apt => (
              <div
                key={apt.id}
                onClick={() => onNavigateTab('agenda')}
                className="p-3.5 rounded-xl border border-white/10 bg-[#050505] hover:border-[#c4b491] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-[#c4b491]/15 border border-[#c4b491]/30 text-[#c4b491] font-bold text-xs text-center shrink-0">
                    {apt.startTime}
                  </div>

                  <div>
                    <span className="font-semibold text-xs text-white block">{apt.clientName}</span>
                    <span className="text-[11px] text-white/60">
                      {apt.serviceNames.join(', ')} • <strong>{apt.professionalName}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${
                    apt.status === 'confirmado' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' :
                    apt.status === 'cliente_presente' ? 'bg-blue-950/80 text-blue-300 border-blue-800' :
                    'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}>
                    {apt.status.replace('_', ' ').toUpperCase()}
                  </span>

                  <span className="font-serif font-bold text-xs text-[#c4b491]">
                    {formatCurrency(apt.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
