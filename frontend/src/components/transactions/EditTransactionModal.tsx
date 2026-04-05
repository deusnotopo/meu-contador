import { useState, useRef } from "react";
import { X, Save, Paperclip, Loader2, Trash2, ExternalLink } from "lucide-react";
import type { Transaction } from "@/types";
import { uploadReceipt, deleteReceipt } from "@/lib/firebase-storage";
import { showSuccess, showError } from "@/lib/toast";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    description: transaction.description,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: transaction.date.split("T")[0] ?? transaction.date.slice(0, 10),
    receiptUrl: transaction.receiptUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadReceipt(transaction.id, file);
      setForm(prev => ({ ...prev, receiptUrl: url }));
      showSuccess("Comprovante anexado!");
    } catch (_err) {
      showError("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReceipt = async () => {
    if (!form.receiptUrl) return;
    if (window.confirm("Deseja remover o comprovante anexo?")) {
      try {
        await deleteReceipt(form.receiptUrl);
        setForm(prev => ({ ...prev, receiptUrl: "" }));
        showSuccess("Comprovante removido.");
      } catch (_err) {
        showError("Erro ao remover arquivo.");
      }
    }
  };

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
        receiptUrl: form.receiptUrl,
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

          {/* Receipt Upload Section */}
          <div style={{ 
            background: "rgba(255,255,255,0.02)", 
            border: "1px dashed rgba(255,255,255,0.1)", 
            borderRadius: 16, 
            padding: 16,
            marginTop: 4
          }}>
            <label style={label}>Comprovante (Opcional)</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={handleFileUpload} 
              accept="image/*,application/pdf"
            />
            
            {form.receiptUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", padding: 8, borderRadius: 12 }}>
                <div style={{ background: "var(--blue-d)", color: "var(--blue)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Paperclip size={16} />
                </div>
                <span style={{ fontSize: 13, color: "var(--t2)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Arquivo anexado
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--t2)", padding: 6 }}>
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={handleRemoveReceipt} style={{ color: "var(--red)", background: "transparent", border: "none", padding: 6, cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ 
                  width: "100%", padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", 
                  background: "transparent", color: "var(--t2)", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s"
                }}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                {uploading ? "Fazendo upload..." : "Anexar comprovante"}
              </button>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || uploading || !form.description.trim() || !form.amount}
          style={{
            marginTop: 24, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #4A8BFF, #5032A8)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: (saving || uploading) ? "not-allowed" : "pointer",
            opacity: (saving || uploading || !form.description.trim() || !form.amount) ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.18s",
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
