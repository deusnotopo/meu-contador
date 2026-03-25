import React from "react";
import type { TabType } from "@/types/navigation";

interface InvestDividasViewProps {
  onBack?: (tab: TabType) => void;
}

export const InvestDividasView = ({ onBack }: InvestDividasViewProps) => {
  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  return (
    <div style={{ paddingTop: '10px' }}>
      <div className="page-eyebrow">Gestão de passivos</div>
      <div className="page-title">Dívidas</div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        Estratégia de quitação otimizada
      </div>

      <div className="tab-nav" style={{ marginTop: '4px' }}>
        <div className="tab-nav-item" onClick={() => onBack?.('investments')}>Visão geral</div>
        <div className="tab-nav-item" onClick={() => onBack?.('investments')}>Juros compostos</div>
        <div className="tab-nav-item active">Dívidas</div>
      </div>

      <div className="metric-row" style={{ marginTop: '4px' }}>
        <div className="metric">
          <div className="metric-label">Total de dívidas</div>
          <div className="metric-val red mono">{fmt(10870)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">% do patrimônio</div>
          <div className="metric-val amber mono">5,8%</div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Financiamento imóvel</span>
      </div>
      <div className="hero-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Saldo devedor</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{fmt(8200)}</div>
          </div>
          <span className="badge badge-amber">8,9% a.a.</span>
        </div>
        <div className="progress-bar" style={{ height: '6px', marginTop: '14px' }}>
          <div className="progress-fill" style={{ width: '82%', background: 'var(--amber)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginTop: '4px', fontFamily: 'var(--mono)' }}>
          <span>Quitado: R$ 37.800</span>
          <span>Total: R$ 46.000</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '14px' }}>
          {[
            ['Parcela', 'R$ 1.847'],
            ['Restantes', '5 parcelas'],
            ['Término', 'Nov/25'],
          ].map(([lb, vl]) => (
            <div key={lb} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '9.5px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{lb}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text1)' }}>{vl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Financiamento carro 🔥</span>
      </div>
      <div className="hero-card" style={{ padding: '18px', borderColor: 'rgba(255,107,116,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Saldo devedor</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--mono)' }}>{fmt(2670)}</div>
          </div>
          <span className="badge badge-red">14,2% a.a.</span>
        </div>
        <div className="progress-bar" style={{ height: '6px', marginTop: '14px' }}>
          <div className="progress-fill" style={{ width: '39%', background: 'var(--red)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginTop: '4px', fontFamily: 'var(--mono)' }}>
          <span>Quitado: R$ 17.330</span>
          <span>Total: R$ 20.000</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '14px' }}>
          {[
            ['Parcela', 'R$ 680'],
            ['Restantes', '4 parcelas'],
            ['Término', 'Out/25'],
          ].map(([lb, vl]) => (
            <div key={lb} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '9.5px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{lb}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text1)' }}>{vl}</div>
            </div>
          ))}
        </div>
        <div className="info-strip" style={{ background: 'var(--red-dim)', marginTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🔥 Prioridade de quitação
          </div>
          Taxa de 14,2% a.a. supera Tesouro Selic (10,75%). Quitar antecipado = retorno garantido de +3,45% a.a.
        </div>
        <button className="btn-primary" style={{ marginTop: '12px', background: 'linear-gradient(135deg, #FF6B74, #D63340)', boxShadow: '0 4px 16px rgba(255,107,116,0.3)' }}>
          Simular quitação antecipada ↗
        </button>
      </div>

      <div className="section-header">
        <span className="section-title">Estratégia recomendada</span>
      </div>
      <div className="nudge-card" style={{ background: 'var(--blue-dim)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📐 Método Avalanche
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text1)', lineHeight: 1.6 }}>
          Pague o mínimo no imóvel e direcione qualquer excedente ao carro (14,2% a.a.). Você economiza <strong>R$ 312</strong> em juros totais vs. Método Bola de Neve.
        </div>
      </div>
    </div>
  );
};