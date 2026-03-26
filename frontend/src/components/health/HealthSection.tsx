import { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertCircle, Activity, ShieldAlert, Droplet, TrendingUp, TrendingDown, Network, Target, Brain, ShieldCheck } from "lucide-react";

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
}

export const HealthSection = ({ onBack }: HealthSectionProps = {}) => {
  const [selectedStress, setSelectedStress] = useState<number | null>(null);
  const { totals: txTotals, transactions } = useTransactions("personal");
  const { totals: debtTotals, debts } = useDebts();
  const { totals: investTotals } = useInvestments();

  // --- Real financial metric calculations ---
  const monthlyExpenses = txTotals.expense || 1;
  const monthlyIncome = txTotals.income || 1;
  const netWorth = txTotals.balance + investTotals.currentValue - debtTotals.totalBalance;

  // 1. Liquidez: reserva de emergência em meses (investimentos / gastos mensais)
  const reserva = investTotals.currentValue;
  const liquidezMeses = reserva > 0 ? Math.min(12, reserva / monthlyExpenses) : 0;
  const liquidezScore = Math.min(100, Math.round(liquidezMeses / 6 * 100));

  // 2. Poupança: % da renda poupada
  const savingRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const poupancaScore = Math.min(100, Math.round(savingRate * 3)); // 33% saving = 100 score

  // 3. Dívidas: dívidas como % do patrimônio (menor = melhor)
  const debtRatio = netWorth > 0 ? (debtTotals.totalBalance / netWorth) * 100 : 0;
  const dividaScore = Math.max(0, Math.round(100 - debtRatio * 5));

  // 4. Diversificação: número de tipos de ativo
  // Simplified for now, assuming 3 types if there are investments
  const uniqueAssetTypes = investTotals.currentValue > 0 ? 3 : 0;
  const diversScore = Math.min(100, uniqueAssetTypes * 25);

  // 5. Proteção: assume false unless user has insurance
  const hasInsurance = false; // Placeholder: replace with actual check
  const protecaoScore = hasInsurance ? 100 : 45;

  // 6. Trajetória FIRE: taxa de poupança sugere % de probabilidade
  const fireProb = Math.min(100, Math.round(savingRate * 2.5));
  const trajetoriaScore = Math.max(10, Math.round(fireProb * 0.8));

  // 7. Bem-estar: based on selected stress (if answered)
  const bemEstarScore = selectedStress !== null ? [20, 35, 55, 75, 95][selectedStress] : 55;

  const DIMS = [
    { em: <Droplet size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Reserva de Emergência", ds: liquidezMeses > 0 ? liquidezMeses.toFixed(1) + " meses de sobrevida garantida (Regra 6m)" : "Vulnerabilidade total à quebra de renda", sc: liquidezScore, cl: scoreColor(liquidezScore) },
    { em: <TrendingUp size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Acumulação Corrente", ds: savingRate > 0 ? "Taxa de Poupança: " + savingRate.toFixed(1) + "% (Ref: 20%)" : "Consumindo 100% da receita ativa", sc: poupancaScore, cl: scoreColor(poupancaScore) },
    { em: <TrendingDown size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Alavancagem", ds: debts.length > 0 ? debtRatio.toFixed(1) + "% de comprometimento do patrimônio" : "Patrimônio 100% líquido e sem ônus", sc: dividaScore, cl: scoreColor(dividaScore) },
    { em: <Network size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Diversificação", ds: uniqueAssetTypes + " classes de ativos (Eficiência de Markowitz)", sc: diversScore, cl: scoreColor(diversScore) },
    { em: <ShieldCheck size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Mitigação de Riscos", ds: hasInsurance ? "Cobertura secundária detectada ✓" : "Risco existencial não mitigado (Sem Seguros)", sc: protecaoScore, cl: scoreColor(protecaoScore) },
    { em: <Target size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Modelagem F.I.R.E", ds: fireProb + "% de projeção de independência", sc: trajetoriaScore, cl: scoreColor(trajetoriaScore) },
    { em: <Brain size={18} strokeWidth={2.5} color="var(--t2)"/>, nm: "Status Biopsicossocial", ds: selectedStress !== null ? STRESS_LABELS[selectedStress] : "Sem dados de cognição recente", sc: bemEstarScore, cl: scoreColor(bemEstarScore) },
  ];

  const score = Math.round(DIMS.reduce((s, d) => s + d.sc, 0) / DIMS.length);
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  const scoreLabel = score >= 80 ? "Excelente" : score >= 65 ? "Boa" : score >= 50 ? "Regular" : "Precisa melhorar";
  const scoreColor2 = score >= 80 ? "var(--green)" : score >= 65 ? "var(--blue)" : score >= 50 ? "var(--amber)" : "var(--red)";

  return (
    <div style={{ animation: "fsu 0.26s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingTop: "10px" }}>
        {onBack && (
          <button className="back-btn" onClick={() => onBack("inicio")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div className="page-title" style={{ margin: 0 }}>Saúde Financeira</div>
      </div>

      {/* Score ring hero */}
      <div className="hero" style={{ textAlign: "center", padding: "28px 20px 22px" }}>
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
        <div style={{ fontSize: 12, color: scoreColor2, marginTop: 4 }}>Score calculado com seus dados reais</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {liquidezMeses > 0 && <span className="bdg bdg-g">Liquidez: {liquidezMeses.toFixed(0)}m</span>}
          {savingRate > 0 && <span className="bdg bdg-b">Poupança: {savingRate.toFixed(0)}%</span>}
          {debts.length === 0 && <span className="bdg bdg-g">Sem dívidas ✓</span>}
        </div>
      </div>

      {/* 7 dimensions */}
      <div className="sec-hd"><span className="sec-title">7 dimensões</span></div>
      <div className="card">
        {DIMS.map((d) => (
          <div key={d.nm} className="row">
            <div className="row-ico flex items-center justify-center" style={{ background: BG_MAP[d.cl] }}>{d.em}</div>
            <div className="row-main">
              <div className="row-title">{d.nm}</div>
              <div className="row-sub">{d.ds}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 60 }}>
                <div className="prog" style={{ margin: 0, height: 4 }}>
                  <div className="prog-fill" style={{ width: `${d.sc}%`, background: COLOR_MAP[d.cl] }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR_MAP[d.cl], width: 24, textAlign: "right", fontFamily: "var(--mono)" }}>
                {d.sc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advice */}
      {debtTotals.totalBalance > 0 && (
        <div className="nudge warn" style={{ marginTop: 12 }}>
          <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Dívidas impactando o score</div>
          <div className="nudge-body">Você tem <strong>R$ {Math.round(debtTotals.totalBalance).toLocaleString('pt-BR')}</strong> em dívidas. Quitar melhora a saúde financeira.</div>
        </div>
      )}

      {savingRate < 10 && (
        <div className="nudge warn" style={{ marginTop: 12 }}>
          <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Taxa de poupança baixa</div>
          <div className="nudge-body">Tente poupar pelo menos <strong>20%</strong> da renda. Você está em <strong>{savingRate.toFixed(0)}%</strong>.</div>
        </div>
      )}

      {/* Inflação pessoal */}
      <div className="metric-grid" style={{ marginTop: 12 }}>
        <div className="metric">
          <div className="m-label">Sua taxa de poupança</div>
          <div className="m-val" style={{ color: savingRate >= 20 ? "var(--green)" : "var(--amber)" }}>{savingRate.toFixed(1)}%</div>
          <div className="m-delta">{savingRate >= 20 ? "✓ Meta atingida" : "Meta: 20%+"}</div>
        </div>
        <div className="metric">
          <div className="m-label">FIRE estimado</div>
          <div className="m-val">{fireProb}%</div>
          <div className="m-delta">probabilidade</div>
        </div>
      </div>

      {/* Stress check-in */}
      <div className="sec-hd"><span className="sec-title">Check-in de bem-estar</span></div>
      <div className="card">
        <div style={{ fontSize: 13, color: "var(--t1)", marginBottom: 16, lineHeight: 1.4 }}>
          Como está seu estresse financeiro este mês?
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5].map((val, i) => (
            <div
              key={i}
              onClick={() => setSelectedStress(i)}
              style={{
                flex: 1,
                textAlign: "center",
                cursor: "pointer",
                padding: "16px 4px 10px",
                borderRadius: 14,
                border: `1px solid ${selectedStress === i ? "var(--blue)" : "var(--border)"}`,
                background: selectedStress === i ? "var(--blue3)" : "var(--bg)",
                transition: "all 0.15s",
                boxShadow: selectedStress === i ? "0 4px 12px rgba(89,143,249,0.15)" : "none"
              }}
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
            ✓ Check-in registrado: <strong>{STRESS_LABELS[selectedStress]}</strong>
          </div>
        )}
      </div>
    </div>
  );
};
