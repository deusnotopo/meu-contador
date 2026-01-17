import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import { STORAGE_EVENT, STORAGE_KEYS, loadGoals, saveBudgets, saveGoals } from "@/lib/storage";
import { QuickSetupWizard } from "@/components/ui/QuickSetupWizard";
import type { SavingsGoal, Transaction, TransactionFormData } from "@/types";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Brain,
  Camera,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Link2,
} from "lucide-react";
import { BankConnectionModal } from "@/components/banking/BankConnectionModal";
import { AnimatePresence, motion } from "framer-motion";
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

export const PersonalFinance = () => {

  const [activeTab, setActiveTab] = useState("dashboard");
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
      if (detail?.key === STORAGE_KEYS.GOALS) {
        setGoals(detail.data);
      }
    };
    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);

  const handleExport = () => {
    // exportTransactions(transactions); // CSV
    exportFullMonthlyReport("Relatório Mensal", transactions, totals);
    showSuccess("Relatório PDF gerado!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importTransactions(file);
      if (
        window.confirm(
          `Deseja importar ${imported.length} transações? Isso substituirá seus dados atuais.`
        )
      ) {
        window.location.reload(); // Reload to refresh transactions
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao importar");
    }
  };

  const handleBankSyncSuccess = (newTransactions: Partial<Transaction>[]) => {
    newTransactions.forEach(t => {
      addTransaction(t as any);
    });
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleSubmit = (formData: TransactionFormData, isEditing: boolean) => {
    if (isEditing && editingTransaction) {
      updateTransaction(editingTransaction.id, formData);
    } else {
      addTransaction(formData);
    }
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleApplyPreset = (data: { 
    budgets?: { category: string; amount: number }[]; 
    goals?: { name: string; targetAmount: number; icon: string }[] 
  }) => {
    if (data.budgets) {
      saveBudgets(data.budgets.map((b, i) => ({
        id: (Date.now() + i).toString(),
        category: b.category,
        limit: b.amount,
        spent: 0,
        month: new Date().toISOString().slice(0, 7)
      })));
    }
    if (data.goals) {
      saveGoals(data.goals.map((g, i) => ({
        id: (Date.now() + i + 100).toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: 0,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: g.icon,
        color: "from-indigo-500 to-purple-600"
      })));
    }
    setShowWizard(false);
  };

  const incomeCount = filteredTransactions.filter(
    (t) => t.type === "income"
  ).length;
  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense"
  ).length;

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      <AnimatePresence>
        {transactions.length === 0 && !showWizard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 bg-indigo-500/10 border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-black text-white uppercase tracking-tight">Configure com um clique</h4>
                <p className="text-xs text-slate-400 font-medium">Use presets inteligentes para não precisar configurar tudo manualmente.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={() => setShowBankModal(true)}
                className="w-full sm:w-auto h-12 px-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500/20 transition-all"
              >
                <Link2 size={18} className="mr-2" />
                Conectar Banco
              </Button>

              <Button
                onClick={() => setShowWizard(true)}
                disabled={isViewer}
                className="bg-white text-black font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl disabled:opacity-50"
              >
                Abrir Wizard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BankConnectionModal 
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSuccess={handleBankSyncSuccess}
      />

      <AnimatePresence>
        {showWizard && (
          <QuickSetupWizard 
            type="personal" 
            onComplete={handleApplyPreset} 
            onClose={() => setShowWizard(false)} 
          />
        )}
      </AnimatePresence>
      {/* Premium Header */}
      <div className="premium-card p-6 md:p-10">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/5 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
              <Sparkles size={12} />
              Gestão Financeira
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">
              Fluxo <br className="hidden md:block" />
              <span className="premium-gradient-text">Pessoal Master</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-md hidden md:block">
              Acompanhe seu fluxo de caixa pessoal com precisão matemática em
              tempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => exportTransactionsToCSV(transactions)}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                title="Exportar para Excel"
              >
                <FileSpreadsheet size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                title="Exportar para JSON"
              >
                <Download size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => isViewer ? showError("Somente leitura") : fileInputRef.current?.click()}
                disabled={isViewer}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-50"
                title="Importar transações"
              >
                <Upload size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
               <Button
                onClick={() => isViewer ? showError("Somente leitura") : setShowReceiptScanner(true)}
                disabled={isViewer}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl h-14 px-6 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <Camera size={18} className="mr-2 hidden sm:block" />
                Escanear
              </Button>
              <Button
                onClick={() => isViewer ? showError("Somente leitura") : handleNewTransaction()}
                disabled={isViewer}
                className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8 shadow-xl shadow-white/5 transition-all text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap disabled:opacity-50"
              >
                <PlusCircle size={18} className="mr-2 hidden sm:block" />
                Novo Lançamento
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative group">
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10 md:hidden" />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-fit mb-10 overflow-x-auto no-scrollbar scroll-smooth">
            <TabsTrigger
              value="dashboard"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="budgets"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
            >
              <Target size={14} />
              Orçamentos
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
            >
              <TrendingUp size={14} />
              Metas
            </TabsTrigger>
            <TabsTrigger
              value="reminders"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
            >
              <Bell size={14} />
              Lembretes
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
            >
              <BarChart3 size={14} />
              Análises
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2 whitespace-nowrap"
            >
              <Brain size={14} />
              IA Insights
            </TabsTrigger>
            <TabsTrigger
              value="debts"
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-rose-500 data-[state=active]:text-white flex items-center gap-2 whitespace-nowrap"
            >
              <AlertCircle size={14} />
              Dívidas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <TransactionForm
          editingTransaction={editingTransaction}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          scope="personal"
        />
      )}

      {/* Tab Content */}
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

      {activeTab === "budgets" && <BudgetsTab transactions={transactions} />}

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
        <InsightsTab transactions={transactions} goals={goals} totals={totals} />
      )}

      {activeTab === "debts" && <DebtsTab />}

      {/* Receipt Scanner Modal */}
      {showReceiptScanner && (
        <ReceiptScanner
          onClose={() => setShowReceiptScanner(false)}
          onTransactionCreated={() => {
            // Auto-refresh handled by storage events
          }}
        />
      )}
    </div>
  );
};
