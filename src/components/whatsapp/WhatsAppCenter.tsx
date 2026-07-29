import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { generateWhatsAppMessage, buildWhatsAppLink } from '../../utils/formatters';
import { MessageCircle, Copy, Send, Check } from 'lucide-react';

export const WhatsAppCenter: React.FC = () => {
  const [templateType, setTemplateType] = useState<string>('confirmacao');
  const [clientName, setClientName] = useState<string>('Camila Rodrigues');
  const [clientPhone, setClientPhone] = useState<string>('11998881122');
  const [professionalName, setProfessionalName] = useState<string>('Nayara');
  const [serviceName, setServiceName] = useState<string>('Manutenção de Gel');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('14:00');
  const [copied, setCopied] = useState<boolean>(false);

  const messageText = generateWhatsAppMessage(templateType, {
    clientName,
    professionalName,
    serviceName,
    date,
    time,
    depositValue: 40,
    pixKey: 'nayara.gelnails@pix.com.br'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-white">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs">
        <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
          Comunicação Direta
        </span>
        <h1 className="text-2xl font-serif font-medium text-white mt-1">
          Central WhatsApp & Modelos
        </h1>
        <p className="text-xs text-white/60 mt-1">
          Gere mensagens formatadas e abra diretamente o aplicativo do WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 space-y-4">
          <h2 className="font-serif text-base font-semibold text-white">
            Configurar Mensagem
          </h2>

          <div>
            <label className="text-xs font-semibold text-white/60 block mb-1">Modelo de Mensagem</label>
            <select
              value={templateType}
              onChange={e => setTemplateType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs font-medium text-white"
            >
              <option value="confirmacao">Confirmação de Agendamento</option>
              <option value="lembrete">Lembrete de Atendimento</option>
              <option value="solicitacao_sinal">Solicitação de Sinal / Pix</option>
              <option value="confirmacao_pagamento">Confirmação de Pagamento</option>
              <option value="reagendamento">Aviso de Reagendamento</option>
              <option value="cancelamento">Aviso de Cancelamento</option>
              <option value="aniversario">Parabéns Aniversariante</option>
              <option value="pos_atendimento">Pós-Atendimento e Pesquisa</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-semibold text-white/60 block mb-1">Nome da Cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-white/60 block mb-1">Telefone WhatsApp</label>
              <input
                type="text"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-semibold text-white/60 block mb-1">Profissional</label>
              <input
                type="text"
                value={professionalName}
                onChange={e => setProfessionalName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-white/60 block mb-1">Serviço</label>
              <input
                type="text"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Preview & Send */}
        <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-serif text-base font-semibold text-white mb-2">
              Pré-visualização do Texto
            </h2>

            <div className="p-4 rounded-xl bg-[#050505] border border-emerald-500/20 text-xs text-emerald-300 font-sans whitespace-pre-wrap leading-relaxed">
              {messageText}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar Texto"}
            </button>

            <a
              href={buildWhatsAppLink(clientPhone, messageText)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
