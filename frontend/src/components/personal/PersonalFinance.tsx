import { useTransactions } from "@/hooks/useTransactions";
import {
  STORAGE_KEYS,
  STORAGE_EVENT,
  loadGoals,
  saveBudgets,
  saveGoals,
} from "@/lib/storage";
import { QuickSetupWizard } from "@/components/ui/QuickSetupWizard";
import type { SavingsGoal, Transaction, TransactionFormData } from "@/types";
import {
  Camera,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Upload,
  Link2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { BankConnectionModal } from "@/components/banking/BankConnectionModal";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DashboardTab } from "@/features/personal/components/DashboardTab";
import { BudgetsTab } from "@/features/personal/components/BudgetsTab";
import { GoalsTab } from "@/features/personal/components/GoalsTab";
import { RemindersTab } from "@/features/personal/components/RemindersTab";
import { AnalyticsTab as AnalyticsTabComponent } from "@/features/personal/components/AnalyticsTab";
import { InsightsTab } from "@/features/personal/components/InsightsTab";
import { DebtsTab } from "@/features/personal/components/DebtsTab";
import { TransactionForm } from "@/components/contador/TransactionForm";
import { ReceiptScanner } from "@/components/receipts/ReceiptScanner";
import { exportFullMonthlyReport } from "@/lib/pdf-export";
import { exportTransactionsToCSV, importTransactions } from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import { useRole } from "@/context/AuthContext";
import { normalizeBudgetCategory } from "@/features/budgets/budget-utils";
import { formatCurrency } from "@/lib/formatters";
import { confirmAction } from "@/lib/confirm";

type PersonalTab =
  | "dashboard"
  | "budgets"
  | "goals"
  | "reminders"
  | "analytics"
  | "insights"
  | "debts";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const NAV: {
  id: PersonalTab;
  label: string;
  icon: string;
  danger?: boolean;
}[] = [
  { id: "dashboard", label: "Início", icon: "🏠" },
  { id: "budgets", label: "Orçamentos", icon: "🎯" },
  { id: "goals", label: "Metas", icon: "📈" },
  { id: "reminders", label: "Lembretes", icon: "🔔" },
  { id: "analytics", label: "Análises", icon: "📊" },
  { id: "insights", label: "IA Insights", icon: "🧠" },
  { id: "debts", label: "Dívidas", icon: "⚠️", danger: true },
];

export const PersonalFinance = () => {
  const [activeTab, setActiveTab] = useState<PersonalTab>("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const { isViewer } = useRole();

  const {
    transactions,
    filteredTransactions,
    filter,
    setFilter,
    dateFilter,
    setDateFilter,
    searchTerm,
    setSearchTerm,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totals,
    categoryData,
    getPieChartData,
    monthlyTrend,
  } = useTransactions("personal");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadGoals());

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === STORAGE_KEYS.GOALS) setGoals(detail.data);
    };
    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);

  const handleExport = () => {
    exportFullMonthlyReport("Relatório Mensal", transactions, totals);
    showSuccess("Relatório PDF gerado!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importTransactions(file);
      const ok = await confirmAction(
        `Importar ${imported.length} transações? Isso substituirá seus dados atuais.`,
      );
      if (ok) {
        window.location.reload();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Erro ao importar');
    }
  };

  const handleBankSyncSuccess = (newTransactions: Partial<Transaction>[]) => {
    newTransactions.forEach((t) => {
      addTransaction({
        type: t.type || "expense",
        description: t.description || "Transação importada",
        amount: String(t.amount || 0),
        category: t.category || "Outros",
        date: t.date || new Date().toISOString().split("T")[0] || "",
        paymentMethod: t.paymentMethod || "bank_sync",
        notes: t.notes || "",
        recurring: t.recurring || false,
        recurrenceInterval: t.recurrenceInterval ?? undefined,
        scope: t.scope || "personal",
        classification: t.classification ?? undefined,
        currency: (t.currency as "BRL" | "USD" | "EUR" | "GBP") || "BRL",
      });
    });
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };
  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setShowForm(true);
  };
  const handleSubmit = (formData: TransactionFormData, isEditing: boolean) => {
    if (isEditing && editingTransaction)
      updateTransaction(editingTransaction.id, formData);
    else addTransaction(formData);
    setShowForm(false);
    setEditingTransaction(null);
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleApplyPreset = (data: {
    budgets?: { category: string; amount: number }[];
    goals?: { name: string; targetAmount: number; icon: string }[];
  }) => {
    if (data.budgets) {
      saveBudgets(
        data.budgets.map((b, i) => ({
          id: (Date.now() + i).toString(),
          category: normalizeBudgetCategory(b.category),
          limit: b.amount,
          spent: 0,
          month: new Date().toISOString().slice(0, 7),
          period: "monthly" as const,
          priority: "medium" as const,
        })),
      );
    }
    if (data.goals) {
      saveGoals(
        data.goals.map((g, i) => ({
          id: (Date.now() + i + 100).toString(),
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: 0,
          deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          icon: g.icon,
          color: "from-indigo-500 to-purple-600",
          category: "general",
          status: "active" as const,
        })),
      );
    }
    setShowWizard(false);
  };

  const incomeCount = filteredTransactions.filter(
    (t) => t.type === "income",
  ).length;
  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense",
  ).length;
  const balance = totals.income - totals.expense;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* ── HERO HEADER ──────────────────────────────────────────────────────── */}
      <motion.div variants={cardVariant}>
        <div className="card-obsidian relative overflow-hidden p-8">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3">
                <Wallet size={12} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  Gestão Pessoal
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Finanças <span className="text-indigo-400">Pessoais</span>
              </h1>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Lançamentos, orçamentos, metas e análises do seu fluxo de caixa
                pessoal.
              </p>
            </div>

            {/* KPI badges */}
            <div className="flex gap-3 shrink-0 flex-wrap">
              <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 min-w-[80px]">
                <ArrowUpRight size={16} className="text-emerald-400 mb-1" />
                <span className="text-sm font-black text-emerald-300 font-mono leading-none">
                  {formatCurrency(totals.income)}
                </span>
                <span className="text-[9px] text-emerald-400/60 uppercase tracking-widest mt-1">
                  Receitas
                </span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 min-w-[80px]">
                <ArrowDownRight size={16} className="text-rose-400 mb-1" />
                <span className="text-sm font-black text-rose-300 font-mono leading-none">
                  {formatCurrency(totals.expense)}
                </span>
                <span className="text-[9px] text-rose-400/60 uppercase tracking-widest mt-1">
                  Despesas
                </span>
              </div>
              <div
                className={`flex flex-col items-center p-4 rounded-2xl min-w-[80px] ${balance >= 0 ? "bg-blue-500/10 border border-blue-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}
              >
                <Activity
                  size={16}
                  className={`mb-1 ${balance >= 0 ? "text-blue-400" : "text-amber-400"}`}
                />
                <span
                  className={`text-sm font-black font-mono leading-none ${balance >= 0 ? "text-blue-300" : "text-amber-300"}`}
                >
                  {formatCurrency(Math.abs(balance))}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-widest mt-1 ${balance >= 0 ? "text-blue-400/60" : "text-amber-400/60"}`}
                >
                  {balance >= 0 ? "Saldo" : "Déficit"}
                </span>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/5">
            {/* Primary actions */}
            <button
              onClick={() =>
                isViewer ? showError("Somente leitura") : handleNewTransaction()
              }
              disabled={isViewer}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all"
            >
              <PlusCircle size={14} /> Novo Lançamento
            </button>
            <button
              onClick={() =>
                isViewer
                  ? showError("Somente leitura")
                  : setShowReceiptScanner(true)
              }
              disabled={isViewer}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all"
            >
              <Camera size={14} /> Escanear
            </button>
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all"
            >
              <Link2 size={14} /> Conectar Banco
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Secondary actions */}
            <button
              onClick={() => exportTransactionsToCSV(transactions)}
              title="Exportar CSV"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
            >
              <FileSpreadsheet size={14} />
            </button>
            <button
              onClick={handleExport}
              title="Exportar PDF"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() =>
                isViewer
                  ? showError("Somente leitura")
                  : fileInputRef.current?.click()
              }
              disabled={isViewer}
              title="Importar JSON"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-50"
            >
              <Upload size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />

            {/* Wizard CTA — only when zero transactions */}
            {transactions.length === 0 && (
              <button
                onClick={() => setShowWizard(true)}
                disabled={isViewer}
                className="ml-auto flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all"
              >
                ✨ Configurar com Wizard
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── NAV DOCK ─────────────────────────────────────────────────────────── */}
      <motion.div variants={cardVariant}>
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/10 overflow-x-auto gap-1.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === n.id
                  ? n.danger
                    ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{n.icon}</span>
              <span className="hidden lg:inline">{n.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWizard && (
          <QuickSetupWizard
            type="personal"
            onComplete={handleApplyPreset}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>

      <BankConnectionModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSuccess={handleBankSyncSuccess}
      />

      {showForm && (
        <TransactionForm
          editingTransaction={editingTransaction}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          scope="personal"
        />
      )}

      {showReceiptScanner && (
        <ReceiptScanner
          onClose={() => setShowReceiptScanner(false)}
          onTransactionCreated={() => {}}
        />
      )}

      {/* ── TAB CONTENT ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "dashboard" && (
            <DashboardTab
              transactions={transactions}
              filteredTransactions={filteredTransactions}
              totals={totals}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filter={filter}
              setFilter={setFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              onEdit={handleEdit}
              onDelete={deleteTransaction}
              onExport={() => {
                const month = new Date().toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                });
                exportFullMonthlyReport(month, transactions, totals);
              }}
            />
          )}
          {activeTab === "budgets" && (
            <BudgetsTab transactions={transactions} />
          )}
          {activeTab === "goals" && <GoalsTab />}
          {activeTab === "reminders" && <RemindersTab />}
          {activeTab === "analytics" && (
            <AnalyticsTabComponent
              monthlyTrend={monthlyTrend}
              categoryData={categoryData}
              incomeChartData={getPieChartData("income")}
              expenseChartData={getPieChartData("expense")}
              totals={totals}
              incomeCount={incomeCount}
              expenseCount={expenseCount}
            />
          )}
          {activeTab === "insights" && (
            <InsightsTab
              transactions={transactions}
              goals={goals}
              totals={totals}
            />
          )}
          {activeTab === "debts" && <DebtsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
