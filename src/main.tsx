import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ConfigurationError } from './components/common/ConfigurationError.tsx';
import { CoworkingProvider } from './context/CoworkingContext.tsx';
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

// Validate environment before rendering
const envValidation = validateEnvironment();
const rootElement = document.getElementById('root')!;

if (!envValidation.isValid) {
  createRoot(rootElement).render(
    <ConfigurationError missing={envValidation.missing} />
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <CoworkingProvider>
        <App />
      </CoworkingProvider>
    </StrictMode>,
  );
}
