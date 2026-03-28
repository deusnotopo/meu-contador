import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import type { SavingsGoal } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    let cancelled = false; // ← Flag para cleanup
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.get<SavingsGoal[]>("/goals");
      if (!cancelled) { // ← Verifica se componente ainda está montado
        setGoals(data);
      }
    } catch (err) {
      if (!cancelled) {
        setError("Metas de economia indisponíveis. Verifique sua conexão.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
    
    return () => { cancelled = true; }; // ← Cleanup function
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await api.get<SavingsGoal[]>("/goals");
        if (!cancelled) {
          setGoals(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Metas de economia indisponíveis. Verifique sua conexão.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => { cancelled = true; }; // ← Cleanup!
  }, []);

  const addGoal = async (goal: Omit<SavingsGoal, "id">) => {
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

  const editGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      await api.patch(`/goals/${id}`, updates);
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );
      showSuccess("Meta atualizada!");
    } catch (error) {
      showError("Erro ao atualizar meta.");
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
    error,
    addGoal,
    updateGoalProgress,
    editGoal,
    deleteGoal,
    refresh: fetchGoals,
  };
};
