import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import type { Budget } from "@/types";
import { useEffect, useState } from "react";

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.get<Budget[]>("/budgets");
      setBudgets(data);
    } catch (error) {
      console.warn("Backend API not available for budgets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const addBudget = async (budget: Omit<Budget, "id" | "spent">) => {
    try {
      const newBudget = await api.post<Budget>("/budgets", budget);
      setBudgets((prev) => [...prev, newBudget]);
      showSuccess("Orçamento definido!");
    } catch (error) {
      showError("Erro ao definir orçamento.");
    }
  };

  const updateSpent = async (id: string, spent: number) => {
    try {
      await api.put(`/budgets/${id}`, { spent });
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? { ...b, spent } : b))
      );
    } catch (error) {
      console.error("Error updating budget spent:", error);
    }
  };

  return {
    budgets,
    loading,
    addBudget,
    updateSpent,
    refresh: fetchBudgets,
  };
};
