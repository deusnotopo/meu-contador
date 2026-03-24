import React, { useState, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { loadProfile } from "@/lib/storage";
import { showSuccess, showError } from "@/lib/toast";

const fmt = (n: number) =>
  'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) =>
  n >= 1e6 ? 'R$ ' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);

// SVG Sparkline Component
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
  const gradId = "sg" + color.replace(/[^a-z]/gi, '');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fp} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={color} stroke="var(--bg)" strokeWidth="1.5" />
    </svg>
  );
};

// SVG BarChart Component
const BarChart = ({ data, colors, h = 52, w = 318 }: { data: number[], colors: string | string[], h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;
  const bw = Math.floor((w - data.length * 3) / data.length);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * h);
        const x = i * (bw + 3);
        const fill = Array.isArray(colors) ? colors[i % colors.length] : colors;
        return (
          <rect key={i} x={x} y={h - bh} width={bw} height={bh} rx="3" fill={fill} opacity="0.85" className="barchart-bar" />
        );
      })}
    </svg>
  );
};

export const GlobalDashboard = () => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals } = useInvestments();
  const profile = loadProfile();

  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    netWorth: personal.totals.balance + business.totals.balance + investTotals.currentValue,
    assets: personal.totals.balance + business.totals.balance + investTotals.currentValue, // simplified
    liabilities: 0, // simplified for now
  };

  // Generate today's formatted date string
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1).replace('.', '');

  // Mock data to match the V2 design (until we fully wire up the real history array)
  const sparklineData = [168000, 171000, 173500, 175200, 177800, 180100, 183000, 184500, 185900, globalTotals.netWorth || 187430];
  const barData = [4200, 4800, 5100, 5600, 5400, globalTotals.expense || 5820];
  const barColors = ['rgba(74,139,255,0.7)', 'rgba(74,139,255,0.7)', 'rgba(74,139,255,0.7)', 'rgba(74,139,255,0.7)', 'rgba(74,139,255,0.7)', 'rgba(74,139,255,1)'];
  const months = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'];

  const savingRate = globalTotals.income > 0 ? (globalTotals.balance / globalTotals.income) * 100 : 0;

  // Real latest transactions
  const recentPurchases = personal.allTransactions.slice(0, 4);

  // Sustainable spending dummy calculation (Modigliani lifecycle hypothesis)
  const sustainableDaily = Math.round(globalTotals.netWorth * 0.04 / 365) || 194;

  const getEmoji = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'moradia': return '🏠';
      case 'mercado': return '🛒';
      case 'delivery': return '🍕';
      case 'transporte': return '🚗';
      case 'saúde': return '💊';
      case 'salário': return '💰';
      default: return '💸';
    }
  };

  const categories = [
    ['🏠', 'Moradia', 2200, 2200, 'var(--blue)'],
    ['🛒', 'Mercado', 890, 1000, 'var(--green)'],
    ['🍕', 'Delivery', 312, 300, 'var(--red)'],
    ['🚗', 'Transporte', 620, 800, 'var(--green)'],
    ['💊', 'Saúde', 220, 400, 'var(--green)'],
  ];

  const handleShortcut = (msg: string) => showSuccess(msg);

  return (
    <div className="pt-3 pb-24 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="eyebrow">{capitalizedDate}</div>
          <div className="page-title text-[22px]">Bom dia, {profile?.name?.split(' ')[0] || "Usuário"} 👋</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => showSuccess("Nenhuma notificação")} className="notif-ring bg-[var(--glass2)] border border-[var(--border)] w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--glass3)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.7" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          <div className="avatar" onClick={() => handleShortcut("Abrir Configurações")}>
            {(profile?.name || "RF").substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Hero Patrimônio */}
      <div className="hero">
        <div className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Patrimônio líquido
        </div>
        <div className="bignum">{fmtM(globalTotals.netWorth || 0)}</div>
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="bdg bdg-g">▲ R$ 2.340 este mês</span>
          <span className="text-[11px] text-[var(--t3)] font-[var(--mono)]">+1,3%</span>
        </div>
        <div className="mt-3 h-11">
          <Sparkline data={sparklineData} color="var(--green)" h={44} w={318} />
        </div>
        <div className="stat3">
          <div className="s3i"><div className="s3l">Ativos</div><div className="s3v text-[var(--green)]">{fmtM(globalTotals.assets)}</div></div>
          <div className="s3i"><div className="s3l">Passivos</div><div className="s3v text-[var(--red)]">{fmt(globalTotals.liabilities)}</div></div>
          <div className="s3i"><div className="s3l">Score</div><div className="s3v text-[var(--blue)]">74/100</div></div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="qa-grid mb-5">
        <button className="qa" onClick={() => handleShortcut("Lançar gasto: menu em breve")}>
          <div className="qa-ico">💸</div>
          <div className="qa-lbl">Lançar<br />gasto</div>
        </button>
        <button className="qa" onClick={() => handleShortcut("Nova Receita: menu em breve")}>
          <div className="qa-ico">📥</div>
          <div className="qa-lbl">Nova<br />Receita</div>
        </button>
        <button className="qa" onClick={() => handleShortcut("Acesso aos Envelopes")}>
          <div className="qa-ico">🔀</div>
          <div className="qa-lbl">Envelopes</div>
        </button>
        <button className="qa" onClick={() => handleShortcut("Abrir Relatório")}>
          <div className="qa-ico">📊</div>
          <div className="qa-lbl">Relatório</div>
        </button>
      </div>

      {/* Alerta comportamental */}
      <div className="nudge warn cursor-pointer" onClick={() => handleShortcut("Visualizar Envelope do Delivery")}>
        <div className="nudge-ttl text-[var(--amber)]">⚠ Alerta comportamental</div>
        <div className="nudge-body">Você gastou <strong className="text-[var(--amber)]">38% a mais</strong> em Delivery este mês — equivale a <strong className="text-[var(--amber)]">R$ 847</strong> se investido por 10 anos.</div>
        <div className="text-[11px] text-[var(--amber)] mt-1.5 font-medium">Toque para ver o envelope →</div>
      </div>

      {/* Fluxo do mês */}
      <div className="sec-hd">
        <span className="sec-title">Fluxo de {today.toLocaleDateString('pt-BR', { month: 'long' })}</span>
        <span className="sec-link" onClick={() => handleShortcut("Acesso aos Envelopes")}>Detalhes</span>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Receitas</div>
          <div className="m-val g">{fmt(globalTotals.income)}</div>
          <div className="m-delta text-[var(--green)]">▲ +2,1% vs. último mês</div>
        </div>
        <div className="metric">
          <div className="m-label">Gastos</div>
          <div className="m-val r">{fmt(globalTotals.expense)}</div>
          <div className="m-delta text-[var(--red)]">▲ +3,2% vs. último mês</div>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Poupado</div>
          <div className="m-val b">{fmt(globalTotals.balance)}</div>
          <div className="m-delta text-[var(--t3)]">este mês</div>
        </div>
        <div className="metric">
          <div className="m-label">Taxa poupança</div>
          <div className="m-val b">{savingRate.toFixed(1)}%</div>
          <div className="m-delta text-[var(--green)]">meta: 25% ✓</div>
        </div>
      </div>

      {/* Gráfico de barras mensal */}
      <div className="sec-hd"><span className="sec-title">Últimos 6 meses</span></div>
      <div className="card">
        <div className="flex justify-between items-end mb-2">
          <div className="text-[10px] text-[var(--t3)] flex gap-3 items-center">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--blue)] rounded-[2px] inline-block"></span>Gastos</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--green)] rounded-[2px] inline-block"></span>Poupado</span>
          </div>
        </div>
        <div className="w-full">
          <BarChart data={barData} colors={barColors} h={52} />
        </div>
        <div className="flex justify-between text-[9px] text-[var(--t3)] font-[var(--mono)] mt-1">
          {months.map(m => <span key={m} className="flex-1 text-center">{m}</span>)}
        </div>
      </div>

      {/* Por categoria */}
      <div className="sec-hd">
        <span className="sec-title">Por categoria</span>
        <span className="sec-link">Ver mais</span>
      </div>
      <div className="card">
        {categories.map(([ic, nm, us, tt, cl], idx) => {
          const pc = Math.min((us as number / (tt as number)) * 100, 100);
          const isOver = (us as number) > (tt as number);
          return (
            <div key={idx} className="row cursor-default">
              <div className="row-ico">{ic}</div>
              <div className="row-main">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="row-title">{nm}</div>
                  <div className={`text-xs font-semibold ${isOver ? 'text-[var(--red)]' : 'text-[var(--t2)]'} font-[var(--mono)]`}>
                    {fmt(us as number)}
                  </div>
                </div>
                <div className="prog"><div className="prog-fill" style={{ width: `${pc}%`, background: cl as string }}></div></div>
                <div className="text-[10px] text-[var(--t3)] mt-0.5 font-[var(--mono)]">de {fmt(tt as number)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Últimas transações */}
      <div className="sec-hd">
        <span className="sec-title">Últimas transações</span>
        <span className="sec-link" onClick={() => handleShortcut("Acesso às Transações")}>Ver todas</span>
      </div>
      <div className="card">
        {recentPurchases.length > 0 ? recentPurchases.map((tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div key={tx.id} className="row" onClick={() => showSuccess(`Detalhes: ${tx.description}`)}>
              <div className="row-ico" style={{ background: isIncome ? 'var(--green-d)' : 'var(--glass2)' }}>
                {getEmoji(tx.category)}
              </div>
              <div className="row-main">
                <div className="row-title">{tx.description}</div>
                <div className="row-sub">{tx.category} · {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
              </div>
              <div className={`row-amt ${isIncome ? 'amt-plus' : 'amt-minus'}`}>
                {isIncome ? '+' : '−'} {fmt(tx.amount)}
              </div>
            </div>
          );
        }) : (
          <div className="text-center text-sm text-[var(--t3)] py-4">Nenhuma transação recente</div>
        )}
      </div>

      {/* Gasto diário sustentável */}
      <div className="sec-hd"><span className="sec-title">Gasto diário sustentável</span></div>
      <div className="hero !py-4 px-5">
        <div className="text-[9.5px] text-[var(--t3)] tracking-[0.1em] uppercase mb-2.5 font-semibold">Hipótese do ciclo de vida · Modigliani</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-[var(--t1)] tracking-tight font-[var(--mono)]">{fmt(sustainableDaily)}</span>
          <span className="text-sm text-[var(--t2)]">/dia</span>
        </div>
        <div className="text-[11.5px] text-[var(--t2)] mt-2 leading-relaxed">Baseado no patrimônio atual, renda projetada e passivos futuros — valor que não compromete o seu eu de 85 anos.</div>
      </div>

    </div>
  );
};
