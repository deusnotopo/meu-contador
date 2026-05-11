import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, Lightbulb, Zap } from "lucide-react";

interface Decision {
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  trace?: string[];
}

interface DecisionFeedProps {
  decisions: Decision[];
  isLoading: boolean;
}

export const DecisionFeedWidget: React.FC<DecisionFeedProps> = ({ decisions, isLoading }) => {
  if (isLoading) {
    return <div className="h-48 w-full skeleton-pulse animate-pulse-akita rounded-3xl" />;
  }

  if (!decisions || decisions.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <Zap size={18} className="text-emerald-400" />
        </div>
        <h4 className="text-xs font-bold text-white/50">Tudo sob controle</h4>
        <p className="text-[10px] text-white/20 mt-1">Nenhum alerta crítico gerado pelo motor de regras no momento.</p>
      </div>
    );
  }

  const priorityConfig = {
    critical: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertCircle },
    high: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Lightbulb },
    medium: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: ArrowUpRight },
    low: { color: "text-white/40", bg: "bg-white/5", border: "border-white/10", icon: ArrowUpRight },
  };

  return (
    <div className="space-y-2">
      {decisions.slice(0, 3).map((decision, idx) => {
        const config = priorityConfig[decision.priority] || priorityConfig.low;
        const Icon = config.icon;
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-2xl border ${config.bg} ${config.border} flex items-start gap-3`}
          >
            <div className={`mt-0.5 ${config.color}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[8px] font-black uppercase tracking-widest ${config.color}`}>
                  {decision.category}
                </span>
                {decision.trace && decision.trace.length > 0 ? (
                  <span className="text-[7px] text-white/40 border border-white/10 bg-white/5 rounded px-1.5 py-0.5" title="Trace de Auditoria">
                    {decision.trace.join(', ')}
                  </span>
                ) : (
                  <span className="text-[8px] text-white/20">Auditado ✓</span>
                )}
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-white/80">
                {decision.message}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
