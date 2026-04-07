import React from "react";

interface PhoneShellProps {
  children: React.ReactNode;
  statusBar?: React.ReactNode;
  tabBar?: React.ReactNode;
}

/**
 * PhoneShell v3 — Layout responsivo full-screen.
 * 
 * • Mobile (<1024px): coluna vertical (conteúdo + tabbar)
 * • Desktop (≥1024px): linha horizontal (sidebar inclusa via children + tela de conteúdo)
 *   A `.tabbar` é ocultada via CSS em desktop.
 */
export const PhoneShell: React.FC<PhoneShellProps> = ({
  children,
  statusBar,
  tabBar,
}) => {
  return (
    <div className="app-root" id="app-root">
      {statusBar}
      {/* Em desktop, os `children` já incluem a <Sidebar> como primeiro filho,
          então o .screen cresce ao lado dela via flex-direction: row */}
      <div className="screen" id="screen">
        {children}
      </div>
      {/* A tabBar é nula em desktop (controlado pelo App.tsx),
          e o .tabbar é display:none via CSS também como failsafe */}
      {tabBar}
    </div>
  );
};