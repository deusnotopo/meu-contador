import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";
import { logAction } from "@/lib/audit-service";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { TransactionSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type {
  CategoryChartData,
  ChartDataItem,
  MonthlyData,
  Transaction,
  TransactionFormData,
} from "@/types";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { analyticsDB } from "@/services/DuckDBService";

const inflightPromises = new Map<string, Promise<Transaction[]>>();

export const useTransactions = (
  scope: "personal" | "business" = "personal",
) => {
  const { user } = useAuth();
  const currentWorkspaceId = user?.currentWorkspaceId || user?.uid || "";
  const userUid = user?.uid ?? null; // primitivo estável para dep array
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter] = useState<string>("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Akita Hook: Integração com a Gamificação Real do Backend
  const { checkTransactionAchievement } = useGamification();

  const isMounted = useRef(true);
  const lastIngestedRef = useRef<string>("");
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchTransactions = useCallback(async (force = false) => {
    if (!userUid) {
      if (isMounted.current) setIsLoading(false);
      return;
    }

    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    const cacheKey = `${scope}_${userUid}`;

    try {
      let promise = inflightPromises.get(cacheKey);

      if (!promise || force) {
        promise = api
          .get<Transaction[] | { items: Transaction[] }>(
            `/transactions?scope=${scope}`,
            {
              schema: z.union([
                z.array(TransactionSchema),
                z.object({ items: z.array(TransactionSchema) }),
              ]),
            },
          )
          .then((data) => {
            const items = Array.isArray(data) ? data : data.items;
            
            // Deduplicação DuckDB: Evita reconstruir a tabela se os dados não mudaram
            const dataHash = `${items.length}_${items[0]?.id || ''}`;
            if (dataHash !== lastIngestedRef.current || force) {
              analyticsDB.insertTransactions(items as Record<string, unknown>[]).catch(err => {
                logger.warn('[useTransactions] Falha na ingestão do DuckDB WASM', err);
              });
              lastIngestedRef.current = dataHash;
            } else {
              logger.debug(`[useTransactions] Ingestão DuckDB ignorada para ${scope} (sem mudanças).`);
            }
            
            return items;
          });

        inflightPromises.set(cacheKey, promise);

        promise.finally(() => {
          if (inflightPromises.get(cacheKey) === promise) {
            // Remove the promise from inflight after 2s to act as a micro-cache
            setTimeout(() => {
              if (inflightPromises.get(cacheKey) === promise) {
                inflightPromises.delete(cacheKey);
              }
            }, 2000);
          }
        });
      }

      const response = await promise;

      if (isMounted.current) {
        setTransactions(response);
      }
    } catch (err) {
      if (isMounted.current) {
        logger.error('[useTransactions] Transactions API Error', err);
        setError(
          "Não foi possível conectar ao servidor. Verifique sua conexão.",
        );
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }

    // Não retornamos a função de cleanup do fetch, a gestão agora é com isMounted
  }, [scope, userUid]);

  useEffect(() => {
    fetchTransactions();

    const handleRefresh = () => {
      fetchTransactions(true);
    };
    window.addEventListener("transaction-updated", handleRefresh);

    return () => {
      window.removeEventListener("transaction-updated", handleRefresh);
    };
  }, [fetchTransactions]);

  const addTransaction = async (formData: TransactionFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _token, ...safeForm } = formData as TransactionFormData & {
        _token?: string;
      };
      const payload = {
        ...safeForm,
        amount: parseFloat(safeForm.amount),
        scope: safeForm.scope || scope,
      };
      const newTransaction = await api.post<Transaction>(
        "/transactions",
        payload,
      );
      setTransactions((prev) => [newTransaction, ...prev]);

      if (currentWorkspaceId) {
        logAction(
          currentWorkspaceId,
          "CREATE_TRANSACTION",
          `${payload.type === "income" ? "Receita" : "Despesa"}: ${payload.description} (R$ ${payload.amount})`,
        );
      }

      // Dispara motor de gamificação real após o loop crítico estar seguro
      checkTransactionAchievement();

      showSuccess("Transação adicionada com sucesso!");

      return newTransaction;
    } catch (error) {
      showError("Erro ao adicionar transação. Verifique o servidor.");
      throw error;
    }
  };

  const updateTransaction = async (
    id: string,
    formData: TransactionFormData,
  ) => {
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        scope: formData.scope || scope,
      };
      const updatedTransaction = await api.put<Transaction>(
        `/transactions/${id}`,
        payload,
      );
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTransaction : t)),
      );

      if (currentWorkspaceId) {
        logAction(
          currentWorkspaceId,
          "UPDATE_TRANSACTION",
          `Editado: ${payload.description}`,
        );
      }

      showSuccess("Transação atualizada com sucesso!");
    } catch (_error) {
      showError("Erro ao atualizar transação.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!await confirmAction('Deseja realmente excluir esta transação?')) return;
    try {
      const deleted = transactions.find((t) => t.id === id);
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      if (currentWorkspaceId && deleted) {
        logAction(
          currentWorkspaceId,
          'DELETE_TRANSACTION',
          `Removido: ${deleted.description}`,
        );
      }

      showSuccess('Transação excluída com sucesso!');
    } catch (_error) {
      showError('Erro ao excluir transação.');
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filter !== "all") {
      filtered = filtered.filter((t) => t.type === filter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const startDate = new Date();

      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startDate.setMonth(now.getMonth() - 1);
      } else if (dateFilter === "year") {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions, filter, dateFilter, searchTerm]);

  const allTimeTotals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const categoryData = useMemo((): CategoryChartData[] => {
    const categoryTotals: Record<string, { income: number; expense: number }> =
      {};

    filteredTransactions.forEach((t) => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        const entry = categoryTotals[t.category];
        if (entry) entry.income += t.amount;
      } else {
        const entry = categoryTotals[t.category];
        if (entry) entry.expense += t.amount;
      }
    });

    return Object.entries(categoryTotals).map(([name, values]) => ({
      name,
      receitas: values.income,
      despesas: values.expense,
    }));
  }, [filteredTransactions]);

  const getPieChartData = (type: "income" | "expense"): ChartDataItem[] => {
    const filtered = filteredTransactions.filter((t) => t.type === type);
    const categoryTotals: Record<string, number> = {};

    filtered.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const monthlyTrend = useMemo((): MonthlyData[] => {
    const monthlyData: Record<string, MonthlyData> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey =
        date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, receitas: 0, despesas: 0 };
      }

      if (t.type === "income") {
        const entry = monthlyData[monthKey];
        if (entry) entry.receitas += t.amount;
      } else {
        const entry = monthlyData[monthKey];
        if (entry) entry.despesas += t.amount;
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  return {
    transactions,
    allTransactions: transactions,
    filteredTransactions,
    isLoading,
    filter,
    setFilter,
    dateFilter,
    setDateFilter,
    searchTerm,
    setSearchTerm,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totals,
    categoryData,
    getPieChartData,
    monthlyTrend,
    error,
    allTimeTotals, // Novo: Totais sem filtros para cálculos globais
    refresh: fetchTransactions,
  };
};
