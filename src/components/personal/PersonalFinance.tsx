import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionFormData } from "@/types";
import {
  BarChart3,
  Bell,
  Brain,
  Download,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

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
import { useAuth } from "@/context/AuthContext";
import { exportFullMonthlyReport } from "@/lib/pdf-export";
import { exportTransactions, importTransactions } from "@/lib/storage";
import { FileText } from "lucide-react";

export const PersonalFinance = () => {
  const { isPro } = useAuth();
  const [showPremium, setShowPremium] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
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

  const handleExport = () => {
    exportTransactions(transactions);
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
    <div className="space-y-8 animate-fade-in">
      {/* Premium Header */}
      <div className="glass-panel p-8 rounded-[2.5rem] border-none">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
              <Sparkles className="text-primary glow-text" size={32} />
              Gestão <span className="text-primary">Master</span>
            </h2>
            <p className="text-lg text-slate-400 font-bold max-w-md">
              Acompanhe seu fluxo de caixa pessoal com precisão matemática.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTransactionsToCSV(transactions)}
              className="hidden lg:flex gap-2 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 rounded-xl"
            >
              <FileSpreadsheet size={16} />
              EXCEL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="hidden md:flex gap-2 border-slate-700/50 text-slate-400 hover:bg-white/5 rounded-xl"
            >
              <Download size={16} />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="hidden md:flex gap-2 border-slate-700/50 text-slate-400 hover:bg-white/5 rounded-xl"
            >
              <Upload size={16} />
              IMPORTAR
            </Button>
            <Button
              onClick={handleNewTransaction}
              size="lg"
              className="bg-white text-black hover:bg-slate-100 font-black rounded-2xl px-6 h-12 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
            >
              <PlusCircle size={18} className="mr-2" />
              NOVA TRANSAÇÃO
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-card gap-2"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="budgets"
            className="data-[state=active]:bg-card gap-2"
          >
            <Target size={16} />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="data-[state=active]:bg-card gap-2"
          >
            <TrendingUp size={16} />
            Metas
          </TabsTrigger>
          <TabsTrigger
            value="reminders"
            className="data-[state=active]:bg-card gap-2"
          >
            <Bell size={16} />
            Lembretes
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-card gap-2"
          >
            <BarChart3 size={16} />
            Análises
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-card gap-2"
          >
            <Brain size={16} />
            Insights IA
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
              variant="outline"
              className="gap-2 border-primary/30 hover:border-primary text-primary font-bold rounded-xl"
              onClick={() => {
                const month = new Date().toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                });
                exportFullMonthlyReport(month, transactions, totals);
              }}
            >
              <FileText size={16} />
              Gerar Relatório PRO (PDF)
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialHealthCard
            transactions={transactions}
            totals={totals}
            showDetails
          />
          <PredictionsCard transactions={transactions} showDetails />
        </div>
      )}
    </div>
  );
};
