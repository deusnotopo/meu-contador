import { useState, useEffect } from "react";
import type { TabType } from "@/types/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { useHealthScore } from "@/hooks/useHealthScore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Droplet, TrendingUp, TrendingDown, Network,
  Target, Brain, ShieldCheck, ChevronRight, Info,
  Zap, AlertTriangle, CheckCircle2
} from "lucide-react";
import { DataReliabilityBadge } from "@/components/ui/DataReliabilityBadge";
import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";

// ── Color helpers ─────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return { stroke: "#10B981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hex: "#10B981" };
  if (s >= 60) return { stroke: "#3B82F6", text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    hex: "#3B82F6" };
  if (s >= 40) return { stroke: "#F59E0B", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   hex: "#F59E0B" };
  return         { stroke: "#F43F5E",  text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    hex: "#F43F5E" };
}

const labelForScore = (s: number) =>
  s >= 80 ? "Excelente" : s >= 65 ? "Boa" : s >= 50 ? "Regular" : "Crítico";

// ── Animated Score Ring ─────────────────────────────────────────────────────

const ScoreRing = ({ score }: { score: number }) => {
  const [animated, setAnimated] = useState(false);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = animated ? circ * (1 - score / 100) : circ;
  const col = scoreColor(score);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="mx-auto">
      <defs>
        <linearGradient id="hsg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor={col.hex} />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      <circle
        cx="80" cy="80" r={r}
        fill="none"
        stroke="url(#hsg)"
        strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 80 80)"
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      <text x="80" y="72" textAnchor="middle" fontSize="36" fontWeight="800" fill="#F0F4FF" fontFamily="monospace">
        {score}
      </text>
      <text x="80" y="90" textAnchor="middle" fontSize="11" fill="#8899C4">de 100</text>
      <text x="80" y="106" textAnchor="middle" fontSize="10" fontWeight="700" fill={col.hex}>
        {labelForScore(score).toUpperCase()}
      </text>
    </svg>
  );
};

// ── Radar Chart (pure SVG) ──────────────────────────────────────────────────

interface RadarDim { label: string; score: number; }

const RadarChart = ({ dims }: { dims: RadarDim[] }) => {
  const [visible, setVisible] = useState(false);
  const n = dims.length;
  const cx = 120, cy = 120, r = 90;

  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);

  const angleFor = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i: number, val: number) => {
    const a = angleFor(i);
    const rv = (val / 100) * r;
    return { x: cx + rv * Math.cos(a), y: cy + rv * Math.sin(a) };
  };

  const rings = [20, 40, 60, 80, 100];
  const polygon = dims.map((d, i) => { const { x, y } = pt(i, visible ? d.score : 0); return `${x},${y}`; }).join(" ");
  const labels = dims.map((d, i) => {
    const a = angleFor(i); const rv = r + 18;
    return { x: cx + rv * Math.cos(a), y: cy + rv * Math.sin(a), text: (d.label.split(" ")[0] ?? d.label), score: d.score };
  });

  return (
    <svg width="240" height="240" viewBox="0 0 240 240" className="mx-auto">
      {rings.map(v => (
        <polygon key={v}
          points={dims.map((_, i) => { const { x, y } = pt(i, v); return `${x},${y}`; }).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}
      {dims.map((_, i) => {
        const { x, y } = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill="rgba(99,102,241,0.15)" stroke="#6366F1" strokeWidth="2"
        style={{ transition: "all 1.2s ease-out" }}
      />
      {dims.map((d, i) => {
        const { x, y } = pt(i, visible ? d.score : 0);
        return <circle key={i} cx={x} cy={y} r="4" fill={scoreColor(d.score).hex}
          stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"
          style={{ transition: `all 1.2s ease-out ${i * 0.08}s` }}
        />;
      })}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="700" fill={scoreColor(l.score).hex}
        >{l.text}</text>
      ))}
    </svg>
  );
};

// ── Score Timeline ──────────────────────────────────────────────────────────

const ScoreTimeline = ({ history, currentScore }: { history: { date: string; score: number }[]; currentScore: number }) => {
  const isReal = history.length >= 3;
  const pts = isReal
    ? history.slice(-6).map(h => ({ label: h.date.slice(5, 7), score: h.score }))
    : Array.from({ length: 6 }, (_, i) => ({
        label: `M${i + 1}`,
        score: Math.max(10, Math.round(currentScore - (5 - i) * 3)),
      }));
  const w = 240, h = 70;
  const xs = pts.map((_, i) => 20 + (i / Math.max(1, pts.length - 1)) * (w - 40));
  const ys = pts.map(p => h - 10 - ((p.score / 100) * (h - 20)));
  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const areaD = `M${xs[0]},${h} ${pathD} L${xs[xs.length - 1]},${h}Z`;

  return (
    <div>
      {!isReal && (
        <div className="flex items-center gap-1.5 text-[9px] text-amber-400/70 mb-2">
          <Info size={10} /> Estimado — evolução real aparece após 3+ registros
        </div>
      )}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        <defs>
          <linearGradient id="tl-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#tl-grad)" />
        <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]!} r={i === pts.length - 1 ? 5 : 3}
              fill={i === pts.length - 1 ? "#6366F1" : "#FFFFFF"}
              opacity={i === pts.length - 1 ? 1 : 0.4}
            />
            <text x={x} y={h - 1} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">
              {pts[i]?.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── Dimension Bar Card ──────────────────────────────────────────────────────

const DimensionCard = ({
  icon, name, subtitle, score, action, onNavigate, expanded, onToggle,
}: {
  icon: React.ReactNode; name: string; subtitle: string; score: number;
  action?: { text: string; tab?: TabType; tip: string };
  onNavigate?: (t: TabType) => void; expanded: boolean; onToggle: () => void;
}) => {
  const col = scoreColor(score);
  return (
    <div className="border-b border-white/[0.05] last:border-none">
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-all"
        onClick={onToggle}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${col.bg} border ${col.border}`}>
          <div className={col.text}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-white/90 truncate">{name}</div>
          <div className="text-[10px] text-white/35 truncate">{subtitle}</div>
          <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full" style={{ backgroundColor: col.hex }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[15px] font-black tabular-nums font-mono ${col.text}`}>{score}</span>
          <ChevronRight size={12} className={`text-white/20 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {expanded && action && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`mx-4 mb-3 p-3 rounded-xl ${col.bg} border ${col.border}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest ${col.text} mb-1.5`}>
                {score >= 80 ? "✓ Mantendo bem" : "📌 Ação recomendada"}
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">{action.tip}</p>
              {action.tab && score < 80 && (
                <button onClick={() => onNavigate?.(action.tab!)}
                  className={`mt-2.5 flex items-center gap-1 text-[10px] font-bold ${col.text} hover:opacity-70 transition-opacity`}>
                  {action.text} <ChevronRight size={10} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Recommendation Card ─────────────────────────────────────────────────────

interface Rec {
  priority: "high" | "medium" | "low";
  title: string; tip: string;
  tab?: TabType; tabLabel?: string; impact: string;
}

const RecCard = ({ rec, onNavigate }: { rec: Rec; onNavigate?: (t: TabType) => void }) => {
  const bg = rec.priority === "high" ? "bg-rose-500/5 border-rose-500/15"
    : rec.priority === "medium" ? "bg-amber-500/5 border-amber-500/15"
    : "bg-emerald-500/5 border-emerald-500/15";
  const txt = rec.priority === "high" ? "text-rose-400"
    : rec.priority === "medium" ? "text-amber-400" : "text-emerald-400";
  const Icon = rec.priority === "high" ? AlertTriangle
    : rec.priority === "medium" ? Zap : CheckCircle2;

  return (
    <div className={`rounded-2xl p-3.5 border ${bg} mb-2`}>
      <div className="flex items-start gap-2 mb-1.5">
        <Icon size={13} className={txt} />
        <div className="text-[12px] font-black text-white/90 leading-tight">{rec.title}</div>
      </div>
      <p className="text-[11px] text-white/55 leading-relaxed mb-2">{rec.tip}</p>
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-bold uppercase tracking-widest ${txt}`}>{rec.impact}</span>
        {rec.tab && (
          <button onClick={() => onNavigate?.(rec.tab!)}
            className={`text-[9px] font-black ${txt} flex items-center gap-0.5 hover:opacity-70 transition-opacity`}>
            {rec.tabLabel ?? "Ver"} <ChevronRight size={9} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

interface HealthSectionProps {
  onBack?: (tab: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

export const HealthSection = ({ onBack, onNavigate }: HealthSectionProps = {}) => {
  const [selectedStress, setSelectedStress] = useState<number | null>(null);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [view, setView] = useState<"radar" | "bars">("bars");

  const { transactions, totals: txTotals } = useTransactions("personal");
  const { debts, totals: debtTotals } = useDebts();
  const { assets, totals: investTotals } = useInvestments();
  const { history: scoreHistory, persistScore } = useHealthScore();

  useEffect(() => {
    const saved = localStorage.getItem("health_stress_index");
    if (saved !== null) setSelectedStress(Number(saved));
  }, []);

  const handleSetStress = (val: number) => {
    setSelectedStress(val);
    localStorage.setItem("health_stress_index", val.toString());
  };

  // Raw metrics
  const monthlyExpenses = Math.max(1, txTotals.expense || 0);
  const monthlyIncome   = Math.max(1, txTotals.income  || 0);
  const netWorth        = txTotals.balance + investTotals.currentValue - debtTotals.totalBalance;
  const savingRate      = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
  const liquidezMeses   = investTotals.currentValue > 0 ? Math.min(12, investTotals.currentValue / monthlyExpenses) : 0;

  // Scores
  const liquidezScore   = Math.min(100, Math.round((liquidezMeses / 6) * 100));
  const poupancaScore   = Math.max(0, Math.min(100, Math.round(savingRate * 3)));
  const debtRatio       = netWorth > 0 ? (debtTotals.totalBalance / netWorth) * 100 : (debtTotals.totalBalance > 0 ? 100 : 0);
  const dividaScore     = Math.max(0, Math.min(100, Math.round(100 - debtRatio * 2)));
  const uniqueAssets    = new Set(assets.filter(a => a.amount > 0).map(a => a.type)).size;
  const diversScore     = Math.min(100, uniqueAssets * 25);
  const insurKeys       = ["seguro", "unimed", "bradesco saude", "sulamerica", "previdência", "porto seguro"];
  const hasInsurance    = transactions.some(t => insurKeys.some(k => (t.description + t.category).toLowerCase().includes(k)));
  const protecaoScore   = hasInsurance ? 100 : 45;
  const trajetoriaScore = Math.max(10, Math.min(100, Math.round(savingRate * 2.5)));
  const STRESS_LABELS   = ["Crítico", "Alto", "Moderado", "Leve", "Ótimo"];
  const bemEstarScore   = selectedStress !== null ? ([20, 35, 55, 75, 95][selectedStress] ?? 55) : 55;

  const DIMS = [
    { icon: <Droplet size={15}/>,      name: "Reserva de Emergência", subtitle: liquidezMeses > 0 ? `${liquidezMeses.toFixed(1)} meses de sobrevida` : "Em risco", score: liquidezScore,
      action: { text: "Ver Investimentos", tab: "investments" as TabType, tip: liquidezScore >= 80 ? "Reserva adequada. Otimize a liquidez diária." : `Você tem ${liquidezMeses.toFixed(1)} de 6 meses necessários. Priorize CDB de liquidez diária.` }},
    { icon: <TrendingUp size={15}/>,   name: "Acumulação Corrente",   subtitle: savingRate > 0 ? `Poupança: ${savingRate.toFixed(1)}%` : "Renda totalmente consumida", score: poupancaScore,
      action: { text: "Ajustar Orçamento", tab: "budget" as TabType, tip: poupancaScore >= 80 ? "Excelente! Canalize para investimentos." : `Taxa atual: ${savingRate.toFixed(1)}%. Meta: 20%. Elimine uma categoria de gasto por mês.` }},
    { icon: <TrendingDown size={15}/>, name: "Alavancagem",           subtitle: debts.length > 0 ? `${debtRatio.toFixed(1)}% do patrimônio comprometido` : "Zero dívidas", score: dividaScore,
      action: { text: "Gerenciar Dívidas", tab: "debt_payoff" as TabType, tip: dividaScore >= 80 ? "Alavancagem saudável." : "Método Avalanche: pague dívidas com maior juros primeiro. Economiza até 40%." }},
    { icon: <Network size={15}/>,      name: "Diversificação",        subtitle: `${uniqueAssets} classes de ativos`, score: diversScore,
      action: { text: "Explorar Ativos", tab: "investments" as TabType, tip: diversScore >= 80 ? "Carteira bem diversificada!" : "Concentre ≤30% num único ativo. Explore FIIs e ETFs internacionais." }},
    { icon: <ShieldCheck size={15}/>,  name: "Mitigação de Riscos",   subtitle: hasInsurance ? "Cobertura identificada" : "Sem seguros detectados", score: protecaoScore,
      action: { text: "Planejar Seguros", tab: "insurance_planner" as TabType, tip: hasInsurance ? "Continue monitorando coberturas." : "Um sinistro sem seguro pode anular 5 anos de acumulação." }},
    { icon: <Target size={15}/>,       name: "Trajetória F.I.R.E",    subtitle: `${trajetoriaScore}% do caminho`, score: trajetoriaScore,
      action: { text: "Calculadora F.I.R.E", tab: "retire_fire" as TabType, tip: trajetoriaScore >= 80 ? "No caminho certo!" : `Com ${savingRate.toFixed(1)}% de poupança, simule cenários de aceleração.` }},
    { icon: <Brain size={15}/>,        name: "Bem-estar Financeiro",  subtitle: selectedStress !== null ? (STRESS_LABELS[selectedStress] ?? "Não registrado") : "Não registrado", score: bemEstarScore,
      action: { text: "", tip: "Ansiedade financeira reduz capacidade cognitiva em até 13%. Faça check-in regularmente." }},
  ];

  const score = Math.round(DIMS.reduce((s, d) => s + d.score, 0) / DIMS.length);
  useEffect(() => { if (score > 0) persistScore(score); }, [score, persistScore]);

  const recs: Rec[] = DIMS
    .filter(d => d.score < 80)
    .sort((a, b) => a.score - b.score)
    .map(d => ({
      priority: d.score < 40 ? "high" as const : d.score < 65 ? "medium" as const : "low" as const,
      title: `Melhorar: ${d.name}`,
      tip: d.action?.tip ?? "",
      tab: d.action?.tab,
      tabLabel: d.action?.text || undefined,
      impact: d.score < 40 ? "+Alta prioridade" : d.score < 65 ? "+Impacto médio" : "+Leve ajuste",
    }));

  const col = scoreColor(score);

  return (
    <div className="animate-[fsu_0.26s_ease] pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sticky top-2 z-[60] bg-[#0A1220]/90 backdrop-blur-2xl px-3 py-2.5 rounded-[22px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-1">
        {onBack && (
          <button className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            onClick={() => onBack("inicio")}>
            <ArrowLeft size={15} />
          </button>
        )}
        <div className="flex-1">
          <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Score 360°</div>
          <div className="text-[16px] font-black text-white tracking-tight">Saúde Financeira</div>
        </div>
        <DataReliabilityBadge reliability="HEURISTIC" sourceLabel="regras internas" compact />
        <AreaTutorialButton area="futuro" onNavigate={onNavigate} />
      </div>

      <div className="px-2 space-y-3">

        {/* Score Ring */}
        <div className="card-obsidian rounded-2xl p-5 text-center">
          <ScoreRing score={score} />
          <div className={`text-[11px] font-bold mt-1 ${col.text}`}>
            Score calculado com base em 7 dimensões financeiras reais
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {DIMS.map(d => {
              const c = scoreColor(d.score);
              return (
                <div key={d.name} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${c.bg} border ${c.border} ${c.text}`}>
                  {d.icon} {d.score}
                </div>
              );
            })}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1.5 px-1">
          {(["bars", "radar"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                view === v ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" : "bg-white/[0.02] text-white/30 border-white/[0.05]"
              }`}>
              {v === "bars" ? "Dimensões" : "Radar"}
            </button>
          ))}
        </div>

        {/* Radar or Bars */}
        <AnimatePresence mode="wait">
          {view === "radar" ? (
            <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="card-obsidian rounded-2xl p-4">
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">Radar das 7 Dimensões</div>
              <RadarChart dims={DIMS.map(d => ({ label: d.name, score: d.score }))} />
            </motion.div>
          ) : (
            <motion.div key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="card-obsidian rounded-2xl overflow-hidden">
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest px-4 pt-4 pb-2">7 Dimensões Vitais</div>
              {DIMS.map(d => (
                <DimensionCard key={d.name}
                  icon={d.icon} name={d.name} subtitle={d.subtitle} score={d.score}
                  action={d.action} onNavigate={onNavigate}
                  expanded={expandedDim === d.name}
                  onToggle={() => setExpandedDim(expandedDim === d.name ? null : d.name)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div className="card-obsidian rounded-2xl p-4">
          <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">Evolução do Score</div>
          <ScoreTimeline history={scoreHistory} currentScore={score} />
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="card-obsidian rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Plano de Ação</div>
              <span className="text-[9px] text-indigo-400 font-bold">{recs.length} itens</span>
            </div>
            {recs.map((r, i) => <RecCard key={i} rec={r} onNavigate={onNavigate} />)}
          </div>
        )}

        {/* Stress Check-in */}
        <div className="card-obsidian rounded-2xl p-4">
          <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2">Check-in Biopsicossocial</div>
          <p className="text-[11px] text-white/50 leading-relaxed mb-3">
            Ansiedade financeira reduz decisão em até 13% (Financial Health Network). Como você está ao ver suas contas?
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {STRESS_LABELS.map((label, i) => (
              <button key={i} onClick={() => handleSetStress(i)}
                className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all border text-center ${
                  selectedStress === i ? "border-indigo-500/30 bg-indigo-500/10" : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}>
                <span className={`text-[14px] font-black ${selectedStress === i ? "text-indigo-400" : "text-white/30"}`}>M{i + 1}</span>
                <span className="text-[8px] leading-tight text-white/30 font-medium">{label}</span>
              </button>
            ))}
          </div>
          {selectedStress !== null && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 text-[11px] text-white/40 text-center">
              ✓ Registrado: <strong className="text-white/60">{["Crítico (Ansiedade)", "Alto (Desconforto)", "Moderado", "Leve", "Tranquilidade Plena"][selectedStress]}</strong>
            </motion.div>
          )}
        </div>

        {/* Credit Score Proxy */}
        <div className="card-obsidian rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Trust Score Interno</div>
            <span className={`text-2xl font-black font-mono ${col.text}`}>{Math.round(score * 10)}</span>
          </div>
          <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
            <div className="h-full flex">
              <div className="bg-rose-500/60 w-[30%]" />
              <div className="bg-amber-500/60 w-[40%]" />
              <div className="bg-emerald-500/60 w-[30%]" />
            </div>
            <motion.div
              initial={{ left: "0%" }} animate={{ left: `${Math.min(95, score)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-[-3px] w-3 h-3 rounded-full bg-white shadow-md border-2 border-[#080C16]"
              style={{ transform: "translateX(-50%)" }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-white/25 uppercase font-bold tracking-widest">
            <span>Alto Risco</span><span>Estável</span><span>Prime</span>
          </div>
          <p className="mt-3 text-[10px] text-white/35 leading-relaxed">
            Score <strong className="text-white/50">{Math.round(score * 10)}/1000</strong> baseado em liquidez ({liquidezMeses.toFixed(1)} meses), alavancagem e acumulação.
          </p>
        </div>

      </div>
    </div>
  );
};
