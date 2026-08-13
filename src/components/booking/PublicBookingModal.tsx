import React, { useState, useEffect } from 'react';
import { Professional, Service, Client, Appointment } from '../../types';
import { StorageService } from '../../services/storage';
import { getAvailableSlots, SlotAvailability } from '../../utils/scheduleHelper';
import { formatCurrency, formatDateBR, generateWhatsAppMessage, buildWhatsAppLink } from '../../utils/formatters';
import { getSpecialtyIcon } from '../common/SpecialtyIcons';
import { ProfessionalAvatar } from '../common/ProfessionalAvatar';
import { CloudAppointmentService } from '../../services/cloudAppointments';
import { CloudServiceCatalog } from '../../services/cloudServiceCatalog';
import { X, Calendar, Clock, Check, Sparkles, MessageCircle, AlertCircle, ChevronRight, ChevronLeft, XCircle } from 'lucide-react';

interface PublicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfId?: string;
  initialServiceId?: string;
}

export const PublicBookingModal: React.FC<PublicBookingModalProps> = ({
  isOpen,
  onClose,
  initialProfId,
  initialServiceId
}) => {
  const [step, setStep] = useState<number>(1);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Selection states
  const [selectedProfId, setSelectedProfId] = useState<string>(initialProfId || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialServiceId ? [initialServiceId] : []);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Client Details
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [acceptedPolicy, setAcceptedPolicy] = useState<boolean>(true);

  // Results
  const [availableSlots, setAvailableSlots] = useState<SlotAvailability[]>([]);
  const [onlineAppointments, setOnlineAppointments] = useState<Appointment[]>([]);
  const [confirmedApt, setConfirmedApt] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const profs = StorageService.getProfessionals();
      const srvs = StorageService.getServices();
      setProfessionals(profs);
      setServices(srvs);

      CloudServiceCatalog.load()
        .then(items => {
          StorageService.replaceServices(items);
          setServices(items);
        })
        .catch(error => console.error('Erro ao atualizar serviços do agendamento:', error));

      if (initialProfId) setSelectedProfId(initialProfId);
      if (initialServiceId) {
        setSelectedServiceIds([initialServiceId]);
        setSelectedTime('');
        setStep(3);
      } else {
        setStep(1);
      }

      // Auto-fill logged in user info
      const u = StorageService.getCurrentUser();
      if (u && u.id !== 'visitor_guest') {
        if (u.name) setClientName(u.name);
        if (u.phone) setClientPhone(u.phone);
        if (u.email) setClientEmail(u.email);
      }
    }
  }, [isOpen, initialProfId, initialServiceId]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;
    let active = true;
    CloudAppointmentService.listPublicByDate(selectedDate)
      .then(items => { if (active) setOnlineAppointments(items); })
      .catch(() => { if (active) setOnlineAppointments([]); });
    return () => { active = false; };
  }, [isOpen, selectedDate]);

  // Recalculate available time slots
  useEffect(() => {
    if (selectedProfId && selectedDate && selectedServiceIds.length > 0) {
      const prof = StorageService.getProfessionalById(selectedProfId);
      const allSrvs = StorageService.getServices();
      const selSrvs = allSrvs.filter(s => selectedServiceIds.includes(s.id));
      const localApts = StorageService.getAppointments();
      const existingApts = [...localApts, ...onlineAppointments].filter(
        (apt, index, all) => all.findIndex(item => item.id === apt.id) === index
      );
      const blocks = StorageService.getScheduleBlocks();

      if (prof) {
        const slots = getAvailableSlots(selectedDate, prof, selSrvs, existingApts, blocks);
        setAvailableSlots(slots);
      }
    } else {
      setAvailableSlots([]);
    }
  }, [selectedProfId, selectedDate, selectedServiceIds, onlineAppointments]);

  if (!isOpen) return null;

  const currentProf = professionals.find(p => p.id === selectedProfId);
  const profServices = services.filter(s => s.active && s.onlineBookingEnabled && (!selectedProfId || s.professionalId === selectedProfId));
  const selectedServiceObjects = services.filter(s => selectedServiceIds.includes(s.id));

  const totalPrice = selectedServiceObjects.reduce((acc, s) => acc + (s.promotionalPrice || s.price), 0);
  const totalDuration = selectedServiceObjects.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalDeposit = currentProf ? Math.round(totalPrice * (StorageService.getSettings().depositPercentage / 100)) : 0;

  const toggleServiceSelection = (srvId: string) => {
    setSelectedServiceIds(current =>
      current.includes(srvId)
        ? current.filter(id => id !== srvId)
        : [...current, srvId]
    );
    // A alteração dos serviços invalida qualquer horário escolhido anteriormente.
    setSelectedTime('');
  };

  const handleConfirmBooking = async () => {
    if (!currentProf || selectedServiceIds.length === 0 || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Get or create client
    const existingClients = StorageService.getClients();
    let client = existingClients.find(c => c.phone.replace(/\D/g, '') === clientPhone.replace(/\D/g, ''));

    if (!client) {
      const newClient: Client = {
        id: "cli_" + Date.now(),
        fullName: clientName,
        phone: clientPhone,
        whatsapp: clientPhone,
        email: clientEmail,
        preferredProfessionalId: currentProf.id,
        firstAppointmentDate: selectedDate,
        lastAppointmentDate: selectedDate,
        noShowCount: 0,
        cancellationCount: 0,
        imageConsent: true,
        communicationConsent: true,
        active: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      client = StorageService.saveClient(newClient);
    }

    // Create Appointment
    const [h, m] = selectedTime.split(':').map(Number);
    const endMinutes = h * 60 + m + totalDuration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newApt: Appointment = {
      id: "apt_" + Date.now(),
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
      clientEmail: client.email,
      professionalId: currentProf.id,
      professionalName: currentProf.name,
      serviceIds: selectedServiceIds,
      serviceNames: selectedServiceObjects.map(s => s.name),
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTimeStr,
      totalDurationMinutes: totalDuration,
      totalPrice: totalPrice,
      depositPaid: 0,
      remainingPrice: totalPrice,
      status: 'aguardando_confirmacao',
      paymentStatus: totalDeposit > 0 ? 'pendente' : 'nao_informado',
      notes: clientNotes,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      createdBy: client.fullName
    };

    try {
      setIsSubmitting(true);
      await StorageService.saveAppointmentToCloud(newApt);
      StorageService.saveAppointment(newApt, false);
      setConfirmedApt(newApt);
      setStep(5); // Final Success Step
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível concluir o agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirmedAppointment = async () => {
    if (!confirmedApt || !window.confirm('Tem certeza de que deseja cancelar este agendamento?')) return;
    setIsSubmitting(true);
    try {
      await CloudAppointmentService.cancel(confirmedApt.id, confirmedApt.clientPhone, 'Cancelado pela cliente pelo site');
      StorageService.cancelAppointment(confirmedApt.id, 'Cancelado pela cliente pelo site', true);
      alert('Agendamento cancelado. O horário foi liberado e o Google Agenda foi atualizado.');
      resetModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível cancelar o agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setConfirmedApt(null);
    setSelectedTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="booking-modal bg-[#0a0a0a] rounded-2xl max-w-xl w-full border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="p-4 bg-[#050505] border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-semibold text-[#c4b491] uppercase tracking-widest block">
              Agendamento Online
            </span>
            <h2 className="font-serif text-lg font-medium text-white">
              LEV COWORKING BEAUTY
            </h2>
          </div>
          <button
            onClick={resetModal}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {step < 5 && (
          <div className="bg-white/10 h-1.5 w-full">
            <div
              className="bg-[#c4b491] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Choose Professional */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-serif text-base font-semibold text-white">
                1. Escolha a Profissional
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {professionals.map(prof => {
                  const isSelected = selectedProfId === prof.id;
                  return (
                    <button
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfId(prof.id);
                        // A cliente deve escolher o serviço intencionalmente.
                        setSelectedServiceIds([]);
                        setSelectedTime('');
                      }}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${
                        isSelected
                          ? 'bg-[#c4b491]/20 border-[#c4b491] shadow-2xs font-medium ring-1 ring-[#c4b491]'
                          : 'bg-[#050505] border-white/10 hover:border-[#c4b491]/50'
                      }`}
                    >
                      <div className="relative mb-2">
                        <ProfessionalAvatar
                          src={prof.avatarUrl}
                          name={prof.name}
                          sizeClassName="w-16 h-16"
                          textClassName="text-xl"
                        />
                        <div className="absolute bottom-0 right-0 bg-[#0a0a0a] border border-[#c4b491] p-1 rounded-full text-[#c4b491] z-10">
                          {getSpecialtyIcon(prof.name + ' ' + prof.title, "w-3 h-3")}
                        </div>
                      </div>
                      <span className="font-serif font-semibold text-sm text-white">{prof.name}</span>
                      <span className="text-[10px] text-[#c4b491] mt-0.5 flex items-center justify-center gap-1">
                        {prof.title}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedProfId && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    Próximo: Escolher Serviço <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Choose Services */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold text-white">
                  2. Escolha os Serviços ({currentProf?.name})
                </h3>
                <span className="text-xs text-[#c4b491]">
                  Clique novamente para desmarcar
                </span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {profServices.map(srv => {
                  const isChecked = selectedServiceIds.includes(srv.id);
                  return (
                    <button
                      type="button"
                      key={srv.id}
                      onClick={() => toggleServiceSelection(srv.id)}
                      aria-pressed={isChecked}
                      aria-label={`${isChecked ? 'Desmarcar' : 'Selecionar'} ${srv.name}`}
                      className={`w-full p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                        isChecked
                          ? 'bg-[#c4b491]/20 border-[#c4b491] shadow-2xs'
                          : 'bg-[#050505] border-white/10 hover:border-[#c4b491]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#c4b491] border-[#c4b491] text-[#050505]' : 'border-white/20 bg-[#050505]'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-medium text-xs text-white block">{srv.name}</span>
                          <span className="text-[10px] text-white/60">Duração: {srv.durationMinutes} min</span>
                        </div>
                      </div>

                      <span className="font-serif font-bold text-xs text-[#c4b491]">
                        {formatCurrency(srv.promotionalPrice || srv.price)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selection Summary */}
              {selectedServiceObjects.length > 0 && (
                <div className="p-3 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white/60">Total selecionado:</span>
                    <span className="font-bold text-white ml-1">{selectedServiceObjects.length} {selectedServiceObjects.length === 1 ? 'serviço' : 'serviços'}</span>
                    <span className="text-[#c4b491] ml-2">({totalDuration} min)</span>
                  </div>
                  <span className="font-serif font-bold text-sm text-[#c4b491]">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/80 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>

                <button
                  onClick={() => setStep(3)}
                  disabled={selectedServiceIds.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] disabled:opacity-50 text-[#050505] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  Próximo: Data e Horário <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Date & Time Slot */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-serif text-base font-semibold text-white">
                3. Escolha a Data e Horário
              </h3>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">
                  Data do Atendimento
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs font-medium text-white focus:outline-hidden focus:border-[#c4b491]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">
                  Horários Disponíveis ({formatDateBR(selectedDate)})
                </label>

                {availableSlots.length === 0 ? (
                  <p className="text-xs text-amber-300 p-3 bg-amber-950/40 rounded-xl border border-amber-800">
                    Nenhum horário livre encontrado para esta data ou profissional de folga.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot, idx) => {
                      if (!slot.available) {
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl border border-white/5 bg-white/[0.02] text-white/30 text-[11px] text-center line-through cursor-not-allowed"
                            title={slot.reason}
                          >
                            {slot.time}
                          </div>
                        );
                      }

                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? 'bg-[#c4b491] text-[#050505] border-[#c4b491] shadow-2xs font-bold'
                              : 'bg-[#050505] text-white border-white/10 hover:border-[#c4b491]'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/80 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>

                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedTime}
                  className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] disabled:opacity-50 text-[#050505] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  Próximo: Seus Dados <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Client Info & Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-serif text-base font-semibold text-white">
                4. Confirmação dos Dados
              </h3>

              {/* Orientação para clientes sem necessidade de cadastro */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70">
                Preencha seu nome e telefone para concluir a solicitação. O e-mail é opcional e não é necessário criar uma conta.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/60 block mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Camila Rodrigues"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs font-medium text-white focus:outline-hidden focus:border-[#c4b491]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/60 block mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs font-medium text-white focus:outline-hidden focus:border-[#c4b491]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/60 block mb-1">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="camila@exemplo.com"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs font-medium text-white focus:outline-hidden focus:border-[#c4b491]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/60 block mb-1">
                    Observações ou Preferências
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Formato de unha desejado, tom de maquiagem..."
                    value={clientNotes}
                    onChange={e => setClientNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-hidden focus:border-[#c4b491]"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-[#050505] border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-white">
                  <span>Profissional:</span>
                  <span>{currentProf?.name} ({currentProf?.title})</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Data e Hora:</span>
                  <span>{formatDateBR(selectedDate)} às {selectedTime}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Serviços:</span>
                  <span className="text-right">{selectedServiceObjects.map(s => s.name).join(', ')}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Duração Estimada:</span>                  <span>{totalDuration} minutos</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-[#c4b491]">
                  <span>Valor Total:</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>

                {totalDeposit > 0 && (
                  <p className="text-[11px] text-[#c4b491] pt-1">
                    Sinal para reserva do horário (30%): <strong>{formatCurrency(totalDeposit)}</strong> via Pix para a chave da profissional ({currentProf?.pixKey}).
                  </p>
                )}
              </div>

              {/* Policy Check */}
              <label className="flex items-start gap-2 cursor-pointer text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={acceptedPolicy}
                  onChange={e => setAcceptedPolicy(e.target.checked)}
                  className="mt-0.5 text-[#c4b491] rounded-xs focus:ring-[#c4b491]"
                />
                <span>
                  Li e aceito as <strong className="text-white">políticas de cancelamento</strong> e termos de uso do LEV Coworking Beauty.
                </span>
              </label>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/80 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>

                <button
                  onClick={handleConfirmBooking}
                  disabled={!clientName || !clientPhone || !acceptedPolicy || isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] disabled:opacity-50 text-[#050505] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'} <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success & WhatsApp Action */}
          {step === 5 && confirmedApt && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-800">
                <Sparkles className="w-8 h-8" />
              </div>

              <h3 className="font-serif text-xl font-semibold text-white">
                Agendamento Solicitado com Sucesso!
              </h3>

              <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                Seu horário para <strong>{confirmedApt.serviceNames.join(', ')}</strong> com <strong>{confirmedApt.professionalName}</strong> em <strong>{formatDateBR(confirmedApt.date)} às {confirmedApt.startTime}</strong> foi registrado.
              </p>

              {totalDeposit > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-left max-w-md mx-auto text-xs space-y-1">
                  <p className="font-semibold text-amber-200">
                    Chave Pix para envio do Sinal ({formatCurrency(totalDeposit)}):
                  </p>
                  <p className="font-mono text-xs text-amber-300 bg-[#050505] p-2 rounded-lg border border-amber-800/80 select-all font-bold">
                    {currentProf?.pixKey}
                  </p>
                  <p className="text-[11px] text-amber-400 pt-1">
                    Envie o comprovante pelo WhatsApp para confirmação definitiva.
                  </p>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={buildWhatsAppLink(
                    StorageService.getSettings().whatsapp,
                    generateWhatsAppMessage('confirmacao', {
                      clientName: confirmedApt.clientName,
                      professionalName: confirmedApt.professionalName,
                      serviceName: confirmedApt.serviceNames.join(', '),
                      date: confirmedApt.date,
                      time: confirmedApt.startTime,
                      depositValue: totalDeposit,
                      pixKey: currentProf?.pixKey
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir WhatsApp para Enviar Comprovante
                </a>

                <button
                  onClick={resetModal}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/[0.03] text-white border border-white/10 hover:bg-white/[0.08] transition-colors"
                >
                  Concluir
                </button>

                <button
                  onClick={handleCancelConfirmedAppointment}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-rose-500/35 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <XCircle className="w-4 h-4" />
                  {isSubmitting ? 'Cancelando...' : 'Cancelar Agendamento'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

