import React, { useState, useEffect } from 'react';
import { WaitlistEntry, Professional, Service } from '../../types';
import { StorageService } from '../../services/storage';
import { formatPhone, buildWhatsAppLink } from '../../utils/formatters';
import { Clock, Plus, MessageCircle, Check, X, User } from 'lucide-react';

export const WaitlistManager: React.FC = () => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [selectedSrvId, setSelectedSrvId] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const load = () => {
      setWaitlist(StorageService.getWaitlist());
      const profs = StorageService.getProfessionals();
      const srvs = StorageService.getServices();
      setProfessionals(profs);
      setServices(srvs);
      if (profs.length > 0) setSelectedProfId(profs[0].id);
      if (srvs.length > 0) setSelectedSrvId(srvs[0].id);
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    const srv = services.find(s => s.id === selectedSrvId);

    const newEntry: WaitlistEntry = {
      id: "wait_" + Date.now(),
      clientName,
      clientPhone,
      serviceId: selectedSrvId,
      serviceName: srv?.name || "Procedimento",
      professionalId: selectedProfId,
      preferredDates: [preferredDate],
      status: 'aguardando',
      createdAt: new Date().toISOString().split('T')[0]
    };

    StorageService.saveWaitlistEntry(newEntry);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-white">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
            Gestão de Horários Vagos
          </span>
          <h1 className="text-2xl font-serif font-medium text-white mt-1">
            Lista de Espera
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Adicionar na Lista
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {waitlist.length === 0 ? (
          <div className="p-8 text-center bg-[#0a0a0a] rounded-2xl border border-white/10 col-span-2">
            <Clock className="w-10 h-10 text-[#c4b491]/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Lista de espera vazia</p>
            <p className="text-xs text-white/60 mt-1">Nenhum pedido de encaixe registrado no momento.</p>
          </div>
        ) : (
          waitlist.map(entry => (
            <div key={entry.id} className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white">{entry.clientName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c4b491]/20 text-[#c4b491] border border-[#c4b491]/30 uppercase font-semibold">
                  {entry.status}
                </span>
              </div>

              <div className="text-xs text-white/60">
                <p>Serviço: <strong className="text-white">{entry.serviceName}</strong></p>
                <p>Data Preferencial: {entry.preferredDates.join(', ')}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <a
                  href={buildWhatsAppLink(entry.clientPhone, `Olá, ${entry.clientName}! Vagou um horário no LEV COWORKING BEAUTY para ${entry.serviceName}. Gostaria de agendar?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Oferecer Vaga no WhatsApp
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleSaveEntry} className="bg-[#0a0a0a] rounded-2xl max-w-md w-full border border-white/10 p-6 shadow-2xl space-y-4 text-white">
            <h3 className="font-serif text-lg font-semibold text-white">Incluir na Lista de Espera</h3>
            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Nome da Cliente</label>
              <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Telefone WhatsApp</label>
              <input type="tel" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/10 text-white/80">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
