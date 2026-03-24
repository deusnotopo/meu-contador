import { useState } from "react";

const DIMS = [
  { em: "💧", nm: "Liquidez", ds: "8,4 meses de reserva", sc: 92, cl: "g" },
  { em: "💰", nm: "Poupança", ds: "Taxa 30,7%", sc: 88, cl: "g" },
  { em: "📉", nm: "Dívidas", ds: "5,8% do patrimônio", sc: 82, cl: "g" },
  { em: "🌐", nm: "Diversificação", ds: "4 classes de ativos", sc: 70, cl: "b" },
  { em: "🛡️", nm: "Proteção", ds: "Seguro de vida ausente", sc: 45, cl: "a" },
  { em: "🎯", nm: "Trajetória", ds: "71% probabilidade FIRE", sc: 60, cl: "b" },
  { em: "🧠", nm: "Bem-estar", ds: "Estresse moderado", sc: 55, cl: "a" },
];

const COLOR_MAP: Record<string, string> = { g: "var(--green)", b: "var(--blue)", a: "var(--amber)", r: "var(--red)" };
const BG_MAP: Record<string, string> = { g: "var(--green-d)", b: "var(--blue3)", a: "var(--amber-d)", r: "var(--red-d)" };

const STRESS = ["😰", "😟", "😐", "🙂", "😄"];
const STRESS_LABELS = ["Muito alto", "Alto", "Médio", "Baixo", "Nenhum"];

export const HealthSection = () => {
  const [selectedStress, setSelectedStress] = useState<number | null>(2);

  const score = 74;
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Score ring hero */}
      <div className="hero" style={{ textAlign: "center", padding: "28px 20px 22px" }}>
        <svg style={{ width: 140, height: 140, margin: "0 auto 16px" }} viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="11" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="url(#sg-health)"
            strokeWidth="11"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="sg-health" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4A8BFF" />
              <stop offset="100%" stopColor="#00D991" />
            </linearGradient>
          </defs>
          <text x="70" y="64" textAnchor="middle" fontSize="32" fontWeight="700" fill="#F0F4FF" fontFamily="DM Mono">
            {score}
          </text>
          <text x="70" y="81" textAnchor="middle" fontSize="11" fill="#8899C4" fontFamily="DM Sans">
            de 100
          </text>
        </svg>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--t1)" }}>Saúde financeira boa</div>
        <div style={{ fontSize: 12, color: "var(--green)", marginTop: 4 }}>▲ +2 pontos vs. mês passado</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <span className="bdg bdg-g">Liquidez: 8 meses</span>
          <span className="bdg bdg-b">Poupança: 30,7%</span>
        </div>
      </div>

      {/* 7 dimensions */}
      <div className="sec-hd"><span className="sec-title">7 dimensões</span></div>
      <div className="card">
        {DIMS.map((d) => (
          <div key={d.nm} className="row">
            <div className="row-ico" style={{ background: BG_MAP[d.cl] }}>{d.em}</div>
            <div className="row-main">
              <div className="row-title">{d.nm}</div>
              <div className="row-sub">{d.ds}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 60 }}>
                <div className="prog" style={{ margin: 0, height: 4 }}>
                  <div className="prog-fill" style={{ width: `${d.sc}%`, background: COLOR_MAP[d.cl] }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR_MAP[d.cl], width: 24, textAlign: "right", fontFamily: "var(--mono)" }}>
                {d.sc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div className="nudge warn" style={{ marginTop: 12 }}>
        <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Gap de proteção</div>
        <div className="nudge-body">Você não tem seguro de vida. Custo estimado: <strong>R$ 80–150/mês</strong>.</div>
      </div>

      {/* Inflação */}
      <div className="metric-grid" style={{ marginTop: 12 }}>
        <div className="metric">
          <div className="m-label">Sua inflação (mar)</div>
          <div className="m-val r">6,8%</div>
          <div className="m-delta">↑ delivery pesa</div>
        </div>
        <div className="metric">
          <div className="m-label">IPCA oficial</div>
          <div className="m-val">4,2%</div>
          <div className="m-delta">cesta nacional</div>
        </div>
      </div>

      {/* Stress check-in */}
      <div className="sec-hd"><span className="sec-title">Check-in de bem-estar</span></div>
      <div className="card">
        <div style={{ fontSize: 13, color: "var(--t1)", marginBottom: 16, lineHeight: 1.4 }}>
          Como está seu estresse financeiro este mês?
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          {STRESS.map((em, i) => (
            <div
              key={i}
              onClick={() => setSelectedStress(i)}
              style={{
                flex: 1,
                textAlign: "center",
                cursor: "pointer",
                padding: "8px 4px",
                borderRadius: 10,
                border: `1px solid ${selectedStress === i ? "var(--blue)" : "var(--border)"}`,
                background: selectedStress === i ? "var(--blue3)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 22 }}>{em}</div>
              <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 4, lineHeight: 1.2 }}>
                {STRESS_LABELS[i]}
              </div>
            </div>
          ))}
        </div>
        <button className="btn-s" style={{ marginTop: 12, fontSize: 12, padding: 9 }}>
          Registrar check-in
        </button>
      </div>
    </div>
  );
};
