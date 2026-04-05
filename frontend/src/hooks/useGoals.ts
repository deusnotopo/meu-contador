import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import type { SavingsGoal } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<SavingsGoal[] | { items?: SavingsGoal[] }>("/goals");
      const items = Array.isArray(response) ? response : (response?.items || []);
      setGoals(items);
    } catch {
      setError("Metas de economia indisponíveis. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (goal: Omit<SavingsGoal, "id">) => {
    try {
      const newGoal = await api.post<SavingsGoal>("/goals", goal);
      setGoals((prev) => [...prev, newGoal]);
      showSuccess("Meta criada!");
    } catch {
      showError("Erro ao criar meta.");
    }
  };

  const updateGoalProgress = async (id: string, currentAmount: number) => {
    try {
      await api.patch(`/goals/${id}`, { currentAmount });
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, currentAmount } : g))
      );
    } catch {
      showError("Erro ao atualizar progresso.");
    }
  };

  const editGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      await api.patch(`/goals/${id}`, updates);
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );
      showSuccess("Meta atualizada!");
    } catch {
      showError("Erro ao atualizar meta.");
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      showSuccess("Meta removida.");
    } catch {
      showError("Erro ao remover meta.");
    }
  };

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoalProgress,
    editGoal,
    deleteGoal,
    refresh: fetchGoals,
  };
};
