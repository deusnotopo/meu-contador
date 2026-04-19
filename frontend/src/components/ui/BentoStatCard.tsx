import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BentoStatCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'premium' | 'danger' | 'warning' | 'success';
}

export const BentoStatCard: React.FC<BentoStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  children,
  className,
  onClick,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-white/[0.03] border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
    premium: 'bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.02] border-amber-500/20 shadow-[0_8px_24px_rgba(245,158,11,0.05)]',
    danger: 'bg-red-500/[0.04] border-red-500/10 shadow-[0_4px_16px_rgba(239,68,68,0.05)]',
    warning: 'bg-yellow-500/[0.04] border-yellow-500/10 shadow-[0_4px_16px_rgba(234,179,8,0.05)]',
    success: 'bg-emerald-500/[0.04] border-emerald-500/10 shadow-[0_4px_16px_rgba(16,185,129,0.05)]'
  };

  const titleColors = {
    default: 'text-[var(--t3)]',
    premium: 'text-amber-400/80',
    danger: 'text-red-400/80',
    warning: 'text-yellow-400/80',
    success: 'text-emerald-400/80'
  };

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-[28px] border p-5 transition-all duration-300 backdrop-blur-xl',
        variantStyles[variant],
        onClick && 'cursor-pointer active:duration-75',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <h3 className={cn(
              "text-[10px] font-black uppercase tracking-[0.15em]",
              titleColors[variant]
            )}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[var(--t3)] font-medium leading-none">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded-xl flex items-center justify-center transition-colors",
              variant === 'default' ? "bg-white/[0.03] text-[var(--t2)]" : "bg-current opacity-20"
            )}>
              {icon}
            </div>
          )}
        </div>

        {value !== undefined && (
          <div className="flex items-baseline gap-2 mt-auto min-w-0">
            <span className="text-2xl font-bold tracking-[-0.03em] text-[var(--t1)] truncate tabular-nums font-mono">
              {value}
            </span>
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                trend.isPositive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        )}

        {children && (
          <div className={cn("mt-4 flex-1", !value && "mt-0")}>
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
};
