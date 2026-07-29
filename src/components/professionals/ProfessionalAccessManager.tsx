import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ShieldX } from 'lucide-react';

type Request = {
  user_id: string;
  professional_id: string;
  display_name: string;
  email?: string;
  status: 'pending' | 'approved' | 'blocked';
};

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const adminToken = () => {
  try { return JSON.parse(sessionStorage.getItem('lev_admin_session_v1') || '{}').accessToken as string | undefined; }
  catch { return undefined; }
};

export const ProfessionalAccessManager: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = adminToken();
    if (!url || !key || !token) return setLoading(false);
    const response = await fetch(`${url}/rest/v1/professional_access?select=*&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` }
    });
    if (response.ok) setRequests(await response.json());
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const update = async (request: Request, status: 'approved' | 'blocked') => {
    const token = adminToken();
    if (!url || !key || !token) return;
    await fetch(`${url}/rest/v1/professional_access?user_id=eq.${request.user_id}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? JSON.parse(sessionStorage.getItem('lev_admin_session_v1') || '{}').userId : null
      })
    });
    await load();
  };

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-4">
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
        <h2 className="font-serif text-xl text-white">Acessos das profissionais</h2>
        <p className="mt-1 text-xs text-white/50">Aprove somente a profissional correspondente ao perfil solicitado.</p>
        {loading ? <p className="mt-4 text-sm text-white/50">Carregando solicitações...</p> : requests.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-white/55">Nenhuma solicitação recebida.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {requests.map(request => (
              <div key={request.user_id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <p className="font-semibold text-white">{request.display_name}</p>
                  <p className="text-xs text-white/50">{request.email || 'E-mail protegido'} · {request.professional_id}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-[#c4b491]">
                  {request.status === 'approved' ? <CheckCircle2 className="h-4 w-4"/> : request.status === 'blocked' ? <ShieldX className="h-4 w-4"/> : <Clock3 className="h-4 w-4"/>}
                  {request.status === 'approved' ? 'Aprovado' : request.status === 'blocked' ? 'Bloqueado' : 'Aguardando'}
                </span>
                <button onClick={() => update(request, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold">Aprovar</button>
                <button onClick={() => update(request, 'blocked')} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold">Bloquear</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
