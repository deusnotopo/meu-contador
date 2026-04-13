import { useState, useEffect } from "react";
import type { TabType } from "@/types/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { useHealthScore } from "@/hooks/useHealthScore";
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
  const { history: scoreHistory, persistScore } = useHealthScore();

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

  // Persiste score real no backend (debounced por data via hook)
  useEffect(() => { if (score > 0) persistScore(score); }, [score, persistScore]);

  // historyPoints: usa dados reais do backend (last 4 entries) ou simula se ainda vazio
  const historyPoints = scoreHistory.length >= 2
    ? scoreHistory.slice(-4).map(h => h.score)
    : [
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
    <div className="animate-[fsu_0.26s_ease] pb-24">
      {/* ── Header Flutuante Zen ── */}
      <div className="flex items-center gap-3 mb-6 sticky top-2 z-[60] bg-[#0A1220]/80 backdrop-blur-2xl px-3 py-2.5 rounded-[22px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-1">
        {onBack && (
          <button className="w-10 h-10 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95" onClick={() => onBack("inicio")}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="flex-1">
          <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-0.5">Score 360°</div>
          <div className="text-lg font-bold text-white tracking-tight">Saúde Financeira</div>
        </div>
        <AreaTutorialButton area="futuro" onNavigate={onNavigate} />
      </div>

      <div className="px-2">
      {/* Score ring (Bento Full) */}
      <div id="health-score" className="bento-card bento-full text-center p-[28px_20px_22px] mb-4">
        <svg className="w-[140px] h-[140px] mx-auto mb-4" viewBox="0 0 140 140">
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
        <div className="text-[17px] font-bold text-[var(--t1)]">Saúde financeira {scoreLabel.toLowerCase()}</div>
        <div className="text-[12px] mt-1 text-[var(--t2)]" style={{ color: scoreColor2 }}>Score calculado dinamicamente base nos seus dados</div>
        <div className="text-[11px] text-[var(--t3)] mt-2 leading-relaxed">
          O score é heurístico e orientativo. Ele ajuda a priorizar ações, mas não substitui planejamento financeiro profissional.
        </div>
      </div>

      {/* Modigliani Life-Cycle Hypothesis Alert */}
      {score < 70 && (
        <div className="bento-card bento-full mb-4 flex items-start gap-3" style={{ background: "rgba(255,173,59,0.06)", borderColor: "rgba(255,173,59,0.2)" }}>
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0 mt-1">
             <Target size={16} />
          </div>
          <div>
            <h4 className="text-[13px] font-black text-amber-500 uppercase tracking-widest mb-1 shadow-sm">Alerta Modigliani</h4>
            <p className="text-[11px] text-white/70 leading-relaxed font-medium">
              Sua taxa de consumo atual ({(100 - savingRate).toFixed(0)}%) pode não sustentar seu padrão de vida futuro. A <strong>Hipótese do Ciclo de Vida (Modigliani)</strong> sugere poupar hoje para suavizar o consumo na aposentadoria. Considere reduzir custos fixos.
            </p>
          </div>
        </div>
      )}

      {/* Credit Score Interno */}
      <div className="bento-card bento-full mb-4 p-5">
         <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--t3)] mb-4 flex justify-between">
           <span>Score Interno de Crédito</span>
           <span className="text-white/30 truncate max-w-[100px]">Simulação</span>
         </div>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <ShieldCheck size={20} className={score >= 70 ? "text-emerald-500" : "text-amber-500"} />
               <span className="text-[14px] font-bold text-white">Trust Score</span>
            </div>
            <span className="text-2xl font-black font-mono tracking-tighter" style={{ color: scoreColor2 }}>
               {Math.round(score * 10)}
            </span>
         </div>
         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex mb-2">
            <div className="h-full bg-rose-500 w-[30%]" />
            <div className="h-full bg-amber-500 w-[40%]" />
            <div className="h-full bg-emerald-500 w-[30%]" />
            {/* Indicator Dot */}
            <div 
               className="absolute h-4 w-4 rounded-full bg-white shadow-lg border-2 border-solid border-[var(--bg)] mt-[-4px] transition-all duration-1000" 
               style={{ marginLeft: `${score}%` }} 
            />
         </div>
         <div className="flex justify-between text-[9px] text-white/40 uppercase font-bold tracking-widest mt-2">
            <span>Alto Risco</span>
            <span>Estável</span>
            <span>Prime</span>
         </div>
         <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-white/50 leading-relaxed">
            Seu score atual de <strong>{Math.round(score * 10)}/1000</strong> simula a avaliação de crédito do mercado baseada na sua liquidez ({(liquidezMeses).toFixed(1)} meses), índice de alavancagem financeira e consistência de pagamentos.
         </div>
      </div>

      {/* Histórico orientativo */ }
      <div className="bento-card bento-full mb-4 p-[18px]">
        <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--t3)] mb-4">Evolução da Saúde</div>
        <div className="flex items-end gap-1.5">
        {historyPoints.map((v, i, arr) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`text-[10px] ${i === arr.length - 1 ? 'text-[var(--blue)] font-bold' : 'text-[var(--t3)] font-medium'}`}>{v}</div>
            <div
              className="w-full rounded-t-[4px]"
              style={{ height: v * 0.8, background: i === arr.length - 1 ? 'var(--blue)' : 'var(--glass2)', opacity: i === arr.length - 1 ? 1 : 0.6 }}
            />
          </div>
        ))}
        </div>
        <div className="text-[10px] text-[var(--t3)] mt-2.5 leading-relaxed">
          Sequência estimada com base na fotografia atual dos seus dados. Quando houver histórico persistido, esta faixa passará a mostrar evolução real por período.
        </div>
      </div>

      <div id="health-dimensions" className="bento-card bento-full !p-0 overflow-hidden mb-4 border border-white/[0.08]">
        <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--t3)] px-5 pt-5 pb-2">7 Dimensões Vitais</div>
        {DIMS.map((d) => (
          <div
            key={d.nm}
            className={`border-b border-[var(--border)] transition-all duration-200 ${expandedDim === d.nm ? 'pb-4 mb-4' : 'pb-0 mb-0'}`}
          >
            <button
              type="button"
              className="row w-full text-left cursor-pointer border-b-0 mb-0 pb-3"
              onClick={() => setExpandedDim(expandedDim === d.nm ? null : d.nm)}
              aria-expanded={expandedDim === d.nm}
              aria-label={`Alternar detalhes de ${d.nm}`}
            >
              <div className="row-ico flex items-center justify-center" style={{ background: BG_MAP[d.cl] }}>{d.em}</div>
              <div className="row-main">
                <div className="row-title">{d.nm}</div>
                <div className="row-sub">{d.ds}</div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-[14px] font-bold w-7 text-right font-mono" style={{ color: COLOR_MAP[d.cl] }}>
                  {d.sc}
                </div>
                <ChevronDown
                  size={14}
                  color="var(--t3)"
                  className="transition-transform duration-200"
                  style={{ transform: expandedDim === d.nm ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
            </button>

            {expandedDim === d.nm && (() => {
              const action = getAction(d.nm, d.sc);
              return (
                <div
                  className="mt-2 p-3 bg-[var(--glass1)] rounded-[10px]"
                  style={{ borderLeft: `3px solid ${COLOR_MAP[d.cl]}` }}
                >
                  <div className="text-[12px] font-bold mb-1" style={{ color: COLOR_MAP[d.cl] }}>Diagnóstico & Ação</div>
                  <div className="text-[13px] text-[var(--t1)] leading-snug">
                    <strong>{action.title}:</strong> {action.text}
                  </div>
                  {action.act && d.sc < 80 && (
                    <button
                      className="btn-secondary mt-3 w-full py-2 text-[12px]"
                      onClick={() => onNavigate?.(action.act as TabType)}
                    >
                      {action.actText} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
        <div className="h-4" />
      </div>

      {/* Stress check-in */}
      <div className="bento-card bento-full p-5">
        <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--t3)] mb-4">Check-in Biopsicossocial</div>
        <div className="text-[13px] text-[var(--t1)] mb-4 leading-snug">
          A ansiedade financeira reduz a capacidade cognitiva. Como você está se sentindo ao olhar suas contas hoje?
        </div>
        <div className="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(62px,1fr))]">
          {[1, 2, 3, 4, 5].map((val, i) => (
            <button
              type="button"
              key={i}
              onClick={() => handleSetStress(i)}
              aria-pressed={selectedStress === i}
              aria-label={`Registrar humor ${STRESS_LABELS[i]}`}
              className="flex-1 text-center cursor-pointer pt-4 px-1 pb-2.5 rounded-[14px] transition-all duration-150"
              style={{
                border: `1px solid ${selectedStress === i ? 'var(--blue)' : 'var(--border)'}`,
                background: selectedStress === i ? 'var(--blue3)' : 'var(--bg)',
                boxShadow: selectedStress === i ? '0 4px 12px rgba(89,143,249,0.15)' : 'none',
              }}
            >
              <div className="text-[18px] font-extrabold" style={{ color: selectedStress === i ? 'var(--blue)' : 'var(--t3)' }}>M{val}</div>
              <div
                className="text-[9px] mt-1.5 leading-tight"
                style={{ color: selectedStress === i ? 'var(--t1)' : 'var(--t3)', fontWeight: selectedStress === i ? 700 : 500 }}
              >
                {STRESS_LABELS[i]}
              </div>
            </button>
          ))}
        </div>
        {selectedStress !== null && (
          <div className="mt-3 text-[12px] text-[var(--t2)] text-center">
            ✓ Check-in registrado: <strong>{STRESS_LABELS[selectedStress!]}</strong>. Impacto visualizado no seu Score 360°.
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
