/**
 * CDIBenchmark.tsx — Rentabilidade Comparada ao CDI/IPCA/Poupança
 *
 * O maior erro do investidor brasileiro: não saber se seu dinheiro está bem aplicado.
 * Este componente mostra um semáforo claro de rentabilidade vs benchmarks brasileiros.
 *
 * Taxas de referência locais com data visível.
 * Enquanto não houver integração automática com fonte oficial, estes valores devem ser tratados como comparativo educacional.
 */

import React, { useMemo, useState } from "react";
import { TrendingUp, Info } from "lucide-react";
import { INDICADORES_BRASIL } from "@/lib/finance/brasil-indicadores";

const buildBenchmarks = () => {
  const selic = INDICADORES_BRASIL.SELIC?.valor ?? 11.25;
  const cdi = INDICADORES_BRASIL.CDI?.valor ?? 11.15;
  const ipca = INDICADORES_BRASIL.IPCA?.valor ?? 4.5;
  const poupanca = INDICADORES_BRASIL.POUPANCA?.valor ?? 6.17;

  return {
    SELIC_ANUAL: selic,
    CDI_ANUAL: cdi,
    IPCA_ANUAL: ipca,
    POUPANCA_ANUAL: poupanca,
    REF_DATA: INDICADORES_BRASIL.CDI?.dataAtualizacao ?? new Date().toISOString().slice(0, 10),
    REF_FONTE: INDICADORES_BRASIL.CDI?.fonte ?? 'Referência interna do app',
    IS_REFERENCE: Boolean(INDICADORES_BRASIL.CDI?.isSimulado),
  };
};

interface BenchmarkCardProps {
  rentabilidade: number;     // % ao ano da carteira
  valorInvestido: number;    // total investido
  valorAtual: number;        // valor atual da carteira
}

const fmt = (n: number) =>
  "R$\u00a0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

type Semaforo = "vermelho" | "amarelo" | "verde" | "ouro";

function getSemaforo(rentAnual: number): Semaforo {
  const BENCHMARKS = buildBenchmarks();
  if (rentAnual < BENCHMARKS.IPCA_ANUAL) return "vermelho";       // perdendo para inflação
  if (rentAnual < BENCHMARKS.POUPANCA_ANUAL) return "amarelo";    // acima da inflação mas pior que poupança
  if (rentAnual < BENCHMARKS.CDI_ANUAL * 0.9) return "amarelo";   // abaixo de 90% do CDI
  if (rentAnual >= BENCHMARKS.CDI_ANUAL) return "ouro";           // acima do CDI — excelente
  return "verde";                                                   // entre 90% e 100% do CDI
}

const SEMAFORO_CONFIG: Record<Semaforo, { emoji: string; label: string; color: string; bg: string; message: string }> = {
  vermelho: {
    emoji: "🔴",
    label: "Abaixo da inflação",
    color: "var(--red)",
    bg: "rgba(255,79,110,0.08)",
    message: "Atenção: seu dinheiro está perdendo poder de compra. O IPCA corrói mais do que você rende.",
  },
  amarelo: {
    emoji: "🟡",
    label: "Abaixo de 90% do CDI",
    color: "var(--amber)",
    bg: "rgba(255,173,59,0.08)",
    message: "Rentabilidade razoável, mas o Tesouro Selic (seguro) rende mais. Vale revisar os ativos.",
  },
  verde: {
    emoji: "🟢",
    label: "Entre 90% e 100% do CDI",
    color: "var(--green)",
    bg: "rgba(0,217,145,0.06)",
    message: "Boa rentabilidade! Você está próximo do CDI, que é o benchmark padrão de renda fixa.",
  },
  ouro: {
    emoji: "🏆",
    label: "Acima do CDI",
    color: "#FFB84A",
    bg: "rgba(255,184,74,0.08)",
    message: "Excelente! Sua carteira supera o CDI — você está batendo o benchmark padrão do mercado.",
  },
};

export const CDIBenchmark: React.FC<BenchmarkCardProps> = ({
  rentabilidade,
  valorInvestido,
  valorAtual,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const BENCHMARKS = useMemo(() => buildBenchmarks(), []);

  const semaforo = getSemaforo(rentabilidade);
  const cfg = SEMAFORO_CONFIG[semaforo];

  const cdiBenchPct = BENCHMARKS.CDI_ANUAL > 0 ? (rentabilidade / BENCHMARKS.CDI_ANUAL) * 100 : 0;

  // Quanto teria rendido em alternativas (base: valor investido × taxa anual equivalente)
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
  const maxPct = Math.max(...rows.map((r) => Math.max(0, r.pct)));

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Header card com semáforo */}
      <div
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.color}30`,
          borderRadius: "16px",
          padding: "14px 16px",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: "10px", color: "var(--t3)" }}>
                Ref.: {BENCHMARKS.REF_DATA} · {BENCHMARKS.REF_FONTE}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", padding: "4px" }}
          >
            <Info size={14} />
          </button>
        </div>

        {/* Grande número: % do CDI */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
          <span style={{ fontSize: "36px", fontWeight: 800, color: cfg.color, fontFamily: "var(--mono)", letterSpacing: "-1px" }}>
            {cdiBenchPct.toFixed(0)}%
          </span>
          <span style={{ fontSize: "14px", color: "var(--t3)", fontWeight: 500 }}>do CDI</span>
        </div>

        <div style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "10px" }}>
          Sua carteira rendeu <strong style={{ color: cfg.color, fontFamily: "var(--mono)" }}>{fmtPct(rentabilidade)} a.a.</strong>{" "}
          vs CDI de <strong style={{ fontFamily: "var(--mono)" }}>{BENCHMARKS.CDI_ANUAL}% a.a.</strong>
        </div>

        {BENCHMARKS.IS_REFERENCE && (
          <div style={{ fontSize: "10px", color: "var(--t3)", marginBottom: "10px", lineHeight: 1.5 }}>
            Estes benchmarks ainda são referências internas do app e servem para comparação educacional, não para decisão isolada de investimento.
          </div>
        )}

        {/* Diferença em reais */}
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: diferencaCDI >= 0 ? "rgba(0,217,145,0.08)" : "rgba(255,79,110,0.08)",
            border: `1px solid ${diferencaCDI >= 0 ? "rgba(0,217,145,0.2)" : "rgba(255,79,110,0.2)"}`,
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "2px" }}>
            {diferencaCDI >= 0 ? "Você ganhou a mais que o CDI:" : "Você ficou abaixo do CDI em:"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: diferencaCDI >= 0 ? "var(--green)" : "var(--red)", fontFamily: "var(--mono)" }}>
            {fmt(Math.abs(diferencaCDI))}
          </div>
        </div>

        {showInfo && (
          <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "11px", color: "var(--t3)", lineHeight: 1.6 }}>
              {cfg.message}
            </div>
          </div>
        )}
      </div>

      {/* Tabela comparativa */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={12} color="var(--blue)" />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Comparativo anual (base: {fmt(valorInvestido)})
            </span>
          </div>
        </div>

        {rows.map((row, i) => {
          const barW = maxPct > 0 ? (Math.max(0, row.pct) / maxPct) * 100 : 0;
          return (
            <div
              key={row.label}
              style={{
                padding: "10px 14px",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: row.destaque ? "rgba(74,139,255,0.04)" : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {row.destaque && (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }} />
                  )}
                  <span style={{ fontSize: "12px", fontWeight: row.destaque ? 700 : 500, color: row.destaque ? "var(--t1)" : "var(--t2)" }}>
                    {row.label}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--mono)", color: row.destaque ? cfg.color : row.pct < BENCHMARKS.IPCA_ANUAL ? "var(--red)" : "var(--t2)" }}>
                    {fmtPct(row.pct)}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)", marginLeft: "6px" }}>
                    ({fmt(row.valor)})
                  </span>
                </div>
              </div>
              <div className="prog">
                <div
                  className="prog-fill"
                  style={{
                    width: `${barW}%`,
                    background: row.destaque ? cfg.color : "rgba(255,255,255,0.15)",
                    transition: "width 0.7s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota */}
      <div style={{ textAlign: "center", fontSize: "10px", color: "var(--t4)", marginTop: "8px", lineHeight: 1.5 }}>
        Rentabilidade calculada sobre patrimônio atual. CDI/IPCA/Poupança são simulados sobre o valor investido.
        Taxas de referência: Selic {BENCHMARKS.SELIC_ANUAL.toFixed(2)}% · {BENCHMARKS.REF_DATA}
      </div>
    </div>
  );
};
