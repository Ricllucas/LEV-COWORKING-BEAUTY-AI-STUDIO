import React, { useState, useEffect } from 'react';
import { Appointment, Professional, Service } from '../../types';
import { StorageService } from '../../services/storage';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { Logo } from '../brand/Logo';
import { Printer, Download, BarChart2, TrendingUp, Users, Calendar } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    const load = () => {
      setAppointments(StorageService.getAppointments());
      setProfessionals(StorageService.getProfessionals());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  const totalApts = appointments.length;
  const completedApts = appointments.filter(a => a.status === 'concluido').length;
  const canceledApts = appointments.filter(a => a.status === 'cancelado_cliente' || a.status === 'cancelado_coworking').length;
  const totalRevenue = appointments.filter(a => a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking').reduce((acc, a) => acc + a.totalPrice, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 print:p-0 print:m-0 text-white">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex items-center justify-between print:hidden">
        <div>
          <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
            Relatórios e Métricas
          </span>
          <h1 className="text-2xl font-serif font-medium text-white mt-1">
            Relatórios Gerenciais
          </h1>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          Imprimir Relatório (PDF)
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Logo size="md" variant="horizontal" />
          <div className="text-right text-xs text-white/60">
            <span className="font-semibold text-white block">Relatório Consolidado de Gestão</span>
            <span>Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
            <span className="text-[#c4b491] block font-semibold">Total Atendimentos</span>
            <span className="text-xl font-serif font-bold text-white">{totalApts}</span>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
            <span className="text-[#c4b491] block font-semibold">Concluídos</span>
            <span className="text-xl font-serif font-bold text-emerald-400">{completedApts}</span>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
            <span className="text-[#c4b491] block font-semibold">Cancelamentos</span>
            <span className="text-xl font-serif font-bold text-rose-400">{canceledApts}</span>
          </div>
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
            <span className="text-[#c4b491] block font-semibold">Faturamento Bruto</span>
            <span className="text-xl font-serif font-bold text-[#c4b491]">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Breakdown by Professional */}
        <div className="space-y-3 pt-4">
          <h3 className="font-serif text-base font-semibold text-white">
            Faturamento Individual por MEI
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {professionals.map(p => {
              const profApts = appointments.filter(a => a.professionalId === p.id && a.status !== 'cancelado_cliente' && a.status !== 'cancelado_coworking');
              const rev = profApts.reduce((acc, a) => acc + a.totalPrice, 0);

              return (
                <div key={p.id} className="p-4 rounded-xl border border-white/10 bg-[#050505] space-y-1">
                  <span className="font-semibold text-xs text-white block">{p.name} ({p.title})</span>
                  <span className="text-[11px] text-[#c4b491] block">{p.meiName}</span>
                  <div className="pt-2 flex justify-between font-serif font-bold text-sm text-[#c4b491]">
                    <span>Total MEI:</span>
                    <span>{formatCurrency(rev)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
