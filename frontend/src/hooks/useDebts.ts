import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { Debt } from "@/types";
import { useEffect, useMemo, useState } from "react";

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDebts = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Debt[]>("/debts");
      setDebts(data);
    } catch (error) {
      console.warn("Could not fetch debts, using empty state.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const addDebt = async (debtData: Omit<Debt, "id">) => {
    try {
      const newDebt = await api.post<Debt>("/debts", debtData);
      setDebts((prev) => [...prev, newDebt]);
      showSuccess("Dívida adicionada com sucesso!");
    } catch (error) {
      showError("Erro ao adicionar dívida.");
    }
  };

  const updateDebt = async (id: string, debtData: Partial<Debt>) => {
    try {
      const updatedDebt = await api.put<Debt>(`/debts/${id}`, debtData);
      setDebts((prev) => prev.map((d) => (d.id === id ? updatedDebt : d)));
      showSuccess("Dívida atualizada!");
    } catch (error) {
      showError("Erro ao atualizar dívida.");
    }
  };

  const deleteDebt = async (id: string) => {
    if (window.confirm("Deseja excluir esta dívida?")) {
      try {
        await api.delete(`/debts/${id}`);
        setDebts((prev) => prev.filter((d) => d.id !== id));
        showSuccess("Dívida excluída!");
      } catch (error) {
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
    addDebt,
    updateDebt,
    deleteDebt,
    totals,
    refresh: fetchDebts,
  };
};
