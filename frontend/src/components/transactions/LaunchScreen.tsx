import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import type { TabType } from "@/types/navigation";

const CATEGORIES = [
  { id: "moradia", ico: "🏠", nm: "Moradia" },
  { id: "mercado", ico: "🛒", nm: "Mercado" },
  { id: "delivery", ico: "🍕", nm: "Delivery" },
  { id: "transporte", ico: "🚗", nm: "Transp." },
  { id: "saude", ico: "💊", nm: "Saúde" },
  { id: "lazer", ico: "🎬", nm: "Lazer" },
  { id: "roupas", ico: "👕", nm: "Roupas" },
  { id: "outros", ico: "📦", nm: "Outros" },
  { id: "salario", ico: "💰", nm: "Salário" },
  { id: "investimentos", ico: "📈", nm: "Investir" },
];

interface LaunchScreenProps {
  onBack?: (tab?: TabType) => void;
}

export const LaunchScreen = ({ onBack }: LaunchScreenProps) => {
  const { addTransaction } = useTransactions();
  const [tipo, setTipo] = useState<"expense" | "income" | "transfer">("expense");
  const [amtStr, setAmtStr] = useState("0");
  const [catId, setCatId] = useState("mercado");
  const [description, setDescription] = useState("");

  const fmtAmt = (v: string) => {
    const num = parseInt(v.replace(/\D/g, ""), 10) || 0;
    return `R$ ${(num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

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
    const cents = parseInt(amtStr, 10) || 0;
    if (cents === 0) return;
    const amount = cents / 100;
    const cat = CATEGORIES.find((c) => c.id === catId);
    await addTransaction({
      amount: (tipo === "expense" ? -amount : amount).toString(),
      description: description || (cat?.nm ?? catId),
      category: catId,
      type: tipo === "expense" ? "expense" : "income",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "pix",
      notes: "",
      recurring: false,
      scope: "personal",
    });
    onBack("inicio");
  };

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

      {/* Segmented control */}
      <div className="seg-ctrl">
        {(["expense", "income", "transfer"] as const).map((t) => (
          <div
            key={t}
            className={`seg-opt${tipo === t ? " active" : ""}`}
            onClick={() => setTipo(t)}
          >
            {t === "expense" ? "💸 Gasto" : t === "income" ? "💰 Receita" : "🔀 Transferência"}
          </div>
        ))}
      </div>

      {/* Amount display */}
      <div className="launch-amount">
        <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>Valor</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: "var(--t1)", letterSpacing: "-2px", fontFamily: "var(--mono)", minHeight: 52 }}>
          {fmtAmt(amtStr)}
        </div>
      </div>

      {/* Category scroll */}
      <div className="launch-cats">
        {CATEGORIES.map((c) => (
          <div
            key={c.id}
            className={`lcat${catId === c.id ? " active" : ""}`}
            onClick={() => setCatId(c.id)}
          >
            <span className="lcat-ico">{c.ico}</span>
            <span className="lcat-nm">{c.nm}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ margin: "10px 0 8px" }}>
        <input
          className="input-field"
          type="text"
          placeholder="Descrição (ex: iFood — Pizza)"
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
        style={{
          background: "linear-gradient(135deg,#2F62D9,#5048E8)",
          border: "none",
          borderRadius: 14,
          padding: 14,
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          cursor: "pointer",
          fontFamily: "var(--font)",
          width: "100%",
          boxShadow: "0 4px 16px rgba(80,72,232,0.35)",
          marginTop: 12,
          transition: "all 0.15s",
        }}
      >
        Confirmar lançamento ✓
      </button>
    </div>
  );
};
