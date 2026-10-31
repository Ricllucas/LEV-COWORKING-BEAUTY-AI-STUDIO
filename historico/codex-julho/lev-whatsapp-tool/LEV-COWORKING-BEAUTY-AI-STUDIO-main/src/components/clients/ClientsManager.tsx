import React, { useState, useEffect } from 'react';
import { Client, Professional } from '../../types';
import { StorageService } from '../../services/storage';
import { formatPhone, buildWhatsAppLink } from '../../utils/formatters';
import { Search, Plus, User, Phone, Mail, Calendar, MessageCircle, AlertTriangle, ShieldCheck, X, Edit3 } from 'lucide-react';

interface ClientsManagerProps {
  isNewModalOpen?: boolean;
  onCloseNewModal?: () => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({ isNewModalOpen, onCloseNewModal }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // New Client Form
  const [isOpenForm, setIsOpenForm] = useState<boolean>(isNewModalOpen || false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [healthSensitivities, setHealthSensitivities] = useState<string>('');

  useEffect(() => {
    if (isNewModalOpen) setIsOpenForm(true);
  }, [isNewModalOpen]);

  useEffect(() => {
    const load = () => {
      setClients(StorageService.getClients());
      setProfessionals(StorageService.getProfessionals());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q));
  });

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      alert("Nome e telefone são obrigatórios.");
      return;
    }

    // Check duplicate phone
    const cleanPhone = phone.replace(/\D/g, '');
    const duplicate = clients.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
    if (duplicate) {
      alert("Já existe uma cliente cadastrada com este telefone.");
      return;
    }

    const newClient: Client = {
      id: "cli_" + Date.now(),
      fullName,
      phone,
      whatsapp: phone,
      email,
      birthDate,
      notes,
      healthSensitivities,
      noShowCount: 0,
      cancellationCount: 0,
      imageConsent: true,
      communicationConsent: true,
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    StorageService.saveClient(newClient);
    setIsOpenForm(false);
    if (onCloseNewModal) onCloseNewModal();

    // Reset Form
    setFullName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    setNotes('');
    setHealthSensitivities('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-[#E6D7C3] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#8C6D46] uppercase tracking-widest block">
            Base do Coworking
          </span>
          <h1 className="text-2xl font-serif font-medium text-[#3D312A] mt-1">
            Cadastro de Clientes
          </h1>
        </div>

        <button
          onClick={() => setIsOpenForm(true)}
          className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8860B] text-white font-medium text-xs transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Nova Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8C6D46] absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E6D7C3] bg-white text-xs text-[#3D312A] focus:outline-hidden focus:border-[#D4AF37] shadow-2xs"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="p-5 bg-white rounded-2xl border border-[#E6D7C3] hover:border-[#D4AF37] transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-serif font-semibold text-base text-[#3D312A]">
                    {client.fullName}
                  </h3>
                  <span className="text-xs text-[#8C6D46] block">{formatPhone(client.phone)}</span>
                </div>

                <a
                  href={buildWhatsAppLink(client.phone, `Olá, ${client.fullName}! Tudo bem? Entramos em contato do LEV COWORKING BEAUTY.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>

              {client.healthSensitivities && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Sensibilidade declarada:</strong> {client.healthSensitivities}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E6D7C3]/60 flex items-center justify-between text-[11px] text-[#8C6D46]">
              <span>Cadastrada em: {client.createdAt}</span>
              <span className="font-semibold text-[#3D312A]">Ver Ficha →</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Client Form Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form onSubmit={handleSaveClient} className="bg-[#FDFBF7] rounded-2xl max-w-md w-full border border-[#E6D7C3] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[#3D312A]">
                Cadastrar Nova Cliente
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenForm(false)}
                className="p-1 rounded-full text-[#8C6D46] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6B574B] block mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Camila Rodrigues"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-[#6B574B] block mb-1">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B574B] block mb-1">Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6B574B] block mb-1">E-mail</label>
              <input
                type="email"
                placeholder="cliente@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6B574B] block mb-1">Alergias / Sensibilidades Declaradas</label>
              <textarea
                rows={2}
                placeholder="Informações fornecidas espontaneamente pela cliente..."
                value={healthSensitivities}
                onChange={e => setHealthSensitivities(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">
                * As informações de saúde são estritamente declaratórias pela própria cliente (sem diagnóstico).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpenForm(false)}
                className="px-4 py-2 rounded-xl text-xs bg-[#F5EFE6]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs bg-[#D4AF37] text-white font-medium"
              >
                Salvar Cadastro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FDFBF7] rounded-2xl max-w-lg w-full border border-[#E6D7C3] p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F5EFE6] text-[#8C6D46]"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-semibold text-[#8C6D46] uppercase tracking-widest block">
              Ficha do Cliente
            </span>
            <h2 className="text-xl font-serif font-semibold text-[#3D312A]">
              {selectedClient.fullName}
            </h2>

            <div className="p-4 bg-white rounded-xl border border-[#E6D7C3] text-xs space-y-2">
              <div>Telefone: <strong className="text-[#3D312A]">{formatPhone(selectedClient.phone)}</strong></div>
              <div>E-mail: <strong className="text-[#3D312A]">{selectedClient.email || 'Não informado'}</strong></div>
              <div>Data de Nascimento: <strong className="text-[#3D312A]">{selectedClient.birthDate || 'Não informada'}</strong></div>
              {selectedClient.healthSensitivities && (
                <div className="p-2 bg-amber-50 rounded-lg text-amber-900 border border-amber-200 mt-2">
                  <strong>Alergias/Sensibilidades declaradas:</strong> {selectedClient.healthSensitivities}
                  <p className="text-[10px] text-amber-700 italic mt-0.5">
                    Informação declarada expressamente pela cliente.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={buildWhatsAppLink(selectedClient.phone, `Olá, ${selectedClient.fullName}!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs bg-emerald-600 text-white font-medium flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
              </a>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-xl text-xs bg-[#F5EFE6]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
