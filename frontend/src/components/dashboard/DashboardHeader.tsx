import React from "react";
import { motion } from "framer-motion";
import { FileDown, Trophy, Flame } from "lucide-react";
import { UserNav } from "../layout/UserNav";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { showSuccess, showError } from "@/lib/toast";
import { generateWealthSnapshot } from "@/lib/pdf-export";
import { useWealthStats } from "@/hooks/dashboard/useWealthStats";
import { logger } from "@/lib/logger";
import { Skeleton } from "@/components/ui/skeleton";
import type { TabType } from "@/types/navigation";

interface DashboardHeaderProps {
  onNavigate?: (tab: TabType) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 130, damping: 18 },
  },
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const { level, streaks, isLoading: gamLoading } = useGamification();
  const { stats, health, isLoading: statsLoading } = useWealthStats();

  const firstName = user?.displayName?.split(" ")[0] || "Usuário";
  const capitalizedDate = new Date()
    .toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })
    .replace("-feira", "")
    .replace(".", "");

  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Bom dia";
    if (hr < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const handleWealthSnapshot = async () => {
    if (!user || statsLoading) return;
    try {
      const surplus = stats.income - stats.expense;
      await generateWealthSnapshot({
        userName: firstName,
        netWorth: stats.netWorth,
        totalInvested: stats.assets,
        totalDebt: stats.liabilities,
        monthlyIncome: stats.income,
        monthlyExpenses: stats.expense,
        monthlySurplus: surplus,
        fireProgress: 0, // TODO: wire up FIRE module
        yearsToFire: 0,  // TODO: wire up FIRE module
        wealthSurvivalDays: health.sustainableDaily > 0
          ? Math.round(stats.netWorth / health.sustainableDaily)
          : 0,
        topCategories: [],
        goals: [],
        optimizationTips: [],
      });
      showSuccess("Snapshot gerado com sucesso!");
    } catch (e) {
      logger.error("DashboardHeader.handleWealthSnapshot", e);
      showError("Não foi possível gerar o snapshot.");
    }
  };

  return (
    <motion.header
      variants={itemVariants}
      className="flex justify-between items-center gap-2 mb-6 sticky top-2 z-[60] bg-[#030712]/80 backdrop-blur-2xl px-4 py-3 rounded-[32px] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] mx-2"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] flex-shrink-0">
          <div className="w-full h-full rounded-2xl bg-[#030712] flex items-center justify-center p-1.5">
            <img
              src="/logo-new.png"
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">
            {capitalizedDate}
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--t1)] truncate">
            {greeting}, {firstName}
          </h1>
          {!gamLoading ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <Trophy size={10} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400">
                  Nível {level.level}
                </span>
              </div>
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{
                    width: `${(level.currentXp / level.xpToNextLevel) * 100}%`,
                  }}
                />
              </div>
              {((streaks as Record<string, { current?: number }>).login?.current ?? 0) > 0 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20">
                  <Flame size={10} className="text-orange-400" />
                  <span className="text-[10px] font-bold text-orange-400">
                    {(streaks as Record<string, { current?: number }>).login?.current}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
               <Skeleton className="w-24 h-4 rounded-full" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleWealthSnapshot}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
        >
          <FileDown size={18} className="text-amber-400 opacity-90" />
        </button>
        <UserNav onNavigate={onNavigate} collapsed={true} />
      </div>
    </motion.header>
  );
};

