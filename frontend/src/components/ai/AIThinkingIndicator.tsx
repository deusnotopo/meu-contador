import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Cpu, Brain, Search } from "lucide-react";

const THINKING_STEPS = [
  { icon: Brain,  text: "Analisando contexto financeiro...",    color: "text-indigo-400", bg: "bg-indigo-500/20" },
  { icon: Search, text: "Cruzando dados patrimoniais...",       color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { icon: Cpu,    text: "Gerando recomendação personalizada...", color: "text-violet-400", bg: "bg-violet-500/20" },
  { icon: Bot,    text: "Elaborando resposta...",               color: "text-sky-400", bg: "bg-sky-500/20" },
];

/** Typewriter que cicla suavemente entre as fases de raciocínio */
export const AIThinkingIndicator = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [dots, setDots]       = useState("");

  // Avança de fase a cada ~2.2s
  useEffect(() => {
    const iv = setInterval(() => {
      setStepIdx((s) => (s + 1) % THINKING_STEPS.length);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  // Efeito de pontos piscando: "." → ".." → "..." → ""
  useEffect(() => {
    const iv = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 420);
    return () => clearInterval(iv);
  }, []);

  const step = THINKING_STEPS[stepIdx]!;
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex gap-4 items-start"
    >
      {/* Avatar da IA pulsando */}
      <div className={`relative mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border border-white/10 ${step.bg} transition-all duration-700`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Icon size={20} className={`${step.color} transition-all duration-700`} />
          </motion.div>
        </AnimatePresence>
        {/* Anel de pulso externo */}
        <span className={`absolute inset-0 rounded-xl animate-ping opacity-20 ${step.bg}`} />
      </div>

      {/* Balão com shimmer */}
      <div className="flex flex-col gap-2 flex-1 max-w-[80%]">
        {/* Linha de status dinâmica */}
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
          <AnimatePresence mode="wait">
            <motion.span
              key={stepIdx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.25 }}
              className={`text-xs font-semibold ${step.color}`}
            >
              {step.text}{dots}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Skeleton shimmer — simula o corpo da resposta chegando */}
        <div className="px-5 py-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-2.5">
          <SkeletonLine width="60%" delay={0} />
          <SkeletonLine width="90%" delay={0.1} />
          <SkeletonLine width="75%" delay={0.2} />
          <div className="pt-1" />
          <SkeletonLine width="85%" delay={0.3} />
          <SkeletonLine width="45%" delay={0.4} />
        </div>
      </div>
    </motion.div>
  );
};

/** Uma linha de skeleton com animação de shimmer gradiente */
const SkeletonLine = ({ width, delay }: { width: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration: 0.4 }}
    style={{ width }}
    className="h-2.5 rounded-full overflow-hidden bg-white/5"
  >
    <motion.div
      className="h-full w-full rounded-full"
      style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.35) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% center", "-200% center"] }}
      transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
    />
  </motion.div>
);
