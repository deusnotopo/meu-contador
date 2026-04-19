import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/formatters";

interface EnvelopeCardProps {
  env: {
    id: string;
    category: string;
    limit: number;
    spent: number;
    icon: React.ReactNode;
  };
  onClick: (id: string) => void;
}

export const EnvelopeCard = ({ env, onClick }: EnvelopeCardProps) => {
  const pct = Math.min((env.spent / env.limit) * 100, 100);
  const isOver = env.spent > env.limit;

  return (
    <motion.div
      layoutId={`env-card-${env.id}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(env.id)}
      className={`premium-card p-6 cursor-pointer border transition-all ${
        isOver
          ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
          : "bg-white/5 border-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
              isOver ? "bg-rose-500/20" : "bg-white/10"
            }`}
          >
            {env.icon}
          </div>
          <div>
            <h4 className="font-bold text-white text-base leading-tight mb-1">{env.category}</h4>
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${
                isOver ? "text-rose-400" : "text-[var(--t3)]"
              }`}
            >
              {isOver
                ? `ESTOUROU +${formatCurrency(env.spent - env.limit).replace(",00", "")}`
                : `Sobra ${formatCurrency(env.limit - env.spent).replace(",00", "")}`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className={`text-xl font-black ${isOver ? "text-rose-400" : "text-white"}`}>
            {formatCurrency(env.spent).replace(",00", "")}
          </span>
          <span className="text-xs font-medium text-[var(--t4)]">
            de {formatCurrency(env.limit).replace(",00", "")}
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isOver
                ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                : pct > 80
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};
