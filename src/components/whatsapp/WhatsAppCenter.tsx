import React from 'react';
import { ExternalLink, MessageCircle, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { buildWhatsAppLink, OFFICIAL_WHATSAPP_NUMBER } from '../../utils/formatters';

interface WhatsAppCenterProps {
  currentUser: User;
}

export const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({ currentUser }) => {
  const message = currentUser.role === 'admin'
    ? 'Olá! Estou acessando a administração do LEV Coworking Beauty e gostaria de iniciar um atendimento.'
    : `Olá! Aqui é ${currentUser.name}, profissional do LEV Coworking Beauty. Gostaria de iniciar um atendimento.`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="p-6 sm:p-10 text-center bg-[radial-gradient(circle_at_top,rgba(196,180,145,0.16),transparent_55%)]">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="inline-block mt-6 text-xs font-semibold text-[#c4b491] uppercase tracking-[0.2em]">
            Atendimento oficial
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-serif font-medium">WhatsApp LEV Coworking Beauty</h1>
          <p className="max-w-xl mx-auto mt-3 text-sm text-white/60 leading-relaxed">
            O atendimento é realizado diretamente pelo WhatsApp oficial da LEV. Não é necessário utilizar a automação da Cloud API.
          </p>
          <a
            href={buildWhatsAppLink(OFFICIAL_WHATSAPP_NUMBER, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Abrir WhatsApp oficial
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="mt-4 text-xs text-white/45">Número oficial: (41) 98497-9940</p>
        </div>
        <div className="p-5 sm:px-10 border-t border-white/10 bg-white/[0.02] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#c4b491] shrink-0" />
          <p className="text-xs text-white/55 leading-relaxed">
            Clientes, profissionais e administração são direcionados ao mesmo contato oficial. As mensagens serão atendidas no aplicativo WhatsApp Business já utilizado pela LEV.
          </p>
        </div>
      </section>
    </div>
  );
};

