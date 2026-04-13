import { useOnboarding } from "../OnboardingContext";
import { Brain, Check, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { FeatureCard } from "../StepCards";

export const WelcomeStep = () => {
  const { profile, handleProfileChange: onChange, validationErrors } = useOnboarding();

  return (
  <div className="text-center space-y-8 pt-10">
    <motion.div
      initial={{ scale: 0.8, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center p-5 shadow-2xl shadow-indigo-500/40"
    >
      <Sparkles size={48} className="text-white fill-white/20" />
    </motion.div>

    <div className="space-y-4">
      <h2 className="text-4xl font-black tracking-tight leading-tight">
        Olá! Vamos organizar sua <span className="text-indigo-400">base financeira.</span>
      </h2>
      <p className="text-lg text-white/50 font-medium">Em poucos passos, vamos montar um plano inicial útil e personalizar seu painel.</p>
    </div>

    <div className="grid grid-cols-2 gap-3 pt-4">
      <FeatureCard icon={Brain} label="Inteligência BR" />
      <FeatureCard icon={Shield} label="Privacidade Total" />
    </div>

    <div className="pt-2 space-y-4">
      <p className="text-sm font-bold text-white/60 uppercase tracking-widest text-[10px]">Como você se sente com suas finanças hoje?</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "😰", label: "Ansioso com dívidas", value: "anxious" },
          { emoji: "😐", label: "Estagnado, sem evoluir", value: "stuck" },
          { emoji: "📈", label: "Animado para investir", value: "excited" },
          { emoji: "🛡️", label: "Quero me proteger", value: "protective" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange("investorProfile", opt.value)}
            className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
              profile.investorProfile === opt.value
                ? "bg-indigo-600/25 border-indigo-400 text-white"
                : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
            }`}
          >
            <div className="text-2xl">{opt.emoji}</div>
            <div className="text-xs font-bold leading-tight">{opt.label}</div>
          </button>
        ))}
      </div>
    </div>

    <div className="pt-2">
      <button
        type="button"
        onClick={() => onChange("lgpdConsent", !profile.lgpdConsent)}
        aria-pressed={!!profile.lgpdConsent}
        aria-invalid={!!validationErrors.lgpdConsent}
        className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all ${
          profile.lgpdConsent ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/10 hover:border-white/20"
        }`}
      >
        <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
          profile.lgpdConsent ? "bg-emerald-500 border-emerald-500" : "border-white/20"
        }`}>
          {profile.lgpdConsent && <Check size={12} className="text-white" />}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white">Autorizo o uso dos meus dados financeiros</p>
          <p className="text-[10px] text-white/40 mt-0.5">Seus dados ficam <strong>apenas no Brasil</strong>, em servidores seguros, nunca compartilhados com terceiros. Em conformidade com a LGPD.</p>
        </div>
      </button>
      {validationErrors.lgpdConsent && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.lgpdConsent}</p>}
    </div>
  </div>
);
};
