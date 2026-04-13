import { formatCurrency } from "@/lib/formatters";
import { showError, showSuccess } from "@/lib/toast";
import type { Debt } from "@/types";
import { useDebts } from "@/hooks/useDebts";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowDownCircle, ArrowRight, Plus,
  Trash2, Zap, X, Flame,
} from "lucide-react";
import { useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

// ── motion presets ─────────────────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

// ── field component ───────────────────────────────────────────────────────────
const Field = ({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div>
    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-rose-500/40 transition-colors font-mono"
    />
  </div>
);

// ── debt card ─────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  credit_card: "💳", loan: "🏦", mortgage: "🏠", student: "🎓",
  car: "🚗", personal: "👤", medical: "🏥", other: "💸",
};

const getDebtUrgency = (rate: number) => {
  if (rate >= 10) return { label: "Crítico", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" };
  if (rate >= 5)  return { label: "Alto", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  return { label: "Moderado", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" };
};

// ── main ──────────────────────────────────────────────────────────────────────
export const DebtRecovery = () => {
  const { debts, addDebt, deleteDebt } = useDebts();
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPayment, setExtraPayment] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newDebt, setNewDebt] = useState<Omit<Debt, "id">>({
    name: "", balance: 0, interestRate: 0, minPayment: 0, category: "credit_card",
  });

  const handleAdd = async () => {
    if (!newDebt.name.trim()) { showError("Nome da dívida é obrigatório."); return; }
    if (newDebt.balance <= 0)  { showError("Saldo deve ser maior que zero."); return; }
    await addDebt(newDebt);
    setShowAdd(false);
    setNewDebt({ name: "", balance: 0, interestRate: 0, minPayment: 0, category: "credit_card" });
    showSuccess("Dívida registrada. Vamos eliminá-la! 💪");
  };

  const sortedDebts = [...debts].sort((a, b) =>
    strategy === "avalanche" ? b.interestRate - a.interestRate : a.balance - b.balance
  );

  const totalBalance    = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
  const totalInterestPerMonth = debts.reduce((s, d) => s + (d.balance * d.interestRate) / 100, 0);

  // Estimar meses até quitar com pagamento extra
  const estimateMonths = (d: Debt, extra: number): number => {
    const payment = d.minPayment + (sortedDebts[0]?.id === d.id ? extra : 0);
    if (payment <= 0) return 999;
    const r = d.interestRate / 100;
    if (r === 0) return Math.ceil(d.balance / payment);
    return Math.ceil(Math.log(payment / (payment - d.balance * r)) / Math.log(1 + r));
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-3xl p-6 border border-rose-500/20"
          style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))" }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-3">
                <AlertTriangle size={11} className="text-rose-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">Modo de Eliminação</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                Rota de Saída das <span className="text-rose-400">Dívidas</span>
              </h2>
              <p className="text-xs text-white/40 mt-1.5 max-w-sm leading-relaxed">
                Priorize o pagamento das suas dívidas para economizar anos em juros bancários.
              </p>
            </div>

            {/* KPI badges */}
            <div className="flex gap-3 shrink-0 flex-wrap">
              {[
                { label: "Total Devido",    value: <PrivacyValue value={totalBalance} />,    color: "rose" },
                { label: "Pgto. Mínimo",   value: <PrivacyValue value={totalMinPayment} />,  color: "amber" },
                { label: "Juros/Mês",      value: formatCurrency(totalInterestPerMonth),     color: "orange" },
              ].map((k) => (
                <div key={k.label} className={`flex flex-col items-center p-3 rounded-2xl bg-${k.color}-500/10 border border-${k.color}-500/20 min-w-[80px]`}>
                  <span className="text-sm font-black font-mono text-white leading-none">{k.value}</span>
                  <span className="text-[8px] text-white/30 uppercase tracking-widest mt-1">{k.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add button */}
          <div className="relative z-10 mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">
              {debts.length} dívida{debts.length !== 1 ? "s" : ""} mapeada{debts.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all active:scale-95"
            >
              {showAdd ? <X size={13} /> : <Plus size={13} />}
              {showAdd ? "Cancelar" : "Registrar Dívida"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── ADD FORM ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl p-6 border border-rose-500/20 space-y-4"
            style={{ background: "rgba(239,68,68,0.04)" }}
          >
            <h3 className="text-sm font-black text-white">Nova Dívida</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome / Credor" value={newDebt.name} onChange={(v) => setNewDebt((d) => ({ ...d, name: v }))} placeholder="Ex: Cartão Nubank" />
              <Field label="Saldo Devedor (R$)" type="number" value={newDebt.balance || ""} onChange={(v) => setNewDebt((d) => ({ ...d, balance: parseFloat(v) || 0 }))} />
              <Field label="Juros Mensal (%)" type="number" value={newDebt.interestRate || ""} onChange={(v) => setNewDebt((d) => ({ ...d, interestRate: parseFloat(v) || 0 }))} placeholder="Ex: 12.5" />
              <Field label="Pagamento Mínimo (R$)" type="number" value={newDebt.minPayment || ""} onChange={(v) => setNewDebt((d) => ({ ...d, minPayment: parseFloat(v) || 0 }))} />
            </div>

            {/* Category picker */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_ICONS).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setNewDebt((d) => ({ ...d, category: key as Debt["category"] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${newDebt.category === key ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"}`}
                  >
                    {emoji} {key.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest transition-all">
                Cancelar
              </button>
              <button onClick={handleAdd} className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                Registrar Dívida
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN GRID: debts + sidebar ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: debt list ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {sortedDebts.length === 0 ? (
            <motion.div variants={fadeUp}>
              <div className="text-center py-16 rounded-3xl border border-white/5 bg-white/[0.01]">
                <div className="text-4xl mb-3">🎉</div>
                <div className="text-base font-black text-white mb-1">Sem dívidas registradas</div>
                <div className="text-xs text-white/30">Clique em "Registrar Dívida" para mapear suas pendências financeiras.</div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {sortedDebts.map((debt, idx) => {
                const urgency = getDebtUrgency(debt.interestRate);
                const months = estimateMonths(debt, extraPayment);
                const isPriority = idx === 0;
                return (
                  <motion.div
                    key={debt.id}
                    layout
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="rounded-3xl p-5 border flex items-start gap-4 group transition-all hover:brightness-110"
                    style={{ background: urgency.bg, borderColor: urgency.border }}
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 border"
                      style={{ background: `${urgency.color}15`, borderColor: urgency.border, color: urgency.color }}>
                      {isPriority ? <Flame size={16} /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{debt.name}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                              style={{ background: `${urgency.color}15`, color: urgency.color }}>
                              {urgency.label}
                            </span>
                            {isPriority && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-amber-500/10 text-amber-400">
                                ⚡ Foco
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-2">
                            <span>{CATEGORY_ICONS[debt.category] ?? "💸"} {debt.interestRate}% juros/mês</span>
                            <span>·</span>
                            <span>Min: {formatCurrency(debt.minPayment)}</span>
                            {months < 999 && <><span>·</span><span>~{months} meses para quitar</span></>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-base font-black text-white font-mono"><PrivacyValue value={debt.balance} /></div>
                            <div className="text-[8px] text-white/20 uppercase tracking-wider">saldo devedor</div>
                          </div>
                          <button
                            onClick={() => deleteDebt(debt.id)}
                            className="w-7 h-7 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Progress toward zero */}
                      <div className="mt-3">
                        <div className="h-1 rounded-full overflow-hidden bg-white/[0.06]">
                          <div className="h-full rounded-full" style={{ width: "100%", background: urgency.color, opacity: 0.5 }} />
                        </div>
                        <div className="text-[8px] text-white/20 mt-1">
                          Custo de juros este mês: <span style={{ color: urgency.color }}>{formatCurrency((debt.balance * debt.interestRate) / 100)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── RIGHT: strategy sidebar ─────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Strategy selector */}
          <motion.div variants={fadeUp}>
            <div className="rounded-3xl p-5 border border-indigo-500/20 space-y-5"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(99,102,241,0.02))" }}>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Estratégia de Pagamento</h3>
              </div>

              {/* Toggle */}
              <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
                {(["avalanche", "snowball"] as const).map((s) => (
                  <button key={s} onClick={() => setStrategy(s)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${strategy === s ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}>
                    {s === "avalanche" ? "🌊 Avalanche" : "❄️ Bola de Neve"}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div className="p-3 rounded-2xl text-[10px] leading-relaxed bg-white/[0.03] text-white/40">
                {strategy === "avalanche"
                  ? "💡 Matematicamente superior: paga primeiro a dívida com maior taxa de juros. Salva mais dinheiro no longo prazo."
                  : "💡 Psicologicamente superior: elimina as menores dívidas primeiro. Gera sensação de progresso rápido."}
              </div>

              {/* Extra payment */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Pagamento Extra (R$ bônus)</label>
                <div className="relative">
                  <ArrowDownCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    type="number" min="0"
                    value={extraPayment || ""}
                    onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 500"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Priority target */}
              {sortedDebts.length > 0 && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Próxima Prioridade</div>
                  <div className="p-3 rounded-2xl flex items-center justify-between border border-indigo-500/20"
                    style={{ background: "rgba(99,102,241,0.1)" }}>
                    <div>
                      <div className="text-xs font-black text-white">{sortedDebts[0]?.name}</div>
                      <div className="text-[9px] text-white/30">{sortedDebts[0]?.interestRate}% ao mês</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {extraPayment > 0 && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          +{formatCurrency(extraPayment)}
                        </span>
                      )}
                      <ArrowRight size={14} className="text-indigo-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Survival tip */}
          <motion.div variants={fadeUp}>
            <div className="rounded-3xl p-5 border border-amber-500/20"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Alerta Brasileiro</span>
              </div>
              <p className="text-[11px] text-amber-200/50 leading-relaxed">
                O rotativo do cartão pode chegar a <strong className="text-amber-400">400% ao ano</strong> no Brasil.
                Se sua taxa mensal for <strong>acima de 8%</strong>, considere consolidar com um empréstimo pessoal de taxa menor.
              </p>
              {debts.some((d) => d.interestRate >= 8) && (
                <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                  ⚠️ Você tem dívida(s) com juros críticos! Considere negociar.
                </div>
              )}
            </div>
          </motion.div>

          {/* Summary metrics */}
          {debts.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="rounded-3xl p-5 border border-white/[0.06] space-y-3 bg-white/[0.015]">
                <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">Resumo da Situação</div>
                {[
                  { label: "Total de dívidas", value: formatCurrency(totalBalance), icon: "💳" },
                  { label: "Custo mensal de juros", value: formatCurrency(totalInterestPerMonth), icon: "🔥" },
                  { label: "Custo anual projetado", value: formatCurrency(totalInterestPerMonth * 12), icon: "📅" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-base shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-white/25 uppercase tracking-wider font-bold">{m.label}</div>
                    </div>
                    <span className="text-xs font-black text-white font-mono shrink-0">{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
