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
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import { loadGoals, saveGoals } from "@/lib/storage";
import type { SavingsGoal } from "@/types";
import { Pencil, Plus, PlusCircle, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const GOAL_ICONS = ["🏦", "✈️", "🚗", "🏠", "💻", "📱", "🎓", "💍", "🏥", "🎯"];
const GOAL_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
];

export const GoalsSection = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    icon: "🎯",
  });

  useEffect(() => {
    const saved = loadGoals();
    setGoals(saved);
  }, []);

  const handleSave = () => {
    if (!formData.name || formData.targetAmount <= 0) return;

    let updatedGoals: SavingsGoal[];
    if (editingGoal) {
      updatedGoals = goals.map((g) =>
        g.id === editingGoal.id
          ? {
              ...g,
              name: formData.name,
              targetAmount: formData.targetAmount,
              currentAmount: formData.currentAmount,
              deadline: formData.deadline,
              icon: formData.icon,
            }
          : g
      );
    } else {
      const newGoal: SavingsGoal = {
        id: Date.now(),
        name: formData.name,
        targetAmount: formData.targetAmount,
        currentAmount: formData.currentAmount,
        deadline:
          formData.deadline ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        icon: formData.icon,
        color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
      };
      updatedGoals = [...goals, newGoal];
    }

    setGoals(updatedGoals);
    saveGoals(updatedGoals);
    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: "",
      icon: "🎯",
    });
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      icon: goal.icon,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const updatedGoals = goals.filter((g) => g.id !== id);
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  const handleAddMoney = (goal: SavingsGoal, amount: number) => {
    const updatedGoals = goals.map((g) =>
      g.id === goal.id
        ? {
            ...g,
            currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
          }
        : g
    );
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  const openNewDialog = () => {
    setEditingGoal(null);
    setFormData({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: "",
      icon: "🎯",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Suas Metas de Economia</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openNewDialog}>
              <Plus size={16} className="mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Nova Meta"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Ícone</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${
                        formData.icon === icon
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Nome da Meta</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Reserva de Emergência"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valor Alvo (R$)</label>
                  <Input
                    type="number"
                    value={formData.targetAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAmount: Number(e.target.value),
                      })
                    }
                    placeholder="10000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Já Economizado (R$)
                  </label>
                  <Input
                    type="number"
                    value={formData.currentAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentAmount: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Prazo</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
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

      {goals.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center">
            <TrendingUp
              className="mx-auto text-muted-foreground mb-4"
              size={48}
            />
            <p className="text-muted-foreground">
              Nenhuma meta de economia ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie metas para acompanhar seu progresso de economia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;

            return (
              <Card
                key={goal.id}
                className="shadow-card border-0 overflow-hidden group relative"
              >
                <div
                  className={`h-2 bg-gradient-to-r ${
                    goal.color || "from-primary to-purple-600"
                  }`}
                />
                <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(goal)}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-danger hover:text-danger"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="font-semibold">{goal.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} />
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    {remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Faltam {formatCurrency(remaining)}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddMoney(goal, 100)}
                      >
                        <PlusCircle size={14} className="mr-1" />
                        +R$100
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddMoney(goal, 500)}
                      >
                        +R$500
                      </Button>
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
