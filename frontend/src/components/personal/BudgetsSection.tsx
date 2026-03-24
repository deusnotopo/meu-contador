import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Target } from "lucide-react";

const CATEGORY_ICONS: Record<string, string> = {
  Moradia: "🏠", Mercado: "🛒", Delivery: "🍕", Transporte: "🚗",
  Saúde: "💊", Lazer: "🎬", Roupas: "👕", Outros: "📦",
};

// 50/30/20 groupings
const GROUPS = {
  Necessidades: ["Moradia", "Mercado", "Saúde", "Transporte"],
  Desejos: ["Lazer", "Delivery", "Roupas", "Outros"],
  Poupança: ["Investimentos", "Educação", "Reserva"],
};

export const BudgetsSection = () => {
  const { budgets, loading, addBudget } = useBudgets();
  const { transactions } = useTransactions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ category: "", limit: 0 });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = transactions.filter((t) => t.type === "expense" && t.date.startsWith(currentMonth));

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Math.abs(t.amount);
  });

  const handleSave = async () => {
    if (!formData.category || formData.limit <= 0) return;
    await addBudget({ category: formData.category, limit: formData.limit, month: currentMonth });
    setIsDialogOpen(false);
    setFormData({ category: "", limit: 0 });
  };

  const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (spentByCategory[b.category] || 0), 0);
  const totalAvailable = Math.max(0, totalLimit - totalSpent);
  const progressPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton" style={{ height: 120 }} />
        <div className="env-grid">
          <div className="skeleton" style={{ height: 110 }} />
          <div className="skeleton" style={{ height: 110 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero / Global budget summary */}
      <div className="hero" style={{ padding: "20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>
              Disponível p/ alocar
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--t1)", letterSpacing: "-1px", fontFamily: "var(--mono)" }}>
              {formatCurrency(totalAvailable)}
            </div>
            <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>
              de {formatCurrency(totalLimit)} orçado
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                style={{
                  width: 36, height: 36, borderRadius: 12, background: "var(--glass2)",
                  border: "1px solid var(--border)", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", color: "var(--t1)"
                }}
              >
                <Plus size={18} />
              </button>
            </DialogTrigger>
            <DialogContent className="glass-premium border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black tracking-tight">Novo Envelope</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {Object.values(GROUPS).flat().map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Limite Mensal (R$)"
                  value={formData.limit || ""}
                  onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                  className="h-12 bg-white/5 border-white/10 rounded-xl"
                />
                <button className="btn-p" onClick={handleSave}>Criar</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="prog" style={{ margin: 0 }}>
          <div className="prog-fill" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #4A8BFF, #9B7FFF)" }} />
        </div>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhum envelope criado"
          description="Crie envelopes para limitar seus gastos mensais nas categorias."
          actionLabel="Criar Envelope"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <>
          {Object.entries(GROUPS).map(([groupName, categories]) => {
            const groupBudgets = budgets.filter((b) => categories.includes(b.category));
            if (groupBudgets.length === 0) return null;

            return (
              <div key={groupName} style={{ marginTop: 16 }}>
                <div className="sec-hd">
                  <span className="sec-title">{groupName}</span>
                </div>
                <div className="env-grid">
                  {groupBudgets.map((b) => {
                    const spent = spentByCategory[b.category] || 0;
                    const pct = Math.min(100, (spent / b.limit) * 100);
                    const isAlert = pct >= 90;

                    return (
                      <div key={b.id} className="env">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div className="env-ico">{CATEGORY_ICONS[b.category] || "📦"}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: isAlert ? "var(--red)" : "var(--t3)", fontFamily: "var(--mono)" }}>
                            {Math.round(pct)}%
                          </div>
                        </div>
                        <div className="env-name">{b.category}</div>
                        <div className="env-val">{formatCurrency(Math.max(0, b.limit - spent))}</div>
                        <div className="env-sub">disponível de {formatCurrency(b.limit)}</div>
                        <div className="prog" style={{ marginTop: 10, height: 3 }}>
                          <div className="prog-fill" style={{ width: `${pct}%`, background: isAlert ? "var(--red)" : "var(--blue)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Ulysses Nudge */}
      <div className="nudge success" style={{ marginTop: 20 }}>
        <div className="nudge-ttl" style={{ color: "var(--green)" }}>Ulysses Contract</div>
        <div className="nudge-body">Bloquear excedente de Lazer e redirecionar para Tesouro Direto todo dia 25?</div>
        <button className="btn-s" style={{ marginTop: 10, padding: 8, fontSize: 11 }}>Ativar regra</button>
      </div>
    </div>
  );
};
