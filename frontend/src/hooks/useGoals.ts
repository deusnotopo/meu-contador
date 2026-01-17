import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import type { SavingsGoal } from "@/types";
import { useEffect, useState } from "react";

export const useGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await api.get<SavingsGoal[]>("/goals");
      setGoals(data);
    } catch (error) {
      console.warn("Backend API not available for goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async (goal: Omit<SavingsGoal, "id" | "currentAmount">) => {
    try {
      const newGoal = await api.post<SavingsGoal>("/goals", goal);
      setGoals((prev) => [...prev, newGoal]);
      showSuccess("Meta criada!");
    } catch (error) {
      showError("Erro ao criar meta.");
    }
  };

  const updateGoalProgress = async (id: string, currentAmount: number) => {
    try {
      await api.patch(`/goals/${id}`, { currentAmount });
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, currentAmount } : g))
      );
    } catch (error) {
      showError("Erro ao atualizar progresso.");
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      showSuccess("Meta removida.");
    } catch (error) {
      showError("Erro ao remover meta.");
    }
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    refresh: fetchGoals,
  };
};
