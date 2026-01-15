import type { Investment, UserProfile } from "@/types";
import { AlertTriangle, CheckCircle2, Shield, Target } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  assets: Investment[];
  profile?: UserProfile;
}

export const PortfolioAnalysis = ({ assets, profile }: Props) => {
  const analysis = useMemo(() => {
    const totalValue = assets.reduce(
      (acc, a) => acc + a.amount * a.currentPrice,
      0
    );
    if (totalValue === 0) return null;

    // Risk Scores: Fixed=1, FII=3, ETF=3, Stock=4, Crypto=5
    const riskMap: Record<string, number> = {
      fixed_income: 1,
      fii: 3,
      etf: 3,
      stock: 4,
      crypto: 5,
    };

    let weightedRisk = 0;
    const sectorMap: Record<string, number> = {};

    assets.forEach((asset) => {
      const value = asset.amount * asset.currentPrice;
      const weight = value / totalValue;
      const risk = riskMap[asset.type] || 3;
      weightedRisk += risk * weight;

      sectorMap[asset.sector || "Outros"] =
        (sectorMap[asset.sector || "Outros"] || 0) + value;
    });

    // Herfindahl-Hirschman Index for Diversification (0 to 1)
    // HHI = sum(weight^2). Diversification = 1 - HHI
    const hhi = assets.reduce((acc, a) => {
      const weight = (a.amount * a.currentPrice) / totalValue;
      return acc + weight * weight;
    }, 0);
    const diversificationScore = 1 - hhi;

    const sectorData = Object.entries(sectorMap)
      .map(([name, value]) => ({
        name,
        value,
        percent: (value / totalValue) * 100,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalValue,
      weightedRisk,
      diversificationScore,
      sectorData,
    };
  }, [assets]);

  if (!analysis) return null;

  const getRiskLabel = (score: number) => {
    if (score < 2)
      return {
        label: "Conservador",
        color: "text-emerald-400",
        bg: "bg-emerald-500",
      };
    if (score < 3.5)
      return { label: "Moderado", color: "text-amber-400", bg: "bg-amber-500" };
    return { label: "Agressivo", color: "text-rose-400", bg: "bg-rose-500" };
  };

  const riskInfo = getRiskLabel(analysis.weightedRisk);
  const userRiskProfile = profile?.riskProfile || "moderate";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Card */}
        <div className="premium-card p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Shield size={20} />
              </div>
              <h3 className="font-black text-white text-sm uppercase tracking-widest">
                Risco da Carteira
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5`}
            >
              Score: {analysis.weightedRisk.toFixed(2)} / 5.0
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className={`text-3xl font-black ${riskInfo.color}`}>
                {riskInfo.label}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Seu Perfil: {userRiskProfile.toUpperCase()}
              </p>
            </div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: "33%" }} />
              <div className="h-full bg-amber-500" style={{ width: "33%" }} />
              <div className="h-full bg-rose-500" style={{ width: "34%" }} />
            </div>
            <div className="relative w-full h-2">
              <div
                className="absolute top-[-16px]"
                style={{
                  left: `${(analysis.weightedRisk / 5) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mx-auto mb-1" />
              </div>
            </div>

            {/* Insight */}
            <div className="p-3 bg-white/5 rounded-xl text-xs font-medium text-slate-400 leading-relaxed border border-white/5">
              {analysis.weightedRisk > 4 &&
              userRiskProfile === "conservative" ? (
                <span className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle size={14} /> Sua carteira está muito arriscada
                  para seu perfil. Considere aumentar Renda Fixa.
                </span>
              ) : analysis.weightedRisk < 2 &&
                userRiskProfile === "aggressive" ? (
                <span className="flex items-center gap-2 text-amber-400">
                  <Target size={14} /> Você pode assumir mais riscos para buscar
                  maiores retornos.
                </span>
              ) : (
                <span className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={14} /> O risco da sua carteira está
                  alinhado com seu perfil.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Diversification Card */}
        <div className="premium-card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Target size={20} />
              </div>
              <h3 className="font-black text-white text-sm uppercase tracking-widest">
                Diversificação
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                analysis.diversificationScore > 0.6
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              Score: {(analysis.diversificationScore * 100).toFixed(0)} / 100
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={
                      251.2 * (1 - analysis.diversificationScore)
                    }
                    className={
                      analysis.diversificationScore > 0.6
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-white text-lg">
                  {(analysis.diversificationScore * 100).toFixed(0)}%
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">
                {analysis.diversificationScore > 0.7
                  ? "Excelente! Sua carteira está bem distribuída entre diferentes ativos."
                  : "Atenção: Concentração alta em poucos ativos aumenta o risco específico."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Chart */}
      <div className="premium-card p-6 md:p-8">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">
          Distribuição por Setor
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analysis.sectorData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={true}
                vertical={false}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                fontSize={10}
                width={100}
                tick={{ fill: "#94a3b8", fontWeight: 700 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar
                dataKey="value"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
