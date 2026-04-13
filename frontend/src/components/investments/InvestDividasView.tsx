import type { TabType } from "@/types/navigation";
import { useDebtStrategy } from "@/hooks/useDebtStrategy";

interface InvestDividasViewProps {
  onBack?: (tab?: TabType) => void;
}

export const InvestDividasView = ({ onBack }: InvestDividasViewProps) => {
  const { totalDebt, debtsWithMetrics, bestStrategy, insights } = useDebtStrategy();
  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  return (
    <div className="pt-2.5">
      <div className="page-eyebrow">Gestão de passivos</div>
      <div className="page-title">Dívidas</div>
      <div className="page-sub mb-3.5">Estratégia de quitação otimizada</div>

      <div className="tab-nav mt-1">
        <div className="tab-nav-item" onClick={() => onBack?.()}>Visão geral</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Juros compostos</div>
        <div className="tab-nav-item active">Dívidas</div>
      </div>

      <div className="metric-row mt-1">
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
        <div className="text-center py-10 px-5 text-[var(--text3)]">
          Nenhuma dívida registrada. Parabéns!
        </div>
      ) : (
        debtsWithMetrics.map((debt, index) => {
          const isPriority = index === 0 && bestStrategy.debts[0]?.id === debt.id;
          const cardBorder = isPriority ? 'rgba(255,107,116,0.3)' : 'rgba(255,255,255,0.05)';
          const colorVar = isPriority ? 'var(--red)' : 'var(--amber)';
          const badgeClass = isPriority ? 'badge-red' : 'badge-amber';

          return (
            <div key={debt.id} className="mb-6">
              <div className="section-header">
                <span className="section-title">
                  {debt.name} {isPriority && "🔥"}
                </span>
              </div>

              <div className="hero-card p-[18px]" style={{ borderColor: cardBorder }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[11px] text-[var(--text3)] uppercase tracking-[0.08em] mb-1.5">
                      Saldo devedor
                    </div>
                    <div className="text-[28px] font-bold font-mono" style={{ color: colorVar }}>
                      {fmt(debt.balance)}
                    </div>
                  </div>
                  <span className={`badge ${badgeClass}`}>{debt.interestRate}% a.a.</span>
                </div>

                <div className="progress-bar h-1.5 mt-3.5">
                  <div className="progress-fill w-0" style={{ background: colorVar }} />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3.5">
                  {[
                    ['Parcela Min', fmt(debt.minPayment)],
                    ['Meses Rest.', `${debt.monthsToPayoff}`],
                    ['Juros Totais', fmt(debt.totalInterestPaid)],
                  ].map(([lb, vl]) => (
                    <div key={lb} className="text-center py-2 px-2 bg-white/[0.04] rounded-lg">
                      <div className="text-[9.5px] text-[var(--text3)] uppercase tracking-[0.06em] mb-0.5">{lb}</div>
                      <div className="text-[12px] font-bold text-[var(--text1)]">{vl}</div>
                    </div>
                  ))}
                </div>

                {isPriority && (
                  <div className="info-strip bg-[var(--red-dim)] mt-3">
                    <div className="text-[11px] font-bold text-[var(--red)] mb-0.5 uppercase tracking-[0.06em]">
                      🔥 Prioridade Máxima
                    </div>
                    Esta é a dívida mais cara. Quitar antecipadamente garantirá um enorme alívio financeiro.
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {insights.map((insight, idx) => (
        <div key={idx} className="mb-4">
          <div className="section-header">
            <span className="section-title">{insight.title}</span>
          </div>
          <div
            className="nudge-card"
            style={{ background: insight.type === 'warning' ? 'var(--red-dim)' : 'var(--blue-dim)' }}
          >
            <div className="text-[11px] font-bold text-[var(--accent)] mb-1.5 uppercase tracking-[0.05em]">
              {insight.type === 'warning' ? '⚠️ Atenção' : '📐 Método Recomendado'}
            </div>
            <div className="text-[13px] text-[var(--text1)] leading-relaxed">
              {insight.description}
              {insight.impact && <strong> {insight.impact}</strong>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
