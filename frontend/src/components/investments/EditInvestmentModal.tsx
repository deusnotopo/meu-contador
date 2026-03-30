import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Investment } from "@/types";

const ASSET_TYPES = [
  { value: "stock", label: "Ação (BR)" },
  { value: "fii", label: "FII" },
  { value: "fixed_income", label: "Renda Fixa" },
  { value: "etf", label: "ETF Global" },
  { value: "crypto", label: "Cripto" },
] as const;

interface EditInvestmentModalProps {
  asset: Investment;
  onSave: (id: string, updates: Partial<Investment>) => Promise<void>;
  onClose: () => void;
}

export const EditInvestmentModal = ({ asset, onSave, onClose }: EditInvestmentModalProps) => {
  const [form, setForm] = useState({
    name: asset.name,
    ticker: asset.ticker,
    type: asset.type,
    amount: String(asset.amount),
    averagePrice: String(asset.averagePrice),
    currentPrice: String(asset.currentPrice),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.ticker.trim() || !form.amount || !form.averagePrice) return;
    setSaving(true);
    try {
      await onSave(asset.id, {
        name: form.name.trim(),
        ticker: form.ticker.trim().toUpperCase(),
        type: form.type,
        amount: parseFloat(form.amount.replace(",", ".")),
        averagePrice: parseFloat(form.averagePrice.replace(",", ".")),
        currentPrice: parseFloat(form.currentPrice.replace(",", ".")),
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

  const typeIcon: Record<string, string> = {
    stock: "📊", fii: "🏢", fixed_income: "🏦", etf: "🌍", crypto: "₿",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
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
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Editar Ativo
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              {typeIcon[asset.type]} {asset.ticker}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--t2)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Ticker + Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              <label style={label}>Ticker</label>
              <input
                style={{ ...inp, fontFamily: "var(--mono)", textTransform: "uppercase" }}
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                placeholder="PETR4"
              />
            </div>
            <div>
              <label style={label}>Nome</label>
              <input
                style={inp}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Petrobras"
              />
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label style={label}>Tipo de ativo</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ASSET_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, type: t.value })}
                  style={{
                    padding: "7px 12px", borderRadius: 20, border: "1px solid",
                    borderColor: form.type === t.value ? "var(--blue)" : "rgba(255,255,255,0.1)",
                    background: form.type === t.value ? "rgba(74,139,255,0.15)" : "transparent",
                    color: form.type === t.value ? "var(--blue)" : "var(--t3)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                  }}
                >
                  {typeIcon[t.value]} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Avg Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Quantidade</label>
              <input
                style={inp}
                type="number"
                min="0"
                step="0.001"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label style={label}>Preço médio (R$)</label>
              <input
                style={inp}
                type="number"
                min="0"
                step="0.01"
                value={form.averagePrice}
                onChange={(e) => setForm({ ...form, averagePrice: e.target.value })}
              />
            </div>
          </div>

          {/* Current Price */}
          <div>
            <label style={label}>Preço atual (R$)</label>
            <input
              style={inp}
              type="number"
              min="0"
              step="0.01"
              value={form.currentPrice}
              onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
            />
          </div>

          {/* Live preview */}
          {form.amount && form.averagePrice && (
            <div style={{ background: "rgba(74,139,255,0.06)", border: "1px solid rgba(74,139,255,0.15)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 4 }}>Prévia do valor em carteira</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)", fontFamily: "var(--mono)" }}>
                R$ {(parseFloat(form.amount || "0") * parseFloat(form.currentPrice || form.averagePrice || "0")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !form.ticker.trim() || !form.amount || !form.averagePrice}
          style={{
            marginTop: 24, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #4A8BFF, #5032A8)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            opacity: (saving || !form.ticker.trim() || !form.amount || !form.averagePrice) ? 0.6 : 1,
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
