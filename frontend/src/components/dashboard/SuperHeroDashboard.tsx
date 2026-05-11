import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Compass, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import { UserNav } from "@/components/layout/UserNav";
import { ProbabilisticAreaChart } from "@/components/ui/ProbabilisticAreaChart";
import type { TabType } from "@/types/navigation";
import type { DashboardIntelligence } from "@/hooks/useIntelligence";
import type { DashboardStats, DashboardHealth } from "./InsightsSection";

interface SuperHeroDashboardProps {
  onNavigate: (tab: TabType) => void;
  stats: DashboardStats;
  health: DashboardHealth;
  sparklineData: number[];
  monthlyVariation?: { amount: number; percentage: number };
  isLoading: boolean;
  intelligence?: DashboardIntelligence | null;
}

export const SuperHeroDashboard: React.FC<SuperHeroDashboardProps> = ({ 
  onNavigate,
  stats,
  health,
  sparklineData,
  monthlyVariation,
  isLoading,
  intelligence
}) => {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Usuário";

  // Métrica de Sobrevivência (Vinda da Inteligência Real ou cálculo local de fallback)
  const survivalDays = intelligence?.wealthSurvivalDays ?? (
    health?.dailyBurnRate > 0 
      ? Math.round(stats.netWorth / health.dailyBurnRate) 
      : 0
  );
  
  const regimeName = intelligence?.regime?.currentRegime || "Estabilidade";
  const regimeColor = regimeName === "EXPANSION" ? "text-emerald-400" : regimeName === "CONTRACTION" ? "text-rose-400" : "text-blue-400";

  const survivalLabel = survivalDays > 0 
    ? (survivalDays > 365 ? `${(survivalDays / 365).toFixed(1)} anos` : `${survivalDays} dias`)
    : "---";

  const probabilisticData = sparklineData.map((val, idx) => ({
    month: idx,
    p50: val,
    p95: val * 1.05,
    p5: val * 0.95
  }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full min-h-[380px] rounded-[40px] overflow-hidden mb-8 glass-premium mesh-bg p-6"
    >
      {/* Aurora Glow Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />

      {/* Top Bar inside Hero - Instant Availability */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2">
            <img src="/logo-new.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white/90 flex items-center gap-2">
              Olá, {firstName} 
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 ${regimeColor} font-black uppercase tracking-tighter`}>
                {regimeName}
              </span>
            </h1>
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-black">
              Seu Cockpit Financeiro
            </p>
          </div>
        </div>
        <UserNav onNavigate={onNavigate} collapsed={true} />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        {/* Main Figure: Net Worth */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">
            <TrendingUp size={12} className="text-indigo-400" />
            Patrimônio Líquido
          </div>
          <div className="relative min-h-[60px]">
            {isLoading ? (
              <div className="h-14 w-48 rounded-2xl skeleton-pulse animate-pulse-akita" />
            ) : (
              <div className="flex items-end gap-3">
                <div className="text-5xl md:text-6xl font-black text-white tracking-[-0.04em] leading-none text-glow-white">
                  {FinancialFormatter.formatCompact(stats.netWorth)}
                </div>
                {monthlyVariation && (
                  <div className={`text-sm font-bold mb-1 ${monthlyVariation.percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {monthlyVariation.percentage >= 0 ? '+' : ''}{monthlyVariation.percentage.toFixed(1)}%
                  </div>
                )}
              </div>
            )}
            
            {probabilisticData.length > 0 && !isLoading && (
              <div className="absolute -bottom-8 left-0 w-48 h-12 opacity-60">
                <ProbabilisticAreaChart data={probabilisticData} h={48} w={192} />
              </div>
            )}
          </div>
        </div>

        {/* Vital Metrics: Survival & Health */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-layer-2 p-4 rounded-3xl space-y-2 cursor-pointer min-h-[100px]"
            onClick={() => onNavigate("health")}
          >
            <div className="flex items-center justify-between">
              <Calendar size={14} className="text-indigo-400" />
              <span className="text-[9px] font-black text-white/30 uppercase">Survival</span>
            </div>
            {isLoading ? (
              <div className="h-6 w-20 rounded-md skeleton-pulse animate-pulse-akita" />
            ) : (
              <div className="text-lg font-bold text-white tabular-nums">
                {survivalLabel}
              </div>
            )}
            <div className="text-[9px] text-white/40 leading-tight">
              Tempo de sobrevivência se toda renda parar.
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-layer-2 p-4 rounded-3xl space-y-2 cursor-pointer min-h-[100px]"
            onClick={() => onNavigate("health")}
          >
            <div className="flex items-center justify-between">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[9px] font-black text-white/30 uppercase">Health</span>
            </div>
            {isLoading ? (
              <div className="h-6 w-12 rounded-md skeleton-pulse animate-pulse-akita" />
            ) : (
              <div className="text-lg font-bold text-white tabular-nums">
                {health.score}<span className="text-white/30">/100</span>
              </div>
            )}
            <div className="text-[9px] text-white/40 leading-tight">
              Score baseado em reserva e dívidas.
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Compass Bottom Right */}
      <div className="absolute bottom-4 right-6 opacity-5 pointer-events-none">
        <Compass size={120} className="opacity-5" />
      </div>

      {/* Sub-footer inside Hero */}
      <div className="mt-12 relative z-10 flex border-t border-white/5 pt-4">
        <div className="flex-1 flex gap-6">
          <div className="space-y-0.5">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Ativos</div>
            {isLoading ? (
              <div className="h-4 w-16 rounded skeleton-pulse animate-pulse-akita" />
            ) : (
              <div className="text-xs font-bold text-emerald-400/90">{FinancialFormatter.formatCurrency(stats.assets)}</div>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Passivos</div>
            {isLoading ? (
              <div className="h-4 w-16 rounded skeleton-pulse animate-pulse-akita" />
            ) : (
              <div className="text-xs font-bold text-rose-400/90">{FinancialFormatter.formatCurrency(stats.liabilities)}</div>
            )}
          </div>
        </div>
        <div className="text-[9px] font-black text-white/20 uppercase self-end">
          {isLoading ? "Sincronizando..." : "Cloud Sync Ativo"}
        </div>
      </div>
    </motion.section>
  );
};
