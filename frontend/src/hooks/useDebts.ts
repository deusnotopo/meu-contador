import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";
import { DebtSchema } from "@/lib/schemas";
import { z } from "zod";
import { Debt } from "@/types";
import { useEffect, useMemo, useState, useCallback } from "react";

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    try {
      // AKITA MODE: Contrato estrito para dívidas
      const response = await api.get<Debt[]>("/debts", {
        schema: z.union([
          z.array(DebtSchema),
          z
            .object({ items: z.array(DebtSchema) })
            .transform((val) => val.items),
        ]),
      });
      if (!cancelled) {
        setDebts(response);
      }
    } catch (err) {
      if (!cancelled) {
        if (err instanceof z.ZodError) {
          console.error("Zod Validation Error (Debts):", err.errors);
          setError("Dados de dívidas incompatíveis.");
        } else {
          console.error("Debts API Error:", err);
          setError("Dívidas indisponíveis no momento. Verifique sua conexão.");
        }
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }

    return () => {
      cancelled = true;
    }; // ← Cleanup function
  }, []);

  useEffect(() => {
    let cancelFn = () => {};
    fetchDebts().then((fn) => {
      if (fn) cancelFn = fn;
    });
    return () => {
      cancelFn();
    };
  }, [fetchDebts]);

  const addDebt = async (debtData: Omit<Debt, "id">) => {
    try {
      const newDebt = await api.post<Debt>("/debts", debtData);
      setDebts((prev) => [...prev, newDebt]);
      showSuccess("Dívida adicionada com sucesso!");
    } catch {
      showError("Erro ao adicionar dívida.");
    }
  };

  const updateDebt = async (id: string, debtData: Partial<Debt>) => {
    try {
      const updatedDebt = await api.put<Debt>(`/debts/${id}`, debtData);
      setDebts((prev) => prev.map((d) => (d.id === id ? updatedDebt : d)));
      showSuccess("Dívida atualizada!");
    } catch {
      showError("Erro ao atualizar dívida.");
    }
  };

  const deleteDebt = async (id: string) => {
    if (!await confirmAction('Deseja excluir esta dívida?')) return;
    try {
      await api.delete(`/debts/${id}`);
      setDebts((prev) => prev.filter((d) => d.id !== id));
      showSuccess('Dívida excluída!');
    } catch {
      showError('Erro ao excluir dívida.');
    }
  };

  const totals = useMemo(() => {
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce(
      (sum, d) => sum + (d.minPayment ?? 0),
      0,
    );
    return { totalBalance, totalMinPayment };
  }, [debts]);

  return {
    debts,
    isLoading,
    error,
    addDebt,
    updateDebt,
    deleteDebt,
    totals,
    refresh: fetchDebts,
  };
};
