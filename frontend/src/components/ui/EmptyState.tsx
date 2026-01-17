import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-3xl border border-white/10 border-dashed animate-fade-in">
      <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4 text-indigo-400">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{description}</p>

      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-6"
        >
          {actionLabel}
        </Button>
      )}

      {tips && tips.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5 w-full max-w-md">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Dica de Mestre
          </p>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-left">
            <p className="text-sm text-emerald-100 font-medium">💡 {tips[0]}</p>
          </div>
        </div>
      )}
    </div>
  );
};
