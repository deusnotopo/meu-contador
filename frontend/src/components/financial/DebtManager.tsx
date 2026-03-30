import { motion } from 'framer-motion';
import { 
  CreditCard, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Calendar,
  DollarSign,
  Flame,
  Snowflake
} from 'lucide-react';
import { useDebtStrategy } from '@/hooks/useDebtStrategy';
import { formatCurrency } from '@/lib/formatters';
import { useState } from 'react';

export function DebtManager() {
  const { 
    avalancheStrategy, 
    snowballStrategy, 
    bestStrategy, 
    insights, 
    debtFreeDate,
    totalDebt,
    totalMonthlyInterest
  } = useDebtStrategy();
  
  const [selectedMethod, setSelectedMethod] = useState<'avalanche' | 'snowball'>(
    bestStrategy.method
  );

  const currentStrategy = selectedMethod === 'avalanche' ? avalancheStrategy : snowballStrategy;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-rose-900/80 to-rose-800/80 border border-rose-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-rose-400" />
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Dívida Total</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(totalDebt)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/80 to-amber-800/80 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Juros/Mês</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(totalMonthlyInterest)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/80 to-indigo-800/80 border border-indigo-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Livre em</span>
          </div>
          <div className="text-xl font-black text-white">
            {currentStrategy.monthsToFreedom}m
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
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Economia</span>
          </div>
          <div className="text-xl font-black text-white">
            {formatCurrency(bestStrategy.interestSaved)}
          </div>
        </motion.div>
      </div>

      {/* Method Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
      >
        <h3 className="text-lg font-bold text-white mb-4">Método de Quitação</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Avalanche */}
          <button
            onClick={() => setSelectedMethod('avalanche')}
            className={`p-4 rounded-2xl border transition-all text-left ${
              selectedMethod === 'avalanche'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} className="text-orange-400" />
              <span className="font-bold text-white">Avalanche</span>
              {bestStrategy.method === 'avalanche' && (
                <span className="text-[9px] font-bold text-indigo-400 uppercase px-2 py-0.5 rounded-full bg-indigo-500/20">
                  Recomendado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Quite primeiro as dívidas com maiores juros. Economiza mais dinheiro.
            </p>
            <div className="mt-3 text-sm font-bold text-indigo-400">
              {formatCurrency(avalancheStrategy.totalInterestPaid)} em juros
            </div>
          </button>

          {/* Snowball */}
          <button
            onClick={() => setSelectedMethod('snowball')}
            className={`p-4 rounded-2xl border transition-all text-left ${
              selectedMethod === 'snowball'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Snowflake size={20} className="text-blue-400" />
              <span className="font-bold text-white">Bola de Neve</span>
              {bestStrategy.method === 'snowball' && (
                <span className="text-[9px] font-bold text-indigo-400 uppercase px-2 py-0.5 rounded-full bg-indigo-500/20">
                  Recomendado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Quite primeiro as dívidas menores. Ganhe motivação rápida.
            </p>
            <div className="mt-3 text-sm font-bold text-blue-400">
              {formatCurrency(snowballStrategy.totalInterestPaid)} em juros
            </div>
          </button>
        </div>
      </motion.div>

      {/* Debt List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Suas Dívidas ({selectedMethod === 'avalanche' ? 'Avalanche' : 'Bola de Neve'})
          </h3>
          <span className="text-xs text-slate-500">Ordem de quitação</span>
        </div>

        {currentStrategy.debts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma dívida registrada!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentStrategy.debts.map((debt, index) => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-2xl border transition-all ${
                  index === 0 
                    ? 'border-rose-500/50 bg-rose-500/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                      index === 0 ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{debt.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{debt.category}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="text-[9px] font-bold text-rose-400 uppercase px-2 py-0.5 rounded-full bg-rose-500/20">
                      Prioridade
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Saldo</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(debt.balance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Juros/Mês</p>
                    <p className="text-sm font-bold text-rose-400">{debt.interestRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Pagamento</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(debt.minPayment)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Juros totais se pagar mínimo</span>
                    <span>{formatCurrency(debt.totalInterestPaid)}</span>
                  </div>
                  <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                      style={{ width: `${Math.min((debt.totalInterestPaid / debt.balance) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payoff Timeline */}
      {currentStrategy.payoffOrder.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10"
        >
          <h3 className="text-lg font-bold text-white mb-4">Linha do Tempo de Quitação</h3>
          
          <div className="space-y-2">
            {currentStrategy.payoffOrder.slice(0, 5).map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-sm font-black text-emerald-400">{event.month}m</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{event.debtName}</p>
                  <p className="text-[10px] text-slate-500">Mês {event.month}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(event.amount)}
                </span>
              </div>
            ))}
            
            {currentStrategy.payoffOrder.length > 5 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                +{currentStrategy.payoffOrder.length - 5} eventos de quitação
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Data de Liberdade
            </span>
            <span className="text-lg font-black text-emerald-400 capitalize">
              {debtFreeDate}
            </span>
          </div>
        </motion.div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${
                insight.type === 'warning'
                  ? 'bg-rose-500/10 border-rose-500/20'
                  : insight.type === 'tip'
                  ? 'bg-indigo-500/10 border-indigo-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {insight.type === 'warning' && <AlertTriangle size={16} className="text-rose-400 mt-0.5" />}
                {insight.type === 'tip' && <Zap size={16} className="text-indigo-400 mt-0.5" />}
                {insight.type === 'achievement' && <CheckCircle size={16} className="text-emerald-400 mt-0.5" />}
                <div>
                  <p className="font-bold text-white text-sm">{insight.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
                  {insight.impact && (
                    <p className="text-[10px] text-slate-500 mt-2">{insight.impact}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}