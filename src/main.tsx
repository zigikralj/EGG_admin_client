import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getRouterBasename } from './utils/router';
import { QUERY_CONFIG } from './constants';
import { restorePersistedQueries, setupQueryPersistence } from './utils/queryPersistence';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.DEFAULT_STALE_TIME,
      retry: QUERY_CONFIG.DEFAULT_RETRY,
      refetchOnWindowFocus: false,
    },
  },
});

// Restore persisted queries (user directory, summaries) before initial render
restorePersistedQueries(queryClient);
setupQueryPersistence(queryClient);

// Automatically reload the page when a new deployment renders old chunk hashes invalid
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, reloading page for latest version...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={getRouterBasename()}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

