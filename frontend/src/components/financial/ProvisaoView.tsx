/**
 * ProvisaoView.tsx — "Cofrinhos" / Provisões Mensais
 *
 * A principal causa de "surpresas financeiras" do brasileiro:
 * IPTU, IPVA, seguro, matrícula, 13º etc. chegam de uma vez todo ano.
 * Solução: dividir em 12 e separar mensalmente (Sinking Funds).
 *
 * Armazenado em localStorage (simples, funciona offline, zero backend).
 */

import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";

interface Provisao {
  id: string;
  nome: string;
  valorAnual: number;
  mes: number; // mês de vencimento (1-12)
  emoji: string;
  cor: string;
  acumulado: number; // quanto já foi separado
}

const EMOJIS = ["🏠", "🚗", "📚", "🏥", "🎓", "✈️", "🎁", "🛡️", "💰", "🔧"];
const CORES = [
  "#4A8BFF", "#00D991", "#FF4F6E", "#FFB84A", "#9B7FFF",
  "#00C4B4", "#FF6B35", "#A8E063", "#FF90A3", "#64B5F6",
];

const SUGESTOES_BR: Omit<Provisao, "id" | "acumulado">[] = [
  { nome: "IPTU", valorAnual: 1800, mes: 2, emoji: "🏠", cor: "#4A8BFF" },
  { nome: "IPVA", valorAnual: 1500, mes: 1, emoji: "🚗", cor: "#FFB84A" },
  { nome: "Seguro do carro", valorAnual: 2400, mes: 6, emoji: "🛡️", cor: "#9B7FFF" },
  { nome: "Matrícula escolar", valorAnual: 1200, mes: 1, emoji: "🎓", cor: "#00D991" },
  { nome: "Férias", valorAnual: 5000, mes: 7, emoji: "✈️", cor: "#FF6B35" },
  { nome: "13º salário (reserva)", valorAnual: 3000, mes: 12, emoji: "💰", cor: "#A8E063" },
  { nome: "Revisão do carro", valorAnual: 1200, mes: 6, emoji: "🔧", cor: "#64B5F6" },
];

const STORAGE_KEY = "meu_contador_provisoes";
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fmt = (n: number) =>
  "R$\u00a0" + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Props {
  onBack?: () => void;
}

export const ProvisaoView: React.FC<Props> = ({ onBack }) => {
  const [provisoes, setProvisoes] = useState<Provisao[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSugestoes, setShowSugestoes] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    valorAnual: "",
    mes: new Date().getMonth() + 1,
    emoji: "💰",
    cor: "#4A8BFF",
  });

  // Carregar do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProvisoes(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (list: Provisao[]) => {
    setProvisoes(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addProvisao = () => {
    if (!form.nome || !form.valorAnual) return;
    const nova: Provisao = {
      id: Date.now().toString(),
      nome: form.nome,
      valorAnual: parseFloat(form.valorAnual),
      mes: form.mes,
      emoji: form.emoji,
      cor: form.cor,
      acumulado: 0,
    };
    save([...provisoes, nova]);
    setForm({ nome: "", valorAnual: "", mes: new Date().getMonth() + 1, emoji: "💰", cor: "#4A8BFF" });
    setShowForm(false);
  };

  const addSugestao = (s: Omit<Provisao, "id" | "acumulado">) => {
    const nova: Provisao = { ...s, id: Date.now().toString(), acumulado: 0 };
    save([...provisoes, nova]);
  };

  const addAporte = (id: string, valor: number) => {
    save(provisoes.map((p) => p.id === id ? { ...p, acumulado: Math.min(p.valorAnual, p.acumulado + valor) } : p));
  };

  const remove = (id: string) => {
    save(provisoes.filter((p) => p.id !== id));
  };

  const mesAtual = new Date().getMonth() + 1;
  const totalMensal = provisoes.reduce((sum, p) => sum + p.valorAnual / 12, 0);
  const totalAcumulado = provisoes.reduce((sum, p) => sum + p.acumulado, 0);
  const totalMeta = provisoes.reduce((sum, p) => sum + p.valorAnual, 0);

  // Próximas por vencer (3 meses)
  const proximasStr = provisoes
    .filter((p) => {
      const diff = ((p.mes - mesAtual + 12) % 12) || 12;
      return diff <= 3;
    })
    .sort((a, b) => ((a.mes - mesAtual + 12) % 12) - ((b.mes - mesAtual + 12) % 12));

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
          <div className="eyebrow">Planejamento</div>
          <div className="page-title" style={{ margin: 0, fontSize: "22px" }}>
            💰 Provisões Mensais
          </div>
        </div>
      </div>

      {/* Tip explicativo */}
      <div
        className="nudge"
        style={{ marginBottom: "16px", borderLeftColor: "#4A8BFF", borderColor: "rgba(74,139,255,0.2)", background: "rgba(74,139,255,0.05)" }}
      >
        <div className="nudge-ttl" style={{ color: "#4A8BFF" }}>💡 Como funciona</div>
        <div className="nudge-body">
          Divide despesas anuais (IPTU, IPVA, férias, seguro) em 12 parcelas mensais e separa o valor todo mês.
          Assim você sempre tem o dinheiro na hora certa. <strong>Zero surpresas.</strong>
        </div>
      </div>

      {/* Resumo */}
      {provisoes.length > 0 && (
        <div className="stat3" style={{ marginBottom: "16px" }}>
          <div className="s3i">
            <div className="s3l">Separar/mês</div>
            <div className="s3v" style={{ color: "#4A8BFF" }}>{fmt(totalMensal)}</div>
          </div>
          <div className="s3i">
            <div className="s3l">Acumulado</div>
            <div className="s3v" style={{ color: "var(--green)" }}>{fmt(totalAcumulado)}</div>
          </div>
          <div className="s3i">
            <div className="s3l">Meta total</div>
            <div className="s3v">{fmt(totalMeta)}</div>
          </div>
        </div>
      )}

      {/* Próximas por vencer */}
      {proximasStr.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div className="sec-hd" style={{ marginTop: 0 }}>
            <span className="sec-title">⚡ Vencendo em breve</span>
          </div>
          {proximasStr.map((p) => {
            const diff = ((p.mes - mesAtual + 12) % 12) || 12;
            const pct = p.acumulado / p.valorAnual;
            const falta = p.valorAnual - p.acumulado;
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  border: `1px solid ${diff === 1 ? "rgba(255,79,110,0.3)" : "rgba(255,173,59,0.2)"}`,
                  background: diff === 1 ? "rgba(255,79,110,0.05)" : "rgba(255,173,59,0.04)",
                  marginBottom: "8px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)" }}>{p.nome}</div>
                      <div style={{ fontSize: "11px", color: diff === 1 ? "var(--red)" : "var(--amber)" }}>
                        {diff === 1 ? "Vence mês que vem!" : `Vence em ${diff} meses`}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--mono)" }}>{fmt(falta)}</div>
                    <div style={{ fontSize: "10px", color: "var(--t3)" }}>faltando</div>
                  </div>
                </div>
                <div className="prog">
                  <div className="prog-fill" style={{ width: `${pct * 100}%`, background: pct >= 1 ? "var(--green)" : p.cor }} />
                </div>
                <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "4px", fontFamily: "var(--mono)" }}>
                  {fmt(p.acumulado)} de {fmt(p.valorAnual)} separado
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de provisões */}
      <div className="sec-hd" style={{ marginTop: provisoes.length > 0 ? "20px" : 0 }}>
        <span className="sec-title">Todas as provisões</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowSugestoes(!showSugestoes)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--glass)",
              color: "var(--t2)",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Sugestões
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(74,139,255,0.3)",
              background: "rgba(74,139,255,0.1)",
              color: "#4A8BFF",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Plus size={12} /> Nova
          </button>
        </div>
      </div>

      {/* Sugestões pré-definidas */}
      {showSugestoes && (
        <div className="card" style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "10px", fontWeight: 600 }}>
            Toque para adicionar:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SUGESTOES_BR.filter((s) => !provisoes.find((p) => p.nome === s.nome)).map((s) => (
              <button
                key={s.nome}
                onClick={() => { addSugestao(s); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: `1px solid ${s.cor}40`,
                  background: `${s.cor}15`,
                  color: "var(--t1)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {s.emoji} {s.nome}
                <span style={{ color: "var(--t3)", fontSize: "10px", fontFamily: "var(--mono)" }}>
                  {fmt(s.valorAnual / 12)}/mês
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <div className="card" style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Nova provisão</div>

          {/* Emoji picker */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px", border: `2px solid ${form.emoji === e ? "#4A8BFF" : "transparent"}`,
                  background: form.emoji === e ? "rgba(74,139,255,0.15)" : "rgba(255,255,255,0.04)",
                  fontSize: "16px", cursor: "pointer",
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
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            style={{ marginBottom: "8px" }}
          />
          <input
            type="number"
            placeholder="Valor anual (ex: 2400)"
            value={form.valorAnual}
            onChange={(e) => setForm((f) => ({ ...f, valorAnual: e.target.value }))}
            style={{ marginBottom: "8px" }}
          />

          <select
            value={form.mes}
            onChange={(e) => setForm((f) => ({ ...f, mes: parseInt(e.target.value) }))}
            style={{ marginBottom: "12px" }}
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          {/* Cor seletor */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {CORES.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, cor: c }))}
                style={{
                  width: "24px", height: "24px", borderRadius: "50%", background: c,
                  border: `2px solid ${form.cor === c ? "white" : "transparent"}`,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          {form.valorAnual && parseFloat(form.valorAnual) > 0 && (
            <div style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "10px" }}>
              Você vai separar <strong style={{ color: "#4A8BFF" }}>{fmt(parseFloat(form.valorAnual) / 12)}/mês</strong> para isso.
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={addProvisao}
            disabled={!form.nome || !form.valorAnual}
          >
            Criar provisão
          </button>
        </div>
      )}

      {/* Cards de provisão */}
      {provisoes.map((p) => {
        const mensal = p.valorAnual / 12;
        const pct = p.acumulado / p.valorAnual;
        const mesVenc = MESES[p.mes - 1] || "—";

        return (
          <div key={p.id} className="card" style={{ marginBottom: "10px" }}>
            {/* Header do card */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                <div
                  style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: `${p.cor}15`, border: `1px solid ${p.cor}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0,
                  }}
                >
                  {p.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--t1)" }}>{p.nome}</div>
                  <div style={{ fontSize: "11px", color: "var(--t3)" }}>
                    Vence em {mesVenc} · <span style={{ fontFamily: "var(--mono)" }}>{fmt(mensal)}/mês</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {pct >= 1 && <CheckCircle size={14} color="var(--green)" />}
                <button
                  onClick={() => remove(p.id)}
                  style={{ background: "none", border: "none", color: "var(--t4)", cursor: "pointer", padding: "4px" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="prog" style={{ marginBottom: "6px" }}>
              <div
                className="prog-fill"
                style={{ width: `${Math.min(100, pct * 100)}%`, background: pct >= 1 ? "var(--green)" : p.cor, transition: "width 0.6s ease" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)", marginBottom: "10px" }}>
              <span>{fmt(p.acumulado)} acumulado</span>
              <span>Meta: {fmt(p.valorAnual)}</span>
            </div>

            {/* Botão de aportar */}
            {pct < 1 && (
              <div style={{ display: "flex", gap: "6px" }}>
                {[mensal, mensal * 2, p.valorAnual - p.acumulado].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).slice(0, 3).map((valor) => (
                  <button
                    key={valor}
                    onClick={() => addAporte(p.id, valor)}
                    style={{
                      flex: 1, padding: "6px 4px", borderRadius: "8px",
                      border: `1px solid ${p.cor}30`, background: `${p.cor}10`,
                      color: p.cor, fontSize: "11px", fontWeight: 700, cursor: "pointer",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    +{fmt(valor)}
                  </button>
                ))}
              </div>
            )}

            {pct >= 1 && (
              <div style={{ fontSize: "12px", color: "var(--green)", fontWeight: 600, textAlign: "center", padding: "4px 0" }}>
                ✅ Meta atingida!
              </div>
            )}
          </div>
        );
      })}

      {provisoes.length === 0 && !showForm && !showSugestoes && (
        <div className="card" style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏦</div>
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--t1)" }}>
            Chega de surpresas financeiras
          </div>
          <div style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "16px", lineHeight: 1.5 }}>
            Adicione suas despesas anuais (IPTU, IPVA, férias, etc.) e comece a separar mensalmente.
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setShowSugestoes(true)}
            >
              Ver sugestões
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Criar
            </button>
          </div>
        </div>
      )}

      {/* Dica final */}
      {provisoes.length > 0 && (
        <div style={{ textAlign: "center", padding: "16px 0", fontSize: "12px", color: "var(--t3)", lineHeight: 1.5 }}>
          Separe <strong style={{ color: "var(--t2)" }}>{fmt(totalMensal)}</strong> todo mês e nunca mais seja pego de surpresa. 🎯
        </div>
      )}
    </div>
  );
};
