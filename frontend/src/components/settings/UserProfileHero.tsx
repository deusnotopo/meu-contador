import React from "react";

interface UserProfileHeroUser {
  name?: string;
  email?: string;
}

interface UserProfileHeroProps {
  user: UserProfileHeroUser | null;
  healthScore: number;
  fireProgress: number;
  daysInApp: number;
}

export const UserProfileHero: React.FC<UserProfileHeroProps> = ({ user, healthScore, fireProgress, daysInApp }) => {
  return (
    <div className="hero text-center px-6 py-6">
      {/* Avatar */}
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[26px] font-bold text-white mx-auto mb-3"
        style={{
          background: "linear-gradient(135deg,#2F62D9,#5048E8)",
          boxShadow: "0 0 0 3px rgba(74,139,255,0.3),0 8px 32px rgba(80,72,232,0.4)",
        }}
      >
        {user?.name?.substring(0, 2).toUpperCase() || "MC"}
      </div>

      {/* Name */}
      <div className="text-[19px] font-bold text-[var(--t1)]">
        {user?.name || "Usuário"}
      </div>

      {/* Email */}
      <div className="text-[12.5px] text-[var(--t2)] mt-[3px]">
        {user?.email || "contato@meucontador.com"}
      </div>

      {/* Badges */}
      <div className="flex justify-center gap-2 mt-3 flex-wrap">
        <span className="bdg bdg-b">Premium</span>
        <span className="bdg bdg-g">IR modelo completo</span>
        {healthScore > 0 && <span className="bdg bdg-p">Score {healthScore}</span>}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        {[
          ["🗓️", daysInApp > 0 ? daysInApp.toString() : "-", "dias no app"],
          ["📊", healthScore > 0 ? healthScore.toString() : "-", "score saúde"],
          ["🎯", fireProgress > 0 ? `${fireProgress}%` : "-", "rumo FIRE"],
        ].map(([em, vl, lb], i) => (
          <div key={i} className="text-center">
            <div className="text-[18px] mb-1">{em}</div>
            <div className="text-[18px] font-bold text-[var(--t1)] font-mono">{vl}</div>
            <div className="text-[10px] text-[var(--t3)] mt-[1px]">{lb}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
