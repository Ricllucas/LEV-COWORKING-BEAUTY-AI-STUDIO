import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ConfigurationError } from './components/common/ConfigurationError.tsx';
import { SalonNotFound } from './components/public/SalonNotFound.tsx';
import { resolveSiteSalon, setBootSalonId } from './config/siteSalon.ts';
import { validateEnvironment } from './utils/envValidator.ts';
import './index.css';

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // TODO: Send to Sentry or error tracking service
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // TODO: Send to Sentry or error tracking service
});

// O App só é carregado depois de descobrir o salão pelo endereço: vários módulos
// leem CURRENT_SALON_ID assim que são importados (ver src/config/siteSalonGuard.test.ts).
const start = async () => {
  const root = createRoot(document.getElementById('root')!);
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    root.render(<ConfigurationError missing={envValidation.missing} />);
    return;
  }

  const salon = await resolveSiteSalon(window.location.host);
  if (salon.status !== 'ok') {
    // O título de index.html é o da LEV; esta tela não pertence a nenhum salão
    document.title = salon.status === 'offline' ? 'Sem conexão' : 'Salão não encontrado';
    root.render(<SalonNotFound variant={salon.status} />);
    return;
  }
  setBootSalonId(salon.salonId);

  const [{ default: App }, { CoworkingProvider }] = await Promise.all([
    import('./App.tsx'),
    import('./context/CoworkingContext.tsx')
  ]);
  root.render(
    <StrictMode>
      <CoworkingProvider>
        <App />
      </CoworkingProvider>
    </StrictMode>,
  );
};

void start();
