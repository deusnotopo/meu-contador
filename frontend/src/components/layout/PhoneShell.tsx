import React from "react";

interface PhoneShellProps {
  children: React.ReactNode;
  statusBar?: React.ReactNode;
  tabBar?: React.ReactNode;
}

export const PhoneShell: React.FC<PhoneShellProps> = ({ 
  children, 
  statusBar, 
  tabBar 
}) => {
  return (
    <div className="phone" id="phone">
      {/* Dynamic Island */}
      <div className="di">
        <div className="di-dot"></div>
        <div className="di-cam"></div>
        <div className="di-dot"></div>
      </div>

      {/* Status Bar */}
      <div className="statusbar">
        <span className="stime" id="clock">9:41</span>
        <div className="sicons">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="rgba(240,244,255,0.8)">
            <rect x="0" y="4" width="3" height="8" rx="1"/>
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/>
            <rect x="9" y="1" width="3" height="11" rx="1"/>
            <rect x="13.5" y="0" width="2.5" height="12" rx="1" opacity=".25"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 20 14" fill="none" stroke="rgba(240,244,255,0.8)" strokeWidth="1.5">
            <path d="M1 4C4.5 1 8 0 10 0s5.5 1 9 4M4 7.5C6 6 8 5 10 5s4 1 6 2.5M7.5 11c.7-.5 1.6-.8 2.5-.8s1.8.3 2.5.8"/>
            <circle cx="10" cy="13" r="1" fill="rgba(240,244,255,0.8)"/>
          </svg>
          <svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="rgba(240,244,255,0.6)" strokeWidth="1">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5"/>
            <rect x="2" y="2" width="16" height="8" rx="2" fill="rgba(240,244,255,0.8)" stroke="none"/>
            <path d="M23 4v4a2 2 0 000-4z" fill="rgba(240,244,255,0.55)"/>
          </svg>
        </div>
      </div>

      {statusBar}

      {/* Main Screen Container */}
      <div className="screen" id="screen">
        <div className="scontent" id="content">
          {children}
        </div>
      </div>

      {/* Tab Bar */}
      {tabBar}
    </div>
  );
};
