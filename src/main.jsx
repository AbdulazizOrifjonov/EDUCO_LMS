import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { SearchProvider } from './context/SearchContext';
import './styles/index.css';
import './i18n';
import { initPushNotifications } from './services/pushNotificationService';

// Initialize Service Worker for mobile push & status bar notifications
initPushNotifications();

// Auto-reload on Vite dynamic import failure (when new deployment replaces old asset chunks)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    console.warn('[Vite] Chunk preload error detected; auto-reloading to fetch newest version...');
    window.location.reload();
  });
}

// Prevent manual pinch-to-zoom, gesture scaling, and unwanted double-tap zoom on touch/mobile screens (< 768px)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Prevent multi-touch gesture zoom (pinch zoom)
  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent WebKit / Safari pinch gesture
  window.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('gesturechange', (e) => e.preventDefault());
  window.addEventListener('gestureend', (e) => e.preventDefault());
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SearchProvider>
          <App />
        </SearchProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
