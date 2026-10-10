import React from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storage';
import { buildProfessionalWhatsAppLink } from '../../utils/formatters';
export const WhatsAppCenter: React.FC<{ currentUser: User }> = ({ currentUser }) => (
 <div className="max-w-4xl mx-auto px-4 py-10 text-white">
  <h1 className="text-2xl font-serif">Contato com as profissionais</h1>
  <p className="mt-3 text-sm text-white/60">Agendamentos, alterações, cancelamentos e comprovantes devem ser tratados diretamente com a profissional responsável pelo serviço.</p>
  <div className="mt-6 grid gap-4 sm:grid-cols-3">
   {StorageService.getProfessionals().map(prof => {
    const href = buildProfessionalWhatsAppLink(prof.id, `Olá, ${prof.name}! Aqui é ${currentUser.name}. Gostaria de falar sobre seu atendimento.`, prof);
    return <div key={prof.id} className="rounded-2xl border border-white/10 p-5">
     <h2 className="font-semibold">{prof.name}</h2>
     <p className="mt-1 text-xs text-white/60">{prof.title}</p>
     {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="mt-4 block text-emerald-400 text-sm">Falar com {prof.name} no WhatsApp</a> : <p className="mt-4 text-xs text-white/50">Contato ainda não cadastrado.</p>}
    </div>;
   })}
  </div>
 </div>
);
