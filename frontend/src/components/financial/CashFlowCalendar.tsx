import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Flame,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useCashFlow } from "@/hooks/useCashFlow";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import type { TabType } from "@/types/navigation";

interface CashFlowCalendarProps {
  onBack?: () => void;
  onNavigate?: (tab: TabType) => void;
}

export function CashFlowCalendar({
  onBack,
  onNavigate,
}: CashFlowCalendarProps) {
  const {
    cashFlowDays,
    summary,
    recurringItems,
    upcomingBills,
    upcomingCommitments,
    insights,
  } = useCashFlow();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const summaryCards = [
    {
      icon: <DollarSign size={16} className="text-[var(--green)]" />,
      label: "Saldo Atual",
      value: formatCurrency(summary.currentBalance),
      valCls: "text-[var(--t1)]",
      delay: 0,
    },
    {
      icon: <TrendingUp size={16} className="text-indigo-400" />,
      label: "Projeção 30d",
      value: formatCurrency(summary.projectedBalance30Days),
      valCls:
        summary.projectedBalance30Days >= 0
          ? "text-[var(--green)]"
          : "text-[var(--red)]",
      delay: 0.1,
    },
    {
      icon: <AlertTriangle size={16} className="text-amber-400" />,
      label: "Dias Críticos",
      value: String(summary.criticalDays),
      valCls: "text-amber-400",
      delay: 0.2,
    },
    {
      icon: <Flame size={16} className="text-[var(--red)]" />,
      label: "Burn Rate",
      value: summary.burnRate === Infinity ? "∞" : `${summary.burnRate}d`,
      valCls: "text-[var(--t1)]",
      delay: 0.3,
    },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2.5">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="flex-1">
          <div className="eyebrow">Previsibilidade financeira</div>
          <div className="page-title" style={{ margin: 0 }}>
            Calendário de Caixa
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay }}
            className="bento-card"
          >
            <div className="flex items-center gap-2 mb-2">
              {card.icon}
              <span className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-widest">
                {card.label}
              </span>
            </div>
            <div className={`text-xl font-black ${card.valCls}`}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Safe to spend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bento-card border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-transparent"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                Saldo seguro hoje
              </span>
            </div>
            <div className="text-3xl font-black text-[var(--t1)]">
              {formatCurrency(summary.safeToSpend)}
            </div>
            <p className="text-xs text-[var(--t3)] mt-2 max-w-xl leading-relaxed">
              Valor livre para usar sem comprometer as saídas já previstas para
              os próximos 7 dias.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-bold">
              Compromissos 7d
            </div>
            <div className="text-lg font-black text-[var(--red)]">
              {formatCurrency(summary.committedNext7Days)}
            </div>
            <div className="text-[10px] text-[var(--t3)] mt-2">
              Próxima entrada:{" "}
              {summary.nextIncomeDate
                ? new Date(summary.nextIncomeDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                : "não detectada"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bento-card"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Calendar size={22} className="text-indigo-400" />
            <h2 className="text-[17px] font-black text-[var(--t1)]">
              Fluxo de Caixa — 30 Dias
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            {[
              { cls: "bg-[var(--green)]", label: "Positivo" },
              { cls: "bg-[var(--red)]", label: "Negativo" },
              { cls: "bg-amber-500", label: "Crítico" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                <span className="text-[var(--t3)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Weekday headers */}
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div
              key={day}
              className="text-center text-[9px] font-bold text-[var(--t3)] uppercase tracking-widest pb-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for alignment */}
          {(() => {
            const firstDay = new Date(cashFlowDays[0]?.date ?? new Date());
            const emptyCells = firstDay.getDay();
            return Array.from({ length: emptyCells }).map((_, i) => (
              <div key={`empty-${i}`} />
            ));
          })()}

          {/* Calendar days */}
          {cashFlowDays.map((day, index) => {
            const isSelected = selectedDay === index;
            const hasEvents = day.inflows.length > 0 || day.outflows.length > 0;
            const bgCls = day.isCritical
              ? "bg-amber-500/20"
              : day.netFlow >= 0
                ? "bg-[var(--green)]/10"
                : "bg-[var(--red)]/10";

            return (
              <motion.button
                key={day.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setSelectedDay(isSelected ? null : index)}
                className={`relative p-2 rounded-xl text-center transition-all hover:scale-105 cursor-pointer
                  ${bgCls}
                  ${day.isToday ? "ring-2 ring-indigo-400" : ""}
                  ${isSelected ? "ring-2 ring-white/40" : ""}
                `}
              >
                <div
                  className={`text-sm font-bold ${day.isToday ? "text-indigo-400" : "text-[var(--t1)]"}`}
                >
                  {(day.dateFormatted || day.date).split(" ")[0]}
                </div>
                {hasEvents && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {day.inflows.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                    )}
                    {day.outflows.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                    )}
                  </div>
                )}
                <div
                  className={`text-[9px] font-bold mt-1 ${day.netFlow >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}
                >
                  {day.netFlow >= 0 ? "+" : ""}
                  {formatCurrency(day.netFlow).replace("R$", "")}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Day Details */}
      <AnimatePresence>
        {selectedDay !== null && cashFlowDays[selectedDay] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bento-card overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[17px] font-bold text-[var(--t1)]">
                  {cashFlowDays[selectedDay]!.dateFormatted}
                </h3>
                <p className="text-[11px] text-[var(--t3)]">
                  {cashFlowDays[selectedDay]!.weekday}
                </p>
              </div>
              <div
                className={`text-2xl font-black ${cashFlowDays[selectedDay]!.netFlow >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}
              >
                {formatCurrency(cashFlowDays[selectedDay]!.netFlow)}
              </div>
            </div>

            {/* Inflows */}
            {cashFlowDays[selectedDay]!.inflows.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight size={14} className="text-[var(--green)]" />
                  <span className="text-[10px] font-bold text-[var(--green)] uppercase tracking-widest">
                    Entradas
                  </span>
                </div>
                <div className="space-y-2">
                  {cashFlowDays[selectedDay]!.inflows.map((inflow, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--t1)]">
                          {inflow.description}
                        </p>
                        <p className="text-[10px] text-[var(--t3)]">
                          {inflow.category}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[var(--green)]">
                        +{formatCurrency(inflow.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outflows */}
            {cashFlowDays[selectedDay]!.outflows.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight size={14} className="text-[var(--red)]" />
                  <span className="text-[10px] font-bold text-[var(--red)] uppercase tracking-widest">
                    Saídas
                  </span>
                </div>
                <div className="space-y-2">
                  {cashFlowDays[selectedDay]!.outflows.map((outflow, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--t1)]">
                          {outflow.description}
                        </p>
                        <p className="text-[10px] text-[var(--t3)]">
                          {outflow.category}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[var(--red)]">
                        -{formatCurrency(outflow.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projected Balance */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-widest">
                Saldo Projetado
              </span>
              <span
                className={`text-lg font-black ${cashFlowDays[selectedDay]!.projectedBalance >= 0 ? "text-[var(--t1)]" : "text-[var(--red)]"}`}
              >
                {formatCurrency(cashFlowDays[selectedDay]!.projectedBalance)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bento-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-amber-400" />
            <h3 className="text-[17px] font-bold text-[var(--t1)]">
              Próximas Saídas (7 dias)
            </h3>
          </div>
          <div className="space-y-2">
            {upcomingBills.slice(0, 5).map((bill, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${bill.isToday ? "bg-indigo-400" : "bg-[var(--t4)]"}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--t1)]">
                      {bill.description}
                    </p>
                    <p className="text-[10px] text-[var(--t3)]">
                      {bill.weekday} · {bill.category}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[var(--red)]">
                  -{formatCurrency(bill.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upcoming Commitments */}
      {upcomingCommitments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bento-card"
        >
          <div className="mb-4">
            <h3 className="text-[17px] font-bold text-[var(--t1)]">
              Compromissos relevantes
            </h3>
            <p className="text-[11px] text-[var(--t3)]">
              Lembretes, provisões e metas já conhecidas
            </p>
          </div>
          <div className="space-y-2">
            {upcomingCommitments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-[var(--border)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--t1)]">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-[var(--t3)]">
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {item.category} · {item.source}
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recurring Items */}
      {recurringItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bento-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-bold text-[var(--t1)]">
              Itens Recorrentes
            </h3>
            <span className="text-[11px] text-[var(--t3)]">
              Detectados automaticamente
            </span>
          </div>
          <div className="space-y-2">
            {recurringItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  {item.type === "income" ? (
                    <ArrowUpRight size={16} className="text-[var(--green)]" />
                  ) : (
                    <ArrowDownRight size={16} className="text-[var(--red)]" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--t1)]">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-[var(--t3)]">
                      Dia {item.dueDay} · {item.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${item.type === "income" ? "text-[var(--green)]" : "text-[var(--red)]"}`}
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-4 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/20"
        >
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-xs text-[var(--t2)] leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer actions */}
      <div className="flex gap-3 pb-8">
        <button
          className="btn-ghost flex-1"
          onClick={() => onNavigate?.("envelopes")}
        >
          Ajustar envelopes
        </button>
        <button
          className="btn-ghost flex-1"
          onClick={() => onNavigate?.("provisoes")}
        >
          Ver provisões
        </button>
      </div>
    </div>
  );
}
