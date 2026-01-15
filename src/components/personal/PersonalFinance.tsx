import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import { STORAGE_EVENT, STORAGE_KEYS, loadGoals } from "@/lib/storage";
import type { Transaction, TransactionFormData } from "@/types";
import { SavingsGoal } from "@/types";
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DebtRecovery } from "./DebtRecovery";
import { SmartInsights } from "./SmartInsights";

import { AnalyticsTab } from "@/components/contador/AnalyticsTab";
import { SummaryCards } from "@/components/contador/SummaryCards";
import { TransactionFilters } from "@/components/contador/TransactionFilters";
import { TransactionForm } from "@/components/contador/TransactionForm";
import { TransactionList } from "@/components/contador/TransactionList";
import { BudgetsSection } from "@/components/personal/BudgetsSection";
import { EmergencyFundCard } from "@/components/personal/EmergencyFundCard";
import { FinancialHealthCard } from "@/components/personal/FinancialHealthCard";
import { GlobalAlerts } from "@/components/personal/GlobalAlerts";
import { GoalsSection } from "@/components/personal/GoalsSection";
import { PredictionsCard } from "@/components/personal/PredictionsCard";
import { RemindersSection } from "@/components/personal/RemindersSection";
import { ReceiptScanner } from "@/components/receipts/ReceiptScanner";
import { useAuth } from "@/context/AuthContext";
import { exportFullMonthlyReport } from "@/lib/pdf-export";
import { exportTransactionsToCSV, importTransactions } from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import { FileText } from "lucide-react";

export const PersonalFinance = () => {
  const { isPro } = useAuth();
  const [showPremium, setShowPremium] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

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
    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.GOALS) {
        setGoals(e.detail.data);
      }
    };
    window.addEventListener(STORAGE_EVENT as any, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange);
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

  const incomeCount = filteredTransactions.filter(
    (t) => t.type === "income"
  ).length;
  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense"
  ).length;

  return (
    <div className="space-y-10 animate-fade-in pb-12">
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
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                title="Importar transações"
              >
                <Upload size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
              <Button
                onClick={() => setShowReceiptScanner(true)}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl h-14 px-6 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all"
              >
                <Camera size={18} className="mr-2 hidden sm:block" />
                Escanear
              </Button>
              <Button
                onClick={handleNewTransaction}
                className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8 shadow-xl shadow-white/5 transition-all text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap"
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
        <div className="space-y-6">
          <GlobalAlerts />

          <SummaryCards
            income={totals.income}
            expense={totals.expense}
            balance={totals.balance}
            transactionCount={filteredTransactions.length}
          />

          <div className="flex justify-end px-2">
            <Button
              className="group relative overflow-hidden bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest transition-all"
              onClick={() => {
                const month = new Date().toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                });
                exportFullMonthlyReport(month, transactions, totals);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <FileText size={18} className="mr-3 text-indigo-400" />
              Relatório PDF Pro
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TransactionFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filter={filter}
                setFilter={setFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
              />
              <TransactionList
                transactions={filteredTransactions}
                onEdit={handleEdit}
                onDelete={deleteTransaction}
              />
            </div>
            <div className="space-y-6">
              <FinancialHealthCard
                transactions={transactions}
                totals={totals}
              />
              <EmergencyFundCard transactions={transactions} />
              <PredictionsCard transactions={transactions} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "budgets" && (
        <BudgetsSection transactions={transactions} />
      )}

      {activeTab === "goals" && <GoalsSection />}

      {activeTab === "reminders" && <RemindersSection />}

      {activeTab === "analytics" && (
        <AnalyticsTab
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
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialHealthCard
              transactions={transactions}
              totals={totals}
              showDetails
            />
            <PredictionsCard transactions={transactions} showDetails />
          </div>
          <SmartInsights transactions={transactions} goals={goals} />
        </div>
      )}

      {activeTab === "debts" && <DebtRecovery />}

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
