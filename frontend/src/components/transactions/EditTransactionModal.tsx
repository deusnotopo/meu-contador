import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Transaction } from "@/types";

const CATEGORIES_INCOME = ["Salário", "Freelance", "Investimentos", "Presente", "Outros"];
const CATEGORIES_EXPENSE = [
  "Moradia", "Mercado", "Delivery", "Transporte", "Saúde",
  "Lazer", "Roupas", "Educação", "Assinaturas", "Outros",
];

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onClose: () => void;
}

export const EditTransactionModal = ({ transaction, onSave, onClose }: EditTransactionModalProps) => {
  const [form, setForm] = useState({
    description: transaction.description,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: transaction.date.split("T")[0] ?? transaction.date.slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    try {
      await onSave(transaction.id, {
        description: form.description.trim(),
        amount: parseFloat(form.amount.replace(",", ".")),
        type: form.type as "income" | "expense",
        category: form.category,
        date: form.date,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "11px 14px",
    fontSize: "14px",
    color: "var(--t1)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.18s",
  };

  const label: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--t3)",
    marginBottom: "6px",
    fontWeight: 600,
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(165deg, #141820 0%, #0e1117 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px 24px 0 0",
          padding: "28px 24px calc(env(safe-area-inset-bottom) + 28px)",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
          animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Editar
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
              Transação
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--t2)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Type Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
          {(["income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setForm({ ...form, type: t, category: t === "income" ? CATEGORIES_INCOME[0]! : CATEGORIES_EXPENSE[0]! })}
              style={{
                flex: 1, padding: "8px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: form.type === t ? (t === "income" ? "var(--green)" : "var(--red)") : "transparent",
                color: form.type === t ? "#000" : "var(--t3)",
                transition: "all 0.18s",
              }}
            >
              {t === "income" ? "Receita" : "Despesa"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Description */}
          <div>
            <label style={label}>Descrição</label>
            <input
              style={inp}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Supermercado"
            />
          </div>

          {/* Amount + Date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Valor (R$)</label>
              <input
                style={inp}
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label style={label}>Data</label>
              <input
                style={inp}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={label}>Categoria</label>
            <select
              style={{ ...inp, appearance: "none" }}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !form.description.trim() || !form.amount}
          style={{
            marginTop: 24, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #4A8BFF, #5032A8)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            opacity: (saving || !form.description.trim() || !form.amount) ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.18s",
          }}
        >
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
