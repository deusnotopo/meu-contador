import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft
} from 'lucide-react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { formatCurrency } from '@/lib/formatters';
import { useState } from 'react';
import type { TabType } from '@/types/navigation';

interface CashFlowCalendarProps {
  onBack?: () => void;
  onNavigate?: (tab: TabType) => void;
}

export function CashFlowCalendar({ onBack, onNavigate }: CashFlowCalendarProps) {
  const { cashFlowDays, summary, recurringItems, upcomingBills, upcomingCommitments, insights } = useCashFlow();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: '10px' }}>
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Previsibilidade financeira</div>
          <div className="page-title" style={{ margin: 0 }}>Calendário de Caixa</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Atual</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(summary.currentBalance)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Projeção 30d</span>
          </div>
          <div className={`text-xl font-black ${summary.projectedBalance30Days >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(summary.projectedBalance30Days)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dias Críticos</span>
          </div>
          <div className="text-xl font-black text-amber-400">
            {summary.criticalDays}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-rose-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Burn Rate</span>
          </div>
          <div className="text-xl font-black text-white">
            {summary.burnRate === Infinity ? '∞' : `${summary.burnRate}d`}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-slate-900/80 border border-indigo-500/20"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Saldo seguro hoje</span>
            </div>
            <div className="text-3xl font-black text-white">{formatCurrency(summary.safeToSpend)}</div>
            <p className="text-xs text-slate-400 mt-2 max-w-xl">
              Valor livre para usar sem comprometer as saídas já previstas para os próximos 7 dias.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Compromissos 7d</div>
            <div className="text-lg font-black text-rose-400">{formatCurrency(summary.committedNext7Days)}</div>
            <div className="text-[10px] text-slate-500 mt-2">
              Próxima entrada: {summary.nextIncomeDate ? new Date(summary.nextIncomeDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'não detectada'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-indigo-400" />
            <h2 className="text-xl font-black text-white">Fluxo de Caixa - 30 Dias</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Positivo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-400">Negativo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-400">Crítico</span>
            </div>
          </div>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday headers */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-2">
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

            return (
              <motion.button
                key={day.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setSelectedDay(isSelected ? null : index)}
                className={`
                  relative p-2 rounded-xl text-center transition-all
                  ${day.isToday ? 'ring-2 ring-indigo-500' : ''}
                  ${day.isCritical ? 'bg-amber-500/20' : day.netFlow >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}
                  ${isSelected ? 'ring-2 ring-white/50' : ''}
                  hover:scale-105 cursor-pointer
                `}
              >
                <div className={`text-sm font-bold ${day.isToday ? 'text-indigo-400' : 'text-white'}`}>
                  {day.dateFormatted.split(' ')[0]}
                </div>
                
                {hasEvents && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {day.inflows.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    {day.outflows.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    )}
                  </div>
                )}

                <div className={`text-[9px] font-bold mt-1 ${
                  day.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {day.netFlow >= 0 ? '+' : ''}{formatCurrency(day.netFlow).replace('R$', '')}
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
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {cashFlowDays[selectedDay]!.dateFormatted}
                </h3>
                <p className="text-xs text-slate-500">{cashFlowDays[selectedDay]!.weekday}</p>
              </div>
              <div className={`text-2xl font-black ${
                cashFlowDays[selectedDay]!.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrency(cashFlowDays[selectedDay]!.netFlow)}
              </div>
            </div>

            {/* Inflows */}
            {cashFlowDays[selectedDay]!.inflows.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Entradas</span>
                </div>
                <div className="space-y-2">
                  {cashFlowDays[selectedDay]!.inflows.map((inflow, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div>
                        <p className="text-sm font-medium text-white">{inflow.description}</p>
                        <p className="text-[10px] text-slate-500">{inflow.category}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">
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
                  <ArrowDownRight size={14} className="text-rose-400" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Saídas</span>
                </div>
                <div className="space-y-2">
                  {cashFlowDays[selectedDay]!.outflows.map((outflow, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div>
                        <p className="text-sm font-medium text-white">{outflow.description}</p>
                        <p className="text-[10px] text-slate-500">{outflow.category}</p>
                      </div>
                      <span className="text-sm font-bold text-rose-400">
                        -{formatCurrency(outflow.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projected Balance */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Projetado</span>
              <span className={`text-lg font-black ${
                cashFlowDays[selectedDay]!.projectedBalance >= 0 ? 'text-white' : 'text-rose-400'
              }`}>
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
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-amber-400" />
            <h3 className="text-lg font-bold text-white">Próximas Saídas (7 dias)</h3>
          </div>
          <div className="space-y-2">
            {upcomingBills.slice(0, 5).map((bill, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${bill.isToday ? 'bg-indigo-400' : 'bg-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{bill.description}</p>
                    <p className="text-[10px] text-slate-500">{bill.weekday} • {bill.category}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-rose-400">
                  -{formatCurrency(bill.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {upcomingCommitments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Compromissos relevantes</h3>
              <p className="text-xs text-slate-500">Lembretes, provisões e metas já conhecidas</p>
            </div>
          </div>
          <div className="space-y-2">
            {upcomingCommitments.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {item.category} • {item.source}
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-400">{formatCurrency(item.amount)}</span>
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
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Itens Recorrentes</h3>
            <span className="text-xs text-slate-500">Detectados automaticamente</span>
          </div>
          <div className="space-y-2">
            {recurringItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  {item.type === 'income' ? (
                    <ArrowUpRight size={16} className="text-emerald-400" />
                  ) : (
                    <ArrowDownRight size={16} className="text-rose-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{item.description}</p>
                    <p className="text-[10px] text-slate-500">Dia {item.dueDay} • {item.category}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
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
          className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
        >
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-xs text-slate-300 leading-relaxed">{insight}</p>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 pb-8">
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => onNavigate?.('envelopes')}>
          Ajustar envelopes
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => onNavigate?.('provisoes')}>
          Ver provisões
        </button>
      </div>
    </div>
  );
}