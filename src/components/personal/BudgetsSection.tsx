import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personalCategories } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { loadBudgets, saveBudgets } from "@/lib/storage";
import type { Budget, Transaction } from "@/types";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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
    const saved = loadBudgets();
    setBudgets(saved);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Orçamentos do Mês</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openNewDialog}>
              <Plus size={16} className="mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? "Editar Orçamento" : "Novo Orçamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Limite (R$)</label>
                <Input
                  type="number"
                  value={formData.limit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: Number(e.target.value) })
                  }
                  placeholder="Ex: 500"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center">
            <Target className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">
              Nenhum orçamento configurado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie orçamentos para controlar seus gastos por categoria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-primary" size={20} />
              Orçamentos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const spent = spentByCategory[b.category] || 0;
                const pct = Math.min(100, (spent / b.limit) * 100);
                const isOverBudget = spent > b.limit;

                return (
                  <div
                    key={b.id}
                    className="p-4 border rounded-xl group relative"
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(b)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:text-danger"
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{b.category}</span>
                      <span
                        className={`text-sm ${
                          isOverBudget
                            ? "text-danger font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(spent)} / {formatCurrency(b.limit)}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={
                        isOverBudget
                          ? "bg-danger/20"
                          : pct > 80
                          ? "bg-warning/20"
                          : ""
                      }
                    />
                    {isOverBudget && (
                      <p className="text-xs text-danger mt-1">
                        Orçamento excedido em {formatCurrency(spent - b.limit)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
