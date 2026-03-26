import React from "react";

// SVG Sparkline Component matching finapp_v3.html exactly
export const Sparkline = ({ data, color = "var(--blue)", h = 44, w = 318 }: { data: number[], color?: string, h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const fp = `0,${h} ${pts} ${w},${h}`;
  const lx = (((data.length - 1) / (data.length - 1)) * w).toFixed(1);
  const ly = (h - ((data[data.length - 1] - min) / range) * (h - 6) - 3).toFixed(1);
  const gradId = "sg" + Math.random().toString(36).slice(2, 6);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fp} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
    </svg>
  );
};

// SVG BarChart Component matching finapp_v3.html exactly
export const BarChart = ({ data, colors, h = 50, w = 318 }: { data: number[], colors: string | string[], h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;
  const bw = Math.floor((w - data.length * 3) / data.length);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * h);
        const x = i * (bw + 3);
        const fill = Array.isArray(colors) ? colors[i % colors.length] : colors;
        return (
          <rect key={i} x={x} y={h - bh} width={bw} height={bh} rx="3" fill={fill} opacity="0.85" />
        );
      })}
    </svg>
  );
};
