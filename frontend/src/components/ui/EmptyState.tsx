
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tips?: string[];
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tips,
}: EmptyStateProps) => {
  return (
    <div
      className="card flex flex-col items-center justify-center px-6 py-8 text-center border-dashed bg-white/[0.02] animate-[fsu_0.4s_ease-out]"
    >
      {/* Icon box */}
      <div className="p-4 bg-[var(--purple-d)] rounded-2xl mb-4 flex items-center justify-center text-[var(--purple)]">
        <Icon size={32} />
      </div>

      <h3 className="text-[18px] font-bold text-[var(--t1)] mb-2">{title}</h3>

      <p className="text-[13px] text-[var(--t2)] leading-[1.5] max-w-[240px] mb-5">
        {description}
      </p>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="btn-p w-auto px-6 py-2.5 text-[13px]"
        >
          {actionLabel}
        </button>
      )}

      {tips && tips.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[var(--border)] w-full">
          <div className="eyebrow text-center mb-2">💡 Dica de Mestre</div>
          <div className="nudge good text-left m-0 p-3">
            <div className="nudge-body text-[12px]">{tips[0]}</div>
          </div>
        </div>
      )}
    </div>
  );
};
