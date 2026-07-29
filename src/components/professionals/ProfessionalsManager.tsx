import React, { useState, useEffect, useRef } from 'react';
import { Professional } from '../../types';
import { StorageService } from '../../services/storage';
import { ProfessionalAvatar } from '../common/ProfessionalAvatar';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { 
  Building, 
  Phone, 
  Mail, 
  Save, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  CheckCircle2, 
  User, 
  Sparkles, 
  Palette, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const PRESET_PHOTOS = [
  { label: "Foto Profissional 1 (Elegante)", url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800" },
  { label: "Foto Profissional 2 (Executiva)", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" },
  { label: "Foto Profissional 3 (Studio)", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800" },
  { label: "Foto Profissional 4 (Moderna)", url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800" },
  { label: "Foto Profissional 5 (Natural)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" }
];

export const ProfessionalsManager: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Professional>>({});
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => {
      const list = StorageService.getProfessionals();
      setProfessionals(list);
      if (list.length > 0) {
        if (!selectedProfId || !list.some(p => p.id === selectedProfId)) {
          setSelectedProfId(list[0].id);
          setFormData(list[0]);
        } else {
          const current = list.find(p => p.id === selectedProfId);
          if (current) setFormData(current);
        }
      }
    };
    load();
    return StorageService.subscribeStorage(load);
  }, [selectedProfId]);

  const activeProf = professionals.find(p => p.id === selectedProfId);

  const handleSelectProfessional = (p: Professional) => {
    setSelectedProfId(p.id);
    setFormData(p);
    setSaveSuccess('');
  };

  const handleFieldChange = (field: keyof Professional, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedBase64 = await compressImageToDataUrl(file, 320, 0.78);
      handleFieldChange('avatarUrl', resizedBase64);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Não foi possível processar esta imagem. Tente escolher outra foto.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProf || !formData.id) return;

    const updatedProf: Professional = {
      ...activeProf,
      ...formData,
      name: formData.name || activeProf.name,
      title: formData.title || activeProf.title,
      bio: formData.bio || activeProf.bio,
      avatarUrl: formData.avatarUrl || activeProf.avatarUrl,
      meiName: formData.meiName || activeProf.meiName,
      cnpjCpf: formData.cnpjCpf || activeProf.cnpjCpf,
      pixKey: formData.pixKey || activeProf.pixKey,
      bankName: formData.bankName || activeProf.bankName,
      phone: formData.phone || activeProf.phone,
      whatsapp: formData.whatsapp || activeProf.whatsapp,
      email: formData.email || activeProf.email,
    } as Professional;

    StorageService.saveProfessional(updatedProf);
    
    // Also update current active user session if editing their own profile
    const currentUser = StorageService.getCurrentUser();
    if (currentUser && currentUser.professionalId === updatedProf.id) {
      StorageService.setCurrentUser({
        ...currentUser,
        name: updatedProf.name,
        avatarUrl: updatedProf.avatarUrl
      });
    }

    setSaveSuccess(`Foto e dados de ${updatedProf.name} salvos com sucesso!`);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  if (!activeProf) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Gestão de Fotos & Perfil Profissional
          </span>
          <h1 className="text-2xl font-serif font-medium text-white mt-1">
            Profissionais, Imagens & MEI
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Edite a foto de perfil, dados cadastrais e especialidades exibidos no aplicativo para os clientes.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-2xs flex items-center gap-2 active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Professional Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {professionals.map(p => (
          <button
            key={p.id}
            onClick={() => handleSelectProfessional(p)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2.5 border ${
              selectedProfId === p.id
                ? 'bg-[#c4b491] text-[#050505] border-[#c4b491] shadow-2xs font-bold'
                : 'bg-[#0a0a0a] text-white/70 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            <ProfessionalAvatar
              src={p.avatarUrl}
              name={p.name}
              sizeClassName="w-6 h-6"
              textClassName="text-xs"
            />
            <div className="text-left">
              <span className="block leading-none">{p.name}</span>
              <span className="text-[10px] opacity-75 font-normal block mt-0.5">{p.title}</span>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Image Management Card */}
        <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-6 text-white">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#c4b491]" />
              <h2 className="text-base font-serif font-semibold text-white">
                Foto do Perfil da Profissional
              </h2>
            </div>
            <span className="text-[10px] text-[#c4b491] bg-[#c4b491]/10 px-2.5 py-1 rounded-full border border-[#c4b491]/20 font-mono">
              Exibida no Agendamento & Landing Page
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Preview Avatar Box */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#050505] rounded-xl border border-white/10 text-center space-y-4">
              <div className="relative group">
                <ProfessionalAvatar
                  src={formData.avatarUrl || activeProf.avatarUrl}
                  name={formData.name || activeProf.name}
                  sizeClassName="w-32 h-32"
                  textClassName="text-4xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-[#c4b491] text-[#050505] shadow-lg hover:bg-[#b5a37f] transition-transform hover:scale-110"
                  title="Alterar Imagem"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-serif font-semibold text-white text-lg">
                  {formData.name || activeProf.name}
                </h3>
                <span className="text-xs text-[#c4b491] font-medium block mt-0.5">
                  {formData.title || activeProf.title}
                </span>
                <p className="text-[11px] text-white/50 mt-2 max-w-xs line-clamp-2">
                  {formData.bio || activeProf.bio}
                </p>
              </div>

              {formData.avatarUrl?.startsWith('data:image/') && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Foto carregada do dispositivo
                </span>
              )}
            </div>

            {/* Image Source Selection Options */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    imageTab === 'upload'
                      ? 'bg-[#c4b491] text-[#050505]'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Foto do Seu Arquivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    imageTab === 'url'
                      ? 'bg-[#c4b491] text-[#050505]'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Link / URL da Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTab('presets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    imageTab === 'presets'
                      ? 'bg-[#c4b491] text-[#050505]'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modelos Prontos</span>
                </button>
              </div>

              {/* Upload Tab */}
              {imageTab === 'upload' && (
                <div className="p-5 bg-[#050505] rounded-xl border border-dashed border-white/20 text-center space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-[#c4b491]/10 text-[#c4b491] flex items-center justify-center mx-auto border border-[#c4b491]/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Selecione uma foto real do seu computador ou celular
                    </h4>
                    <p className="text-[11px] text-white/50 mt-1">
                      Aceita formatos JPG, PNG ou WEBP. A foto é otimizada e salva imediatamente no sistema.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Escolher Arquivo de Foto</span>
                  </button>
                </div>
              )}

              {/* URL Tab */}
              {imageTab === 'url' && (
                <div className="p-4 bg-[#050505] rounded-xl border border-white/10 space-y-3">
                  <label className="block text-xs font-semibold text-white/80">
                    Endereço Web (URL) da foto de perfil:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/sua-foto.jpg"
                      value={formData.avatarUrl || ''}
                      onChange={e => handleFieldChange('avatarUrl', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-[#0a0a0a] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                    />
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('avatarUrl', '')}
                        className="px-3 py-2 rounded-xl bg-rose-950/50 text-rose-300 border border-rose-800 text-xs hover:bg-rose-900/50"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50">
                    Cole o link direto da imagem obtido do seu Instagram, Google Drive público ou banco de imagens.
                  </p>
                </div>
              )}

              {/* Presets Tab */}
              {imageTab === 'presets' && (
                <div className="p-4 bg-[#050505] rounded-xl border border-white/10 space-y-3">
                  <span className="block text-xs font-semibold text-white/80">
                    Selecione uma foto de exemplo com iluminação de estúdio:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_PHOTOS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleFieldChange('avatarUrl', preset.url)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          formData.avatarUrl === preset.url
                            ? 'bg-[#c4b491]/20 border-[#c4b491] text-[#c4b491]'
                            : 'bg-[#0a0a0a] border-white/10 hover:border-white/30 text-white/70'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                        />
                        <span className="text-[10px] font-medium leading-tight line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Personal Info Card */}
        <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4 text-white">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <User className="w-5 h-5 text-[#c4b491]" />
            <h2 className="text-base font-serif font-semibold text-white">
              Informações Pessoais & Apresentação
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-white/70 block mb-1">Nome Profissional *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1">Título / Especialidade Principal *</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={e => handleFieldChange('title', e.target.value)}
                placeholder="Ex: Lash, Brows & Micropigmentação"
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-white/70 block mb-1 text-xs">Apresentação / Bio para Clientes *</label>
            <textarea
              rows={3}
              required
              value={formData.bio || ''}
              onChange={e => handleFieldChange('bio', e.target.value)}
              placeholder="Descreva suas especialidades e diferencial de atendimento..."
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-white/70 block mb-1">Telefone Principal</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={e => handleFieldChange('phone', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1">WhatsApp de Contato</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={e => handleFieldChange('whatsapp', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => handleFieldChange('email', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MEI Details Card */}
        <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4 text-white">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Building className="w-5 h-5 text-[#c4b491]" />
            <h2 className="text-base font-serif font-semibold text-white">
              Dados Cadastrais do MEI & Conta de Recebimento
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-white/70 block mb-1">Razão Social / Nome MEI</label>
              <input
                type="text"
                value={formData.meiName || ''}
                onChange={e => handleFieldChange('meiName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1">CNPJ / CPF do MEI</label>
              <input
                type="text"
                value={formData.cnpjCpf || ''}
                onChange={e => handleFieldChange('cnpjCpf', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1">Chave Pix Principal</label>
              <input
                type="text"
                value={formData.pixKey || ''}
                onChange={e => handleFieldChange('pixKey', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white font-mono focus:border-[#c4b491] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1">Instituição Bancária</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={e => handleFieldChange('bankName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex items-center justify-between">
          <span className="text-xs text-white/60">
            As alterações da foto e dados cadastrais têm efeito imediato no aplicativo.
          </span>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações de {formData.name || activeProf.name}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
