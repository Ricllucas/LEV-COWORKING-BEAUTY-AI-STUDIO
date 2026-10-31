import React, { useState, useEffect } from 'react';
import { User, Professional, Appointment, PaymentRecord } from '../../types';
import { StorageService } from '../../services/storage';
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
  Building
} from 'lucide-react';

interface FinancialManagerProps {
  currentUser: User;
}

export const FinancialManager: React.FC<FinancialManagerProps> = ({ currentUser }) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

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
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  // Privacy Protection
  if (currentUser.role === 'profissional' && activeMeiTab !== currentUser.professionalId) {
    // Lock to own MEI
    setActiveMeiTab(currentUser.professionalId || 'prof_elisangela');
  }

  // Filter appointments
  let filteredApts = appointments.filter(a => a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking');

  if (activeMeiTab !== 'todos') {
    filteredApts = filteredApts.filter(a => a.professionalId === activeMeiTab);
  }

  // Calculate Metrics
  const totalRevenue = filteredApts.reduce((acc, a) => acc + (a.totalPrice - (a.discountPrice || 0)), 0);
  const totalDepositReceived = filteredApts.reduce((acc, a) => acc + (a.depositPaid || 0), 0);
  const totalPending = filteredApts.reduce((acc, a) => acc + (a.remainingPrice || 0), 0);
  const averageTicket = filteredApts.length > 0 ? totalRevenue / filteredApts.length : 0;

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = ["ID", "Cliente", "Profissional", "Data", "Servicos", "Valor Total", "Sinal Pago", "Status Pagamento"];
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
            {filteredApts.length} atendimento(s)
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
