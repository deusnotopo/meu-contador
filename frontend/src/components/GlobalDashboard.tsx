import React from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useGoals } from "@/hooks/useGoals";
import { SmartInsights } from "@/components/personal/SmartInsights";
import { useAuth } from "@/context/AuthContext";
import { formatShortDate } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTour } from "@/hooks/useTour";
import { useGamification } from "@/hooks/useGamification";
import { AlertCircle, BarChart3 as ChartBarIcon, Trophy, Flame } from "lucide-react";
import type { TabType } from "@/types/navigation";

// Sub-components
import { HeroPatrimonio } from "./dashboard/HeroPatrimonio";
import { ActionGrid } from "./dashboard/ActionGrid";
import { FluxoMensal } from "./dashboard/FluxoMensal";
import { RecentTransactions } from "./dashboard/RecentTransactions";
import { UserNav } from "./layout/UserNav";
import { AreaTutorialButton } from "./ui/AreaTutorialButton";
import { WizardTrigger } from "./onboarding/WizardTrigger";
import { TermometroDoMes } from "./dashboard/TermometroDoMes";

const fmt = (n: number) => 'R$\u00a0' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) => n >= 1e6 ? 'R$\u00a0' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);

export const GlobalDashboard = ({ onNavigate }: { onNavigate?: (tab: TabType) => void }) => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals, error: investError } = useInvestments();
  const { totals: debtTotals, error: debtError } = useDebts();
  const { goals } = useGoals();
  const { startTour } = useTour();
  const { level, streaks } = useGamification();
  const loginStreak = streaks['login'];
  
  React.useEffect(() => {
    startTour('dashboard');
  }, [startTour]);
  
  const hasError = personal.error || business.error || investError || debtError;
  const { user } = useAuth();
  const firstName = (user as any)?.name?.split(' ')[0]
    || (user as any)?.username?.split(' ')[0]
    || 'Você';

  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    netWorth: (personal.totals.balance + business.totals.balance + investTotals.currentValue) - debtTotals.totalBalance,
    assets: personal.totals.balance + business.totals.balance + investTotals.currentValue,
    liabilities: debtTotals.totalBalance,
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1).replace('.', '');
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });

  const hour = today.getHours();
  const greeting = hour >= 5 && hour < 12 ? 'Bom dia' : hour >= 12 && hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greetingEmoji = hour >= 5 && hour < 12 ? '☀️' : hour >= 12 && hour < 18 ? '🌤️' : '🌙';

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

  // ── Adaptive Metrics (Phase 10+) ─────────────────────────────────────
  const isPj = user?.employmentType === 'pj';
  const dependents = user?.dependents ?? 0;
  const emergencyMonths = isPj ? 12 : 6;
  const monthlyFixedCosts = globalTotals.expense > 0 ? globalTotals.expense : (user?.monthlyIncome ?? 0) * 0.6;
  const requiredReserve = monthlyFixedCosts * emergencyMonths;
  const dependentPenalty = 1 - (dependents * 0.08);
  const sustainableDaily = globalTotals.netWorth > 0
    ? Math.round(globalTotals.netWorth * 0.04 / 365 * Math.max(0.4, dependentPenalty))
    : 0;

  const calculateScore = () => {
    if (globalTotals.income === 0) return { score: 0, tooltip: "Registre receitas para calcular o score de saúde." };
    const savingsRatio = globalTotals.balance / globalTotals.income;
    const debtRatio = globalTotals.liabilities / (globalTotals.assets || 1);
    let score = Math.round((savingsRatio * 50) + ((1 - debtRatio) * 50));
    let tooltip = "Score Base. ";

    const currentBalance = globalTotals.balance;
    if (currentBalance < requiredReserve) {
      const reserveGap = (requiredReserve - currentBalance) / requiredReserve;
      score = Math.round(score * (1 - reserveGap * 0.4));
      tooltip += isPj 
        ? "⚠️ Reserva PF limitada afeta PJ (-score). " 
        : "⚠️ Reserva inferior a 6 meses de segurança (-score). ";
    }
    if (dependents > 0 && !user?.hasEmergencyFund) {
      score = Math.round(score * (1 - dependents * 0.04));
      tooltip += `⚠️ ${dependents} dependente(s) sem Fundo de Emergência (-score).`;
    }
    
    if (tooltip === "Score Base. ") tooltip = "Seu score está ótimo! Reserva adequada e endividamento sob controle.";
    return { score: Math.min(100, Math.max(0, score)), tooltip };
  };

  const { score: healthScore, tooltip: healthScoreTooltip } = calculateScore();
  
  const monthlyRevenue = user?.monthlyIncome ?? globalTotals.income;
  const estimatedTax = isPj
    ? Math.round(monthlyRevenue * 0.06)
    : Math.round(Math.max(0, (monthlyRevenue - 4664) * 0.275));

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
    <div className="pt-2.5" id="dashboard-overview">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex justify-between items-start gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-[14px] bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
            <img src="/logo-new.png" alt="Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow" style={{ color: "var(--t3)", fontSize: "11px" }}>{capitalizedDate}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="page-title truncate"
                style={{ fontSize: "22px", letterSpacing: "-0.5px", background: "linear-gradient(90deg, var(--t1) 0%, var(--t2) 100%)", WebkitBackgroundClip: "text", color: "transparent" }}
              >
                {greeting}, {firstName} {greetingEmoji}
              </div>
              {hasError && (
                <div className="bdg bdg-r" style={{ animation: 'pulse 2s infinite' }}>
                  <AlertCircle size={10} /> Offline
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end w-full">
          <button
            onClick={() => onNavigate?.('health')}
            className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, rgba(255,173,59,0.15), rgba(255,140,0,0.1))", border: "1px solid rgba(255,173,59,0.2)" }}
          >
            <Trophy size={14} style={{ color: "var(--amber)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--amber)", fontFamily: "var(--mono)" }}>Nv. {level.level}</span>
            {loginStreak && loginStreak.current > 0 && (
              <>
                <Flame size={12} style={{ color: "var(--orange)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "var(--orange)" }}>{loginStreak.current}</span>
              </>
            )}
          </button>
          <WizardTrigger label="Assistente" />
          <AreaTutorialButton area="inicio" onNavigate={onNavigate} />
          <button
            onClick={() => onNavigate?.('notifications')}
            className="notif-ring w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: "var(--glass2)", border: "1px solid var(--border)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          <UserNav onNavigate={onNavigate} collapsed={true} />
        </div>
      </div>

      <TermometroDoMes income={globalTotals.income} expense={globalTotals.expense} balance={globalTotals.balance} onNavigate={onNavigate} />

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

      <ActionGrid onNavigate={onNavigate} />

      {/* FIRE Banner */}
      <div
        className="card mb-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: "var(--glass2)", border: "1px solid rgba(0,217,145,0.2)" }}
        onClick={() => onNavigate?.('retirement')}
      >
        <div className="flex gap-3 items-center">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--green)" }}>Simulador FIRE</div>
            <div className="text-xs leading-snug" style={{ color: "var(--t2)" }}>Descubra quando você poderá se aposentar com seus investimentos atuais.</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>

      {/* Tax Auditor */}
      {estimatedTax > 0 && (
        <div
          className="card mb-4"
          style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(245,158,11,0.04))", border: "1px solid rgba(251,191,36,0.18)" }}
        >
          <div className="flex gap-3 items-center">
            <span className="text-2xl">🧾</span>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(251,191,36,0.9)" }}>
                Auditor de Impostos · {isPj ? "DAS / Simples Nacional" : "IRPF Estimado"}
              </div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--t1)" }}>
                Separe <span className="tabular-nums" style={{ color: "rgba(251,191,36,1)" }}>{fmt(estimatedTax)}/mês</span> para o governo
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--t3)" }}>
                {isPj
                  ? `~6% Simples Nacional sobre R$ ${(monthlyRevenue / 1000).toFixed(0)}k de faturamento`
                  : `Alíquota 27,5% sobre renda acima de R$ 4.664`}
                {dependents > 0 && ` · ${dependents} dependente${dependents > 1 ? "s" : ""} podem reduzir sua base`}
              </div>
            </div>
            {isPj && (
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
        <div className="nudge warn cursor-pointer" onClick={() => onNavigate?.('planning')}>
          <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Alerta comportamental</div>
          <div className="nudge-body">{behavioralAlert}</div>
          <div className="text-[11px] font-medium mt-1.5" style={{ color: "var(--amber)" }}>Toque para ver o envelope →</div>
        </div>
      )}

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

      {/* Por categoria */}
      <div className="sec-hd">
        <span className="sec-title">Por categoria</span>
        {categorySpending.length > 0 && <span className="sec-link" onClick={() => onNavigate?.('personal')}>Ver mais</span>}
      </div>
      <div className="card">
        {hasError ? (
          <EmptyState icon={AlertCircle} title="Conexão Falhou" description="As categorias de gastos não podem ser carregadas offline." />
        ) : categorySpending.length > 0 ? (
          categorySpending.slice(0, 5).map((cat, idx) => {
            const safeSpent = isNaN(cat.spent) ? 0 : cat.spent;
            const pc = cat.budget > 0 ? Math.min((safeSpent / cat.budget) * 100, 100) : 0;
            return (
              <div key={idx} className="row" style={{ cursor: "default" }}>
                <div className="row-ico">{getEmoji(cat.name)}</div>
                <div className="row-main">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="row-title">{cat.name}</div>
                    <div className="text-xs font-semibold tabular-nums" style={{ color: safeSpent > cat.budget ? "var(--red)" : "var(--t2)", fontFamily: "var(--mono)" }}>{fmt(safeSpent)}</div>
                  </div>
                  <div className="prog">
                    <div className="prog-fill" style={{ width: `${pc}%`, background: cat.spent > cat.budget ? "var(--red)" : "var(--blue)" }} />
                  </div>
                  <div className="text-[10px] mt-0.5 tabular-nums" style={{ color: "var(--t3)", fontFamily: "var(--mono)" }}>de {fmt(cat.budget)}</div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState icon={ChartBarIcon} title="Nada gasto ainda" description="Seus gastos categorizados aparecerão aqui assim que você lançar o primeiro." />
        )}
      </div>

      <RecentTransactions transactions={recentPurchases} onNavigate={onNavigate} fmt={fmt} error={hasError} />

      {/* Gasto diário sustentável */}
      {sustainableDaily > 0 && (
        <>
          <div className="sec-hd"><span className="sec-title">Gasto diário sustentável</span></div>
          <div className="hero p-4">
            <div className="text-[9.5px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--t3)" }}>Hipótese do ciclo de vida · Modigliani</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--t1)", letterSpacing: "-1.5px", fontFamily: "var(--mono)" }}>{fmt(sustainableDaily)}</span>
              <span className="text-sm" style={{ color: "var(--t2)" }}>/dia</span>
            </div>
            <div className="text-[11.5px] mt-2 leading-relaxed" style={{ color: "var(--t2)" }}>Baseado no patrimônio atual, renda projetada e passivos futuros — valor que não compromete o seu eu de 85 anos.</div>
          </div>
        </>
      )}

      {/* Smart Insights */}
      <div className="sec-hd"><span className="sec-title">Insights Inteligentes</span></div>
      <SmartInsights transactions={personal.allTransactions} goals={goals} onNavigate={onNavigate} />
    </div>
  );
};