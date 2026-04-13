// ─── DailySpendingWidget ────────────────────────────────────────────────────
// Shows the sustainable daily spending rate based on net worth (Modigliani model).

interface DailySpendingWidgetProps {
  sustainableDaily: number;
  fmt: (n: number) => string;
}

export const DailySpendingWidget = ({
  sustainableDaily,
  fmt,
}: DailySpendingWidgetProps) => (
  <div className="bento-card bg-[linear-gradient(145deg,rgba(74,139,255,0.05),transparent)]">
    <div className="text-[9px] font-bold uppercase tracking-widest mb-2 text-blue-400 opacity-70">
      Gasto Diário Modigliani
    </div>
    <div className="flex items-baseline gap-2">
      <span
        className="text-3xl font-bold tabular-nums text-white tracking-tight font-mono"
        aria-label={`${fmt(sustainableDaily)} por dia`}
      >
        {fmt(sustainableDaily)}
      </span>
      <span className="text-xs text-neutral-500">/dia</span>
    </div>
    <div className="text-[11.5px] mt-2 font-medium leading-relaxed text-neutral-500">
      Baseado no patrimônio atual projetado.
    </div>
  </div>
);
