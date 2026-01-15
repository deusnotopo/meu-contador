import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personalCategories } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import {
  STORAGE_EVENT,
  STORAGE_KEYS,
  loadReminders,
  saveReminders,
} from "@/lib/storage";
import type { BillReminder } from "@/types";
import { Bell, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export const RemindersSection = () => {
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<BillReminder | null>(
    null
  );
  const [formData, setFormData] = useState<{
    name: string;
    amount: number;
    dueDate: string;
    category: string;
    recurring: "monthly" | "yearly" | "once";
  }>({
    name: "",
    amount: 0,
    dueDate: "",
    category: "",
    recurring: "monthly",
  });

  const today = new Date();

  useEffect(() => {
    setReminders(loadReminders());

    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.REMINDERS) {
        setReminders(e.detail.data);
      }
    };

    window.addEventListener(STORAGE_EVENT as any, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange);
  }, []);

  const handleSave = () => {
    if (!formData.name || formData.amount <= 0 || !formData.dueDate) return;

    let updatedReminders: BillReminder[];
    if (editingReminder) {
      updatedReminders = reminders.map((r) =>
        r.id === editingReminder.id
          ? {
              ...r,
              name: formData.name,
              amount: formData.amount,
              dueDate: formData.dueDate,
              category: formData.category,
              recurring: formData.recurring,
            }
          : r
      );
    } else {
      const newReminder: BillReminder = {
        id: Date.now(),
        name: formData.name,
        amount: formData.amount,
        dueDate: formData.dueDate,
        category: formData.category,
        isPaid: false,
        recurring: formData.recurring,
      };
      updatedReminders = [...reminders, newReminder];
    }

    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    setIsDialogOpen(false);
    setEditingReminder(null);
    setFormData({
      name: "",
      amount: 0,
      dueDate: "",
      category: "",
      recurring: "monthly",
    });
  };

  const handleEdit = (reminder: BillReminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      amount: reminder.amount,
      dueDate: reminder.dueDate,
      category: reminder.category,
      recurring: reminder.recurring,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const handleTogglePaid = (reminder: BillReminder) => {
    const updatedReminders = reminders.map((r) =>
      r.id === reminder.id ? { ...r, isPaid: !r.isPaid } : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const openNewDialog = () => {
    setEditingReminder(null);
    // Set default due date to next month same day
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormData({
      name: "",
      amount: 0,
      dueDate: nextMonth.toISOString().split("T")[0],
      category: "",
      recurring: "monthly",
    });
    setIsDialogOpen(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  // Sort reminders: unpaid first, then by due date
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
            <Bell size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Gestão de <span className="text-white">Pagamentos</span>
          </h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewDialog}
              className="h-10 px-6 rounded-xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-white/5 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={14} className="mr-2" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-premium border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {editingReminder ? "Editar" : "Novo"}{" "}
                <span className="premium-gradient-text">Lembrete</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Nome da Conta
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Aluguel, Internet..."
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-rose-500/20 text-white font-medium px-6"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Valor (R$)
                  </label>
                  <Input
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-rose-500/20 text-white px-6"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Vencimento
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-rose-500/20 text-white px-6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Categoria
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-rose-500/20 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {personalCategories.expense.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="focus:bg-white/10 focus:text-white"
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Frequência
                </label>
                <Select
                  value={formData.recurring}
                  onValueChange={(v: "monthly" | "yearly" | "once") =>
                    setFormData({ ...formData, recurring: v })
                  }
                >
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-rose-500/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="once">Uma única vez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-12 rounded-xl text-slate-400 font-bold"
                >
                  Descartar
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <div className="premium-card p-20 text-center">
          <Bell className="mx-auto text-white/5 mb-6" size={64} />
          <h4 className="text-xl font-black text-white mb-2 tracking-tight">
            Nenhuma Conta Pendente
          </h4>
          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            Organize seus boletos e pagamentos recorrentes para evitar multas e
            juros.
          </p>
          <Button
            onClick={openNewDialog}
            className="px-10 h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] transform transition-all hover:scale-105"
          >
            Agendar Pagamento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedReminders.map((r) => {
            const due = new Date(r.dueDate);
            const isOverdue = !r.isPaid && due < today;
            const isDueSoon =
              !r.isPaid &&
              due <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={r.id}
                className={`premium-card group transition-all duration-500 ${
                  r.isPaid ? "opacity-40 grayscale-[0.8]" : "hover:scale-[1.02]"
                }`}
              >
                <div className="p-6 md:p-8 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <button
                      onClick={() => handleTogglePaid(r)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        r.isPaid
                          ? "bg-emerald-500 text-black scale-90"
                          : isOverdue
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"
                      }`}
                    >
                      <Check size={20} strokeWidth={r.isPaid ? 3 : 2} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-black tracking-tight truncate ${
                            r.isPaid ? "text-slate-500" : "text-white"
                          }`}
                        >
                          {r.name}
                        </h4>
                        {r.category && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-1.5 py-0.5 bg-white/5 rounded">
                            {r.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        {isOverdue ? "Venceu" : "Vence"}:{" "}
                        <span
                          className={
                            isOverdue ? "text-rose-500" : "text-slate-300"
                          }
                        >
                          {formatDate(r.dueDate)}
                        </span>
                        {r.recurring !== "once" && (
                          <span className="flex items-center gap-1 opacity-50">
                            • {r.recurring === "monthly" ? "Mensal" : "Anual"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div className="space-y-1">
                      <p
                        className={`text-xl font-black tracking-tighter ${
                          r.isPaid
                            ? "text-slate-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {formatCurrency(r.amount)}
                      </p>
                      <div className="flex justify-end">
                        {r.isPaid ? (
                          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/10">
                            Confirmado
                          </div>
                        ) : isOverdue ? (
                          <div className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest border border-rose-500/10 animate-pulse">
                            Atrasado
                          </div>
                        ) : isDueSoon ? (
                          <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/10">
                            Prioridade
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                        onClick={() => handleEdit(r)}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 text-rose-500"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
