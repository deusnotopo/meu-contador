import React from "react";
import type { TabType } from "@/types/navigation";

interface RetireProjViewProps {
  onBack?: (tab?: TabType) => void;
}

export const RetireProjView = ({ onBack }: RetireProjViewProps) => {
  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  return (
    <div style={{ paddingTop: '10px' }}>
      <div className="page-eyebrow">Simulação de cenários</div>
      <div className="page-title">Projeções</div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        25 anos · IPCA + Selic variável
      </div>

      <div className="tab-nav" style={{ marginTop: '4px' }}>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Aposentadoria</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>FIRE</div>
        <div className="tab-nav-item active">Projeções</div>
      </div>

      <div className="hero-card" style={{ padding: '18px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(79,155,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
          Evolução do patrimônio — 25 anos
        </div>
        <svg viewBox="0 0 330 170" style={{ width: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D397" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22D397" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F9BFF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4F9BFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFAB40" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFAB40" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 40, 80, 120, 155].map((y) => (
            <line key={y} x1="30" y1={y} x2="330" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[
            ['R$4,1M', 0],
            ['R$3,1M', 40],
            ['R$2,0M', 80],
            ['R$1,0M', 120],
            ['R$0', 152],
          ].map(([lb, y]) => (
            <text key={lb} x="0" y={+y + 4} fontSize="8" fill="rgba(138,151,180,0.6)" fontFamily="JetBrains Mono">{lb}</text>
          ))}
          <path d="M30,155 C80,140 130,108 180,72 C220,42 265,18 330,4 L330,160 L30,160Z" fill="url(#gO)" />
          <path d="M30,155 C80,140 130,108 180,72 C220,42 265,18 330,4" fill="none" stroke="#22D397" strokeWidth="2" strokeLinecap="round" />
          <path d="M30,155 C80,143 130,122 180,96 C220,70 265,46 330,30 L330,160 L30,160Z" fill="url(#gB)" />
          <path d="M30,155 C80,143 130,122 180,96 C220,70 265,46 330,30" fill="none" stroke="#4F9BFF" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3" />
          <path d="M30,155 C80,147 130,133 180,114 C220,96 265,74 330,58 L330,160 L30,160Z" fill="url(#gC)" />
          <path d="M30,155 C80,147 130,133 180,114 C220,96 265,74 330,58" fill="none" stroke="#FFAB40" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
          <line x1="205" y1="0" x2="205" y2="155" stroke="rgba(123,111,255,0.4)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="207" y="12" fontSize="8" fill="#7B6FFF" fontFamily="Sora" fontWeight="600">FIRE</text>
          {[
            ['30', '2026'],
            ['120', '2031'],
            ['205', '2036'],
            ['270', '2041'],
            ['330', '2051'],
          ].map(([x, lb]) => (
            <text key={lb} x={x} y="170" fontSize="8" fill="rgba(138,151,180,0.55)" textAnchor="middle" fontFamily="JetBrains Mono">{lb}</text>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[
            ['#22D397', 'Otimista · R$ 4,1M'],
            ['#4F9BFF', 'Base · R$ 3,2M'],
            ['#FFAB40', 'Conservador · R$ 2,4M'],
          ].map(([c, lb]) => (
            <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '3px', background: c, borderRadius: '2px', display: 'inline-block' }} />
              <span style={{ fontSize: '10.5px', color: 'var(--text2)' }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Marcos financeiros</span>
      </div>
      <div className="card">
        {[
          ['2027', 'Quitação total das dívidas', 'Libera R$ 2.527/mês para investir', 'green'],
          ['2030', 'Primeiro R$ 300.000', 'Com taxa 10% a.a. e aporte atual', 'blue'],
          ['2035', 'Patrimônio supera R$ 1M', 'Juros compostos dominam os aportes', 'blue'],
          ['2038', 'Lean FIRE possível', 'R$ 1,5M — renda R$ 4.000/mês', 'amber'],
          ['2041', 'FIRE Regular', 'R$ 3M — independência financeira', 'green'],
        ].map(([yr, ti, ds, cl]) => (
          <div key={yr} className="row-item">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: cl === 'green' ? 'var(--green-dim)' : cl === 'amber' ? 'var(--amber-dim)' : 'var(--blue-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: cl === 'green' ? 'var(--green)' : cl === 'amber' ? 'var(--amber)' : 'var(--accent)',
                  fontFamily: 'var(--mono)',
                }}
              >
                {yr}
              </span>
            </div>
            <div className="row-main">
              <div className="row-title">{ti}</div>
              <div className="row-sub">{ds}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <span className="section-title">Sensibilidade de aportes</span>
      </div>
      <div className="card">
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '14px', lineHeight: 1.5 }}>
          Impacto de aumentar o aporte mensal no patrimônio em 25 anos (10% a.a.)
        </div>
        {[
          ['+R$ 0', 'R$ 3.200.000', 'atual', 'blue'],
          ['+R$ 500', 'R$ 3.890.000', '+R$ 690k', 'green'],
          ['+R$ 1.000', 'R$ 4.580.000', '+R$ 1,38M', 'green'],
          ['+R$ 2.000', 'R$ 5.960.000', '+R$ 2,76M', 'green'],
        ].map(([ex, vl, ga, cl]) => (
          <div key={ex} className="row-item">
            <div className="row-main">
              <div className="row-title" style={{ fontFamily: 'var(--mono)' }}>
                {ex}
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font)' }}> /mês</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }}>{vl}</div>
              <div style={{ fontSize: '11px', color: cl === 'green' ? 'var(--green)' : 'var(--accent)', fontFamily: 'var(--mono)' }}>{ga}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};