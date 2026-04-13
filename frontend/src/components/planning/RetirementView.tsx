import { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/formatters";
import { ArrowLeft, TrendingUp, Loader2, Target, Landmark, Flame, ChevronRight, Zap } from "lucide-react";
import { useRetirement } from "@/hooks/useRetirement";
import { motion } from "framer-motion";

// ── FIRE inline calculator ─────────────────────────────────
const WITHDRAWAL_RATE = 0.04;
function calcFireMonths(despesa: number, aporte: number, patrimonioAtual: number, taxaAnual: number): number {
  const meta = (despesa * 12) / WITHDRAWAL_RATE;
  if (patrimonioAtual >= meta) return 0;
  const taxaMes = (1 + taxaAnual / 100) ** (1 / 12) - 1;
  if (aporte <= 0 && taxaMes <= 0) return 9999;
  let pat = patrimonioAtual;
  for (let m = 1; m <= 600; m++) {
    pat = pat * (1 + taxaMes) + aporte;
    if (pat >= meta) return m;
  }
  return 9999;
}
function FireTab({ patrimonioAtual }: { patrimonioAtual: number }) {
  const [despesa, setDespesa] = useState(8000);
  const [aporte, setAporte] = useState(2000);
  const [taxaAnual, setTaxaAnual] = useState(8);

  const meta = useMemo(() => (despesa * 12) / WITHDRAWAL_RATE, [despesa]);
  const meses = useMemo(() => calcFireMonths(despesa, aporte, patrimonioAtual, taxaAnual), [despesa, aporte, patrimonioAtual, taxaAnual]);
  const anos = (meses / 12).toFixed(1);
  const atingivel = meses < 600;
  const progresso = Math.min(100, Math.round((patrimonioAtual / meta) * 100));
  const anoAlvo = new Date().getFullYear() + Math.round(meses / 12);

  const leanMeta = useMemo(() => (despesa * 0.6 * 12) / WITHDRAWAL_RATE, [despesa]);
  const leanMeses = useMemo(() => calcFireMonths(despesa * 0.6, aporte, patrimonioAtual, taxaAnual), [despesa, aporte, patrimonioAtual, taxaAnual]);
  const fatMeta = useMemo(() => (despesa * 1.8 * 12) / WITHDRAWAL_RATE, [despesa]);
  const fatMeses = useMemo(() => calcFireMonths(despesa * 1.8, aporte, patrimonioAtual, taxaAnual), [despesa, aporte, patrimonioAtual, taxaAnual]);

  return (
    <div className="pb-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="future-hero-card mb-3.5">
        <div className="future-hero-top">
          <div className="future-hero-main">
            <div className="future-hero-eyebrow">🔥 Independência Financeira</div>
            <div className="future-hero-value text-[28px]" style={{ color: atingivel ? "var(--amber)" : "var(--t2)" }}>
              {atingivel ? `${anos} anos` : "> 50 anos"}
            </div>
            <div className="future-hero-sub">
              {atingivel ? `Meta em ${anoAlvo} · ${formatCurrency(meta)}` : "Ajuste os parâmetros"}
            </div>
          </div>
          <div className="future-hero-badge bg-[rgba(255,176,0,0.1)] border-[rgba(255,176,0,0.25)]">
            <div className="future-badge-pct text-[var(--amber)]">{progresso}%</div>
            <div className="future-badge-label">do alvo</div>
          </div>
        </div>
        <div className="future-progress-track">
          <motion.div className="future-progress-fill"
            style={{ background: "linear-gradient(90deg,var(--amber),var(--green))" }}
            initial={{ width: 0 }} animate={{ width: `${progresso}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} />
        </div>
        <div className="future-metrics-row mt-2.5">
          {[
            { label: "Alvo", value: meta >= 1e6 ? `R$ ${(meta / 1e6).toFixed(1)}M` : formatCurrency(meta), color: "var(--amber)" },
            { label: "Atual", value: patrimonioAtual >= 1e6 ? `R$ ${(patrimonioAtual / 1e6).toFixed(2)}M` : formatCurrency(patrimonioAtual), color: "var(--blue)" },
            { label: "Retirada", value: `${(WITHDRAWAL_RATE * 100).toFixed(0)}% a.a.`, color: "var(--green)" },
          ].map((m, i) => (
            <div key={i} className="future-metric-pill" style={{ borderColor: `${m.color}22`, background: `${m.color}0D` }}>
              <div className="future-metric-val" style={{ color: m.color }}>{m.value}</div>
              <div className="future-metric-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Simulator */}
      <div className="future-section-title">Simulador — ajuste sua meta</div>
      <div className="future-bento-card">
        {[
          { label: "Despesa mensal desejada", val: despesa, set: setDespesa, min: 2000, max: 30000, step: 500, color: "var(--green)", fmt: formatCurrency, hint: "R$ 2k (Lean) → R$ 30k (Fat FIRE)" },
          { label: "Aporte mensal", val: aporte, set: setAporte, min: 0, max: 20000, step: 100, color: "var(--blue)", fmt: formatCurrency },
          { label: "Rentabilidade real a.a.", val: taxaAnual, set: setTaxaAnual, min: 1, max: 20, step: 0.5, color: "var(--purple)", fmt: (v: number) => `${v}%`, hint: "Poupança (~1%) · CDI real (~5%) · Ações (~12%)" },
        ].map(({ label, val, set, min, max, step, color, fmt, hint }) => (
          <div key={label} className="future-slider-field">
            <div className="future-slider-header">
              <span className="future-slider-label">{label}</span>
              <span className="future-slider-value" style={{ color }}>{fmt(val)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => set(Number(e.target.value))}
              className="future-slider" style={{ "--accent": color } as React.CSSProperties} />
            {hint && <div className="future-slider-hint">{hint}</div>}
          </div>
        ))}
      </div>

      {/* FIRE modalities */}
      <div className="future-section-title">Tipos de FIRE</div>
      {[
        { em: "🥗", nm: "Lean FIRE", color: "var(--green)", meta: leanMeta, meses: leanMeses, desc: `${formatCurrency(Math.round(despesa * 0.6))}/mês · vida simples` },
        { em: "🎯", nm: "Regular FIRE", color: "var(--blue)", meta, meses, desc: `${formatCurrency(despesa)}/mês · você agora`, isActive: true },
        { em: "💎", nm: "Fat FIRE", color: "var(--amber)", meta: fatMeta, meses: fatMeses, desc: `${formatCurrency(Math.round(despesa * 1.8))}/mês · vida premium` },
      ].map(({ em, nm, color, meta: m, meses: ms, desc, isActive }) => {
        const y = (ms / 12).toFixed(1);
        return (
          <div
            key={nm}
            className="future-bento-card mb-2.5 p-[14px_16px]"
            style={{
              borderColor: isActive ? color : "transparent",
              borderWidth: isActive ? 1.5 : 1,
              borderStyle: "solid",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-[26px]">{em}</div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[var(--t1)] flex items-center gap-1.5">
                  {nm}{" "}
                  {isActive && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-[2px] rounded-[6px]"
                      style={{ background: `${color}20`, color }}
                    >
                      você
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5">{desc}</div>
                <div className="text-[10px] text-[var(--t3)] mt-0.5">
                  Alvo: {m >= 1e6 ? `R$ ${(m / 1e6).toFixed(1)}M` : formatCurrency(m)}
                </div>
              </div>
              <div className="text-right min-w-[60px]">
                <div className="text-[16px] font-extrabold font-mono" style={{ color }}>
                  {ms >= 600 ? ">50a" : `${y}a`}
                </div>
                <div className="text-[9px] text-[var(--t3)]">
                  {ms < 600 ? new Date().getFullYear() + Math.round(ms / 12) : "—"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RetirementViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

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
            <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <text x={PAD.l - 4} y={toY(v) + 4} fontSize="7" fill="rgba(138,151,180,0.5)"
            textAnchor="end" fontFamily="var(--mono)">{fmtY(v)}</text>
        </g>
      ))}

      {[0, Math.round(years / 4), Math.round(years / 2), Math.round(years * 3 / 4), years].map((yr, i) => (
        <text key={i} x={toX(yr)} y={H - 4} fontSize="7" fill="rgba(138,151,180,0.45)"
          textAnchor="middle" fontFamily="var(--mono)">
          {new Date().getFullYear() + yr}
        </text>
      ))}

      {series.map((s, si) => {
        const pts = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" L ");
        const areaPath = `M ${toX(0)},${toY(0)} L ${pts} L ${toX(years)},${toY(0)} Z`;
        return (
          <g key={si}>
            <path d={`M ${pts}`} fill="none" stroke={s.color} strokeWidth={si === 1 ? 2.5 : 1.5}
              strokeLinecap="round" strokeDasharray={si === 2 ? "5 3" : "none"} />
            <path d={areaPath} fill={`url(#ag${si})`} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Slider with label ──────────────────────────────────────
function SliderField({ label, value, min, max, step, color, format, onChange, hint }: {
  label: string; value: number; min: number; max: number; step: number;
  color: string; format: (v: number) => string;
  onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="future-slider-field">
      <div className="future-slider-header">
        <span className="future-slider-label">{label}</span>
        <span className="future-slider-value" style={{ color }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="future-slider" style={{ "--accent": color } as React.CSSProperties} />
      {hint && <div className="future-slider-hint">{hint}</div>}
    </div>
  );
}

// ── Age stepper ────────────────────────────────────────────
function AgeStepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="future-age-card">
      <div className="future-age-label">{label}</div>
      <div className="future-age-controls">
        <button className="future-age-btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <div className="future-age-value">{value}</div>
        <button className="future-age-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

export const RetirementView = ({ onBack, onNavigate }: RetirementViewProps) => {
  const { user } = useAuth();
  const { totals: invTotals, loading: invLoading } = useInvestments();
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: debtTotals, isLoading: debtLoading } = useDebts();
  const [activeTab, setActiveTab] = useState<"aposentadoria" | "fire">("aposentadoria");

  const isLoading = invLoading || personal.isLoading || business.isLoading || debtLoading;

  const [currentAge, setCurrentAge] = useState(user?.age || 30);
  const [retireAge, setRetireAge] = useState(user?.retirementAge || 60);
  const [monthlyContribution, setMonthlyContribution] = useState(
    Math.round((user?.monthlyIncome || 0) * 0.15) || 1500
  );
  const [expectedReturnPct, setExpectedReturnPct] = useState(7);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(
    Math.round((user?.monthlyIncome || 0) * 0.8) || 10000
  );

  const trueNetWorth = Math.max(0,
    (personal.totals.balance + business.totals.balance + invTotals.currentValue) - debtTotals.totalBalance
  );
  const {
    yearsToRetire, fireTarget, futureValue, isOnTrack,
    progressToTarget, chartSeries, milestones, sensitivity
  } = useRetirement({
    currentAge, retireAge, monthlyContribution, expectedReturnPct,
    targetMonthlyIncome, currentNetWorth: trueNetWorth
  });

  const totalContributed = monthlyContribution * (yearsToRetire * 12);
  const compoundGains = Math.max(0, futureValue - totalContributed - trueNetWorth);
  const compoundPct = futureValue > 0 ? Math.round((compoundGains / futureValue) * 100) : 0;

  if (isLoading) {
    return (
      <div className="future-loading">
        <div className="future-header-row">
          <button className="back-btn" onClick={() => onBack?.()}><ArrowLeft size={16} /></button>
          <div>
            <div className="eyebrow text-[var(--blue)]">Projeção FIRE</div>
            <div className="page-title m-0 text-[22px]">Futuro</div>
          </div>
        </div>
        <div className="future-loading-inner">
          <Loader2 size={28} className="animate-spin text-[var(--blue)]" />
          <span>Calculando projeções...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="future-root">
      {/* ── Header ── */}
      <div className="future-header-row">
        <button className="back-btn" onClick={() => onBack?.()}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <div className="eyebrow text-[var(--blue)]">Planejamento</div>
          <div className="page-title text-[22px] m-0">Futuro</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tnav mb-4">
        <button
          className={`tnav-i flex-1 flex gap-2 items-center justify-center${activeTab === "aposentadoria" ? " active" : ""}`}
          onClick={() => setActiveTab("aposentadoria")}
        >
          <Landmark size={14} /> Aposentadoria
        </button>
        <button
          className={`tnav-i flex-1 flex gap-2 items-center justify-center${activeTab === "fire" ? " active" : ""}`}
          onClick={() => setActiveTab("fire")}
        >
          <Flame size={14} /> FIRE
        </button>
      </div>

      {activeTab === "fire" && <FireTab patrimonioAtual={trueNetWorth} />}

      {activeTab === "aposentadoria" && <>
      {/* ── Hero Status Card ── */}
      <motion.div
        className="future-hero-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Progress arc visual */}
        <div className="future-hero-top">
          <div className="future-hero-main">
            <div className="future-hero-eyebrow">Patrimônio projetado</div>
            <div className="future-hero-value text-[28px]" style={{ color: isOnTrack ? "var(--green)" : "var(--blue)" }}>
              {formatCurrency(futureValue)}
            </div>
            <div className="future-hero-sub">aos {retireAge} anos</div>
          </div>
          <div className="future-hero-badge" style={{
            background: isOnTrack ? "rgba(0,217,145,0.1)" : "rgba(74,139,255,0.1)",
            borderColor: isOnTrack ? "rgba(0,217,145,0.25)" : "rgba(74,139,255,0.2)",
          }}>
            <div className="future-badge-pct" style={{ color: isOnTrack ? "var(--green)" : "var(--blue)" }}>
              {Math.round(progressToTarget)}%
            </div>
            <div className="future-badge-label">da meta</div>
          </div>
        </div>

        <div className="future-progress-track">
          <motion.div
            className="future-progress-fill"
            style={{ background: isOnTrack ? "var(--green)" : "linear-gradient(90deg, var(--blue), var(--purple))" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progressToTarget)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>

        <div className="future-hero-status">
          {isOnTrack ? (
            <span className="text-[var(--green)]">✅ No caminho certo — supera a meta em {formatCurrency(futureValue - fireTarget)}</span>
          ) : (
            <span className="text-[var(--amber)]">⚠ Faltam {formatCurrency(fireTarget - futureValue)} para a meta FIRE</span>
          )}
        </div>

        {/* Metrics row */}
        <div className="future-metrics-row">
          {[
            { icon: <Target size={14} />, label: "Meta FIRE", value: formatCurrency(fireTarget), color: "var(--purple)" },
            { icon: <Flame size={14} />, label: "Anos restantes", value: `${yearsToRetire} anos`, color: "var(--amber)" },
            { icon: <Landmark size={14} />, label: "Patrimônio atual", value: formatCurrency(trueNetWorth), color: "var(--blue)" },
          ].map((m, i) => (
            <div key={i} className="future-metric-pill" style={{ borderColor: `${m.color}22`, background: `${m.color}0D` }}>
              <div style={{ color: m.color }}>{m.icon}</div>
              <div>
                <div className="future-metric-val" style={{ color: m.color }}>{m.value}</div>
                <div className="future-metric-lbl">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Projection Chart ── */}
      <div className="future-section-title">Projeção {yearsToRetire} anos</div>
      <div className="future-bento-card">
        {yearsToRetire > 0 ? (
          <>
            <ProjectionChart series={chartSeries} years={yearsToRetire} />
            <div className="future-legend-row">
              {chartSeries.map(s => (
                <div key={s.label} className="future-legend-item">
                  <span className="future-legend-dot" style={{ background: s.color }} />
                  <span className="future-legend-label">{s.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="future-empty-msg">Defina uma idade de aposentadoria maior que a atual.</div>
        )}
      </div>

      {/* ── Simulator ── */}
      <div className="future-section-title">Simulador interativo</div>
      <div className="future-bento-card">
        <SliderField label="Renda mensal desejada" value={targetMonthlyIncome}
          min={2000} max={50000} step={500} color="var(--green)"
          format={formatCurrency} onChange={setTargetMonthlyIncome}
          hint={`Meta patrimonial (regra 4%): ${formatCurrency(fireTarget)}`} />

        <SliderField label="Aporte mensal" value={monthlyContribution}
          min={0} max={20000} step={100} color="var(--blue)"
          format={formatCurrency} onChange={setMonthlyContribution} />

        <div className="future-age-row">
          <AgeStepper label="Sua idade" value={currentAge} min={18} max={90} onChange={setCurrentAge} />
          <AgeStepper label="Aposentadoria" value={retireAge} min={currentAge + 1} max={100} onChange={setRetireAge} />
        </div>

        <SliderField label="Rentabilidade real a.a." value={expectedReturnPct}
          min={1} max={15} step={0.5} color="var(--purple)"
          format={v => `${v}%`} onChange={setExpectedReturnPct}
          hint="Poupança (~1%) · CDI real (~5%) · Ações (~12%)" />
      </div>

      {/* ── Juros compostos insight ── */}
      <div className="future-compound-card">
        <div className="future-compound-title">⚡ O poder dos juros compostos</div>
        <div className="future-compound-stats">
          <div className="future-compound-stat">
            <div className="future-compound-stat-val">{formatCurrency(totalContributed)}</div>
            <div className="future-compound-stat-lbl">Você vai investir</div>
          </div>
          <div className="future-compound-stat">
            <div className="future-compound-stat-val text-[var(--green)]">+{formatCurrency(compoundGains)}</div>
            <div className="future-compound-stat-lbl">Juros gerados</div>
          </div>
          <div className="future-compound-stat">
            <div className="future-compound-stat-val text-[var(--amber)]">{compoundPct}%</div>
            <div className="future-compound-stat-lbl">Veio dos juros</div>
          </div>
        </div>
      </div>

      {/* ── Milestones ── */}
      {milestones.length > 0 && (
        <>
          <div className="future-section-title">Marcos da jornada</div>
          <div className="future-bento-card p-[6px_0]">
            {milestones.slice(0, 5).map((m, i) => (
              <div key={i} className={`future-milestone-row ${i < Math.min(milestones.length, 5) - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                <div className="future-milestone-year" style={{ color: m.color }}>{m.year}</div>
                <div className="future-milestone-info">
                  <div className="future-milestone-label">{m.label}</div>
                  <div className="future-milestone-sub">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Sensitivity ── */}
      <div className="future-section-title">Sensibilidade de aportes</div>
      <div className="future-bento-card p-[6px_0]">
        <div className="future-sensitivity-hint">
          Impacto de aumentar o aporte em {yearsToRetire} anos · {expectedReturnPct}% a.a.
        </div>
        {sensitivity.map(({ extra, total }, i) => (
          <div key={extra} className={`future-sensitivity-row ${i < sensitivity.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
            <div className="future-sensitivity-extra">
              {extra === 0 ? "Plano atual" : `+${formatCurrency(extra)}/mês`}
            </div>
            <div className="text-right">
              <div className="future-sensitivity-total">{formatCurrency(total)}</div>
              {extra > 0 && <div className="future-sensitivity-gain">+{formatCurrency(total - sensitivity[0]!.total)}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick nav ── */}
      <div className="future-nav-row">
        <button className="future-nav-btn" onClick={() => setActiveTab("fire")}>
          <Zap size={15} className="text-[var(--amber)]" />
          <span>Calculadora FIRE</span>
          <ChevronRight size={14} className="ml-auto text-[var(--t3)]" />
        </button>
        <button className="future-nav-btn" onClick={() => onNavigate?.("investments")}>
          <TrendingUp size={15} className="text-[var(--green)]" />
          <span>Minha Carteira</span>
          <ChevronRight size={14} className="ml-auto text-[var(--t3)]" />
        </button>
      </div>
      </>}
    </div>
  );
};
