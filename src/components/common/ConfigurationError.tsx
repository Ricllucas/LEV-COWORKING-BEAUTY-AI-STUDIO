import React from 'react';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';

interface ConfigurationErrorProps {
  missing: string[];
}

export const ConfigurationError: React.FC<ConfigurationErrorProps> = ({ missing }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#050505] text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
            <AlertCircle className="w-16 h-16 text-red-400" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-serif font-bold">Configuração Incompleta</h1>
          <p className="text-white/70">
            A aplicação está faltando variáveis de ambiente obrigatórias.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-red-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
            Variáveis Faltando
          </h2>

          <div className="space-y-2">
            {missing.map((envVar) => (
              <div key={envVar} className="flex items-center justify-between p-3 bg-red-500/5 rounded border border-red-500/10">
                <code className="text-sm text-red-300 font-mono">{envVar}</code>
                <button
                  onClick={() => handleCopy(envVar)}
                  className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4 text-red-300/70" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-blue-500/30 rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
            Como Configurar
          </h2>

          <ol className="space-y-2 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold shrink-0">1.</span>
              <span>Abra o arquivo <code className="bg-white/5 px-2 py-1 rounded text-xs text-white/90">.env</code> na raiz do projeto</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold shrink-0">2.</span>
              <span>Preencha os valores das variáveis acima com suas chaves Supabase</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold shrink-0">3.</span>
              <span>Reinicie o servidor de desenvolvimento</span>
            </li>
          </ol>

          <a
            href="https://supabase.com/docs/guides/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs mt-2 transition-colors"
          >
            Ver documentação do Supabase
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-center text-xs text-white/40 space-y-1">
          <p>Para desenvolvimento local, use o arquivo <code className="bg-white/5 px-2 py-1 rounded">.env.example</code> como referência.</p>
          <p>Nunca commite arquivos <code className="bg-white/5 px-2 py-1 rounded">.env</code> com valores reais!</p>
        </div>
      </div>
    </div>
  );
};
