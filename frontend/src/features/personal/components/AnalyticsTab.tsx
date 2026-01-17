import { AnalyticsTab as AnalyticsTabContent } from "@/components/contador/AnalyticsTab";
import type { CategoryChartData, ChartDataItem, MonthlyData } from "@/types";

interface AnalyticsTabProps {
  monthlyTrend: MonthlyData[];
  categoryData: CategoryChartData[];
  incomeChartData: ChartDataItem[];
  expenseChartData: ChartDataItem[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  incomeCount: number;
  expenseCount: number;
}

export const AnalyticsTab = ({
  monthlyTrend,
  categoryData,
  incomeChartData,
  expenseChartData,
  totals,
  incomeCount,
  expenseCount,
}: AnalyticsTabProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <AnalyticsTabContent
        monthlyTrend={monthlyTrend}
        categoryData={categoryData}
        incomeChartData={incomeChartData}
        expenseChartData={expenseChartData}
        totals={totals}
        incomeCount={incomeCount}
        expenseCount={expenseCount}
      />
    </div>
  );
};
