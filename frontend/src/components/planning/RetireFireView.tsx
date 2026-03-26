import React, { useState } from "react";
import type { TabType } from "@/types/navigation";

interface RetireFireViewProps {
  onBack?: (tab?: TabType) => void;
}

export const RetireFireView = ({ onBack }: RetireFireViewProps) => {
  const [despesa, setDespesa] = useState(8000);
  const [aporte, setAporte] = useState(2580);

  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  const meta = despesa * 12 / 0.032;
  const taxaMes = Math.pow(1.10, 1 / 12) - 1;
  const patrimonioAtual = 142800;

  let n = 0, p = patrimonioAtual;
  while (p < meta && n < 600) {
    p = p * (1 + taxaMes) + aporte;
    n++;
  }
  const anos = (n / 12).toFixed(1);

  return (
    <div style={{ paddingTop: '10px' }}>
      <div className="page-eyebrow">Independência financeira</div>
      <div className="page-title">FIRE</div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        Financial Independence, Retire Early
      </div>

      <div className="tab-nav" style={{ marginTop: '4px' }}>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Aposentadoria</div>
        <div className="tab-nav-item active">FIRE</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Projeções</div>
      </div>

      <div className="hero-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(79,155,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
          Data estimada FIRE
        </div>
        <div style={{ fontSize: '42px', fontWeight: 700, color: 'var(--text1)', letterSpacing: '-1.5px' }}>
          Ago 2041
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '6px' }}>
          15 anos e 4 meses a partir de hoje
        </div>
        <div style={{ margin: '18px 0 6px' }}>
          <div className="progress-bar" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: '28%', background: 'linear-gradient(90deg, #4F9BFF, #7B6FFF)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          <span>R$ 142.800</span>
          <span>Meta: R$ 3.000.000</span>
        </div>
      </div>

      <div className="metric-row" style={{ marginTop: '12px' }}>
        <div className="metric">
          <div className="metric-label">Taxa de retirada</div>
          <div className="metric-val blue mono">3,2%</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '3px' }}>dados históricos BR</div>
        </div>
        <div className="metric">
          <div className="metric-label">Patrimônio alvo</div>
          <div className="metric-val mono">R$ 3M</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '3px' }}>25× despesas anuais</div>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric">
          <div className="metric-label">Renda passiva mensal</div>
          <div className="metric-val green mono">{fmt(despesa)}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '3px' }}>valores atuais</div>
        </div>
        <div className="metric">
          <div className="metric-label">Prob. de sucesso</div>
          <div className="metric-val blue mono">71%</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '3px' }}>Monte Carlo · 90 anos</div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Simulador — ajuste sua meta</span>
      </div>
      <div className="card">
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>Despesa mensal desejada</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }} id="lbl-desp">{fmt(despesa)}</div>
          </div>
          <input
            type="range"
            min="3000"
            max="20000"
            step="500"
            value={despesa}
            onChange={(e) => setDespesa(+e.target.value)}
            style={{ width: '100%', accentColor: '#7B6FFF', cursor: 'pointer' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>Aporte mensal atual</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }} id="lbl-aporte-f">{fmt(aporte)}</div>
          </div>
          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={aporte}
            onChange={(e) => setAporte(+e.target.value)}
            style={{ width: '100%', accentColor: '#7B6FFF', cursor: 'pointer' }}
          />
        </div>
        <div id="fire-result" style={{ marginTop: '16px', padding: '14px', background: 'var(--blue-dim)', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '8px' }}>Resultado</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Patrimônio alvo</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }} id="fire-meta">
                {meta >= 1e6 ? `R$\u00a0${(meta / 1e6).toFixed(1)}M` : fmt(meta)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Anos para FIRE</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }} id="fire-anos">
                {n >= 600 ? '>50 anos' : `${anos} anos`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Tipos de FIRE</span>
      </div>
      {[
        ['🌱', 'Lean FIRE', '~R$ 4.000/mês', 'Patrimônio alvo: R$ 1,5M', 'green', '~8 anos'],
        ['🔥', 'Regular FIRE', '~R$ 8.000/mês', 'Patrimônio alvo: R$ 3M', 'blue', 'Seu plano'],
        ['💎', 'Fat FIRE', '~R$ 15.000/mês', 'Patrimônio alvo: R$ 5,6M', 'amber', '~22 anos'],
      ].map(([em, nm, ds, pt, cl, lb]) => (
        <div
          key={nm}
          className="card"
          style={{
            marginBottom: '10px',
            borderColor: cl === 'green' ? 'rgba(34,211,151,0.2)' : cl === 'amber' ? 'rgba(255,171,64,0.2)' : 'rgba(79,155,255,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ fontSize: '24px' }}>{em}</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text1)' }}>{nm}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{ds}</div>
            </div>
            <span className={`badge badge-${cl}`} style={{ marginLeft: 'auto', fontSize: '10px' }}>{lb}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{pt}</div>
        </div>
      ))}
    </div>
  );
};