import { formatCurrency } from "@/lib/formatters";
import type { Dividend, Investment } from "@/types";
import { TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  assets: Investment[];
  dividends: Dividend[];
}

export const DividendForecast: React.FC<Props> = ({ assets, dividends }) => {
  const forecastData = useMemo(() => {
    // 1. Group dividends by asset and calculate last 12 months sum
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const assetYields = assets.map((asset) => {
      const assetDividends = dividends.filter(
        (d) => d.assetId === asset.id && new Date(d.date) >= lastYear
      );

      const totalLastYear = assetDividends.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      // If no dividends in last year, estimate 5% yield as fallback for UI purposes
      const estimatedAnnual =
        totalLastYear > 0
          ? totalLastYear
          : (asset.currentPrice || asset.averagePrice) * asset.amount * 0.05;

      return {
        ticker: asset.ticker,
        monthly: estimatedAnnual / 12,
        annual: estimatedAnnual,
        isEstimate: totalLastYear === 0,
      };
    });

    return assetYields.sort((a, b) => b.annual - a.annual);
  }, [assets, dividends]);

  const totalMonthly = forecastData.reduce((sum, d) => sum + d.monthly, 0);
  const totalAnnual = totalMonthly * 12;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-6 border-indigo-500/20 bg-indigo-500/5">
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
            Projeção Mensal Média
          </p>
          <h3 className="text-3xl font-black text-white">
            {formatCurrency(totalMonthly)}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Renda passiva estimada</span>
          </div>
        </div>

        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">
            Projeção Anual Total
          </p>
          <h3 className="text-3xl font-black text-white">
            {formatCurrency(totalAnnual)}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Baseado no histórico e mercado</span>
          </div>
        </div>
      </div>

      <div className="premium-card p-8">
        <h4 className="text-lg font-black text-white mb-8 uppercase tracking-tight">
          Distribuição de Renda{" "}
          <span className="text-slate-500">por Ativo</span>
        </h4>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff05"
                vertical={false}
              />
              <XAxis
                dataKey="ticker"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: "#ffffff05" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-premium p-4 border border-white/10 rounded-2xl shadow-2xl">
                        <p className="text-xs font-black text-indigo-400 mb-1">
                          {data.ticker}
                        </p>
                        <p className="text-lg font-black text-white">
                          {formatCurrency(data.annual)}/ano
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                          {formatCurrency(data.monthly)} mensais
                        </p>
                        {data.isEstimate && (
                          <p className="mt-2 text-[8px] text-amber-500 font-bold uppercase italic">
                            * Estimativa baseada em 5% yield
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="annual"
                fill="#6366f1"
                radius={[8, 8, 0, 0]}
                barSize={40}
              >
                {forecastData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEstimate ? "#312e81" : "#6366f1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 space-y-3">
          {forecastData.slice(0, 5).map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{item.ticker}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Projeção Mensal
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">
                  {formatCurrency(item.monthly)}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold">
                  {((item.annual / totalAnnual) * 100).toFixed(1)}% do total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
