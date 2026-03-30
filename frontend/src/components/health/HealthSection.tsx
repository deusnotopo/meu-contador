import { useState } from "react";
import type { TabType } from "@/types/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { ArrowLeft, Droplet, TrendingUp, TrendingDown, Network, Target, Brain, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";

import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";

const STRESS_LABELS = ["Crítico (Ansiedade)", "Alto (Desconforto)", "Moderado", "Leve", "Tranquilidade Plena"];
const COLOR_MAP: Record<string, string> = { g: "var(--green)", b: "var(--blue)", a: "var(--amber)", r: "var(--red)" };
const BG_MAP: Record<string, string> = { g: "var(--green-d)", b: "var(--blue3)", a: "var(--amber-d)", r: "var(--red-d)" };

function scoreColor(s: number) {
  if (s >= 80) return "g";
  if (s >= 60) return "b";
  if (s >= 40) return "a";
  return "r";
}

interface HealthSectionProps {
  onBack?: (tab: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

interface HealthDimension {
  em: JSX.Element;
  nm: string;
  ds: string;
  sc: number;
  cl: string;
}

export const HealthSection = ({ onBack, onNavigate }: HealthSectionProps = {}) => {
  const [selectedStress, setSelectedStress] = useState<number | null>(null);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  const { transactions, totals: txTotals } = useTransactions("personal");
  const { debts, totals: debtTotals } = useDebts();
  const { assets, totals: investTotals } = useInvestments();

  // --- Real financial metric calculations ---
  const monthlyExpenses = txTotals.expense || (transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)) || 1;
  const monthlyIncome = txTotals.income || (transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)) || 1;
  const netWorth = txTotals.balance + investTotals.currentValue - debtTotals.totalBalance;

  // --- Persistence for Stress ---
  useState(() => {
    const saved = localStorage.getItem("health_stress_index");
    if (saved !== null && selectedStress === null) {
      setSelectedStress(parseInt(saved));
    }
    return null;
  });

  const handleSetStress = (val: number) => {
    setSelectedStress(val);
    localStorage.setItem("health_stress_index", val.toString());
  };

  // 1. Liquidez — com validação NaN/Infinity
  const reserva = investTotals.currentValue;
  const safeMonthlyExpenses = monthlyExpenses > 0 && isFinite(monthlyExpenses) ? monthlyExpenses : 1;
  const liquidezMeses = reserva > 0 ? Math.min(12, reserva / safeMonthlyExpenses) : 0;
  const liquidezScore = isFinite(liquidezMeses) ? Math.min(100, Math.round(liquidezMeses / 6 * 100)) : 0;

  // 2. Poupança — com validação NaN/Infinity
  const safeMonthlyIncome = monthlyIncome > 0 && isFinite(monthlyIncome) ? monthlyIncome : 1;
  const savingRate = ((safeMonthlyIncome - safeMonthlyExpenses) / safeMonthlyIncome) * 100;
  const poupancaScore = isFinite(savingRate) ? Math.max(0, Math.min(100, Math.round(savingRate * 3))) : 0;

  // 3. Dívidas — com validação NaN/Infinity
  const debtRatio = netWorth > 0 && isFinite(netWorth) 
    ? (debtTotals.totalBalance / netWorth) * 100 
    : (debtTotals.totalBalance > 0 ? 100 : 0);
  const dividaScore = isFinite(debtRatio) ? Math.max(0, Math.round(100 - debtRatio * 5)) : 0;

  // 4. Diversificação — Real logic based on asset types
  const assetTypes = new Set(assets.filter(a => a.amount > 0).map(a => a.type));
  const uniqueAssetTypes = assetTypes.size;
  const diversScore = Math.min(100, uniqueAssetTypes * 25);

  // 5. Proteção — Real logic based on transaction keywords
  const insuranceKeywords = ["seguro", "unimed", "bradesco saude", "sulamerica", "previdência", "porto seguro"];
  const hasInsurance = transactions.some(t => 
    insuranceKeywords.some(k => 
      (t.description || "").toLowerCase().includes(k) || 
      (t.category || "").toLowerCase().includes(k)
    )
  );
  const protecaoScore = hasInsurance ? 100 : 45;

  // 6. Trajetória F.I.R.E — com validação NaN/Infinity
  const fireProb = isFinite(savingRate) ? Math.max(0, Math.min(100, Math.round(savingRate * 2.5))) : 0;
  const trajetoriaScore = isFinite(fireProb) ? Math.max(10, Math.round(fireProb * 0.8)) : 0;

  // 7. Bem-estar
  const bemEstarScore = selectedStress !== null ? ([20, 35, 55, 75, 95][selectedStress] ?? 55) : 55;

  const getAction = (dim: string, score: number) => {
    if (score >= 80) return { title: "Excelente! Manutenção sugerida", text: "Continue com a estratégia atual. Você está no quartil superior nesta métrica.", act: "" };
    switch(dim) {
      case "Reserva de Emergência":
        return { title: "Crie um colchão de liquidez", text: "Você precisa guardar de 6 a 12 meses do seu custo mensal. Comece cortando gastos não essenciais.", act: "investments", actText: "Ver Investimentos" };
      case "Acumulação Corrente":
        return { title: "Aumente sua taxa de poupança", text: "O ideal é poupar 20% ou mais da sua renda. Tente usar a regra 50-30-20.", act: "planning", actText: "Ajustar Orçamento" };
      case "Alavancagem":
        return { title: "Riscos de endividamento", text: "Priorize quitar dívidas com juros altos (cartão, cheque especial) antes de investir.", act: "debts", actText: "Gerenciar Dívidas" };
      case "Diversificação":
        return { title: "Espalhe o risco", text: "Sua carteira está concentrada. Busque alocar em renda fixa, ETFs globais e fundos imobiliários.", act: "investments", actText: "Explorar Ativos" };
      case "Mitigação de Riscos":
        return { title: "Seguro de vida e saúde", text: "Proteger seu patrimônio contra imprevistos de saúde ou fatalidades é essencial para não quebrar.", act: "insurance_planner", actText: "Planejar Seguros" };
      case "Modelagem F.I.R.E":
        return { title: "Rever matemática da aposentadoria", text: "Com o ritmo atual, sua aposentadoria não está garantida. Faça simulações para ver onde cortar.", act: "retire_fire", actText: "Calculadora F.I.R.E" };
      case "Status Biopsicossocial":
        return { title: "Estresse Financeiro", text: "Faça o check-in de bem-estar abaixo regularmente. A ansiedade pode boicotar bons investimentos.", act: "", actText: "" };
      default: return { title: "", text: "", act: "" };
    }
  };

  const DIMS: HealthDimension[] = [
    { em: <Droplet size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Reserva de Emergência", ds: liquidezMeses > 0 ? liquidezMeses.toFixed(1) + " meses de sobrevida" : "Em risco", sc: liquidezScore, cl: scoreColor(liquidezScore) },
    { em: <TrendingUp size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Acumulação Corrente", ds: savingRate > 0 ? "Poupança: " + savingRate.toFixed(1) + "%" : "Renda consumida", sc: poupancaScore, cl: scoreColor(poupancaScore) },
    { em: <TrendingDown size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Alavancagem", ds: debts.length > 0 ? debtRatio.toFixed(1) + "% comprometido" : "Zero dívidas", sc: dividaScore, cl: scoreColor(dividaScore) },
    { em: <Network size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Diversificação", ds: uniqueAssetTypes + " classes de ativos", sc: diversScore, cl: scoreColor(diversScore) },
    { em: <ShieldCheck size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Mitigação de Riscos", ds: hasInsurance ? "Cobertura OK" : "Sem seguros conhecidos", sc: protecaoScore, cl: scoreColor(protecaoScore) },
    { em: <Target size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Modelagem F.I.R.E", ds: fireProb + "% de chance de IF", sc: trajetoriaScore, cl: scoreColor(trajetoriaScore) },
    { em: <Brain size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Status Biopsicossocial", ds: selectedStress !== null ? (STRESS_LABELS[selectedStress] || "Dados insuficientes") : "Dados insuficientes", sc: bemEstarScore, cl: scoreColor(bemEstarScore) },
  ];

  const score = Math.round(DIMS.reduce((s, d) => s + d.sc, 0) / DIMS.length);
  const historyPoints = [
    Math.max(0, Math.round(score - 9)),
    Math.max(0, Math.round(score - 5)),
    Math.max(0, Math.round(score - 2)),
    score,
  ];
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  const scoreLabel = score >= 80 ? "Excelente" : score >= 65 ? "Boa" : score >= 50 ? "Regular" : "Precisa melhorar";
  const scoreColor2 = score >= 80 ? "var(--green)" : score >= 65 ? "var(--blue)" : score >= 50 ? "var(--amber)" : "var(--red)";

  return (
    <div style={{ animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingTop: "10px" }}>
        {onBack && (
          <button className="back-btn" onClick={() => onBack("inicio")}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Score 360°</div>
          <div className="page-title" style={{ margin: 0 }}>Saúde Financeira</div>
        </div>
        <AreaTutorialButton area="futuro" onNavigate={onNavigate} />
      </div>

      {/* Score ring */}
      <div className="hero" style={{ textAlign: "center", padding: "28px 20px 22px", marginBottom: 16 }}>
        <svg style={{ width: 140, height: 140, margin: "0 auto 16px" }} viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="11" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="url(#sg-health)"
            strokeWidth="11"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
          <defs>
            <linearGradient id="sg-health" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4A8BFF" />
              <stop offset="100%" stopColor="#00D991" />
            </linearGradient>
          </defs>
          <text x="70" y="64" textAnchor="middle" fontSize="32" fontWeight="700" fill="#F0F4FF" fontFamily="DM Mono">
            {score}
          </text>
          <text x="70" y="81" textAnchor="middle" fontSize="11" fill="#8899C4" fontFamily="DM Sans">
            de 100
          </text>
        </svg>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--t1)" }}>Saúde financeira {scoreLabel.toLowerCase()}</div>
        <div style={{ fontSize: 12, color: scoreColor2, marginTop: 4 }}>Score calculado dinamicamente base nos seus dados</div>
        <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 8, lineHeight: 1.5 }}>
          O score é heurístico e orientativo. Ele ajuda a priorizar ações, mas não substitui planejamento financeiro profissional.
        </div>
      </div>

      {/* Histórico orientativo */ }
      <div className="sec-hd"><span className="sec-title">Evolução do Score</span></div>
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        {historyPoints.map((v, i, arr) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: i === arr.length - 1 ? 'var(--blue)' : 'var(--t3)', fontWeight: i === arr.length - 1 ? 700 : 500 }}>{v}</div>
            <div style={{ width: '100%', height: v * 0.8, background: i === arr.length - 1 ? 'var(--blue)' : 'var(--glass2)', borderRadius: '4px 4px 0 0', opacity: i === arr.length - 1 ? 1 : 0.6 }} />
          </div>
        ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 10, lineHeight: 1.5 }}>
          Sequência estimada com base na fotografia atual dos seus dados. Quando houver histórico persistido, esta faixa passará a mostrar evolução real por período.
        </div>
      </div>

      <div className="sec-hd"><span className="sec-title">7 Dimensoẽs (Toque p/ ações)</span></div>
      <div className="card">
        {DIMS.map((d) => (
          <div key={d.nm} style={{ borderBottom: "1px solid var(--border)", paddingBottom: expandedDim === d.nm ? 16 : 0, marginBottom: expandedDim === d.nm ? 16 : 0, transition: 'all 0.2s' }}>
            <div className="row" style={{ cursor: "pointer", borderBottom: "none", marginBottom: 0, paddingBottom: 12 }} onClick={() => setExpandedDim(expandedDim === d.nm ? null : d.nm)}>
              <div className="row-ico flex items-center justify-center" style={{ background: BG_MAP[d.cl] }}>{d.em}</div>
              <div className="row-main">
                <div className="row-title">{d.nm}</div>
                <div className="row-sub">{d.ds}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLOR_MAP[d.cl], width: 28, textAlign: "right", fontFamily: "var(--mono)" }}>
                  {d.sc}
                </div>
                <ChevronDown size={14} color="var(--t3)" style={{ transform: expandedDim === d.nm ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }} />
              </div>
            </div>

            {/* Accordion content with AI Recommendation */}
            {expandedDim === d.nm && (() => {
              const action = getAction(d.nm, d.sc);
              return (
                <div style={{ marginTop: 8, padding: "12px", background: "var(--glass1)", borderRadius: "10px", borderLeft: `3px solid ${COLOR_MAP[d.cl]}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLOR_MAP[d.cl], marginBottom: 4 }}>Diagnóstico & Ação</div>
                  <div style={{ fontSize: 13, color: "var(--t1)", lineHeight: 1.4 }}>
                    <strong>{action.title}:</strong> {action.text}
                  </div>
                  {action.act && d.sc < 80 && (
                    <button className="btn-secondary" style={{ marginTop: 12, width: '100%', padding: '8px', fontSize: 12 }} onClick={() => onNavigate?.(action.act as any)}>
                      {action.actText} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
        {/* Fix empty border on last element */}
        <div style={{ height: 16 }} />
      </div>

      {/* Stress check-in */}
      <div className="sec-hd"><span className="sec-title">Check-in Biopsicossocial</span></div>
      <div className="card">
        <div style={{ fontSize: 13, color: "var(--t1)", marginBottom: 16, lineHeight: 1.4 }}>
          A ansiedade financeira reduz a capacidade cognitiva. Como você está se sentindo ao olhar suas contas hoje?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(62px, 1fr))", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((val, i) => (
            <div
              key={i}
              onClick={() => handleSetStress(i)}
              style={{ flex: 1, textAlign: "center", cursor: "pointer", padding: "16px 4px 10px", borderRadius: 14, border: `1px solid ${selectedStress === i ? "var(--blue)" : "var(--border)"}`, background: selectedStress === i ? "var(--blue3)" : "var(--bg)", transition: "all 0.15s", boxShadow: selectedStress === i ? "0 4px 12px rgba(89,143,249,0.15)" : "none" }}
            >
              <div style={{ fontSize: 18, color: selectedStress === i ? "var(--blue)" : "var(--t3)", fontWeight: 800 }}>M{val}</div>
              <div style={{ fontSize: 9, color: selectedStress === i ? "var(--t1)" : "var(--t3)", marginTop: 6, lineHeight: 1.2, fontWeight: selectedStress === i ? 700 : 500 }}>
                {STRESS_LABELS[i]}
              </div>
            </div>
          ))}
        </div>
        {selectedStress !== null && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--t2)", textAlign: "center" }}>
            ✓ Check-in registrado: <strong>{STRESS_LABELS[selectedStress]}</strong>. Impacto visualizado no seu Score 360°.
          </div>
        )}
      </div>
    </div>
  );
};
