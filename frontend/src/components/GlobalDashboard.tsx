import React from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useGoals } from "@/hooks/useGoals";
import { SmartInsights } from "@/components/personal/SmartInsights";
import { useAuth } from "@/context/AuthContext";
import { useFinancialScore } from "@/hooks/useFinancialScore";
import { useReminders } from "@/hooks/useReminders";
import { formatShortDate } from "@/lib/formatters";
import { useTour } from "@/hooks/useTour";
import { useGamification } from "@/hooks/useGamification";
import { ChevronRight, Trophy } from "lucide-react";
import type { TabType } from "@/types/navigation";
import type { AuthUser } from "@/context/AuthContext";
import { motion } from "framer-motion";

// Sub-components
import { HeroPatrimonio } from "./dashboard/HeroPatrimonio";
import { FluxoMensal } from "./dashboard/FluxoMensal";
import { RecentTransactions } from "./dashboard/RecentTransactions";
import { TermometroDoMes } from "./dashboard/TermometroDoMes";
import { OpenBillsWidget } from "./dashboard/OpenBillsWidget";
import { SetupJourneyWidget, type SetupMission } from "./dashboard/SetupJourneyWidget";
import { CategorySpendingWidget } from "./dashboard/CategorySpendingWidget";
import { TaxAuditorWidget } from "./dashboard/TaxAuditorWidget";
import { DailySpendingWidget } from "./dashboard/DailySpendingWidget";
import { UserNav } from "./layout/UserNav";
import { OpenFinanceWidget } from "./dashboard/OpenFinanceWidget";

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 130, damping: 18 },
  },
};

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt = (n: number) => "R$\u00a0" + Math.round(Math.abs(n)).toLocaleString("pt-BR");
const fmtM = (n: number) =>
  Math.abs(n) >= 1e6
    ? (n < 0 ? "-R$\u00a0" : "R$\u00a0") + (Math.abs(n) / 1e6).toFixed(2).replace(".", ",") + " M"
    : fmt(n);

// Emoji icons for transaction categories (used in RecentTransactions)
const EMOJI_MAP: Record<string, string> = {
  moradia: "🏠", mercado: "🛒", delivery: "🍕", transporte: "🚗",
  "saúde": "💊", "salário": "💰", lazer: "🎮", "educação": "📚",
  vestuário: "👕", assinaturas: "📱",
};
const getEmoji = (cat: string) => EMOJI_MAP[cat.toLowerCase()] ?? "💸";




// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const GlobalDashboard = ({ onNavigate }: { onNavigate?: (tab: TabType) => void }) => {
  const personal = useTransactions("personal");
  const { user } = useAuth();

  // Only fetch business transactions for PJ users
  const isBusinessUser = user?.employmentType === "pj";
  const business = useTransactions(isBusinessUser ? "business" : "personal");

  const { totals: investTotals, assets, error: investError } = useInvestments();
  const { totals: debtTotals, debts, error: debtError } = useDebts();
  const { goals } = useGoals();
  const { startTour } = useTour();
  const { level } = useGamification();

  // ── Single useReminders lifted to top — shared between OpenBillsWidget & SmartInsights ──
  const remindersCtx = useReminders();

  React.useEffect(() => {
    startTour("dashboard");
  }, [startTour]);

  const dashboardUser = user as (AuthUser & { username?: string }) | null;
  const firstName =
    dashboardUser?.name?.split(" ")[0] ||
    dashboardUser?.username?.split(" ")[0] ||
    "Você";

  // ── Granular error flags ──
  const personalError = !!personal.error;
  const investErrorFlag = !!investError;
  const debtErrorFlag = !!debtError;
  const anyError = personalError || investErrorFlag || debtErrorFlag;

  const totalBankBalance = isBusinessUser
    ? personal.totals.balance + business.totals.balance
    : personal.totals.balance;
  const bankAssets = totalBankBalance > 0 ? totalBankBalance : 0;
  const bankLiabilities = totalBankBalance < 0 ? Math.abs(totalBankBalance) : 0;

  const globalTotals = React.useMemo(() => ({
    income: isBusinessUser
      ? personal.totals.income + business.totals.income
      : personal.totals.income,
    expense: isBusinessUser
      ? personal.totals.expense + business.totals.expense
      : personal.totals.expense,
    balance: totalBankBalance,
    netWorth: bankAssets + investTotals.currentValue - (debtTotals.totalBalance + bankLiabilities),
    assets: bankAssets + investTotals.currentValue,
    liabilities: debtTotals.totalBalance + bankLiabilities,
  }), [personal.totals, business.totals, investTotals, debtTotals, isBusinessUser, totalBankBalance, bankAssets, bankLiabilities]);

  // ── Date/time ──
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1).replace(".", "");
  const monthName = today.toLocaleDateString("pt-BR", { month: "long" });
  const hour = today.getHours();
  const greeting = hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";

  // ── Memoized computations ──
  const barData = React.useMemo(
    () => (personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map((d) => d.despesas) : []),
    [personal.monthlyTrend]
  );
  const barColors = React.useMemo(
    () => barData.map((_, i) => (i === barData.length - 1 ? "rgba(74,139,255,1)" : "rgba(74,139,255,0.55)")),
    [barData]
  );
  const months = React.useMemo(
    () =>
      personal.monthlyTrend.length > 0
        ? personal.monthlyTrend.map((d) =>
            new Date(`${d.month}-01T00:00:00Z`)
              .toLocaleDateString("pt-BR", { month: "short" })
              .replace(".", "")
          )
        : [],
    [personal.monthlyTrend]
  );
  const sparklineData = React.useMemo(
    () => (personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map((d) => d.receitas - d.despesas) : []),
    [personal.monthlyTrend]
  );
  const savingRate =
    globalTotals.income > 0 ? (globalTotals.balance / globalTotals.income) * 100 : 0;

  const recentPurchases = React.useMemo(
    () =>
      personal.allTransactions.slice(0, 5).map((tx) => ({
        id: tx.id,
        ico: getEmoji(tx.category),
        ti: tx.description,
        cat: `${tx.category} · ${formatShortDate(tx.date)}`,
        am: tx.type === "expense" ? -tx.amount : tx.amount,
      })),
    [personal.allTransactions]
  );

  const monthlyVariation = React.useMemo(() => {
    if (personal.monthlyTrend.length < 2) return { amount: 0, percentage: 0 };
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1]!;
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2]!;
    const variation = (current.receitas - current.despesas) - (previous.receitas - previous.despesas);
    const percentage = previous.receitas > 0 ? (variation / previous.receitas) * 100 : 0;
    return { amount: variation, percentage };
  }, [personal.monthlyTrend]);

  const categorySpending = React.useMemo(() => {
    const cats: Record<string, number> = {};
    personal.allTransactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        cats[tx.category] = (cats[tx.category] ?? 0) + tx.amount;
      });
    return Object.entries(cats)
      .map(([name, spent]) => ({ name, spent }))
      .sort((a, b) => b.spent - a.spent);
  }, [personal.allTransactions]);

  const behavioralAlert = React.useMemo(() => {
    if (personal.monthlyTrend.length < 2) return null;
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1]!;
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2]!;
    if (current.despesas > previous.despesas * 1.1) {
      const increase = ((current.despesas - previous.despesas) / previous.despesas) * 100;
      const wasted = current.despesas - previous.despesas;
      return `Você gastou ${increase.toFixed(0)}% a mais este mês — equivale a R$ ${Math.round(wasted)} se investido por 10 anos.`;
    }
    return null;
  }, [personal.monthlyTrend]);

  const { score: healthScore, tooltip: healthScoreTooltip, sustainableDaily, estimatedTax } =
    useFinancialScore(globalTotals, user ? {
      employmentType: user.employmentType,
      dependents: user.dependents,
      monthlyIncome: user.monthlyIncome,
      hasEmergencyFund: user.hasEmergencyFund,
    } : null);

  const monthlyRevenue = user?.monthlyIncome ?? globalTotals.income;

  // ── Setup missions ──
  const setupMissions: SetupMission[] = [
    { id: "debts", emoji: "💳", label: "Mapeie suas dívidas", sub: "Habilita a Rota de Saída Avalanche", xp: 150, done: debts.length > 0, tab: "debt_payoff" as TabType },
    { id: "investments", emoji: "📈", label: "Adicione seus investimentos", sub: "Ativa o Painel de Carteira", xp: 200, done: assets.length > 0, tab: "investments" as TabType },
    { id: "goals", emoji: "🎯", label: "Defina uma meta financeira", sub: "Ativa o Termômetro de Metas", xp: 100, done: goals.length > 0, tab: "planning" as TabType },
    { id: "fire", emoji: "🔥", label: "Configure sua aposentadoria", sub: "Ativa o Simulador FIRE", xp: 250, done: !!(user?.retirementAge), tab: "retirement" as TabType },
    { id: "pj", emoji: "🏢", label: "Configure sua empresa PJ", sub: "Separa finanças pessoal / empresa", xp: 150, done: !!(user?.businessCnpj), tab: "profile" as TabType, hide: user?.employmentType !== "pj" },
    { id: "academy", emoji: "🎓", label: "Complete uma aula em Aprender", sub: "Desbloqueia conquistas de aprendizado", xp: 100, done: false, tab: "education" as TabType },
  ].filter((m) => !m.hide) as SetupMission[];

  const setupPct = Math.round((setupMissions.filter((m) => m.done).length / setupMissions.length) * 100);
  const showSetupWidget = setupPct < 100;

  return (
    <motion.div
      className="pt-1 pb-8"
      id="dashboard-overview"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Floating Header ───────────────────────────────── */}
      <motion.header
        variants={itemVariants}
        role="banner"
        className="flex justify-between items-center gap-2 mb-4 sticky top-2 z-[60] bg-[#030712]/90 backdrop-blur-2xl px-3 py-2.5 rounded-[24px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] mx-1"
      >
        {/* Left: logo + greeting */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center overflow-hidden flex-shrink-0" aria-hidden>
            <img src="/logo-new.png" alt="" className="w-full h-full object-contain p-1" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] truncate" style={{ color: "var(--t3)" }}>
              {capitalizedDate}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="text-[16px] font-bold truncate leading-tight text-[var(--t1)] tracking-[-0.3px]"
              >
                {greeting}, {firstName}
              </div>
              <button
                onClick={() => onNavigate?.("mastery")}
                aria-label={`Nível ${level.level} — Ver maestria e conquistas`}
                className="flex-shrink-0 flex items-center gap-1 bg-white/5 border border-white/[0.08] px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
                <span className="text-[9px] font-black text-emerald-400 tracking-wider whitespace-nowrap">
                  NVL {level.level}
                </span>
              </button>
              {anyError && user && (
                <div
                  className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  title="Erro ao carregar alguns dados"
                  aria-label="Erro ao carregar dados"
                  role="status"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 flex-shrink-0 bg-white/[0.02] border border-white/[0.05] p-1 rounded-2xl" role="toolbar" aria-label="Ações rápidas">
          <button
            onClick={() => onNavigate?.("mastery")}
            aria-label="Conquistas e Maestria"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/[0.06] active:scale-95"
          >
            <Trophy size={15} className="text-amber-500 opacity-90" aria-hidden />
          </button>
          <button
            onClick={() => onNavigate?.("notifications")}
            aria-label="Notificações"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/[0.06] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          <div className="w-px h-4 bg-white/10" aria-hidden />
          <UserNav onNavigate={onNavigate} collapsed={true} />
        </div>
      </motion.header>

      {/* ── Main Bento Grid ───────────────────────────────── */}
      <div className="px-2 sm:px-3 space-y-3">

        {/* ── 1. HERO PATRIMÔNIO (full width) ──────────────────── */}
        <motion.div variants={itemVariants} className="bento-card bento-full !p-0">
          <HeroPatrimonio
            netWorth={globalTotals.netWorth}
            assets={globalTotals.assets}
            liabilities={globalTotals.liabilities}
            healthScore={healthScore}
            healthScoreTooltip={healthScoreTooltip}
            monthlyVariation={monthlyVariation}
            sparklineData={sparklineData}
            onNavigate={onNavigate}
            fmtM={fmtM}
            fmt={fmt}
          />
        </motion.div>

        {/* ── 2. TERMÔMETRO + FLUXO MENSAL (2 cols) ─────────── */}
        {(globalTotals.income > 0 || globalTotals.expense > 0) && (
          <motion.div variants={itemVariants} className="bento-grid">
            <div className="bento-card">
              <TermometroDoMes
                income={globalTotals.income}
                expense={globalTotals.expense}
                balance={globalTotals.balance}
                onNavigate={onNavigate}
              />
            </div>
            <div className="bento-card p-5">
              <FluxoMensal
                monthName={monthName}
                income={globalTotals.income}
                expense={globalTotals.expense}
                balance={globalTotals.balance}
                savingRate={savingRate}
                barData={barData}
                barColors={barColors}
                months={months}
                onNavigate={onNavigate}
                fmt={fmt}
                error={personalError}
              />
            </div>
          </motion.div>
        )}

        {/* ── 3. TRANSAÇÕES RECENTES + CATEGORIAS (2 cols) ─── */}
        <motion.div variants={itemVariants} className="bento-grid">
          <div className="bento-card p-5">
            <RecentTransactions
              transactions={recentPurchases}
              onNavigate={onNavigate}
              fmt={fmt}
              error={personalError}
            />
          </div>
          <div className="bento-card p-5">
            <CategorySpendingWidget
              categories={categorySpending}
              hasError={personalError}
              onNavigate={onNavigate}
            />
          </div>
        </motion.div>

        {/* ── 4. CONTAS EM ABERTO (full width) ─────────────── */}
        <motion.div variants={itemVariants}>
          <OpenBillsWidget remindersCtx={remindersCtx} onNavigate={onNavigate} />
        </motion.div>

        {/* ── 4b. OPEN FINANCE BANKING CONNECTIONS ────────── */}
        <motion.div variants={itemVariants}>
          <OpenFinanceWidget onNavigate={onNavigate} />
        </motion.div>

        {/* ── 5. TAX + DAILY SPENDING (smart span) ──────────── */}
        {(estimatedTax > 0 || sustainableDaily > 0) && (() => {
          const taxOnly = estimatedTax > 0 && sustainableDaily <= 0;
          const dailyOnly = sustainableDaily > 0 && estimatedTax <= 0;
          const bothExist = estimatedTax > 0 && sustainableDaily > 0;
          return bothExist ? (
            <motion.div variants={itemVariants} className="bento-grid">
              <TaxAuditorWidget
                estimatedTax={estimatedTax}
                monthlyRevenue={monthlyRevenue}
                employmentType={user?.employmentType}
                dependents={user?.dependents}
                fmt={fmt}
              />
              <DailySpendingWidget sustainableDaily={sustainableDaily} fmt={fmt} />
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              {taxOnly && (
                <TaxAuditorWidget
                  estimatedTax={estimatedTax}
                  monthlyRevenue={monthlyRevenue}
                  employmentType={user?.employmentType}
                  dependents={user?.dependents}
                  fmt={fmt}
                />
              )}
              {dailyOnly && (
                <DailySpendingWidget sustainableDaily={sustainableDaily} fmt={fmt} />
              )}
            </motion.div>
          );
        })()}

        {/* ── 6. ALERTA COMPORTAMENTAL (full width, condicional) */}
        {behavioralAlert && (
          <motion.div variants={itemVariants}>
            <button
              type="button"
              aria-label={`Alerta comportamental: ${behavioralAlert}. Abrir planejamento.`}
              className="bento-card bento-full cursor-pointer hover:bg-white/[0.06] active:scale-[0.98] text-left w-full bg-amber-500/[0.06] border-amber-500/20"
              onClick={() => onNavigate?.("planning")}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5" aria-hidden>⚠️</span>
                <div>
                  <div className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: "var(--amber)" }}>
                    Alerta Comportamental
                  </div>
                  <div className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--t1)" }}>
                    {behavioralAlert}
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* ── 7. FIRE BANNER (full width) ───────────────────────────── */}
        <motion.div variants={itemVariants}>
          <button
            type="button"
            aria-label="Abrir simulador de aposentadoria FIRE"
            className="bento-card bento-full cursor-pointer hover:bg-white/[0.06] active:scale-[0.98] text-left w-full focus-visible:ring-2 focus-visible:ring-emerald-500/70 bg-[linear-gradient(135deg,rgba(0,217,145,0.08),rgba(0,217,145,0.02))] border-emerald-500/20"
            onClick={() => onNavigate?.("retirement")}
          >
            <div className="flex gap-3 items-center">
              <span className="text-[26px]" aria-hidden>🎯</span>
              <div className="flex-1">
                <div className="text-[11px] font-bold mb-0.5 tracking-widest uppercase" style={{ color: "var(--green)" }}>
                  Simulador FIRE
                </div>
                <div className="text-[13px] leading-snug font-medium" style={{ color: "var(--t1)" }}>
                  Descubra quando você poderá se aposentar.
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0" aria-hidden>
                <ChevronRight size={16} className="text-emerald-400" />
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── 8. SMART INSIGHTS IA (full width, só com dados) ── */}
        {personal.allTransactions.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bento-card bento-full p-5 shadow-[0_0_40px_rgba(155,127,255,0.06)] border-[#9B7FFF]/20"
          >
            <div className="text-[10px] uppercase tracking-widest font-bold mb-4 text-[var(--purple)]">
              Insights Inteligentes
            </div>
            <SmartInsights
              transactions={personal.allTransactions}
              goals={goals}
              onNavigate={onNavigate}
              remindersCtx={remindersCtx}
            />
          </motion.div>
        )}

        {/* ── 9. SETUP JOURNEY (full width, condicional) ────── */}
        {showSetupWidget && (
          <motion.div variants={itemVariants}>
            <SetupJourneyWidget missions={setupMissions} onNavigate={onNavigate} />
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};