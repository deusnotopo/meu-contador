import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type {
  FeatureCardProps,
  SelectCardProps,
  StrategyRowProps,
  SummaryItemProps,
} from "./types";

export const FeatureCard = ({ icon: Icon, label }: FeatureCardProps) => (
  <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl">
    <Icon size={14} className="text-indigo-400" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{label}</span>
  </div>
);

export const SelectCard = ({ active, onClick, icon: Icon, label, sub }: SelectCardProps) => (
  <Button
    type="button"
    variant="glossy"
    onClick={onClick}
    aria-pressed={active}
    aria-label={`Selecionar ${label}`}
    className={`p-6 h-auto flex-col items-start justify-start rounded-2xl border text-left transition-all relative ${
      active
        ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
    }`}
  >
    <Icon className={`mb-3 transition-colors ${active ? "text-indigo-400" : "text-white/30"}`} size={24} />
    <p className="font-bold text-sm block mb-1 text-left">{label}</p>
    <p className="text-[10px] text-white/40 leading-tight text-left">{sub}</p>
    {active && <Check size={14} className="absolute top-4 right-4 text-indigo-400" />}
  </Button>
);

export const StrategyRow = ({ color, label, sub, val }: StrategyRowProps) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-8 rounded-full ${color}`} />
      <div>
        <p className="text-xs font-bold leading-none mb-1">{label}</p>
        <p className="text-[9px] text-white/30 font-medium">{sub}</p>
      </div>
    </div>
    <div className="text-sm font-black tabular-nums">{val}</div>
  </div>
);

export const SummaryItem = ({ label, value, highlight, danger }: SummaryItemProps & { danger?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 border-dashed">
    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black ${danger ? "text-rose-400" : highlight ? "text-emerald-400" : "text-white"}`}>
      {value}
    </span>
  </div>
);