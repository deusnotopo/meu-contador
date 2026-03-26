import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";
import "./styles/accessibility.css";

import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";
import { initSentry } from "./lib/sentry";

// Initialize Sentry error tracking
initSentry();

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

// PWA registration is handled by vite-plugin-pwa automatically
// if registerType: 'autoUpdate' is used in vite.config.ts
