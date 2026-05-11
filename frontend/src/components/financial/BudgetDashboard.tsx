/**
 * BudgetDashboard.tsx — Hub Central de Orçamento (Wealth OS Edition)
 *
 * Design: Dark Obsidian, igual ao InvestmentsDashboard e EducationSection.
 * Tabs: Visão Geral | Caixa | Recorrentes | Provisões | Calendário
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Repeat, PiggyBank, TrendingUp,
  ChevronRight,
  Wallet, Activity,
} from "lucide-react";
import { useBrasilFinance } from "@/hooks/useBrasilFinance";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { BudgetService } from "@/services/BudgetService";
import { FinancialPulse } from "./FinancialPulse";
import { CashFlowCalendar } from "./CashFlowCalendar";
import { RecurringExpensesDashboard } from "./RecurringExpensesDashboard";
import { ProvisaoView } from "./ProvisaoView";
import { BudgetIntelligence } from "./BudgetIntelligence";
import { CashFlowForecast } from "./CashFlowForecast";
import { FinancialAutopsy } from "./FinancialAutopsy";
import { BudgetScoreHero } from "./dashboard/BudgetScoreHero";
import { BudgetBalanceMetrics } from "./dashboard/BudgetBalanceMetrics";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import type { TabType } from "@/types/navigation";

type BudgetView = "overview" | "cashflow" | "recurring" | "provisoes" | "calendar";

interface BudgetDashboardProps {
  onNavigate?: (tab: TabType) => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };



export const BudgetDashboard = ({ onNavigate }: BudgetDashboardProps) => {
  const [activeView, setActiveView] = useState<BudgetView>("overview");
  const { metrics, financialScore, monthsEmergencyReserve } = useBrasilFinance();
  const personal = useTransactions("personal");
  const { budgets } = useBudgets();

  const score = financialScore.score;
  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

  const savingsRate = metrics.savingsRate;
  const debtRatio = metrics.portfolioValue > 0
    ? (metrics.totalDebt / metrics.portfolioValue) * 100
    : metrics.totalDebt > 0 ? 100 : 0;
  const emergencyMonths = monthsEmergencyReserve;

  const totalIncome = personal.totals?.income ?? 0;
  const totalExpense = personal.totals?.expense ?? 0;
  const balance = totalIncome - totalExpense;

  const navItems: { id: BudgetView; label: string; icon: string }[] = [
    { id: "overview", label: "Visão Geral", icon: "📊" },
    { id: "cashflow", label: "Caixa", icon: "💸" },
    { id: "recurring", label: "Recorrentes", icon: "🔁" },
    { id: "provisoes", label: "Provisões", icon: "🐷" },
    { id: "calendar", label: "Calendário", icon: "📅" },
  ];

  // Sub-views render
  if (activeView === "cashflow") {
    return (
      <div className="space-y-6 pb-12">
        {renderDock(activeView, setActiveView, navItems)}
        <CashFlowCalendar onBack={() => setActiveView("overview")} onNavigate={onNavigate} />
      </div>
    );
  }
  if (activeView === "recurring") {
    return (
      <div className="space-y-6 pb-12">
        {renderDock(activeView, setActiveView, navItems)}
        <RecurringExpensesDashboard />
      </div>
    );
  }
  if (activeView === "provisoes") {
    return (
      <div className="space-y-6 pb-12">
        {renderDock(activeView, setActiveView, navItems)}
        <ProvisaoView onBack={() => setActiveView("overview")} />
      </div>
    );
  }
  if (activeView === "calendar") {
    return (
      <div className="space-y-6 pb-12">
        {renderDock(activeView, setActiveView, navItems)}
        <FinancialPulse />
      </div>
    );
  }

  // ── OVERVIEW HUB ─────────────────────────────────────────────────────────────
  const rta = BudgetService.calculateRTA(totalIncome, budgets);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-12">

      {/* ── HEADER & NAVIGATION ────────────────────────────────────────────────── */}
      <motion.div variants={cardVariant} className="space-y-4">
        <div className="card-obsidian relative overflow-hidden px-6 pt-6 pb-5 border-white/5 bg-white/[0.01]">
          <div className="absolute top-[-60px] left-[-40px] w-56 h-56 bg-blue-600/8 blur-[70px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-40px] right-[-20px] w-40 h-40 bg-indigo-600/6 blur-[50px] rounded-full pointer-events-none" />
          <div className="relative z-20 flex flex-col gap-5">
            {/* Title row */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Wallet size={11} className="text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Finanças</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                    rta === 0
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : rta > 0
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}>
                    <Activity size={11} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {rta === 0
                        ? "Balanço Zero"
                        : rta > 0
                          ? `${FinancialFormatter.formatCurrency(rta)} p/ Alocar`
                          : `${FinancialFormatter.formatCurrency(Math.abs(rta))} em Déficit`}
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                  Minhas <span className="text-blue-400">Finanças</span>
                </h1>
                <p className="text-xs text-white/35 mt-1.5 font-medium">Orçamento · Caixa · Recorrentes · Provisões</p>
              </div>
            </div>
            {/* Dock */}
            <div className="w-full">
              {renderDock(activeView, setActiveView, navItems)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── BENTO GRID ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-fr">
        
        {/* ── SCORE HERO (SPAN 4) ── */}
        <motion.div variants={cardVariant} className="md:col-span-4 h-full">
          <BudgetScoreHero
            score={score}
            scoreColor={scoreColor}
            financialScore={financialScore}
            savingsRate={savingsRate}
            emergencyMonths={emergencyMonths}
            debtRatio={debtRatio}
          />
        </motion.div>

        {/* ── BUDGET INTELLIGENCE (SPAN 2) ── */}
        <motion.div variants={cardVariant} className="md:col-span-2 h-full">
          <div className="card-obsidian h-full p-6 border-white/5 bg-[#0B0F19] flex flex-col">
            <BudgetIntelligence onNavigate={onNavigate} />
          </div>
        </motion.div>

        {/* ── BALANCE METRICS (SPAN 6) ── */}
        <motion.div variants={cardVariant} className="md:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <BudgetBalanceMetrics
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />
        </motion.div>

        {/* ── CASH FLOW FORECAST (FULL WIDTH — Phase 31) ── */}
        <motion.div variants={cardVariant} className="md:col-span-6">
          <CashFlowForecast />
        </motion.div>

        {/* ── FINANCIAL AUTOPSY (FULL WIDTH — Phase 34) ── */}
        <motion.div variants={cardVariant} className="md:col-span-6">
          <FinancialAutopsy />
        </motion.div>

        {/* ── TOOL: CASHFLOW (SPAN 3) ── */}
        <motion.div variants={cardVariant} className="md:col-span-3 h-full">
          <button onClick={() => setActiveView("cashflow")} 
            className="w-full text-left card-obsidian p-6 h-full flex flex-col border-white/5 bg-gradient-to-br from-[#0B0F19] to-[#0A0D14] hover:border-blue-500/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 blur-[40px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500" />
            <div className="relative z-10 w-full">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Wallet size={22} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-white mb-2">Fluxo de Caixa Diário</h3>
              <p className="text-xs text-white/40 leading-relaxed font-medium mb-6 flex-1">Projeção interativa do seu saldo para os próximos 30 dias com base nas rotinas de caixa.</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 group-hover:border-blue-500/20 transition-colors">
                 <span className="text-[10px] font-black text-white/60 font-mono tracking-widest uppercase">Caixa Ativo</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]" />
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── TOOL: RECURRING (SPAN 3) ── */}
        <motion.div variants={cardVariant} className="md:col-span-3 h-full">
          <button onClick={() => setActiveView("recurring")} 
            className="w-full text-left card-obsidian p-6 h-full flex flex-col border-white/5 bg-gradient-to-br from-[#0B0F19] to-[#0A0D14] hover:border-purple-500/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 blur-[40px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-500" />
            <div className="relative z-10 w-full">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Repeat size={22} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
              <h3 className="text-lg font-black text-white mb-2">Economia Recorrente</h3>
              <p className="text-xs text-white/40 leading-relaxed font-medium mb-6 flex-1">Identifique assinaturas e custos fantasmas mensais passíveis de corte imediato.</p>
              
              <div className="flex gap-1.5 mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                 {[0.4, 1, 0.6, 0.3].map((val, i) => (
                    <div key={i} className="w-full bg-purple-500/20 rounded-full h-1 overflow-hidden">
                       <motion.div className="h-full bg-purple-500 rounded-full" initial={{ width: "0%" }} whileInView={{ width: `${val*100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} />
                    </div>
                 ))}
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── TOOL: PROVISOES (SPAN 2) ── */}
        <motion.div variants={cardVariant} className="md:col-span-2 h-full">
          <button onClick={() => setActiveView("provisoes")} 
            className="w-full text-left card-obsidian p-6 h-full flex flex-col border-white/5 bg-gradient-to-br from-[#0B0F19] to-[#0A0D14] hover:border-emerald-500/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-600/10 blur-[30px] pointer-events-none group-hover:bg-emerald-600/20 transition-all duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                  <PiggyBank size={18} />
                </div>
                <h3 className="text-base font-bold text-white">Provisões Anuais</h3>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed font-medium mt-auto">Planeje despesas sazonais (IPVA, Seguros) como um negócio estruturado.</p>
            </div>
          </button>
        </motion.div>

        {/* ── TOOL: PULSE (SPAN 2) ── */}
        <motion.div variants={cardVariant} className="md:col-span-2 h-full">
          <button onClick={() => setActiveView("calendar")} 
            className="w-full text-left card-obsidian p-6 h-full flex flex-col border-white/5 bg-gradient-to-br from-[#0B0F19] to-[#0A0D14] hover:border-amber-500/30 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-600/10 blur-[30px] pointer-events-none group-hover:bg-amber-600/20 transition-all duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-500">
                  <Activity size={18} />
                </div>
                <h3 className="text-base font-bold text-white">Central de Pulso</h3>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed font-medium mt-auto">Métricas detalhadas e calendário denso de obrigações de caixa.</p>
            </div>
          </button>
        </motion.div>

        {/* ── TOOL: PLANNING (SPAN 2) ── */}
        <motion.div variants={cardVariant} className="md:col-span-2 h-full">
          <button onClick={() => onNavigate?.("planning")} 
            className="w-full text-left card-obsidian p-6 h-full flex flex-col border-white/5 bg-[#0C1222] hover:bg-[#10182C] border-dashed transition-all duration-300 group overflow-hidden relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600/10 blur-[30px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp size={18} />
                </div>
                <h3 className="text-base font-bold text-white">Plano 10 Anos</h3>
              </div>
              <p className="text-[11px] text-blue-200/50 leading-relaxed font-medium mt-auto">Escale seu patrimônio vinculando rotina atual aos grandes objetivos.</p>
            </div>
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
};

// ── Reusable dock renderer ────────────────────────────────────────────────────
function renderDock(
  active: BudgetView,
  setActive: (v: BudgetView) => void,
  items: { id: BudgetView; label: string; icon: string }[]
) {
  return (
    <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/10 overflow-x-auto gap-2">
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => setActive(n.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
            active === n.id
              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              : "text-neutral-500 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>{n.icon}</span>
          {n.label}
        </button>
      ))}
    </div>
  );
}
