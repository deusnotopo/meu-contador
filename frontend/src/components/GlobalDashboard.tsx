import React from "react";
import { motion } from "framer-motion";
import { SuperHeroDashboard } from "./dashboard/SuperHeroDashboard";
import { ActionSection } from "./dashboard/ActionSection";
import { InsightsSection } from "./dashboard/InsightsSection";
import { SetupJourneyWidget } from "./dashboard/SetupJourneyWidget";
import { OpenFinanceWidget } from "./dashboard/OpenFinanceWidget";
import { SyncDashboard } from "./dashboard/SyncDashboard";
import { DashboardErrorBoundary } from "./dashboard/DashboardErrorBoundary";
import { RegimeWidget } from "./dashboard/RegimeWidget";
import { CausalAnalyzerWidget } from "./dashboard/CausalAnalyzerWidget";
import { useWealthStats } from "@/hooks/dashboard/useWealthStats";
import { useReminders } from "@/hooks/useReminders";
import { useIntelligence } from "@/hooks/useIntelligence";

import type { TabType } from "@/types/navigation";

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
};

// ─── Main Component: The Orchestrator ──────────────────────────────────────────
export const GlobalDashboard: React.FC<{ onNavigate: (tab: TabType) => void }> = ({
  onNavigate,
}) => {
  // AKITA MODE: Única fonte da verdade para o Dashboard
  const { stats: localStats, health: localHealth, sparklineData, monthlyVariation, allTransactions, isLoading: statsLoading } = useWealthStats();
  const { intelligence: financial, loading: intelligenceLoading } = useIntelligence();
  const remindersCtx = useReminders();
  
  const isLoading = statsLoading || remindersCtx.isLoading || intelligenceLoading;

  // Priorizamos os dados da Inteligência (Backend) quando disponíveis, 
  // caindo para o Mock/Local apenas se falhar.
  const stats = financial ? {
    netWorth: financial.netWorth,
    assets: financial.assets,
    liabilities: financial.liabilities,
    income: localStats.income, // Mantemos local para fluxo imediato de criação
    expense: localStats.expense,
  } : localStats;

  const health = financial ? {
    ...localHealth,
    dailyBurnRate: financial.monthlyAvgExpenses / 30,
  } : localHealth;

  // O estado vazio agora é determinado pelos ativos e balanço histórico vindo do backend
  const isEmpty = !isLoading && stats.netWorth === 0 && stats.income === 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-32 pt-2 px-3"
    >
      {/* ── 1. EXPERIÊNCIA IMERSIVA (HERO) ────── */}
      <DashboardErrorBoundary title="Cockpit Principal">
        <SuperHeroDashboard 
          onNavigate={onNavigate} 
          stats={stats}
          health={health}
          intelligence={financial}
          sparklineData={sparklineData}
          monthlyVariation={monthlyVariation}
          isLoading={isLoading}
        />
      </DashboardErrorBoundary>

      <div className="space-y-8">
        {isEmpty ? (
          <motion.div variants={sectionVariants} className="flex flex-col gap-6">
            <SetupJourneyWidget onNavigate={onNavigate} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DashboardErrorBoundary title="Open Finance Native">
                <OpenFinanceWidget onNavigate={onNavigate} />
              </DashboardErrorBoundary>
              <DashboardErrorBoundary title="Sincronização">
                <SyncDashboard />
              </DashboardErrorBoundary>
            </div>

            <div className="rounded-[32px] p-8 border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center text-center">
              <div className="text-3xl mb-4 opacity-50">🧭</div>
              <h3 className="text-lg font-bold text-white/80">O mapa está em branco</h3>
              <p className="text-sm text-white/40 max-w-xs mt-2">
                Conecte um banco ou lance sua primeira transação para ativar os motores cognitivos.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* ── 2. SEÇÃO DE REAÇÃO (O "AGORA") ────── */}
            <motion.section variants={sectionVariants} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Sobrevivência & Caixa
                </h2>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>
              
              <DashboardErrorBoundary title="Ações e Alertas">
                <ActionSection onNavigate={onNavigate} remindersCtx={remindersCtx} />
              </DashboardErrorBoundary>

              <DashboardErrorBoundary title="Fluxo e Insights">
                <InsightsSection 
                  onNavigate={onNavigate} 
                  stats={stats}
                  health={health}
                  allTransactions={allTransactions}
                  intelligence={financial}
                  isLoading={isLoading}
                />
              </DashboardErrorBoundary>
            </motion.section>

            {/* ── 3. SEÇÃO COGNITIVA (O "PORQUÊ") ────── */}
            <motion.section variants={sectionVariants} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Motor de Inteligência
                </h2>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>

              <DashboardErrorBoundary title="Motor Cognitivo">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <RegimeWidget regime={financial?.regime} isLoading={isLoading} />
                  <CausalAnalyzerWidget />
                </div>
              </DashboardErrorBoundary>
            </motion.section>

            {/* ── 4. SEÇÃO DE CONECTIVIDADE (O "COMO") ────── */}
            <motion.section variants={sectionVariants} className="space-y-4">
               <div className="flex items-center gap-2 px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Infraestrutura & Sync
                </h2>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <DashboardErrorBoundary title="Open Finance">
                  <OpenFinanceWidget onNavigate={onNavigate} />
                </DashboardErrorBoundary>

                <DashboardErrorBoundary title="Sincronização">
                  <SyncDashboard />
                </DashboardErrorBoundary>
              </div>
            </motion.section>

            {/* Onboarding Journey — auto-hidden when all missions complete */}
            <DashboardErrorBoundary title="Setup Journey">
              <SetupJourneyWidget onNavigate={onNavigate} />
            </DashboardErrorBoundary>
          </>
        )}
      </div>
    </motion.div>
  );
};
