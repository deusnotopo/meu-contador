import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { Button } from "./button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="relative p-6 text-center bg-gradient-to-b from-indigo-500/20 to-transparent">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-500/20 text-indigo-400">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Seja Premium</h2>
            <p className="text-slate-400">Desbloqueie todo o potencial das suas finanças.</p>
          </div>

          {/* Benefits */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 mt-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Analytics Avançado</h3>
                <p className="text-sm text-slate-400">Gráficos interativos e tendências mensais.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 mt-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Assistente IA Ilimitado</h3>
                <p className="text-sm text-slate-400">Dicas personalizadas para o seu perfil.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 mt-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Multimoedas</h3>
                <p className="text-sm text-slate-400">Gerencie contas em Dólar, Euro e mais.</p>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="p-6 pt-0">
            <Button className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/20">
              Começar Teste Grátis
            </Button>
            <p className="mt-4 text-xs text-center text-slate-500">
              7 dias grátis, cancele quando quiser.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
