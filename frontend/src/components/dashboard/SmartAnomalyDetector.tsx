/**
 * SmartAnomalyDetector.tsx — Phase 41
 * ─────────────────────────────────────
 * Proactive anomaly detection engine.
 * Scans spending patterns for: unusual amounts, frequency spikes,
 * new merchants, category breaches, and velocity alerts.
 * Makes the app feel "alive" — it notices things before you do.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, AlertTriangle, ShoppingBag,
  Clock, ChevronDown, ChevronUp, Eye, Zap, CheckCircle
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Anomaly {
  id: string;
  type: "amount" | "frequency" | "new_merchant" | "category_spike" | "velocity";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  amount?: number;
  date: string;
  category: string;
  emoji: string;
}

// ── Detection Engine ──────────────────────────────────────────────────────────

function detectAnomalies(
  transactions: { type: string; description: string; category: string; amount: number; date: string }[],
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const expenses = transactions.filter(t => t.type === "expense");
  if (expenses.length < 10) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);

  // ── 1. UNUSUAL AMOUNT (> 2.5x category average) ────────────────────────
  const catAvgs: Record<string, { sum: number; count: number; amounts: number[] }> = {};
  expenses.forEach(e => {
    if (!catAvgs[e.category]) catAvgs[e.category] = { sum: 0, count: 0, amounts: [] };
    catAvgs[e.category]!.sum += e.amount;
    catAvgs[e.category]!.count++;
    catAvgs[e.category]!.amounts.push(e.amount);
  });

  recentExpenses.forEach(e => {
    const cat = catAvgs[e.category];
    if (!cat || cat.count < 3) return;
    const avg = cat.sum / cat.count;
    if (e.amount > avg * 2.5 && e.amount > 50) {
      anomalies.push({
        id: `amt-${e.date}-${e.description}`,
        type: "amount",
        severity: e.amount > avg * 5 ? "critical" : "warning",
        title: `Gasto atípico em ${e.category}`,
        description: `${e.description}: ${formatCurrency(e.amount)} é ${(e.amount / avg).toFixed(1)}x a média da categoria (${formatCurrency(avg)})`,
        amount: e.amount,
        date: e.date,
        category: e.category,
        emoji: "💸",
      });
    }
  });

  // ── 2. FREQUENCY SPIKE (category appears 2x+ more than usual) ──────────
  const catMonthly: Record<string, Record<string, number>> = {};
  expenses.forEach(e => {
    const month = e.date.slice(0, 7);
    if (!catMonthly[e.category]) catMonthly[e.category] = {};
    catMonthly[e.category]![month] = (catMonthly[e.category]![month] || 0) + 1;
  });

  const currentMonth = now.toISOString().slice(0, 7);
  Object.entries(catMonthly).forEach(([cat, months]) => {
    const monthValues = Object.entries(months).filter(([m]) => m !== currentMonth).map(([, c]) => c);
    if (monthValues.length < 2) return;
    const avgFreq = monthValues.reduce((s, v) => s + v, 0) / monthValues.length;
    const currentFreq = months[currentMonth] || 0;
    if (currentFreq > avgFreq * 2 && currentFreq > 3) {
      anomalies.push({
        id: `freq-${cat}`,
        type: "frequency",
        severity: "warning",
        title: `Frequência incomum: ${cat}`,
        description: `${currentFreq} transações este mês vs média de ${avgFreq.toFixed(1)}/mês. Consumo acelerado.`,
        date: currentMonth,
        category: cat,
        emoji: "📊",
      });
    }
  });

  // ── 3. NEW MERCHANT (description never seen before, > R$100) ───────────
  const knownDescs = new Set(
    expenses.filter(e => new Date(e.date) < thirtyDaysAgo).map(e => e.description.toLowerCase().trim())
  );
  recentExpenses.forEach(e => {
    const desc = e.description.toLowerCase().trim();
    if (!knownDescs.has(desc) && e.amount > 100) {
      anomalies.push({
        id: `new-${e.date}-${desc}`,
        type: "new_merchant",
        severity: "info",
        title: `Novo estabelecimento`,
        description: `"${e.description}" — primeira vez. ${formatCurrency(e.amount)} em ${e.category}.`,
        amount: e.amount,
        date: e.date,
        category: e.category,
        emoji: "🆕",
      });
    }
  });

  // ── 4. CATEGORY SPIKE (this month 50%+ above avg) ─────────────────────
  const catMonthlyAmts: Record<string, Record<string, number>> = {};
  expenses.forEach(e => {
    const month = e.date.slice(0, 7);
    if (!catMonthlyAmts[e.category]) catMonthlyAmts[e.category] = {};
    catMonthlyAmts[e.category]![month] = (catMonthlyAmts[e.category]![month] || 0) + e.amount;
  });

  Object.entries(catMonthlyAmts).forEach(([cat, months]) => {
    const pastValues = Object.entries(months).filter(([m]) => m !== currentMonth).map(([, v]) => v);
    if (pastValues.length < 2) return;
    const avg = pastValues.reduce((s, v) => s + v, 0) / pastValues.length;
    const current = months[currentMonth] || 0;
    if (current > avg * 1.5 && current > 100 && (current - avg) > 50) {
      anomalies.push({
        id: `catspike-${cat}`,
        type: "category_spike",
        severity: current > avg * 2 ? "critical" : "warning",
        title: `${cat} acima do normal`,
        description: `${formatCurrency(current)} este mês vs média ${formatCurrency(avg)} (+${((current / avg - 1) * 100).toFixed(0)}%)`,
        amount: current,
        date: currentMonth,
        category: cat,
        emoji: "📈",
      });
    }
  });

  // ── 5. VELOCITY ALERT (3+ expenses in 24h) ────────────────────────────
  const sortedRecent = [...recentExpenses].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 2; i < sortedRecent.length; i++) {
    const a = sortedRecent[i - 2]!;
    const c = sortedRecent[i]!;
    const dayA = a.date.slice(0, 10);
    const dayC = c.date.slice(0, 10);
    if (dayA === dayC) {
      const dayExpenses = sortedRecent.filter(e => e.date.slice(0, 10) === dayA);
      const totalDay = dayExpenses.reduce((s, e) => s + e.amount, 0);
      if (dayExpenses.length >= 4 && totalDay > 200) {
        const existing = anomalies.find(an => an.id === `vel-${dayA}`);
        if (!existing) {
          anomalies.push({
            id: `vel-${dayA}`,
            type: "velocity",
            severity: dayExpenses.length >= 6 ? "critical" : "warning",
            title: `Dia de gastos intensos`,
            description: `${dayExpenses.length} transações em ${dayA.slice(8, 10)}/${dayA.slice(5, 7)}, totalizando ${formatCurrency(totalDay)}`,
            amount: totalDay,
            date: dayA,
            category: "múltiplas",
            emoji: "⚡",
          });
        }
      }
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return anomalies
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 10); // Max 10 anomalies
}

// ── Severity Badge ────────────────────────────────────────────────────────────

const SeverityBadge = ({ severity }: { severity: Anomaly["severity"] }) => {
  const config = {
    critical: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", label: "Alto" },
    warning: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Médio" },
    info: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "Info" },
  };
  const c = config[severity];
  return (
    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
      {c.label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const SmartAnomalyDetector = () => {
  const { allTransactions: transactions } = useTransactions("personal");
  const [expanded, setExpanded] = useState(false);

  const anomalies = useMemo(() => detectAnomalies(transactions), [transactions]);

  if (transactions.length < 10) {
    return (
      <EmptyIntelligence
        icon={Radar}
        emoji="📡"
        title="Detector de Anomalias"
        description="Registre pelo menos 10 transações para ativar a detecção inteligente de padrões."
        compact
        color="#8B5CF6"
      />
    );
  }

  const criticalCount = anomalies.filter(a => a.severity === "critical").length;
  const warningCount = anomalies.filter(a => a.severity === "warning").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#0A0514] to-[#050310] overflow-hidden"
    >
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center relative">
            <Radar size={15} className="text-indigo-400" />
            {anomalies.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">{anomalies.length}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Detector de Anomalias</div>
            <div className="text-[9px] text-white/30">
              {anomalies.length === 0
                ? "Nenhuma anomalia detectada ✓"
                : `${criticalCount > 0 ? `${criticalCount} crítico · ` : ""}${warningCount} alertas · ${anomalies.length} total`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {anomalies.length === 0 ? (
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={8} /> Limpo
            </span>
          ) : criticalCount > 0 ? (
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle size={8} /> {criticalCount} crítico
            </span>
          ) : null}
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-2">
              {anomalies.length === 0 ? (
                <div className="text-center py-6">
                  <Eye size={28} className="text-emerald-400 mx-auto mb-2" />
                  <div className="text-[12px] font-bold text-emerald-400">Todos os padrões normais</div>
                  <div className="text-[9px] text-white/25 mt-1">Nenhuma transação fora do padrão detectada nos últimos 30 dias</div>
                </div>
              ) : (
                <>
                  {/* Type legend */}
                  <div className="flex flex-wrap gap-2 mb-1">
                    {[
                      { emoji: "💸", label: "Valor atípico", type: "amount" },
                      { emoji: "📊", label: "Frequência", type: "frequency" },
                      { emoji: "🆕", label: "Novo local", type: "new_merchant" },
                      { emoji: "📈", label: "Categoria", type: "category_spike" },
                      { emoji: "⚡", label: "Velocidade", type: "velocity" },
                    ].filter(l => anomalies.some(a => a.type === l.type)).map(l => (
                      <span key={l.type} className="text-[8px] text-white/20 flex items-center gap-1">
                        <span>{l.emoji}</span> {l.label}
                      </span>
                    ))}
                  </div>

                  {/* Anomaly List */}
                  {anomalies.map((anomaly, i) => (
                    <motion.div
                      key={anomaly.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-xl p-3.5 border transition-all ${
                        anomaly.severity === "critical"
                          ? "bg-rose-500/[0.03] border-rose-500/15"
                          : anomaly.severity === "warning"
                          ? "bg-amber-500/[0.03] border-amber-500/10"
                          : "bg-white/[0.02] border-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg mt-0.5">{anomaly.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-white/70">{anomaly.title}</span>
                            <SeverityBadge severity={anomaly.severity} />
                          </div>
                          <div className="text-[9px] text-white/35 leading-relaxed">{anomaly.description}</div>
                          <div className="flex items-center gap-3 mt-1.5 text-[8px] text-white/20">
                            <span className="flex items-center gap-0.5">
                              <Clock size={7} /> {anomaly.date.slice(0, 10)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <ShoppingBag size={7} /> {anomaly.category}
                            </span>
                            {anomaly.amount && (
                              <span className="font-mono font-bold text-white/30">
                                {formatCurrency(anomaly.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              {/* Scanning indicator */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[8px] text-white/15">
                <Zap size={7} />
                <span>Scan automático a cada atualização de dados</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
