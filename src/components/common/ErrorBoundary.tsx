import React, { useReducer } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

type Action = { type: 'RESET' } | { type: 'SET_ERROR'; payload: { error: Error; errorInfo: React.ErrorInfo } };

interface State {
  hasError: boolean;
  error: Error | null;
}

const initialState: State = {
  hasError: false,
  error: null,
};

function errorReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ERROR':
      return {
        hasError: true,
        error: action.payload.error,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState extends State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // @ts-expect-error - React.Component state initialization
    this.state = initialState;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  handleReset = () => {
    // @ts-expect-error - React.Component setState
    this.setState(initialState);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign('/');
  };

  render() {
    // @ts-expect-error - React.Component state
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold">Oops! Algo deu errado</h1>
              <p className="text-white/60 text-sm">
                Encontramos um erro inesperado. Tente recarregar a página ou voltar ao início.
              </p>
            </div>

            {/* @ts-expect-error - React.Component state */}
            {this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-xs text-white/50 hover:text-white/70 transition-colors">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 p-3 bg-white/5 rounded text-xs overflow-auto max-h-32 text-red-300">
                  {/* @ts-expect-error - React.Component state */}
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-3 bg-[#c4b491] hover:bg-[#b5a37f] text-[#050505] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>

              <button
                onClick={this.handleReload}
                className="w-full px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold rounded-lg transition-colors border border-white/10"
              >
                Recarregar Página
              </button>

              <button
                onClick={this.handleHome}
                className="w-full px-4 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-white/70 font-semibold rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao Início
              </button>
            </div>

            <p className="text-[11px] text-white/40">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    // @ts-expect-error - React.Component props
    return this.props.children;
  }
}
