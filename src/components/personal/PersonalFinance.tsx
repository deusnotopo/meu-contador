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
import { FinancialHealthCard } from "@/components/personal/FinancialHealthCard";
import { GoalsSection } from "@/components/personal/GoalsSection";
import { PredictionsCard } from "@/components/personal/PredictionsCard";
import { RemindersSection } from "@/components/personal/RemindersSection";
import { exportTransactions, importTransactions } from "@/lib/storage";

export const PersonalFinance = () => {
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
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            Finanças Pessoais
          </h2>
          <p className="text-muted-foreground text-sm">
            Gerencie suas finanças de forma inteligente
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleExport}
            className="hidden md:flex gap-2"
          >
            <Download size={16} />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="hidden md:flex gap-2"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={handleNewTransaction}
            className="gradient-primary border-0 font-semibold"
          >
            <PlusCircle size={18} className="mr-2" />
            Nova Transação
          </Button>
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
          <SummaryCards
            income={totals.income}
            expense={totals.expense}
            balance={totals.balance}
            transactionCount={filteredTransactions.length}
          />

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
