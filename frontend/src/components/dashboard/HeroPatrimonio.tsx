import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/ui/Charts";
import { DataReliabilityBadge } from "@/components/ui/DataReliabilityBadge";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import type { TabType } from "@/types/navigation";
import type { DataReliability } from "@/lib/data-reliability";

interface HeroPatrimonioProps {
  netWorth: number;
  assets: number;
  liabilities: number;
  healthScore: number;
  healthScoreTooltip?: string;
  healthScoreReliability?: DataReliability;
  healthScoreSourceLabel?: string;
  monthlyVariation: { amount: number; percentage: number };
  sparklineData: number[];
  onNavigate?: (tab: TabType) => void;
  onlyChart?: boolean;
}

/** Animates a number from 0 to target over ~900ms (easeOutCubic) */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
      else { setValue(target); prev.current = target; }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
}

/** Health score coloured dot */
const ScoreDot = ({ score }: { score: number }) => {
  const colorClass =
    score >= 70
      ? "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]"
      : score >= 40
      ? "bg-amber-400 shadow-[0_0_6px_theme(colors.amber.400)]"
      : "bg-rose-500 shadow-[0_0_6px_theme(colors.rose.500)]";

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 mr-1 ${colorClass}`}
      aria-hidden
    />
  );
};

export const HeroPatrimonio: React.FC<HeroPatrimonioProps> = ({
  netWorth,
  assets,
  liabilities,
  healthScore,
  healthScoreTooltip,
  healthScoreReliability = "HEURISTIC",
  healthScoreSourceLabel = "regras internas do app",
  monthlyVariation,
  sparklineData,
  onNavigate,
  onlyChart = false,
}) => {
  const isEmpty = assets === 0 && liabilities === 0;
  const animatedNetWorth   = useCountUp(netWorth);
  const animatedAssets     = useCountUp(assets);
  const animatedLiabilities = useCountUp(liabilities);

  const scoreTextClass =
    healthScore >= 70
      ? "text-emerald-400"
      : healthScore >= 40
      ? "text-amber-400"
      : "text-rose-400";

  if (onlyChart) {
    return (
      <div className="w-full h-full opacity-80">
        {sparklineData.length > 0 && (
          <Sparkline data={sparklineData} color="var(--blue)" />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="
        relative overflow-hidden rounded-[var(--r5)] p-[22px]
        bg-[linear-gradient(155deg,#060D1E_0%,#030712_50%,#060E1A_100%)]
        border border-blue-500/[0.15]
      "
    >
      {!isEmpty && (
        <motion.div
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="
            absolute -top-[60px] left-[20%] w-[60%] h-[200px] rounded-full
            bg-[radial-gradient(ellipse,rgba(74,139,255,0.12)_0%,transparent_70%)]
            pointer-events-none blur-[20px]
          "
          aria-hidden
        />
      )}

      {!isEmpty && (
        <button
          onClick={() => onNavigate?.("health")}
          title={healthScoreTooltip || "Score de Saude Financeira"}
          className="
            absolute top-5 right-5 z-10 flex items-center gap-1.5 px-2.5 py-1
            rounded-full cursor-pointer border border-white/[0.05]
            bg-white/[0.03] backdrop-blur-xl shadow-sm
            hover:bg-white/[0.06] hover:scale-105 active:scale-95 transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
          "
          aria-label={healthScoreTooltip || "Score de Saude Financeira"}
        >
          {healthScore === 0 ? (
            <span className="text-[10px] font-bold text-amber-400">Config score -&gt;</span>
          ) : (
            <>
              <ScoreDot score={healthScore} />
              <span className={`text-[11px] font-bold font-mono ${scoreTextClass}`}>
                Score: {healthScore}
              </span>
            </>
          )}
        </button>
      )}

      {!isEmpty && healthScore > 0 && (
        <div className="absolute top-[52px] right-5 z-10">
          <DataReliabilityBadge
            reliability={healthScoreReliability}
            sourceLabel={healthScoreSourceLabel}
            compact
          />
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--t3)] mb-2">
        Patrimonio Total
      </div>

      {isEmpty ? (
        <div className="py-[18px] pb-2 flex flex-col items-center text-center">
          <div className="text-4xl mb-2.5" aria-hidden>🌱</div>
          <div className="text-base font-bold text-[var(--t1)] mb-1.5">
            Seu patrimonio comeca aqui
          </div>
          <div className="text-[12px] text-[var(--t3)] leading-relaxed mb-4 max-w-[220px]">
            Lance sua primeira transacao e veja seu patrimonio crescer em tempo real.
          </div>
          <button
            onClick={() => onNavigate?.("launch")}
            className="
              px-5 py-2.5 rounded-xl text-[13px] font-bold text-white cursor-pointer
              bg-[linear-gradient(135deg,#2F62D9,#5048E8)]
              shadow-[0_4px_16px_rgba(80,72,232,0.4)]
              hover:brightness-110 active:scale-95 transition-all
            "
          >
            + Lancar primeira transacao
          </button>
        </div>
      ) : (
        <>
          <div
            className="bignum mt-1 mb-2 font-black leading-none"
            style={{
              fontSize: "46px",
              letterSpacing: "-2.5px",
              background: "linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0px 8px 32px rgba(255,255,255,0.15))",
            }}
          >
            {FinancialFormatter.formatCompact(animatedNetWorth)}
          </div>

          <div className="flex items-center gap-4 mt-3 mb-4 pl-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Ativos</span>
              <span className="text-[13px] font-mono text-emerald-400 font-medium">{FinancialFormatter.formatCompact(animatedAssets)}</span>
            </div>
            <div className="w-px h-3 bg-white/10" aria-hidden />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Passivos</span>
              <span className="text-[13px] font-mono text-rose-400 font-medium">{FinancialFormatter.formatCurrency(animatedLiabilities)}</span>
            </div>
          </div>

          <div className="h-px w-full bg-white/[0.05] my-3" />

          <div className="flex items-center justify-between gap-4 h-8">
            {monthlyVariation.amount !== 0 && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    monthlyVariation.amount > 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {monthlyVariation.amount > 0 ? "▲" : "▼"}{" "}
                  {FinancialFormatter.formatCurrency(Math.abs(monthlyVariation.amount))} este mes
                </span>
                <span className="text-[10px] text-gray-500 font-mono font-medium">
                  {monthlyVariation.percentage > 0 ? "+" : ""}
                  {monthlyVariation.percentage.toFixed(1)}%
                </span>
              </div>
            )}

            <div className="flex-1 min-w-[60px] h-full opacity-80">
              {sparklineData.length > 0 && (
                <Sparkline data={sparklineData} color="var(--blue)" />
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};