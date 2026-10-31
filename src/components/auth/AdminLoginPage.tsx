import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, LockKeyhole, ScanFace } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { AdminAuthService, AdminSession } from '../../services/adminAuth';
import { User } from '../../types';

interface AdminLoginPageProps {
  onAuthenticated: (user: User) => void;
}

const toAdminUser = (session: AdminSession): User => ({
  id: session.userId,
  name: session.displayName,
  email: session.email,
  role: 'admin'
});

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enableFace, setEnableFace] = useState(false);

  useEffect(() => {
    let mounted = true;
    AdminAuthService.restore()
      .then(session => {
        if (mounted && session) onAuthenticated(toAdminUser(session));
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [onAuthenticated]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await AdminAuthService.signIn(email, password);
      if (enableFace) await AdminAuthService.registerPasskey(session);
      onAuthenticated(toAdminUser(session));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFaceLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      onAuthenticated(toAdminUser(await AdminAuthService.signInWithPasskey()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível confirmar sua identidade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-7 shadow-2xl">
        <Logo size="lg" variant="symbol" className="mx-auto mb-5" />
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c4b491]">
          LEV Coworking Beauty
        </p>
        <h1 className="mt-2 text-center font-serif text-3xl">Área Administrativa</h1>
        <p className="mt-2 text-center text-sm text-white/55">
          Acesso separado e protegido para a gestão do espaço.
        </p>

        {checking ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando acesso seguro...
          </div>
        ) : !AdminAuthService.isConfigured() ? (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
            A área administrativa está aguardando a configuração final do servidor.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/70">E-mail administrativo</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm outline-none transition focus:border-[#c4b491]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/70">Senha</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-white/35" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Digite sua senha segura"
                  className="w-full rounded-xl border border-white/10 bg-[#050505] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#c4b491]"
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
              <input
                type="checkbox"
                checked={enableFace}
                onChange={event => setEnableFace(event.target.checked)}
                className="mt-0.5 accent-[#c4b491]"
              />
              <span><strong className="block text-white/85">Cadastrar reconhecimento facial neste aparelho</strong>O Face ID, reconhecimento facial ou Windows Hello será solicitado depois da senha.</span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c4b491] py-3 text-sm font-semibold text-[#050505] transition hover:bg-[#b5a37f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Verificando...' : 'Entrar com segurança'}
            </button>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-white/30"><span className="h-px flex-1 bg-white/10"/>ou<span className="h-px flex-1 bg-white/10"/></div>
            <button
              type="button"
              onClick={handleFaceLogin}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#c4b491]/40 py-3 text-sm font-semibold text-[#c4b491] transition hover:bg-[#c4b491]/10 disabled:opacity-60"
            >
              <ScanFace className="h-5 w-5" /> Entrar com reconhecimento facial / biometria
            </button>
          </form>
        )}

        <a href="/" className="mt-6 block text-center text-xs text-white/45 hover:text-[#c4b491]">
          Voltar ao site para clientes
        </a>
      </section>
    </main>
  );
};

