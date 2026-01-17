import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import {
  STORAGE_EVENT,
  STORAGE_KEYS,
  loadGoals,
  saveGoals,
} from "@/lib/storage";
import type { SavingsGoal } from "@/types";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
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
    setGoals(loadGoals());

    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.GOALS) {
        setGoals(e.detail.data);
      }
    };

    window.addEventListener(STORAGE_EVENT as any, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Metas de <span className="text-white">Economia</span>
          </h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewDialog}
              className="h-10 px-6 rounded-xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-white/5 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={14} className="mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-premium border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {editingGoal ? "Ajustar" : "Nova"}{" "}
                <span className="premium-gradient-text">Meta Financeira</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-8 pt-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Escolha um Símbolo
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? "bg-white text-black shadow-xl scale-110"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Nome da Meta
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Viagem de Férias, Carro Novo..."
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/20 text-white font-medium px-6"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Valor Alvo (R$)
                  </label>
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
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/20 text-white px-6"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
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
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/20 text-white px-6"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Prazo Estimado
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/20 text-white px-6"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-12 rounded-xl text-slate-400 font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest shadow-lg shadow-purple-500/20"
                >
                  Salvar Meta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="premium-card p-20 text-center">
          <TrendingUp className="mx-auto text-white/10 mb-6" size={64} />
          <h4 className="text-xl font-black text-white mb-2 tracking-tight">
            Comece sua Jornada de Independência
          </h4>
          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            Crie metas visuais para acompanhar sua evolução e realizar seus
            sonhos com clareza.
          </p>
          <Button
            onClick={openNewDialog}
            className="px-10 h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] transform transition-all hover:scale-105"
          >
            Definir Primeira Meta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;

            return (
              <div
                key={goal.id}
                className="premium-card group hover:scale-[1.03] transition-all duration-500"
              >
                <div className="p-1 px-8 pt-0">
                  <div
                    className={`h-1.5 w-1/2 mx-auto rounded-b-full bg-gradient-to-r ${
                      goal.color || "from-primary to-purple-600"
                    } opacity-50 group-hover:opacity-100 transition-opacity`}
                  />
                </div>

                <div className="p-8 space-y-8 relative">
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                      onClick={() => handleEdit(goal)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-white/10 transition-colors shadow-2xl">
                      {goal.icon}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-black text-white text-lg tracking-tight uppercase">
                        {goal.name}
                      </h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Saldo da Meta
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-white tracking-tighter">
                          {formatCurrency(goal.currentAmount).split(",")[0]}
                        </span>
                        <span className="text-slate-500 text-xs font-bold ml-1">
                          /{formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                        {Math.round(pct)}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                          goal.color || "from-indigo-500 to-purple-600"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Falta
                        </span>
                        <span className="text-xs font-bold text-white/80">
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Prazo
                        </span>
                        <span className="text-xs font-bold text-white/80">
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        onClick={() => handleAddMoney(goal, 100)}
                        className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/5"
                      >
                        +R$100
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAddMoney(goal, 500)}
                        className="flex-1 h-12 rounded-2xl bg-white text-black hover:bg-white/90 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/5"
                      >
                        +R$500
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
