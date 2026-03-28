import {
  loadInvoices,
  saveInvoices,
  STORAGE_EVENT,
  STORAGE_KEYS,
} from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import type { Invoice } from "@/types";
import { useEffect, useState, useCallback } from "react";

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const data = loadInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError("Falha ao carregar as notas fiscais do dispositivo.");
      showError("Falha ao carregar as notas fiscais.");
    } finally {
      setIsLoading(false);
    }

    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.INVOICES) {
        setInvoices(e.detail.data);
      }
    };

    window.addEventListener(STORAGE_EVENT as any, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange);
  }, []);

  const addInvoice = useCallback((invoice: Omit<Invoice, "id">) => {
    try {
      setError(null);
      const newInvoice: Invoice = {
        ...invoice,
        id: crypto.randomUUID(),
      };
      const updated = [...invoices, newInvoice];
      setInvoices(updated);
      saveInvoices(updated);
      showSuccess(`Nota Fiscal ${invoice.number} cadastrada!`);
    } catch (error) {
      const msg = "Erro ao cadastrar nota fiscal no armazenamento local.";
      setError(msg);
      showError(msg);
    }
  }, [invoices]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    try {
      setError(null);
      const updated = invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      );
      setInvoices(updated);
      saveInvoices(updated);
      showSuccess("Nota Fiscal atualizada.");
    } catch (error) {
      const msg = "Erro ao atualizar a nota fiscal.";
      setError(msg);
      showError(msg);
    }
  }, [invoices]);

  const deleteInvoice = useCallback((id: string) => {
    if (window.confirm("Deseja realmente excluir esta nota?")) {
      try {
        setError(null);
        const updated = invoices.filter((inv) => inv.id !== id);
        setInvoices(updated);
        saveInvoices(updated);
        showSuccess("Nota Fiscal excluída.");
      } catch (error) {
        const msg = "Erro crítico ao excluir a nota fiscal.";
        setError(msg);
        showError(msg);
      }
    }
  }, [invoices]);

  return {
    invoices,
    isLoading,
    error,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  };
};
