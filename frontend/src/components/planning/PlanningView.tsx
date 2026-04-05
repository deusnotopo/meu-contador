import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import { WizardTrigger } from "@/components/onboarding/WizardTrigger";
import type { TabType } from "@/types/navigation";

const CATEGORY_ICONS: Record<string, string> = {
  Moradia: "🏠", Mercado: "🛒", Delivery: "🍕", Transporte: "🚗",
  Saúde: "💊", Lazer: "🎬", Roupas: "👕", Outros: "📦",
  Emergência: "🛡️", Investimentos: "📈", Educação: "📚", Imóvel: "🏡", Reserva: "💰",
};

const GROUPS = [
  { name: "Necessidades · 50%", categories: ["Moradia", "Transporte", "Mercado", "Saúde"] },
  { name: "Desejos · 30%", categories: ["Delivery", "Lazer", "Roupas", "Viagem", "Outros"] },
  { name: "Poupança · 20%", categories: ["Emergência", "Investimentos", "Educação", "Imóvel", "Reserva"] },
];

// ---- Envelope Detail sub-view ----
interface EnvelopeDetailProps {
  category: string;
  limit: number;
  spent: number;
  transactions: Array<{ id: string; description: string; amount: number; date: string; category: string }>;
  onBack: () => void;
}

const EnvelopeDetail = ({ category, limit, spent, transactions, onBack }: EnvelopeDetailProps) => {
  const available = limit - spent;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const isOver = spent > limit;
  const progressColor = isOver ? "var(--red)" : pct > 80 ? "var(--amber)" : "var(--blue)";

  const catTxns = transactions
    .filter(t => t.category.toLowerCase() === category.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ paddingTop: "8px", animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      {/* ── Header Flutuante Zen ── */}
      <div className="flex items-center gap-3 mb-6 sticky top-2 z-[60] bg-[#0A1220]/70 backdrop-blur-2xl px-4 py-3.5 rounded-[28px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-2">
        <button className="w-10 h-10 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-0.5">Envelope</div>
          <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2" style={{ margin: 0 }}>
            {CATEGORY_ICONS[category] || "📦"} {category}
          </div>
        </div>
      </div>
      <div className="px-2">

      {/* Hero card */}
      <div className="bento-card bento-full" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>
              {isOver ? "Estouro" : "Restando"}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: isOver ? "var(--red)" : "var(--green)", fontFamily: "var(--mono)", letterSpacing: "-1.5px" }}>
              {formatCurrency(Math.abs(available))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>Gasto</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>
              {formatCurrency(spent)}
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: progressColor }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--t3)", marginTop: 8, fontFamily: "var(--mono)", fontWeight: 500 }}>
          <span>{Math.round(pct)}% utilizado</span>
          <span>Limite: {formatCurrency(limit)}</span>
        </div>
      </div>

      {/* Insight */}
      {isOver ? (
        <div className="nudge warn" style={{ marginBottom: 14 }}>
          <div className="nudge-ttl" style={{ color: "var(--red)" }}>🚨 Envelope estourado</div>
          <div className="nudge-body">
            Você gastou <strong style={{ color: "var(--red)" }}>{formatCurrency(spent - limit)}</strong> acima do limite.
            Considere realocar de outro envelope.
          </div>
        </div>
      ) : pct > 80 ? (
        <div className="nudge warn" style={{ marginBottom: 14 }}>
          <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Quase no limite</div>
          <div className="nudge-body">
            Você usou <strong>{Math.round(pct)}%</strong> do orçamento de {category}. Restam <strong>{formatCurrency(available)}</strong>.
          </div>
        </div>
      ) : null}

      {/* Transactions of this category */}
      <div className="flex justify-between items-center mb-3 mt-4">
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Lançamentos do Envelope</span>
        <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--mono)", fontWeight: 500 }}>{catTxns.length} este mês</span>
      </div>
      {catTxns.length === 0 ? (
        <div className="bento-card bento-full" style={{ padding: "24px", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
          Nenhum lançamento em {category} este mês.
        </div>
      ) : (
        <div className="-mx-2">
          {catTxns.map((tx, i) => (
            <div key={tx.id || i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] px-2 rounded-xl transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] border border-white/[0.05] bg-white/[0.03]">{CATEGORY_ICONS[category] || "📦"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-100 truncate">{tx.description}</div>
                <div className="text-[11.5px] text-gray-500 truncate mt-0.5">{formatShortDate(tx.date)}</div>
              </div>
              <div className="text-[13.5px] font-semibold text-red-400 tabular-nums" style={{ fontFamily: 'var(--mono)' }}>− {formatCurrency(Math.abs(tx.amount))}</div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

// ---- Main PlanningView ----
interface PlanningViewProps {
  onBack?: (tab: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

interface UlyssesRule {
  threshold: number;
  destination: string;
  day: number;
  active: boolean;
}

const buildDefaultUlyssesRule = (monthlyIncome: number, totalBudget: number): UlyssesRule => {
  const incomeBasedThreshold = monthlyIncome > 0 ? monthlyIncome * 0.15 : 0;
  const budgetBasedThreshold = totalBudget > 0 ? totalBudget * 0.1 : 0;
  const threshold = Math.max(1000, Math.round(Math.max(incomeBasedThreshold, budgetBasedThreshold) / 100) * 100);

  return {
    threshold,
    destination: 'Investimentos',
    day: 10,
    active: true,
  };
};

export const PlanningView = ({ onBack: _onBack, onNavigate: _onNavigate }: PlanningViewProps = {}) => {
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);
  const [showUlyssesModal, setShowUlyssesModal] = useState(false);
  const [showHistoryNotice, setShowHistoryNotice] = useState(false);
  const [ulyssesRule, setUlyssesRule] = useState(() => {
    const saved = localStorage.getItem('ulysses_rule');
    return saved ? JSON.parse(saved) as UlyssesRule : { threshold: 0, destination: 'Investimentos', day: 10, active: true };
  });

  const saveUlyssesRule = (newRule: UlyssesRule) => {
    setUlyssesRule(newRule);
    localStorage.setItem('ulysses_rule', JSON.stringify(newRule));
    setShowUlyssesModal(false);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = transactions.filter((t) => t.type === "expense" && t.date.startsWith(currentMonth));

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    const key = t.category.charAt(0).toUpperCase() + t.category.slice(1);
    spentByCategory[key] = (spentByCategory[key] || 0) + Math.abs(t.amount);
  });

  const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (spentByCategory[b.category] || 0), 0);
  const totalAvailable = Math.max(0, totalLimit - totalSpent);
  const progressPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;
  const totalIncome = useMemo(
    () => transactions
      .filter((t) => t.type === "income" && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    [transactions, currentMonth]
  );
  const recommendedUlyssesRule = useMemo(
    () => buildDefaultUlyssesRule(totalIncome, totalLimit),
    [totalIncome, totalLimit]
  );

  useEffect(() => {
    const saved = localStorage.getItem('ulysses_rule');
    if (!saved && ulyssesRule.threshold <= 0) {
      setUlyssesRule(recommendedUlyssesRule);
      localStorage.setItem('ulysses_rule', JSON.stringify(recommendedUlyssesRule));
    }
  }, [recommendedUlyssesRule, ulyssesRule.threshold]);

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // If envelope is selected, show its detail view
  if (selectedEnvelope) {
    const budget = budgets.find(b => b.category === selectedEnvelope);
    const spent = spentByCategory[selectedEnvelope] || 0;
    return (
      <EnvelopeDetail
        category={selectedEnvelope}
        limit={budget?.limit || 0}
        spent={spent}
        transactions={transactions}
        onBack={() => setSelectedEnvelope(null)}
      />
    );
  }

  return (
    <div style={{ paddingTop: "8px", animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      {/* ── Header Flutuante Zen ── */}
      <div className="flex items-center gap-3 mb-6 sticky top-2 z-[60] bg-[#0A1220]/70 backdrop-blur-2xl px-4 py-3.5 rounded-[28px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-2">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-0.5">Orçamento zero-based</div>
            <div className="text-lg font-bold text-white tracking-tight leading-none">Envelopes</div>
          </div>
          <WizardTrigger label="Configurar" />
          <HelpButton tooltipText="Distribua a renda do mês por envelopes, acompanhe excesso e automatize regras de realocação." />
        </div>
      </div>

      <div className="px-2">
      <div className="text-center text-[12px] text-slate-400 mb-5 font-medium tracking-wide">
        {capitalizedMonth} · cada real tem um destino
      </div>

      <div className="bento-card bento-full" style={{ padding: "22px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "4px" }}>Disponível p/ alocar</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--green)", fontFamily: "var(--mono)", letterSpacing: "-1.5px" }}>{formatCurrency(totalAvailable)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "4px" }}>Alocado</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>{formatCurrency(totalSpent)}</div>
          </div>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#00D991,#4A8BFF)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--t3)", marginTop: "8px", fontFamily: "var(--mono)", fontWeight: 500 }}>
          <span>{Math.round(progressPct)}% alocado</span>
          <span>Total: {formatCurrency(totalLimit)}</span>
        </div>
      </div>

      {GROUPS.map(group => {
        const groupBudgets = budgets.filter((b) => group.categories.includes(b.category));
        if (groupBudgets.length === 0) {
          if (budgets.length === 0) return null;
          return (
            <div key={group.name} style={{ marginBottom: 16 }}>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">{group.name}</div>
              <div className="bento-card bento-full" style={{ padding: "16px", textAlign: "center", color: "var(--t3)", fontSize: 11, borderStyle: "dashed" }}>
                Nenhum envelope em {group.name.split(' · ')[0]}
              </div>
            </div>
          );
        }

        const displayItems = groupBudgets.length > 0 ? groupBudgets.map(b => {
          const spent = spentByCategory[b.category] || 0;
          return {
            ic: CATEGORY_ICONS[b.category] || "📦",
            nm: b.category,
            us: spent,
            tt: b.limit,
            pc: b.limit > 0 ? (spent / b.limit) * 100 : 0
          };
        }) : group.categories.slice(0, 4).map(cat => ({
          ic: CATEGORY_ICONS[cat] || "📦",
          nm: cat,
          us: spentByCategory[cat] || 0,
          tt: 0,
          pc: 0
        }));

        const isSavingsGroup = group.name.includes('Poupança');

        return (
          <div key={group.name} style={{ marginBottom: 20 }}>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">{group.name}</div>
            <div className="bento-grid" style={{ marginBottom: 0 }}>
              {displayItems.map((item, idx) => {
                let progressColor = "var(--blue)";
                if (item.pc >= 100 && !isSavingsGroup) {
                  progressColor = group.name.includes('Necessidades') ? "var(--amber)" : "var(--red)";
                } else if (item.pc >= 80 && !isSavingsGroup) {
                  progressColor = "var(--amber)";
                } else if (item.pc === 100 && isSavingsGroup) {
                  progressColor = "var(--green)";
                }

                return (
                  <div
                    key={idx}
                    className="bento-card"
                    style={{ padding: "14px", cursor: "pointer", display: "flex", flexDirection: "column" }}
                    onClick={() => setSelectedEnvelope(item.nm)}
                  >
                    <div className="text-[20px] mb-2">{item.ic}</div>
                    <div className="text-[12px] font-bold text-white mb-1">{item.nm}</div>
                    <div className="text-[14px] font-black font-mono tracking-tight mb-2" style={{ color: item.pc > 100 ? "var(--red)" : item.pc === 100 && !isSavingsGroup ? "var(--amber)" : "var(--t1)" }}>
                      {formatCurrency(item.us).replace(',00', '')}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden flex w-full mb-2 mt-auto">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(item.pc, 100)}%`, background: progressColor }} />
                    </div>
                    <div className="text-[9.5px] font-bold uppercase tracking-widest" style={{ color: item.pc > 100 ? "var(--red)" : "var(--t3)" }}>
                      {item.pc > 100
                        ? `⚠ +${formatCurrency(item.us - item.tt)}`
                        : (item.pc === 100 && isSavingsGroup ? '✓ Completo' : item.tt > 0 ? `de ${formatCurrency(item.tt).replace(',00', '')}` : 'Toque p/ ver')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 mt-4">Ulysses Contract</div>
      <div className="bento-card bento-full border-blue-500/20" style={{ background: "linear-gradient(135deg, rgba(74,139,255,0.06), rgba(0,0,0,0))" }}>
        <div className="text-[12px] font-black uppercase tracking-widest mb-1.5" style={{ color: ulyssesRule.active ? "var(--green)" : "var(--amber)" }}>
          {ulyssesRule.active ? "✓ Regra automática ativa" : "⚠ Regra pausada"}
        </div>
        <div className="text-[12px] font-medium leading-relaxed text-white/80">
          Se saldo superar <strong className="text-white font-mono">{formatCurrency(ulyssesRule.threshold)}</strong> no dia {ulyssesRule.day} → enviar para {ulyssesRule.destination}.
        </div>
        <div style={{ fontSize: "10.5px", color: "var(--t3)", marginTop: "10px", lineHeight: 1.5 }}>
          Sugestão heurística atual: <strong>{formatCurrency(recommendedUlyssesRule.threshold)}</strong>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <Button 
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setShowUlyssesModal(true)}
          >
            Editar regra
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="flex-1 text-xs text-emerald-400 border-emerald-500/30"
            onClick={() => setShowHistoryNotice((prev) => !prev)}
          >
            Ver histórico
          </Button>
        </div>
        {showHistoryNotice && (
          <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[11px] font-bold text-white mb-1 uppercase tracking-widest">Aviso Operacional</div>
            <div className="text-[11px] text-white/50 leading-relaxed">
              O motor de agendamento está em aprovação (Open Finance). Por enquanto isso norteia o comportamento, transferências são manuais.
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Ulysses Config Modal */}
      {showUlyssesModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content" style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 24, padding: 30, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Contrato de Ulisses</h3>
            <p style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 25 }}>Configure o gatilho emocional para automatizar seu aporte.</p>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Gatilho (Saldo &gt; X)</label>
              <input 
                type="number" 
                defaultValue={ulyssesRule.threshold}
                id="ulysses-threshold"
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', color: 'white' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Destino</label>
              <select 
                id="ulysses-dest"
                defaultValue={ulyssesRule.destination}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', color: 'white' }}
              >
                <option value="Investimentos">📈 Investimentos (Geral)</option>
                <option value="Reserva">💰 Reserva Emergência</option>
                <option value="Imóvel">🏡 Fundo Imobiliário</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setShowUlyssesModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="secondary"
                className="flex-1 bg-emerald-400 text-black hover:bg-emerald-300"
                onClick={() => {
                  const threshold = Number((document.getElementById('ulysses-threshold') as HTMLInputElement).value);
                  const destination = (document.getElementById('ulysses-dest') as HTMLSelectElement).value;
                  saveUlyssesRule({ ...ulyssesRule, threshold, destination });
                }}
              >
                Salvar Contrato
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
