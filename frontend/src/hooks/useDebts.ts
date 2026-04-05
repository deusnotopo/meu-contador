import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { Debt } from "@/types";
import { useEffect, useMemo, useState, useCallback } from "react";

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    let cancelled = false; // ← Flag para cleanup
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get<Debt[] | { items?: Debt[] }>("/debts");
      if (!cancelled) { // ← Verifica se componente ainda está montado
        const items = Array.isArray(response) ? response : (response?.items || []);
        setDebts(items);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Debts API Error:", err);
        setError("Dívidas indisponíveis no momento. Verifique sua conexão.");
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
    
    return () => { cancelled = true; }; // ← Cleanup function
  }, []);

  useEffect(() => {
    let cancelFn = () => {};
    fetchDebts().then(fn => { if (fn) cancelFn = fn; });
    return () => { cancelFn(); };
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
    if (window.confirm("Deseja excluir esta dívida?")) {
      try {
        await api.delete(`/debts/${id}`);
        setDebts((prev) => prev.filter((d) => d.id !== id));
        showSuccess("Dívida excluída!");
      } catch {
        showError("Erro ao excluir dívida.");
      }
    }
  };

  const totals = useMemo(() => {
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
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
