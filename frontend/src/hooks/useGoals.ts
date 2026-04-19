import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { GoalSchema } from "@/lib/schemas";
import { z } from "zod";
import type { SavingsGoal } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // AKITA MODE: Contrato estrito para metas
      const response = await api.get<SavingsGoal[]>("/goals", {
        schema: z.union([
          z.array(GoalSchema),
          z.object({ items: z.array(GoalSchema) }).transform(val => val.items)
        ])
      });
      setGoals(response);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        console.error('Zod Validation Error (Goals):', err.errors);
        setError('Dados de metas incompatíveis.');
      } else {
        console.error('Failed to fetch goals:', err);
        setError("Metas de economia indisponíveis. Verifique sua conexão.");
      }
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
