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
import {
  STORAGE_EVENT,
  STORAGE_KEYS,
  loadBudgets,
  saveBudgets,
} from "@/lib/storage";
import type { Budget, Transaction } from "@/types";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { PrivacyValue } from "../ui/PrivacyValue";

interface Props {
  transactions: Transaction[];
}

export const BudgetsSection = ({ transactions }: Props) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({ category: "", limit: 0 });

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const load = () => {
      const saved = loadBudgets();
      setBudgets(saved);
    };
    load();

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === STORAGE_KEYS.BUDGETS) {
        load();
      }
    };

    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);

  // Calculate spent per category from transactions
  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(currentMonth)
  );
  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
  });

  const handleSave = () => {
    if (!formData.category || formData.limit <= 0) return;

    let updatedBudgets: Budget[];
    if (editingBudget) {
      updatedBudgets = budgets.map((b) =>
        b.id === editingBudget.id
          ? { ...b, category: formData.category, limit: formData.limit }
          : b
      );
    } else {
      const newBudget: Budget = {
        id: Date.now(),
        category: formData.category,
        limit: formData.limit,
        spent: 0,
        month: currentMonth,
      };
      updatedBudgets = [...budgets, newBudget];
    }

    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
    setIsDialogOpen(false);
    setEditingBudget(null);
    setFormData({ category: "", limit: 0 });
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({ category: budget.category, limit: budget.limit });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const updatedBudgets = budgets.filter((b) => b.id !== id);
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
  };

  const openNewDialog = () => {
    setEditingBudget(null);
    setFormData({ category: "", limit: 0 });
    setIsDialogOpen(true);
  };

  // Get categories not yet used
  const usedCategories = budgets.map((b) => b.category);
  const availableCategories = personalCategories.expense.filter(
    (c) => !usedCategories.includes(c) || c === editingBudget?.category
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Target size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Gerenciamento de <span className="text-white">Orçamentos</span>
          </h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewDialog}
              className="h-10 px-6 rounded-xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-white/5 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={14} className="mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-premium border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {editingBudget ? "Editar" : "Novo"}{" "}
                <span className="premium-gradient-text">Orçamento</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-6">
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
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-indigo-500/20 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {availableCategories.map((cat) => (
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
                  Limite Mensal (R$)
                </label>
                <Input
                  type="number"
                  value={formData.limit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: Number(e.target.value) })
                  }
                  placeholder="Ex: 500"
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-indigo-500/20 text-white font-medium px-6"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <div className="premium-card p-10">
          <EmptyState
            icon={Target}
            title="Nenhum Orçamento Definido"
            description="Orçamentos ajudam você a não gastar mais do que planejou em categorias específicas."
            actionLabel="Criar Orçamento"
            onAction={openNewDialog}
            tips={[
              "Defina orçamentos realistas para categorias variáveis como Lazer, Alimentação e Uber.",
              "Um bom orçamento deve ser flexível: revise-o conforme seus gastos mudam.",
            ]}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const spent = spentByCategory[b.category] || 0;
            const pct = Math.min(100, (spent / b.limit) * 100);
            const isOverBudget = spent > b.limit;
            const isClosingIn = pct > 85 && !isOverBudget;

            return (
              <div
                key={b.id}
                className="premium-card group hover:scale-[1.02] transition-all duration-500"
              >
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                        {b.category}
                      </h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Orçamento Mensal
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        onClick={() => handleEdit(b)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-all"
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span
                          className={`text-2xl font-black tracking-tighter ${
                            isOverBudget ? "text-rose-500" : "text-white"
                          }`}
                        >
                          <PrivacyValue value={spent} />
                        </span>
                        <span className="text-slate-500 text-xs font-bold ml-2">
                          {" "}
                          / <PrivacyValue value={b.limit} />
                        </span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isOverBudget
                            ? "bg-rose-500/10 text-rose-500"
                            : isClosingIn
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {Math.round(pct)}%
                      </div>
                    </div>

                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${
                          isOverBudget
                            ? "bg-rose-500"
                            : isClosingIn
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-indigo-500 to-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {isOverBudget && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                        Excedeu <PrivacyValue value={spent - b.limit} /> do
                        planejado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
