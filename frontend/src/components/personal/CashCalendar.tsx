import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const CashCalendar = () => {
  const { recurringExpenses } = useRecurringExpenses();
  const today = new Date();
  const currentDay = today.getDate();

  // Sort upcoming expenses by day
  const getSortWeight = (day: number) => day < currentDay ? day + 31 : day;
  const upcoming = [...recurringExpenses].sort((a, b) => getSortWeight(a.paymentDay) - getSortWeight(b.paymentDay));

  if (upcoming.length === 0) return null;

  return (
    <div className="glass-panel mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
          <Calendar size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">Calendário de Caixa</h3>
          <p className="text-xs text-white/50">Suas despesas recorrentes</p>
        </div>
      </div>

      <div className="space-y-3">
        {upcoming.map((exp, i) => {
          const isPaid = exp.paymentDay < currentDay;
          const isToday = exp.paymentDay === currentDay;

          return (
            <div 
              key={i} 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isPaid ? 'border-white/5 opacity-50 bg-white/5' : 
                isToday ? 'border-amber-500/30 bg-amber-500/10' : 
                'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isPaid ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : isToday ? (
                    <Circle size={18} fill="currentColor" className="text-amber-500" />
                  ) : (
                   <Circle size={18} className="text-white/20" />
                  )}
                </div>
                <div>
                  <div className={`font-bold text-sm ${isToday ? 'text-amber-400' : 'text-white'}`}>
                    {exp.description}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase font-black tracking-wider mt-0.5">
                    {isPaid ? `Venceu dia ${exp.paymentDay}` : isToday ? 'Vence Hoje' : `Vence dia ${exp.paymentDay}`}
                  </div>
                </div>
              </div>
              <div className={`font-black tracking-tight ${isPaid ? 'text-white/40' : 'text-white'}`}>
                {formatCurrency(exp.averageAmount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
