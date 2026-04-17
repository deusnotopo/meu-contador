import React from "react";
import { PieChart } from "lucide-react";
import { DashboardErrorBoundary } from "@/components/ui/DashboardErrorBoundary";
import { TermometroDoMes } from "./TermometroDoMes";
import { DailySpendingWidget } from "./DailySpendingWidget";
import { TaxAuditorWidget } from "./TaxAuditorWidget";
import { CategorySpendingWidget } from "./CategorySpendingWidget";
import { RecentTransactions } from "./RecentTransactions";
import type { TabType } from "@/types/navigation";

interface InsightsSectionProps {
  globalTotals: { income: number; expense: number; balance: number };
  sustainableDaily: number;
  estimatedTax: number;
  monthlyRevenue: number;
  categorySpending: any[];
  recentPurchases: any[];
  personalError: string | null;
  onNavigate: (tab: TabType) => void;
  fmt: (v: number) => string;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  globalTotals,
  sustainableDaily,
  estimatedTax,
  monthlyRevenue,
  categorySpending,
  recentPurchases,
  personalError,
  onNavigate,
  fmt,
}) => {
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
              income={globalTotals.income}
              expense={globalTotals.expense}
              balance={globalTotals.balance}
              onNavigate={onNavigate}
            />
          </DashboardErrorBoundary>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DailySpendingWidget sustainableDaily={sustainableDaily} fmt={fmt} />
            <TaxAuditorWidget
              estimatedTax={estimatedTax}
              monthlyRevenue={monthlyRevenue}
              fmt={fmt}
            />
          </div>
        </div>

        {/* Lista de Gastos e Categorias */}
        <div className="md:col-span-5 bento-card p-6">
          <CategorySpendingWidget
            categories={categorySpending}
            hasError={personalError}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div className="bento-card p-6 md:col-span-12">
        <RecentTransactions
          transactions={recentPurchases}
          onNavigate={onNavigate}
          fmt={fmt}
          error={personalError}
        />
      </div>
    </section>
  );
};
