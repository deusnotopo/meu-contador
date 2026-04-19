import { motion } from "framer-motion";
import { Target, Shield, AlertTriangle } from "lucide-react";

const ScoreRing = ({ score, color }: { score: number; color: string }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={90} height={90} className="rotate-[-90deg]">
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
      <motion.circle
        cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        strokeLinecap="round"
      />
    </svg>
  );
};

interface BudgetScoreHeroProps {
  score: number;
  scoreColor: string;
  financialScore: {
    classificacao: string;
    recomendacoes: string[];
  };
  savingsRate: number;
  emergencyMonths: number;
  debtRatio: number;
}

export const BudgetScoreHero = ({
  score,
  scoreColor,
  financialScore,
  savingsRate,
  emergencyMonths,
  debtRatio,
}: BudgetScoreHeroProps) => {
  return (
    <div className="card-obsidian h-full p-8 relative overflow-hidden border-white/5 bg-gradient-to-br from-[#0B0F19] to-[#050810] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-20 transition-opacity" 
           style={{ background: scoreColor }} />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 h-full">
        <div className="relative shrink-0 flex items-center justify-center pt-2">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-xl" />
          <ScoreRing score={score} color={scoreColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <span className="text-3xl font-black text-white font-mono truncate max-w-full">{score}</span>
            <span className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-0.5">Health</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col text-center md:text-left pt-2 justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black mb-1.5" style={{ color: scoreColor }}>
              Status da Saúde Financeira
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tighter leading-none truncate max-w-[95%]">
              {financialScore.classificacao}
            </div>
            <p className="text-sm text-white/50 mb-6 font-medium leading-relaxed max-w-lg">
              {financialScore.recomendacoes[0] || "Suas finanças estão em constante evolução rumo à antifragilidade."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Poupança", value: `${savingsRate.toFixed(0)}%`, ok: savingsRate >= 10, icon: <Target size={14} /> },
              { label: "Reserva", value: `${emergencyMonths.toFixed(1)}m`, ok: emergencyMonths >= 3, icon: <Shield size={14} /> },
              { label: "Dívida", value: `${debtRatio.toFixed(0)}%`, ok: debtRatio <= 30, icon: <AlertTriangle size={14} /> },
            ].map((m) => (
              <div key={m.label} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
                <div className="relative z-10">
                  <div className={`flex items-center justify-center md:justify-start gap-1.5 mb-1.5 ${m.ok ? "text-emerald-400" : "text-amber-400"}`}>
                    {m.icon}
                    <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                  </div>
                  <div className={`text-xl font-black font-mono tracking-tight ${m.ok ? "text-emerald-50" : "text-amber-50"}`}>
                    {m.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
