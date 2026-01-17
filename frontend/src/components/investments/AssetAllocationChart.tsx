import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { Investment, Currency } from "@/types";
import { PieChart, Plus } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  assets: Investment[];
  loading: boolean;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export const AssetAllocationChart = ({ assets, loading, convert }: Props) => {
  const allocationData = assets.map((asset) => ({
    name: asset.ticker,
    value: convert(
      asset.amount * asset.currentPrice,
      (asset.currency || "BRL") as Currency,
      "BRL"
    ),
  }));

  return (
    <div className="premium-card p-8 lg:col-span-1 min-h-[450px]">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <PieChart className="text-amber-400" size={16} />
        </div>
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">
          Alocação
        </h3>
      </div>
      <div className="h-[300px] relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton
              variant="circular"
              width={160}
              height={160}
              className="opacity-20"
            />
          </div>
        ) : assets.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
              >
                {allocationData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-xl)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                formatter={(value: number) => {
                  if (
                    localStorage.getItem("meu_contador_privacy_mode") === "true"
                  )
                    return "****";
                  return formatCurrency(value);
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
            <Plus size={32} className="opacity-10 mb-4" />
            <p className="text-xs font-medium">Nenhum ativo cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};
