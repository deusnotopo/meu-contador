import React from "react";
import { PieChart } from "lucide-react";
import { DashboardErrorBoundary } from "@/components/ui/DashboardErrorBoundary";
import { TermometroDoMes } from "./TermometroDoMes";
import { DailySpendingWidget } from "./DailySpendingWidget";
import { TaxAuditorWidget } from "./TaxAuditorWidget";
import { CategorySpendingWidget } from "./CategorySpendingWidget";
import { RecentTransactions } from "./RecentTransactions";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import { useInsightsStats } from "@/hooks/dashboard/useInsightsStats";
import { Skeleton } from "@/components/ui/skeleton";
import type { TabType } from "@/types/navigation";

export const InsightsSection: React.FC<{ onNavigate: (tab: TabType) => void }> = ({
  onNavigate,
}) => {
  const { stats, health, activity, monthlyRevenue, isLoading, error } = useInsightsStats();

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-[24px]" />;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5 px-1 mb-1">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60 flex items-center gap-2">
          <PieChart size={12} className="text-purple-400" /> Insights & Reflexão
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Termometro e Gastos Diários */}
        <div className="md:col-span-7 space-y-3">
          <DashboardErrorBoundary componentName="TermometroDoMes">
            <TermometroDoMes
              income={stats.income}
              expense={stats.expense}
              balance={stats.balance}
              onNavigate={onNavigate}
            />
          </DashboardErrorBoundary>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DailySpendingWidget 
              sustainableDaily={health.sustainableDaily} 
              fmt={FinancialFormatter.formatCurrency.bind(FinancialFormatter)} 
            />
            <TaxAuditorWidget
              estimatedTax={health.estimatedTax}
              monthlyRevenue={monthlyRevenue}
              fmt={FinancialFormatter.formatCurrency.bind(FinancialFormatter)}
            />
          </div>
        </div>

        {/* Lista de Gastos e Categorias */}
        <div className="md:col-span-5 bento-card p-6">
          <CategorySpendingWidget
            categories={activity.categorySpending}
            hasError={!!error}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div className="bento-card p-6 md:col-span-12">
        <RecentTransactions
          transactions={activity.recentPurchases}
          onNavigate={onNavigate}
          fmt={FinancialFormatter.formatCurrency.bind(FinancialFormatter)}
          error={error}
        />
      </div>
    </section>
  );
};

