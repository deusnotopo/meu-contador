import { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useCompoundInterest } from "@/hooks/useCompoundInterest";
import { useTransactions } from "@/hooks/useTransactions";

interface InvestCompostosViewProps {
  onBack?: (tab?: TabType) => void;
}

export const InvestCompostosView = ({ onBack }: InvestCompostosViewProps) => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");

  // Derive a smart default from the user's real income: 20% savings rate, clamped to slider range
  const rendaReal = personal.totals.income + business.totals.income;
  const aporteRecomendado = useMemo(() => {
    if (rendaReal <= 0) return 2000; // fallback only if no data yet
    return Math.min(10000, Math.max(200, Math.round((rendaReal * 0.2) / 200) * 200));
  }, [rendaReal]);

  const [aporte, setAporte] = useState(() => aporteRecomendado);
  const [taxa, setTaxa] = useState(10);
  const [anos, setAnos] = useState(20);

  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  // All math is now in the hook
  const { total, invested, yield: yld, chartPoints, yearlyBreakdown } = useCompoundInterest({
    monthlyDeposit: aporte,
    annualRate: taxa,
    years: anos,
  });

  // Chart rendering (visual only)
  const maxVal = chartPoints[chartPoints.length - 1] ?? 1;
  const W = 310, H = 60, barW = Math.max(2, W / anos - 2);

  return (
    <div style={{ paddingTop: '10px' }}>
      <div className="page-eyebrow">Simulador interativo</div>
      <div className="page-title">Juros compostos</div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        Veja o poder do tempo e do aporte
      </div>

      <div className="tab-nav" style={{ marginTop: '4px' }}>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Visão geral</div>
        <div className="tab-nav-item active">Juros compostos</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Dívidas</div>
      </div>

      <div className="hero-card" id="comp-result">
        <div style={{ fontSize: '11px', color: 'rgba(79,155,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
          Patrimônio projetado
        </div>
        <div className="big-number mono" id="comp-total">{fmt(total)}</div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Aportado</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text2)' }} className="mono" id="comp-invested">{fmt(invested)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Rendimento</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }} className="mono" id="comp-yield">{fmt(yld)}</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', marginTop: '14px', overflow: 'visible' }} id="comp-chart">
          {chartPoints.map((v, i) => {
            const h = Math.max(2, (v / maxVal) * H);
            const x = i * (W / anos);
            const color = i < anos * 0.33 ? '#4F9BFF' : i < anos * 0.66 ? '#7B6FFF' : '#22D397';
            return (
              <rect key={i} x={x.toFixed(1)} y={(H - h).toFixed(1)} width={barW.toFixed(1)} height={h.toFixed(1)} rx="2" fill={color} opacity="0.8" />
            );
          })}
        </svg>
      </div>

      <div className="card" style={{ marginTop: '12px' }}>
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>Aporte mensal</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }} id="lbl-aporte">{fmt(aporte)}</div>
          </div>
          <input
            type="range"
            min="200"
            max="10000"
            step="200"
            value={aporte}
            onChange={(e) => setAporte(+e.target.value)}
            style={{ width: '100%', accentColor: '#4F9BFF', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
            <span>R$ 200</span>
            <span>R$ 10.000</span>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>Taxa anual</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }} id="lbl-taxa">{taxa < 10 ? taxa.toFixed(1) : Math.round(taxa)}% a.a.</div>
          </div>
          <input
            type="range"
            min="4"
            max="18"
            step="0.5"
            value={taxa}
            onChange={(e) => setTaxa(+e.target.value)}
            style={{ width: '100%', accentColor: '#4F9BFF', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
            <span>4%</span>
            <span>18%</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>Período</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }} id="lbl-anos">{anos} anos</div>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={anos}
            onChange={(e) => setAnos(+e.target.value)}
            style={{ width: '100%', accentColor: '#4F9BFF', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
            <span>5 anos</span>
            <span>40 anos</span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Evolução ano a ano</span>
      </div>
      <div className="card" id="comp-table" style={{ padding: '14px 16px' }}>
        {yearlyBreakdown.length > 0 ? (
          yearlyBreakdown.map(({ year, value }) => (
            <div key={year} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Ano {year}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }}>
                R$\u00a0{Math.round(value).toLocaleString('pt-BR')}
              </span>
            </div>
          ))
        ) : (
          <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Selecione mais de 5 anos</span>
        )}
      </div>
    </div>
  );
};