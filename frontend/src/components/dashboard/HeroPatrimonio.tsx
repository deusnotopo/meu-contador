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

const ScoreDot = ({ score }: { score: number }) => {
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--amber)" : "var(--red)";
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, marginRight: 4, flexShrink: 0,
      boxShadow: `0 0 6px ${color}`,
    }} />
  );
};

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
  const isEmpty = assets === 0 && liabilities === 0;

  return (
    <div className="hero" style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: "10px", color: "rgba(74,139,255,0.9)", fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px",
        display: "flex", alignItems: "center", gap: "6px"
      }}>
        <span className="pdot" style={{ background: "var(--green)" }} />
        Patrimônio líquido
      </div>

      {isEmpty ? (
        /* ── Empty state ──────────────────────────── */
        <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🌱</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t1)", marginBottom: "6px" }}>
            Seu patrimônio começa aqui
          </div>
          <div style={{ fontSize: "12px", color: "var(--t3)", lineHeight: 1.5, marginBottom: "16px", maxWidth: "220px", margin: "0 auto 16px" }}>
            Lance sua primeira transação e veja seu patrimônio crescer em tempo real.
          </div>
          <button
            onClick={() => onNavigate?.("launch")}
            style={{
              background: "linear-gradient(135deg, #2F62D9, #5048E8)",
              border: "none", borderRadius: "12px",
              padding: "10px 20px", fontSize: "13px", fontWeight: 700,
              color: "#fff", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(80,72,232,0.4)",
            }}
          >
            + Lançar primeira transação
          </button>
        </div>
      ) : (
        /* ── Data state ───────────────────────────── */
        <>
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
        </>
      )}

      {/* ── Stats row — always visible ──────────── */}
      {!isEmpty && (
        <div className="stat3" style={{ marginTop: 14 }}>
          <div className="s3i">
            <div className="s3l">Ativos</div>
            <div className="s3v" style={{ color: "var(--green)" }}>{fmtM(assets)}</div>
          </div>
          <div className="s3i">
            <div className="s3l">Passivos</div>
            <div className="s3v" style={{ color: "var(--red)" }}>{fmt(liabilities)}</div>
          </div>
          <div
            className="s3i"
            onClick={() => onNavigate?.('health')}
            style={{ cursor: 'pointer' }}
          >
            <div className="s3l">Score</div>
            <div className="s3v" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
              {healthScore === 0 ? (
                <span
                  style={{ fontSize: "10px", color: "var(--amber)", fontWeight: 700, border: "1px solid rgba(255,173,59,0.3)", borderRadius: "8px", padding: "2px 6px" }}
                >
                  Config →
                </span>
              ) : (
                <>
                  <ScoreDot score={healthScore} />
                  <span style={{ color: healthScore >= 70 ? "var(--green)" : healthScore >= 40 ? "var(--amber)" : "var(--red)" }}>
                    {healthScore}/100
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
