import React, { useId } from "react";

interface MonteCarloPoint {
  month: number;
  p5: number;
  p50: number;
  p95: number;
}

interface ProbabilisticAreaChartProps {
  data: MonteCarloPoint[];
  color?: string;
  h?: number;
  w?: number;
}

const safeNumber = (n: number, fallback: number = 0): number => {
  return typeof n === 'number' && !isNaN(n) && isFinite(n) ? n : fallback;
};

export const ProbabilisticAreaChart: React.FC<ProbabilisticAreaChartProps> = ({
  data,
  color = "#4A8BFF",
  h = 100,
  w = 318
}) => {
  const baseId = useId();
  if (!data || data.length === 0) return null;

  // Encontrar o máximo global entre p5, p50 e p95 para escala correta
  const allValues = data.flatMap(d => [d.p5, d.p50, d.p95]);
  const max = Math.max(...allValues) || 1;
  const min = Math.min(...allValues);
  const range = (max - min) || 1;

  const getX = (i: number) => (i / (data.length - 1)) * w;
  const getY = (v: number) => h - ((safeNumber(v) - min) / range) * (h - 10) - 5;

  // Pontos para a linha da Mediana (p50)
  const p50Points = data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.p50).toFixed(1)}`).join(' ');

  // Pontos para a Banda de Confiança (p5 até p95)
  // Criamos um polígono que vai do início ao fim pelo p95 e volta do fim ao início pelo p5
  const p95Points = data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.p95).toFixed(1)}`);
  const p5PointsReversed = [...data].reverse().map((d, i) => {
    const originalIndex = data.length - 1 - i;
    return `${getX(originalIndex).toFixed(1)},${getY(d.p5).toFixed(1)}`;
  });
  
  const bandContent = [...p95Points, ...p5PointsReversed].join(' ');

  const gradId = `${baseId}-band-grad`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Banda de Confiança (p5-p95) */}
      <polygon 
        points={bandContent} 
        fill={`url(#${gradId})`} 
        style={{ transition: "all 0.3s ease" }}
      />
      
      {/* Linha da Mediana (p50) */}
      <polyline 
        points={p50Points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ transition: "all 0.3s ease" }}
      />
      
      {/* Linhas pontilhadas opcionais para os limites (p5 e p95) */}
      <polyline 
        points={p95Points.join(' ')} 
        fill="none" 
        stroke={color} 
        strokeWidth="1" 
        strokeDasharray="4,4" 
        style={{ opacity: 0.3 }}
      />
      <polyline 
        points={p5PointsReversed.reverse().join(' ')} 
        fill="none" 
        stroke={color} 
        strokeWidth="1" 
        strokeDasharray="4,4" 
        style={{ opacity: 0.3 }}
      />
    </svg>
  );
};
