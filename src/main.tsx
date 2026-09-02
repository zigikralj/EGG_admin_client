import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically reload the page when a new deployment renders old chunk hashes invalid
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, reloading page for latest version...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

