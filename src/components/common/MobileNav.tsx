import React from 'react';
import { UserRole } from '../../types';
import { Home, Calendar, Plus, Users, Menu as MenuIcon, Sparkles, MessageSquare, User } from 'lucide-react';

interface MobileNavProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewBooking: () => void;
  onOpenMoreMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  role,
  activeTab,
  onTabChange,
  onOpenNewBooking,
  onOpenMoreMenu
}) => {
  const isClient = role === 'cliente';

  if (isClient) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10 px-3 py-1.5 shadow-lg">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => onTabChange('inicio')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
              activeTab === 'inicio' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Início</span>
          </button>

          <button
            onClick={() => onTabChange('agendar')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
              activeTab === 'agendar' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Agendar</span>
          </button>

          {/* Center Highlighted Agendar */}
          <button
            onClick={onOpenNewBooking}
            className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-[#c4b491] text-[#050505] shadow-lg border-2 border-[#050505] active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            onClick={() => onTabChange('meus_horarios')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
              activeTab === 'meus_horarios' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Horários</span>
          </button>

          <button
            onClick={onOpenMoreMenu}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
              activeTab === 'menu' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
            }`}
          >
            <MenuIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Menu</span>
          </button>
        </div>
      </nav>
    );
  }

  // Staff / Admin / Reception Mobile Nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around relative">
        <button
          onClick={() => onTabChange('inicio')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'inicio' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Início</span>
        </button>

        <button
          onClick={() => onTabChange('agenda')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'agenda' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Agenda</span>
        </button>

        {/* Center Highlighted Novo Agendamento */}
        <button
          onClick={onOpenNewBooking}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-[#c4b491] text-[#050505] shadow-lg border-2 border-[#050505] active:scale-95 transition-transform"
          title="Novo Agendamento"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => onTabChange('clientes')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'clientes' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Clientes</span>
        </button>

        <button
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'menu' ? 'text-[#c4b491]' : 'text-white/50 hover:text-white'
          }`}
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};
