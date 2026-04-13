/**
 * DebtPayoffPlanner.tsx — Rota de Saída das Dívidas
 *
 * Dois métodos comprovados para quitação de dívidas:
 * - Bola de Neve (Dave Ramsey): menor saldo primeiro → vitórias psicológicas rápidas
 * - Avalanche: maior juros primeiro → matematicamente ótimo, paga menos no total
 */

import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Calculator } from "lucide-react";
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

  const { debtsWithMetrics, totalDebt, avalancheStrategy, snowballStrategy } = useDebtStrategy(extrasNum);

  const dividas = debtsWithMetrics.map((d) => ({
    id: d.id, nome: d.name, saldo: d.balance, taxaMensal: d.interestRate, parcela: d.minPayment, emoji: "💳"
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

  const remove = (id: string) => { deleteDebt(id); };

  const totalSaldo = totalDebt;

  const resultAvalanche = {
    totalMeses: avalancheStrategy.monthsToFreedom,
    totalJuros: avalancheStrategy.totalInterestPaid,
    ordem: avalancheStrategy.payoffOrder.map(o => o.debtName)
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

  const ordemNomes = Array.from(new Set(result.ordem));

  const estrategias = [
    {
      id: "avalanche" as const,
      title: "Avalanche",
      emoji: "⚡",
      sub: "Matematizado",
      desc: "Mata os juros primeiro.",
      meses: resultAvalanche.totalMeses,
      juros: resultAvalanche.totalJuros,
      color: "blue" as const,
    },
    {
      id: "bola-de-neve" as const,
      title: "Bola de Neve",
      emoji: "❄️",
      sub: "Psicológico",
      desc: "Mata a menor primeiro.",
      meses: resultBolaDeNeve.totalMeses,
      juros: resultBolaDeNeve.totalJuros,
      color: "purple" as const,
    },
  ] as const;

  return (
    <div className="pt-2.5 animate-[fsu_0.25s_ease]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
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

      {/* ── Alerta educacional ── */}
      <div className="bento-card mb-4 border-red-500/20 bg-red-500/[0.05] border-l-2 border-l-[var(--red)]">
        <div className="text-[11px] font-bold text-[var(--red)] mb-1">⚠️ Regra #1 do brasileiro</div>
        <div className="text-[12px] text-[var(--t2)] leading-relaxed">
          Cartão de crédito cobra até <strong>400% ao ano</strong> no Brasil. Investir com dívida de cartão pendente é matematicamente impossível de lucrar.
          Quite primeiro, invista depois.
        </div>
      </div>

      {/* ── Extra mensal ── */}
      <div className="bento-card mb-3.5">
        <div className="flex items-center gap-2 text-[13px] font-bold mb-3">
          <Calculator size={14} className="text-blue-400" />
          Quanto a mais você pode pagar por mês?
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--t3)] text-sm font-semibold">R$</span>
          <input
            type="number"
            value={extras}
            onChange={(e) => setExtras(e.target.value)}
            placeholder="0"
            className="flex-1"
          />
        </div>
        <div className="text-[11px] text-[var(--t3)] mt-1.5">
          Este valor extra vai inteiramente para a dívida prioritária da sua estratégia.
        </div>
      </div>

      {/* ── Seletor de método ── */}
      {dividas.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-extrabold text-[var(--t3)] mb-3 tracking-[0.1em] uppercase">
            Estratégia Ativa
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {estrategias.map((m) => {
              const isActive = metodoAtivo === m.id;
              const borderCls = isActive
                ? m.color === "blue" ? "border-blue-400 bg-blue-400/[0.07]" : "border-[#9B7FFF] bg-[#9B7FFF]/[0.07]"
                : "border-[var(--border)] bg-[var(--card-obsidian)]";
              const textCls = isActive
                ? m.color === "blue" ? "text-blue-400" : "text-[#9B7FFF]"
                : "text-[var(--t1)]";
              const dotCls = m.color === "blue" ? "bg-blue-400" : "bg-[#9B7FFF]";

              return (
                <button
                  key={m.id}
                  onClick={() => setMetodoAtivo(m.id)}
                  className={`rounded-[20px] border p-4 text-left transition-all flex flex-col gap-1 ${borderCls}`}
                >
                  <div className="flex justify-between items-center">
                    <div className={`text-sm font-black ${textCls}`}>
                      {m.emoji} {m.title}
                    </div>
                    {isActive && <div className={`w-2 h-2 rounded-full ${dotCls}`} />}
                  </div>
                  <div className="text-[10px] text-[var(--t3)] font-semibold">{m.sub}</div>
                  <div className="text-xl font-black text-[var(--t1)] font-mono mt-1">
                    {m.meses} <span className="text-[10px] text-[var(--t3)] font-normal">meses</span>
                  </div>
                </button>
              );
            })}
          </div>

          {economiaBolaNeve > 500 && (
            <div className="text-[10px] text-[var(--green)] mt-3 text-center font-bold bg-[var(--green)]/[0.06] py-1.5 rounded-lg">
              💡 {metodoAtivo === 'bola-de-neve' ? 'Aviso:' : 'Vantagem:'} Avalanche economiza {fmt(economiaBolaNeve)} em juros
            </div>
          )}
        </div>
      )}

      {/* ── Resultado principal ── */}
      {dividas.length > 0 && (
        <div className="bento-grid mb-6">
          {/* Card principal */}
          <div className="bento-full relative overflow-hidden rounded-3xl border border-[var(--green)]/20 bg-gradient-to-br from-[var(--green)]/10 to-blue-400/[0.05] p-6">
            {/* Glow blob */}
            <div className="absolute -top-10 -right-5 w-36 h-36 rounded-full bg-[var(--green)]/15 blur-[50px] pointer-events-none" />
            <div className="text-[11px] font-extrabold text-[var(--green)] uppercase tracking-[0.1em] mb-1.5">
              Liberdade Financeira em
            </div>
            <div className="text-[32px] font-black text-[var(--t1)] tracking-tight capitalize">
              {dataQuitacao(result.totalMeses)}
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              {ordemNomes.map((nome, i) => i < 3 && (
                <span key={nome} className="text-[10px] font-bold text-white/40">
                  {i + 1}. {nome}
                </span>
              ))}
              {ordemNomes.length > 3 && (
                <span className="text-[10px] text-white/20">+{ordemNomes.length - 3}</span>
              )}
            </div>
          </div>

          {/* Tiles secundários */}
          {[
            { label: "Total", value: fmt(totalSaldo), cls: "text-[var(--t1)]" },
            { label: "Juros Pagos", value: fmt(result.totalJuros), cls: "text-[var(--red)]" },
            { label: "Meses", value: String(result.totalMeses), cls: "text-[var(--green)]" },
          ].map((tile) => (
            <div key={tile.label} className="bento-card" style={{ gridColumn: "span 2" }}>
              <div className="text-[9px] font-extrabold text-[var(--t3)] uppercase mb-1">{tile.label}</div>
              <div className={`text-[15px] font-black ${tile.cls}`}>{tile.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista de dívidas ── */}
      <div className="sec-hd">
        <span className="sec-title">Suas dívidas</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/[0.08] text-[var(--red)] text-[11px] font-semibold cursor-pointer"
        >
          <Plus size={12} /> Adicionar
        </button>
      </div>

      {/* Templates */}
      {showForm && dividas.length === 0 && (
        <div className="bento-card mb-3">
          <div className="text-[12px] font-bold text-[var(--t2)] mb-2">Adicionar rapidamente:</div>
          <div className="flex flex-col gap-1.5">
            {DIVIDA_TEMPLATES.map((t) => (
              <button
                key={t.nome}
                onClick={() => applyTemplate(t)}
                className="flex justify-between items-center p-2.5 rounded-[10px] border border-red-500/15 bg-red-500/[0.05] cursor-pointer text-left hover:bg-red-500/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{t.emoji}</span>
                  <div>
                    <div className="text-[12px] font-bold text-[var(--t1)]">{t.nome}</div>
                    <div className="text-[10px] text-[var(--t3)]">{t.dica}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-amber-400 font-bold">
                  {t.taxaSugerida ? `ref. ${t.taxaSugerida}% a.m.` : 'modelo'}
                </div>
              </button>
            ))}
          </div>
          <div className="text-center text-[11px] text-[var(--t3)] mt-2.5">
            Modelos apenas preenchem o formulário. Revise saldo, parcela e taxa com seus dados reais.
          </div>
        </div>
      )}

      {/* Form manual */}
      {showForm && (
        <div className="bento-card mb-3">
          <div className="text-[13px] font-bold mb-3">Nova dívida</div>
          <div className="flex gap-2 mb-2 flex-wrap">
            {["💳", "🏦", "💵", "🚗", "📋", "🏥", "🏠"].map((e) => (
              <button
                key={e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                className={`w-8 h-8 rounded-lg text-base cursor-pointer transition-colors ${
                  form.emoji === e
                    ? "border-2 border-[var(--red)] bg-red-500/15"
                    : "border-2 border-transparent bg-white/[0.04]"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text" placeholder="Nome da dívida" value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="mb-2"
          />
          <input
            type="number" placeholder="Saldo devedor (R$)" value={form.saldo}
            onChange={(e) => setForm((f) => ({ ...f, saldo: e.target.value }))}
            className="mb-2"
          />
          <input
            type="number" placeholder="Taxa mensal (% a.m.) — ex: 15.5 para cartão" value={form.taxaMensal}
            onChange={(e) => setForm((f) => ({ ...f, taxaMensal: e.target.value }))}
            className="mb-2"
          />
          <input
            type="number" placeholder="Parcela mínima mensal (R$)" value={form.parcela}
            onChange={(e) => setForm((f) => ({ ...f, parcela: e.target.value }))}
            className="mb-3"
          />
          <button className="btn btn-primary w-full" onClick={addDivida}>
            Adicionar dívida
          </button>
        </div>
      )}

      {/* Grade de dívidas */}
      <div className="bento-grid mb-7">
        {dividas.map((d) => {
          const isFirst = ordemNomes[0] === d.nome;
          return (
            <div
              key={d.id}
              className={`bento-card flex flex-col gap-3 transition-all ${
                isFirst ? "border-red-500/40" : ""
              }`}
              style={{ gridColumn: "span 3" }}
            >
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  isFirst ? "bg-red-500/10" : "bg-white/[0.03]"
                }`}>
                  {d.emoji}
                </div>
                <button
                  onClick={() => remove(d.id)}
                  className="text-[var(--t4)] hover:text-[var(--red)] transition-colors p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div>
                <div className="font-extrabold text-[13px] text-[var(--t1)] flex items-center gap-1.5">
                  {d.nome}
                  {isFirst && <div className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />}
                </div>
                <div className="text-[10px] text-[var(--t3)] font-semibold mt-0.5">
                  {d.taxaMensal}% a.m. · <span className="font-mono">{fmt(d.parcela)}/mês</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="text-[16px] font-black font-mono text-[var(--red)]">
                  {fmt(d.saldo)}
                </div>
                {isFirst && (
                  <div className="text-[9px] font-black text-[var(--red)] mt-1 tracking-[0.1em] uppercase">
                    Prioridade Máxima
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {dividas.length === 0 && !showForm && (
        <div className="bento-card text-center py-8">
          <div className="text-5xl mb-3">💳</div>
          <div className="font-bold mb-1.5">Calcule sua rota de saída</div>
          <div className="text-[13px] text-[var(--t3)] mb-4 leading-relaxed max-w-xs mx-auto">
            Adicione suas dívidas e veja quando e como você vai se livrar de cada uma delas.
          </div>
          <button className="btn btn-primary mx-auto" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Adicionar dívida
          </button>
        </div>
      )}

      {/* Footer educacional */}
      <div className="mt-5 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <div className="text-[11px] font-bold text-[var(--t2)] mb-1.5">📖 Sobre os métodos</div>
        <div className="text-[11px] text-[var(--t3)] leading-relaxed">
          <strong className="text-blue-400">Avalanche</strong> → menos juros no total, mais rápido matematicamente.<br />
          <strong className="text-[#9B7FFF]">Bola de Neve</strong> → mais motivação, primeiro a quitar a menor dívida.<br />
          Ambos são superiores ao mínimo. Escolha o que mantém você comprometido.
        </div>
      </div>
    </div>
  );
};
