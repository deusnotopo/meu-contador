import {
  loadTransactions,
  saveTransactions as saveToStorage,
  STORAGE_EVENT,
  STORAGE_KEYS,
} from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter] = useState<string>("month");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loaded = loadTransactions();

    // Recurrence logic moved to main App check
    setTransactions(loaded);

    // LISTENER FOR REMOTE/BACKGROUND UPDATES
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === STORAGE_KEYS.TRANSACTIONS) {
        setTransactions(loadTransactions());
      }
    };

    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);

  const scopedTransactions = useMemo(() => {
    return transactions.filter((t) => t.scope === scope);
  }, [transactions, scope]);

  const saveTransactions = (updatedTransactions: Transaction[]) => {
    try {
      saveToStorage(updatedTransactions);
      setTransactions(updatedTransactions);
    } catch (error) {
      showError("Erro ao salvar transação. Tente novamente.");
    }
  };

  const addTransaction = (formData: TransactionFormData) => {
    try {
      const newTransaction: Transaction = {
        ...formData,
        id: Date.now(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        scope: formData.scope || scope,
      };
      const updated = [...transactions, newTransaction];
      saveToStorage(updated);
      setTransactions(updated);
      showSuccess("Transação adicionada com sucesso!");
    } catch (error) {
      showError("Erro ao adicionar transação. Tente novamente.");
    }
  };

  const updateTransaction = (id: number, formData: TransactionFormData) => {
    try {
      const updated = transactions.map((t) =>
        t.id === id
          ? {
              ...formData,
              id,
              amount: parseFloat(formData.amount),
              type: formData.type,
              scope: formData.scope || scope,
            }
          : t
      );
      saveToStorage(updated);
      setTransactions(updated);
      showSuccess("Transação atualizada com sucesso!");
    } catch (error) {
      showError("Erro ao atualizar transação.");
    }
  };

  const deleteTransaction = (id: number) => {
    if (window.confirm("Deseja realmente excluir esta transação?")) {
      try {
        const updated = transactions.filter((t) => t.id !== id);
        saveToStorage(updated);
        setTransactions(updated);
        showSuccess("Transação excluída com sucesso!");
      } catch (error) {
        showError("Erro ao excluir transação.");
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...scopedTransactions];

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
  }, [scopedTransactions, filter, dateFilter, searchTerm]);

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

    scopedTransactions.forEach((t) => {
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
  }, [scopedTransactions]);

  return {
    transactions: scopedTransactions,
    allTransactions: transactions,
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
    saveTransactions,
    totals,
    categoryData,
    getPieChartData,
    monthlyTrend,
  };
};
