import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Zap,
  CreditCard,
  Tv,
  Wifi,
  Dumbbell,
  Home,
  Car,
  GraduationCap
} from 'lucide-react';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { formatCurrency } from '@/lib/formatters';
import { useState } from 'react';

const categoryIcons: Record<string, React.ReactNode> = {
  'Assinaturas': <Tv size={16} />,
  'Moradia': <Home size={16} />,
  'Transporte': <Car size={16} />,
  'Saúde': <Dumbbell size={16} />,
  'Educação': <GraduationCap size={16} />,
  'Contas': <Wifi size={16} />,
  'default': <CreditCard size={16} />,
};

export function RecurringExpensesDashboard() {
  const { recurringExpenses, summary, insights } = useRecurringExpenses();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredExpenses = selectedCategory
    ? recurringExpenses.filter(e => e.category === selectedCategory)
    : recurringExpenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/80 to-purple-800/80 border border-purple-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Repeat size={16} className="text-purple-400" />
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Total/Mês</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(summary.totalMonthly)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/80 to-indigo-800/80 border border-indigo-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Total/Ano</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(summary.totalAnnual)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/80 to-amber-800/80 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Acima da Referência</span>
          </div>
          <div className="text-xl font-black text-white">
            {summary.overpricedCount}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/80 to-emerald-800/80 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Economia Potencial</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(summary.potentialSavings)}
          </div>
        </motion.div>
      </div>

      {/* Category Filter */}
      {summary.topCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <h3 className="text-sm font-bold text-white mb-3">Filtrar por Categoria</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === null
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Todas ({summary.itemCount})
            </button>
            {summary.topCategories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.category
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {cat.category} ({formatCurrency(cat.amount)})
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recurring Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Despesas Recorrentes {selectedCategory && `- ${selectedCategory}`}
          </h3>
          <span className="text-xs text-slate-500">
            {filteredExpenses.length} itens
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <Repeat size={48} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma despesa recorrente detectada</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-2xl border transition-all ${
                    expense.isOverpriced
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        expense.isOverpriced ? 'bg-amber-500/20' : 'bg-white/10'
                      }`}>
                        {categoryIcons[expense.category] || categoryIcons['default']}
                      </div>
                      <div>
                        <p className="font-bold text-white">{expense.description}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          {expense.category} • Dia {expense.paymentDay}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">
                        {formatCurrency(expense.averageAmount)}
                      </div>
                      <div className="text-[10px] text-slate-500">/mês</div>
                    </div>
                  </div>

                  {/* Trend & Comparison */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {expense.trend === 'increasing' && (
                        <div className="flex items-center gap-1 text-rose-400">
                          <TrendingUp size={12} />
                          <span className="text-[10px] font-bold">+{expense.trendPercent.toFixed(1)}%</span>
                        </div>
                      )}
                      {expense.trend === 'decreasing' && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <TrendingDown size={12} />
                          <span className="text-[10px] font-bold">{expense.trendPercent.toFixed(1)}%</span>
                        </div>
                      )}
                      {expense.trend === 'stable' && (
                        <div className="text-[10px] text-slate-500">Estável</div>
                      )}
                    </div>

                    {expense.isOverpriced && expense.marketComparison && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <AlertTriangle size={12} />
                        <span className="text-[10px] font-bold">
                          +{formatCurrency(expense.marketComparison.difference)} vs referência
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Market Comparison */}
                  {expense.marketComparison && (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Faixa de referência</span>
                        <span className="font-bold text-white">
                          {formatCurrency(expense.marketComparison.average)}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        Base usada: {expense.marketComparison.sourceLabel}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className="text-slate-500">Você paga</span>
                        <span className={`font-bold ${
                          expense.isOverpriced ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {formatCurrency(expense.averageAmount)}
                        </span>
                      </div>
                      {expense.isOverpriced && (
                        <p className="text-[9px] text-amber-400 mt-2">
                          {expense.marketComparison.recommendation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Next Payment */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Próximo pagamento</span>
                    <span className="text-xs font-bold text-white">
                      {new Date(expense.nextPayment).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </span>
                  </div>

                  {/* Annual Total */}
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Total últimos 12 meses</span>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(expense.totalPaidLast12Months)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Insights</span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-xs text-slate-300 leading-relaxed">{insight}</p>
            ))}
          </div>
        </motion.div>
      )}

      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Benchmarks desta tela são apenas referências heurísticas para renegociação e revisão de contratos. Não representam média oficial nacional.
        </p>
      </div>

      {/* Top Categories */}
      {summary.topCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <h3 className="text-lg font-bold text-white mb-4">Top Categorias</h3>
          <div className="space-y-3">
            {summary.topCategories.map((cat, i) => (
              <div key={cat.category} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black text-white">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{cat.category}</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-500">{cat.percent.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}