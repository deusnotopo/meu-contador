import React, { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useTour } from "@/hooks/useTour";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";

import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";

interface EnvelopesViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Moradia: "🏠", Mercado: "🛒", Delivery: "🍕", Transporte: "🚗",
  Saúde: "💊", Lazer: "🎬", Roupas: "👕", Outros: "📦", Viagem: "✈️",
  Emergência: "🛡️", Investimentos: "📈", Educação: "🎓", Imóvel: "🏡", Poupança: "💰",
};

const CATEGORY_TABS = ["Necessidades", "Desejos", "Poupança"];

export const EnvelopesView = ({ onBack, onNavigate }: EnvelopesViewProps) => {
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLimit, setEditLimit] = useState("");
  
  // Create Modal
  const [isCreating, setIsCreating] = useState(false);
  const [createCategory, setCreateCategory] = useState("");
  const [createLimit, setCreateLimit] = useState("");

  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { startTour } = useTour();

  React.useEffect(() => {
    if (!selectedEnvelope && budgets.length > 0) {
      startTour('budgets');
    }
  }, [startTour, selectedEnvelope, budgets.length]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const spentByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense" && t.date.startsWith(currentMonth));
    const totals: Record<string, number> = {};
    expenses.forEach(t => {
      const cat = t.category.trim();
      const capCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      totals[capCat] = (totals[capCat] || 0) + Math.abs(t.amount);
    });
    return totals;
  }, [transactions, currentMonth]);

  // Derived budget info
  const mappedEnvelopes = budgets.map(b => {
    const cat = b.category.charAt(0).toUpperCase() + b.category.slice(1);
    return {
      id: b.id,
      category: cat,
      icon: CATEGORY_ICONS[cat] || "📦",
      limit: b.limit,
      spent: spentByCategory[cat] || 0
    };
  });

  const totalLimit = mappedEnvelopes.reduce((acc, e) => acc + e.limit, 0);
  const totalSpent = mappedEnvelopes.reduce((acc, e) => acc + e.spent, 0);
  const totalAvail = Math.max(0, totalLimit - totalSpent);
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // Sorting envelopes into groups pseudo-intelligently based on common Brazil categories
  const necessidadesCats = ["Moradia", "Transporte", "Mercado", "Saúde", "Educação"];
  const poupancaCats = ["Emergência", "Investimentos", "Imóvel", "Poupança"];

  const getGroup = (cat: string) => {
    if (necessidadesCats.includes(cat)) return "Necessidades";
    if (poupancaCats.includes(cat)) return "Poupança";
    return "Desejos"; // default fallback
  };

  const handleSaveEdit = async (id: string) => {
    if (!editLimit) return;
    await updateBudget(id, { limit: Number(editLimit) });
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remover este envelope?")) {
      await deleteBudget(id);
      setSelectedEnvelope(null);
    }
  };

  const handleCreate = async () => {
    if (!createCategory || !createLimit) return;
    const catFormatted = createCategory.charAt(0).toUpperCase() + createCategory.slice(1);
    // Check if duplicate
    if (budgets.some(b => b.category.toLowerCase() === createCategory.toLowerCase())) {
      alert("Envelope para esta categoria já existe!");
      return;
    }
    await addBudget({ category: catFormatted, limit: Number(createLimit), month: currentMonth });
    setIsCreating(false);
    setCreateCategory("");
    setCreateLimit("");
  };

  const renderEnvelopeCard = (env: typeof mappedEnvelopes[0]) => {
    const pct = Math.min((env.spent / env.limit) * 100, 100);
    const isOver = env.spent > env.limit;
    return (
      <div key={env.id} className="envelope" onClick={() => setSelectedEnvelope(env.id)}>
        <div className="env-emoji">{env.icon}</div>
        <div className="env-name">{env.category}</div>
        <div className="env-val" style={isOver ? { color: 'var(--red)' } : {}}>
          {formatCurrency(env.spent).replace(',00','')}
        </div>
        <div className="progress-bar" style={{ height: '4px' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: isOver ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)' }} />
        </div>
        <div className="env-sub" style={isOver ? { color: 'var(--red)' } : {}}>
          {isOver ? `⚠ +${formatCurrency(env.spent - env.limit).replace(',00','')}` : `de ${formatCurrency(env.limit).replace(',00','')}`}
        </div>
      </div>
    );
  };

  // --- DETAIL VIEW ---
  if (selectedEnvelope) {
    const env = mappedEnvelopes.find(e => e.id === selectedEnvelope);
    if (!env) { setSelectedEnvelope(null); return null; }

    const isOver = env.spent > env.limit;
    const pct = Math.min((env.spent / env.limit) * 100, 100);
    const catTransactions = transactions
      .filter(t => t.type === "expense" && t.date.startsWith(currentMonth) && t.category.toLowerCase() === env.category.toLowerCase())
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div style={{ paddingTop: '10px', paddingBottom: '100px', animation: 'fsu 0.26s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <Button variant="ghost" size="icon" onClick={() => { setSelectedEnvelope(null); setIsEditing(false); }} className="rounded-xl">
            <ArrowLeft size={16} />
          </Button>
          <div style={{ fontSize: '28px' }}>{env.icon}</div>
          <div style={{ flex: 1 }}>
            <div className="page-title" style={{ fontSize: '22px', margin: 0 }}>{env.category}</div>
            {isOver && <span className="badge badge-red" style={{ marginTop: 4, display: 'inline-block' }}>Estourou {formatCurrency(Math.abs(env.spent - env.limit))}</span>}
          </div>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl" onClick={() => { setIsEditing(!isEditing); setEditLimit(env.limit.toString()); }}>
            <Edit2 size={16} color="var(--t2)" />
          </Button>
        </div>

        {isEditing ? (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label>Novo Limite (R$)</label>
              <input type="number" className="input" value={editLimit} onChange={e => setEditLimit(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="premium" className="flex-1" onClick={() => handleSaveEdit(env.id)}>Salvar</Button>
              <Button variant="ghost" className="px-4 text-rose-400" onClick={() => handleDelete(env.id)}>
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="hero" style={{ padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
              Gasto no mês atual
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 700, color: isOver ? 'var(--red)' : 'var(--t1)' }} className="mono">
                {formatCurrency(env.spent)}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--t2)' }}>de {formatCurrency(env.limit)}</span>
            </div>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: isOver ? 'var(--red)' : 'var(--green)' }} />
            </div>
            {isOver && (
              <div className="nudge warn" style={{ marginTop: '14px', background: 'var(--red-dim)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Atenção
                </div>
                Esse extra mensal de {formatCurrency(Math.abs(env.spent - env.limit))} poderia render <strong>R$ {(Math.abs(env.spent - env.limit) * 12 * 10).toLocaleString('pt-BR')}</strong> em 10 anos investido a 10% a.a.
              </div>
            )}
          </div>
        )}

        {/* Possible reallocation - visual representation only for now in MVP */}
        {isOver && (
          <>
            <div className="sec-hd"><span className="sec-title">Realocação possível</span></div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '13px', color: 'var(--t1)', marginBottom: '14px', lineHeight: 1.4 }}>
                De qual envelope você quer remover os <strong>{formatCurrency(Math.abs(env.spent - env.limit))}</strong> que faltam?
              </div>
              {mappedEnvelopes.filter(e => e.id !== env.id && e.spent < e.limit).slice(0,3).map(e => (
                <div key={e.id} className="row" style={{ cursor: 'pointer' }}>
                  <div className="row-ico" style={{ background: 'var(--glass2)' }}>{e.icon}</div>
                  <div className="row-main">
                    <div className="row-title">{e.category}</div>
                    <div className="row-sub">Sobra {formatCurrency(e.limit - e.spent)}</div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Cobrir</Button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sec-hd"><span className="sec-title">Transações no mês</span></div>
        <div className="card">
          {catTransactions.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
              Nenhum gasto em {env.category} este mês.
            </div>
          ) : (
            catTransactions.map(tx => (
              <div key={tx.id} className="row">
                <div className="row-ico" style={{ background: 'var(--glass2)' }}>{env.icon}</div>
                <div className="row-main">
                  <div className="row-title">{tx.description}</div>
                  <div className="row-sub">{formatShortDate(tx.date)}</div>
                </div>
                <div className="row-amount" style={{ color: 'var(--red)' }}>− {formatCurrency(Math.abs(tx.amount))}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div style={{ paddingTop: '10px', paddingBottom: '110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {onBack && (
          <Button variant="ghost" size="icon" onClick={() => onBack()} className="rounded-xl">
            <ArrowLeft size={16} />
          </Button>
        )}
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Orçamento mensal</div>
          <div className="page-title" style={{ margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            Envelopes
            <HelpButton tooltipText="Crie, edite e acompanhe envelopes por categoria para controlar gastos do mês." />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl" onClick={() => setIsCreating(true)}>
          <Plus size={18} color="var(--t1)" />
        </Button>
        <AreaTutorialButton area="budget" onNavigate={onNavigate} />
      </div>

      <div className="page-sub" style={{ marginBottom: '14px' }}>
        Zero-based — cada real tem um destino certo
      </div>

      <div className="hero" style={{ padding: 18, marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>
              Disponível para alocar
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green)' }} className="mono">
              {formatCurrency(totalAvail)}
            </div>
          </div>
        </div>
        <div className="prog" style={{ height: '8px' }}>
          <div
            className="prog-fill"
            style={{ width: `${Math.min(totalPct, 100)}%`, background: 'linear-gradient(90deg, #00D991, #4A8BFF)', }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t3)', marginTop: '4px' }}>
          <span className="mono">Consumido: {formatCurrency(totalSpent)}</span>
          <span className="mono">Total dos envelopes: {formatCurrency(totalLimit)}</span>
        </div>
      </div>

      {/* Creation form */}
      {isCreating && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--blue)', background: 'var(--blue3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Novo Envelope</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 2 }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Ex: Supermercado" 
                value={createCategory} 
                onChange={e => setCreateCategory(e.target.value)}
                style={{ background: 'var(--bg)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="number" 
                className="input" 
                placeholder="Limite R$" 
                value={createLimit} 
                onChange={e => setCreateLimit(e.target.value)}
                style={{ background: 'var(--bg)' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="premium" className="flex-1" onClick={handleCreate}>Criar</Button>
            <Button variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {budgets.length === 0 && !isCreating ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✉️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", marginBottom: 6 }}>Nenhum envelope definido</div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 20 }}>
            Divida sua renda em "envelopes" (categorias) para criar limites e controlar exatamente para onde seu dinheiro vai.
          </div>
          <Button variant="premium" onClick={() => setIsCreating(true)}>Criar meu primeiro envelope</Button>
        </div>
      ) : (
        CATEGORY_TABS.map(groupName => {
          const envsInGroup = mappedEnvelopes.filter(e => getGroup(e.category) === groupName);
          if (envsInGroup.length === 0) return null;
          
          return (
            <div key={groupName} style={{ marginBottom: 20 }}>
              <div className="sec-hd"><span className="sec-title">{groupName}</span></div>
              <div className="env-grid">
                {envsInGroup.map(renderEnvelopeCard)}
              </div>
            </div>
          );
        })
      )}

      {/* Orphane envelopes that don't fit the main categories */}
      {mappedEnvelopes.filter(e => !CATEGORY_TABS.includes(getGroup(e.category))).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="sec-hd"><span className="sec-title">Outros</span></div>
          <div className="env-grid">
            {mappedEnvelopes.filter(e => !CATEGORY_TABS.includes(getGroup(e.category))).map(renderEnvelopeCard)}
          </div>
        </div>
      )}
    </div>
  );
};