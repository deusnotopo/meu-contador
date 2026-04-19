import { ReactNode, useState } from "react";
import { Lock, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";
import { Button } from "./button";
import { UpgradeModal } from "./UpgradeModal";

interface PremiumGateProps {
  children: ReactNode;
  feature: "premium_analytics" | "ai_advisor" | "multi_currency" | "investments" | "invoices";
  fallback?: ReactNode;
}

// Centralizado aqui — quando o preço mudar, muda uma linha só.
const UPGRADE_PRICE_LABEL = "Apenas R\u00a014,99 • Vitalício";

const FEATURE_LABELS: Record<string, { title: string; desc: string }> = {
  premium_analytics: { title: "Analytics Avançado", desc: "Visualize tendências e projeções detalhadas do seu patrimônio." },
  ai_advisor: { title: "Consultor IA 24/7", desc: "Obtenha insights em tempo real sobre sua saúde financeira com inteligência artificial." },
  multi_currency: { title: "Multimoedas", desc: "Gerencie ativos em Dólar, Euro e Cripto de forma integrada." },
  investments: { title: "Portfólio de Investimentos", desc: "Acompanhe rentabilidade, dividendos e alocação de ativos PRO." },
  invoices: { title: "Gestão Empresarial", desc: "Emita notas, controle faturamento e gerencie seu negócio com DRE completo." },
};

export function PremiumGate({ children, feature, fallback }: PremiumGateProps) {
  const { isEnabled } = useFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasAccess = isEnabled(feature);
  const info = FEATURE_LABELS[feature] || { title: "Recurso Premium", desc: "Faça upgrade para acessar este recurso e muito mais." };

  if (hasAccess) {
    return <>{children}</>;
  }

  // Se o caller passar um fallback customizado, usa ele em vez do paywall padrão.
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-full min-h-[320px] rounded-3xl overflow-hidden border border-white/5 bg-[#0B1220]/50 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
      >
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 ring-1 ring-white/20">
              <Lock size={28} />
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-amber-950 border-2 border-[#0B1220]"
            >
              <Sparkles size={14} fill="currentColor" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              {info.title}
              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-black border border-amber-500/20">PRO</span>
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed font-medium">
              {info.desc}
            </p>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Button 
              onClick={() => setShowUpgrade(true)}
              className="h-12 bg-white text-indigo-950 hover:bg-white/90 font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group"
            >
              <Zap size={16} className="mr-2 fill-indigo-950" />
              DESBLOQUEAR TUDO
            </Button>
            
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
              {UPGRADE_PRICE_LABEL}
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showUpgrade && (
          <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        )}
      </AnimatePresence>
    </>
  );
}


