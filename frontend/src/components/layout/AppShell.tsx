import React from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import Sidebar from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TabType } from "@/types/navigation";

interface AppShellProps {
  isDesktop: boolean;
  activeTab: TabType;
  isLaunchMenuOpen: boolean;
  onOpenFunctions: () => void;
  children: React.ReactNode;
}

/**
 * AppShell encapsula a estrutura de navegação e layout base.
 * Automatiza a decisão entre Sidebar (Desktop) e BottomNav (Mobile).
 */
export function AppShell({
  isDesktop,
  activeTab,
  isLaunchMenuOpen,
  onOpenFunctions,
  children,
}: AppShellProps) {
  return (
    <ErrorBoundary featureName="AppShell">
      <PhoneShell
        tabBar={
          !isDesktop ? (
            <BottomNav
              currentTab={isLaunchMenuOpen ? "launch" : activeTab}
              onOpenFunctions={onOpenFunctions}
            />
          ) : undefined
        }
      >
        {/* Desktop Sidebar */}
        {isDesktop && (
          <Sidebar currentTab={activeTab} />
        )}

        <ErrorBoundary featureName="Main Content">
          <div className="scontent w-full relative h-full overflow-hidden" id="main-scontent">
            {children}
          </div>
        </ErrorBoundary>
      </PhoneShell>
    </ErrorBoundary>
  );
}
