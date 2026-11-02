import React, { useEffect, useMemo, useState } from 'react';
import { Appointment } from '../../types';
import { buildWhatsAppLink } from '../../utils/formatters';
import { buildFollowUps, FollowUp, FollowUpKind } from '../../utils/followUps';
import { WhatsAppRobotService } from '../../services/whatsappRobot';
import { Bell, Heart, RefreshCw, MessageCircle, Check, Bot } from 'lucide-react';

interface FollowUpsPanelProps {
  appointments: Appointment[];
  today: string;
  isAdmin?: boolean;
}

const SENT_KEY = 'lev_followups_sent_v1';

const readSent = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SENT_KEY) || '[]') as string[]);
  } catch {
    return new Set();
  }
};

const SECTIONS: { kind: FollowUpKind; title: string; hint: string; icon: React.ReactNode }[] = [
  { kind: 'lembrete', title: 'Lembrar horário', hint: 'Atendimentos de hoje e amanhã', icon: <Bell className="w-4 h-4" /> },
  { kind: 'agradecimento', title: 'Agradecer', hint: 'Atendimentos concluídos nos últimos dias', icon: <Heart className="w-4 h-4" /> },
  { kind: 'manutencao', title: 'Chamar para manutenção', hint: 'Prazo de manutenção vencido e sem horário marcado', icon: <RefreshCw className="w-4 h-4" /> }
];

// Mensagens prontas para a profissional enviar pelo próprio WhatsApp.
export const FollowUpsPanel: React.FC<FollowUpsPanelProps> = ({ appointments, today, isAdmin = false }) => {
  const [sent, setSent] = useState<Set<string>>(readSent);
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testFeedback, setTestFeedback] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let active = true;
    WhatsAppRobotService.isAutomatic()
      .then(value => { if (active) setIsAutomatic(value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleSendTest = async () => {
    setIsTesting(true);
    setTestFeedback('');
    try {
      await WhatsAppRobotService.sendTest(testPhone);
      setTestFeedback('Mensagem de teste enviada. Confira o WhatsApp desse número.');
    } catch (error) {
      setTestFeedback(error instanceof Error ? error.message : 'Não foi possível enviar o teste.');
    } finally {
      setIsTesting(false);
    }
  };
  const items = useMemo(() => buildFollowUps(appointments, today, sent), [appointments, today, sent]);

  const markSent = (item: FollowUp) => {
    const next = new Set(sent).add(item.key);
    localStorage.setItem(SENT_KEY, JSON.stringify(Array.from(next)));
    setSent(next);
  };

  return (
    <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
      <div>
        <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">Mensagens para clientes</span>
        {isAutomatic ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-1.5 text-xs text-[#7EE2A8]">
              <Bot className="w-4 h-4" />
              Robô ligado: lembretes, agradecimentos e manutenções saem automaticamente pelo WhatsApp da LEV.
            </p>
            <button type="button" onClick={() => setShowManual(value => !value)} className="text-[11px] underline text-white/50 hover:text-white">
              {showManual ? 'Esconder lista manual' : 'Ver lista manual'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-white/60 mt-1">
            Toque em “Enviar” para abrir o WhatsApp com a mensagem pronta. Depois de enviar, ela sai da lista.
          </p>
        )}
      </div>

      {isAdmin && isAutomatic && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <span className="text-xs text-white/70">Testar o robô:</span>
          <input
            type="tel"
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            placeholder="(41) 99999-9999"
            className="px-3 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white focus:outline-hidden focus:border-[#c4b491]"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isTesting || testPhone.replace(/\D/g, '').length < 10}
            className="px-3 py-1.5 rounded-lg bg-[#c4b491] text-[#050505] text-xs font-semibold disabled:opacity-40"
          >
            {isTesting ? 'Enviando...' : 'Enviar teste'}
          </button>
          {testFeedback && <span className="text-[11px] text-white/60">{testFeedback}</span>}
        </div>
      )}

      {(!isAutomatic || showManual) && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {SECTIONS.map(section => {
          const list = items.filter(item => item.kind === section.kind);
          return (
            <div key={section.kind} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-[#c4b491]">
                {section.icon}
                <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                <span className="ml-auto text-xs text-white/50">{list.length}</span>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5 mb-3">{section.hint}</p>
              {list.length === 0 ? (
                <p className="text-xs text-white/40">Nada pendente.</p>
              ) : (
                <ul className="space-y-2">
                  {list.map(item => (
                    <li key={item.key} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                      <p className="text-xs font-semibold text-white">{item.appointment.clientName}</p>
                      <p className="text-[11px] text-white/50">
                        {item.appointment.serviceNames.join(', ')} · {item.appointment.date.split('-').reverse().join('/')}
                        {item.kind === 'lembrete' && ` às ${item.appointment.startTime}`}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <a
                          href={buildWhatsAppLink(item.appointment.clientPhone, item.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markSent(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 text-[#7EE2A8] hover:bg-[#25D366]/25 text-[11px] font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Enviar
                        </a>
                        <button
                          type="button"
                          onClick={() => markSent(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white text-[11px]"
                          title="Tirar da lista sem enviar"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Dispensar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
