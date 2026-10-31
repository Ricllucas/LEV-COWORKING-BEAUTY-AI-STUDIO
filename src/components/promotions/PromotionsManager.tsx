import React from 'react';
import { Sparkles, Award, Tag, CheckCircle2 } from 'lucide-react';

export const PromotionsManager: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-white">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs">
        <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
          Marketing & Fidelização
        </span>
        <h1 className="text-2xl font-serif font-medium text-white mt-1">
          Promoções & Cartão Fidelidade
        </h1>
        <p className="text-xs text-white/60 mt-1">
          Configuração de combos, descontos e programas de selos virtuais por MEI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-[#c4b491]">
            <Award className="w-5 h-5" />
            <h2 className="font-serif text-base font-semibold text-white">Cartão Fidelidade Virtual</h2>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Cada 10 atendimentos com a mesma profissional garantem 1 recompensa exclusiva ou desconto no próximo procedimento.
          </p>
          <div className="p-3 bg-[#050505] border border-white/10 rounded-xl text-xs space-y-1">
            <p className="font-semibold text-white">Regra Atual do Coworking:</p>
            <p className="text-white/70">10 Selos = R$ 30,00 de desconto ou Spa de Cutícula gratuito.</p>
          </div>
        </div>

        <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-[#c4b491]">
            <Tag className="w-5 h-5" />
            <h2 className="font-serif text-base font-semibold text-white">Combos e Pacotes Ativos</h2>
          </div>
          <div className="p-3 bg-[#050505] border border-white/10 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-white">Combo Mão e Pé Tradicional (Elisangela)</span>
            <p className="text-[#c4b491]">De R$ 100,00 por R$ 85,00</p>
          </div>
        </div>
      </div>
    </div>
  );
};
