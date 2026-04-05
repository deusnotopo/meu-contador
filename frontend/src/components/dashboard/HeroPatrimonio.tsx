import React, { useEffect, useRef, useState } from "react";
import { Sparkline } from "@/components/ui/Charts";
import type { TabType } from "@/types/navigation";

interface HeroPatrimonioProps {
  netWorth: number;
  assets: number;
  liabilities: number;
  healthScore: number;
  healthScoreTooltip?: string;
  monthlyVariation: { amount: number; percentage: number };
  sparklineData: number[];
  onNavigate?: (tab: TabType) => void;
  fmtM: (n: number) => string;
  fmt: (n: number) => string;

}

/** Animates a number from 0 to target over ~900ms */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else { setValue(target); prev.current = target; }
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
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
  healthScoreTooltip,
  monthlyVariation,
  sparklineData,
  onNavigate,
  fmtM,
  fmt
}) => {
  const isEmpty = assets === 0 && liabilities === 0;
  const animatedNetWorth = useCountUp(netWorth);
  const animatedAssets = useCountUp(assets);
  const animatedLiabilities = useCountUp(liabilities);

  return (
    <div className="hero" style={{ marginBottom: 0 }}>
      {/* ── Floating Score Badge ───────────── */}
      {!isEmpty && (
        <button 
          onClick={() => onNavigate?.('health')}
          className="absolute top-5 right-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer hover:bg-white/5 transition-colors border border-white/5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 hover:scale-105 active:scale-95 z-10"
          title={healthScoreTooltip || "Score de Saúde Financeira"}
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
        >
          {healthScore === 0 ? (
            <span style={{ fontSize: "10px", color: "var(--amber)", fontWeight: 700 }}>Config score →</span>
          ) : (
            <>
              <ScoreDot score={healthScore} />
              <span className="text-[11px] font-bold font-mono" style={{ color: healthScore >= 70 ? "var(--green)" : healthScore >= 40 ? "var(--amber)" : "var(--red)" }}>
                Score: {healthScore}
              </span>
            </>
          )}
        </button>
      )}

      <div style={{
        fontSize: "10.5px", color: "var(--t3)", fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px",
        display: "flex", alignItems: "center", gap: "6px"
      }}>
        Patrimônio Total
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
          {/* Animated net worth number - THE DOMINANT VALUE */}
          <div className="bignum mt-1 mb-2" style={{ 
            fontSize: "46px", 
            letterSpacing: "-2.5px",
            background: "linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0px 8px 32px rgba(255, 255, 255, 0.15))"
          }}>
            {fmtM(animatedNetWorth)}
          </div>

          {/* Secondary stats (Assets & Liabilities) */}
          <div className="flex items-center gap-4 mt-3 mb-4 pl-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Ativos</span>
              <span className="text-[13px] font-mono text-emerald-400 font-medium">{fmtM(animatedAssets)}</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Passivos</span>
              <span className="text-[13px] font-mono text-red-400 font-medium">{fmt(animatedLiabilities)}</span>
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/5 my-3" />

          <div className="flex items-center justify-between gap-4 h-[32px]">
            {monthlyVariation.amount !== 0 && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${monthlyVariation.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {monthlyVariation.amount > 0 ? '▲' : '▼'} {fmt(Math.abs(monthlyVariation.amount))} este mês
                </span>
                <span className="text-[10px] text-gray-500 font-mono font-medium">
                  {monthlyVariation.percentage > 0 ? '+' : ''}{monthlyVariation.percentage.toFixed(1)}%
                </span>
              </div>
            )}
            
            <div style={{ flex: 1, minWidth: '60px', height: '100%', opacity: 0.8 }}>
              {sparklineData.length > 0 && (
                 <Sparkline data={sparklineData} color="var(--blue)" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
