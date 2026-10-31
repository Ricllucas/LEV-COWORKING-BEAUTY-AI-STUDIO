import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, CircleAlert, Loader2, MessageCircle, RefreshCw, Send, UserRoundCheck } from 'lucide-react';
import { User, WhatsAppConversation, WhatsAppMessage } from '../../types';
import { StorageService } from '../../services/storage';
import { WhatsAppConversationService } from '../../services/whatsappConversations';

interface WhatsAppCenterProps {
  currentUser: User;
}

const dateTime = (value: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
};

export const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({ currentUser }) => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const professionals = StorageService.getProfessionals();
  const selected = conversations.find(item => item.id === selectedId);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await WhatsAppConversationService.list(currentUser);
      setConversations(list);
      setError(undefined);
      if (!selectedId && list[0]) setSelectedId(list[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível abrir a Central WhatsApp.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser.id, currentUser.role, selectedId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const list = await WhatsAppConversationService.messages(currentUser, conversationId);
      setMessages(list);
      await WhatsAppConversationService.markRead(currentUser, conversationId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as mensagens.');
    }
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    void loadConversations();
    const interval = window.setInterval(() => void loadConversations(true), 10000);
    return () => window.clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId);
    const interval = window.setInterval(() => void loadMessages(selectedId), 7000);
    return () => window.clearInterval(interval);
  }, [selectedId, loadMessages]);

  const totalUnread = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations]
  );

  const sendMessage = async () => {
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const sent = await WhatsAppConversationService.send(currentUser, selectedId, draft);
      setMessages(current => [...current, sent]);
      setDraft('');
      setError(undefined);
      await loadConversations(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const assignProfessional = async (professionalId: string) => {
    if (!selectedId || currentUser.role !== 'admin') return;
    try {
      await WhatsAppConversationService.updateConversation(currentUser, selectedId, {
        assignedProfessionalId: professionalId || null,
        status: professionalId ? 'aguardando' : 'bot'
      });
      await loadConversations(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível atribuir a conversa.');
    }
  };

  const toggleBot = async () => {
    if (!selectedId || !selected) return;
    try {
      await WhatsAppConversationService.updateConversation(currentUser, selectedId, {
        botEnabled: !selected.botEnabled,
        status: selected.botEnabled ? 'em_atendimento' : 'bot'
      });
      await loadConversations(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível alterar a automação.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 text-white">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest">Atendimento compartilhado</span>
          <h1 className="text-2xl font-serif font-medium mt-1">Central WhatsApp LEV</h1>
          <p className="text-xs text-white/60 mt-1">Um único número, com conversas direcionadas para cada profissional.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            {totalUnread} não lida{totalUnread === 1 ? '' : 's'}
          </span>
          <button onClick={() => void loadConversations()} className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5" title="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-sm flex gap-3">
          <CircleAlert className="w-5 h-5 shrink-0" />
          <div><strong>Configuração necessária:</strong> {error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[620px]">
        <aside className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 font-semibold text-sm">Conversas</div>
          <div className="max-h-[570px] overflow-y-auto">
            {loading && <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#c4b491]" /></div>}
            {!loading && conversations.length === 0 && (
              <div className="p-8 text-center text-white/40 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-3" />
                Nenhuma conversa recebida ainda.
              </div>
            )}
            {conversations.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full p-4 text-left border-b border-white/5 transition-colors ${selectedId === conversation.id ? 'bg-[#c4b491]/10' : 'hover:bg-white/[0.03]'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold truncate">{conversation.clientName}</span>
                  {conversation.unreadCount > 0 && <span className="bg-emerald-500 text-black text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{conversation.unreadCount}</span>}
                </div>
                <div className="text-[11px] text-[#c4b491] mt-1">{conversation.assignedProfessionalName || 'Aguardando escolha'}</div>
                <div className="text-xs text-white/45 truncate mt-1">{conversation.lastMessage}</div>
                <div className="text-[10px] text-white/30 mt-1">{dateTime(conversation.lastMessageAt)}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-[#0a0a0a] rounded-2xl border border-white/10 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/35 p-8 text-center">
              <MessageCircle className="w-12 h-12 mb-3" />
              Selecione uma conversa para iniciar o atendimento.
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{selected.clientName}</div>
                  <div className="text-xs text-white/50">+{selected.clientPhone}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentUser.role === 'admin' && (
                    <select value={selected.assignedProfessionalId || ''} onChange={event => void assignProfessional(event.target.value)} className="px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs">
                      <option value="">Sem profissional</option>
                      {professionals.map(professional => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
                    </select>
                  )}
                  <button onClick={() => void toggleBot()} className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 ${selected.botEnabled ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-white/10 text-white/60'}`}>
                    <Bot className="w-4 h-4" /> Automação {selected.botEnabled ? 'ativa' : 'pausada'}
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6 space-y-3 overflow-y-auto max-h-[460px] bg-[#050505]">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.direction === 'saida' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${message.direction === 'saida' ? 'bg-[#c4b491] text-[#050505] rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                      <div className="text-[10px] font-bold opacity-65 mb-1">{message.senderName}</div>
                      <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                      <div className="text-[9px] opacity-55 text-right mt-1">{dateTime(message.sentAt)} · {message.status}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 flex gap-2">
                <textarea
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
                  }}
                  placeholder="Digite sua mensagem..."
                  rows={2}
                  className="flex-1 resize-none px-4 py-3 rounded-xl bg-[#050505] border border-white/10 text-sm outline-hidden focus:border-[#c4b491]/60"
                />
                <button disabled={!draft.trim() || sending} onClick={() => void sendMessage()} className="px-4 rounded-xl bg-[#c4b491] text-[#050505] disabled:opacity-40 flex items-center justify-center">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-xs text-white/50 flex items-start gap-2">
        <UserRoundCheck className="w-4 h-4 text-[#c4b491] shrink-0" />
        Profissionais visualizam somente as conversas atribuídas ao próprio perfil. A administração pode acompanhar e redistribuir todos os atendimentos.
      </div>
    </div>
  );
};
