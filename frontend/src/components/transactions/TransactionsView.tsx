import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import { ArrowLeft, Search, Upload, Trash2, Pencil, Home, ShoppingCart, Utensils, Car, Pill, Film, Shirt, Package, DollarSign, TrendingUp, Receipt, Paperclip, FileText } from "lucide-react";
import { StatementImportModal } from "@/components/statements/StatementImportModal";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
// import { EmptyState } from "@/components/ui/EmptyState";
import type { TabType } from "@/types/navigation";
import type { Transaction } from "@/types";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import { WizardTrigger } from "@/components/onboarding/WizardTrigger";
import { EditTransactionModal } from "./EditTransactionModal";

const PERIODS = ["Mar", "Fev", "Jan", "Dez", "Nov", "Out"];

// Map month abbreviations to month numbers (0-based)
const MONTH_MAP: Record<string, number> = { Mar: 2, Fev: 1, Jan: 0, Dez: 11, Nov: 10, Out: 9 };

interface TransactionsViewProps {
  onBack: (tab: TabType) => void;
}

export const TransactionsView = ({ onBack }: TransactionsViewProps) => {
  const { transactions, isLoading, refresh, deleteTransaction, updateTransaction } = useTransactions();
  const [activePeriod, setActivePeriod] = useState("Mar");
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showStatementImport, setShowStatementImport] = useState(false);

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
    } catch (_error) {
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

  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    moradia: <Home size={16} />, mercado: <ShoppingCart size={16} />, delivery: <Utensils size={16} />, transporte: <Car size={16} />,
    saude: <Pill size={16} />, lazer: <Film size={16} />, roupas: <Shirt size={16} />, outros: <Package size={16} />,
    salario: <DollarSign size={16} />, investimentos: <TrendingUp size={16} />, receita: <DollarSign size={16} />, income: <DollarSign size={16} />,
  };

  return (
    <div style={{ animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      {/* Header Flutuante Zen */}
      <div className="flex items-center gap-3 mb-4 sticky top-2 z-[60] bg-[#0A1220]/80 backdrop-blur-2xl px-3 py-2.5 rounded-[22px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-1">
        <Button variant="ghost" size="icon" onClick={() => onBack("inicio")} className="rounded-xl w-10 h-10 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95">
          <ArrowLeft size={16} />
        </Button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-0.5">Extrato Geral</div>
            <div className="text-lg font-bold text-white tracking-tight leading-none">Transações</div>
          </div>
          <WizardTrigger label="Guia" />
          <HelpButton tooltipText="Consulte, edite, exclua e importe transações do período selecionado." />
        </div>
        <input 
          type="file" 
          id="ofx-upload" 
          accept=".ofx" 
          style={{ display: "none" }} 
          onChange={handleOfxUpload} 
        />
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => document.getElementById("ofx-upload")?.click()}
          className="rounded-xl hover:bg-white/10"
          style={{ opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? "none" : "auto", color: 'var(--blue)' }}
          title="Importar OFX"
        >
          <Upload size={16} />
        </Button>
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => setShowStatementImport(true)}
          className="rounded-xl hover:bg-white/10"
          title="Importar Extrato (CSV/OFX/PDF)"
          style={{ color: 'var(--blue)' }}
        >
          <FileText size={16} />
        </Button>
      </div>

      <div className="px-2">
        {/* Filtros e Busca (Pill container) */}
        <div className="bento-card bento-full !p-2 mb-6 shadow-sm border border-white/[0.05]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 mb-2 border border-white/[0.05]">
            <Search size={15} className="text-white/40" />
            <input
              placeholder="Buscar transação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-[13px] w-full placeholder:text-white/30"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-4 py-1.5 rounded-[10px] text-[12px] font-bold whitespace-nowrap transition-all ${
                  activePeriod === p 
                    ? "bg-white/10 text-white shadow-sm border border-white/[0.1]" 
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: 64 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card bento-full border border-white/[0.05] p-6 text-center">
          <Receipt size={32} className="mx-auto text-white/20 mb-3" />
          <h3 className="text-white/70 font-bold mb-1">Nenhuma transação</h3>
          <p className="text-white/40 text-[13px]">{search ? "Tente outro termo de busca." : `Sem transações em ${activePeriod}.`}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([label, txns]) => (
            <div key={label}>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3 pl-1 flex items-center gap-2">
                <span>{label}</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="bento-card bento-full !p-1.5 border border-white/[0.05]">
                {txns.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-2.5 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer group">
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center text-[18px] border border-white/[0.05] shadow-sm flex-shrink-0"
                      style={{ background: tx.amount > 0 ? "rgba(0, 217, 145, 0.15)" : "rgba(255,255,255,0.03)", color: tx.amount > 0 ? "var(--green)" : "var(--t2)" }}
                    >
                      {CATEGORY_ICONS[tx.category.toLowerCase()] ?? <Package size={16} />}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => setEditingTx(tx)}>
                      <div className="text-[13px] font-bold text-gray-100 truncate tracking-tight">{tx.description}</div>
                      <div className="text-[11px] font-medium text-gray-500 truncate mt-0.5">{tx.category}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5" style={{ color: tx.amount > 0 ? "var(--green)" : "var(--t1)", fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.5px' }}>
                        {tx.receiptUrl && <Paperclip size={12} className="opacity-50" />}
                        {tx.amount > 0 ? "+" : "−"}&nbsp;{formatCurrency(Math.abs(tx.amount))}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setEditingTx(tx)} className="h-6 w-6 text-blue-400/80 hover:bg-blue-400/10">
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} disabled={deletingId === tx.id} className="h-6 w-6 text-rose-400/80 hover:bg-rose-400/10 disabled:opacity-40">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onSave={async (id, updates) => {
            await updateTransaction(id, {
              type: updates.type ?? editingTx.type,
              description: updates.description ?? editingTx.description,
              amount: String(updates.amount ?? editingTx.amount),
              category: updates.category ?? editingTx.category,
              date: updates.date ?? editingTx.date,
              paymentMethod: editingTx.paymentMethod,
              notes: editingTx.notes,
              recurring: editingTx.recurring,
              scope: editingTx.scope,
            });
          }}
          onClose={() => setEditingTx(null)}
        />
      )}
      {showStatementImport && (
        <StatementImportModal
          onClose={() => setShowStatementImport(false)}
          onImportComplete={() => {
            setShowStatementImport(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};
