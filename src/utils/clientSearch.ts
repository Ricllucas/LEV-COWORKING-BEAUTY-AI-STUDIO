import { Client } from '../types';

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Busca clientes cadastradas pelo nome (sem acento) ou pelos dígitos do telefone.
export const findClientMatches = (clients: Client[], query: string, limit = 6): Client[] => {
  const text = normalizeText(query);
  if (text.length < 2) return [];
  const digits = query.replace(/\D/g, '');
  return clients
    .filter(client => client.active !== false)
    .filter(client =>
      normalizeText(client.fullName).includes(text) ||
      (digits.length >= 3 && client.phone.replace(/\D/g, '').includes(digits))
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))
    .slice(0, limit);
};
