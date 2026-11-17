import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { registerServiceWorker } from './lib/sw';
import './styles/index.css';

// Register service worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker((update) => {
    if (update.available) {
      console.log('[PWA] Update available');
      // Update notification will be shown in the app UI
    }
  }).catch(err => {
    console.error('[PWA] Service worker registration failed:', err);
  });
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
