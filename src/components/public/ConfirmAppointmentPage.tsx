import React, { useEffect, useState } from 'react';
import { Logo } from '../brand/Logo';
import { StorageService } from '../../services/storage';
import { brandStyle, currentBrand } from '../../utils/salonBrand';

// Página aberta pelo link que a profissional recebe no WhatsApp.
// Abrir a página NÃO confirma nada (o WhatsApp abre links sozinho para gerar a prévia):
// a confirmação só acontece quando ela toca no botão.

interface Summary {
  status: string;
  clientFirstName: string;
  professionalName: string;
  serviceNames: string[];
  date: string;
  startTime: string;
  endTime: string;
}

type View =
  | { kind: 'loading' }
  | { kind: 'ready'; data: Summary }
  | { kind: 'confirming'; data: Summary }
  | { kind: 'done'; data: Summary; already: boolean }
  | { kind: 'error'; message: string; data?: Summary };

const formatDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
};

const readJson = async (response: Response) => {
  try { return await response.json(); } catch { return {}; }
};

export const ConfirmAppointmentPage: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('t') || '';
  const [view, setView] = useState<View>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setView({ kind: 'error', message: 'Link de confirmação incompleto.' });
      return;
    }
    let active = true;
    fetch(`/api/whatsapp/appointment?t=${encodeURIComponent(token)}`)
      .then(async response => {
        const body = await readJson(response);
        if (!active) return;
        if (!response.ok) setView({ kind: 'error', message: body.error || 'Não foi possível abrir este horário.' });
        else if (body.status === 'confirmado') setView({ kind: 'done', data: body, already: true });
        else if (body.status !== 'aguardando_confirmacao') setView({ kind: 'error', message: 'Este horário não está mais aguardando confirmação. Confira no painel do salão.', data: body });
        else setView({ kind: 'ready', data: body });
      })
      .catch(() => active && setView({ kind: 'error', message: 'Sem conexão. Verifique a internet e tente de novo.' }));
    return () => { active = false; };
  }, [token]);

  const confirm = async (data: Summary) => {
    setView({ kind: 'confirming', data });
    try {
      const response = await fetch('/api/whatsapp/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token })
      });
      const body = await readJson(response);
      if (!response.ok) setView({ kind: 'error', message: body.error || 'Não foi possível confirmar agora.', data });
      else setView({ kind: 'done', data: { ...data, ...body }, already: Boolean(body.alreadyConfirmed) });
    } catch {
      setView({ kind: 'error', message: 'Sem conexão. Verifique a internet e tente de novo.', data });
    }
  };

  const data = 'data' in view ? view.data : undefined;

  return (
    <div className="min-h-screen bg-(--brand-bg) text-(--brand-text) flex items-center justify-center px-5 py-10 font-sans" style={brandStyle(currentBrand(StorageService.getSettings()))}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-(--brand-accent)/30 p-7 space-y-6">
        <div className="flex justify-center"><Logo size="md" /></div>

        {view.kind === 'loading' && <p className="text-center text-sm text-(--brand-text)/70">Carregando o horário...</p>}

        {data && (
          <div className="rounded-2xl bg-(--brand-bg) border border-(--brand-accent)/30 p-5 space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--brand-accent)">Agendamento</p>
            <p><span className="font-semibold">Cliente:</span> {data.clientFirstName}</p>
            <p><span className="font-semibold">Serviço:</span> {data.serviceNames.join(', ')}</p>
            <p className="capitalize"><span className="font-semibold normal-case">Data:</span> {formatDate(data.date)}</p>
            <p><span className="font-semibold">Horário:</span> {data.startTime} às {data.endTime}</p>
            {data.professionalName && <p><span className="font-semibold">Profissional:</span> {data.professionalName}</p>}
          </div>
        )}

        {view.kind === 'ready' && (
          <>
            <p className="text-center text-sm text-(--brand-text)/70">⏳ Este horário ainda <strong>não está confirmado</strong>.</p>
            <button
              type="button"
              onClick={() => confirm(view.data)}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 text-base transition-colors"
            >
              ✅ Confirmar horário e avisar a cliente
            </button>
          </>
        )}

        {view.kind === 'confirming' && (
          <button type="button" disabled className="w-full rounded-2xl bg-emerald-600/60 text-white font-semibold py-4 text-base">
            Confirmando...
          </button>
        )}

        {view.kind === 'done' && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-1">
            <p className="text-lg font-semibold text-emerald-700">✓ Horário confirmado!</p>
            <p className="text-sm text-emerald-800">
              {view.already
                ? 'Este horário já estava confirmado.'
                : 'A cliente vai receber a confirmação no WhatsApp em alguns minutos. 💖'}
            </p>
          </div>
        )}

        {view.kind === 'error' && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center text-sm text-amber-900">
            {view.message}
          </div>
        )}

        <p className="text-center text-xs text-(--brand-accent)">
          Também dá para confirmar pelo <a href="/profissional" className="underline">painel do salão</a>.
        </p>
      </div>
    </div>
  );
};
