import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Investment } from "@/types";

const ASSET_TYPES = [
  { value: "stock",        label: "Ação (BR)" },
  { value: "fii",         label: "FII" },
  { value: "fixed_income",label: "Renda Fixa" },
  { value: "etf",         label: "ETF Global" },
  { value: "crypto",      label: "Cripto" },
] as const;

interface EditInvestmentModalProps {
  asset: Investment;
  onSave: (id: string, updates: Partial<Investment>) => Promise<void>;
  onClose: () => void;
}

// Shared class strings
const inpClass = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-[11px] text-[14px] text-[var(--t1)] outline-none box-border transition-[border-color] duration-[180ms]";
const labelClass = "block text-[10px] uppercase tracking-[0.08em] text-[var(--t3)] mb-1.5 font-semibold";

const typeIcon: Record<string, string> = {
  stock: "📊", fii: "🏢", fixed_income: "🏦", etf: "🌍", crypto: "₿",
};

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

  const isDisabled = saving || !form.ticker.trim() || !form.amount || !form.averagePrice;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/75 flex items-end justify-center"
      style={{ backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-[24px_24px_0_0] overflow-y-auto max-h-[90vh] animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          background: "linear-gradient(165deg, #141820 0%, #0e1117 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 24px calc(env(safe-area-inset-bottom) + 28px)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[11px] text-[var(--t3)] uppercase tracking-[0.1em]">Editar Ativo</div>
            <div className="text-[20px] font-bold text-[var(--t1)] tracking-[-0.5px] flex items-center gap-2">
              {typeIcon[asset.type]} {asset.ticker}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-[var(--t2)] bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Ticker + Name */}
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div>
              <label className={labelClass}>Ticker</label>
              <input
                className={`${inpClass} font-mono uppercase`}
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                placeholder="PETR4"
              />
            </div>
            <div>
              <label className={labelClass}>Nome</label>
              <input
                className={inpClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Petrobras"
              />
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className={labelClass}>Tipo de ativo</label>
            <div className="flex gap-2 flex-wrap">
              {ASSET_TYPES.map((t) => {
                const active = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className="px-3 py-[7px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all duration-[180ms]"
                    style={{
                      border: `1px solid ${active ? "var(--blue)" : "rgba(255,255,255,0.1)"}`,
                      background: active ? "rgba(74,139,255,0.15)" : "transparent",
                      color: active ? "var(--blue)" : "var(--t3)",
                    }}
                  >
                    {typeIcon[t.value]} {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qty + Avg Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Quantidade</label>
              <input className={inpClass} type="number" min="0" step="0.001"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Preço médio (R$)</label>
              <input className={inpClass} type="number" min="0" step="0.01"
                value={form.averagePrice} onChange={(e) => setForm({ ...form, averagePrice: e.target.value })} />
            </div>
          </div>

          {/* Current Price */}
          <div>
            <label className={labelClass}>Preço atual (R$)</label>
            <input className={inpClass} type="number" min="0" step="0.01"
              value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} />
          </div>

          {/* Live preview */}
          {form.amount && form.averagePrice && (
            <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-xl px-3.5 py-3">
              <div className="text-[11px] text-[var(--t3)] mb-1">Prévia do valor em carteira</div>
              <div className="text-[18px] font-bold text-[var(--blue)] font-mono">
                R$ {(parseFloat(form.amount || "0") * parseFloat(form.currentPrice || form.averagePrice || "0"))
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isDisabled}
          className="mt-6 w-full py-3.5 rounded-[14px] border-none text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-[180ms] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #4A8BFF, #5032A8)" }}
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
