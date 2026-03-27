import React from "react";

interface PhoneShellProps {
  children: React.ReactNode;
  statusBar?: React.ReactNode;
  tabBar?: React.ReactNode;
}

/**
 * PhoneShell v2 — Without fictitious iPhone frame.
 * Renders children in a full-screen responsive container.
 * The app fills the real device viewport natively.
 */
export const PhoneShell: React.FC<PhoneShellProps> = ({
  children,
  statusBar,
  tabBar,
}) => {
  return (
    <div className="app-root" id="app-root">
      {statusBar}
      <div className="screen" id="screen">
        <div className="scontent" id="content">
          {children}
        </div>
      </div>
      {tabBar}
    </div>
  );
};