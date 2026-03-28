import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import type { Budget } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    let cancelled = false; // ← Flag para cleanup
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.get<Budget[]>("/budgets");
      if (!cancelled) { // ← Verifica se componente ainda está montado
        setBudgets(data);
      }
    } catch (err) {
      if (!cancelled) {
        setError("Orçamentos indisponíveis. Verifique sua conexão.");
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
        const data = await api.get<Budget[]>("/budgets");
        if (!cancelled) {
          setBudgets(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Orçamentos indisponíveis. Verifique sua conexão.");
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

  const addBudget = async (budget: Omit<Budget, "id" | "spent">) => {
    try {
      const newBudget = await api.post<Budget>("/budgets", budget);
      setBudgets((prev) => [...prev, newBudget]);
      showSuccess("Orçamento definido!");
    } catch (error) {
      showError("Erro ao definir orçamento.");
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const current = budgets.find((b) => b.id === id);
      const newLimit = updates.limit ?? current?.limit ?? 0;
      const newSpent = updates.spent ?? current?.spent ?? 0;
      
      const updated = await api.put<Budget>(`/budgets/${id}`, { limit: newLimit, spent: newSpent });
      setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
      showSuccess("Orçamento atualizado!");
    } catch (error) {
      showError("Erro ao atualizar orçamento.");
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      showSuccess("Orçamento excluído.");
    } catch (error) {
      showError("Erro ao excluir orçamentos.");
    }
  };

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refresh: fetchBudgets,
  };
};
