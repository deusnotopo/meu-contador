import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { loadReminders, saveReminders } from "@/lib/storage";
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
    const saved = loadReminders();
    setReminders(saved);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="text-primary" size={20} />
          Lembretes de Contas
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openNewDialog}>
              <Plus size={16} className="mr-2" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Nome da Conta</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Aluguel"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valor (R$)</label>
                  <Input
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="1500"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Data de Vencimento
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
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
                    {personalCategories.expense.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Recorrência</label>
                <Select
                  value={formData.recurring}
                  onValueChange={(v: "monthly" | "yearly" | "once") =>
                    setFormData({ ...formData, recurring: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="once">Uma vez</SelectItem>
                  </SelectContent>
                </Select>
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

      {reminders.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">
              Nenhum lembrete de conta ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione lembretes para nunca esquecer de pagar suas contas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedReminders.map((r) => {
            const due = new Date(r.dueDate);
            const isOverdue = !r.isPaid && due < today;
            const isDueSoon =
              !r.isPaid &&
              due <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

            return (
              <Card
                key={r.id}
                className={`shadow-card border-0 group ${
                  r.isPaid ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{r.name}</h4>
                        {r.category && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {r.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vence: {formatDate(r.dueDate)}
                        {r.recurring !== "once" && (
                          <span className="ml-1">
                            ({r.recurring === "monthly" ? "mensal" : "anual"})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="font-bold text-lg">
                          {formatCurrency(r.amount)}
                        </p>
                        {r.isPaid ? (
                          <Badge className="bg-success/10 text-success">
                            <Check size={12} className="mr-1" />
                            Pago
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive">Atrasado</Badge>
                        ) : isDueSoon ? (
                          <Badge className="bg-warning/10 text-warning">
                            Em breve
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleTogglePaid(r)}
                          title={
                            r.isPaid
                              ? "Marcar como não pago"
                              : "Marcar como pago"
                          }
                        >
                          <Check
                            size={14}
                            className={r.isPaid ? "text-success" : ""}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(r)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-danger hover:text-danger"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
