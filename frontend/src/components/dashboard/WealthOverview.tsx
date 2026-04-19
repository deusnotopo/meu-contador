import React from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import { BentoStatCard } from "@/components/ui/BentoStatCard";
import { HeroPatrimonio } from "./HeroPatrimonio";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import { useWealthStats } from "@/hooks/dashboard/useWealthStats";
import { Skeleton } from "@/components/ui/skeleton";

export const WealthOverview: React.FC = () => {
  const { stats, health, monthlyVariation, sparklineData, isLoading } = useWealthStats();

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Skeleton className="md:col-span-4 h-[220px] rounded-[32px]" />
        <Skeleton className="md:col-span-2 h-[220px] rounded-[32px]" />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
      {/* Hero Patrimonio Large Card */}
      <BentoStatCard
        title="Patrimônio Líquido"
        value={FinancialFormatter.formatCompact(stats.netWorth)}
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
            netWorth={stats.netWorth}
            assets={stats.assets}
            liabilities={stats.liabilities}
            healthScore={health.score}
            healthScoreTooltip={health.tooltip}
            healthScoreReliability={health.scoreReliability}
            healthScoreSourceLabel={health.scoreSourceLabel}
            monthlyVariation={monthlyVariation}
            sparklineData={sparklineData}
            onlyChart={true}
          />
        </div>
      </BentoStatCard>

      {/* Financial Health Score */}
      <BentoStatCard
        title="Saúde Financeira"
        value={`${health.score}/100`}
        subtitle="Score de resiliência"
        icon={<ShieldCheck className="text-emerald-400" />}
        className="md:col-span-2"
        variant={
          health.score > 70
            ? "success"
            : health.score > 40
              ? "warning"
              : "danger"
        }
      >
        <div className="mt-2 text-[11px] leading-relaxed opacity-70">
          {health.tooltip}
        </div>
        <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/40">
            {health.scoreSourceLabel}
          </div>
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/40">
            {health.scoreReliability}
          </div>
        </div>
      </BentoStatCard>
    </section>
  );
};

