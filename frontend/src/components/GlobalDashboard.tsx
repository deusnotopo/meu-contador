import React from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useGoals } from "@/hooks/useGoals";
import { SmartInsights } from "@/components/personal/SmartInsights";
import { useAuth } from "@/context/AuthContext";
import { useFinancialScore } from "@/hooks/useFinancialScore";
import { formatShortDate } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTour } from "@/hooks/useTour";
import { useGamification } from "@/hooks/useGamification";
import { AlertCircle, BarChart3 as ChartBarIcon, Trophy } from "lucide-react";
import type { TabType } from "@/types/navigation";
import type { AuthUser } from "@/context/AuthContext";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
};

// Sub-components
import { HeroPatrimonio } from "./dashboard/HeroPatrimonio";
import { ActionGrid } from "./dashboard/ActionGrid";
import { FluxoMensal } from "./dashboard/FluxoMensal";
import { RecentTransactions } from "./dashboard/RecentTransactions";
import { UserNav } from "./layout/UserNav";

const fmt = (n: number) => 'R$\u00a0' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) => n >= 1e6 ? 'R$\u00a0' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);

export const GlobalDashboard = ({ onNavigate }: { onNavigate?: (tab: TabType) => void }) => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals, error: investError } = useInvestments();
  const { totals: debtTotals, error: debtError } = useDebts();
  const { goals } = useGoals();
  const { startTour } = useTour();
  const { streaks, level } = useGamification();
  const loginStreak = streaks['login'];
  
  React.useEffect(() => {
    startTour('dashboard');
  }, [startTour]);
  
  const hasError = personal.error || business.error || investError || debtError;
  const { user } = useAuth();
  const dashboardUser = user as (AuthUser & { username?: string }) | null;
  const firstName = dashboardUser?.name?.split(' ')[0]
    || dashboardUser?.username?.split(' ')[0]
    || 'Você';

  const totalBankBalance = personal.totals.balance + business.totals.balance;
  // Conta bancária negativa é tratada como Passivo, conta positiva como Ativo
  const bankAssets = totalBankBalance > 0 ? totalBankBalance : 0;
  const bankLiabilities = totalBankBalance < 0 ? Math.abs(totalBankBalance) : 0;

  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    netWorth: (bankAssets + investTotals.currentValue) - (debtTotals.totalBalance + bankLiabilities),
    assets: bankAssets + investTotals.currentValue,
    liabilities: debtTotals.totalBalance + bankLiabilities,
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1).replace('.', '');
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });

  const hour = today.getHours();
  const greeting = hour >= 5 && hour < 12 ? 'Bom dia' : hour >= 12 && hour < 18 ? 'Boa tarde' : 'Boa noite';

  const barData = personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map(d => d.despesas) : [];
  const barColors = barData.map((_, i) => i === barData.length - 1 ? 'rgba(74,139,255,1)' : 'rgba(74,139,255,0.6)');
  const months = personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map(d => new Date(`${d.month}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')) : [];
  const sparklineData = personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map(d => d.receitas - d.despesas) : [];
  const savingRate = globalTotals.income > 0 ? (globalTotals.balance / globalTotals.income) * 100 : 0;

  function getEmoji(cat: string) {
    switch (cat.toLowerCase()) {
      case 'moradia': return '🏠';
      case 'mercado': return '🛒';
      case 'delivery': return '🍕';
      case 'transporte': return '🚗';
      case 'saúde': return '💊';
      case 'salário': return '💰';
      default: return '💸';
    }
  }

  const recentPurchases = personal.allTransactions.slice(0, 5).map(tx => ({
    id: tx.id,
    ico: getEmoji(tx.category),
    ti: tx.description,
    cat: `${tx.category} · ${formatShortDate(tx.date)}`,
    am: tx.type === 'expense' ? -tx.amount : tx.amount
  }));

  const { score: healthScore, tooltip: healthScoreTooltip, sustainableDaily, estimatedTax } = useFinancialScore(
    globalTotals, 
    user ? {
      employmentType: user.employmentType,
      dependents: user.dependents,
      monthlyIncome: user.monthlyIncome,
      hasEmergencyFund: user.hasEmergencyFund
    } : null
  );

  const monthlyRevenue = user?.monthlyIncome ?? globalTotals.income;

  const calculateMonthlyVariation = () => {
    if (personal.monthlyTrend.length < 2) return { amount: 0, percentage: 0 };
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1]!;
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2]!;
    const variation = (current.receitas - current.despesas) - (previous.receitas - previous.despesas);
    const percentage = previous.receitas > 0 ? (variation / previous.receitas) * 100 : 0;
    return { amount: variation, percentage };
  };

  const monthlyVariation = calculateMonthlyVariation();

  const calculateCategorySpending = () => {
    const categories: { [key: string]: { spent: number; budget: number } } = {};
    personal.allTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
      if (!categories[tx.category]) categories[tx.category] = { spent: 0, budget: 0 };
      categories[tx.category]!.spent += tx.amount;
    });
    return Object.entries(categories).map(([name, data]) => ({
      name, spent: data.spent, budget: data.budget || data.spent * 1.2,
    }));
  };

  const categorySpending = calculateCategorySpending();

  const calculateBehavioralAlert = () => {
    if (personal.monthlyTrend.length < 2) return null;
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1]!;
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2]!;
    const alerts: string[] = [];
    if (current.despesas > previous.despesas * 1.1) {
      const increase = ((current.despesas - previous.despesas) / previous.despesas) * 100;
      const wasted = current.despesas - previous.despesas;
      alerts.push(`Você gastou ${increase.toFixed(0)}% a mais este mês — equivale a R$ ${Math.round(wasted)} se investido por 10 anos.`);
    }
    return alerts.length > 0 ? alerts[0] ?? null : null;
  };

  const behavioralAlert = calculateBehavioralAlert();

  return (
    <motion.div 
      className="pt-1 pb-6" 
      id="dashboard-overview"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header Zen (Flutuante de Elite) ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex justify-between items-center gap-3 mb-6 sticky top-2 z-[60] bg-[#0A1220]/70 backdrop-blur-2xl px-4 py-3.5 rounded-[28px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
            <img src="/logo-new.png" alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow" style={{ color: "var(--t3)", fontSize: "10px", margin: 0, textTransform: "uppercase" }}>{capitalizedDate}</div>
            <div className="flex items-center gap-2">
              <div
                className="page-title truncate"
                style={{ fontSize: "18px", letterSpacing: "-0.5px", color: "var(--t1)" }}
              >
                {greeting}, {firstName}
              </div>
              <button
                onClick={() => onNavigate?.('mastery')}
                className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">NVL {level.level}</span>
              </button>
              {hasError && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Offline" />
              )}
            </div>
          </div>
        </div>

        {/* Ações primárias compactas */}
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-white/[0.02] border border-white/[0.05] p-1 rounded-2xl">
          <button
            onClick={() => onNavigate?.('mastery')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/[0.04] active:scale-95"
            aria-label="Maestria e Conquistas"
          >
            <Trophy size={16} className="text-amber-500 opacity-90" />
            {(loginStreak?.current ?? 0) > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full" />}
          </button>
          <button
            onClick={() => onNavigate?.('notifications')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/[0.04] active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <UserNav onNavigate={onNavigate} collapsed={true} />
        </div>
      </motion.div>

      {/* ── BENTO GRID ───────────────────────────────────────── */}
      <div className="px-2">
        <motion.div variants={itemVariants} className="bento-grid">
        
        {/* HERO PATRIMÔNIO */}
        <div className="bento-full">
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
        </div>

        {/* FIRE Banner (Aviso Crítico/Relevante) */}
        <button
          type="button"
          className="bento-card bento-full cursor-pointer hover:bg-white/[0.06] active:scale-[0.98] text-left focus-visible:ring-emerald-500/70"
          style={{ background: "linear-gradient(135deg, rgba(0,217,145,0.08), rgba(0,217,145,0.02))", borderColor: "rgba(0,217,145,0.2)" }}
          onClick={() => onNavigate?.('retirement')}
          aria-label="Abrir simulador FIRE"
        >
          <div className="flex gap-3 items-center">
            <span className="text-[28px]">🎯</span>
            <div className="flex-1">
              <div className="text-[11px] font-bold mb-0.5 tracking-widest uppercase" style={{ color: "var(--green)" }}>Simulador FIRE</div>
              <div className="text-[13px] leading-snug font-medium" style={{ color: "var(--t1)" }}>Descubra quando você poderá se aposentar.</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </button>

        {/* Ações Rápidas Bento */}
        <div className="bento-card bento-full pb-2">
          <div className="text-[10px] uppercase tracking-widest font-bold mb-4" style={{ color: "var(--t3)" }}>Ações Rápidas</div>
          <ActionGrid onNavigate={onNavigate} />
        </div>

        {/* Tax Auditor Bento */}
      {estimatedTax > 0 && (
        <div
          className="card mb-4"
          style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(245,158,11,0.04))", border: "1px solid rgba(251,191,36,0.18)" }}
        >
          <div className="flex gap-3 items-center">
            <span className="text-2xl">🧾</span>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(251,191,36,0.9)" }}>
                Auditor de Impostos · {user?.employmentType === 'pj' ? "DAS / Simples Nacional" : "IRPF Estimado"}
              </div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--t1)" }}>
                Separe <span className="tabular-nums" style={{ color: "rgba(251,191,36,1)" }}>{fmt(estimatedTax)}/mês</span> para o governo
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--t3)" }}>
                {user?.employmentType === 'pj'
                  ? `~6% Simples Nacional sobre R$ ${(monthlyRevenue / 1000).toFixed(0)}k de faturamento`
                  : `Alíquota 27,5% sobre renda acima de R$ 4.664`}
                {(user?.dependents ?? 0) > 0 && ` · ${user?.dependents} dependente${(user?.dependents ?? 0) > 1 ? "s" : ""} podem reduzir sua base`}
              </div>
            </div>
            {user?.employmentType === 'pj' && (
              <div className="text-center rounded-xl px-3 py-2" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div className="text-[10px] font-bold tracking-wider" style={{ color: "rgba(251,191,36,0.7)" }}>CNPJ</div>
                <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--t2)" }}>Ativo</div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Alerta comportamental */}
        {behavioralAlert && (
          <button
            type="button"
            className="bento-card bento-full cursor-pointer hover:bg-white/[0.06] active:scale-[0.98] text-left"
            style={{ background: "rgba(255,173,59,0.06)", borderColor: "rgba(255,173,59,0.2)" }}
            onClick={() => onNavigate?.('planning')}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠</span>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--amber)" }}>Alerta Comportamental</div>
                <div className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--t1)" }}>{behavioralAlert}</div>
              </div>
            </div>
          </button>
        )}

        {/* Fluxo Mensal Bento */}
        <div className="bento-card bento-full p-5">
          <div className="text-[10px] uppercase tracking-widest font-bold mb-4" style={{ color: "var(--t3)" }}>Desempenho no Mês</div>
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
            error={hasError}
          />
        </div>

        {/* Por Categoria Bento */}
        <div className="bento-card bento-full p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--t3)" }}>Por categoria</div>
            {categorySpending.length > 0 && (
              <button
                type="button"
                className="text-[11px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300"
                onClick={() => onNavigate?.('personal')}
              >
                Detalhar
              </button>
            )}
          </div>
          <div>
            {hasError ? (
              <EmptyState icon={AlertCircle} title="Conexão Falhou" description="As categorias não podem ser carregadas offline." />
            ) : categorySpending.length > 0 ? (
              categorySpending.slice(0, 5).map((cat, idx) => {
                const safeSpent = isNaN(cat.spent) ? 0 : cat.spent;
                const pc = cat.budget > 0 ? Math.min((safeSpent / cat.budget) * 100, 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] bg-[#101929] border border-white/[0.05]">{getEmoji(cat.name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <div className="text-[13px] font-semibold text-gray-100">{cat.name}</div>
                        <div className="text-[12px] font-bold tabular-nums" style={{ color: safeSpent > cat.budget ? "var(--red)" : "var(--t2)", fontFamily: "var(--mono)" }}>{fmt(safeSpent)}</div>
                      </div>
                      <div className="h-[4px] bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pc}%`, background: cat.spent > cat.budget ? "var(--red)" : "var(--blue)" }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState icon={ChartBarIcon} title="Nenhum gasto" description="Lançamentos categorizados figurarão aqui." />
            )}
          </div>
        </div>

        {/* Transações Recentes Bento */}
        <div className="bento-card bento-full p-5">
          <div className="text-[10px] uppercase tracking-widest font-bold mb-4" style={{ color: "var(--t3)" }}>Transações Recentes</div>
          <RecentTransactions transactions={recentPurchases} onNavigate={onNavigate} fmt={fmt} error={hasError} />
        </div>

        {/* Gasto Diário Sustentável Bento */}
        {sustainableDaily > 0 && (
          <div className="bento-card bento-full" style={{ background: "linear-gradient(145deg, rgba(74,139,255,0.05), rgba(0,0,0,0))" }}>
             <div className="text-[9px] font-bold uppercase tracking-widest mb-3 opacity-60 text-blue-400">Gasto Diário Modigliani</div>
             <div className="flex items-baseline gap-2">
               <span className="text-3xl font-bold tabular-nums text-white tracking-tight" style={{ fontFamily: "var(--mono)" }}>{fmt(sustainableDaily)}</span>
               <span className="text-xs text-slate-400">/dia</span>
             </div>
             <div className="text-[11.5px] mt-2.5 font-medium leading-relaxed text-slate-400">Baseado no patrimônio atual projetado.</div>
          </div>
        )}

        {/* Smart Insights Bento */}
        <div className="bento-card bento-full p-5 mt-2 shadow-[0_0_40px_rgba(155,127,255,0.06)] border-[#9B7FFF]/20">
          <div className="text-[10px] uppercase tracking-widest font-bold mb-4" style={{ color: "var(--purple)" }}>Insights Inteligentes</div>
          <SmartInsights transactions={personal.allTransactions} goals={goals} onNavigate={onNavigate} />
        </div>
        
        </motion.div>
      </div>
    </motion.div>
  );
};