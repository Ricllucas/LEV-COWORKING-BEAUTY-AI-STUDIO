import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { UserCheck, HeartHandshake, X, Lock, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NailCareIcon, LashBrowsIcon, GelNailsIcon, AdminShieldIcon } from '../common/SpecialtyIcons';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChanged: (user: User) => void;
}

interface RoleItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  professionalId?: string;
  clientId?: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged
}) => {
  const [selectedAccount, setSelectedAccount] = useState<RoleItem | null>(null);
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const rolesList: RoleItem[] = [
    {
      id: 'admin_1',
      name: 'Administração Geral',
      email: 'admin@levcoworkingbeauty.com.br',
      role: 'admin',
      description: 'Acesso restrito total: gestão de todas as agendas, financeiro consolidado de todas as MEIs e configurações.',
      icon: <AdminShieldIcon className="w-5 h-5 text-[#c4b491]" />,
      badgeColor: 'bg-[#c4b491]/15 text-[#c4b491] border-[#c4b491]/30'
    },
    {
      id: 'prof_elisangela_user',
      name: 'Elisangela',
      email: 'elisangela@levcoworkingbeauty.com.br',
      role: 'profissional',
      professionalId: 'prof_elisangela',
      description: 'MEI Unha Raiz. Acesso exclusivo à própria agenda, clientes e relatórios financeiros individuais de manicure e pedicure.',
      icon: <NailCareIcon className="w-5 h-5 text-[#c4b491]" />,
      badgeColor: 'bg-[#c4b491]/20 text-[#c4b491] border-[#c4b491]/40'
    },
    {
      id: 'prof_talitha_user',
      name: 'Talitha',
      email: 'talitha@levcoworkingbeauty.com.br',
      role: 'profissional',
      professionalId: 'prof_talitha',
      description: 'MEI Maquiagem, Cílios e Sobrancelhas. Visagista com acesso exclusivo à própria agenda e faturamento privado.',
      icon: <LashBrowsIcon className="w-5 h-5 text-[#c4b491]" />,
      badgeColor: 'bg-[#c4b491]/20 text-[#c4b491] border-[#c4b491]/40'
    },
    {
      id: 'prof_nayara_user',
      name: 'Nayara',
      email: 'nayara@levcoworkingbeauty.com.br',
      role: 'profissional',
      professionalId: 'prof_nayara',
      description: 'MEI Unhas em Gel & Nail Art. Acesso exclusivo à própria agenda e controle individual de faturamento em gel.',
      icon: <GelNailsIcon className="w-5 h-5 text-[#c4b491]" />,
      badgeColor: 'bg-[#c4b491]/20 text-[#c4b491] border-[#c4b491]/40'
    },
    {
      id: 'recepcao_1',
      name: 'Recepção LEV',
      email: 'recepcao@levcoworkingbeauty.com.br',
      role: 'recepcao',
      description: 'Gerencia horários de todas as profissionais, lista de espera e atendimento WhatsApp. Sem acesso aos relatórios financeiros.',
      icon: <HeartHandshake className="w-5 h-5 text-[#8C6D46]" />,
      badgeColor: 'bg-[#8C6D46]/15 text-[#8C6D46] border-[#8C6D46]/30'
    },
    {
      id: 'client_camila_user',
      name: 'Cliente (Camila Rodrigues)',
      email: 'camila@gmail.com',
      role: 'cliente',
      clientId: 'cli_1',
      description: 'Portal de Cliente: realiza agendamentos, acompanha horários marcados e histórico. Sem acesso a áreas internas.',
      icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    }
  ];

  const handleStartAuth = (item: RoleItem) => {
    setSelectedAccount(item);
    setPassword('');
    setIsResetting(false);
    setResetNewPass('');
    setResetConfirmPass('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (!password) {
      setErrorMsg('Por favor, digite a senha de acesso para continuar.');
      return;
    }

    const res = StorageService.authenticateUser(selectedAccount.email, password);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Senha incorreta para esta conta.');
      return;
    }

    setSuccessMsg(`Autenticado como ${res.user.name} com sucesso!`);
    setTimeout(() => {
      StorageService.setCurrentUser(res.user!);
      onUserChanged(res.user!);
      setSelectedAccount(null);
      setPassword('');
      onClose();
    }, 500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (!resetNewPass) {
      setErrorMsg('Por favor, digite a nova senha.');
      return;
    }

    if (resetNewPass !== resetConfirmPass) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    if (resetNewPass.length < 3) {
      setErrorMsg('A nova senha deve possuir pelo menos 3 caracteres.');
      return;
    }

    const res = StorageService.resetPassword(selectedAccount.email, resetNewPass);
    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Não foi possível redefinir a senha.');
      return;
    }

    setSuccessMsg(`Senha redefinida com sucesso! Entrando como ${res.user.name}...`);
    setTimeout(() => {
      StorageService.setCurrentUser(res.user!);
      onUserChanged(res.user!);
      setSelectedAccount(null);
      setPassword('');
      setIsResetting(false);
      setResetNewPass('');
      setResetConfirmPass('');
      onClose();
    }, 600);
  };

  const handleCloseModal = () => {
    setSelectedAccount(null);
    setPassword('');
    setIsResetting(false);
    setResetNewPass('');
    setResetConfirmPass('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl p-6 relative text-white">
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!selectedAccount ? (
          /* STEP 1: SELECT ACCOUNT */
          <>
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-[#c4b491] uppercase">
                <Lock className="w-3 h-3 text-[#c4b491]" />
                <span>Troca Segura de Perfil</span>
              </div>
              <h2 className="text-xl font-serif text-white font-medium mt-1">
                Selecione a Conta para Autenticação
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Por motivos de segurança e privacidade das MEIs, o acesso a cada perfil exige validação por senha real.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
              {rolesList.map(item => {
                const isSelected =
                  currentUser.role === item.role &&
                  (!item.professionalId || currentUser.professionalId === item.professionalId);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleStartAuth(item)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group relative ${
                      isSelected
                        ? 'border-[#c4b491] bg-[#c4b491]/15 shadow-xs'
                        : 'border-white/10 bg-[#050505] hover:border-[#c4b491]/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-white group-hover:text-[#c4b491] transition-colors">
                          {item.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${item.badgeColor}`}>
                          {item.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="absolute right-3.5 top-4 text-white/30 group-hover:text-[#c4b491] transition-colors">
                      <KeyRound className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/40">
                Senha padrão de teste das contas: <strong className="text-[#c4b491]">123</strong>
              </span>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/80 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          /* STEP 2: PASSWORD AUTHENTICATION FOR SELECTED ACCOUNT */
          <div className="animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedAccount(null)}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#c4b491] mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para lista de perfis</span>
            </button>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-5 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-[#050505] border border-[#c4b491]/30 text-[#c4b491] shrink-0">
                {selectedAccount.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{selectedAccount.name}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${selectedAccount.badgeColor}`}>
                    {selectedAccount.role.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-white/50 font-mono mt-0.5">{selectedAccount.email}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {!isResetting ? (
              <form onSubmit={handleAuthenticate} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white/80">
                      Digite a Senha de Acesso *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetting(true);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-[#c4b491] hover:underline"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="Digite sua senha..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-[#050505] text-sm text-white focus:outline-none focus:border-[#c4b491] transition-colors font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5">
                    Dica de Teste: A senha padrão de todas as contas é <strong className="text-[#c4b491]">123</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAccount(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80 text-xs font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Confirmar e Entrar</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-[#c4b491]/10 border border-[#c4b491]/20 text-xs text-[#c4b491]">
                  Redefinindo senha para a conta <strong>{selectedAccount.name}</strong> ({selectedAccount.email})
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">
                    Crie uma Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Digite a nova senha..."
                    value={resetNewPass}
                    onChange={e => setResetNewPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a nova senha..."
                    value={resetConfirmPass}
                    onChange={e => setResetConfirmPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#050505] text-xs text-white focus:outline-none focus:border-[#c4b491]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetting(false);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80 text-xs font-medium hover:bg-white/10 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Salvar e Acessar</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

