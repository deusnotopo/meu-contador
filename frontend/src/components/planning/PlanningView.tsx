import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="back-btn" onClick={onBack}><ArrowLeft size={16} /></button>
        <div>
          <div className="eyebrow">Envelope</div>
          <div className="page-title" style={{ margin: 0, fontSize: 22 }}>
            {CATEGORY_ICONS[category] || "📦"} {category}
          </div>
        </div>
      </div>

      {/* Hero card */}
      <div className="hero" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>
              {isOver ? "Estouro" : "Restando"}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: isOver ? "var(--red)" : "var(--green)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>
              {formatCurrency(Math.abs(available))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>Gasto</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>
              {formatCurrency(spent)}
            </div>
          </div>
        </div>
        <div className="prog" style={{ height: 8 }}>
          <div className="prog-fill" style={{ width: `${pct}%`, background: progressColor }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--t3)", marginTop: 4, fontFamily: "var(--mono)" }}>
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
      <div className="sec-hd">
        <span className="sec-title">Lançamentos</span>
        <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--mono)" }}>{catTxns.length} este mês</span>
      </div>
      {catTxns.length === 0 ? (
        <div className="card" style={{ padding: "20px", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
          Nenhum lançamento em {category} este mês.
        </div>
      ) : (
        <div className="card">
          {catTxns.map((tx, i) => (
            <div key={tx.id || i} className="row">
              <div className="row-ico" style={{ background: "var(--glass2)" }}>{CATEGORY_ICONS[category] || "📦"}</div>
              <div className="row-main">
                <div className="row-title">{tx.description}</div>
                <div className="row-sub">{formatShortDate(tx.date)}</div>
              </div>
              <div className="row-amt amt-minus">− {formatCurrency(Math.abs(tx.amount))}</div>
            </div>
          ))}
        </div>
      )}
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
    <div style={{ paddingTop: "10px" }}>
      <div className="eyebrow">Orçamento zero-based</div>
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Envelopes
        <WizardTrigger label="Configurar" />
      </div>
      <div className="page-sub" style={{ marginBottom: "14px" }}>
        {capitalizedMonth} · cada real tem um destino
      </div>

      <div className="hero" style={{ padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "4px" }}>Disponível p/ alocar</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--green)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>{formatCurrency(totalAvailable)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "4px" }}>Alocado</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>{formatCurrency(totalSpent)}</div>
          </div>
        </div>
        <div className="prog" style={{ height: "8px" }}>
          <div className="prog-fill" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#00D991,#4A8BFF)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--t3)", marginTop: "4px", fontFamily: "var(--mono)" }}>
          <span>{Math.round(progressPct)}% alocado</span>
          <span>Total: {formatCurrency(totalLimit)}</span>
        </div>
      </div>

      {GROUPS.map(group => {
        const groupBudgets = budgets.filter((b) => group.categories.includes(b.category));
        if (groupBudgets.length === 0) {
          if (budgets.length === 0) return null;
          return (
            <div key={group.name} style={{ marginBottom: 10 }}>
              <div className="sec-hd"><span className="sec-title">{group.name}</span></div>
              <div className="card" style={{ padding: "16px", textAlign: "center", color: "var(--t3)", fontSize: 11, borderStyle: "dashed" }}>
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
          <div key={group.name}>
            <div className="sec-hd"><span className="sec-title">{group.name}</span></div>
            <div className="env-grid">
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
                    className="env"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedEnvelope(item.nm)}
                  >
                    <div className="env-ico">{item.ic}</div>
                    <div className="env-name">{item.nm}</div>
                    <div className="env-val" style={{ color: item.pc > 100 ? "var(--red)" : item.pc === 100 && !isSavingsGroup ? "var(--amber)" : undefined }}>
                      {formatCurrency(item.us).replace(',00', '')}
                    </div>
                    <div className="prog" style={{ height: "4px" }}>
                      <div className="prog-fill" style={{ width: `${Math.min(item.pc, 100)}%`, background: progressColor }} />
                    </div>
                    <div className="env-sub" style={{ color: item.pc > 100 ? "var(--red)" : undefined }}>
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

      <div className="sec-hd"><span className="sec-title">Ulysses Contract</span></div>
      <div className="nudge good">
        <div className="nudge-ttl" style={{ color: "var(--green)" }}>
          {ulyssesRule.active ? "✓ Regra automática ativa" : "⚠ Regra pausada"}
        </div>
        <div className="nudge-body">
          Se conta-corrente superar <strong>{formatCurrency(ulyssesRule.threshold)}</strong> no dia {ulyssesRule.day} → excedente vai automaticamente para {ulyssesRule.destination}.
        </div>
        <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "8px" }}>
          Sugestão inicial calculada pelo app: <strong>{formatCurrency(recommendedUlyssesRule.threshold)}</strong>, com base na sua renda e envelopes do mês.
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button 
            className="btn-ghost" 
            style={{ flex: 1, padding: "8px", fontSize: "11px" }}
            onClick={() => setShowUlyssesModal(true)}
          >
            Editar regra
          </button>
          <button 
            className="btn-ghost" 
            style={{ flex: 1, padding: "8px", fontSize: "11px", color: "var(--green)", borderColor: "rgba(0,217,145,0.3)" }}
            onClick={() => setShowHistoryNotice((prev) => !prev)}
          >
            Ver histórico
          </button>
        </div>
        {showHistoryNotice && (
          <div className="card" style={{ marginTop: "10px", padding: "12px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>Histórico ainda não automatizado</div>
            <div style={{ fontSize: "11px", color: "var(--t3)", lineHeight: 1.5 }}>
              Esta área será conectada futuramente aos eventos reais de transferência e execução da regra. Por enquanto, o contrato funciona como configuração orientativa, sem log transacional persistido.
            </div>
          </div>
        )}
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
              <button 
                className="btn-ghost" 
                style={{ flex: 1 }}
                onClick={() => setShowUlyssesModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-p" 
                style={{ flex: 1, background: 'var(--green)', color: 'black' }}
                onClick={() => {
                  const threshold = Number((document.getElementById('ulysses-threshold') as HTMLInputElement).value);
                  const destination = (document.getElementById('ulysses-dest') as HTMLSelectElement).value;
                  saveUlyssesRule({ ...ulyssesRule, threshold, destination });
                }}
              >
                Salvar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
