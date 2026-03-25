import React, { useState, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { loadProfile } from "@/lib/storage";
import { formatShortDate } from "@/lib/formatters";
import type { TabType } from "@/types/navigation";

const fmt = (n: number) =>
  'R$\u00a0' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) =>
  n >= 1e6 ? 'R$\u00a0' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);

// SVG Sparkline Component matching finapp_v3.html exactly
const Sparkline = ({ data, color = "var(--blue)", h = 44, w = 318 }: { data: number[], color?: string, h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const fp = `0,${h} ${pts} ${w},${h}`;
  const lx = (((data.length - 1) / (data.length - 1)) * w).toFixed(1);
  const ly = (h - ((data[data.length - 1] - min) / range) * (h - 6) - 3).toFixed(1);
  const gradId = "sg" + Math.random().toString(36).slice(2, 6);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fp} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
    </svg>
  );
};

// SVG BarChart Component matching finapp_v3.html exactly
const BarChart = ({ data, colors, h = 50, w = 318 }: { data: number[], colors: string | string[], h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;
  const bw = Math.floor((w - data.length * 3) / data.length);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * h);
        const x = i * (bw + 3);
        const fill = Array.isArray(colors) ? colors[i % colors.length] : colors;
        return (
          <rect key={i} x={x} y={h - bh} width={bw} height={bh} rx="3" fill={fill} opacity="0.85" />
        );
      })}
    </svg>
  );
};

export const GlobalDashboard = ({ onNavigate }: { onNavigate?: (tab: TabType) => void }) => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals } = useInvestments();
  const { totals: debtTotals } = useDebts();
  const profile = loadProfile();

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

  const barData = personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map(d => d.despesas) : [];
  const barColors = barData.map((_, i) => 
    i === barData.length - 1 ? 'rgba(74,139,255,1)' : 'rgba(74,139,255,0.6)'
  );
  
  const months = personal.monthlyTrend.length > 0 
    ? personal.monthlyTrend.map(d => new Date(`${d.month}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')) 
    : [];

  const sparklineData = personal.monthlyTrend.length > 0 
    ? personal.monthlyTrend.map(d => d.receitas - d.despesas) 
    : [];

  const savingRate = globalTotals.income > 0 ? (globalTotals.balance / globalTotals.income) * 100 : 0;

  // Get recent transactions from real data
  const recentPurchases = personal.allTransactions.slice(0, 5).map(tx => ({
    id: tx.id,
    ico: getEmoji(tx.category),
    ti: tx.description,
    cat: `${tx.category} · ${formatShortDate(tx.date)}`,
    am: tx.type === 'expense' ? -tx.amount : tx.amount
  }));

  const txnsToRender = recentPurchases;
  const sustainableDaily = globalTotals.netWorth > 0 ? Math.round(globalTotals.netWorth * 0.04 / 365) : 0;

  // Calculate score based on real data
  const calculateScore = () => {
    if (globalTotals.income === 0) return 0;
    const savingsRatio = globalTotals.balance / globalTotals.income;
    const debtRatio = globalTotals.liabilities / globalTotals.assets || 0;
    const score = Math.min(100, Math.max(0, Math.round((savingsRatio * 50) + ((1 - debtRatio) * 50))));
    return score;
  };

  const healthScore = calculateScore();

  // Calculate monthly variation
  const calculateMonthlyVariation = () => {
    if (personal.monthlyTrend.length < 2) return { amount: 0, percentage: 0 };
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1];
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2];
    const variation = current.receitas - current.despesas - (previous.receitas - previous.despesas);
    const percentage = previous.receitas > 0 ? (variation / previous.receitas) * 100 : 0;
    return { amount: variation, percentage };
  };

  const monthlyVariation = calculateMonthlyVariation();

  // Calculate category spending from real transactions
  const calculateCategorySpending = () => {
    const categories: { [key: string]: { spent: number; budget: number } } = {};
    
    personal.allTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        if (!categories[tx.category]) {
          categories[tx.category] = { spent: 0, budget: 0 };
        }
        categories[tx.category].spent += tx.amount;
      });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      spent: data.spent,
      budget: data.budget || data.spent * 1.2, // Default budget is 120% of spent
    }));
  };

  const categorySpending = calculateCategorySpending();

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

  // Calculate behavioral alert
  const calculateBehavioralAlert = () => {
    if (personal.monthlyTrend.length < 2) return null;
    
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1];
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2];
    
    // Find categories with significant increases
    const alerts: string[] = [];
    
    // This is simplified - in real app, you'd compare category spending month over month
    if (current.despesas > previous.despesas * 1.1) {
      const increase = ((current.despesas - previous.despesas) / previous.despesas) * 100;
      const wasted = current.despesas - previous.despesas;
      alerts.push(`Você gastou ${increase.toFixed(0)}% a mais este mês — equivale a R$ ${Math.round(wasted)} se investido por 10 anos.`);
    }
    
    return alerts.length > 0 ? alerts[0] : null;
  };

  const behavioralAlert = calculateBehavioralAlert();

  return (
    <div style={{ paddingTop: "10px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <div className="eyebrow">{capitalizedDate}</div>
          <div className="page-title" style={{ fontSize: "22px" }}>Bom dia, {profile?.name?.split(' ')[0] || "Usuário"} 👋</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => onNavigate?.('notifications')} className="notif-ring" style={{ background: "var(--glass2)", border: "1px solid var(--border)", width: "38px", height: "38px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.7" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
          <div className="avatar" onClick={() => onNavigate?.('settings')} style={{ cursor: "pointer" }}>{(profile?.name || "US").substring(0, 2).toUpperCase()}</div>
        </div>
      </div>

      {/* Hero Patrimônio */}
      <div className="hero">
        <div style={{ fontSize: "10px", color: "rgba(74,139,255,0.9)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="pdot" style={{ background: "var(--green)" }}></span>
          Patrimônio líquido
        </div>
        <div className="bignum">{fmtM(globalTotals.netWorth)}</div>
        {monthlyVariation.amount !== 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <span className={`bdg ${monthlyVariation.amount > 0 ? 'bdg-g' : 'bdg-r'}`}>
              {monthlyVariation.amount > 0 ? '▲' : '▼'} {fmt(Math.abs(monthlyVariation.amount))} este mês
            </span>
            <span style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
              {monthlyVariation.percentage > 0 ? '+' : ''}{monthlyVariation.percentage.toFixed(1)}%
            </span>
          </div>
        )}
        {sparklineData.length > 0 && (
          <div style={{ marginTop: "12px", height: "44px" }}>
            <Sparkline data={sparklineData} color="var(--green)" />
          </div>
        )}
        <div className="stat3">
          <div className="s3i"><div className="s3l">Ativos</div><div className="s3v" style={{ color: "var(--green)" }}>{fmtM(globalTotals.assets)}</div></div>
          <div className="s3i"><div className="s3l">Passivos</div><div className="s3v" style={{ color: "var(--red)" }}>{fmt(globalTotals.liabilities)}</div></div>
          <div className="s3i" onClick={() => onNavigate?.('health')} style={{ cursor: 'pointer' }}><div className="s3l">Score</div><div className="s3v" style={{ color: "var(--blue)" }}>{healthScore}/100</div></div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="qa-grid" style={{ marginBottom: "18px" }}>
        {(
          [
            ['💸', 'Lançar\ngasto', 'launch'],
            ['📥', 'Receita', 'launch'],
            ['📊', 'Saúde', 'health'],
            ['🎯', 'Metas', 'planning']
          ] as const
        ).map(([ic, lb, route], i) => (
          <button key={i} className="qa" onClick={() => onNavigate?.(route as TabType)}>
            <div className="qa-ico">{ic}</div>
            <div className="qa-lbl" dangerouslySetInnerHTML={{ __html: lb.replace('\n', '<br>') }}></div>
          </button>
        ))}
      </div>

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

      {/* Fluxo do mês */}
      <div className="sec-hd">
        <span className="sec-title">Fluxo de {monthName}</span>
        <span className="sec-link" onClick={() => onNavigate?.('personal')}>Detalhes</span>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Receitas</div>
          <div className="m-val g">{fmt(globalTotals.income)}</div>
        </div>
        <div className="metric">
          <div className="m-label">Gastos</div>
          <div className="m-val r">{fmt(globalTotals.expense)}</div>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Poupado</div>
          <div className="m-val b">{fmt(globalTotals.balance)}</div>
          <div className="m-delta" style={{ color: "var(--t3)" }}>este mês</div>
        </div>
        <div className="metric">
          <div className="m-label">Taxa poupança</div>
          <div className="m-val b">{savingRate.toFixed(1).replace('.', ',')}%</div>
        </div>
      </div>

      {/* Gráfico de barras mensal */}
      {barData.length > 0 && (
        <>
          <div className="sec-hd"><span className="sec-title">Últimos {barData.length} meses</span></div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "var(--blue)", borderRadius: "2px", display: "inline-block" }}></span>Gastos</span>
              </div>
            </div>
            <div style={{ height: "52px", width: "100%", overflow: "hidden" }}>
              <BarChart data={barData} colors={barColors} w={318} h={52} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--t3)", fontFamily: "var(--mono)", marginTop: "4px" }}>
              {months.map(m => <span key={m} style={{ flex: 1, textAlign: "center" }}>{m}</span>)}
            </div>
          </div>
        </>
      )}

      {/* Por categoria */}
      {categorySpending.length > 0 && (
        <>
          <div className="sec-hd">
            <span className="sec-title">Por categoria</span>
            <span className="sec-link">Ver mais</span>
          </div>
          <div className="card">
            {categorySpending.slice(0, 5).map((cat, idx) => {
              const pc = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
              return (
                <div key={idx} className="row" style={{ cursor: "default" }}>
                  <div className="row-ico">{getEmoji(cat.name)}</div>
                  <div className="row-main">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <div className="row-title">{cat.name}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: cat.spent > cat.budget ? "var(--red)" : "var(--t2)", fontFamily: "var(--mono)" }}>{fmt(cat.spent)}</div>
                    </div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width: `${pc}%`, background: cat.spent > cat.budget ? "var(--red)" : "var(--blue)" }}></div>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "2px", fontFamily: "var(--mono)" }}>de {fmt(cat.budget)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Últimas transações */}
      {txnsToRender.length > 0 && (
        <>
          <div className="sec-hd">
            <span className="sec-title">Últimas transações</span>
            <span className="sec-link" onClick={() => onNavigate?.('personal')}>Ver todas</span>
          </div>
          <div className="card">
            {txnsToRender.map(tx => {
              const isPlus = tx.am > 0;
              return (
                <div key={tx.id} className="row">
                  <div className="row-ico" style={{ background: isPlus ? 'var(--green-d)' : 'var(--glass2)' }}>
                    {tx.ico}
                  </div>
                  <div className="row-main">
                    <div className="row-title">{tx.ti}</div>
                    <div className="row-sub">{tx.cat}</div>
                  </div>
                  <div className={`row-amt ${isPlus ? 'amt-plus' : 'amt-minus'}`}>
                    {isPlus ? '+' : '−'}&nbsp;{fmt(Math.abs(tx.am)).replace('R$\xa0', 'R$\xa0')}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
    </div>
  );
};