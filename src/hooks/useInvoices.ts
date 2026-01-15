import {
  loadInvoices,
  saveInvoices,
  STORAGE_EVENT,
  STORAGE_KEYS,
} from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import type { Invoice } from "@/types";
import { useEffect, useState } from "react";

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setInvoices(loadInvoices());

    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.INVOICES) {
        setInvoices(e.detail.data);
      }
    };

    window.addEventListener(STORAGE_EVENT as any, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange);
  }, []);

  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    try {
      const newInvoice: Invoice = {
        ...invoice,
        id: crypto.randomUUID(),
      };
      const updated = [...invoices, newInvoice];
      setInvoices(updated);
      saveInvoices(updated);
      showSuccess(`Nota Fiscal ${invoice.number} cadastrada!`);
    } catch (error) {
      showError("Erro ao cadastrar nota.");
    }
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    try {
      const updated = invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      );
      setInvoices(updated);
      saveInvoices(updated);
      showSuccess("Nota Fiscal atualizada.");
    } catch (error) {
      showError("Erro ao atualizar nota.");
    }
  };

  const deleteInvoice = (id: string) => {
    if (window.confirm("Deseja realmente excluir esta nota?")) {
      try {
        const updated = invoices.filter((inv) => inv.id !== id);
        setInvoices(updated);
        saveInvoices(updated);
        showSuccess("Nota Fiscal excluída.");
      } catch (error) {
        showError("Erro ao excluir nota.");
      }
    }
  };

  return {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  };
};
