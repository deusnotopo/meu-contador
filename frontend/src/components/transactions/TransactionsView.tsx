import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import {
  ArrowLeft,
  Search,
  Upload,
  Trash2,
  Pencil,
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Pill,
  Film,
  Shirt,
  Package,
  DollarSign,
  TrendingUp,
  Receipt,
  Paperclip,
  FileText,
  FileDown,
  Sheet,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { StatementImportModal } from "@/components/statements/StatementImportModal";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import type { TabType } from "@/types/navigation";
import type { Transaction } from "@/types";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import { WizardTrigger } from "@/components/onboarding/WizardTrigger";
import { EditTransactionModal } from "./EditTransactionModal";
import { motion, AnimatePresence } from "framer-motion";
import { exportFinancialReport, exportTransactionsCSV } from "@/lib/pdf-export";

const PERIODS = ["Mar", "Fev", "Jan", "Dez", "Nov", "Out"];
const MONTH_MAP: Record<string, number> = {
  Mar: 2,
  Fev: 1,
  Jan: 0,
  Dez: 11,
  Nov: 10,
  Out: 9,
};

interface TransactionsViewProps {
  onBack: (tab: TabType) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  moradia: <Home size={16} />,
  mercado: <ShoppingCart size={16} />,
  delivery: <Utensils size={16} />,
  transporte: <Car size={16} />,
  saude: <Pill size={16} />,
  lazer: <Film size={16} />,
  roupas: <Shirt size={16} />,
  outros: <Package size={16} />,
  salario: <DollarSign size={16} />,
  investimentos: <TrendingUp size={16} />,
  receita: <DollarSign size={16} />,
  income: <DollarSign size={16} />,
};

// ── Seasonal pattern — marks recurring subscriptions / salary predictably ─────
const RECURRING_KEYWORDS = [
  "netflix",
  "spotify",
  "amazon",
  "gympass",
  "salario",
  "rendimento",
  "smart fit",
  "nubank",
  "inter",
];

function isSeasonalRecurring(description: string): boolean {
  const lower = description.toLowerCase();
  return RECURRING_KEYWORDS.some((k) => lower.includes(k));
}

export const TransactionsView = ({ onBack }: TransactionsViewProps) => {
  const {
    transactions,
    isLoading,
    refresh,
    deleteTransaction,
    updateTransaction,
  } = useTransactions();
  const [activePeriod, setActivePeriod] = useState("Mar");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [activeCat, setActiveCat] = useState<string>("all");
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showStatementImport, setShowStatementImport] = useState(false);
  const [suggestingId, setSuggestingId] = useState<string | null>(null);

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
      const result = await api.post<{ importedCount: number }>(
        "/banking/ofx",
        formData,
      );
      showSuccess(`Sucesso! ${result.importedCount} transações importadas.`);
      await refresh();
    } catch {
      showError("Erro ao importar arquivo OFX.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // ── AI Category Suggestion ────────────────────────────────────────────────
  const handleSuggestCategory = async (tx: Transaction) => {
    setSuggestingId(tx.id);
    try {
      const result = await api.post<{
        suggestedCategory: string;
        confidence: number;
      }>("/ai/predict-category", {
        description: tx.description,
        amount: tx.amount,
      });
      if (
        result.suggestedCategory &&
        result.suggestedCategory !== tx.category
      ) {
        await updateTransaction(tx.id, {
          type: tx.type,
          description: tx.description,
          amount: String(tx.amount),
          category: result.suggestedCategory,
          date: tx.date,
          paymentMethod: tx.paymentMethod || "other",
          notes: tx.notes || "",
          recurring: tx.recurring || false,
          scope: tx.scope || "personal",
        });
        showSuccess(
          `Categoria sugerida: ${result.suggestedCategory} (${Math.round(result.confidence * 100)}% confiança)`,
        );
      } else {
        showSuccess("A categoria atual já é a melhor correspondência.");
      }
    } catch {
      showError("Não foi possível sugerir uma categoria.");
    } finally {
      setSuggestingId(null);
    }
  };

  const now = new Date();
  const targetMonth = MONTH_MAP[activePeriod] ?? now.getMonth();
  const targetYear = now.getFullYear() - (targetMonth > now.getMonth() ? 1 : 0);

  // ── Available categories for current period ───────────────────────────────
  const periodTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  const availableCategories = useMemo(() => {
    const cats = [...new Set(periodTxs.map((t) => t.category))].sort();
    return cats;
  }, [periodTxs]);

  const filtered = periodTxs
    .filter((t) => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesCat = activeCat === "all" || t.category === activeCat;
      const matchesSearch =
        search === "" ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesCat && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Summary stats
  const totalIncome = periodTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = periodTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const incomeCount = periodTxs.filter((t) => t.type === "income").length;
  const expenseCount = periodTxs.filter((t) => t.type === "expense").length;

  const today = new Date().toISOString().split("T")[0];
  const groups: Record<string, typeof filtered> = {};
  filtered.forEach((t) => {
    const label =
      t.date === today
        ? "Hoje"
        : new Date(t.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-28">
      {/* ── Floating Header ── */}
      <div className="flex items-center gap-3 mb-5 sticky top-2 z-[60] bg-[#080C16]/80 backdrop-blur-2xl px-3 py-2.5 rounded-[22px] border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)] mx-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onBack("inicio")}
          className="rounded-xl w-10 h-10 bg-white/[0.04] border border-white/[0.08] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0"
        >
          <ArrowLeft size={16} />
        </Button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-0.5">
              Extrato Geral
            </div>
            <div className="text-base font-black text-white tracking-tight leading-none">
              Transações
            </div>
          </div>
          <WizardTrigger label="Guia" />
          <HelpButton tooltipText="Consulte, edite, exclua e importe transações do período selecionado." />
        </div>

        <input
          type="file"
          id="ofx-upload"
          accept=".ofx"
          className="hidden"
          onChange={handleOfxUpload}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => document.getElementById("ofx-upload")?.click()}
          className={`rounded-xl hover:bg-white/10 text-blue-400 transition-opacity ${isUploading ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          title="Importar OFX"
        >
          <Upload size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowStatementImport(true)}
          className="rounded-xl hover:bg-white/10 text-blue-400"
          title="Importar Extrato (CSV/OFX/PDF)"
        >
          <FileText size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            exportFinancialReport(filtered, null, activePeriod);
            showSuccess("PDF exportado!");
          }}
          className="rounded-xl hover:bg-white/10 text-amber-400"
          title="Exportar PDF"
        >
          <FileDown size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            exportTransactionsCSV(filtered, `transacoes-${activePeriod}`);
            showSuccess("CSV exportado!");
          }}
          className="rounded-xl hover:bg-white/10 text-green-400"
          title="Exportar Excel (CSV)"
        >
          <Sheet size={16} />
        </Button>
      </div>

      <div className="px-1">
        {/* ── Period Summary Bar ── */}
        {!isLoading && periodTxs.length > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <ArrowUpRight size={13} className="text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold text-emerald-400">
                {formatCurrency(totalIncome)}
              </span>
              <span className="text-[9px] text-white/30 ml-1">
                {incomeCount}x
              </span>
            </div>
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/15">
              <ArrowDownLeft size={13} className="text-rose-400 shrink-0" />
              <span className="text-[11px] font-bold text-rose-400">
                {formatCurrency(totalExpense)}
              </span>
              <span className="text-[9px] text-white/30 ml-1">
                {expenseCount}x
              </span>
            </div>
          </div>
        )}

        {/* ── Search + Period + Type Filters ── */}
        <div className="card-obsidian rounded-2xl border-white/[0.05] p-2 mb-3 bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2.5 mb-2 border border-white/[0.05]">
            <Search size={14} className="text-white/30 shrink-0" />
            <input
              placeholder="Buscar transação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-[13px] w-full placeholder:text-white/25 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-white/30 hover:text-white transition-all"
              >
                ×
              </button>
            )}
          </div>

          {/* Period chips */}
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1 mb-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setActivePeriod(p);
                  setActiveCat("all");
                }}
                className={`px-4 py-1.5 rounded-[10px] text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                  activePeriod === p
                    ? "bg-white/10 text-white shadow-sm border border-white/[0.12]"
                    : "text-white/35 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Type filter pills */}
          <div className="flex gap-1.5 mb-1.5">
            {(["all", "income", "expense"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                  typeFilter === type
                    ? type === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : type === "expense"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-white/10 text-white border border-white/20"
                    : "text-white/30 hover:text-white/60 bg-white/[0.02] border border-white/[0.05]"
                }`}
              >
                {type === "income" && <ArrowUpRight size={10} />}
                {type === "expense" && <ArrowDownLeft size={10} />}
                {type === "all"
                  ? "Todos"
                  : type === "income"
                    ? "Receitas"
                    : "Despesas"}
              </button>
            ))}

            <button
              onClick={() => setShowCatFilter((v) => !v)}
              className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                activeCat !== "all"
                  ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                  : "text-white/30 bg-white/[0.02] border-white/[0.05]"
              }`}
              title="Filtrar catégoria"
            >
              <SlidersHorizontal size={10} />
              {activeCat !== "all" ? activeCat : "Cat"}
            </button>
          </div>

          {/* Category chips (expandable) */}
          <AnimatePresence>
            {showCatFilter && availableCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1 pt-1"
              >
                <button
                  onClick={() => setActiveCat("all")}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                    activeCat === "all"
                      ? "bg-white/10 text-white border-white/20"
                      : "text-white/30 border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  Todas
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold transition-all border capitalize ${
                      activeCat === cat
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        : "text-white/30 border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton rounded-2xl h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-obsidian rounded-2xl border-white/[0.05] p-8 text-center"
          >
            <Receipt size={30} className="mx-auto text-white/20 mb-3" />
            <h3 className="text-white/60 font-black text-sm mb-1">
              Nenhuma transação
            </h3>
            <p className="text-white/35 text-[12px] font-medium">
              {search
                ? "Tente outro termo de busca."
                : `Sem transações em ${activePeriod}.`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {Object.entries(groups).map(([label, txns]) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Date Group Label */}
                  <div className="flex items-center gap-2 mb-2 pl-1">
                    <span className="text-[10px] text-white/35 uppercase tracking-[0.15em] font-black">
                      {label}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-[10px] text-white/20 font-bold">
                      {txns.length}
                    </span>
                  </div>

                  {/* Transactions Card */}
                  <div className="card-obsidian rounded-2xl border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
                    {txns.map((tx) => {
                      const isIncome = tx.type === "income";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 px-3.5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                          {/* Category Icon */}
                          <div
                            className={`w-10 h-10 rounded-[14px] flex items-center justify-center border border-white/[0.06] shadow-sm shrink-0 ${
                              isIncome
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-white/[0.04] text-white/50"
                            }`}
                          >
                            {CATEGORY_ICONS[tx.category.toLowerCase()] ?? (
                              <Package size={16} />
                            )}
                          </div>

                          {/* Description */}
                          <div
                            className="flex-1 min-w-0"
                            onClick={() => setEditingTx(tx)}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="text-[13px] font-bold text-white/90 truncate tracking-tight">
                                {tx.description}
                              </div>
                              {isSeasonalRecurring(tx.description) && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 whitespace-nowrap flex-shrink-0">
                                  Recorrente
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-white/35 truncate mt-0.5 capitalize">
                              {tx.category}
                            </div>
                          </div>

                          {/* Amount + Actions */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div
                              className={`flex items-center gap-1 font-black tabular-nums tracking-tight text-sm ${
                                isIncome ? "text-emerald-400" : "text-white/80"
                              }`}
                            >
                              {tx.receiptUrl && (
                                <Paperclip size={11} className="opacity-40" />
                              )}
                              <span>
                                {isIncome ? "+" : "−"}&nbsp;
                                {formatCurrency(Math.abs(tx.amount))}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* AI Suggest */}
                              {tx.type === "expense" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSuggestCategory(tx)}
                                  disabled={suggestingId === tx.id}
                                  className="h-6 w-6 text-purple-400/70 hover:text-purple-400 hover:bg-purple-400/10"
                                  title="Sugerir categoria com IA"
                                >
                                  {suggestingId === tx.id ? (
                                    <RefreshCw
                                      size={11}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Sparkles size={11} />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingTx(tx)}
                                className="h-6 w-6 text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10"
                              >
                                <Pencil size={11} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(tx.id)}
                                disabled={deletingId === tx.id}
                                className="h-6 w-6 text-rose-400/70 hover:text-rose-400 hover:bg-rose-400/10 disabled:opacity-30"
                              >
                                <Trash2 size={11} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
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
              paymentMethod: editingTx.paymentMethod ?? "other",
              notes: editingTx.notes ?? "",
              recurring: editingTx.recurring ?? false,
              scope: editingTx.scope ?? "personal",
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
