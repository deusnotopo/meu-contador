import React from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { WealthOverview } from "./dashboard/WealthOverview";
import { ActionSection } from "./dashboard/ActionSection";
import { InsightsSection } from "./dashboard/InsightsSection";
import { SetupJourneyWidget } from "./dashboard/SetupJourneyWidget";
import { OpenFinanceWidget } from "./dashboard/OpenFinanceWidget";
import { SyncDashboard } from "./dashboard/SyncDashboard";
import { DashboardErrorBoundary } from "./dashboard/DashboardErrorBoundary";
import { NoDataEmpty } from "@/components/ui/empty-state";
import { useTransactions } from "@/hooks/useTransactions";

import type { TabType } from "@/types/navigation";

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

// ─── Main Component: The Orchestrator ──────────────────────────────────────────
export const GlobalDashboard: React.FC<{ onNavigate: (tab: TabType) => void }> = ({
  onNavigate,
}) => {
  const { transactions, isLoading } = useTransactions("personal");
  const isEmpty = !isLoading && transactions.length === 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-28 pt-1"
    >
      {/* ── 0. STICKY GLASS HEADER ────── */}
      <DashboardErrorBoundary title="Cabeçalho">
        <DashboardHeader onNavigate={onNavigate} />
      </DashboardErrorBoundary>

      <div className="px-3 space-y-6">
        {isEmpty ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            <SetupJourneyWidget onNavigate={onNavigate} />
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
              <NoDataEmpty />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <OpenFinanceWidget onNavigate={onNavigate} />
              <SyncDashboard />
            </div>
          </motion.div>
        ) : (
          <>
            {/* ── 1. SISTEMA 1: REAÇÃO E ALERTA ────── */}
            <DashboardErrorBoundary title="Ações e Alertas">
              <ActionSection onNavigate={onNavigate} />
            </DashboardErrorBoundary>

            {/* ── 2. VISÃO GLOBAL: PATRIMÔNIO ────────── */}
            <DashboardErrorBoundary title="Visão Patrimonial">
              <WealthOverview />
            </DashboardErrorBoundary>

            {/* ── 3. SISTEMA 2: ANÁLISE E DELIBERAÇÃO ─────────────── */}
            <DashboardErrorBoundary title="Insights e Gastos">
              <InsightsSection onNavigate={onNavigate} />
            </DashboardErrorBoundary>

            {/* ── 4. CONECTIVIDADE E INFRA ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <DashboardErrorBoundary title="Open Finance">
                <OpenFinanceWidget onNavigate={onNavigate} />
              </DashboardErrorBoundary>
              
              <DashboardErrorBoundary title="Sincronização">
                <SyncDashboard />
              </DashboardErrorBoundary>
            </div>

            {/* Onboarding Journey */}
            <DashboardErrorBoundary title="Setup Journey">
              <SetupJourneyWidget onNavigate={onNavigate} />
            </DashboardErrorBoundary>
          </>
        )}
      </div>
    </motion.div>
  );
};

