import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import type { TabType } from "@/types/navigation";

// ── Expense categories ──────────────────────────────────
const EXPENSE_CATS = [
  { id: "Moradia",       ico: "🏠", nm: "Moradia" },
  { id: "Mercado",       ico: "🛒", nm: "Mercado" },
  { id: "Delivery",      ico: "🍕", nm: "Delivery" },
  { id: "Transporte",    ico: "🚗", nm: "Transp." },
  { id: "Saúde",         ico: "💊", nm: "Saúde" },
  { id: "Lazer",         ico: "🎬", nm: "Lazer" },
  { id: "Roupas",        ico: "👕", nm: "Roupas" },
  { id: "Educação",      ico: "📚", nm: "Educação" },
  { id: "Assinaturas",   ico: "📱", nm: "Assina." },
  { id: "Outros",        ico: "📦", nm: "Outros" },
];

// ── Income categories ───────────────────────────────────
const INCOME_CATS = [
  { id: "Salário",       ico: "💼", nm: "Salário" },
  { id: "Freelance",     ico: "💻", nm: "Freelance" },
  { id: "Aluguel",       ico: "🏘️",  nm: "Aluguel" },
  { id: "Investimentos", ico: "📈", nm: "Investim." },
  { id: "Dividendos",    ico: "💰", nm: "Dividendos" },
  { id: "Bônus",         ico: "🎁", nm: "Bônus" },
  { id: "Reembolso",     ico: "🔄", nm: "Reembolso" },
  { id: "Outros",        ico: "✨", nm: "Outros" },
];

interface LaunchScreenProps {
  onBack?: (tab?: TabType) => void;
}

export const LaunchScreen = ({ onBack }: LaunchScreenProps) => {
  const { addTransaction } = useTransactions();
  const [tipo, setTipo] = useState<"expense" | "income">("expense");
  const [amtStr, setAmtStr] = useState("0");
  const [catId, setCatId] = useState("Mercado");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = tipo === "expense" ? EXPENSE_CATS : INCOME_CATS;

  // Reset category when type changes
  const handleTipoChange = (t: "expense" | "income") => {
    setTipo(t);
    setCatId(t === "expense" ? "Mercado" : "Salário");
  };

  const fmtAmt = (v: string) => {
    const num = parseInt(v.replace(/\D/g, ""), 10) || 0;
    return `R$ ${(num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const amountRaw = parseInt(amtStr, 10) / 100;
  const isZero = amountRaw === 0;

  const handleKey = (k: string) => {
    if (k === "⌫") {
      setAmtStr((p) => (p.length <= 1 ? "0" : p.slice(0, -1)));
    } else if (k === ",") {
      // decimals handled via cents
    } else {
      setAmtStr((p) => (p === "0" ? k : p + k));
    }
  };

  const handleConfirm = async () => {
    if (isZero || loading) return;
    setLoading(true);
    try {
      const cat = categories.find((c) => c.id === catId);
      await addTransaction({
        amount: amountRaw.toString(),
        description: description || (cat?.nm ?? catId),
        category: catId,
        type: tipo,
        date: new Date().toISOString().split("T")[0] ?? new Date().toISOString().substring(0, 10),
        paymentMethod: "pix",
        notes: "",
        recurring: false,
        scope: "personal",
      });
      onBack?.("inicio");
    } finally {
      setLoading(false);
    }
  };

  const isExpense = tipo === "expense";
  const accentColor = isExpense ? "#F05A7E" : "#00D991";
  const gradientBtn = isExpense
    ? "linear-gradient(135deg, #d9294e, #F05A7E)"
    : "linear-gradient(135deg, #00b377, #00D991)";

  return (
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onBack?.()}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
          Novo lançamento
        </div>
      </div>

      {/* Segmented control — Gasto / Receita */}
      <div className="seg-ctrl" style={{ marginBottom: 16 }}>
        {(["expense", "income"] as const).map((t) => (
          <div
            key={t}
            className={`seg-opt${tipo === t ? " active" : ""}`}
            onClick={() => handleTipoChange(t)}
            style={tipo === t ? {
              color: t === "expense" ? "#F05A7E" : "#00D991",
              borderBottom: `2px solid ${t === "expense" ? "#F05A7E" : "#00D991"}`,
            } : {}}
          >
            {t === "expense" ? "💸 Gasto" : "💰 Receita"}
          </div>
        ))}
      </div>

      {/* Amount display */}
      <div className="launch-amount" style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>
          {isExpense ? "Valor do gasto" : "Valor recebido"}
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: isZero ? "var(--t3)" : "var(--t1)",
            letterSpacing: "-2px",
            fontFamily: "var(--mono)",
            minHeight: 48,
            transition: "color 0.2s",
          }}
        >
          {fmtAmt(amtStr)}
        </div>
      </div>

      {/* Category scroll — dinâmico por tipo */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 8 }}>
          {isExpense ? "Categoria do gasto" : "Origem da receita"}
        </div>
        <div className="launch-cats">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`lcat${catId === c.id ? " active" : ""}`}
              onClick={() => setCatId(c.id)}
              style={catId === c.id ? { borderColor: accentColor, color: accentColor } : {}}
            >
              <span className="lcat-ico">{c.ico}</span>
              <span className="lcat-nm">{c.nm}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ margin: "10px 0 8px" }}>
        <input
          className="input-field"
          type="text"
          placeholder={
            isExpense
              ? "Descrição (ex: iFood — Pizza)"
              : "Descrição (ex: Salário — Março)"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Keypad */}
      <div className="keypad">
        {["1","2","3","4","5","6","7","8","9",",","0","⌫"].map((k) => (
          <div
            key={k}
            className={`key${k === "⌫" ? " del" : k === "," ? " action" : ""}`}
            onClick={() => handleKey(k)}
          >
            {k}
          </div>
        ))}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={isZero || loading}
        style={{
          background: isZero ? "var(--glass2)" : gradientBtn,
          border: "none",
          borderRadius: 14,
          padding: 14,
          fontSize: 14,
          fontWeight: 600,
          color: isZero ? "var(--t3)" : "#fff",
          cursor: isZero ? "not-allowed" : "pointer",
          fontFamily: "var(--font)",
          width: "100%",
          boxShadow: isZero ? "none" : `0 4px 16px ${accentColor}55`,
          marginTop: 12,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <span style={{ opacity: 0.7 }}>Salvando...</span>
        ) : isExpense ? (
          "Confirmar gasto ✓"
        ) : (
          "Confirmar receita ✓"
        )}
      </button>
    </div>
  );
};
