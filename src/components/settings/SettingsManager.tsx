import React, { useState, useEffect, useRef } from 'react';
import { CoworkingSettings, Professional, User } from '../../types';
import { StorageService } from '../../services/storage';
import { ProfessionalAvatar } from '../common/ProfessionalAvatar';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { 
  Settings, 
  Save, 
  Check, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  User as UserIcon, 
  Building, 
  Image as ImageIcon,
  Mail,
  Palette
} from 'lucide-react';

const PRESET_PROFESSIONAL_PHOTOS = [
  { label: "Talitha - Estúdio Profissional (Wavy Hair)", url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800" },
  { label: "Elisangela - Executiva (Sorridente)", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" },
  { label: "Nayara - Retrato Moderno (Studio)", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800" },
  { label: "Estética Natural (Model 1)", url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800" },
  { label: "Estética Eleganza (Model 2)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" }
];

export const SettingsManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'fotos-profissionais' | 'marca-studio' | 'dados-estabelecimento' | 'seguranca'>('fotos-profissionais');
  
  // Coworking General Settings
  const [settings, setSettings] = useState<CoworkingSettings>(StorageService.getSettings());
  const [savedSettings, setSavedSettings] = useState<boolean>(false);
  const currentUser: User = StorageService.getCurrentUser();

  // Professionals List & Selection for Photo/Profile Management
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [profFormData, setProfFormData] = useState<Partial<Professional>>({});
  const [profSaveMessage, setProfSaveMessage] = useState<string>('');
  const [profImageTab, setProfImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Password change form
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    const load = () => {
      setSettings(StorageService.getSettings());
      const profs = StorageService.getProfessionals();
      setProfessionals(profs);
      if (profs.length > 0) {
        if (!selectedProfId || !profs.some(p => p.id === selectedProfId)) {
          setSelectedProfId(profs[0].id);
          setProfFormData(profs[0]);
        } else {
          const current = profs.find(p => p.id === selectedProfId);
          if (current) setProfFormData(current);
        }
      }
    };
    load();
    return StorageService.subscribeStorage(load);
  }, [selectedProfId]);

  const activeProf = professionals.find(p => p.id === selectedProfId);

  const handleSelectProfessional = (p: Professional) => {
    setSelectedProfId(p.id);
    setProfFormData(p);
    setProfSaveMessage('');
  };

  const handleProfFieldChange = (field: keyof Professional, value: any) => {
    setProfFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedBase64 = await compressImageToDataUrl(file, 320, 0.78);
      handleProfFieldChange('avatarUrl', resizedBase64);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Não foi possível processar esta imagem. Tente escolher outra foto.');
    }
  };

  const handleSaveProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProf || !profFormData.id) return;

    const updatedProf: Professional = {
      ...activeProf,
      ...profFormData,
      name: profFormData.name || activeProf.name,
      title: profFormData.title || activeProf.title,
      bio: profFormData.bio || activeProf.bio,
      avatarUrl: profFormData.avatarUrl || activeProf.avatarUrl,
      meiName: profFormData.meiName || activeProf.meiName,
      cnpjCpf: profFormData.cnpjCpf || activeProf.cnpjCpf,
      pixKey: profFormData.pixKey || activeProf.pixKey,
      bankName: profFormData.bankName || activeProf.bankName,
      phone: profFormData.phone || activeProf.phone,
      whatsapp: profFormData.whatsapp || activeProf.whatsapp,
      email: profFormData.email || activeProf.email,
    } as Professional;

    StorageService.saveProfessional(updatedProf);

    // Update active user session if editing their own profile
    const currentStorageUser = StorageService.getCurrentUser();
    if (currentStorageUser && currentStorageUser.professionalId === updatedProf.id) {
      StorageService.setCurrentUser({
        ...currentStorageUser,
        name: updatedProf.name,
        avatarUrl: updatedProf.avatarUrl
      });
    }

    setProfSaveMessage(`Foto e dados de ${updatedProf.name} salvos com sucesso!`);
    setTimeout(() => setProfSaveMessage(''), 4000);
  };

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currPass) {
      setPassError('Por favor, informe a senha atual.');
      return;
    }

    if (!newPass) {
      setPassError('Por favor, digite a nova senha.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPass.length < 3) {
      setPassError('A nova senha deve ter pelo menos 3 caracteres.');
      return;
    }

    const res = StorageService.changePassword(currentUser.id, currPass, newPass);
    if (!res.success) {
      setPassError(res.error || 'Erro ao alterar a senha.');
      return;
    }

    setPassSuccess('Sua senha foi alterada com sucesso!');
    setCurrPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassSuccess(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-white">
      {/* Header Bar */}
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Central de Configurações & Personalização
          </span>
          <h1 className="text-2xl font-serif font-medium text-white mt-1">
            Configurações do App & Edição de Imagens
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Altere fotos de perfil das profissionais, logo do studio, banners e informações gerais.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('fotos-profissionais')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'fotos-profissionais'
              ? 'bg-[#c4b491] text-[#050505] shadow-sm font-bold'
              : 'bg-[#0a0a0a] text-white/70 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Fotos das Profissionais ({professionals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('marca-studio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'marca-studio'
              ? 'bg-[#c4b491] text-[#050505] shadow-sm font-bold'
              : 'bg-[#0a0a0a] text-white/70 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Logo & Banners do Studio</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dados-estabelecimento')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'dados-estabelecimento'
              ? 'bg-[#c4b491] text-[#050505] shadow-sm font-bold'
              : 'bg-[#0a0a0a] text-white/70 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Dados do Estabelecimento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('seguranca')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'seguranca'
              ? 'bg-[#c4b491] text-[#050505] shadow-sm font-bold'
              : 'bg-[#0a0a0a] text-white/70 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Segurança & Senha</span>
        </button>
      </div>

      {/* SUB-TAB 1: FOTOS DAS PROFISSIONAIS */}
      {activeSubTab === 'fotos-profissionais' && (
        <div className="space-y-6">
          {/* Professional Selector Pills */}
          <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 space-y-3">
            <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-wider block">
              Selecione a profissional para trocar a foto de perfil:
            </span>

            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {professionals.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProfessional(p)}
                  className={`px-4 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-3 border ${
                    selectedProfId === p.id
                      ? 'bg-[#c4b491] text-[#050505] border-[#c4b491] shadow-md font-bold scale-102'
                      : 'bg-[#050505] text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <ProfessionalAvatar
                    src={p.avatarUrl}
                    name={p.name}
                    sizeClassName="w-10 h-10"
                    textClassName="text-sm"
                  />
                  <div className="text-left">
                    <span className="block text-sm leading-tight">{p.name}</span>
                    <span className="text-[10px] opacity-80 font-normal block mt-0.5 line-clamp-1">{p.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {profSaveMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{profSaveMessage}</span>
            </div>
          )}

          {activeProf && (
            <form onSubmit={handleSaveProfessional} className="space-y-6">
              {/* Photo Upload & Preview Container */}
              <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#c4b491]" />
                    <h2 className="text-base font-serif font-semibold text-white">
                      Foto do Perfil de <span className="text-[#c4b491]">{profFormData.name || activeProf.name}</span>
                    </h2>
                  </div>
                  <span className="text-[10px] text-[#c4b491] bg-[#c4b491]/10 px-3 py-1 rounded-full border border-[#c4b491]/20 font-mono">
                    Atualização em tempo real no App
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Live Avatar Preview */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#050505] rounded-xl border border-white/10 text-center space-y-4">
                    <div className="relative group">
                      <ProfessionalAvatar
                        src={profFormData.avatarUrl || activeProf.avatarUrl}
                        name={profFormData.name || activeProf.name}
                        sizeClassName="w-36 h-36"
                        textClassName="text-4xl"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-2.5 rounded-full bg-[#c4b491] text-[#050505] shadow-lg hover:bg-[#b5a37f] transition-transform hover:scale-110"
                        title="Trocar Foto"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-serif font-semibold text-white text-lg">
                        {profFormData.name || activeProf.name}
                      </h3>
                      <span className="text-xs text-[#c4b491] font-medium block mt-0.5">
                        {profFormData.title || activeProf.title}
                      </span>
                    </div>

                    {profFormData.avatarUrl?.startsWith('data:image/') && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Foto enviada do seu dispositivo
                      </span>
                    )}
                  </div>

                  {/* Photo Edit Options */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                      <button
                        type="button"
                        onClick={() => setProfImageTab('upload')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          profImageTab === 'upload'
                            ? 'bg-[#c4b491] text-[#050505]'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Enviar do Meu Dispositivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProfImageTab('url')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          profImageTab === 'url'
                            ? 'bg-[#c4b491] text-[#050505]'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Usar Link / URL da Foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProfImageTab('presets')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          profImageTab === 'presets'
                            ? 'bg-[#c4b491] text-[#050505]'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Modelos de Estúdio</span>
                      </button>
                    </div>

                    {/* Upload File Input */}
                    {profImageTab === 'upload' && (
                      <div className="p-6 bg-[#050505] rounded-xl border border-dashed border-[#c4b491]/40 text-center space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfPhotoUpload}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-full bg-[#c4b491]/10 text-[#c4b491] flex items-center justify-center mx-auto border border-[#c4b491]/30">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">
                            Clique no botão abaixo para escolher uma foto real de {profFormData.name}
                          </h4>
                          <p className="text-[11px] text-white/50 mt-1">
                            Formatos suportados: PNG, JPG ou WEBP. A foto é salva e atualizada instantaneamente.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-2 active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Selecionar Foto do Meu Computador / Celular</span>
                        </button>
                      </div>
                    )}

                    {/* URL Input */}
                    {profImageTab === 'url' && (
                      <div className="p-5 bg-[#050505] rounded-xl border border-white/10 space-y-3">
                        <label className="block text-xs font-semibold text-white/80">
                          Cole o link direto (URL) da imagem da profissional:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://exemplo.com/foto-talitha.jpg"
                            value={profFormData.avatarUrl || ''}
                            onChange={e => handleProfFieldChange('avatarUrl', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-[#0a0a0a] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-white/50">
                          Você pode colar links do seu Google Drive público, Instagram ou banco de imagens.
                        </p>
                      </div>
                    )}

                    {/* Presets */}
                    {profImageTab === 'presets' && (
                      <div className="p-4 bg-[#050505] rounded-xl border border-white/10 space-y-3">
                        <span className="block text-xs font-semibold text-white/80">
                          Fotos pré-selecionadas com iluminação de estúdio:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {PRESET_PROFESSIONAL_PHOTOS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleProfFieldChange('avatarUrl', preset.url)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                                profFormData.avatarUrl === preset.url
                                  ? 'bg-[#c4b491]/20 border-[#c4b491] text-[#c4b491]'
                                  : 'bg-[#0a0a0a] border-white/10 hover:border-white/30 text-white/70'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                              />
                              <span className="text-[11px] font-medium leading-snug line-clamp-2">
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

              {/* Personal Data & Title */}
              <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <UserIcon className="w-5 h-5 text-[#c4b491]" />
                  <h2 className="text-base font-serif font-semibold text-white">
                    Dados Pessoais & Apresentação no App
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-white/70 block mb-1">Nome Profissional *</label>
                    <input
                      type="text"
                      required
                      value={profFormData.name || ''}
                      onChange={e => handleProfFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-white/70 block mb-1">Título / Especialidades *</label>
                    <input
                      type="text"
                      required
                      value={profFormData.title || ''}
                      onChange={e => handleProfFieldChange('title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-white/70 block mb-1 text-xs">Apresentação para Clientes (Bio)</label>
                  <textarea
                    rows={3}
                    value={profFormData.bio || ''}
                    onChange={e => handleProfFieldChange('bio', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/60">
                  Ao salvar, a foto de {profFormData.name} será atualizada na agenda e na área do cliente.
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Foto e Perfil de {profFormData.name || activeProf.name}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUB-TAB 2: LOGO & BANNERS DO STUDIO */}
      {activeSubTab === 'marca-studio' && (
        <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
          {savedSettings && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Imagens da marca do Studio salvas com sucesso!</span>
            </div>
          )}

          <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#c4b491]" />
                <h2 className="text-base font-serif font-semibold text-white">
                  Identidade Visual, Logomarca & Banners
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Card */}
              <div className="p-5 bg-[#050505] rounded-xl border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#c4b491]" />
                  Logomarca / Emblema do Studio
                </h3>

                <div className="flex items-center gap-4">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo Studio" className="w-20 h-20 rounded-xl object-cover border-2 border-[#c4b491] shadow-md" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/30 flex flex-col items-center justify-center text-[#c4b491] font-bold text-xs">
                      <span>LEV</span>
                      <span className="text-[9px] font-normal opacity-70">Logo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Cole a URL da Logo (https://...)"
                      value={settings.logoUrl || ''}
                      onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0a0a0a] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                    />

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            if (ev.target?.result) {
                              setSettings({ ...settings, logoUrl: ev.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#c4b491]/20 hover:bg-[#c4b491]/30 text-[#c4b491] border border-[#c4b491]/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar Logo do Computador</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner Card */}
              <div className="p-5 bg-[#050505] rounded-xl border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#c4b491]" />
                  Banner do Topo (Página Inicial)
                </h3>

                <div className="flex items-center gap-4">
                  {settings.heroBannerUrl ? (
                    <img src={settings.heroBannerUrl} alt="Banner Topo" className="w-28 h-20 rounded-xl object-cover border-2 border-[#c4b491] shadow-md" />
                  ) : (
                    <div className="w-28 h-20 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/30 flex items-center justify-center text-[#c4b491] text-xs font-semibold">
                      Banner Capa
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Cole a URL do Banner (https://...)"
                      value={settings.heroBannerUrl || ''}
                      onChange={e => setSettings({ ...settings, heroBannerUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0a0a0a] text-xs text-white focus:border-[#c4b491] focus:outline-none"
                    />

                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            if (ev.target?.result) {
                              setSettings({ ...settings, heroBannerUrl: ev.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#c4b491]/20 hover:bg-[#c4b491]/30 text-[#c4b491] border border-[#c4b491]/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar Banner do Computador</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Imagens do Studio</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: DADOS DO ESTABELECIMENTO */}
      {activeSubTab === 'dados-estabelecimento' && (
        <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
          {savedSettings && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Informações do Coworking salvas com sucesso!</span>
            </div>
          )}

          <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-white/70 block mb-1">Nome Oficial do Estabelecimento</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={e => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-white/70 block mb-1">Slogan Institucional</label>
                <input
                  type="text"
                  value={settings.slogan}
                  onChange={e => setSettings({ ...settings, slogan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-white/70 block mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-white/70 block mb-1">WhatsApp de Atendimento</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-white/70 block mb-1">Instagram (@)</label>
                <input
                  type="text"
                  value={settings.instagram}
                  onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1 text-xs">Endereço Completo</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-white/70 block mb-1 text-xs">Política de Cancelamento</label>
              <textarea
                rows={3}
                value={settings.cancellationPolicy}
                onChange={e => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:border-[#c4b491] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Informações do Coworking</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 4: SEGURANÇA E SENHA */}
      {activeSubTab === 'seguranca' && (
        <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#c4b491]" />
            <div>
              <h2 className="text-base font-serif font-medium text-white">Segurança e Alteração de Senha</h2>
              <p className="text-xs text-white/60">
                Altere a senha da sua conta ativa (<strong>{currentUser.name}</strong> - <em>{currentUser.role}</em>).
              </p>
            </div>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-white/70 block mb-1">Senha Atual *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currPass}
                    onChange={e => setCurrPass(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:outline-none focus:border-[#c4b491]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white/70 block mb-1">Nova Senha *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:outline-none focus:border-[#c4b491]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white/70 block mb-1">Confirmar *</label>
                <div className="relative">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs focus:outline-none focus:border-[#c4b491]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Salvar Nova Senha</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
