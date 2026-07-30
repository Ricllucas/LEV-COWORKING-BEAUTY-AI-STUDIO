import React, { useState, useEffect } from 'react';
import { Logo } from '../brand/Logo';
import { User } from '../../types';
import { StorageService } from '../../services/storage';
import { Bell, Smartphone, User as UserIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onOpenPWAInstaller: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenNotifications,
  onOpenPWAInstaller,
  activeTab,
  onTabChange
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnread = () => {
      const notifs = StorageService.getNotifications();
      setUnreadCount(notifs.filter(n => !n.read).length);
    };
    checkUnread();
    return StorageService.subscribeStorage(checkUnread);
  }, []);

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case 'admin': return 'Administração';
      case 'profissional': return `Profissional`;
      case 'recepcao': return 'Recepção';
      case 'cliente': return 'Cliente';
      default: return currentUser.role;
    }
  };

  const isGuest = currentUser.id === 'visitor_guest';

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <button
            onClick={() => onTabChange('inicio')}
            className="flex items-center text-left group focus:outline-hidden"
          >
            <Logo size="md" variant="horizontal" theme="dark" />
          </button>

          {/* Desktop Navigation Links (Admin / Staff) */}
          {currentUser.role !== 'cliente' && !isGuest && (
            <nav className="hidden lg:flex items-center gap-1 bg-[#050505] p-1 rounded-xl border border-white/10">
              {[
                { id: 'inicio', label: 'Início' },
                { id: 'agenda', label: 'Agenda' },
                { id: 'servicos', label: 'Serviços & Preços' },
                { id: 'clientes', label: 'Clientes' },
                { id: 'financeiro', label: 'Financeiro (MEI)' },
                { id: 'relatorios', label: 'Relatórios' },
                { id: 'configuracoes', label: 'Configurações' },
                { id: 'publica', label: 'Página Pública' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-[#c4b491]/20 text-[#c4b491] border border-[#c4b491]/30 font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* User Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Guide */}
            <button
              onClick={onOpenPWAInstaller}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#c4b491]/30 bg-[#c4b491]/10 text-[#c4b491] hover:bg-[#c4b491]/20 text-xs font-medium transition-all"
              title="Instalar aplicativo PWA"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#c4b491]" />
              <span className="hidden sm:inline font-medium">Instalar App</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4 text-white/70" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c4b491] text-[#050505] text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Staff authentication controls stay restricted to protected routes */}
            {!isGuest && currentUser.role !== 'cliente' && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl border border-[#c4b491]/30 bg-[#0a0a0a] shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-[#c4b491]/20 border border-[#c4b491]/50 flex items-center justify-center shrink-0">
                    <UserIcon className="w-3.5 h-3.5 text-[#c4b491]" />
                  </div>
                  <div className="hidden sm:flex flex-col leading-none">
                    <span className="text-[11px] font-semibold text-white max-w-[110px] truncate">{currentUser.name}</span>
                    <span className="text-[9px] text-[#c4b491] font-medium tracking-wide uppercase">{getRoleLabel()}</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
