import { api } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import type { Invoice } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Invoice[] | { items?: Invoice[] }>("/invoices");
      const items = Array.isArray(response) ? response : (response?.items || []);
      setInvoices(items);
    } catch (err: unknown) {
      // 403 = usuário free (proGuard). Não é um erro de UI — apenas não tem acesso.
      const is403 =
        (err instanceof Error && err.message.toLowerCase().includes("forbidden")) ||
        (err as { status?: number })?.status === 403 ||
        (err as { statusCode?: number })?.statusCode === 403;

      if (is403) {
        // Silent: plan gate, not a runtime error
        setInvoices([]);
      } else {
        setError("Falha ao carregar as notas fiscais.");
        showError("Falha ao carregar as notas fiscais.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, "id">) => {
    try {
      setError(null);
      // Backend automatically creates the invoice with a UUID and parses the date
      const newInvoice = await api.post<Invoice>("/invoices", invoice);
      setInvoices(prev => [...prev, newInvoice]);
      showSuccess(`Nota Fiscal ${invoice.number} cadastrada!`);
    } catch {
      const msg = "Erro ao cadastrar nota fiscal.";
      setError(msg);
      showError(msg);
    }
  }, []);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    try {
      setError(null);
      const updatedInvoice = await api.put<Invoice>(`/invoices/${id}`, updates);
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
      showSuccess("Nota Fiscal atualizada.");
    } catch {
      const msg = "Erro ao atualizar a nota fiscal.";
      setError(msg);
      showError(msg);
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    if (window.confirm("Deseja realmente excluir esta nota?")) {
      try {
        setError(null);
        await api.delete(`/invoices/${id}`);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        showSuccess("Nota Fiscal excluída.");
    } catch {
      const msg = "Erro crítico ao excluir a nota fiscal.";
        setError(msg);
        showError(msg);
      }
    }
  }, []);

  return {
    invoices,
    isLoading,
    error,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    refresh: fetchInvoices
  };
};
