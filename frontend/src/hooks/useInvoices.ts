import { api, ApiRequestError } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";
import { InvoiceSchema } from "@/lib/schemas";
import { z } from "zod";
import type { Invoice } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { confirmAction } from "@/lib/confirm";

export const useInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    // Don't even try if user is not PRO — invoices is a PRO-only feature
    if (!user?.isPro) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // AKITA MODE: Enforcing strict schema validation at the edge
      const response = await api.get<Invoice[]>("/invoices", {
        schema: z.union([
          z.array(InvoiceSchema),
          z.object({ items: z.array(InvoiceSchema) }).transform(val => val.items)
        ])
      });
      setInvoices(response);
    } catch (err: unknown) {
      // 403 = plan gate (proGuard). Silent — not a runtime error.
      if (err instanceof ApiRequestError && err.status === 403) {
        setInvoices([]);
      } else if (err instanceof z.ZodError) {
        setError("Dados do servidor incompatíveis.");
        console.error("Zod Validation Error (Invoices):", err.errors);
      } else {
        setError("Falha ao carregar as notas fiscais.");
        showError("Falha ao carregar as notas fiscais.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.isPro]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, "id">) => {
    try {
      setError(null);
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
    if (!await confirmAction('Deseja realmente excluir esta nota?')) return;
    try {
      setError(null);
      await api.delete(`/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      showSuccess('Nota Fiscal excluída.');
    } catch {
      const msg = 'Erro crítico ao excluir a nota fiscal.';
      setError(msg);
      showError(msg);
    }
  }, []);

  return {
    invoices,
    isLoading,
    error,
    isPro: !!user?.isPro,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    refresh: fetchInvoices
  };
};
