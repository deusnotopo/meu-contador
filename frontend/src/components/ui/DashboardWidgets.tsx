import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: typeof DollarSign;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
}

const COLOR_MAP = {
  indigo: { bg: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20', icon: 'bg-indigo-500/10 text-indigo-400' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20', icon: 'bg-emerald-500/10 text-emerald-400' },
  rose: { bg: 'from-rose-500/10 to-rose-600/5 border-rose-500/20', icon: 'bg-rose-500/10 text-rose-400' },
  amber: { bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20', icon: 'bg-amber-500/10 text-amber-400' },
} as const;

const CHART_COLORS = {
  indigo: 'from-indigo-500 to-indigo-400',
  emerald: 'from-emerald-500 to-emerald-400',
  rose: 'from-rose-500 to-rose-400',
  amber: 'from-amber-500 to-amber-400',
} as const;

export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'indigo',
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const cls = COLOR_MAP[color] ?? COLOR_MAP.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-premium p-6 rounded-2xl border bg-gradient-to-br ${cls.bg}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${cls.icon}`}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-[var(--t3)] mb-1">{title}</p>
        <p className="text-2xl font-bold text-[var(--t1)]">{value}</p>
      </div>
    </motion.div>
  );
});

interface MiniChartProps {
  title: string;
  data: number[];
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
}

export const MiniChart = memo(function MiniChart({
  title,
  data,
  color = 'indigo',
}: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const gradCls = CHART_COLORS[color] ?? CHART_COLORS.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium p-6 rounded-2xl border border-white/10"
    >
      <h3 className="text-sm text-[var(--t3)] mb-4">{title}</h3>
      <div className="flex items-end gap-1 h-24">
        {data.map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.05 }}
              className={`flex-1 bg-gradient-to-t ${gradCls} rounded-t opacity-80 hover:opacity-100 transition-opacity`}
              style={{ minHeight: '4px' }}
            />
          );
        })}
      </div>
    </motion.div>
  );
});

export { DollarSign, Calendar, TrendingUp, TrendingDown };
