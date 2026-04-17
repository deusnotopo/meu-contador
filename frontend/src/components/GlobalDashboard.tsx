import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { generateWealthSnapshot } from "@/lib/pdf-export";
import { showSuccess } from "@/lib/toast";

// Context & Hooks
import { useDashboardData } from "@/hooks/useDashboardData";

// Modular UI Components
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { WealthOverview } from "./dashboard/WealthOverview";
import { ActionSection } from "./dashboard/ActionSection";
import { InsightsSection } from "./dashboard/InsightsSection";
import { SetupJourneyWidget } from "./dashboard/SetupJourneyWidget";
import { OpenFinanceWidget } from "./dashboard/OpenFinanceWidget";
import { SyncDashboard } from "./dashboard/SyncDashboard";

// Types
import type { TabType } from "@/types/navigation";

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "R$\u00a0" + Math.round(Math.abs(n)).toLocaleString("pt-BR");
const fmtM = (n: number) =>
  Math.abs(n) >= 1e6
    ? (n < 0 ? "-R$\u00a0" : "R$\u00a0") +
      (Math.abs(n) / 1e6).toFixed(2).replace(".", ",") +
      " M"
    : fmt(n);

// ─── Skeleton ───────────────────────────────────────────────────────────────
const GlobalDashboardSkeleton = () => {
  return (
    <div className="pt-1 pb-8 px-2 sm:px-3 space-y-3">
      <div className="flex justify-between items-center gap-2 mb-4 px-3 py-2.5 mx-1">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="flex flex-col gap-1">
            <Skeleton className="w-16 h-2 rounded-full" />
            <Skeleton className="w-32 h-4 rounded-full" />
          </div>
        </div>
      </div>
      <div className="px-3 grid grid-cols-1 md:grid-cols-6 gap-3">
        <Skeleton className="md:col-span-4 h-[220px] rounded-[32px]" />
        <Skeleton className="md:col-span-2 h-[220px] rounded-[32px]" />
      </div>
    </div>
  );
};

// ─── Main Component: The Orchestrator ──────────────────────────────────────────
export const GlobalDashboard: React.FC<{ onNavigate: (tab: TabType) => void }> = ({
  onNavigate,
}) => {
  // ─── 1. Aggregator Logic ───────────────────────
  const {
    user,
    personal,
    globalTotals,
    healthScore,
    healthScoreTooltip,
    scoreReliability,
    scoreSourceLabel,
    recentPurchases,
    categorySpending,
    monthlyVariation,
    sparklineData,
    setupMissions,
    remindersCtx,
    level,
    streaks,
    gamLoading,
    loading,
    monthlyRevenue,
    onNavigate: navigateToTab,
  } = useDashboardData(onNavigate);

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
    if (!user) return;
    try {
      await generateWealthSnapshot(user, {
        netWorth: globalTotals.netWorth,
        assets: globalTotals.assets,
        liabilities: globalTotals.liabilities,
        healthScore,
      });
      showSuccess("Snapshot gerado com sucesso!");
    } catch (e) {
      console.error(e);
    }
  };

  const showSetupWidget = setupMissions.some((m) => !m.done);

  if (loading) return <GlobalDashboardSkeleton />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-28 pt-1"
    >
      {/* ── 0. STICKY GLASS HEADER ────── */}
      <DashboardHeader
        firstName={firstName}
        capitalizedDate={capitalizedDate}
        greeting={greeting}
        level={level}
        streaks={streaks}
        gamLoading={gamLoading}
        onNavigate={onNavigate}
        onExport={handleWealthSnapshot}
      />

      <div className="px-3 space-y-6">
        {/* ── 1. SISTEMA 1: REAÇÃO E ALERTA ────── */}
        <ActionSection remindersCtx={remindersCtx} onNavigate={onNavigate} />

        {/* ── 2. VISÃO GLOBAL: PATRIMÔNIO ────────── */}
        <WealthOverview
          globalTotals={globalTotals}
          healthScore={healthScore}
          healthScoreTooltip={healthScoreTooltip}
          scoreReliability={scoreReliability}
          scoreSourceLabel={scoreSourceLabel}
          monthlyVariation={monthlyVariation}
          sparklineData={sparklineData}
          fmtM={fmtM}
          fmt={fmt}
        />

        {/* ── 3. SISTEMA 2: ANÁLISE E DELIBERAÇÃO ─────────────── */}
        <InsightsSection
          globalTotals={globalTotals}
          sustainableDaily={0} // Can be optimized in hook if needed
          estimatedTax={0} // Can be optimized in hook if needed
          monthlyRevenue={monthlyRevenue}
          categorySpending={categorySpending}
          recentPurchases={recentPurchases}
          personalError={personal.error}
          onNavigate={onNavigate}
          fmt={fmt}
        />

        {/* ── 4. CONECTIVIDADE E INFRA ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <OpenFinanceWidget onNavigate={onNavigate} />
          <SyncDashboard />
        </div>

        {/* Onboarding Journey */}
        {showSetupWidget && (
          <SetupJourneyWidget missions={setupMissions} onNavigate={onNavigate} />
        )}
      </div>
    </motion.div>
  );
};
