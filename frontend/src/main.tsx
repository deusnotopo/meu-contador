import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/900.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/700.css";
import "@fontsource/outfit/900.css";
import "./style.css";
import "./styles/accessibility.css";

import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";
import { initSentry } from "./lib/sentry";

// Initialize Sentry error tracking
initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <FeatureFlagsProvider>
        <AuthProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AuthProvider>
      </FeatureFlagsProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);

// PWA registration is handled by vite-plugin-pwa automatically
// if registerType: 'autoUpdate' is used in vite.config.ts
