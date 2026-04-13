import React from "react";
import { motion } from "framer-motion";
import { Plus, AlertCircle, ArrowRight } from "lucide-react";
import { PrivacyValue } from "@/components/ui/PrivacyValue";
import type { TabType } from "@/types/navigation";

interface RecentTransactionsProps {
  transactions: {
    id: string;
    ico: string;
    ti: string;
    cat: string;
    am: number;
  }[];
  onNavigate?: (tab: TabType) => void;
  fmt: (n: number) => string;
  error?: boolean | string | null;
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.045, type: "spring", stiffness: 160, damping: 20 },
  }),
};

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onNavigate,
  fmt,
  error,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <AlertCircle size={20} className="text-amber-400 opacity-60" />
        <div className="text-[12px] font-semibold text-white/50">Conexão falhou</div>
        <div className="text-[11px] text-white/25 text-center">
          Não foi possível carregar as transações.
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <button
        type="button"
        onClick={() => onNavigate?.("launch")}
        className="w-full flex flex-col items-center justify-center py-8 gap-3 rounded-2xl transition-all active:scale-[0.98] hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 border border-dashed border-white/[0.07]"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.6 }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(74,139,255,0.1)", border: "1px solid rgba(74,139,255,0.2)" }}
        >
          <Plus size={20} className="text-blue-400" />
        </motion.div>
        <div>
          <div className="text-[13px] font-bold text-white/60">Nenhuma transação ainda</div>
          <div className="text-[11px] text-white/25 mt-0.5 text-center">Toque para lançar a primeira</div>
        </div>
      </button>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--t3)" }}>
          Últimas transações
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
          onClick={() => onNavigate?.("personal")}
        >
          Ver todas <ArrowRight size={11} />
        </button>
      </div>

      {/* Staggered rows */}
      <div className="-mx-2" role="list" aria-label="Transações recentes">
        {transactions.map((tx, i) => {
          const isPlus = tx.am > 0;
          return (
            <motion.button
              key={tx.id}
              role="listitem"
              type="button"
              custom={i}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              onClick={() => onNavigate?.("personal")}
              className="group w-full flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] px-2 rounded-xl transition-all duration-200 active:scale-[0.98] text-left"
            >
              {/* Icon */}
              <motion.div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-[17px] border border-white/[0.05] flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: isPlus ? "rgba(0,217,145,0.08)" : "rgba(255,255,255,0.04)" }}
                aria-hidden
              >
                {tx.ico}
              </motion.div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-100 truncate">{tx.ti}</div>
                <div className="text-[11px] text-gray-500 truncate mt-0.5">{tx.cat}</div>
              </div>

              {/* Amount */}
              <div
                className={`text-[13px] font-bold tabular-nums flex-shrink-0 transition-colors duration-200 ${
                  isPlus ? "text-emerald-400" : "text-red-400"
                }`}
                style={{ fontFamily: "var(--mono)" }}
              >
                {isPlus ? "+" : "−"}&nbsp;<PrivacyValue value={Math.abs(tx.am)} displayValue={fmt(Math.abs(tx.am))} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
