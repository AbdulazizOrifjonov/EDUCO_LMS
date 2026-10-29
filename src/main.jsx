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
