/**
 * DebtPayoffPlanner.tsx — Rota de Saída das Dívidas
 *
 * Dois métodos comprovados para quitação de dívidas:
 * - Bola de Neve (Dave Ramsey): menor saldo primeiro → vitórias psicológicas rápidas
 * - Avalanche: maior juros primeiro → matematicamente ótimo, paga menos no total
 *
 * O app mostra ambos lado a lado com data de quitação e juros totais economizados.
 */

import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, TrendingDown, Calculator } from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { useDebtStrategy } from "@/hooks/useDebtStrategy";


const DIVIDA_TEMPLATES: Array<{
  nome: string;
  emoji: string;
  taxaSugerida?: string;
  dica: string;
}> = [
  { nome: "Cartão de crédito", emoji: "💳", taxaSugerida: "15.5", dica: "Confira a taxa real na fatura ou CET do rotativo/parcelado." },
  { nome: "Cheque especial", emoji: "🏦", taxaSugerida: "12.5", dica: "Use a taxa do contrato ou do extrato, pois varia por banco." },
  { nome: "Empréstimo pessoal", emoji: "💵", taxaSugerida: "3.5", dica: "Use a taxa mensal efetiva contratada, não apenas a taxa nominal." },
  { nome: "Financiamento do carro", emoji: "🚗", taxaSugerida: "1.2", dica: "Considere incluir seguros e tarifas se quiser comparar custo total." },
  { nome: "Crédito consignado", emoji: "📋", taxaSugerida: "1.8", dica: "Normalmente tem juros menores, mas confirme o CET no contrato." },
];

const fmt = (n: number) =>
  "R$\u00a0" + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });



interface Props {
  onBack?: () => void;
}

export const DebtPayoffPlanner: React.FC<Props> = ({ onBack }) => {
  const { addDebt, deleteDebt } = useDebts();
  const [extras, setExtras] = useState("200");
  const [showForm, setShowForm] = useState(false);
  const [metodoAtivo, setMetodoAtivo] = useState<"avalanche" | "bola-de-neve">("avalanche");

  const [form, setForm] = useState({
    nome: "", saldo: "", taxaMensal: "", parcela: "", emoji: "💳",
  });

  const extrasNum = Math.max(0, parseFloat(extras) || 0);

  // Magic here: Use our robust hook instead of local calculation
  const { debtsWithMetrics, totalDebt, avalancheStrategy, snowballStrategy } = useDebtStrategy(extrasNum);
  
  // We rename them purely to keep compatibility with existing JSX if possible
  const dividas = debtsWithMetrics.map((d) => ({
    id: d.id, nome: d.name, saldo: d.balance, taxaMensal: d.interestRate, parcela: d.minPayment, emoji: "💳" // Emoji is hardcoded purely for visual since API doesn't hold it natively
  }));

  const addDivida = () => {
    if (!form.nome || !form.saldo || !form.taxaMensal || !form.parcela) return;
    
    addDebt({
      name: form.nome,
      balance: parseFloat(form.saldo),
      interestRate: parseFloat(form.taxaMensal),
      minPayment: parseFloat(form.parcela),
      category: 'other', 
      dueDate: new Date().toISOString().substring(0, 10),
    });
    
    setForm({ nome: "", saldo: "", taxaMensal: "", parcela: "", emoji: "💳" });
    setShowForm(false);
  };

  const applyTemplate = (template: (typeof DIVIDA_TEMPLATES)[number]) => {
    setForm((prev) => ({
      ...prev,
      nome: template.nome,
      taxaMensal: prev.taxaMensal || (template.taxaSugerida ?? ""),
      emoji: template.emoji,
    }));
    setShowForm(true);
  };

  const remove = (id: string) => {
    deleteDebt(id);
  };

  const totalSaldo = totalDebt;
  
  const resultAvalanche = {
    totalMeses: avalancheStrategy.monthsToFreedom,
    totalJuros: avalancheStrategy.totalInterestPaid,
    ordem: avalancheStrategy.payoffOrder.map(o => o.debtName) // Map by name for the UI visual
  };
  
  const resultBolaDeNeve = {
    totalMeses: snowballStrategy.monthsToFreedom,
    totalJuros: snowballStrategy.totalInterestPaid,
    ordem: snowballStrategy.payoffOrder.map(o => o.debtName)
  };

  const economiaBolaNeve = Math.max(0, resultBolaDeNeve.totalJuros - resultAvalanche.totalJuros);
  const result = metodoAtivo === "avalanche" ? resultAvalanche : resultBolaDeNeve;

  const dataQuitacao = (meses: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + meses);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  // Ordem de quitação única
  const ordemNomes = Array.from(new Set(result.ordem));

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.25s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <div className="eyebrow">Estratégias de Quitação</div>
          <div className="page-title" style={{ margin: 0, fontSize: "22px" }}>
            🎯 Rota de Saída
          </div>
        </div>
      </div>

      {/* Educacional */}
      <div
        className="nudge"
        style={{ marginBottom: "16px", borderLeftColor: "var(--red)", borderColor: "rgba(255,79,110,0.2)", background: "rgba(255,79,110,0.05)" }}
      >
        <div className="nudge-ttl" style={{ color: "var(--red)" }}>⚠️ Regra #1 do brasileiro</div>
        <div className="nudge-body">
          Cartão de crédito cobra até <strong>400% ao ano</strong> no Brasil. Investir com dívida de cartão pendente é matematicamente impossível de lucrar.
          Quite primeiro, invista depois.
        </div>
      </div>

      {/* Extra mensal */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calculator size={14} color="var(--blue)" />
          Quanto a mais você pode pagar por mês?
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ color: "var(--t3)", fontSize: "14px", fontWeight: 600 }}>R$</span>
          <input
            type="number"
            value={extras}
            onChange={(e) => setExtras(e.target.value)}
            placeholder="0"
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "6px" }}>
          Este valor extra vai inteiramente para a dívida prioritária da sua estratégia.
        </div>
      </div>

      {/* Seletor de método */}
      {dividas.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            ESCOLHA SUA ESTRATÉGIA
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
            {(
              [
                {
                  id: "avalanche" as const,
                  title: "⚡ Avalanche",
                  sub: "Maior juros primeiro",
                  desc: "Você paga menos no total. Matematicamente ótimo.",
                  meses: resultAvalanche.totalMeses,
                  juros: resultAvalanche.totalJuros,
                  cor: "#4A8BFF",
                },
                {
                  id: "bola-de-neve" as const,
                  title: "❄️ Bola de Neve",
                  sub: "Menor saldo primeiro",
                  desc: "Vitórias rápidas. Ótimo para motivação.",
                  meses: resultBolaDeNeve.totalMeses,
                  juros: resultBolaDeNeve.totalJuros,
                  cor: "#9B7FFF",
                },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMetodoAtivo(m.id)}
                style={{
                  padding: "14px 12px",
                  borderRadius: "14px",
                  border: `2px solid ${metodoAtivo === m.id ? m.cor : "rgba(255,255,255,0.08)"}`,
                  background: metodoAtivo === m.id ? `${m.cor}12` : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 700, color: metodoAtivo === m.id ? m.cor : "var(--t1)", marginBottom: "2px" }}>{m.title}</div>
                <div style={{ fontSize: "10px", color: "var(--t3)", marginBottom: "8px" }}>{m.sub}</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: metodoAtivo === m.id ? m.cor : "var(--t1)", fontFamily: "var(--mono)" }}>
                  {m.meses} meses
                </div>
                <div style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                  {fmt(m.juros)} em juros
                </div>
              </button>
            ))}
          </div>

          {economiaBolaNeve > 500 && (
            <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "8px", textAlign: "center", fontWeight: 600 }}>
              💡 Avalanche economiza {fmt(economiaBolaNeve)} em juros vs Bola de Neve
            </div>
          )}
        </div>
      )}

      {/* Resultado */}
      {dividas.length > 0 && (
        <div
          className="hero"
          style={{ marginBottom: "16px", padding: "16px 18px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <TrendingDown size={14} color="var(--green)" />
            <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Projeção · {metodoAtivo === "avalanche" ? "Avalanche" : "Bola de Neve"}
            </span>
          </div>

          <div className="stat3" style={{ marginBottom: "12px" }}>
            <div className="s3i">
              <div className="s3l">Quita em</div>
              <div className="s3v" style={{ fontSize: "22px", color: "var(--green)" }}>{result.totalMeses}</div>
              <div style={{ fontSize: "9px", color: "var(--t3)" }}>meses</div>
            </div>
            <div className="s3i">
              <div className="s3l">Total dívidas</div>
              <div className="s3v">{fmt(totalSaldo)}</div>
            </div>
            <div className="s3i">
              <div className="s3l">Juros pagos</div>
              <div className="s3v" style={{ color: "var(--red)" }}>{fmt(result.totalJuros)}</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(0,217,145,0.08)",
              border: "1px solid rgba(0,217,145,0.2)",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600, marginBottom: "2px" }}>
              🎯 Você fica livre das dívidas em:
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t1)" }}>
              {dataQuitacao(result.totalMeses)}
            </div>
          </div>

          {ordemNomes.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.06em" }}>ORDEM DE QUITAÇÃO</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {ordemNomes.map((nome, i) => (
                  <span
                    key={nome}
                    style={{
                      fontSize: "11px", fontWeight: 600, padding: "3px 10px",
                      borderRadius: "20px", background: "rgba(74,139,255,0.12)",
                      color: "#4A8BFF",
                    }}
                  >
                    {i + 1}. {nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de dívidas */}
      <div className="sec-hd">
        <span className="sec-title">Suas dívidas</span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px",
            borderRadius: "8px", border: "1px solid rgba(255,79,110,0.3)",
            background: "rgba(255,79,110,0.08)", color: "var(--red)",
            fontSize: "11px", cursor: "pointer", fontWeight: 600,
          }}
        >
          <Plus size={12} /> Adicionar
        </button>
      </div>

      {/* Templates */}
      {showForm && dividas.length === 0 && (
        <div className="card" style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "8px" }}>
            Adicionar rapidamente:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {DIVIDA_TEMPLATES.map((t) => (
              <button
                key={t.nome}
                onClick={() => applyTemplate(t)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: "10px",
                  border: "1px solid rgba(255,79,110,0.15)", background: "rgba(255,79,110,0.05)",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t1)" }}>{t.nome}</div>
                    <div style={{ fontSize: "10px", color: "var(--t3)" }}>{t.dica}</div>
                  </div>
                </div>
                <div style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--amber)", fontWeight: 700 }}>
                  {t.taxaSugerida ? `ref. ${t.taxaSugerida}% a.m.` : 'modelo'}
                </div>
              </button>
            ))}
          </div>
          <div style={{ margin: "10px 0 4px", textAlign: "center", fontSize: "11px", color: "var(--t3)" }}>
            Modelos apenas preenchem o formulário. Revise saldo, parcela e taxa com seus dados reais.
          </div>
        </div>
      )}

      {/* Form manual */}
      {showForm && (
        <div className="card" style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Nova dívida</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            {["💳", "🏦", "💵", "🚗", "📋", "🏥", "🏠"].map((e) => (
              <button
                key={e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: `2px solid ${form.emoji === e ? "var(--red)" : "transparent"}`,
                  background: form.emoji === e ? "rgba(255,79,110,0.15)" : "rgba(255,255,255,0.04)",
                  fontSize: "16px", cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text" placeholder="Nome da dívida" value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            style={{ marginBottom: "8px" }}
          />
          <input
            type="number" placeholder="Saldo devedor (R$)" value={form.saldo}
            onChange={(e) => setForm((f) => ({ ...f, saldo: e.target.value }))}
            style={{ marginBottom: "8px" }}
          />
          <input
            type="number" placeholder="Taxa mensal (% a.m.) — ex: 15.5 para cartão" value={form.taxaMensal}
            onChange={(e) => setForm((f) => ({ ...f, taxaMensal: e.target.value }))}
            style={{ marginBottom: "8px" }}
          />
          <input
            type="number" placeholder="Parcela mínima mensal (R$)" value={form.parcela}
            onChange={(e) => setForm((f) => ({ ...f, parcela: e.target.value }))}
            style={{ marginBottom: "12px" }}
          />
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={addDivida}>
            Adicionar dívida
          </button>
        </div>
      )}

      {/* Cards de dívidas */}
      {dividas.map((d) => {
        const isFirst = ordemNomes[0] === d.nome;

        return (
          <div
            key={d.id}
            className="card"
            style={{
              marginBottom: "8px",
              border: isFirst ? "1px solid rgba(255,79,110,0.3)" : undefined,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>{d.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>
                    {isFirst && <span style={{ fontSize: "10px", color: "var(--red)", marginRight: "6px", fontWeight: 700 }}>PRIORIDADE</span>}
                    {d.nome}
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                    <span style={{ fontSize: "10px", color: "var(--red)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                      {d.taxaMensal}% a.m.
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                      mín. {fmt(d.parcela)}/mês
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "16px", fontFamily: "var(--mono)", color: "var(--red)" }}>
                    {fmt(d.saldo)}
                  </div>
                </div>
                <button onClick={() => remove(d.id)} style={{ background: "none", border: "none", color: "var(--t4)", cursor: "pointer", padding: "4px" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {dividas.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>💳</div>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>Calcule sua rota de saída</div>
          <div style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "16px", lineHeight: 1.5 }}>
            Adicione suas dívidas e veja quando e como você vai se livrar de cada uma delas.
          </div>
          <button className="btn btn-primary" style={{ margin: "0 auto" }} onClick={() => setShowForm(true)}>
            <Plus size={14} /> Adicionar dívida
          </button>
        </div>
      )}

      {/* Footer educacional */}
      <div style={{ marginTop: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>📖 Sobre os métodos</div>
        <div style={{ fontSize: "11px", color: "var(--t3)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--blue)" }}>Avalanche</strong> → menos juros no total, mais rápido matematicamente.<br />
          <strong style={{ color: "#9B7FFF" }}>Bola de Neve</strong> → mais motivação, primeiro a quitar a menor dívida.<br />
          Ambos são superiores ao mínimo. Escolha o que mantém você comprometido.
        </div>
      </div>
    </div>
  );
};
