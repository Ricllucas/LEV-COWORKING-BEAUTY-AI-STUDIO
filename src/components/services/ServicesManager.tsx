import React, { useState, useEffect } from 'react';
import { Service, Professional, CategoryType } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudServiceCatalog } from '../../services/cloudServiceCatalog';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Clock, DollarSign, Check, X } from 'lucide-react';

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('todas');

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('Unha Raiz');
  const [description, setDescription] = useState<string>('');
  const [professionalId, setProfessionalId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [price, setPrice] = useState<number>(50);
  const [promotionalPrice, setPromotionalPrice] = useState<number | undefined>(undefined);
  const [depositValue, setDepositValue] = useState<number>(15);

  useEffect(() => {
    const load = () => {
      setServices(StorageService.getServices());
      const profs = StorageService.getProfessionals();
      setProfessionals(profs);
      if (profs.length > 0 && !professionalId) {
        setProfessionalId(profs[0].id);
      }
    };
    load();
    const user = StorageService.getCurrentUser();
    if (CloudServiceCatalog.isConfigured()) {
      const publish = user.role === 'profissional' && user.professionalId
        ? CloudServiceCatalog.syncProfessional(StorageService.getServices(), user.professionalId, user.role)
        : Promise.resolve();
      publish
        .then(() => CloudServiceCatalog.load())
        .then(items => {
          StorageService.replaceServices(items);
          setServices(items);
        })
        .catch(error => console.error('Erro ao sincronizar catálogo:', error));
    }
    return StorageService.subscribeStorage(load);
  }, []);

  const filteredServices = selectedProfFilter === 'todas'
    ? services
    : services.filter(s => s.professionalId === selectedProfFilter);

  const handleOpenNew = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDurationMinutes(60);
    setPrice(50);
    setPromotionalPrice(undefined);
    setDepositValue(15);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setCategory(srv.category);
    setDescription(srv.description);
    setProfessionalId(srv.professionalId);
    setDurationMinutes(srv.durationMinutes);
    setPrice(srv.price);
    setPromotionalPrice(srv.promotionalPrice);
    setDepositValue(srv.depositValue);
    setIsFormOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !professionalId || price <= 0) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const prof = professionals.find(p => p.id === professionalId);

    const serviceObj: Service = {
      id: editingService ? editingService.id : "srv_" + Date.now(),
      name,
      category,
      description,
      professionalId,
      professionalName: prof?.name || "Profissional",
      durationMinutes: Number(durationMinutes),
      bufferAfterMinutes: 10,
      price: Number(price),
      promotionalPrice: promotionalPrice ? Number(promotionalPrice) : undefined,
      depositRequired: depositValue > 0,
      depositValue: Number(depositValue),
      color: prof?.color || "#D4AF37",
      active: true,
      onlineBookingEnabled: true,
      minNoticeHours: 2,
      maxCancellationNoticeHours: 24
    };

    StorageService.saveService(serviceObj);
    try {
      await CloudServiceCatalog.save(serviceObj, StorageService.getCurrentUser().role);
      setIsFormOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível publicar o serviço.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      const service = services.find(item => item.id === id);
      if (!service) return;
      StorageService.deleteService(id);
      try {
        await CloudServiceCatalog.remove(service, StorageService.getCurrentUser().role);
      } catch (error) {
        StorageService.saveService(service);
        alert(error instanceof Error ? error.message : 'Não foi possível remover o serviço do catálogo público.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold text-[#c4b491] uppercase tracking-widest block">
            Catálogo de Procedimentos
          </span>
          <h1 className="text-2xl font-serif font-medium text-white mt-1">
            Cadastro de Serviços
          </h1>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Serviço
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedProfFilter('todas')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            selectedProfFilter === 'todas'
              ? 'bg-[#c4b491] text-[#050505] shadow-2xs'
              : 'bg-[#0a0a0a] text-white/70 border border-white/10 hover:border-white/20'
          }`}
        >
          Todos os Serviços
        </button>
        {professionals.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProfFilter(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedProfFilter === p.id
                ? 'bg-[#c4b491] text-[#050505] shadow-2xs'
                : 'bg-[#0a0a0a] text-white/70 border border-white/10 hover:border-white/20'
            }`}
          >
            {p.name} ({p.title})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map(srv => (
          <div
            key={srv.id}
            className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-[#c4b491] uppercase tracking-wider block">
                    {srv.professionalName} • {srv.category}
                  </span>
                  <h3 className="font-serif font-semibold text-base text-white mt-0.5">
                    {srv.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="font-serif font-bold text-base text-[#c4b491]">
                    {formatCurrency(srv.promotionalPrice || srv.price)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                {srv.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[#c4b491] flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#c4b491]" />
                {srv.durationMinutes} min
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(srv.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleSaveService} className="bg-[#0a0a0a] rounded-2xl max-w-md w-full border border-white/10 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-white">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Nome do Serviço *</label>
              <input
                type="text"
                required
                placeholder="Ex: Manicure Tradicional"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Profissional *</label>
                <select
                  value={professionalId}
                  onChange={e => {
                    setProfessionalId(e.target.value);
                    const p = professionals.find(pr => pr.id === e.target.value);
                    if (p && p.categories.length > 0) {
                      setCategory(p.categories[0]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                >
                  <option value="Sobrancelhas & Cílios">Sobrancelhas & Cílios</option>
                  <option value="Micropigmentação">Micropigmentação</option>
                  <option value="Estética Labial">Estética Labial</option>
                  <option value="Unha Raiz">Unha Raiz</option>
                  <option value="Maquiagem e Sobrancelhas">Maquiagem e Sobrancelhas</option>
                  <option value="Unhas em Gel">Unhas em Gel</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Duração (min) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.5}
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 block mb-1">Sinal (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={depositValue}
                  onChange={e => setDepositValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 block mb-1">Descrição</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/10 text-white/80"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold"
              >
                Salvar Serviço
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
