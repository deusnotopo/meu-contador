import { useState } from "react";
import { ArrowLeft, Search, Upload, Trash2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt } from "lucide-react";
import type { TabType } from "@/types/navigation";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";

const PERIODS = ["Mar", "Fev", "Jan", "Dez", "Nov", "Out"];

// Map month abbreviations to month numbers (0-based)
const MONTH_MAP: Record<string, number> = { Mar: 2, Fev: 1, Jan: 0, Dez: 11, Nov: 10, Out: 9 };

interface TransactionsViewProps {
  onBack: (tab: TabType) => void;
}

export const TransactionsView = ({ onBack }: TransactionsViewProps) => {
  const { transactions, isLoading, refresh, deleteTransaction } = useTransactions();
  const [activePeriod, setActivePeriod] = useState("Mar");
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      showSuccess("Transação removida.");
    } catch {
      showError("Erro ao remover transação.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOfxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await api.post<{ importedCount: number }>("/banking/ofx", formData);
      showSuccess(`Sucesso! ${result.importedCount} transações importadas.`);
      await refresh();
    } catch (error) {
      showError("Erro ao importar arquivo OFX.");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // reset file input
    }
  };

  const now = new Date();
  const targetMonth = MONTH_MAP[activePeriod] ?? now.getMonth();
  const targetYear = now.getFullYear() - (targetMonth > now.getMonth() ? 1 : 0);

  const filtered = transactions
    .filter((t) => {
      const d = new Date(t.date);
      const matchesPeriod = d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      const matchesSearch = search === "" ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      return matchesPeriod && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by "date label"
  const today = new Date().toISOString().split("T")[0];
  const groups: Record<string, typeof filtered> = {};
  filtered.forEach((t) => {
    const dateStr = t.date;
    const label = dateStr === today ? "Hoje" : new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });

  const CATEGORY_ICONS: Record<string, string> = {
    moradia: "🏠", mercado: "🛒", delivery: "🍕", transporte: "🚗",
    saude: "💊", lazer: "🎬", roupas: "👕", outros: "📦",
    salario: "💰", investimentos: "📈", receita: "💰", income: "💰",
  };

  return (
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onBack("overview")}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px", flex: 1 }}>
          Transações
        </div>
        <input 
          type="file" 
          id="ofx-upload" 
          accept=".ofx" 
          style={{ display: "none" }} 
          onChange={handleOfxUpload} 
        />
        <button 
          className="back-btn" 
          onClick={() => document.getElementById("ofx-upload")?.click()}
          style={{ opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? "none" : "auto" }}
          title="Importar OFX"
        >
          <Upload size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={15} color="var(--t2)" />
        <input
          placeholder="Buscar transação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Period tabs */}
      <div className="period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p}
            className={`period-tab${activePeriod === p ? " active" : ""}`}
            onClick={() => setActivePeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 64 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma transação encontrada"
          description={search ? "Tente outro termo de busca." : `Sem transações em ${activePeriod}.`}
        />
      ) : (
        Object.entries(groups).map(([label, txns]) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "14px 0 8px", fontWeight: 600 }}>
              {label}
            </div>
            <div className="card">
              {txns.map((tx) => (
                <div key={tx.id} className="row" style={{ alignItems: "center" }}>
                  <div
                    className="row-ico"
                    style={{ background: tx.amount > 0 ? "var(--green-d)" : "var(--glass2)" }}
                  >
                    {CATEGORY_ICONS[tx.category] ?? "📦"}
                  </div>
                  <div className="row-main">
                    <div className="row-title">{tx.description}</div>
                    <div className="row-sub">{tx.category} · {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</div>
                  </div>
                  <div className={`row-amt ${tx.amount > 0 ? "amt-plus" : "amt-minus"}`} style={{ marginRight: 8 }}>
                    {tx.amount > 0 ? "+" : "−"}&nbsp;{formatCurrency(Math.abs(tx.amount))}
                  </div>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: "4px", opacity: deletingId === tx.id ? 0.4 : 0.6, flexShrink: 0 }}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
