/**
 * ProvisaoView.tsx — "Cofrinhos" / Provisões Mensais
 *
 * A principal causa de "surpresas financeiras" do brasileiro:
 * IPTU, IPVA, seguro, matrícula, 13º etc. chegam de uma vez todo ano.
 * Solução: dividir em 12 e separar mensalmente (Sinking Funds).
 */

import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";

const EMOJIS = ["🏠", "🚗", "📚", "🏥", "🎓", "✈️", "🎁", "🛡️", "💰", "🔧"];
const CORES = [
  "#4A8BFF", "#00D991", "#FF4F6E", "#FFB84A", "#9B7FFF",
  "#00C4B4", "#FF6B35", "#A8E063", "#FF90A3", "#64B5F6",
];
const SUGESTOES_BR = [
  { nome: "IPTU", valorAnual: 1800, mes: 2, emoji: "🏠", cor: "#4A8BFF" },
  { nome: "IPVA", valorAnual: 1500, mes: 1, emoji: "🚗", cor: "#FFB84A" },
  { nome: "Seguro do carro", valorAnual: 2400, mes: 6, emoji: "🛡️", cor: "#9B7FFF" },
  { nome: "Matrícula escolar", valorAnual: 1200, mes: 1, emoji: "🎓", cor: "#00D991" },
  { nome: "Férias", valorAnual: 5000, mes: 7, emoji: "✈️", cor: "#FF6B35" },
  { nome: "13º salário (reserva)", valorAnual: 3000, mes: 12, emoji: "💰", cor: "#A8E063" },
  { nome: "Revisão do carro", valorAnual: 1200, mes: 6, emoji: "🔧", cor: "#64B5F6" },
];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fmt = (n: number) =>
  "R$\u00a0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors mb-2 appearance-none block";

interface Props {
  onBack?: () => void;
}

export const ProvisaoView: React.FC<Props> = ({ onBack }) => {
  const { goals, addGoal, deleteGoal, updateGoalProgress, loading } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [showSugestoes, setShowSugestoes] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    valorAnual: "",
    mes: new Date().getMonth() + 1,
    emoji: "💰",
    cor: "#4A8BFF",
  });

  const provisoes = goals.map(g => {
    let mesVencimento = 12;
    if (g.deadline) {
      const date = new Date(g.deadline);
      if (!isNaN(date.getTime())) mesVencimento = date.getMonth() + 1;
    }
    return {
      id: g.id,
      nome: g.name,
      valorAnual: g.targetAmount,
      mes: mesVencimento,
      emoji: g.icon || "💰",
      cor: g.color || "#4A8BFF",
      acumulado: g.currentAmount,
    };
  });

  const getDeadlineForMonth = (month: number) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const ano = month < currentMonth ? currentYear + 1 : currentYear;
    return new Date(ano, month - 1, 15).toISOString();
  };

  const handleAddProvisao = () => {
    if (!form.nome || !form.valorAnual) return;
    addGoal({
      name: form.nome,
      targetAmount: parseFloat(form.valorAnual),
      currentAmount: 0,
      deadline: getDeadlineForMonth(form.mes),
      icon: form.emoji,
      color: form.cor,
    });
    setForm({ nome: "", valorAnual: "", mes: new Date().getMonth() + 1, emoji: "💰", cor: "#4A8BFF" });
    setShowForm(false);
  };

  const addSugestao = (s: typeof SUGESTOES_BR[number]) => {
    addGoal({ name: s.nome, targetAmount: s.valorAnual, currentAmount: 0, deadline: getDeadlineForMonth(s.mes), icon: s.emoji, color: s.cor });
  };

  const addAporte = (id: string, valor: number) => {
    const prov = provisoes.find(p => p.id === id);
    if (!prov) return;
    updateGoalProgress(id, Math.min(prov.valorAnual, prov.acumulado + valor));
  };

  const mesAtual = new Date().getMonth() + 1;
  const totalMensal = provisoes.reduce((sum, p) => sum + p.valorAnual / 12, 0);
  const totalAcumulado = provisoes.reduce((sum, p) => sum + p.acumulado, 0);
  const totalMeta = provisoes.reduce((sum, p) => sum + p.valorAnual, 0);

  const proximasStr = provisoes
    .filter(p => { const diff = ((p.mes - mesAtual + 12) % 12) || 12; return diff <= 3; })
    .sort((a, b) => ((a.mes - mesAtual + 12) % 12) - ((b.mes - mesAtual + 12) % 12));

  return (
    <div className="pt-2.5 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        {onBack && (
          <button className="back-btn" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <div className="eyebrow flex gap-1.5 items-center">
            Planejamento {loading && <Loader2 size={12} className="animate-spin text-blue-500" />}
          </div>
          <div className="page-title text-[22px] m-0">💰 Provisões Mensais</div>
        </div>
      </div>

      {/* Tip */}
      <div className="nudge mb-4" style={{ borderLeftColor: "#4A8BFF", borderColor: "rgba(74,139,255,0.2)", background: "rgba(74,139,255,0.05)" }}>
        <div className="nudge-ttl" style={{ color: "#4A8BFF" }}>💡 Como funciona</div>
        <div className="nudge-body">
          Divide despesas anuais (IPTU, IPVA, férias, seguro) em 12 parcelas mensais e separa o valor todo mês.
          Assim você sempre tem o dinheiro na hora certa. <strong>Zero surpresas.</strong>
        </div>
      </div>

      {/* Summary bento */}
      {provisoes.length > 0 && (
        <div className="grid grid-cols-6 gap-3 mb-5">
          {/* Hero */}
          <div className="col-span-6 rounded-[24px] px-6 py-5 bg-blue-500/[0.08] border border-blue-500/20 backdrop-blur-md flex justify-between items-center relative overflow-hidden">
            <div className="absolute -top-8 -right-5 w-[120px] h-[120px] bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div>
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">Separar este mês</div>
              <div className="text-[28px] font-black text-[var(--t1)] tracking-tight">{fmt(totalMensal)}</div>
            </div>
            <div className="text-right text-[var(--t3)] text-[11px] font-medium leading-snug">
              Zero surpresas<br />no fim do ano 🎯
            </div>
          </div>

          <div className="col-span-3 bg-[var(--glass)] border border-[var(--border)] rounded-[20px] p-4 flex flex-col justify-center">
            <div className="text-[10px] font-semibold text-[var(--t3)] uppercase mb-1">Acumulado</div>
            <div className="text-[18px] font-extrabold text-[var(--green)]">{fmt(totalAcumulado)}</div>
          </div>

          <div className="col-span-3 bg-[var(--glass)] border border-[var(--border)] rounded-[20px] p-4 flex flex-col justify-center">
            <div className="text-[10px] font-semibold text-[var(--t3)] uppercase mb-1">Meta Final</div>
            <div className="text-[18px] font-extrabold text-[var(--t1)]">{fmt(totalMeta)}</div>
          </div>
        </div>
      )}

      {/* Urgentes */}
      {proximasStr.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {proximasStr.map(p => {
            const diff = ((p.mes - mesAtual + 12) % 12) || 12;
            const pct = p.acumulado / p.valorAnual;
            const falta = p.valorAnual - p.acumulado;
            const isUrgent = diff === 1;

            return (
              <div
                key={p.id}
                className={`rounded-[20px] px-5 py-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md ${
                  isUrgent
                    ? "bg-gradient-to-br from-red-500/[0.12] to-transparent border border-red-500/30"
                    : "bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20"
                }`}
              >
                {isUrgent && (
                  <div className="absolute top-3 right-3 text-[9px] font-black text-[var(--red)] uppercase tracking-widest bg-red-500/15 px-2 py-1 rounded-lg">
                    Urgente
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[14px] bg-white/5 flex items-center justify-center text-2xl">{p.emoji}</div>
                    <div>
                      <div className="text-[15px] font-extrabold text-[var(--t1)]">{p.nome}</div>
                      <div className={`text-[11px] font-semibold ${isUrgent ? "text-[var(--red)]" : "text-[var(--amber)]"}`}>
                        {isUrgent ? "Vence mês que vem!" : `Vence em ${diff} meses`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-black font-mono text-[var(--t1)]">{fmt(falta)}</div>
                    <div className="text-[10px] text-[var(--t3)] font-semibold">restantes</div>
                  </div>
                </div>
                <div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, pct * 100)}%`,
                        background: isUrgent ? "var(--red)" : "var(--amber)",
                        boxShadow: isUrgent ? "0 0 10px rgba(255,79,110,0.3)" : "none",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-[var(--t3)] font-medium">
                    <span>{Math.round(pct * 100)}% completo</span>
                    <span>Meta: {fmt(p.valorAnual)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section header */}
      <div className="sec-hd mt-5">
        <span className="sec-title">Todas as provisões</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSugestoes(!showSugestoes)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--glass)] text-[var(--t2)] text-[11px] font-semibold cursor-pointer hover:bg-white/10 transition-colors"
          >
            Sugestões
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[11px] font-semibold cursor-pointer hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={12} /> Nova
          </button>
        </div>
      </div>

      {/* Sugestões */}
      {showSugestoes && (
        <div className="card mb-3">
          <div className="text-[12px] text-[var(--t2)] mb-2.5 font-semibold">Toque para adicionar:</div>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES_BR.filter(s => !provisoes.find(p => p.nome === s.nome)).map(s => (
              <button
                key={s.nome}
                onClick={() => addSugestao(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[var(--t1)] text-[12px] font-semibold cursor-pointer hover:brightness-110 transition-all"
                style={{ border: `1px solid ${s.cor}40`, background: `${s.cor}15` }}
              >
                {s.emoji} {s.nome}
                <span className="text-[var(--t3)] text-[10px] font-mono">{fmt(s.valorAnual / 12)}/mês</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card mb-3">
          <div className="text-[13px] font-bold mb-3">Nova provisão</div>

          {/* Emoji picker */}
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className="w-8 h-8 rounded-lg text-[16px] cursor-pointer transition-colors"
                style={{
                  border: `2px solid ${form.emoji === e ? "#4A8BFF" : "transparent"}`,
                  background: form.emoji === e ? "rgba(74,139,255,0.15)" : "rgba(255,255,255,0.04)",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Ex: Seguro do carro"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Valor anual (ex: 2400)"
            value={form.valorAnual}
            onChange={e => setForm(f => ({ ...f, valorAnual: e.target.value }))}
            className={inputClass}
          />
          <select
            value={form.mes}
            onChange={e => setForm(f => ({ ...f, mes: parseInt(e.target.value) }))}
            className={inputClass + " mb-3"}
          >
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>

          {/* Color picker */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {CORES.map(c => (
              <button
                key={c}
                onClick={() => setForm(f => ({ ...f, cor: c }))}
                className="w-6 h-6 rounded-full cursor-pointer transition-all"
                style={{ background: c, border: `2px solid ${form.cor === c ? "white" : "transparent"}` }}
              />
            ))}
          </div>

          {form.valorAnual && parseFloat(form.valorAnual) > 0 && (
            <div className="text-[12px] text-[var(--t3)] mb-2.5">
              Você vai separar <strong style={{ color: "#4A8BFF" }}>{fmt(parseFloat(form.valorAnual) / 12)}/mês</strong> para isso.
            </div>
          )}

          <button
            className="btn btn-primary w-full justify-center"
            onClick={handleAddProvisao}
            disabled={!form.nome || !form.valorAnual}
          >
            Criar provisão
          </button>
        </div>
      )}

      {/* All provisões grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {provisoes.map(p => {
          const mensal = p.valorAnual / 12;
          const pct = p.acumulado / p.valorAnual;
          const mesVenc = MESES[p.mes - 1] || "—";
          const isDone = pct >= 1;

          return (
            <div
              key={p.id}
              className="bg-[var(--card-obsidian)] border border-[var(--border)] rounded-[20px] p-4 flex flex-col gap-3 relative cursor-default hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex justify-between items-start">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[20px]"
                  style={{ background: `${p.cor}15`, border: `1px solid ${p.cor}30` }}
                >
                  {p.emoji}
                </div>
                <button
                  onClick={() => deleteGoal(p.id)}
                  className="p-1 rounded-lg bg-transparent border-none text-[var(--t4)] hover:text-[var(--red)] cursor-pointer transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div>
                <div className="font-extrabold text-[14px] text-[var(--t1)] tracking-tight">{p.nome}</div>
                <div className="text-[10px] text-[var(--t3)] font-semibold mt-0.5">
                  Vence em {mesVenc} · <span className="font-mono">{fmt(mensal)}/mês</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.min(100, pct * 100)}%`, background: isDone ? "var(--green)" : p.cor }}
                  />
                </div>

                {isDone ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--green)] font-extrabold">
                    <CheckCircle size={12} /> Meta Atingida
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {[mensal, p.valorAnual - p.acumulado]
                      .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                      .slice(0, 2)
                      .map((valor, idx) => (
                        <button
                          key={idx}
                          onClick={() => addAporte(p.id, valor)}
                          className="flex-1 py-1.5 rounded-lg text-[9px] font-black font-mono cursor-pointer transition-all hover:brightness-125"
                          style={{
                            border: `1px solid ${p.cor}30`,
                            background: `${p.cor}10`,
                            color: p.cor,
                          }}
                        >
                          +{idx === 1 ? "Meta" : fmt(valor)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {provisoes.length === 0 && !showForm && !showSugestoes && (
        <div className="card text-center p-8">
          <div className="text-[48px] mb-3">🏦</div>
          <div className="font-bold mb-1.5 text-[var(--t1)]">Chega de surpresas financeiras</div>
          <div className="text-[13px] text-[var(--t3)] mb-4 leading-relaxed">
            Adicione suas despesas anuais (IPTU, IPVA, férias, etc.) e comece a separar mensalmente.
          </div>
          <div className="flex gap-2">
            <button className="btn flex-1 justify-center" onClick={() => setShowSugestoes(true)}>Ver sugestões</button>
            <button className="btn btn-primary flex-1 justify-center" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Criar
            </button>
          </div>
        </div>
      )}

      {/* Footer tip */}
      {provisoes.length > 0 && (
        <div className="text-center py-4 text-[12px] text-[var(--t3)] leading-relaxed">
          Separe <strong className="text-[var(--t2)]">{fmt(totalMensal)}</strong> todo mês e nunca mais seja pego de surpresa. 🎯
        </div>
      )}
    </div>
  );
};
