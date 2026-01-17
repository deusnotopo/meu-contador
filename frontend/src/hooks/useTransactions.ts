import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { logAction } from "@/lib/audit-service";
import { useAuth } from "@/context/AuthContext";
import type {
  CategoryChartData,
  ChartDataItem,
  MonthlyData,
  Transaction,
  TransactionFormData,
} from "@/types";
import { useEffect, useMemo, useState } from "react";

export const useTransactions = (
  scope: "personal" | "business" = "personal"
) => {
  const { user } = useAuth();
  const currentWorkspaceId = user?.currentWorkspaceId || user?.uid || "";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter] = useState<string>("month");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Transaction[]>(`/transactions?scope=${scope}`);
      setTransactions(data);
    } catch (error) {
      // Silently fail or show warning if backend isn't up yet
      console.warn("Backend API not available, using empty state.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [scope]);

  const addTransaction = async (formData: TransactionFormData) => {
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        scope: formData.scope || scope,
      };
      const newTransaction = await api.post<Transaction>("/transactions", payload);
      setTransactions((prev) => [newTransaction, ...prev]);
      
      if (currentWorkspaceId) {
        logAction(currentWorkspaceId, "CREATE_TRANSACTION", `${payload.type === 'income' ? 'Receita' : 'Despesa'}: ${payload.description} (R$ ${payload.amount})`);
      }
      
      showSuccess("Transação adicionada com sucesso!");
    } catch (error) {
      showError("Erro ao adicionar transação. Verifique o servidor.");
    }
  };

  const updateTransaction = async (id: string, formData: TransactionFormData) => {
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        scope: formData.scope || scope,
      };
      const updatedTransaction = await api.put<Transaction>(`/transactions/${id}`, payload);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTransaction : t))
      );
      
      if (currentWorkspaceId) {
        logAction(currentWorkspaceId, "UPDATE_TRANSACTION", `Editado: ${payload.description}`);
      }
      
      showSuccess("Transação atualizada com sucesso!");
    } catch (error) {
      showError("Erro ao atualizar transação.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm("Deseja realmente excluir esta transação?")) {
      try {
        const deleted = transactions.find(t => t.id === id);
        await api.delete(`/transactions/${id}`);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        
        if (currentWorkspaceId && deleted) {
          logAction(currentWorkspaceId, "DELETE_TRANSACTION", `Removido: ${deleted.description}`);
        }
        
        showSuccess("Transação excluída com sucesso!");
      } catch (error) {
        showError("Erro ao excluir transação.");
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filter !== "all") {
      filtered = filtered.filter((t) => t.type === filter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const startDate = new Date();

      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startDate.setMonth(now.getMonth() - 1);
      } else if (dateFilter === "year") {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filter, dateFilter, searchTerm]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const categoryData = useMemo((): CategoryChartData[] => {
    const categoryTotals: Record<string, { income: number; expense: number }> =
      {};

    filteredTransactions.forEach((t) => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        categoryTotals[t.category].income += t.amount;
      } else {
        categoryTotals[t.category].expense += t.amount;
      }
    });

    return Object.entries(categoryTotals).map(([name, values]) => ({
      name,
      receitas: values.income,
      despesas: values.expense,
    }));
  }, [filteredTransactions]);

  const getPieChartData = (type: "income" | "expense"): ChartDataItem[] => {
    const filtered = filteredTransactions.filter((t) => t.type === type);
    const categoryTotals: Record<string, number> = {};

    filtered.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const monthlyTrend = useMemo((): MonthlyData[] => {
    const monthlyData: Record<string, MonthlyData> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey =
        date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, receitas: 0, despesas: 0 };
      }

      if (t.type === "income") {
        monthlyData[monthKey].receitas += t.amount;
      } else {
        monthlyData[monthKey].despesas += t.amount;
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  return {
    transactions,
    allTransactions: transactions,
    filteredTransactions,
    isLoading,
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
  };
};
