import { useState } from "react";
import type { TabType } from "@/types/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/formatters";
import { ArrowLeft, TrendingUp, Zap, Loader2 } from "lucide-react";
import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";
import { useRetirement } from "@/hooks/useRetirement";

interface RetirementViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

// Lógica de cálculo transferida para `useRetirement` hook

// ── SVG projection chart ──────────────────────────────────
function ProjectionChart({ series, years }: {
  series: { label: string; color: string; data: number[] }[];
  years: number;
}) {
  const W = 320, H = 150, PAD = { l: 38, r: 12, t: 10, b: 22 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const allValues = series.flatMap(s => s.data);
  const maxV = Math.max(...allValues);
  const minV = 0;

  const toX = (i: number) => PAD.l + (i / years) * chartW;
  const toY = (v: number) => PAD.t + chartH - ((v - minV) / (maxV - minV || 1)) * chartH;

  const fmtY = (v: number) => v >= 1e6 ? `R$${(v / 1e6).toFixed(1)}M` : `R$${Math.round(v / 1e3)}k`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => minV + f * (maxV - minV));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`ag${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
          <text x={PAD.l - 4} y={toY(v) + 4} fontSize="7" fill="rgba(138,151,180,0.6)"
            textAnchor="end" fontFamily="JetBrains Mono">
            {fmtY(v)}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {[0, Math.round(years / 4), Math.round(years / 2), Math.round(years * 3 / 4), years].map((yr, i) => (
        <text key={i} x={toX(yr)} y={H - 4} fontSize="7" fill="rgba(138,151,180,0.55)"
          textAnchor="middle" fontFamily="JetBrains Mono">
          {new Date().getFullYear() + yr}
        </text>
      ))}

      {/* Series */}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" L ");
        const areaPath = `M ${toX(0)},${toY(0)} L ${pts} L ${toX(years)},${toY(0)} Z`;
        return (
          <g key={si}>
            <path d={`M ${pts}`} fill="none" stroke={s.color} strokeWidth={si === 1 ? 2 : 1.5}
              strokeLinecap="round" strokeDasharray={si === 0 ? "none" : si === 2 ? "5 3" : "none"} />
            <path d={areaPath} fill={`url(#ag${si})`} />
          </g>
        );
      })}
    </svg>
  );
}

export const RetirementView = ({ onBack, onNavigate }: RetirementViewProps) => {
  const { user } = useAuth();
  const { totals: invTotals, loading: invLoading } = useInvestments();
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: debtTotals, isLoading: debtLoading } = useDebts();

  const isLoading = invLoading || personal.isLoading || business.isLoading || debtLoading;

  const [currentAge, setCurrentAge] = useState((user as any)?.age || 30);
  const [retireAge, setRetireAge] = useState((user as any)?.retirementAge || 60);
  const [monthlyContribution, setMonthlyContribution] = useState(
    Math.round(((user as any)?.monthlyIncome || 0) * 0.15) || 1500
  );
  const [expectedReturnPct, setExpectedReturnPct] = useState(7);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(
    Math.round(((user as any)?.monthlyIncome || 0) * 0.8) || 10000
  );

  // Real data
  const trueNetWorth = Math.max(0,
    (personal.totals.balance + business.totals.balance + invTotals.currentValue) - debtTotals.totalBalance
  );
  const {
    yearsToRetire,
    fireTarget,
    futureValue,
    isOnTrack,
    progressToTarget,
    progressColor,
    chartSeries,
    milestones,
    sensitivity
  } = useRetirement({
    currentAge,
    retireAge,
    monthlyContribution,
    expectedReturnPct,
    targetMonthlyIncome,
    currentNetWorth: trueNetWorth
  });

  if (isLoading) {
    return (
      <div style={{ paddingTop: "10px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button className="back-btn" onClick={() => onBack?.()}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Projeção FIRE</div>
            <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Aposentadoria</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12, color: "var(--t3)" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Carregando dados financeiros...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => onBack?.()}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Projeção FIRE</div>
          <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Aposentadoria</div>
        </div>
        <AreaTutorialButton area="futuro" onNavigate={onNavigate} />
      </div>

      {/* Hero card */}
      <div className="hero" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>
              Patrimônio estimado aos {retireAge} anos
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: isOnTrack ? "var(--green)" : "var(--blue)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>
              {formatCurrency(futureValue)}
            </div>
            <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 4 }}>
              Meta FIRE: {formatCurrency(fireTarget)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>
              Progresso
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: progressColor, fontFamily: "var(--mono)" }}>
              {Math.round(progressToTarget)}%
            </div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>da meta</div>
          </div>
        </div>

        <div className="prog" style={{ height: 8 }}>
          <div className="prog-fill" style={{ width: `${progressToTarget}%`, background: isOnTrack ? "var(--green)" : "linear-gradient(90deg, var(--blue), var(--purple))" }} />
        </div>

        {isOnTrack ? (
          <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8, fontWeight: 500 }}>
            ✅ No caminho certo! Patrimônio supera a meta em {formatCurrency(futureValue - fireTarget)}.
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 8, fontWeight: 500 }}>
            ⚠ Faltam {formatCurrency(fireTarget - futureValue)} para a meta. Aumente o aporte ou a rentabilidade.
          </div>
        )}
      </div>

      {/* Projection chart */}
      <div className="sec-hd"><span className="sec-title">Projeção {yearsToRetire} anos</span></div>
      <div className="card" style={{ padding: "14px 12px 8px" }}>
        {yearsToRetire > 0 ? (
          <>
            <ProjectionChart series={chartSeries} years={yearsToRetire} />
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              {chartSeries.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2, display: "inline-block" }} />
                  <span style={{ fontSize: 10, color: "var(--t3)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--t3)", fontSize: 12 }}>
            Idade objetivo deve ser maior que a idade atual.
          </div>
        )}
      </div>

      {/* Simulator */}
      <div className="sec-hd"><span className="sec-title">Simulador interativo</span></div>
      <div className="card">
        {/* Target Income */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>Renda mensal desejada</span>
            <span style={{ fontSize: 14, color: "var(--green)", fontFamily: "var(--mono)", fontWeight: 700 }}>{formatCurrency(targetMonthlyIncome)}</span>
          </div>
          <input type="range" min="2000" max="50000" step="500" value={targetMonthlyIncome}
            onChange={e => setTargetMonthlyIncome(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--green)" }} />
          <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 3 }}>
            Patrimônio alvo (regra 4%): {formatCurrency(fireTarget)}
          </div>
        </div>

        {/* Monthly contribution */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>Aporte mensal</span>
            <span style={{ fontSize: 14, color: "var(--blue)", fontFamily: "var(--mono)", fontWeight: 700 }}>{formatCurrency(monthlyContribution)}</span>
          </div>
          <input type="range" min="0" max="20000" step="100" value={monthlyContribution}
            onChange={e => setMonthlyContribution(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--blue)" }} />
        </div>

        {/* Ages */}
        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Sua idade", val: currentAge, set: setCurrentAge, min: 18, max: 90 },
            { label: "Aposentadoria", val: retireAge, set: setRetireAge, min: currentAge + 1, max: 100 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label} style={{ flex: 1, background: "var(--glass2)", borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button className="btn-ghost" style={{ padding: "0 10px", height: 32, fontSize: 16 }}
                  onClick={() => set(Math.max(min, val - 1))}>−</button>
                <div style={{ fontSize: 20, fontFamily: "var(--mono)", fontWeight: 700, flex: 1, textAlign: "center" }}>{val}</div>
                <button className="btn-ghost" style={{ padding: "0 10px", height: 32, fontSize: 16 }}
                  onClick={() => set(Math.min(max, val + 1))}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Return rate */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>Rentabilidade real a.a.</span>
            <span style={{ fontSize: 14, color: "var(--purple)", fontFamily: "var(--mono)", fontWeight: 700 }}>{expectedReturnPct}%</span>
          </div>
          <input type="range" min="1" max="15" step="0.5" value={expectedReturnPct}
            onChange={e => setExpectedReturnPct(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--purple)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--t3)", marginTop: 2 }}>
            <span>Poupança (~1%)</span><span>CDI real (~5%)</span><span>Ações (~12%)</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <>
          <div className="sec-hd"><span className="sec-title">Marcos da jornada</span></div>
          <div className="card">
            {milestones.slice(0, 5).map((m, i) => (
              <div key={i} className="row" style={{ borderBottom: i < milestones.length - 1 ? "1px solid var(--border)" : "none", paddingBottom: i < milestones.length - 1 ? 12 : 0, marginBottom: i < milestones.length - 1 ? 12 : 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--glass2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: m.color, fontFamily: "var(--mono)" }}>{m.year}</span>
                </div>
                <div className="row-main">
                  <div className="row-title">{m.label}</div>
                  <div className="row-sub">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sensitivity analysis */}
      <div className="sec-hd"><span className="sec-title">Sensibilidade de aportes</span></div>
      <div className="card">
        <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 12, lineHeight: 1.5 }}>
          Impacto de aumentar o aporte mensal em {yearsToRetire} anos ({expectedReturnPct}% a.a.)
        </div>
        {sensitivity.map(({ extra, total }, i) => (
          <div key={extra} className="row" style={{ borderBottom: i < sensitivity.length - 1 ? "1px solid var(--border)" : "none", paddingBottom: i < sensitivity.length - 1 ? 10 : 0, marginBottom: i < sensitivity.length - 1 ? 10 : 0 }}>
            <div className="row-main">
              <div className="row-title" style={{ fontFamily: "var(--mono)" }}>
                {extra === 0 ? "Plano atual" : `+${formatCurrency(extra)}`}
                {extra > 0 && <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--font)" }}>/mês</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{formatCurrency(total)}</div>
              {extra > 0 && <div style={{ fontSize: 10, color: "var(--green)", fontFamily: "var(--mono)" }}>+{formatCurrency(total - sensitivity[0]!.total)}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Contextual insight */}
      <div className="nudge good" style={{ marginTop: 14 }}>
        <div className="nudge-ttl" style={{ color: "var(--green)" }}>
          💡 O poder dos juros compostos
        </div>
        <div className="nudge-body" style={{ lineHeight: 1.5 }}>
          Você vai contribuir <strong>{formatCurrency(monthlyContribution * (yearsToRetire * 12))}</strong> ao longo de {yearsToRetire} anos.<br /><br />
          Com {expectedReturnPct}% ao ano, o patrimônio chega a <strong>{formatCurrency(futureValue)}</strong>.<br />
          <strong>{Math.max(0, Math.round(((futureValue - (monthlyContribution * (yearsToRetire * 12) + trueNetWorth)) / (futureValue || 1)) * 100))}%</strong> do patrimônio final veio dos juros — não do seu suor!
        </div>
      </div>

      {/* Quick navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button className="btn-ghost" style={{ flex: 1, gap: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => onNavigate?.("retire_fire")}>
          <Zap size={14} /> Calculadora FIRE
        </button>
        <button className="btn-ghost" style={{ flex: 1, gap: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => onNavigate?.("investments")}>
          <TrendingUp size={14} /> Ver Carteira
        </button>
      </div>
    </div>
  );
};
