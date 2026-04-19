import { ShieldCheck } from "lucide-react";
import type { DataReliability } from "@/lib/data-reliability";
import { getDataReliabilityMeta } from "@/lib/data-reliability";

interface DataReliabilityBadgeProps {
  reliability: DataReliability;
  sourceLabel?: string;
  compact?: boolean;
  className?: string;
}

export const DataReliabilityBadge = ({
  reliability,
  sourceLabel,
  compact = false,
  className = "",
}: DataReliabilityBadgeProps) => {
  const meta = getDataReliabilityMeta(reliability);
  const tooltip = sourceLabel
    ? `${meta.description} Fonte: ${sourceLabel}.`
    : meta.description;

  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-bold",
        compact ? "text-[9px] tracking-wide" : "text-[10px] tracking-[0.08em]",
        meta.tone,
        meta.border,
        meta.bg,
        className,
      ].join(" ")}
      title={tooltip}
      aria-label={tooltip}
    >
      <ShieldCheck size={compact ? 10 : 12} aria-hidden />
      <span>{compact ? meta.shortLabel : meta.label}</span>
      {sourceLabel && !compact && <span className="opacity-80">· {sourceLabel}</span>}
    </div>
  );
};