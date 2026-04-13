/**
 * CDIBenchmark.tsx — Rentabilidade Comparada ao CDI/IPCA/Poupança
 *
 * O maior erro do investidor brasileiro: não saber se seu dinheiro está bem aplicado.
 * Este componente mostra um semáforo claro de rentabilidade vs benchmarks brasileiros.
 */

import React, { useMemo, useState, useEffect } from "react";
import { TrendingUp, Info } from "lucide-react";
import { INDICADORES_BRASIL } from "@/lib/finance/brasil-indicadores";
import { fetchMarketData, type MarketData } from "@/lib/market-data";

const buildBenchmarks = (live?: MarketData) => {
  const selic    = live?.selic    ?? INDICADORES_BRASIL.SELIC?.valor    ?? 13.75;
  const cdi      = live?.cdi      ?? INDICADORES_BRASIL.CDI?.valor      ?? 13.65;
  const ipca     = live?.ipca     ?? INDICADORES_BRASIL.IPCA?.valor     ?? 5.06;
  const poupanca = live?.poupanca ?? INDICADORES_BRASIL.POUPANCA?.valor ?? 7.0;
  const isLive   = live?.isLive === true;

  return {
    SELIC_ANUAL: selic,
    CDI_ANUAL: cdi,
    IPCA_ANUAL: ipca,
    POUPANCA_ANUAL: poupanca,
    REF_DATA: live?.updatedAt
      ? new Date(live.updatedAt).toLocaleDateString("pt-BR")
      : (INDICADORES_BRASIL.CDI?.dataAtualizacao ?? new Date().toISOString().slice(0, 10)),
    REF_FONTE: isLive ? "BCB SGS · Ao vivo" : (INDICADORES_BRASIL.CDI?.fonte ?? "Referência interna"),
    IS_REFERENCE: !isLive,
  };
};

interface BenchmarkCardProps {
  rentabilidade: number;
  valorInvestido: number;
  valorAtual: number;
}

const fmt = (n: number) =>
  "R$\u00a0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

type Semaforo = "vermelho" | "amarelo" | "verde" | "ouro";

function getSemaforo(rentAnual: number): Semaforo {
  const B = buildBenchmarks();
  if (rentAnual < B.IPCA_ANUAL) return "vermelho";
  if (rentAnual < B.POUPANCA_ANUAL) return "amarelo";
  if (rentAnual < B.CDI_ANUAL * 0.9) return "amarelo";
  if (rentAnual >= B.CDI_ANUAL) return "ouro";
  return "verde";
}

const SEMAFORO_CONFIG: Record<Semaforo, { emoji: string; label: string; color: string; bg: string; message: string }> = {
  vermelho: { emoji: "🔴", label: "Abaixo da inflação", color: "var(--red)", bg: "rgba(255,79,110,0.08)", message: "Atenção: seu dinheiro está perdendo poder de compra. O IPCA corrói mais do que você rende." },
  amarelo:  { emoji: "🟡", label: "Abaixo de 90% do CDI", color: "var(--amber)", bg: "rgba(255,173,59,0.08)", message: "Rentabilidade razoável, mas o Tesouro Selic (seguro) rende mais. Vale revisar os ativos." },
  verde:    { emoji: "🟢", label: "Entre 90% e 100% do CDI", color: "var(--green)", bg: "rgba(0,217,145,0.06)", message: "Boa rentabilidade! Você está próximo do CDI, que é o benchmark padrão de renda fixa." },
  ouro:     { emoji: "🏆", label: "Acima do CDI", color: "#FFB84A", bg: "rgba(255,184,74,0.08)", message: "Excelente! Sua carteira supera o CDI — você está batendo o benchmark padrão do mercado." },
};

export const CDIBenchmark: React.FC<BenchmarkCardProps> = ({ rentabilidade, valorInvestido, valorAtual }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [liveData, setLiveData] = useState<MarketData | undefined>(undefined);

  useEffect(() => { fetchMarketData().then(setLiveData).catch(() => {}); }, []);

  const BENCHMARKS = useMemo(() => buildBenchmarks(liveData), [liveData]);
  const semaforo = getSemaforo(rentabilidade);
  const cfg = SEMAFORO_CONFIG[semaforo];

  const cdiBenchPct = BENCHMARKS.CDI_ANUAL > 0 ? (rentabilidade / BENCHMARKS.CDI_ANUAL) * 100 : 0;
  const ganhoCarteira = valorAtual - valorInvestido;
  const rendCDI = valorInvestido * (BENCHMARKS.CDI_ANUAL / 100);
  const rendIpca = valorInvestido * (BENCHMARKS.IPCA_ANUAL / 100);
  const rendPoupanca = valorInvestido * (BENCHMARKS.POUPANCA_ANUAL / 100);
  const diferencaCDI = ganhoCarteira - rendCDI;

  const rows = [
    { label: "Sua carteira", pct: rentabilidade, valor: ganhoCarteira, destaque: true },
    { label: `CDI (${BENCHMARKS.CDI_ANUAL}% a.a.)`, pct: BENCHMARKS.CDI_ANUAL, valor: rendCDI, destaque: false },
    { label: `IPCA (${BENCHMARKS.IPCA_ANUAL}% a.a.)`, pct: BENCHMARKS.IPCA_ANUAL, valor: rendIpca, destaque: false },
    { label: `Poupança (${BENCHMARKS.POUPANCA_ANUAL.toFixed(2)}% a.a.)`, pct: BENCHMARKS.POUPANCA_ANUAL, valor: rendPoupanca, destaque: false },
  ];
  const maxPct = Math.max(...rows.map(r => Math.max(0, r.pct)));

  return (
    <div className="mb-4">
      {/* Semáforo header */}
      <div
        className="rounded-2xl px-4 py-3.5 mb-2.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      >
        {/* Top row */}
        <div className="flex justify-between items-start mb-2.5 gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{cfg.emoji}</span>
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </div>
              <div className="text-[10px] text-[var(--t3)]">
                Ref.: {BENCHMARKS.REF_DATA} · {BENCHMARKS.REF_FONTE}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="bg-transparent border-none text-[var(--t3)] cursor-pointer p-1 hover:text-white transition-colors"
          >
            <Info size={14} />
          </button>
        </div>

        {/* Big CDI % */}
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span
            className="text-[36px] font-extrabold font-mono tracking-[-1px]"
            style={{ color: cfg.color }}
          >
            {cdiBenchPct.toFixed(0)}%
          </span>
          <span className="text-[14px] text-[var(--t3)] font-medium">do CDI</span>
        </div>

        <div className="text-[13px] text-[var(--t2)] mb-2.5">
          Sua carteira rendeu{" "}
          <strong style={{ color: cfg.color }} className="font-mono">{fmtPct(rentabilidade)} a.a.</strong>
          {" "}vs CDI de{" "}
          <strong className="font-mono">{BENCHMARKS.CDI_ANUAL}% a.a.</strong>
        </div>

        {BENCHMARKS.IS_REFERENCE && (
          <div className="text-[10px] text-[var(--t3)] mb-2.5 leading-relaxed">
            Estes benchmarks ainda são referências internas do app e servem para comparação educacional, não para decisão isolada de investimento.
          </div>
        )}

        {/* Diferença em R$ */}
        <div
          className="px-3 py-2 rounded-[10px]"
          style={{
            background: diferencaCDI >= 0 ? "rgba(0,217,145,0.08)" : "rgba(255,79,110,0.08)",
            border: `1px solid ${diferencaCDI >= 0 ? "rgba(0,217,145,0.2)" : "rgba(255,79,110,0.2)"}`,
          }}
        >
          <div className="text-[11px] text-[var(--t3)] mb-0.5">
            {diferencaCDI >= 0 ? "Você ganhou a mais que o CDI:" : "Você ficou abaixo do CDI em:"}
          </div>
          <div
            className="text-[16px] font-extrabold font-mono"
            style={{ color: diferencaCDI >= 0 ? "var(--green)" : "var(--red)" }}
          >
            {fmt(Math.abs(diferencaCDI))}
          </div>
        </div>

        {showInfo && (
          <div className="mt-2.5 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[11px] text-[var(--t3)] leading-relaxed">{cfg.message}</div>
          </div>
        )}
      </div>

      {/* Comparative table */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-[14px] overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} color="var(--blue)" />
            <span className="text-[11px] font-bold text-[var(--t2)] uppercase tracking-[0.06em]">
              Comparativo anual (base: {fmt(valorInvestido)})
            </span>
          </div>
        </div>

        {rows.map((row, i) => {
          const barW = maxPct > 0 ? (Math.max(0, row.pct) / maxPct) * 100 : 0;
          return (
            <div
              key={row.label}
              className="px-3.5 py-2.5"
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: row.destaque ? "rgba(74,139,255,0.04)" : "transparent",
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  {row.destaque && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }}
                    />
                  )}
                  <span
                    className="text-[12px]"
                    style={{
                      fontWeight: row.destaque ? 700 : 500,
                      color: row.destaque ? "var(--t1)" : "var(--t2)",
                    }}
                  >
                    {row.label}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="text-[12px] font-bold font-mono"
                    style={{
                      color: row.destaque ? cfg.color : row.pct < BENCHMARKS.IPCA_ANUAL ? "var(--red)" : "var(--t2)",
                    }}
                  >
                    {fmtPct(row.pct)}
                  </span>
                  <span className="text-[10px] text-[var(--t3)] font-mono ml-1.5">
                    ({fmt(row.valor)})
                  </span>
                </div>
              </div>
              <div className="prog">
                <div
                  className="prog-fill transition-[width] duration-700 ease-out"
                  style={{ width: `${barW}%`, background: row.destaque ? cfg.color : "rgba(255,255,255,0.15)" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center text-[10px] text-[var(--t4)] mt-2 leading-relaxed">
        Rentabilidade calculada sobre patrimônio atual. CDI/IPCA/Poupança são simulados sobre o valor investido.
        Taxas de referência: Selic {BENCHMARKS.SELIC_ANUAL.toFixed(2)}% · {BENCHMARKS.REF_DATA}
      </div>
    </div>
  );
};
