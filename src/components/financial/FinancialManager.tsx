import React, { useState, useEffect } from 'react';
import { User, Professional, Appointment, PaymentRecord, Service } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudAppointmentService } from '../../services/cloudAppointments';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  Filter,
  Calendar,
  Lock,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building,
  Pencil,
  Trash2,
  X,
  Save
} from 'lucide-react';

interface FinancialManagerProps {
  currentUser: User;
}

export const FinancialManager: React.FC<FinancialManagerProps> = ({ currentUser }) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editServiceIds, setEditServiceIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Selected MEI tab
  const [activeMeiTab, setActiveMeiTab] = useState<string>(
    currentUser.role === 'profissional' && currentUser.professionalId
      ? currentUser.professionalId
      : 'todos'
  );

  const [dateFilter, setDateFilter] = useState<'mes' | 'semana' | 'tudo'>('mes');

  useEffect(() => {
    const load = () => {
      setProfessionals(StorageService.getProfessionals());
      setAppointments(StorageService.getAppointments());
      setPayments(StorageService.getPaymentRecords());
      setServices(StorageService.getServices());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  // Privacy Protection
  if (currentUser.role === 'profissional' && activeMeiTab !== currentUser.professionalId) {
    // Lock to own MEI
    setActiveMeiTab(currentUser.professionalId || 'prof_elisangela');
  }

  // Aplica o período selecionado e remove cópias históricas do mesmo atendimento.
  const now = new Date();
  const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStartDate = new Date(`${today}T12:00:00`);
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
  const weekStart = weekStartDate.toLocaleDateString('en-CA');
  let filteredApts = appointments.filter(a => {
    if (a.status === 'cancelado_cliente' || a.status === 'cancelado_coworking') return false;
    if (dateFilter === 'mes') return a.date >= monthStart && a.date <= today;
    if (dateFilter === 'semana') return a.date >= weekStart && a.date <= today;
    return true;
  });

  if (activeMeiTab !== 'todos') {
    filteredApts = filteredApts.filter(a => a.professionalId === activeMeiTab);
  }

  const uniqueAppointments = new Map<string, Appointment>();
  [...filteredApts]
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .forEach(appointment => {
      const phone = appointment.clientPhone.replace(/\D/g, '');
      const key = [appointment.professionalId, appointment.date, appointment.startTime, phone, appointment.serviceNames.join('|')].join('::');
      if (!uniqueAppointments.has(key)) uniqueAppointments.set(key, appointment);
    });
  filteredApts = Array.from(uniqueAppointments.values()).sort((a, b) =>
    `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)
  );

  // Faturamento é serviço efetivamente realizado, não agenda futura.
  const completedApts = filteredApts.filter(a => a.status === 'concluido');
  const totalRevenue = completedApts.reduce((acc, a) => acc + (a.totalPrice - (a.discountPrice || 0)), 0);
  const totalDepositReceived = filteredApts.reduce((acc, a) => acc + (a.depositPaid || 0), 0);
  const totalPending = filteredApts.filter(a => a.status !== 'concluido').reduce((acc, a) => acc + (a.remainingPrice || 0), 0);
  const averageTicket = completedApts.length > 0 ? totalRevenue / completedApts.length : 0;

  const openEdit = (apt: Appointment) => {
    setEditing(apt);
    setEditClientName(apt.clientName);
    setEditDate(apt.date);
    setEditServiceIds(apt.serviceIds || []);
  };

  const toggleEditService = (serviceId: string) => {
    setEditServiceIds(current => current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId]
    );
  };

  const handleSaveEdit = async () => {
    if (!editing || !editClientName.trim() || !editDate || editServiceIds.length === 0) return;
    const selectedServices = services.filter(item =>
      editServiceIds.includes(item.id) && item.professionalId === editing.professionalId
    );
    if (selectedServices.length !== editServiceIds.length) return alert('Selecione apenas serviços válidos desta profissional.');
    const totalDurationMinutes = selectedServices.reduce((total, service) => total + service.durationMinutes, 0);
    const [hour, minute] = editing.startTime.split(':').map(Number);
    const end = new Date(2000, 0, 1, hour, minute + totalDurationMinutes);
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    const totalPrice = selectedServices.reduce(
      (total, service) => total + (service.promotionalPrice ?? service.price),
      0
    );
    const changes: Partial<Appointment> = {
      clientName: editClientName.trim(),
      date: editDate,
      serviceIds: selectedServices.map(service => service.id),
      serviceNames: selectedServices.map(service => service.name),
      totalDurationMinutes,
      endTime,
      totalPrice,
      remainingPrice: Math.max(0, totalPrice - (editing.depositPaid || 0) - (editing.discountPrice || 0))
    };
    setSaving(true);
    try {
      const updated = await CloudAppointmentService.updateDetails(editing.id, changes, currentUser);
      StorageService.saveAppointment(updated, false);
      setAppointments(StorageService.getAppointments());
      setEditing(null);
      alert('Lançamento atualizado e sincronizado com a agenda.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível editar o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (apt: Appointment) => {
    if (!confirm(`Excluir o lançamento de ${apt.clientName}?\n\nEle será retirado do relatório e o horário será removido da agenda.`)) return;
    setSaving(true);
    try {
      const updated = await CloudAppointmentService.updateStatus(
        apt.id,
        'cancelado_coworking',
        currentUser,
        'Lançamento excluído do relatório financeiro pela equipe LEV.'
      );
      StorageService.saveAppointment(updated, false);
      setAppointments(StorageService.getAppointments());
      alert('Lançamento excluído e agendas sincronizadas.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível excluir o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = ["ID", "Cliente", "Profissional", "Data", "Serviços", "Valor Total", "Sinal Pago", "Status Pagamento"];
    const rows = filteredApts.map(a => [
      a.id,
      `"${a.clientName}"`,
      `"${a.professionalName}"`,
      a.date,
      `"${a.serviceNames.join(', ')}"`,
      a.totalPrice.toFixed(2),
      a.depositPaid.toFixed(2),
      a.paymentStatus
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_lev_${activeMeiTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-[#E6D7C3] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-widest block">
            Módulo Financeiro por MEI
          </span>
          <h1 className="text-2xl font-serif font-medium text-[#3D312A] mt-1">
            Controle de Faturamento
          </h1>
          <p className="text-xs text-[#6B574B] mt-1">
            Cada profissional possui MEI autônomo. O controle interno não substitui obrigações tributárias.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8860B] text-white font-medium text-xs transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório CSV
        </button>
      </div>

      {/* MEI Tabs (Privacy Enforcement) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveMeiTab('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeMeiTab === 'todos'
                ? 'bg-[#3D312A] text-white shadow-2xs'
                : 'bg-white text-[#6B574B] border border-[#E6D7C3] hover:bg-[#F5EFE6]'
            }`}
          >
            Consolidado Coworking (Admin)
          </button>
        )}

        {professionals.map(p => {
          if (currentUser.role === 'profissional' && currentUser.professionalId !== p.id) {
            return null; // Hide other professionals' tabs for privacy
          }

          const isSelected = activeMeiTab === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveMeiTab(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#D4AF37] text-white shadow-2xs'
                  : 'bg-white text-[#6B574B] border border-[#E6D7C3] hover:bg-[#F5EFE6]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{p.name} ({p.title})</span>
            </button>
          );
        })}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E6D7C3] shadow-2xs">
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-wider block mb-1">
            Faturamento Bruto
          </span>
          <span className="text-2xl font-serif font-bold text-[#D4AF37] block">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-[11px] text-[#6B574B] mt-1 block">
            {completedApts.length} atendimento(s) concluído(s)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6D7C3] shadow-2xs">
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-wider block mb-1">
            Sinais Recebidos
          </span>
          <span className="text-2xl font-serif font-bold text-emerald-700 block">
            {formatCurrency(totalDepositReceived)}
          </span>
          <span className="text-[11px] text-[#6B574B] mt-1 block">
            Garantias de horário via Pix
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6D7C3] shadow-2xs">
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-wider block mb-1">
            Valores Pendentes
          </span>
          <span className="text-2xl font-serif font-bold text-amber-700 block">
            {formatCurrency(totalPending)}
          </span>
          <span className="text-[11px] text-[#6B574B] mt-1 block">
            Saldo a receber no atendimento
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6D7C3] shadow-2xs">
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-wider block mb-1">
            Ticket Médio
          </span>
          <span className="text-2xl font-serif font-bold text-[#3D312A] block">
            {formatCurrency(averageTicket)}
          </span>
          <span className="text-[11px] text-[#6B574B] mt-1 block">
            Média por procedimento
          </span>
        </div>
      </div>

      {/* MEI Bank Details Box */}
      {activeMeiTab !== 'todos' && (
        <div className="p-5 rounded-2xl bg-[#F5EFE6] border border-[#E6D7C3] space-y-2">
          {(() => {
            const p = professionals.find(prof => prof.id === activeMeiTab);
            if (!p) return null;
            return (
              <div className="text-xs space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#E6D7C3] pb-2">
                  <span className="font-serif font-semibold text-sm text-[#3D312A]">
                    Dados Bancários do MEI — {p.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#8C6D46]">{p.cnpjCpf}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[#6B574B]">
                  <div>Razão Social: <strong className="text-[#3D312A]">{p.meiName}</strong></div>
                  <div>Banco: <strong className="text-[#3D312A]">{p.bankName}</strong></div>
                  <div>Chave Pix: <strong className="text-[#3D312A] font-mono">{p.pixKey}</strong></div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Financial Transactions Table */}
      <div className="p-5 bg-white rounded-2xl border border-[#E6D7C3] shadow-2xs space-y-4">
        <h2 className="font-serif text-lg font-semibold text-[#3D312A]">
          Histórico de Lançamentos
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6D7C3] text-[#8C6D46] font-semibold uppercase tracking-wider">
                <th className="pb-3">Data</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Profissional / MEI</th>
                <th className="pb-3">Serviço(s)</th>
                <th className="pb-3 text-right">Valor Total</th>
                <th className="pb-3 text-right">Sinal Pago</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D7C3]/60 text-[#3D312A]">
              {filteredApts.map(apt => (
                <tr key={apt.id} className="hover:bg-[#FDFBF7]">
                  <td className="py-3 font-medium">{formatDateBR(apt.date)}</td>
                  <td className="py-3 font-semibold">{apt.clientName}</td>
                  <td className="py-3">{apt.professionalName}</td>
                  <td className="py-3 text-[#6B574B]">{apt.serviceNames.join(', ')}</td>
                  <td className="py-3 text-right font-serif font-bold text-[#D4AF37]">
                    {formatCurrency(apt.totalPrice)}
                  </td>
                  <td className="py-3 text-right text-emerald-700 font-semibold">
                    {formatCurrency(apt.depositPaid)}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      apt.paymentStatus === 'pago' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      apt.paymentStatus === 'parcial' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-stone-100 text-stone-600 border-stone-300'
                    }`}>
                      {apt.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => openEdit(apt)} disabled={saving} className="p-2 rounded-lg border border-[#D8C29D] text-[#8C6D46] hover:bg-[#F5EFE6] disabled:opacity-50" title="Editar lançamento" aria-label="Editar lançamento">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => void handleDelete(apt)} disabled={saving} className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50" title="Excluir lançamento" aria-label="Excluir lançamento">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Editar lançamento financeiro">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E6D7C3] shadow-2xl p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-[#8C6D46] uppercase tracking-widest">Relatório Financeiro (MEI)</span>
                <h2 className="font-serif text-xl font-semibold text-[#3D312A]">Editar lançamento</h2>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-[#F5EFE6]" aria-label="Fechar"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-[#6B574B]">Cliente
                <input value={editClientName} onChange={event => setEditClientName(event.target.value)} maxLength={120} className="mt-1.5 w-full rounded-xl border border-[#D8C29D] px-3 py-2.5 text-sm text-[#3D312A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40" />
              </label>
              <label className="block text-xs font-semibold text-[#6B574B]">Data do atendimento
                <input type="date" value={editDate} onChange={event => setEditDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#D8C29D] px-3 py-2.5 text-sm text-[#3D312A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40" />
              </label>
              <fieldset>
                <legend className="text-xs font-semibold text-[#6B574B]">Serviços executados</legend>
                <p className="mt-1 text-[11px] text-[#8C6D46]">Selecione um ou mais serviços realizados.</p>
                <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[#D8C29D] divide-y divide-[#E6D7C3]">
                  {services.filter(item => item.professionalId === editing.professionalId && item.active).map(item => {
                    const checked = editServiceIds.includes(item.id);
                    return (
                      <label key={item.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-[#F5EFE6]' : 'bg-white hover:bg-[#FDFBF7]'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEditService(item.id)}
                          className="h-4 w-4 accent-[#8C6D46]"
                        />
                        <span className="min-w-0 flex-1 text-sm text-[#3D312A]">{item.name}</span>
                        <span className="shrink-0 text-xs font-semibold text-[#8C6D46]">{formatCurrency(item.promotionalPrice ?? item.price)}</span>
                      </label>
                    );
                  })}
                </div>
                {editServiceIds.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-[#6B574B]">
                    {editServiceIds.length} serviço(s) selecionado(s)
                  </p>
                )}
              </fieldset>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} disabled={saving} className="px-4 py-2.5 rounded-xl border border-[#D8C29D] text-xs font-semibold text-[#6B574B]">Cancelar</button>
              <button onClick={() => void handleSaveEdit()} disabled={saving || !editClientName.trim() || !editDate || editServiceIds.length === 0} className="px-4 py-2.5 rounded-xl bg-[#3D312A] text-white text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

