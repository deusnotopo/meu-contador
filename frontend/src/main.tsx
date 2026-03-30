import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";
import "./styles/accessibility.css";
import "./styles/mobile.css"; /* Mobile-first: overrides duplicate rules — loaded last */

import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";
import { initSentry } from "./lib/sentry";

// Initialize Sentry error tracking
initSentry();

const isDev = import.meta.env.DEV;

// Apply saved theme before first render (avoids flash)
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <AuthProvider>
        <FeatureFlagsProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);


// PWA Service Worker Registration
// Em desenvolvimento, o SW interfere no HMR do Vite e gera erros de fetch/cache.
if (isDev && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {
    // noop
  });

  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    }).catch(() => {
      // noop
    });
  }
}

if (!isDev && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', type: 'module' })
      .then((registration) => {
        console.log('SW Registered successfully with scope:', registration.scope);
        
        // Active update detection
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available! Please refresh.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('SW Registration failed:', error);
      });
  });
}
