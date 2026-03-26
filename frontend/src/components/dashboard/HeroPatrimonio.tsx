import React from "react";
import { Sparkline } from "@/components/ui/Charts";
import type { TabType } from "@/types/navigation";

interface HeroPatrimonioProps {
  netWorth: number;
  assets: number;
  liabilities: number;
  healthScore: number;
  monthlyVariation: { amount: number; percentage: number };
  sparklineData: number[];
  onNavigate?: (tab: TabType) => void;
  fmtM: (n: number) => string;
  fmt: (n: number) => string;
}

export const HeroPatrimonio: React.FC<HeroPatrimonioProps> = ({
  netWorth,
  assets,
  liabilities,
  healthScore,
  monthlyVariation,
  sparklineData,
  onNavigate,
  fmtM,
  fmt
}) => {
  return (
    <div className="hero">
      <div style={{ fontSize: "10px", color: "rgba(74,139,255,0.9)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span className="pdot" style={{ background: "var(--green)" }}></span>
        Patrimônio líquido
      </div>
      <div className="bignum">{fmtM(netWorth)}</div>
      {monthlyVariation.amount !== 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <span className={`bdg ${monthlyVariation.amount > 0 ? 'bdg-g' : 'bdg-r'}`}>
            {monthlyVariation.amount > 0 ? '▲' : '▼'} {fmt(Math.abs(monthlyVariation.amount))} este mês
          </span>
          <span style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
            {monthlyVariation.percentage > 0 ? '+' : ''}{monthlyVariation.percentage.toFixed(1)}%
          </span>
        </div>
      )}
      {sparklineData.length > 0 && (
        <div style={{ marginTop: "12px", height: "44px" }}>
          <Sparkline data={sparklineData} color="var(--green)" />
        </div>
      )}
      <div className="stat3">
        <div className="s3i"><div className="s3l">Ativos</div><div className="s3v" style={{ color: "var(--green)" }}>{fmtM(assets)}</div></div>
        <div className="s3i"><div className="s3l">Passivos</div><div className="s3v" style={{ color: "var(--red)" }}>{fmt(liabilities)}</div></div>
        <div className="s3i" onClick={() => onNavigate?.('health')} style={{ cursor: 'pointer' }}><div className="s3l">Score</div><div className="s3v" style={{ color: "var(--blue)" }}>{healthScore}/100</div></div>
      </div>
    </div>
  );
};
