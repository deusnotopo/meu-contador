
import type { TabType } from "@/types/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useRetirement, projectWealth } from "@/hooks/useRetirement";
import { useFireCalculation } from "@/hooks/useFireCalculation";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";

interface RetireProjViewProps {
  onBack?: (tab?: TabType) => void;
}

const YEARS = 25;
const ANNUAL_RATE = 10;
const WITHDRAWAL_RATE = 0.032;

export const RetireProjView = ({ onBack }: RetireProjViewProps) => {
  const { totals: invTotals, loading: invLoading } = useInvestments();
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: debtTotals, isLoading: debtLoading } = useDebts();

  const isLoading = invLoading || personal.isLoading || business.isLoading || debtLoading;

  // Compute real patrimônio líquido
  const patrimonioAtual = Math.max(0,
    (personal.totals.balance + business.totals.balance + invTotals.currentValue) - debtTotals.totalBalance
  );
  const rendaAtual = personal.totals.income + business.totals.income;
  const despesaAtual = personal.totals.expense + business.totals.expense;
  const aporteEstimado = Math.round(Math.max(500, (rendaAtual - despesaAtual) * 0.5));

  // 3-scenario projections using useRetirement
  const baseConfig = {
    currentAge: 30, retireAge: 30 + YEARS,
    monthlyContribution: aporteEstimado,
    expectedReturnPct: ANNUAL_RATE,
    targetMonthlyIncome: despesaAtual || 8000,
    currentNetWorth: patrimonioAtual
  };

  const { milestones, sensitivity } = useRetirement(baseConfig);

  // Compute chart series (3 scenarios)
  const seriesOtimista  = projectWealth(patrimonioAtual, aporteEstimado, 12, YEARS);
  const seriesBase      = projectWealth(patrimonioAtual, aporteEstimado, ANNUAL_RATE, YEARS);
  const seriesConservador = projectWealth(patrimonioAtual, aporteEstimado, 5, YEARS);

  const finalOtimista    = seriesOtimista[seriesOtimista.length - 1] ?? 0;
  const finalBase        = seriesBase[seriesBase.length - 1] ?? 0;
  const finalConservador = seriesConservador[seriesConservador.length - 1] ?? 0;

  // FIRE info
  const { months: fireMonths } = useFireCalculation({
    currentNetWorth: patrimonioAtual,
    monthlyExpenses: despesaAtual || 8000,
    monthlyDeposit: aporteEstimado,
    yearlyReturn: ANNUAL_RATE,
    withdrawalRate: WITHDRAWAL_RATE,
  });
  const anoFire = new Date().getFullYear() + Math.round(fireMonths.base / 12);

  const fmt = (n: number) => {
    if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `R$ ${Math.round(n / 1e3)}k`;
    return formatCurrency(n);
  };

  if (isLoading) {
    return (
      <div style={{ paddingTop: '10px' }}>
        <div className="page-eyebrow">Simulação de cenários</div>
        <div className="page-title">Projeções</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12, color: "var(--t3)" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Calculando projeções...</span>
        </div>
      </div>
    );
  }

  // SVG chart
  const W = 330, H = 170;
  const allVals = [...seriesOtimista, ...seriesBase, ...seriesConservador];
  const maxV = Math.max(...allVals, 1);
  const toX = (i: number) => 30 + (i / YEARS) * (W - 42);
  const toY = (v: number) => H - 15 - ((v / maxV) * (H - 30));

  const makePath = (series: number[]) =>
    series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  const makeArea = (series: number[]) =>
    `${makePath(series)} L ${toX(YEARS).toFixed(1)},${H - 15} L ${toX(0).toFixed(1)},${H - 15} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxV * f);

  return (
    <div style={{ paddingTop: '10px' }}>
      <div className="page-eyebrow">Simulação de cenários</div>
      <div className="page-title">Projeções</div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        {YEARS} anos · IPCA + Selic variável
      </div>

      <div className="tab-nav" style={{ marginTop: '4px' }}>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Aposentadoria</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>FIRE</div>
        <div className="tab-nav-item active">Projeções</div>
      </div>

      {/* Chart */}
      <div className="hero-card" style={{ padding: '18px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(79,155,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
          Evolução do patrimônio — {YEARS} anos (aporte: {formatCurrency(aporteEstimado)}/mês)
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
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

          {/* Grid */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={toX(0)} y1={toY(v)} x2={toX(YEARS)} y2={toY(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x="0" y={toY(v) + 4} fontSize="8" fill="rgba(138,151,180,0.6)" fontFamily="JetBrains Mono">{fmt(v)}</text>
            </g>
          ))}

          {/* FIRE marker */}
          {fireMonths.base < YEARS * 12 && (
            <>
              <line
                x1={toX(Math.round(fireMonths.base / 12))} y1={H - 15}
                x2={toX(Math.round(fireMonths.base / 12))} y2="0"
                stroke="rgba(123,111,255,0.4)" strokeWidth="1" strokeDasharray="4 4"
              />
              <text x={toX(Math.round(fireMonths.base / 12)) + 2} y="12" fontSize="8" fill="#7B6FFF" fontFamily="Sora" fontWeight="600">FIRE {anoFire}</text>
            </>
          )}

          {/* Areas */}
          <path d={makeArea(seriesOtimista)} fill="url(#gO)" />
          <path d={makeArea(seriesBase)} fill="url(#gB)" />
          <path d={makeArea(seriesConservador)} fill="url(#gC)" />

          {/* Lines */}
          <path d={makePath(seriesOtimista)} fill="none" stroke="#22D397" strokeWidth="2" strokeLinecap="round" />
          <path d={makePath(seriesBase)} fill="none" stroke="#4F9BFF" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3" />
          <path d={makePath(seriesConservador)} fill="none" stroke="#FFAB40" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

          {/* X axis labels */}
          {[0, 5, 10, 15, 20, 25].filter(y => y <= YEARS).map(y => (
            <text key={y} x={toX(y)} y={H} fontSize="8" fill="rgba(138,151,180,0.55)" textAnchor="middle" fontFamily="JetBrains Mono">
              {new Date().getFullYear() + y}
            </text>
          ))}
        </svg>

        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[
            ['#22D397', `Otimista (12%) · ${fmt(finalOtimista)}`],
            ['#4F9BFF', `Base (${ANNUAL_RATE}%) · ${fmt(finalBase)}`],
            ['#FFAB40', `Conservador (5%) · ${fmt(finalConservador)}`],
          ].map(([c, lb]) => (
            <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '3px', background: c, borderRadius: '2px', display: 'inline-block' }} />
              <span style={{ fontSize: '10.5px', color: 'var(--text2)' }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones dinâmicos */}
      <div className="section-header">
        <span className="section-title">Marcos financeiros</span>
      </div>
      <div className="card">
        {milestones.length > 0 ? milestones.slice(0, 5).map((m, i) => (
          <div key={i} className="row-item">
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: m.color === 'var(--green)' ? 'var(--green-dim)' : m.color === 'var(--blue)' ? 'var(--blue-dim)' : 'var(--amber-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: m.color,
                fontFamily: 'var(--mono)',
              }}>
                {m.year}
              </span>
            </div>
            <div className="row-main">
              <div className="row-title">{m.label}</div>
              <div className="row-sub">{m.sub}</div>
            </div>
          </div>
        )) : (
          <div style={{ padding: "12px", color: "var(--t3)", fontSize: 13 }}>
            Adicione investimentos e transações para ver seus marcos financeiros.
          </div>
        )}
      </div>

      {/* Sensitivity análise real */}
      <div className="section-header">
        <span className="section-title">Sensibilidade de aportes</span>
      </div>
      <div className="card">
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '14px', lineHeight: 1.5 }}>
          Impacto de aumentar o aporte mensal no patrimônio em {YEARS} anos ({ANNUAL_RATE}% a.a.)
        </div>
        {sensitivity.map(({ extra, total }) => (
          <div key={extra} className="row-item">
            <div className="row-main">
              <div className="row-title" style={{ fontFamily: 'var(--mono)' }}>
                {extra === 0 ? 'Plano atual' : `+${formatCurrency(extra)}`}
                {extra > 0 && <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font)' }}> /mês</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text1)', fontFamily: 'var(--mono)' }}>{fmt(total)}</div>
              {extra > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                  +{fmt(total - (sensitivity[0]?.total ?? 0))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};