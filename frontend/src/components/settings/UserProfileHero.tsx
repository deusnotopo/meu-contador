import React from "react";

interface UserProfileHeroProps {
  user: any;
  healthScore: number;
  fireProgress: number;
  daysInApp: number;
}

export const UserProfileHero: React.FC<UserProfileHeroProps> = ({ user, healthScore, fireProgress, daysInApp }) => {
  return (
    <div className="hero" style={{ textAlign: "center", padding: 24 }}>
      <div style={{ 
        width: 72, height: 72, borderRadius: "50%", 
        background: "linear-gradient(135deg,#2F62D9,#5048E8)", 
        display: "flex", alignItems: "center", justifyContent: "center", 
        fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 auto 12px", 
        boxShadow: "0 0 0 3px rgba(74,139,255,0.3),0 8px 32px rgba(80,72,232,0.4)" 
      }}>
        {user?.name?.substring(0, 2).toUpperCase() || "MC"}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: "var(--t1)" }}>
        {user?.name || "Usuário"}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--t2)", marginTop: 3 }}>
        {user?.email || "contato@meucontador.com"}
      </div>
      
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <span className="bdg bdg-b">Premium</span>
        <span className="bdg bdg-g">IR modelo completo</span>
        {healthScore > 0 && <span className="bdg bdg-p">Score {healthScore}</span>}
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
        {[
          ["🗓️", daysInApp > 0 ? daysInApp.toString() : "-", "dias no app"],
          ["📊", healthScore > 0 ? healthScore.toString() : "-", "score saúde"],
          ["🎯", fireProgress > 0 ? `${fireProgress}%` : "-", "rumo FIRE"]
        ].map(([em, vl, lb], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{em}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{vl}</div>
            <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>{lb}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
