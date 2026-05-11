import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { BudgetSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { Budget } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // AKITA MODE: Contrato estrito para orçamentos
      const items = await api.get<Budget[]>("/budgets", {
        schema: z.union([
          z.array(BudgetSchema),
          z.object({ items: z.array(BudgetSchema) }).transform(val => val.items)
        ])
      });
      setBudgets(items);
      return items;
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.error('[useBudgets] Zod Validation Error', err.errors);
        setError('Erro de integridade nos dados de orçamentos.');
      } else {
        setError("Orçamentos indisponíveis. Verifique sua conexão.");
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (budget: Omit<Budget, "id" | "spent">) => {
    try {
      // AKITA MODE: Validação pre-submit
      BudgetSchema.omit({ id: true, spent: true }).parse(budget);
      
      const newBudget = await api.post<Budget>("/budgets", budget);
      setBudgets((prev) => [...prev, newBudget]);
      showSuccess("Orçamento definido!");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        showError(`Erro de validação: ${err.errors[0]?.message}`);
      } else {
        showError("Erro ao definir orçamento.");
      }
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const current = budgets.find((b) => b.id === id);
      const newLimit = updates.limit ?? current?.limit ?? 0;
      
      const updated = await api.put<Budget>(`/budgets/${id}`, { limit: newLimit });
      setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
      showSuccess("Orçamento atualizado!");
    } catch {
      showError("Erro ao atualizar orçamento.");
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      showSuccess("Orçamento excluído.");
    } catch {
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
