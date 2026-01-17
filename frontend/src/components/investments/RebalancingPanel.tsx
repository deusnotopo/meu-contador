import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { Investment } from "@/types";
import { ArrowRight, Calculator, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

interface Props {
  assets: Investment[];
}

export const RebalancingPanel = ({ assets }: Props) => {
  const analysis = useMemo(() => {
    const totalValue = assets.reduce(
      (acc, asset) => acc + asset.amount * asset.currentPrice,
      0
    );

    return assets
      .map((asset) => {
        const currentValue = asset.amount * asset.currentPrice;
        const currentPercentage =
          totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
        const targetPercentage = asset.targetAllocation || 0;

        const targetValue = (totalValue * targetPercentage) / 100;
        const differenceValue = targetValue - currentValue;
        const differenceAmount =
          asset.currentPrice > 0 ? differenceValue / asset.currentPrice : 0;

        return {
          ...asset,
          currentValue,
          currentPercentage,
          targetValue,
          differenceValue,
          differenceAmount,
          action: differenceValue > 0 ? "BUY" : "SELL",
        };
      })
      .sort(
        (a, b) => Math.abs(b.differenceValue) - Math.abs(a.differenceValue)
      ); // Sort by magnitude of action needed
  }, [assets]);

  const totalTargetDefined = assets.reduce(
    (acc, a) => acc + (a.targetAllocation || 0),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header / Summary */}
      <div className="premium-card p-8">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Calculator size={20} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Rebalanceamento{" "}
                <span className="text-indigo-400">Inteligente</span>
              </h3>
            </div>
            <p className="text-sm text-slate-400 font-medium max-w-lg">
              Análise automática baseada nas suas metas de alocação.
              Recomendamos ações para equilibrar sua carteira.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-xl border ${
                totalTargetDefined === 100
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-widest">
                Total Alvo: {totalTargetDefined.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysis.map((item) => (
          <div
            key={item.id}
            className="premium-card p-6 border-l-4 border-l-transparent hover:border-l-indigo-500 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-black text-white text-lg">{item.ticker}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {item.type}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  item.differenceValue > 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : item.differenceValue < 0
                    ? "bg-rose-500/10 text-rose-400"
                    : "bg-slate-500/10 text-slate-400"
                }`}
              >
                {Math.abs(item.differenceValue) < 1
                  ? "Ideal"
                  : item.action === "BUY"
                  ? "Comprar"
                  : "Vender"}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Progress Bars */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Alocação Atual</span>
                  <span>{item.currentPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500"
                    style={{
                      width: `${Math.min(item.currentPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  <span>Meta</span>
                  <span>{item.targetAllocation?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${Math.min(item.targetAllocation || 0, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Needed */}
            {Math.abs(item.differenceValue) > 1 && (
              <div
                className={`p-4 rounded-xl border ${
                  item.action === "BUY"
                    ? "bg-emerald-500/5 border-emerald-500/10"
                    : "bg-rose-500/5 border-rose-500/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      item.action === "BUY"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    Sugestão
                  </span>
                  {item.action === "BUY" ? (
                    <TrendingUp size={14} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={14} className="text-rose-400" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-lg font-black ${
                      item.action === "BUY"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {item.action === "BUY" ? "+" : "-"}
                    {Math.abs(Math.round(item.differenceAmount))}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    cotas
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  aprox.{" "}
                  <PrivacyValue
                    value={Math.abs(item.differenceValue)}
                    isRaw={false}
                    displayValue={formatCurrency(
                      Math.abs(item.differenceValue)
                    )}
                  />
                </p>
              </div>
            )}

            {Math.abs(item.differenceValue) <= 1 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <span className="text-xs font-bold text-slate-400">
                  ✅ Balanceado
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          variant="outline"
          className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest h-12 px-8 rounded-xl gap-2"
        >
          Gerar Relatório PDF <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};
