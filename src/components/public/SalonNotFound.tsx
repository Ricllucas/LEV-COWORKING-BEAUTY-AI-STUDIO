import React from 'react';
import { SearchX, WifiOff } from 'lucide-react';

// Tela neutra (sem nome nem cores de nenhum salão): o endereço não levou a um salão.
interface SalonNotFoundProps {
  variant: 'not_found' | 'offline';
}

export const SalonNotFound: React.FC<SalonNotFoundProps> = ({ variant }) => {
  const offline = variant === 'offline';
  const Icon = offline ? WifiOff : SearchX;
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-800 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-neutral-200/70">
            <Icon className="w-12 h-12 text-neutral-500" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">
          {offline ? 'Não foi possível abrir agora' : 'Salão não encontrado'}
        </h1>
        <p className="text-neutral-600">
          {offline
            ? 'Verifique a internet e tente de novo em instantes.'
            : 'Este endereço não pertence a nenhum salão. Confira se ele foi digitado certo.'}
        </p>
        {offline && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-800 px-5 py-2.5 text-white font-medium hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
          >
            Tentar de novo
          </button>
        )}
      </div>
    </main>
  );
};
