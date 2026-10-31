import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { User } from '../../types';
import { X, Mail, Lock, User as UserIcon, Phone, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAuthenticated: (user: User) => void;
  defaultMode?: 'login' | 'register' | 'forgot' | 'changePassword';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onUserAuthenticated,
  defaultMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'changePassword'>(defaultMode);
  
  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password form
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // Change password form (for logged in user)
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');

  // States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentUser = StorageService.getCurrentUser();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Por favor, preencha o E-mail ou Celular e a sua senha.');
      return;
    }

    const res = StorageService.authenticateUser(loginIdentifier, loginPassword);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Falha ao autenticar.');
      return;
    }

    setSuccessMsg(`Bem-vindo(a), ${res.user.name}!`);
    setTimeout(() => {
      onUserAuthenticated(res.user!);
      onClose();
    }, 500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Por favor, digite seu Nome Completo.');
      return;
    }

    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMsg('Por favor, informe pelo menos o E-mail ou o Celular/WhatsApp para identificação.');
      return;
    }

    if (!regPassword) {
      setErrorMsg('Por favor, crie uma senha.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    if (regPassword.length < 3) {
      setErrorMsg('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    const res = StorageService.registerClientUser({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword
    });

    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Erro ao registrar conta.');
      return;
    }

    setSuccessMsg('Conta criada com sucesso! Você já está conectada.');
    setTimeout(() => {
      onUserAuthenticated(res.user!);
      onClose();
    }, 600);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!forgotIdentifier.trim()) {
      setErrorMsg('Por favor, informe o E-mail ou Celular/WhatsApp cadastrado.');
      return;
    }

    if (!forgotNewPassword) {
      setErrorMsg('Por favor, crie uma nova senha.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (forgotNewPassword.length < 3) {
      setErrorMsg('A nova senha deve possuir pelo menos 3 caracteres.');
      return;
    }

    const res = StorageService.resetPassword(forgotIdentifier, forgotNewPassword);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Não foi possível redefinir a senha.');
      return;
    }

    setSuccessMsg(`Senha alterada com sucesso para ${res.user.name}! Efetuando login...`);
    setTimeout(() => {
      onUserAuthenticated(res.user!);
      onClose();
    }, 700);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!changeCurrentPassword) {
      setErrorMsg('Por favor, digite sua senha atual.');
      return;
    }

    if (!changeNewPassword) {
      setErrorMsg('Por favor, digite a nova senha desejada.');
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      setErrorMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (changeNewPassword.length < 3) {
      setErrorMsg('A nova senha deve possuir pelo menos 3 caracteres.');
      return;
    }

    const res = StorageService.changePassword(currentUser.id, changeCurrentPassword, changeNewPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao alterar a senha.');
      return;
    }

    setSuccessMsg('Sua senha foi alterada com sucesso!');
    setTimeout(() => {
      setChangeCurrentPassword('');
      setChangeNewPassword('');
      setChangeConfirmPassword('');
      setMode('login');
    }, 1000);
  };

  const handleQuickFill = (identifier: string, pass: string = '123') => {
    setLoginIdentifier(identifier);
    setLoginPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl p-6 relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#c4b491] px-2.5 py-1 rounded-full bg-[#c4b491]/10 border border-[#c4b491]/20">
            <Sparkles className="w-3 h-3" /> LEV Coworking Beauty
          </span>
          <h2 className="text-2xl font-serif text-white font-medium mt-2">
            {mode === 'login' && 'Acessar Conta'}
            {mode === 'register' && 'Cadastro de Cliente'}
            {mode === 'forgot' && 'Recuperar / Esqueci Minha Senha'}
            {mode === 'changePassword' && 'Alterar Senha de Acesso'}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {mode === 'login' && 'Entre com e-mail e senha para acessar sua área única.'}
            {mode === 'register' && 'Crie sua conta de cliente para escolher profissionais e agendar serviços.'}
            {mode === 'forgot' && 'Informe o E-mail ou Celular cadastrado para redefinir sua senha com segurança.'}
            {mode === 'changePassword' && `Alterando senha para a conta atual (${currentUser.name}).`}
          </p>
        </div>

        {/* Mode Tabs / Navigation */}
        {mode === 'login' || mode === 'register' ? (
          <div className="flex bg-[#050505] p-1 rounded-xl border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#c4b491] text-[#050505] shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Já tenho Conta (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#c4b491] text-[#050505] shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sou Nova Cliente
            </button>
          </div>
        ) : (
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs text-[#c4b491] hover:underline font-medium inline-flex items-center gap-1"
            >
              ← Voltar para o Login
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Admin Fast Pass Box */}
            <div className="p-3.5 rounded-2xl bg-[#c4b491]/10 border border-[#c4b491]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c4b491]">
                  <ShieldCheck className="w-4 h-4 text-[#c4b491]" />
                  <span>Área da Administração & Equipe MEI</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c4b491]/20 text-[#c4b491] font-mono font-bold">
                  Painel Geral
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-tight">
                Acesse o painel completo de gestão com e-mail: <strong className="text-white font-mono">admin@levcoworkingbeauty.com.br</strong> (Senha: <strong className="text-white font-mono">123</strong>)
              </p>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@levcoworkingbeauty.com.br', '123')}
                className="w-full py-2 rounded-xl bg-[#c4b491] text-[#050505] font-semibold text-xs hover:bg-[#b5a37f] transition-all flex items-center justify-center gap-1.5 shadow-sm mt-0.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Preencher e Entrar como Administrador</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                E-mail ou Celular/WhatsApp *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="seuemail@exemplo.com ou (11) 99999-8888"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-white/70">
                  Sua senha *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[11px] text-[#c4b491] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-md mt-2"
            >
              Entrar na Minha Conta
            </button>

            {/* Quick Demo Test Accounts */}
            <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[#c4b491] tracking-wider block">
                  Atalhos Rápidos de Acesso:
                </span>
                {currentUser && currentUser.role !== 'cliente' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('changePassword');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[10px] text-white/60 hover:text-[#c4b491] underline"
                  >
                    Alterar minha senha
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill('elisangela@levcoworkingbeauty.com.br')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#c4b491] text-left text-white/80 transition-all truncate"
                >
                  <span className="font-semibold block text-[#c4b491]">Elisangela</span>
                  <span className="text-[10px] text-white/50">Unha Raiz (MEI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('talitha@levcoworkingbeauty.com.br')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#c4b491] text-left text-white/80 transition-all truncate"
                >
                  <span className="font-semibold block text-[#c4b491]">Talitha</span>
                  <span className="text-[10px] text-white/50">Maquiagem/Sob.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('nayara@levcoworkingbeauty.com.br')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#c4b491] text-left text-white/80 transition-all truncate"
                >
                  <span className="font-semibold block text-[#c4b491]">Nayara</span>
                  <span className="text-[10px] text-white/50">Unhas em Gel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('camila@gmail.com')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-emerald-500 text-left text-white/80 transition-all truncate"
                >
                  <span className="font-semibold block text-emerald-400">Cliente Camila</span>
                  <span className="text-[10px] text-white/50">Área da Cliente</span>
                </button>
              </div>
              <p className="text-[10px] text-white/40 text-center pt-1">
                Senha padrão para contas salvas: <code className="text-[#c4b491]">123</code>
              </p>
            </div>
          </form>
        )}

        {/* REGISTER FORM FOR CLIENTS */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="p-2.5 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/20 text-[11px] text-[#c4b491] leading-tight">
              💡 Para seu login, informe pelo menos o <strong>E-mail</strong> ou o <strong>Celular</strong> (um deles é obrigatório).
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria da Silva"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                E-mail <span className="text-white/40 font-normal">(ou Celular)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com (Opcional se usar celular)"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                WhatsApp / Celular <span className="text-white/40 font-normal">(ou E-mail)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="(11) 99999-8888 (Opcional se usar e-mail)"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  Crie uma Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-md mt-3"
            >
              Criar Conta e Continuar
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
            <div className="p-3 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/20 text-xs text-white/80 leading-relaxed">
              🔑 Informe o e-mail ou telefone cadastrado da sua conta (Admin, Profissional, Recepção ou Cliente) para criar uma nova senha.
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                E-mail ou Celular/WhatsApp da sua conta *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ex: elisangela@levcoworkingbeauty.com.br ou (11) 99999-8888"
                  value={forgotIdentifier}
                  onChange={e => setForgotIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Nova Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Digite sua nova senha"
                  value={forgotNewPassword}
                  onChange={e => setForgotNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={forgotConfirmPassword}
                  onChange={e => setForgotConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-md mt-2"
            >
              Redefinir Senha e Entrar
            </button>
          </form>
        )}

        {/* CHANGE PASSWORD FORM (FOR LOGGED IN USER) */}
        {mode === 'changePassword' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
            <div className="p-3 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/20 text-xs text-white/80 leading-relaxed">
              🔐 Altere a senha da sua conta ativa (<strong>{currentUser.name}</strong>).
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Senha Atual *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Digite sua senha atual"
                  value={changeCurrentPassword}
                  onChange={e => setChangeCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Nova Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Digite a nova senha desejada"
                  value={changeNewPassword}
                  onChange={e => setChangeNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Confirme a nova senha"
                  value={changeConfirmPassword}
                  onChange={e => setChangeConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-md mt-2"
            >
              Salvar Nova Senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
