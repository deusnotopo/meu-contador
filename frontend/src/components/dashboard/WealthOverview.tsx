import React from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import { BentoStatCard } from "@/components/ui/BentoStatCard";
import { HeroPatrimonio } from "./HeroPatrimonio";

interface WealthOverviewProps {
  globalTotals: { netWorth: number; assets: number; liabilities: number };
  healthScore: number;
  healthScoreTooltip: string;
  scoreReliability: string;
  scoreSourceLabel: string;
  monthlyVariation: { percentage: number };
  sparklineData: number[];
  fmtM: (v: number) => string;
  fmt: (v: number) => string;
}

export const WealthOverview: React.FC<WealthOverviewProps> = ({
  globalTotals,
  healthScore,
  healthScoreTooltip,
  scoreReliability,
  scoreSourceLabel,
  monthlyVariation,
  sparklineData,
  fmtM,
  fmt,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
      {/* Hero Patrimonio Large Card */}
      <BentoStatCard
        title="Patrimônio Líquido"
        value={fmtM(globalTotals.netWorth)}
        subtitle="Consolidado de todas as contas"
        icon={<Wallet className="text-indigo-400" />}
        trend={{
          value: monthlyVariation.percentage,
          isPositive: monthlyVariation.percentage >= 0,
        }}
        className="md:col-span-4 min-h-[220px]"
        variant="premium"
      >
        <div className="mt-4 h-24 opacity-80">
          <HeroPatrimonio
            netWorth={globalTotals.netWorth}
            assets={globalTotals.assets}
            liabilities={globalTotals.liabilities}
            healthScore={healthScore}
            healthScoreTooltip={healthScoreTooltip}
            healthScoreReliability={scoreReliability as any}
            healthScoreSourceLabel={scoreSourceLabel}
            monthlyVariation={monthlyVariation}
            sparklineData={sparklineData}
            fmtM={fmtM}
            fmt={fmt}
            onlyChart={true}
          />
        </div>
      </BentoStatCard>

      {/* Financial Health Score */}
      <BentoStatCard
        title="Saúde Financeira"
        value={`${healthScore}/100`}
        subtitle="Score de resiliência"
        icon={<ShieldCheck className="text-emerald-400" />}
        className="md:col-span-2"
        variant={
          healthScore > 70
            ? "success"
            : healthScore > 40
              ? "warning"
              : "danger"
        }
      >
        <div className="mt-2 text-[11px] leading-relaxed opacity-70">
          {healthScoreTooltip}
        </div>
        <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/40">
            {scoreSourceLabel}
          </div>
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/40">
            {scoreReliability}
          </div>
        </div>
      </BentoStatCard>
    </section>
  );
};
