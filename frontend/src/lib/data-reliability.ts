export const dataReliabilityValues = [
  "REAL",
  "ESTIMATED",
  "HEURISTIC",
  "BENCHMARK",
  "EXTERNAL_SOURCE",
] as const;

export type DataReliability = (typeof dataReliabilityValues)[number];

export interface DataReliabilityMeta {
  label: string;
  shortLabel: string;
  description: string;
  tone: string;
  border: string;
  bg: string;
}

export const dataReliabilityMeta: Record<DataReliability, DataReliabilityMeta> = {
  REAL: {
    label: "Dado real",
    shortLabel: "Real",
    description: "Valor registrado a partir de dados operacionais do usuário.",
    tone: "text-emerald-300",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/10",
  },
  ESTIMATED: {
    label: "Estimativa",
    shortLabel: "Estimado",
    description: "Valor calculado por aproximação a partir da fotografia atual.",
    tone: "text-amber-300",
    border: "border-amber-500/25",
    bg: "bg-amber-500/10",
  },
  HEURISTIC: {
    label: "Heurístico",
    shortLabel: "Heurístico",
    description: "Valor orientativo baseado em regras internas do app.",
    tone: "text-violet-300",
    border: "border-violet-500/25",
    bg: "bg-violet-500/10",
  },
  BENCHMARK: {
    label: "Benchmark",
    shortLabel: "Benchmark",
    description: "Referência comparativa, não representa sua verdade operacional.",
    tone: "text-sky-300",
    border: "border-sky-500/25",
    bg: "bg-sky-500/10",
  },
  EXTERNAL_SOURCE: {
    label: "Fonte externa",
    shortLabel: "Fonte externa",
    description: "Valor importado ou sincronizado a partir de integração externa.",
    tone: "text-cyan-300",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/10",
  },
};

export function getDataReliabilityMeta(reliability: DataReliability) {
  return dataReliabilityMeta[reliability];
}