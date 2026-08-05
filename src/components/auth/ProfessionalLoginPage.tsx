import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { ProfessionalAuthService, ProfessionalProfileId, ProfessionalSession } from '../../services/professionalAuth';
import { User } from '../../types';

const PROFILES: Array<{ id: ProfessionalProfileId; name: string }> = [
  { id: 'prof_elisangela', name: 'Elisangela' },
  { id: 'prof_talitha', name: 'Talitha' },
  { id: 'prof_nayara', name: 'Nayara' }
];

export const ProfessionalLoginPage: React.FC<{ onAuthenticated: (user: User) => void }> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [profileId, setProfileId] = useState<ProfessionalProfileId>('prof_elisangela');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const enter = (session: ProfessionalSession) => {
    if (session.access.status !== 'approved') {
      setMessage('Sua solicitação foi enviada e aguarda aprovação da administração.');
      return;
    }
    onAuthenticated({
      id: session.userId,
      name: session.access.display_name,
      email: session.email,
      role: 'profissional',
      professionalId: session.access.professional_id
    });
  };

  useEffect(() => {
    ProfessionalAuthService.restore().then(session => session && enter(session));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'register') {
        const selected = PROFILES.find(profile => profile.id === profileId)!;
        const result = await ProfessionalAuthService.signUp({ email, password, professionalId: profileId, displayName: selected.name });
        setMessage(result.needsConfirmation
          ? 'Conta criada. Confirme o e-mail recebido e depois volte para entrar.'
          : 'Solicitação enviada. Aguarde a aprovação da administração.');
        setMode('login');
      } else {
        enter(await ProfessionalAuthService.signIn(email, password));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível continuar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-7 shadow-2xl">
        <Logo size="lg" variant="symbol" className="mx-auto" />
        <h1 className="mt-3 text-center font-serif text-3xl">Portal da Profissional</h1>
        <p className="mt-2 text-center text-sm text-white/55">Acesso individual à sua agenda e ao seu ambiente.</p>
        <div className="mt-6 flex rounded-xl border border-white/10 bg-black p-1">
          <button onClick={() => setMode('login')} className={`flex-1 rounded-lg py-2 text-xs ${mode === 'login' ? 'bg-[#c4b491] text-black' : 'text-white/60'}`}>Entrar</button>
          <button onClick={() => setMode('register')} className={`flex-1 rounded-lg py-2 text-xs ${mode === 'register' ? 'bg-[#c4b491] text-black' : 'text-white/60'}`}>Criar acesso</button>
        </div>
        {error && <div className="mt-4 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200"><AlertCircle className="h-4 w-4"/>{error}</div>}
        {message && <div className="mt-4 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4"/>{message}</div>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-xs text-white/70">Selecione seu perfil</label>
              <select value={profileId} onChange={event => setProfileId(event.target.value as ProfessionalProfileId)} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm">
                {PROFILES.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </div>
          )}
          <input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="E-mail pessoal" className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#c4b491]"/>
          <input type="password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="Senha segura (mínimo 8 caracteres)" className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#c4b491]"/>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c4b491] py-3 text-sm font-semibold text-black disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin"/>}{mode === 'login' ? 'Entrar no meu ambiente' : 'Enviar solicitação'}
          </button>
        </form>
        <a href="/" className="mt-6 block text-center text-xs text-white/45">Voltar ao site</a>
      </section>
    </main>
  );
};
