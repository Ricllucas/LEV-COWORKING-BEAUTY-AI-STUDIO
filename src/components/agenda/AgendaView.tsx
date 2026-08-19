import React, { useState, useEffect } from 'react';
import { Appointment, Professional, Service, User, ScheduleBlock, AppointmentStatus, PaymentStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDateBR, generateWhatsAppMessage, buildWhatsAppLink } from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  Clock,
  Filter,
  Plus,
  Search,
  User as UserIcon,
  X,
  Check,
  AlertCircle,
  MessageCircle,
  DollarSign,
  Lock,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface AgendaViewProps {
  currentUser: User;
  onOpenNewBooking: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ currentUser, onOpenNewBooking }) => {
  const [viewMode, setViewMode] = useState<'salon' | 'list'>('salon');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);

  // Selected Appointment Modal
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // Modals
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');

  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [blockProfId, setBlockProfId] = useState<string>(professionals[0]?.id || 'prof_elisangela');
  const [blockDate, setBlockDate] = useState<string>(selectedDate);
  const [blockStart, setBlockStart] = useState<string>('12:00');
  const [blockEnd, setBlockEnd] = useState<string>('13:00');
  const [blockTitle, setBlockTitle] = useState<string>('Bloqueio / Intervalo');

  useEffect(() => {
    const load = () => {
      setAppointments(StorageService.getAppointments());
      setProfessionals(StorageService.getProfessionals());
      setServices(StorageService.getServices());
      setBlocks(StorageService.getScheduleBlocks());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  // Filter logic
  const filteredAppointments = appointments.filter(apt => {
    if (selectedProfFilter !== 'todas' && apt.professionalId !== selectedProfFilter) return false;
    if (statusFilter !== 'todos' && apt.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchClient = apt.clientName.toLowerCase().includes(q);
      const matchService = apt.serviceNames.some(s => s.toLowerCase().includes(q));
      if (!matchClient && !matchService) return false;
    }

    if (viewMode === 'salon') {
      return apt.date === selectedDate;
    }

    return true;
  });

  const handleStatusChange = (aptId: string, newStatus: AppointmentStatus) => {
    const apt = StorageService.getAppointmentById(aptId);
    if (apt) {
      apt.status = newStatus;
      apt.updatedAt = new Date().toISOString();
      StorageService.saveAppointment(apt);
      setSelectedApt({ ...apt });
    }
  };

  const handleRecordPayment = (aptId: string, amount: number, method: any) => {
    const apt = StorageService.getAppointmentById(aptId);
    if (apt) {
      StorageService.savePaymentRecord({
        id: "pay_" + Date.now(),
        appointmentId: apt.id,
        professionalId: apt.professionalId,
        clientId: apt.clientId,
        clientName: apt.clientName,
        amount,
        method,
        type: apt.depositPaid === 0 ? 'sinal' : 'restante',
        paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        receivedBy: currentUser.name
      });
      const updated = StorageService.getAppointmentById(aptId);
      if (updated) setSelectedApt(updated);
    }
  };

  const handleSaveReschedule = () => {
    if (!selectedApt || !rescheduleDate || !rescheduleTime) return;

    // Calculate new end time
    const [h, m] = rescheduleTime.split(':').map(Number);
    const endMin = h * 60 + m + selectedApt.totalDurationMinutes;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    StorageService.rescheduleAppointment(selectedApt.id, rescheduleDate, rescheduleTime, newEndTime, rescheduleReason);
    setIsRescheduleOpen(false);
    setSelectedApt(null);
  };

  const handleSaveCancellation = () => {
    if (!selectedApt || !cancelReason) {
      alert("Informe o motivo do cancelamento.");
      return;
    }
    StorageService.cancelAppointment(selectedApt.id, cancelReason, currentUser.role === 'cliente');
    setIsCancelOpen(false);
    setSelectedApt(null);
  };

  const handleSaveBlock = () => {
    if (!blockProfId || !blockDate || !blockStart || !blockEnd) return;
    StorageService.saveScheduleBlock({
      id: "blk_" + Date.now(),
      professionalId: blockProfId,
      date: blockDate,
      startTime: blockStart,
      endTime: blockEnd,
      title: blockTitle
    });
    setIsBlockModalOpen(false);
  };

  const changeDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
    setBlockDate(date.toISOString().split('T')[0]);
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const scheduleStartMinutes = 8 * 60;
  const scheduleEndMinutes = 20 * 60;
  const slotMinutes = 30;
  const slotHeight = 72;
  const scheduleSlots = Array.from(
    { length: (scheduleEndMinutes - scheduleStartMinutes) / slotMinutes },
    (_, index) => scheduleStartMinutes + index * slotMinutes
  );
  const visibleProfessionals = selectedProfFilter === 'todas'
    ? professionals
    : professionals.filter(professional => professional.id === selectedProfFilter);
  const scheduleAppointments = filteredAppointments.filter(appointment =>
    !['cancelado_cliente', 'cancelado_coworking'].includes(appointment.status)
  );

  const statusLabel: Record<AppointmentStatus, string> = {
    aguardando_confirmacao: 'Aguardando',
    confirmado: 'Confirmado',
    cliente_presente: 'Cliente presente',
    em_atendimento: 'Em atendimento',
    concluido: 'Concluído',
    reagendamento_solicitado: 'Reagendamento solicitado',
    reagendado: 'Reagendado',
    cancelado_cliente: 'Cancelado pela cliente',
    cancelado_coworking: 'Cancelado pela LEV',
    nao_compareceu: 'Não compareceu'
  };

  const appointmentTone = (status: AppointmentStatus) => {
    if (status === 'confirmado') return 'border-emerald-400/60 bg-emerald-950/95 text-emerald-50';
    if (status === 'cliente_presente' || status === 'em_atendimento') return 'border-sky-400/60 bg-sky-950/95 text-sky-50';
    if (status === 'concluido') return 'border-stone-400/50 bg-stone-800/95 text-stone-100';
    return 'border-amber-400/60 bg-amber-950/95 text-amber-50';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & View Controls */}
      <div className="p-5 bg-white rounded-2xl border border-[#E6D7C3] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-widest block">
            Gestão de Horários
          </span>
          <h1 className="text-2xl font-serif font-medium text-[#3D312A] mt-1">
            Agenda do Coworking
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-[#F5EFE6] p-1 rounded-xl border border-[#E6D7C3] flex items-center gap-1">
            {[
              { id: 'salon', label: 'Agenda LEV' },
              { id: 'list', label: 'Lista' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === v.id ? 'bg-white text-[#3D312A] shadow-2xs' : 'text-[#6B574B]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#c4b491]/50 text-white/80 font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-[#c4b491]" />
            Bloquear Horário
          </button>

          <button
            onClick={onOpenNewBooking}
            className="px-4 py-2 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Date Navigator & Filters Bar */}
      <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl border border-white/10 bg-[#050505] text-white/70 hover:text-[#c4b491] hover:border-[#c4b491]/40"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs font-semibold text-white focus:outline-hidden focus:border-[#c4b491]"
          />
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl border border-white/10 bg-[#050505] text-white/70 hover:text-[#c4b491] hover:border-[#c4b491]/40"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-serif font-medium text-[#c4b491] hidden sm:inline">
            {formatDateBR(selectedDate)}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Professional Filter */}
          <select
            value={selectedProfFilter}
            onChange={e => setSelectedProfFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-hidden"
          >
            <option value="todas">Todas as Profissionais</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-hidden"
          >
            <option value="todos">Todos os Status</option>
            <option value="aguardando_confirmacao">Aguardando Confirmação</option>
            <option value="confirmado">Confirmado</option>
            <option value="cliente_presente">Cliente Presente</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado_cliente">Cancelado pela Cliente</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#c4b491] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Agenda LEV: horários alinhados e uma coluna por profissional */}
      {viewMode === 'salon' ? (
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-serif font-semibold text-white">Agenda LEV · {formatDateBR(selectedDate)}</p>
              <p className="text-[11px] text-white/45 mt-0.5">Deslize horizontalmente para visualizar todas as profissionais.</p>
            </div>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
                setBlockDate(today);
              }}
              className="px-3 py-1.5 rounded-lg border border-[#c4b491]/30 text-[#c4b491] text-xs hover:bg-[#c4b491]/10"
            >
              Hoje
            </button>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <div
              className="grid min-w-max"
              style={{
                gridTemplateColumns: `72px repeat(${Math.max(visibleProfessionals.length, 1)}, minmax(230px, 1fr))`,
                minWidth: 72 + Math.max(visibleProfessionals.length, 1) * 230,
                width: '100%'
              }}
            >
              <div className="sticky left-0 z-30 h-[74px] bg-[#0a0a0a] border-r border-b border-white/10 flex items-end justify-center pb-3 text-[10px] text-white/40 uppercase tracking-wider">
                Horário
              </div>
              {visibleProfessionals.map(professional => (
                <div key={professional.id} className="h-[74px] border-r border-b border-white/10 bg-[#0d0d0d] px-4 py-3 text-center">
                  <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: professional.color }} />
                  <p className="font-serif font-semibold text-sm text-white">{professional.name}</p>
                  <p className="text-[10px] text-white/45 truncate">{professional.title}</p>
                </div>
              ))}

              <div className="sticky left-0 z-20 bg-[#0a0a0a] border-r border-white/10">
                {scheduleSlots.map(minutes => {
                  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
                  const minute = String(minutes % 60).padStart(2, '0');
                  return (
                    <div key={minutes} className="h-[72px] border-b border-white/10 pr-2 pt-2 text-right text-[11px] font-semibold text-[#c4b491]">
                      {hour}:{minute}
                    </div>
                  );
                })}
              </div>

              {visibleProfessionals.map(professional => {
                const professionalAppointments = scheduleAppointments.filter(appointment => appointment.professionalId === professional.id);
                const professionalBlocks = blocks.filter(block => block.professionalId === professional.id && block.date === selectedDate);
                return (
                  <div
                    key={professional.id}
                    className="relative border-r border-white/10 bg-[#070707]"
                    style={{ height: scheduleSlots.length * slotHeight }}
                  >
                    {scheduleSlots.map(minutes => (
                      <div key={minutes} className="h-[72px] border-b border-white/[0.08]" />
                    ))}

                    {professionalBlocks.map(block => {
                      const top = ((timeToMinutes(block.startTime) - scheduleStartMinutes) / slotMinutes) * slotHeight;
                      const height = Math.max(((timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / slotMinutes) * slotHeight, 36);
                      return (
                        <div
                          key={block.id}
                          className="absolute left-1.5 right-1.5 z-10 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-[10px] text-white/55 overflow-hidden"
                          style={{ top, height }}
                        >
                          <Lock className="w-3 h-3 inline mr-1" />{block.title}
                        </div>
                      );
                    })}

                    {professionalAppointments.map(appointment => {
                      const top = ((timeToMinutes(appointment.startTime) - scheduleStartMinutes) / slotMinutes) * slotHeight;
                      const height = Math.max((appointment.totalDurationMinutes / slotMinutes) * slotHeight - 4, 48);
                      return (
                        <button
                          key={appointment.id}
                          onClick={() => setSelectedApt(appointment)}
                          className={`absolute left-1.5 right-1.5 z-20 rounded-xl border px-2.5 py-2 text-left overflow-hidden shadow-lg transition-transform hover:scale-[1.01] ${appointmentTone(appointment.status)}`}
                          style={{ top: top + 2, height }}
                          title={`${appointment.clientName} · ${appointment.serviceNames.join(', ')}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs leading-tight truncate">{appointment.clientName}</span>
                            <span className="text-[9px] opacity-70 whitespace-nowrap">{appointment.startTime}–{appointment.endTime}</span>
                          </div>
                          <p className="mt-1 text-[10px] leading-tight opacity-85 line-clamp-2">{appointment.serviceNames.join(', ')}</p>
                          {height >= 76 && <p className="mt-1 text-[9px] opacity-60">{statusLabel[appointment.status]} · {appointment.totalDurationMinutes} min</p>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 shadow-2xs min-h-[400px]">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="w-12 h-12 text-[#c4b491]/40 mx-auto mb-3" />
              <p className="text-base font-serif font-medium text-white">Nenhum agendamento para a seleção atual</p>
              <p className="text-xs text-white/60 mt-1">Utilize “Novo Agendamento” ou altere os filtros.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map(appointment => {
                const professional = professionals.find(item => item.id === appointment.professionalId);
                return (
                  <button
                    key={appointment.id}
                    onClick={() => setSelectedApt(appointment)}
                    className="w-full p-4 rounded-xl border border-white/10 bg-[#050505] hover:border-[#c4b491] transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-2 rounded-xl text-xs font-bold text-black text-center" style={{ backgroundColor: professional?.color || '#c4b491' }}>
                        {appointment.startTime}<span className="block text-[9px] font-normal">{appointment.endTime}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">{appointment.clientName}</p>
                        <p className="text-xs text-white/55 mt-0.5">{appointment.serviceNames.join(', ')} · {appointment.professionalName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#c4b491]">{statusLabel[appointment.status]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-white">
            <button
              onClick={() => setSelectedApt(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/70"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-semibold text-[#c4b491] uppercase tracking-widest block mb-1">
              Detalhes do Agendamento
            </span>
            <h2 className="text-xl font-serif font-semibold text-white mb-4">
              {selectedApt.clientName}
            </h2>

            {/* Info Cards */}
            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 bg-[#050505] rounded-xl border border-white/10 space-y-1.5">
                <div className="flex justify-between text-white/60">
                  <span>Telefone/WhatsApp:</span>
                  <span className="font-medium text-white">{selectedApt.clientPhone}</span>
                </div>
                <div className="flex justify-between gap-4 text-white/60">
                  <span>E-mail:</span>
                  <span className="font-medium text-white text-right break-all">{selectedApt.clientEmail || 'Não informado'}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Profissional:</span>
                  <span className="font-semibold text-white">{selectedApt.professionalName}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Serviço(s):</span>
                  <span className="font-semibold text-white">{selectedApt.serviceNames.join(', ')}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Data e Horário:</span>
                  <span className="font-semibold text-white">{formatDateBR(selectedApt.date)} das {selectedApt.startTime} às {selectedApt.endTime}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Duração:</span>
                  <span className="font-semibold text-white">{selectedApt.totalDurationMinutes} minutos</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Status do Atendimento:</span>
                  <span className="font-bold text-[#c4b491] uppercase">{selectedApt.status.replace('_', ' ')}</span>
                </div>
                {selectedApt.notes && (
                  <div className="pt-2 mt-2 border-t border-white/10 text-white/60">
                    <span className="block mb-1">Observações:</span>
                    <p className="text-white whitespace-pre-wrap">{selectedApt.notes}</p>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-white/10 space-y-1 text-[10px] text-white/40">
                  <div className="flex justify-between gap-4">
                    <span>Agendamento LEV:</span>
                    <span className="text-right break-all">{selectedApt.id}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Última atualização:</span>
                    <span className="text-right">
                      {new Date(selectedApt.updatedAt || selectedApt.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Status Box */}
              <div className="p-3 bg-[#050505] rounded-xl border border-white/10 space-y-1.5">
                <div className="flex justify-between font-bold text-sm text-white">
                  <span>Valor Total:</span>
                  <span>{formatCurrency(selectedApt.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Sinal Pago:</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(selectedApt.depositPaid)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Saldo Restante:</span>
                  <span className="text-rose-400 font-semibold">{formatCurrency(selectedApt.remainingPrice)}</span>
                </div>
              </div>

              {/* Reschedule History */}
              {selectedApt.rescheduleHistory && selectedApt.rescheduleHistory.length > 0 && (
                <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800 text-amber-200 space-y-1">
                  <span className="font-semibold block">Histórico de Reagendamentos:</span>
                  {selectedApt.rescheduleHistory.map(h => (
                    <p key={h.id} className="text-[11px]">
                      • Alterado de {formatDateBR(h.previousDate)} {h.previousTime} para {formatDateBR(h.newDate)} {h.newTime} por {h.changedBy}.
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#c4b491] block uppercase tracking-wider">
                Ações do Atendimento:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedApt.id, 'confirmado')}
                  className="py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/80 text-emerald-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Confirmar
                </button>

                <button
                  onClick={() => handleStatusChange(selectedApt.id, 'cliente_presente')}
                  className="py-2 px-3 rounded-xl bg-blue-950/60 border border-blue-800 hover:bg-blue-900/80 text-blue-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  Cliente Chegou
                </button>

                <button
                  onClick={() => handleStatusChange(selectedApt.id, 'concluido')}
                  className="py-2 px-3 rounded-xl bg-stone-800 border border-stone-600 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  Finalizar Atendimento
                </button>

                <button
                  onClick={() => handleRecordPayment(selectedApt.id, selectedApt.remainingPrice || 50, 'pix')}
                  className="py-2 px-3 rounded-xl bg-amber-950/60 border border-amber-800 hover:bg-amber-900/80 text-amber-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Registrar Pagamento
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <a
                  href={buildWhatsAppLink(
                    selectedApt.clientPhone,
                    generateWhatsAppMessage('confirmacao', {
                      clientName: selectedApt.clientName,
                      professionalName: selectedApt.professionalName,
                      serviceName: selectedApt.serviceNames.join(', '),
                      date: selectedApt.date,
                      time: selectedApt.startTime
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>

                <button
                  onClick={() => {
                    setRescheduleDate(selectedApt.date);
                    setRescheduleTime(selectedApt.startTime);
                    setIsRescheduleOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-medium hover:bg-white/[0.08] transition-colors"
                >
                  Reagendar
                </button>

                <button
                  onClick={() => setIsCancelOpen(true)}
                  className="py-2 px-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-medium hover:bg-rose-900/80 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full border border-white/10 p-6 shadow-2xl space-y-4 text-white">
            <h3 className="font-serif text-lg font-semibold text-white">
              Reagendar Atendimento
            </h3>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Nova Data</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Novo Horário</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={e => setRescheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Motivo do Reagendamento</label>
              <textarea
                rows={2}
                placeholder="Ex: Imprevisto da cliente..."
                value={rescheduleReason}
                onChange={e => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRescheduleOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/10 text-white/80"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-4 py-2 rounded-xl text-xs bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold"
              >
                Salvar Reagendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelOpen && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full border border-white/10 p-6 shadow-2xl space-y-4 text-white">
            <h3 className="font-serif text-lg font-semibold text-white">
              Cancelar Atendimento
            </h3>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Motivo do Cancelamento *</label>
              <textarea
                rows={3}
                required
                placeholder="Informe a razão do cancelamento..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/10 text-white/80"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveCancellation}
                className="px-4 py-2 rounded-xl text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Block Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full border border-white/10 p-6 shadow-2xl space-y-4 text-white">
            <h3 className="font-serif text-lg font-semibold text-white">
              Bloquear Horário na Agenda
            </h3>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Profissional</label>
              <select
                value={blockProfId}
                onChange={e => setBlockProfId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              >
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Data</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Título / Razão</label>
                <input
                  type="text"
                  value={blockTitle}
                  onChange={e => setBlockTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Início</label>
                <input
                  type="time"
                  value={blockStart}
                  onChange={e => setBlockStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Fim</label>
                <input
                  type="time"
                  value={blockEnd}
                  onChange={e => setBlockEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/10 text-white/80"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBlock}
                className="px-4 py-2 rounded-xl text-xs bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold"
              >
                Salvar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

