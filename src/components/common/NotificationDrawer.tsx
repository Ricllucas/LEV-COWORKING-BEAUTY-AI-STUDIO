import React, { useState, useEffect } from 'react';
import { SystemNotification } from '../../types';
import { StorageService } from '../../services/storage';
import { Bell, Check, Trash2, X, Calendar, MessageCircle, AlertCircle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    const load = () => {
      setNotifications(StorageService.getNotifications());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    StorageService.markNotificationAsRead(id);
  };

  const handleClearAll = () => {
    StorageService.clearAllNotifications();
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    StorageService.markNotificationAsRead(notif.id);
    if (notif.linkTo) {
      onNavigateTab(notif.linkTo);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-[#0a0a0a] w-full max-w-md h-full shadow-2xl border-l border-white/10 flex flex-col text-white animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#c4b491]" />
            <h2 className="font-serif text-lg font-medium text-white">
              Central de Notificações
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1.5 rounded-lg text-xs text-white/60 hover:bg-white/10 hover:text-rose-400 transition-colors flex items-center gap-1"
                title="Limpar tudo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-10 h-10 text-[#c4b491]/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-white">Nenhuma notificação</p>
              <p className="text-xs text-white/60 mt-1">
                Avisos sobre agendamentos, cancelamentos e pagamentos aparecerão aqui.
              </p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  notif.read
                    ? 'bg-[#050505] border-white/10 opacity-70'
                    : 'bg-[#c4b491]/15 border-[#c4b491] shadow-2xs font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-[#c4b491] shrink-0">
                    {notif.createdAt}
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  {notif.message}
                </p>

                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                    }}
                    className="mt-2 text-[10px] text-[#c4b491] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Marcar como lida
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
