import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { TabType } from "@/types/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SetupMission {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  xp: number;
  done: boolean;
  tab: TabType;
  hide?: boolean;
}

interface SetupJourneyWidgetProps {
  missions: SetupMission[];
  onNavigate?: (tab: TabType) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const SetupJourneyWidget = ({
  missions,
  onNavigate,
}: SetupJourneyWidgetProps) => {
  const done = missions.filter((m) => m.done);
  const pct = Math.round((done.length / missions.length) * 100);
  const totalXp = missions.reduce((s, m) => s + m.xp, 0);
  const xpEarned = done.reduce((s, m) => s + m.xp, 0);
  const pending = missions.filter((m) => !m.done);

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-gradient-to-br from-indigo-500/10 via-white/[0.02] to-purple-500/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">
            Jornada de Setup
          </div>
          <div className="text-[13px] font-bold text-white">
            Desbloqueie o poder total do app
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-amber-400">+{xpEarned} XP</div>
          <div className="text-[10px] text-white/30">de {totalXp} XP</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-white/40 font-bold">
          <span>{done.length}/{missions.length} módulos</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      {/* Pending missions — max 3 */}
      <div className="space-y-2 max-h-[200px] overflow-hidden">
        {pending.slice(0, 3).map((mission) => (
          <button
            key={mission.id}
            type="button"
            aria-label={`${mission.label} — ${mission.sub}`}
            onClick={() => onNavigate?.(mission.tab)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-indigo-500/30 transition-all active:scale-[0.98] text-left"
          >
            <div
              className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl shrink-0"
              aria-hidden
            >
              {mission.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-white truncate">{mission.label}</div>
              <div className="text-[10px] text-white/40 truncate">{mission.sub}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11px] font-black text-amber-400">+{mission.xp} XP</div>
              <ChevronRight size={11} className="text-white/20 mt-0.5 ml-auto" aria-hidden />
            </div>
          </button>
        ))}

        {/* Completed chips */}
        {done.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1" role="list" aria-label="Missões concluídas">
            {done.map((mission) => (
              <div
                key={mission.id}
                role="listitem"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                <span aria-hidden>{mission.emoji}</span>
                <span className="text-[10px] font-bold text-emerald-400 line-through opacity-70">
                  {mission.label.split(" ").slice(0, 2).join(" ")}
                </span>
                <span className="text-[9px] text-emerald-400/60" aria-hidden>✓</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
