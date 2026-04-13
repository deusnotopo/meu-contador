import { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useCompoundInterest } from "@/hooks/useCompoundInterest";
import { useTransactions } from "@/hooks/useTransactions";

interface InvestCompostosViewProps {
  onBack?: (tab?: TabType) => void;
}

const sliderClass = "w-full cursor-pointer accent-[#4F9BFF]";
const rowBetween = "flex justify-between items-center mb-2";
const labelClass = "text-[12px] text-[var(--text2)] font-medium";
const valueClass = "text-[15px] font-bold text-[var(--text1)] font-mono";
const subRange = "flex justify-between text-[10px] text-[var(--text3)] mt-1";

export const InvestCompostosView = ({ onBack }: InvestCompostosViewProps) => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");

  const rendaReal = personal.totals.income + business.totals.income;
  const aporteRecomendado = useMemo(() => {
    if (rendaReal <= 0) return 2000;
    return Math.min(10000, Math.max(200, Math.round((rendaReal * 0.2) / 200) * 200));
  }, [rendaReal]);

  const [aporte, setAporte] = useState(() => aporteRecomendado);
  const [taxa, setTaxa] = useState(10);
  const [anos, setAnos] = useState(20);

  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  const { total, invested, yield: yld, chartPoints, yearlyBreakdown } = useCompoundInterest({
    monthlyDeposit: aporte,
    annualRate: taxa,
    years: anos,
  });

  const maxVal = chartPoints[chartPoints.length - 1] ?? 1;
  const W = 310, H = 60, barW = Math.max(2, W / anos - 2);

  return (
    <div className="pt-2.5">
      <div className="page-eyebrow">Simulador interativo</div>
      <div className="page-title">Juros compostos</div>
      <div className="page-sub mb-3.5">Veja o poder do tempo e do aporte</div>

      <div className="tab-nav mt-1">
        <div className="tab-nav-item" onClick={() => onBack?.()}>Visão geral</div>
        <div className="tab-nav-item active">Juros compostos</div>
        <div className="tab-nav-item" onClick={() => onBack?.()}>Dívidas</div>
      </div>

      {/* Hero result */}
      <div className="hero-card" id="comp-result">
        <div className="text-[11px] text-[rgba(79,155,255,0.8)] uppercase tracking-[0.1em] mb-2">
          Patrimônio projetado
        </div>
        <div className="big-number mono" id="comp-total">{fmt(total)}</div>

        <div className="flex gap-4 mt-2.5">
          <div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.06em] mb-0.5">Aportado</div>
            <div className="text-[14px] font-bold text-[var(--text2)] mono" id="comp-invested">{fmt(invested)}</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.06em] mb-0.5">Rendimento</div>
            <div className="text-[14px] font-bold text-[var(--green)] mono" id="comp-yield">{fmt(yld)}</div>
          </div>
        </div>

        {/* Bar chart */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3.5 overflow-visible" id="comp-chart">
          {chartPoints.map((v, i) => {
            const h = Math.max(2, (v / maxVal) * H);
            const x = i * (W / anos);
            const color = i < anos * 0.33 ? '#4F9BFF' : i < anos * 0.66 ? '#7B6FFF' : '#22D397';
            return <rect key={i} x={x.toFixed(1)} y={(H - h).toFixed(1)} width={barW.toFixed(1)} height={h.toFixed(1)} rx="2" fill={color} opacity="0.8" />;
          })}
        </svg>
      </div>

      {/* Sliders */}
      <div className="card mt-3">
        {/* Aporte */}
        <div className="mb-4">
          <div className={rowBetween}>
            <div className={labelClass}>Aporte mensal</div>
            <div className={valueClass} id="lbl-aporte">{fmt(aporte)}</div>
          </div>
          <input type="range" min="200" max="10000" step="200" value={aporte}
            onChange={e => setAporte(+e.target.value)} className={sliderClass} />
          <div className={subRange}><span>R$ 200</span><span>R$ 10.000</span></div>
        </div>

        {/* Taxa */}
        <div className="mb-4">
          <div className={rowBetween}>
            <div className={labelClass}>Taxa anual</div>
            <div className={valueClass} id="lbl-taxa">{taxa < 10 ? taxa.toFixed(1) : Math.round(taxa)}% a.a.</div>
          </div>
          <input type="range" min="4" max="18" step="0.5" value={taxa}
            onChange={e => setTaxa(+e.target.value)} className={sliderClass} />
          <div className={subRange}><span>4%</span><span>18%</span></div>
        </div>

        {/* Período */}
        <div>
          <div className={rowBetween}>
            <div className={labelClass}>Período</div>
            <div className={valueClass} id="lbl-anos">{anos} anos</div>
          </div>
          <input type="range" min="5" max="40" step="1" value={anos}
            onChange={e => setAnos(+e.target.value)} className={sliderClass} />
          <div className={subRange}><span>5 anos</span><span>40 anos</span></div>
        </div>
      </div>

      {/* Yearly breakdown */}
      <div className="section-header">
        <span className="section-title">Evolução ano a ano</span>
      </div>
      <div className="card p-[14px_16px]" id="comp-table">
        {yearlyBreakdown.length > 0 ? (
          yearlyBreakdown.map(({ year, value }) => (
            <div key={year} className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[13px] text-[var(--text2)]">Ano {year}</span>
              <span className="text-[13px] font-bold text-[var(--text1)] font-mono">
                R$\u00a0{Math.round(value).toLocaleString('pt-BR')}
              </span>
            </div>
          ))
        ) : (
          <span className="text-[var(--text3)] text-[12px]">Selecione mais de 5 anos</span>
        )}
      </div>
    </div>
  );
};