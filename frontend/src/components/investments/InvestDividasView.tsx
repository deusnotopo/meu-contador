import type { TabType } from "@/types/navigation";
import { useDebtStrategy } from "@/hooks/useDebtStrategy";

interface InvestDividasViewProps {
  onBack?: (tab?: TabType) => void;
}

export const InvestDividasView = ({ onBack }: InvestDividasViewProps) => {
  const { totalDebt, debtsWithMetrics, bestStrategy, insights } = useDebtStrategy();
  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  return (
    <div style={{ paddingTop: '10px' }}>
      <div className="page-eyebrow">Gestão de passivos</div>
      <div className="page-title">Dívidas</div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        Estratégia de quitação otimizada
      </div>

      <div className="tab-nav" style={{ marginTop: '4px' }}>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Visão geral</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Juros compostos</div>
        <div className="tab-nav-item active">Dívidas</div>
      </div>

      <div className="metric-row" style={{ marginTop: '4px' }}>
        <div className="metric">
          <div className="metric-label">Total de dívidas</div>
          <div className="metric-val red mono">{fmt(totalDebt)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Quitação Prevista</div>
          <div className="metric-val amber mono">{bestStrategy.monthsToFreedom} meses</div>
        </div>
      </div>

      {debtsWithMetrics.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)" }}>
          Nenhuma dívida registrada. Parabéns!
        </div>
      ) : (
        debtsWithMetrics.map((debt, index) => {
          const isPriority = index === 0 && bestStrategy.debts[0]?.id === debt.id;
          const cardBorder = isPriority ? 'rgba(255,107,116,0.3)' : 'rgba(255,255,255,0.05)';
          const colorClass = isPriority ? 'var(--red)' : 'var(--amber)';
          const badgeClass = isPriority ? 'badge-red' : 'badge-amber';

          return (
            <div key={debt.id} style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <span className="section-title">
                  {debt.name} {isPriority && "🔥"}
                </span>
              </div>
              <div className="hero-card" style={{ padding: '18px', borderColor: cardBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Saldo devedor</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: colorClass, fontFamily: 'var(--mono)' }}>{fmt(debt.balance)}</div>
                  </div>
                  <span className={`badge ${badgeClass}`}>{debt.interestRate}% a.a.</span>
                </div>
                <div className="progress-bar" style={{ height: '6px', marginTop: '14px' }}>
                  <div className="progress-fill" style={{ width: '0%', background: colorClass }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '14px' }}>
                  {[
                    ['Parcela Min', fmt(debt.minPayment)],
                    ['Meses Rest.', `${debt.monthsToPayoff}`],
                    ['Juros Totais', fmt(debt.totalInterestPaid)],
                  ].map(([lb, vl]) => (
                    <div key={lb} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{lb}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text1)' }}>{vl}</div>
                    </div>
                  ))}
                </div>

                {isPriority && (
                  <>
                    <div className="info-strip" style={{ background: 'var(--red-dim)', marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🔥 Prioridade Máxima
                      </div>
                      Esta é a dívida mais cara. Quitar antecipadamente garantirá um enorme alívio financeiro.
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}

      {insights.map((insight, idx) => (
        <div key={idx} style={{ marginBottom: '16px' }}>
          <div className="section-header">
            <span className="section-title">{insight.title}</span>
          </div>
          <div className="nudge-card" style={{ background: insight.type === 'warning' ? 'var(--red-dim)' : 'var(--blue-dim)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {insight.type === 'warning' ? '⚠️ Atenção' : '📐 Método Recomendado'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text1)', lineHeight: 1.6 }}>
              {insight.description}
              {insight.impact && <strong> {insight.impact}</strong>}
            </div>
          </div>
        </div>
      ))}

    </div>
  );
};
