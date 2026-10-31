import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import { ShieldCheck, History, Search } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const load = () => {
      setLogs(StorageService.getAuditLogs());
    };
    load();
    return StorageService.subscribeStorage(load);
  }, []);

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    return l.userName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-white">
      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs">
        <span className="text-xs font-semibold text-[#c4b491] uppercase tracking-widest block">
          Auditoria de Segurança & LGPD
        </span>
        <h1 className="text-2xl font-serif font-medium text-white mt-1">
          Logs de Alterações do Sistema
        </h1>
        <p className="text-xs text-white/60 mt-1">
          Registro de histórico para agendamentos, pagamentos, alterações de preços e permissões.
        </p>
      </div>

      <div className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xs space-y-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#c4b491] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou detalhe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-[#050505] text-white text-xs"
          />
        </div>

        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-3.5 rounded-xl bg-[#050505] border border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between text-[#c4b491]">
                <span className="font-semibold text-white">{log.userName} ({log.userRole.toUpperCase()})</span>
                <span className="text-[10px] text-white/50">{log.timestamp}</span>
              </div>
              <p className="font-semibold text-[#c4b491]">{log.action}: {log.target}</p>
              <p className="text-white/70 leading-relaxed">{log.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
