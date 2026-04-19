import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import { WizardTrigger } from "@/components/onboarding/WizardTrigger";
import type { TabType } from "@/types/navigation";
import {
  BUDGET_CATEGORY_ICONS,
  BUDGET_GROUP_ORDER,
  BUDGET_GROUPS,
  buildSpentByCategory,
  mapBudgetsWithInsights,
} from "@/features/budgets/budget-utils";
import { BudgetService } from "@/services/BudgetService";

const GROUPS = BUDGET_GROUP_ORDER.map((group) => ({
  name: `${group}${group === "Necessidades" ? " · 50%" : group === "Desejos" ? " · 30%" : " · 20%"}`,
  categories: [...BUDGET_GROUPS[group]],
}));

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
    <div className="pt-2 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sticky top-2 z-[60] bg-[#0A1220]/80 backdrop-blur-2xl px-3 py-2.5 rounded-[22px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-1">
        <button
          className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          onClick={onBack}
          aria-label="Voltar"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-0.5">Envelope</div>
          <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {BUDGET_CATEGORY_ICONS[category] || "📦"} {category}
          </div>
        </div>
      </div>

      <div className="px-2">
        {/* Hero card */}
        <div className="bento-card bento-full p-[22px] mb-4">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-[10px] text-[var(--t3)] uppercase tracking-widest font-bold mb-1">
                {isOver ? "Estouro" : "Restando"}
              </div>
              <div
                className="text-[32px] font-bold font-mono tracking-[-1.5px]"
                style={{ color: isOver ? "var(--red)" : "var(--green)" }}
              >
                {formatCurrency(Math.abs(available))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[var(--t3)] uppercase tracking-widest font-bold mb-1">Gasto</div>
              <div className="text-[26px] font-bold font-mono text-[var(--t1)] tracking-[-1px]">
                {formatCurrency(spent)}
              </div>
            </div>
          </div>

          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: progressColor }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--t3)] mt-2 font-mono font-medium">
            <span>{Math.round(pct)}% utilizado</span>
            <span>Limite: {formatCurrency(limit)}</span>
          </div>
        </div>

        {/* Insight nudge */}
        {isOver ? (
          <div className="nudge warn mb-3">
            <div className="nudge-ttl" style={{ color: "var(--red)" }}>🚨 Envelope estourado</div>
            <div className="nudge-body">
              Você gastou <strong style={{ color: "var(--red)" }}>{formatCurrency(spent - limit)}</strong> acima do limite.
              Considere realocar de outro envelope.
            </div>
          </div>
        ) : pct > 80 ? (
          <div className="nudge warn mb-3">
            <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Quase no limite</div>
            <div className="nudge-body">
              Você usou <strong>{Math.round(pct)}%</strong> do orçamento de {category}. Restam <strong>{formatCurrency(available)}</strong>.
            </div>
          </div>
        ) : null}

        {/* Transactions */}
        <div className="flex justify-between items-center mb-3 mt-4">
          <span className="font-bold text-[10px] tracking-widest uppercase text-neutral-400">Lançamentos do Envelope</span>
          <span className="text-[11px] text-[var(--t3)] font-mono font-medium">{catTxns.length} este mês</span>
        </div>

        {catTxns.length === 0 ? (
          <div className="bento-card bento-full p-6 text-center text-[var(--t3)] text-[13px]">
            Nenhum lançamento em {category} este mês.
          </div>
        ) : (
          <div className="-mx-2">
            {catTxns.map((tx, i) => (
              <div key={tx.id || i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] px-2 rounded-xl transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] border border-white/[0.05] bg-white/[0.03]">
                  {BUDGET_CATEGORY_ICONS[category] || "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white/90 truncate">{tx.description}</div>
                  <div className="text-[11.5px] text-[var(--t4)] truncate mt-0.5">{formatShortDate(tx.date)}</div>
                </div>
                <div className="text-[13.5px] font-semibold text-red-400 tabular-nums font-mono">
                  − {formatCurrency(Math.abs(tx.amount))}
                </div>
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
  return { threshold, destination: "Investimentos", day: 10, active: true };
};

const fieldClass = "w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-white outline-none focus:border-blue-500/50 transition-colors";
const labelClass = "block text-[10px] uppercase text-[var(--t3)] tracking-widest mb-2 font-semibold";

export const PlanningView = ({ onBack: _onBack, onNavigate: _onNavigate }: PlanningViewProps = {}) => {
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);
  const [showUlyssesModal, setShowUlyssesModal] = useState(false);
  const [showHistoryNotice, setShowHistoryNotice] = useState(false);
  const [ulyssesRule, setUlyssesRule] = useState(() => {
    const saved = localStorage.getItem("ulysses_rule");
    return saved ? JSON.parse(saved) as UlyssesRule : { threshold: 0, destination: "Investimentos", day: 10, active: true };
  });

  const saveUlyssesRule = (newRule: UlyssesRule) => {
    setUlyssesRule(newRule);
    localStorage.setItem("ulysses_rule", JSON.stringify(newRule));
    setShowUlyssesModal(false);
  };

  const currentMonth = BudgetService.getCurrentLocalMonth();
  const monthExpenses = transactions.filter(t => t.type === "expense" && t.date.startsWith(currentMonth));
  const spentByCategory = useMemo(() => buildSpentByCategory(monthExpenses, currentMonth), [monthExpenses, currentMonth]);
  const mappedBudgets = useMemo(() => mapBudgetsWithInsights(budgets, spentByCategory), [budgets, spentByCategory]);

  const totalLimit = mappedBudgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = mappedBudgets.reduce((acc, b) => acc + b.spent, 0);
  const totalAvailable = Math.max(0, totalLimit - totalSpent);
  const progressPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;

  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === "income" && t.date.startsWith(currentMonth)).reduce((acc, t) => acc + Math.abs(t.amount), 0),
    [transactions, currentMonth]
  );
  const recommendedUlyssesRule = useMemo(() => buildDefaultUlyssesRule(totalIncome, totalLimit), [totalIncome, totalLimit]);

  useEffect(() => {
    const saved = localStorage.getItem("ulysses_rule");
    if (!saved && ulyssesRule.threshold <= 0) {
      setUlyssesRule(recommendedUlyssesRule);
      localStorage.setItem("ulysses_rule", JSON.stringify(recommendedUlyssesRule));
    }
  }, [recommendedUlyssesRule, ulyssesRule.threshold]);

  const currentMonthName = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  if (selectedEnvelope) {
    const budget = mappedBudgets.find(b => b.category === selectedEnvelope);
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
    <div className="pt-2 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sticky top-2 z-[60] bg-[#0A1220]/80 backdrop-blur-2xl px-3 py-2.5 rounded-[22px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-1">
        <div className="flex-1 flex items-center gap-2">
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-0.5">Orçamento zero-based</div>
            <div className="text-lg font-bold text-white tracking-tight leading-none">Envelopes</div>
          </div>
          <WizardTrigger label="Configurar" />
          <HelpButton tooltipText="Distribua a renda do mês por envelopes, acompanhe excesso e automatize regras de realocação." />
        </div>
      </div>

      <div className="px-2">
        <div className="text-center text-[12px] text-[var(--t3)] mb-5 font-medium tracking-wide">
          {capitalizedMonth} · cada real tem um destino
        </div>

        {/* Summary card */}
        <div className="bento-card bento-full p-[22px] mb-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] text-[var(--t3)] uppercase tracking-widest font-bold mb-1">Disponível p/ alocar</div>
              <div className="text-[32px] font-bold font-mono text-[var(--green)] tracking-[-1.5px]">{formatCurrency(totalAvailable)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[var(--t3)] uppercase tracking-widest font-bold mb-1">Alocado</div>
              <div className="text-[26px] font-bold font-mono text-[var(--t1)] tracking-[-1px]">{formatCurrency(totalSpent)}</div>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#00D991,#4A8BFF)" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--t3)] mt-2 font-mono font-medium">
            <span>{Math.round(progressPct)}% alocado</span>
            <span>Total: {formatCurrency(totalLimit)}</span>
          </div>
        </div>

        {/* Envelope groups */}
        {GROUPS.map(group => {
          const groupBudgets = mappedBudgets.filter(b => (group.categories as readonly string[]).includes(b.category));
          if (groupBudgets.length === 0) {
            if (mappedBudgets.length === 0) return null;
            return (
              <div key={group.name} className="mb-4">
                <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-3">{group.name}</div>
                <div className="bento-card bento-full p-4 text-center text-[var(--t3)] text-[11px] border-dashed">
                  Nenhum envelope em {group.name.split(" · ")[0]}
                </div>
              </div>
            );
          }

          const displayItems = groupBudgets.map(b => ({
            ic: BUDGET_CATEGORY_ICONS[b.category] || "📦",
            nm: b.category,
            us: b.spent,
            tt: b.limit,
            pc: b.limit > 0 ? (b.spent / b.limit) * 100 : 0,
          }));

          const isSavingsGroup = group.name.includes("Poupança");

          return (
            <div key={group.name} className="mb-5">
              <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-3">{group.name}</div>
              <div className="bento-grid">
                {displayItems.map((item, idx) => {
                  let progressColor = "var(--blue)";
                  if (item.pc >= 100 && !isSavingsGroup) {
                    progressColor = group.name.includes("Necessidades") ? "var(--amber)" : "var(--red)";
                  } else if (item.pc >= 80 && !isSavingsGroup) {
                    progressColor = "var(--amber)";
                  } else if (item.pc === 100 && isSavingsGroup) {
                    progressColor = "var(--green)";
                  }

                  return (
                    <div
                      key={idx}
                      className="bento-card p-[14px] cursor-pointer flex flex-col hover:bg-white/[0.04] transition-colors"
                      onClick={() => setSelectedEnvelope(item.nm)}
                    >
                      <div className="text-[20px] mb-2">{item.ic}</div>
                      <div className="text-[12px] font-bold text-white mb-1">{item.nm}</div>
                      <div
                        className="text-[14px] font-black font-mono tracking-tight mb-2"
                        style={{ color: item.pc > 100 ? "var(--red)" : item.pc === 100 && !isSavingsGroup ? "var(--amber)" : "var(--t1)" }}
                      >
                        {formatCurrency(item.us).replace(",00", "")}
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full mb-2 mt-auto">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(item.pc, 100)}%`, background: progressColor }}
                        />
                      </div>
                      <div
                        className="text-[9.5px] font-bold uppercase tracking-widest"
                        style={{ color: item.pc > 100 ? "var(--red)" : "var(--t3)" }}
                      >
                        {item.pc > 100
                          ? `⚠ +${formatCurrency(item.us - item.tt)}`
                          : item.pc === 100 && isSavingsGroup
                          ? "✔ Completo"
                          : item.tt > 0
                          ? `de ${formatCurrency(item.tt).replace(",00", "")}`
                          : "Toque p/ ver"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Ulysses Contract */}
        <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-3 mt-4">Ulysses Contract</div>
        <div className="bento-card bento-full border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent">
          <div
            className="text-[12px] font-black uppercase tracking-widest mb-1.5"
            style={{ color: ulyssesRule.active ? "var(--green)" : "var(--amber)" }}
          >
            {ulyssesRule.active ? "✔ Regra automática ativa" : "⚠ Regra pausada"}
          </div>
          <div className="text-[12px] font-medium leading-relaxed text-white/80">
            Se saldo superar <strong className="text-white font-mono">{formatCurrency(ulyssesRule.threshold)}</strong> no dia {ulyssesRule.day} → enviar para {ulyssesRule.destination}.
          </div>
          <div className="text-[10.5px] text-[var(--t3)] mt-2.5 leading-relaxed">
            Sugestão heurística atual: <strong>{formatCurrency(recommendedUlyssesRule.threshold)}</strong>
          </div>
          <div className="flex gap-2 mt-2.5">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowUlyssesModal(true)}>
              Editar regra
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-emerald-400 border-emerald-500/30"
              onClick={() => setShowHistoryNotice(prev => !prev)}
            >
              Ver histórico
            </Button>
          </div>
          {showHistoryNotice && (
            <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="text-[11px] font-bold text-white mb-1 uppercase tracking-widest">Aviso Operacional</div>
              <div className="text-[11px] text-white/50 leading-relaxed">
                O motor de agendamento está em aprovação (Open Finance). Por enquanto transferências são manuais.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ulysses Config Modal */}
      {showUlyssesModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-5">
          <div className="bg-[var(--card-obsidian)] border border-[var(--border)] rounded-[24px] p-7 w-full max-w-[400px]">
            <h3 className="text-[20px] font-bold mb-2">Contrato de Ulisses</h3>
            <p className="text-[var(--t3)] text-[13px] mb-6">Configure o gatilho emocional para automatizar seu aporte.</p>

            <div className="mb-5">
              <label className={labelClass}>Gatilho (Saldo &gt; X)</label>
              <input
                type="number"
                defaultValue={ulyssesRule.threshold}
                id="ulysses-threshold"
                className={fieldClass}
              />
            </div>

            <div className="mb-5">
              <label className={labelClass}>Destino</label>
              <select id="ulysses-dest" defaultValue={ulyssesRule.destination} className={fieldClass}>
                <option value="Investimentos">📈 Investimentos (Geral)</option>
                <option value="Reserva">💰 Reserva Emergência</option>
                <option value="Imóvel">🏡 Fundo Imobiliário</option>
              </select>
            </div>

            <div className="flex gap-2.5 mt-7">
              <Button variant="outline" className="flex-1" onClick={() => setShowUlyssesModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                className="flex-1 bg-emerald-400 text-black hover:bg-emerald-300"
                onClick={() => {
                  const threshold = Number((document.getElementById("ulysses-threshold") as HTMLInputElement).value);
                  const destination = (document.getElementById("ulysses-dest") as HTMLSelectElement).value;
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
