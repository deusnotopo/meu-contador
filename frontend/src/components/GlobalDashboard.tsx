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
import { AlertCircle, BarChart3 as ChartBarIcon } from "lucide-react";
import type { TabType } from "@/types/navigation";

// Sub-components
import { HeroPatrimonio } from "./dashboard/HeroPatrimonio";
import { ActionGrid } from "./dashboard/ActionGrid";
import { FluxoMensal } from "./dashboard/FluxoMensal";
import { RecentTransactions } from "./dashboard/RecentTransactions";
import { UserNav } from "./layout/UserNav";
import { AreaTutorialButton } from "./ui/AreaTutorialButton";

const fmt = (n: number) => 'R$\u00a0' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) => n >= 1e6 ? 'R$\u00a0' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);

export const GlobalDashboard = ({ onNavigate }: { onNavigate?: (tab: TabType) => void }) => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals, error: investError } = useInvestments();
  const { totals: debtTotals, error: debtError } = useDebts();
  const { goals } = useGoals();
  const { startTour } = useTour();
  
  React.useEffect(() => {
    startTour('dashboard');
  }, [startTour]);
  
  const hasError = personal.error || business.error || investError || debtError;
  const { user } = useAuth();
  // Prefer the backend user name, fall back gracefully
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

  const sustainableDaily = globalTotals.netWorth > 0 ? Math.round(globalTotals.netWorth * 0.04 / 365) : 0;

  const calculateScore = () => {
    if (globalTotals.income === 0) return 0;
    const savingsRatio = globalTotals.balance / globalTotals.income;
    const debtRatio = globalTotals.liabilities / globalTotals.assets || 0;
    return Math.min(100, Math.max(0, Math.round((savingsRatio * 50) + ((1 - debtRatio) * 50))));
  };

  const healthScore = calculateScore();

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
    <div style={{ paddingTop: "10px" }} id="dashboard-overview">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--t3)", letterSpacing: "1px", fontSize: "11px" }}>{capitalizedDate}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: "4px" }}>
            <div className="page-title" style={{ fontSize: "24px", letterSpacing: "-0.5px", background: "linear-gradient(90deg, var(--t1) 0%, var(--t2) 100%)", WebkitBackgroundClip: "text", color: "transparent" }}>
              {greeting}, {firstName} {greetingEmoji}
            </div>
            {hasError && (
              <div className="bdg bdg-r shadow-glow" style={{ animation: 'pulse 2s infinite' }}>
                <AlertCircle size={10} /> Offline
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AreaTutorialButton area="inicio" onNavigate={onNavigate} />
          <button onClick={() => onNavigate?.('notifications')} className="notif-ring hover-glow" style={{ background: "var(--glass2)", border: "1px solid var(--border)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
          <UserNav onNavigate={onNavigate} collapsed={true} />
        </div>
      </div>

      <HeroPatrimonio 
        netWorth={globalTotals.netWorth}
        assets={globalTotals.assets}
        liabilities={globalTotals.liabilities}
        healthScore={healthScore}
        monthlyVariation={monthlyVariation}
        sparklineData={sparklineData}
        onNavigate={onNavigate}
        fmtM={fmtM}
        fmt={fmt}
      />

      <ActionGrid onNavigate={onNavigate} />

      {/* FIRE Promo Banner */}
      <div 
        className="card" 
        style={{ marginBottom: "18px", background: "var(--glass2)", cursor: "pointer", border: "1px solid rgba(0,217,145,0.2)" }}
        onClick={() => onNavigate?.('retirement')}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ fontSize: "24px" }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--green)", marginBottom: "2px" }}>Simulador FIRE</div>
            <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.3 }}>Descubra quando você poderá se aposentar com seus investimentos atuais.</div>
          </div>
          <div style={{ color: "var(--t3)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      {/* Alerta comportamental */}
      {behavioralAlert && (
        <div className="nudge warn" style={{ cursor: "pointer" }} onClick={() => onNavigate?.('planning')}>
          <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Alerta comportamental</div>
          <div className="nudge-body">{behavioralAlert}</div>
          <div style={{ fontSize: "11px", color: "var(--amber)", marginTop: "6px", fontWeight: 500 }}>Toque para ver o envelope →</div>
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
          <EmptyState 
            icon={AlertCircle}
            title="Conexão Falhou"
            description="As categorias de gastos não podem ser carregadas offline."
          />
        ) : categorySpending.length > 0 ? (
          categorySpending.slice(0, 5).map((cat, idx) => {
            const safeSpent = isNaN(cat.spent) ? 0 : cat.spent;
            const pc = cat.budget > 0 ? Math.min((safeSpent / cat.budget) * 100, 100) : 0;
            return (
              <div key={idx} className="row" style={{ cursor: "default" }}>
                <div className="row-ico">{getEmoji(cat.name)}</div>
                <div className="row-main">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <div className="row-title">{cat.name}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: safeSpent > cat.budget ? "var(--red)" : "var(--t2)", fontFamily: "var(--mono)" }}>{fmt(safeSpent)}</div>
                  </div>
                  <div className="prog">
                    <div className="prog-fill" style={{ width: `${pc}%`, background: cat.spent > cat.budget ? "var(--red)" : "var(--blue)" }}></div>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "2px", fontFamily: "var(--mono)" }}>de {fmt(cat.budget)}</div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState 
            icon={ChartBarIcon}
            title="Nada gasto ainda"
            description="Seus gastos categorizados aparecerão aqui assim que você lançar o primeiro."
          />
        )}
      </div>

      <RecentTransactions 
        transactions={recentPurchases}
        onNavigate={onNavigate}
        fmt={fmt}
        error={hasError}
      />

      {/* Gasto diário sustentável */}
      {sustainableDaily > 0 && (
        <>
          <div className="sec-hd"><span className="sec-title">Gasto diário sustentável</span></div>
          <div className="hero" style={{ padding: "18px" }}>
            <div style={{ fontSize: "9.5px", color: "var(--t3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>Hipótese do ciclo de vida · Modigliani</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "var(--t1)", letterSpacing: "-1.5px", fontFamily: "var(--mono)" }}>{fmt(sustainableDaily)}</span>
              <span style={{ fontSize: "14px", color: "var(--t2)" }}>/dia</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--t2)", marginTop: "8px", lineHeight: 1.5 }}>Baseado no patrimônio atual, renda projetada e passivos futuros — valor que não compromete o seu eu de 85 anos.</div>
          </div>
        </>
      )}

      {/* Smart Insights */}
      <div className="sec-hd"><span className="sec-title">Insights Inteligentes</span></div>
      <SmartInsights transactions={personal.allTransactions} goals={goals} onNavigate={onNavigate} />
    </div>
  );
};