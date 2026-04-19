import { useAuth } from "./context/AuthContext";
import { AuthenticatedApp } from "./app/AuthenticatedApp";
import { UnauthenticatedApp } from "./app/UnauthenticatedApp";
import { IntelligenceProvider } from "./context/IntelligenceContext";

/**
 * 🚀 AKITA-STYLE REFACTOR: App.tsx agora é apenas o ORQUESTRADOR ROOT.
 * Toda a bagunça de rotas e overlays foi movida para componentes especializados:
 * - AuthenticatedApp: Lida com Shell, Global Overlays e AppRoutes.
 * - UnauthenticatedApp: Lida com Login e Landing Page.
 */
export default function App() {
  const { user } = useAuth();

  return user ? (
    <IntelligenceProvider>
      <AuthenticatedApp />
    </IntelligenceProvider>
  ) : (
    <UnauthenticatedApp />
  );
}
