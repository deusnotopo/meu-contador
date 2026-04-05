

// Helper to validate and sanitize numbers
const safeNumber = (n: number, fallback: number = 0): number => {
  return typeof n === 'number' && !isNaN(n) && isFinite(n) ? n : fallback;
};

// SVG Sparkline Component matching finapp_v3.html exactly
export const Sparkline = ({ data, color = "var(--blue)", h = 44, w = 318 }: { data: number[], color?: string, h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  
  const validData = data.map(v => safeNumber(v, 0));
  if (validData.length === 0 || validData.every(v => v === 0)) return null;
  
  const max = Math.max(...validData);
  const min = Math.min(...validData);
  const range = max - min || 1;
  
  const pts = validData.map((v, i) => {
    const x = safeNumber((i / (validData.length - 1)) * w, 0);
    const y = safeNumber(h - ((v - min) / range) * (h - 6) - 3, h / 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const fp = `0,${h} ${pts} ${w},${h}`;
  const lastValue = validData[validData.length - 1] || 0;
  const lx = safeNumber(((validData.length - 1) / (validData.length - 1)) * w, w);
  const ly = safeNumber(h - ((lastValue - min) / range) * (h - 6) - 3, h / 2);
  const gradId = "sg" + Math.random().toString(36).slice(2, 6);
  const glowId = "glow" + Math.random().toString(36).slice(2, 6);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur1"/>
          <feGaussianBlur stdDeviation="5" result="blur2"/>
          <feMerge>
            <feMergeNode in="blur1"/>
            <feMergeNode in="blur2"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon points={fp} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `url(#${glowId})`, opacity: 0.9 }} />
      <circle cx={lx} cy={ly} r="4.5" fill={color} stroke="var(--bg)" strokeWidth="3" />
    </svg>
  );
};

// SVG BarChart Component matching finapp_v3.html exactly
export const BarChart = ({ data, colors, h = 50, w = 318 }: { data: number[], colors: string | string[], h?: number, w?: number }) => {
  if (!data || data.length === 0) return null;
  
  const validData = data.map(v => safeNumber(v, 0));
  if (validData.length === 0 || validData.every(v => v === 0)) return null;
  
  const max = Math.max(...validData) || 1;
  const bw = Math.max(2, Math.floor((w - validData.length * 4) / validData.length));
  
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <filter id="barBloom">
          <feGaussianBlur stdDeviation="2" result="bloom"/>
          <feColorMatrix in="bloom" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -5" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      {validData.map((v, i) => {
        const bh = Math.max(4, safeNumber((v / max) * h, 4));
        const x = safeNumber(i * (bw + 4), 0);
        const fill = Array.isArray(colors) ? colors[i % colors.length] : colors;
        return (
          <rect 
            key={i} 
            x={x} 
            y={h - bh} 
            width={bw} 
            height={bh} 
            rx="4" 
            fill={fill} 
            style={{ 
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", 
              filter: "url(#barBloom)",
              opacity: 0.85
            }} 
          />
        );
      })}
    </svg>
  );
};
