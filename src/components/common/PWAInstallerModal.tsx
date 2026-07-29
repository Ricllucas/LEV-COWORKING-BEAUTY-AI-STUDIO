import React, { useState } from 'react';
import { Smartphone, Monitor, Share, PlusSquare, MoreVertical, Download, X, Check } from 'lucide-react';
import { Logo } from '../brand/Logo';

interface PWAInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallerModal: React.FC<PWAInstallerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'iphone' | 'android' | 'desktop'>('iphone');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#0a0a0a] rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Logo size="md" variant="symbol" theme="dark" className="mx-auto mb-2" />
          <h2 className="text-xl font-serif font-medium text-white">
            Instalar LEV COWORKING BEAUTY
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Instale o aplicativo na tela inicial do seu dispositivo para acesso rápido, notificações e visual nativo sem abrir o navegador.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-[#050505] p-1 rounded-xl mb-5 border border-white/10">
          <button
            onClick={() => setActiveTab('iphone')}
            className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'iphone' ? 'bg-white/10 text-white shadow-2xs font-semibold' : 'text-white/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#c4b491]" />
            iPhone / iOS
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'android' ? 'bg-white/10 text-white shadow-2xs font-semibold' : 'text-white/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Android
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'desktop' ? 'bg-white/10 text-white shadow-2xs font-semibold' : 'text-white/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            Computador
          </button>
        </div>

        {/* Instructions Content */}
        <div className="bg-[#050505] p-4 rounded-xl border border-white/10 space-y-3.5">
          {activeTab === 'iphone' && (
            <>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <p className="leading-relaxed pt-0.5">
                  Abra este site no navegador <strong>Safari</strong> do seu iPhone.
                </p>
              </div>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <p className="leading-relaxed pt-0.5 flex items-center gap-1">
                  Toque no botão de <strong>Compartilhar</strong> <Share className="w-4 h-4 text-blue-400 inline" /> na barra inferior.
                </p>
              </div>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <p className="leading-relaxed pt-0.5 flex items-center gap-1">
                  Role a lista e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-4 h-4 text-[#c4b491] inline" />.
                </p>
              </div>
            </>
          )}

          {activeTab === 'android' && (
            <>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <p className="leading-relaxed pt-0.5">
                  Abra o site no navegador <strong>Google Chrome</strong> do celular.
                </p>
              </div>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <p className="leading-relaxed pt-0.5 flex items-center gap-1">
                  Toque no menu de três pontos <MoreVertical className="w-4 h-4 text-[#c4b491] inline" /> no canto superior direito.
                </p>
              </div>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <p className="leading-relaxed pt-0.5 flex items-center gap-1">
                  Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong> <Download className="w-4 h-4 text-[#c4b491] inline" />.
                </p>
              </div>
            </>
          )}

          {activeTab === 'desktop' && (
            <>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <p className="leading-relaxed pt-0.5">
                  No Chrome, Edge ou Brave, clique no ícone de instalação <Download className="w-4 h-4 text-[#c4b491] inline" /> na barra de endereço superior.
                </p>
              </div>
              <div className="flex items-start gap-3 text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-[#c4b491]/50 text-[#c4b491] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <p className="leading-relaxed pt-0.5">
                  Confirme a instalação e o LEV COWORKING BEAUTY abrirá como uma janela de aplicativo independente na sua área de trabalho.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-xs"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
