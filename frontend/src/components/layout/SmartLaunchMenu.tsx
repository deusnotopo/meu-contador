import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, TrendingDown, TrendingUp, Plus, X, PieChart, Sparkles } from "lucide-react";

interface SmartLaunchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "expense" | "income" | "voice" | "asset") => void;
}

export const SmartLaunchMenu: React.FC<SmartLaunchMenuProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="slm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md touch-none"
          />

          {/* Bottom Sheet */}
          <motion.div
            key="slm-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 z-[51] rounded-t-[32px] border-t border-white/5 shadow-[0_-24px_80px_rgba(0,0,0,0.6)] bg-[var(--card-obsidian)] overflow-hidden px-5 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] overscroll-none"
          >
            {/* Ambient Background Glow for Dark Obsidian effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/10 blur-[60px] pointer-events-none rounded-full" />

            {/* Handle */}
            <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-white text-[22px] font-bold tracking-tight m-0 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Lançamento Rápido
                </h2>
                <p className="text-[var(--t3)] text-sm mt-1 font-medium">
                  Selecione a operação desejada
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[var(--t3)] flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {/* Voz (V2 - Mais IA) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onAction("voice")}
                className="col-span-2 relative overflow-hidden rounded-[20px] p-5 text-left border-none cursor-pointer min-h-[120px] group bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-lg shadow-blue-900/30"
              >
                {/* Glow Decoration */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="absolute top-4 right-4 opacity-10 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                  <Mic size={80} color="#fff" />
                </div>
                
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                    <Mic size={20} color="#fff" />
                  </div>
                  <div className="text-white font-bold text-[17px] tracking-tight mb-1">
                    Comando de Voz
                  </div>
                  <div className="text-blue-100/80 text-[13px] font-medium tracking-wide">
                    "Gastei 50 reais de padaria"
                  </div>
                </div>
              </motion.button>

              {/* Red - Despesa */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction("expense")}
                className="rounded-[18px] p-5 text-left bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                  <TrendingDown size={18} className="text-red-400" />
                </div>
                <div className="text-red-400 font-bold text-[15px] tracking-tight">Despesa</div>
                <div className="text-[var(--t3)] text-[12px] font-medium mt-1 tracking-wide">Registrar saída</div>
              </motion.button>

              {/* Green - Receita */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction("income")}
                className="rounded-[18px] p-5 text-left bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>
                <div className="text-emerald-400 font-bold text-[15px] tracking-tight">Receita</div>
                <div className="text-[var(--t3)] text-[12px] font-medium mt-1 tracking-wide">Registrar entrada</div>
              </motion.button>

              {/* Asset - Investimento */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction("asset")}
                className="col-span-2 rounded-[18px] p-[18px] bg-white/[0.03] hover:bg-white/[0.05] border border-white/8 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <PieChart size={20} className="text-[var(--t2)]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[var(--t1)] font-bold text-[15px] tracking-tight">Novo Investimento</div>
                    <div className="text-[var(--t3)] text-[12px] font-medium mt-1 tracking-wide">Adicionar ativo à carteira</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center shrink-0 transition-colors">
                  <Plus size={16} className="text-[var(--t3)] group-hover:text-blue-400 transition-colors" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
