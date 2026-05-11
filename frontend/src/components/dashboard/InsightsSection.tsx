import React from "react";
import { PieChart } from "lucide-react";
import { DashboardErrorBoundary } from "@/components/ui/DashboardErrorBoundary";
import { TermometroDoMes } from "./TermometroDoMes";
import { DailySpendingWidget } from "./DailySpendingWidget";
import { CategorySpendingWidget } from "./CategorySpendingWidget";
import { RecentTransactions } from "./RecentTransactions";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import { useInsightsStats } from "@/hooks/dashboard/useInsightsStats";
import { DecisionFeedWidget } from "./DecisionFeedWidget";
import type { DashboardIntelligence } from "@/hooks/useIntelligence";
import type { Transaction } from "@/types";
import type { TabType } from "@/types/navigation";

export interface DashboardStats {
  income: number;
  expense: number;
  balance: number;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface DashboardHealth {
  score: number;
  tooltip: string;
  sustainableDaily: number;
  estimatedTax: number;
  dailyBurnRate?: number;
}

interface InsightsSectionProps {
  onNavigate: (tab: TabType) => void;
  stats: DashboardStats;
  health: DashboardHealth;
  allTransactions: Transaction[];
  isLoading: boolean;
  intelligence?: DashboardIntelligence | null;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  onNavigate,
  stats,
  health,
  allTransactions,
  isLoading,
  intelligence,
}) => {
  const { activity } = useInsightsStats(allTransactions);
  const error = null; // Error handling is now at orchestrator level

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
          <DashboardErrorBoundary title="Termômetro do Mês">
            {isLoading ? (
              <div className="h-32 w-full skeleton-pulse animate-pulse-akita rounded-3xl" />
            ) : (
              <TermometroDoMes
                income={stats.income}
                expense={stats.expense}
                balance={stats.balance}
                onNavigate={onNavigate}
              />
            )}
          </DashboardErrorBoundary>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DashboardErrorBoundary title="Gastos Diários">
              {isLoading ? (
                <div className="h-24 w-full skeleton-pulse animate-pulse-akita rounded-3xl" />
              ) : (
                <DailySpendingWidget 
                  sustainableDaily={health.sustainableDaily} 
                  fmt={FinancialFormatter.formatCurrency.bind(FinancialFormatter)} 
                />
              )}
            </DashboardErrorBoundary>

            <DashboardErrorBoundary title="Decisões da IA">
              <DecisionFeedWidget 
                decisions={intelligence?.decisions || []} 
                isLoading={isLoading} 
              />
            </DashboardErrorBoundary>
          </div>
        </div>

        {/* Lista de Gastos e Categorias */}
        <div className="md:col-span-5 bento-card p-6 min-h-[300px]">
          <DashboardErrorBoundary title="Gastos por Categoria">
            {isLoading ? (
               <div className="space-y-4">
                 <div className="h-4 w-1/2 skeleton-pulse animate-pulse-akita" />
                 <div className="h-24 w-full skeleton-pulse animate-pulse-akita" />
               </div>
            ) : (
              <CategorySpendingWidget
                categories={activity.categorySpending}
                hasError={!!error}
                onNavigate={onNavigate}
              />
            )}
          </DashboardErrorBoundary>
        </div>

        {/* Transações recentes — full width dentro do grid */}
        <div className="md:col-span-12 bento-card p-6 min-h-[220px]">
          <DashboardErrorBoundary title="Transações Recentes">
            {isLoading ? (
               <div className="space-y-3">
                 <div className="h-4 w-1/4 skeleton-pulse animate-pulse-akita" />
                 <div className="h-12 w-full skeleton-pulse animate-pulse-akita" />
                 <div className="h-12 w-full skeleton-pulse animate-pulse-akita" />
               </div>
            ) : (
              <RecentTransactions
                transactions={activity.recentPurchases}
                onNavigate={onNavigate}
                fmt={FinancialFormatter.formatCurrency.bind(FinancialFormatter)}
                error={!!error}
              />
            )}
          </DashboardErrorBoundary>
        </div>
      </div>
    </section>
  );
};

