import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { showSuccess, showError } from "@/lib/toast";
import { useRole } from "@/context/AuthContext";
import type { BillReminder, TransactionFormData } from "@/types";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Bell, Check, Clock } from "lucide-react";
import { useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";
import type { TabType } from "@/types/navigation";

interface OpenBillsWidgetProps {
  /** Pass the shared useReminders() context from GlobalDashboard to avoid double-fetching */
  remindersCtx: {
    reminders: BillReminder[];
    updateReminder: (id: string, data: Partial<Omit<BillReminder, "id">>) => Promise<BillReminder>;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  onNavigate?: (tab: TabType) => void;
}

export const OpenBillsWidget = ({ remindersCtx, onNavigate }: OpenBillsWidgetProps) => {
  const { reminders, updateReminder, isLoading, error, refetch } = remindersCtx;
  const { addTransaction } = useTransactions("personal");
  const { isViewer } = useRole();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const bills = reminders
    .filter((r) => !r.isPaid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const handlePay = async (bill: BillReminder) => {
    try {
      setProcessingId(bill.id);
      const newTransaction: TransactionFormData = {
        type: "expense",
        amount: bill.amount.toString(),
        category: bill.category,
        description: `Pgto: ${bill.name}`,
        date: new Date().toISOString().substring(0, 10),
        paymentMethod: "Conta Corrente",
        recurring: false,
        scope: "personal",
        notes: "Pagamento de conta agendada",
      };
      await addTransaction(newTransaction);
      await updateReminder(bill.id, { isPaid: true });
      showSuccess(`Conta "${bill.name}" paga com sucesso!`);
    } catch {
      showError(`Não foi possível registrar o pagamento de "${bill.name}".`);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bento-card bento-full p-6 flex justify-center items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin" aria-hidden />
        <p className="text-xs text-white/50 font-medium">Carregando contas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bento-card bento-full p-6 flex flex-col items-center gap-3">
        <AlertCircle size={22} className="text-amber-400 opacity-80" />
        <div className="text-center">
          <p className="text-[13px] font-bold text-white/70">Falha ao carregar contas</p>
          <p className="text-[11px] text-white/30 mt-0.5 leading-snug max-w-[200px]">{error}</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/15"
        >
          Tentar novamente
        </button>
      </div>
    );
  }


  if (bills.length === 0) {
    return (
      <div className="bento-card bento-full p-6 flex flex-col items-center gap-4">
        {/* Animated bell */}
        <motion.div
          animate={{ rotate: [0, 8, -8, 6, -4, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.7, ease: "easeInOut" }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(0,217,145,0.08)", border: "1px solid rgba(0,217,145,0.2)" }}
          aria-hidden
        >
          <Bell size={24} className="text-emerald-400" />
        </motion.div>
        <div className="text-center">
          <p className="text-[14px] font-bold text-white/80 mb-1">
            Nenhuma conta pendente 🎉
          </p>
          <p className="text-[12px] text-white/35 leading-snug max-w-[200px]">
            Seus próximos vencimentos aparecerão aqui automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.("notifications")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-blue-300 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-400/30 transition-all active:scale-95"
          aria-label="Agendar nova conta"
        >
          <Bell size={13} aria-hidden />  Agendar Conta
        </button>
      </div>
    );
  }

  return (
    <div className="bento-card bento-full p-5 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h4 className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
          <Bell className="text-amber-400" size={14} aria-hidden />
          Contas em Aberto
        </h4>
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
          aria-label={`${bills.length} contas pendentes`}
        >
          {bills.length} PENDENTES
        </span>
      </div>

      <div
        className="space-y-3 flex-1 overflow-y-auto pr-1"
        role="list"
        aria-label="Contas em aberto"
      >
        <AnimatePresence mode="popLayout">
          {bills.map((bill) => {
            // "en-CA" generates strict YYYY-MM-DD from browser's local timezone
            const localToday = new Date().toLocaleDateString("en-CA");
            const isOverdue = bill.dueDate < localToday;
            const isToday = bill.dueDate === localToday;
            const isProcessing = processingId === bill.id;

            return (
              <motion.div
                key={bill.id}
                role="listitem"
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
                      <Clock
                        size={12}
                        className={isOverdue ? "text-rose-400" : "text-neutral-500"}
                        aria-hidden
                      />
                      <time
                        dateTime={bill.dueDate}
                        className={`text-[10px] font-bold uppercase tracking-wide ${isOverdue ? "text-rose-400" : "text-neutral-500"}`}
                      >
                        {isOverdue && "Vencida · "}
                        {new Date(bill.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                      </time>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-black text-white" aria-label={`Valor: ${bill.amount}`}>
                      <PrivacyValue value={bill.amount} />
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => (isViewer ? showError("Somente leitura") : handlePay(bill))}
                  disabled={isViewer || isProcessing}
                  aria-busy={isProcessing}
                  aria-label={`Confirmar pagamento de ${bill.name}`}
                  className={`
                    w-full h-9 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                    ${
                      isOverdue
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                        : "bg-white hover:bg-indigo-50 text-indigo-950"
                    }
                  `}
                >
                  <Check size={14} className="mr-2" aria-hidden />
                  {isProcessing ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
