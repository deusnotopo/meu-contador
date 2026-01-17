import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { loadReminders, saveReminders } from "@/lib/storage";
import { showSuccess, showError } from "@/lib/toast";
import { useRole } from "@/context/AuthContext";
import type { BillReminder, Transaction } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

export const OpenBillsWidget = () => {
  const [bills, setBills] = useState<BillReminder[]>([]);
  const { addTransaction } = useTransactions("personal");
  const { isViewer } = useRole();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const reminders = loadReminders();
    const unpaid = reminders
      .filter((r) => !r.isPaid)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4); // Show top 4
    setBills(unpaid);
  };

  const handlePay = (bill: BillReminder) => {
    // 1. Mark as paid
    const allReminders = loadReminders();
    const updated = allReminders.map((r) =>
      r.id === bill.id ? { ...r, isPaid: true } : r
    );
    saveReminders(updated);

    // 2. Create transaction
    const newTransaction: Omit<Transaction, "id"> = {
      type: "expense",
      amount: bill.amount,
      category: bill.category,
      description: `Pgto: ${bill.name}`,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Conta Corrente",
      recurring: false,
      scope: "personal",
      notes: "Pagamento de conta agendada",
    };
    addTransaction(newTransaction as any);

    showSuccess(`Conta "${bill.name}" paga com sucesso!`);
    loadData(); // Refresh list
  };

  if (bills.length === 0) return null;

  return (
    <div className="premium-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-widest">
          <Bell className="text-amber-400" size={16} />
          Contas em Aberto
        </h4>
        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 text-slate-400">
          {bills.length} PENDENTES
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence mode="popLayout">
          {bills.map((bill) => {
            const isOverdue = new Date(bill.dueDate) < new Date();
            const isToday =
              new Date(bill.dueDate).toISOString().split("T")[0] ===
              new Date().toISOString().split("T")[0];

            return (
              <motion.div
                key={bill.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`
                  group p-4 rounded-2xl border transition-all
                  ${
                    isOverdue
                      ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                      : isToday
                      ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-bold text-white text-sm leading-tight mb-1">
                      {bill.name}
                    </h5>
                    <div className="flex items-center gap-2">
                       <Clock size={12} className={isOverdue ? "text-rose-400" : "text-slate-500"} />
                       <span className={`text-[10px] font-bold uppercase tracking-wide ${isOverdue ? "text-rose-400" : "text-slate-500"}`}>
                        {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                       </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-black text-white">
                      <PrivacyValue value={bill.amount} />
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => isViewer ? showError("Somente leitura") : handlePay(bill)}
                  disabled={isViewer}
                  className={`
                    w-full h-9 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                    ${
                        isOverdue 
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/20" 
                        : "bg-white hover:bg-indigo-50 text-indigo-950"
                    }
                  `}
                >
                  <Check size={14} className="mr-2" />
                  Confirmar Pagamento
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
