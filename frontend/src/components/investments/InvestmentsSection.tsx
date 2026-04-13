import { useState, useMemo, useEffect } from "react";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import { MarketDataWidget } from "./MarketDataWidget";
import { RealTimeQuotes } from "./RealTimeQuotes";
import { TesouroDiretoRates } from "./TesouroDiretoRates";
import { ShieldAlert, Trash2, Plus, AlertCircle, Briefcase, CreditCard, Pencil } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { showError } from "@/lib/toast";
import { useTour } from "@/hooks/useTour";
import { WizardTrigger } from "@/components/onboarding/WizardTrigger";
import { EditInvestmentModal } from "./EditInvestmentModal";
import type { Investment } from "@/types";

const fmt = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) => n >= 1e6 ? 'R$ ' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);

function assetIcon(type: string) {
  switch (type) {
    case 'stock': return '📊';
    case 'fii': return '🏢';
    case 'fixed_income': return '🏦';
    case 'etf': return '🌍';
    case 'crypto': return '₿';
    default: return '💰';
  }
}

function assetTypeName(type: string) {
  switch (type) {
    case 'stock': return 'Ação BR';
    case 'fii': return 'FII';
    case 'fixed_income': return 'Renda fixa';
    case 'etf': return 'ETF Global';
    case 'crypto': return 'Cripto';
    default: return type;
  }
}

function allocationByType(assets: Investment[]) {
  const total = assets.reduce((s, a) => s + (a.currentPrice || a.averagePrice) * a.amount, 0) || 1;
  const byType: Record<string, number> = {};
  assets.forEach(a => {
    const v = (a.currentPrice || a.averagePrice) * a.amount;
    byType[a.type] = (byType[a.type] || 0) + v;
  });
  const COLORS: Record<string, string> = {
    fixed_income: '#4A8BFF', stock: '#00D991', etf: '#FFAD3B', fii: '#9B7FFF', crypto: '#FF6B6B',
  };
  return Object.entries(byType).map(([type, value]) => ({
    type, value, pct: Math.round((value / total) * 100),
    color: COLORS[type] || '#888', label: assetTypeName(type),
  }));
}

export const InvestmentsSection = ({ onBack }: { onBack?: () => void }) => {
  const [tab, setTab] = useState<"geral" | "juros" | "dividas">("geral");
  const [editingAsset, setEditingAsset] = useState<Investment | null>(null);
  const { debts, totals: debtTotals, deleteDebt, addDebt, error: debtError, isLoading: debtLoading } = useDebts();
  const { assets, loading: assetsLoading, totals: investTotals, deleteAsset, updateAsset } = useInvestments();
  const { startTour } = useTour();

  useEffect(() => { if (tab === "geral") startTour('investments'); }, [startTour, tab]);

  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: "", balance: 0, interestRate: 0, minPayment: 0,
    category: "credit_card", dueDate: undefined as string | undefined,
  });

  // Juros compostos slider state
  const [aporte, setAporte] = useState(1200);
  const [taxa, setTaxa] = useState(10);
  const [anos, setAnos] = useState(25);

  const jurosResult = useMemo(() => {
    const r = taxa / 100 / 12;
    const n = anos * 12;
    const total = aporte * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const aportado = aporte * n;
    return { total, aportado, rendimento: total - aportado };
  }, [aporte, taxa, anos]);

  const allocation = useMemo(() => allocationByType(assets), [assets]);
  const totalInvested = investTotals.currentValue;
  const totalCost = investTotals.totalInvested;
  const totalReturn = totalInvested - totalCost;
  const returnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return (
    <div className="pt-2.5 animate-[fsu_0.26s_ease]">

      {/* Dynamic Header */}
      {tab === "geral" && (
        <>
          <div className="flex items-center gap-3 mb-1">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl mb-2">←</Button>
            )}
            <div>
              <div className="eyebrow">Visão consolidada</div>
              <div className="page-title m-0 flex items-center gap-2">
                Patrimônio
                <WizardTrigger label="Ajustar" />
              </div>
            </div>
            <HelpButton tooltipText="Acompanhe patrimônio, alocação, rentabilidade e dívidas em uma visão consolidada." />
          </div>
          <div className="page-sub mb-3.5">Ativos, dívidas e alocação</div>
        </>
      )}

      {tab === "juros" && (
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setTab("geral")} className="rounded-xl">←</Button>
          <div>
            <div className="eyebrow">Calculadora</div>
            <div className="page-title text-[22px] m-0">Juros compostos</div>
          </div>
        </div>
      )}

      {tab === "dividas" && (
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setTab("geral")} className="rounded-xl">←</Button>
          <div className="flex-1">
            <div className="eyebrow">Gestão</div>
            <div className="page-title text-[22px] m-0">Dívidas</div>
          </div>
          {debtError && (
            <div className="bdg bdg-r animate-pulse">
              <AlertCircle size={10} /> Sync Error
            </div>
          )}
        </div>
      )}

      {/* Tab Nav */}
      {tab === "geral" && (
        <div className="tnav">
          <div className="tnav-i active">Geral</div>
          <div className="tnav-i" onClick={() => setTab("juros")}>Juros compostos</div>
          <div className="tnav-i" onClick={() => setTab("dividas")}>Dívidas</div>
        </div>
      )}

      {/* ─── TAB: GERAL ─── */}
      {tab === "geral" && (
        <>
          <div className="hero" id="investments-summary">
            <div className="text-[10px] text-[rgba(74,139,255,0.9)] uppercase tracking-[0.14em] font-bold mb-2.5">
              Total investido
            </div>
            <div className="bignum">
              {assetsLoading ? <span className="text-[var(--t3)]">Carregando...</span> : fmtM(totalInvested)}
            </div>

            {!assetsLoading && totalCost > 0 && (
              <div className="mt-2 flex gap-2 items-center">
                <span className={`bdg ${returnPct >= 0 ? 'bdg-g' : 'bdg-r'}`}>
                  {returnPct >= 0 ? '▲' : '▼'} {Math.abs(returnPct).toFixed(2)}% total
                </span>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: returnPct >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {returnPct >= 0 ? '+' : ''}{fmt(totalReturn)}
                </span>
              </div>
            )}

            {/* Allocation bar */}
            {allocation.length > 0 && (
              <div id="asset-allocation-chart">
                <div className="mt-4 text-[9.5px] text-[var(--t3)] mb-2 uppercase tracking-[0.08em] font-semibold">
                  Alocação atual
                </div>
                <div className="alloc">
                  {allocation.map((a, i) => (
                    <div key={i} className="alloc-s" style={{ width: `${a.pct}%`, background: a.color }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {allocation.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-0.5">
                      <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: a.color }} />
                      <span className="text-[11px] text-[var(--t2)] flex-1">{a.label}</span>
                      <span className="text-[11px] text-[var(--t3)] font-mono">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Posições */}
          <div className="sec-hd"><span className="sec-title">Posições</span></div>
          <div className="card">
            {assetsLoading ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton h-[52px] mb-2" />)
            ) : assets.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Sem ativos"
                description="Sua carteira está vazia. Comece a monitorar seu patrimônio agora."
                actionLabel="Adicionar ativo"
                onAction={() => {
                  if (onBack) window.dispatchEvent(new CustomEvent('navigate', { detail: 'investments' }));
                }}
              />
            ) : (
              assets.map((a, i) => {
                const currentVal = (a.currentPrice || a.averagePrice) * a.amount;
                const costVal = a.averagePrice * a.amount;
                const ret = currentVal - costVal;
                const retPct = costVal > 0 ? (ret / costVal) * 100 : 0;
                return (
                  <div key={a.id || i} className="row">
                    <div className="row-ico">{assetIcon(a.type)}</div>
                    <div className="row-main">
                      <div className="row-title">{a.ticker || a.name}</div>
                      <div className="row-sub">{assetTypeName(a.type)} · {a.amount} un</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="row-amt">{fmtM(currentVal)}</div>
                      <div className={retPct >= 0 ? "trend-up" : "trend-down"}>
                        {retPct >= 0 ? '▲' : '▼'} {Math.abs(retPct).toFixed(1)}%
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setEditingAsset(a)} className="h-7 w-7 ml-1 text-blue-400/80" title="Editar">
                      <Pencil size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteAsset(a.id)} className="h-7 w-7 ml-0.5 text-[var(--t4)]/80">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {assets.length > 0 && (
            <div className="nudge warn">
              <div className="nudge-ttl text-[var(--amber)]">⚠ Come-cotas em dezembro</div>
              <div className="nudge-body">Fundos de renda fixa cobram come-cotas semestral. Verifique sua posição antes de dezembro.</div>
            </div>
          )}

          <div className="sec-hd">
            <span className="sec-title">Dívidas ativas</span>
            <span className="sec-link" onClick={() => setTab("dividas")}>Ver detalhes</span>
          </div>
          <div className="card">
            {debts.length === 0 ? (
              <div className="row cursor-pointer" onClick={() => setTab("dividas")}>
                <div className="row-ico bg-[var(--glass2)]">💳</div>
                <div className="row-main">
                  <div className="row-title">Sem dívidas cadastradas</div>
                  <div className="row-sub">Toque para adicionar</div>
                </div>
              </div>
            ) : debts.slice(0, 2).map((d, i) => (
              <div key={d.id || i} className="row cursor-pointer" onClick={() => setTab("dividas")}>
                <div className="row-ico">💳</div>
                <div className="row-main">
                  <div className="row-title">{d.name}</div>
                  <div className="row-sub">CET: {d.interestRate}% a.m.</div>
                </div>
                <div className="m-val r text-[14px]">{fmt(d.balance)}</div>
              </div>
            ))}
          </div>

          <div className="sec-hd"><span className="sec-title">Mercado Aberto</span></div>
          <MarketDataWidget />

          <div className="sec-hd"><span className="sec-title">Cotações ao vivo</span></div>
          <RealTimeQuotes />

          <div className="sec-hd"><span className="sec-title">Tesouro Direto</span></div>
          <TesouroDiretoRates />
        </>
      )}

      {/* ─── TAB: JUROS COMPOSTOS ─── */}
      {tab === "juros" && (
        <>
          <div className="card mb-2.5">
            <div className="sl-grp">
              <div className="sl-lbl"><span>Aporte mensal</span><span>R$ {aporte.toLocaleString('pt-BR')}</span></div>
              <input type="range" min="200" max="5000" step="100" value={aporte}
                onChange={e => setAporte(Number(e.target.value))} className="w-full" />
            </div>
            <div className="sl-grp">
              <div className="sl-lbl"><span>Taxa de retorno</span><span>{taxa}% a.a.</span></div>
              <input type="range" min="4" max="18" step="0.5" value={taxa}
                onChange={e => setTaxa(Number(e.target.value))} className="w-full" />
            </div>
            <div className="sl-grp">
              <div className="sl-lbl"><span>Período</span><span>{anos} anos</span></div>
              <input type="range" min="5" max="35" step="1" value={anos}
                onChange={e => setAnos(Number(e.target.value))} className="w-full" />
            </div>
          </div>

          <div className="res-grid">
            <div className="res-box"><div className="res-lbl">Total acum.</div><div className="res-val text-[var(--green)] text-[13px]">{fmtM(jurosResult.total)}</div></div>
            <div className="res-box"><div className="res-lbl">Aportado</div><div className="res-val">{fmtM(jurosResult.aportado)}</div></div>
            <div className="res-box"><div className="res-lbl">Rendimento</div><div className="res-val text-[var(--blue)] text-[13px]">{fmtM(jurosResult.rendimento)}</div></div>
          </div>

          <div className="card p-3.5 mt-2.5">
            <div className="text-[10px] text-[var(--t3)] uppercase tracking-[0.1em] mb-2.5 font-semibold">Evolução</div>
            <svg width="100%" height="70" viewBox="0 0 318 70">
              <path d={`M0,70 Q100,65 150,50 T318,${Math.max(5, 70 - (jurosResult.rendimento / jurosResult.total) * 65)} L318,70 Z`} fill="rgba(74,139,255,0.2)" />
              <path d={`M0,70 Q100,65 150,50 T318,${Math.max(5, 70 - (jurosResult.rendimento / jurosResult.total) * 65)}`} fill="none" stroke="var(--blue)" strokeWidth="2" />
            </svg>
          </div>

          <div className="nudge good mt-3">
            <div className="nudge-ttl text-[var(--green)]">💡 Poder dos juros compostos</div>
            <div className="nudge-body">
              Aportando <strong>R$ {aporte.toLocaleString('pt-BR')}/mês</strong> por <strong>{anos} anos</strong> a <strong>{taxa}% a.a.</strong>, você transforma{" "}
              <strong>{fmtM(jurosResult.aportado)}</strong> em{" "}
              <strong className="text-[var(--green)]">{fmtM(jurosResult.total)}</strong>.
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: DÍVIDAS ─── */}
      {tab === "dividas" && (
        <>
          <div className="metric-grid">
            <div className="metric"><div className="m-label">Total devendo</div><div className="m-val r">{fmt(debtTotals.totalBalance)}</div></div>
            <div className="metric"><div className="m-label">Nº dívidas</div><div className="m-val">{debts.length}</div></div>
          </div>

          <div className="flex justify-between items-center mt-4 mb-3">
            <span className="sec-title">Mapa de dívidas</span>
            <Button variant="ghost" size="sm" onClick={() => setShowAddDebt(!showAddDebt)} className="text-xs text-blue-400 font-bold gap-1">
              <Plus size={14} /> Nova
            </Button>
          </div>

          {showAddDebt && (
            <div className="card mb-3.5 p-3.5">
              <input type="text" placeholder="Nome (ex: Cartão Nubank)" className="mb-2" value={newDebt.name}
                onChange={e => setNewDebt({ ...newDebt, name: e.target.value })} />
              <div className="flex gap-2 mb-3">
                <input type="number" placeholder="Saldo (R$) *" value={newDebt.balance || ""}
                  onChange={e => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })} />
                <input type="number" step="0.1" placeholder="Juros (% a.m.) *" value={newDebt.interestRate || ""}
                  onChange={e => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <input type="number" placeholder="Pagamento mínimo (R$) *" className="mb-3" value={newDebt.minPayment || ""}
                onChange={e => setNewDebt({ ...newDebt, minPayment: parseFloat(e.target.value) || 0 })} />
              <Button variant="premium" className="w-full" onClick={() => {
                if (newDebt.name && newDebt.balance > 0 && newDebt.minPayment > 0) {
                  addDebt({
                    name: newDebt.name, balance: newDebt.balance,
                    interestRate: newDebt.interestRate || 0, minPayment: newDebt.minPayment,
                    category: newDebt.category as 'credit_card' | 'loan' | 'overdraft' | 'other',
                    dueDate: newDebt.dueDate,
                  });
                  setShowAddDebt(false);
                  setNewDebt({ name: "", balance: 0, interestRate: 0, minPayment: 0, category: "credit_card", dueDate: undefined });
                } else {
                  showError("Preencha todos os campos obrigatórios com valores válidos.");
                }
              }}>Salvar</Button>
            </div>
          )}

          <div className="card">
            {debtLoading ? (
              [1, 2].map(i => <div key={i} className="skeleton h-[60px] mb-2" />)
            ) : debts.length === 0 ? (
              <EmptyState icon={CreditCard} title="Sem dívidas" description="Parabéns! Você não possui dívidas cadastradas." actionLabel="Nova dívida" onAction={() => setShowAddDebt(true)} />
            ) : debts.map((d, i) => (
              <div key={d.id || i} className="row items-start py-3.5">
                <div className="row-ico mt-0.5 text-[var(--red)]" style={{ background: "var(--red-d)" }}>
                  <ShieldAlert size={16} />
                </div>
                <div className="row-main">
                  <div className="row-title">{d.name}</div>
                  <div className="row-sub">CET: {d.interestRate}% a.m.</div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="bdg bdg-r">{d.interestRate}% a.m.</span>
                    <span className="bdg bdg-b">Ativa</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="m-val r text-[14px]">{fmt(d.balance)}</div>
                  <Button variant="ghost" size="icon" onClick={() => deleteDebt(d.id)} className="mt-2 h-7 w-7 text-[var(--t4)]/80">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {debts.length > 0 && (
            <div className="nudge good mt-3.5">
              <div className="nudge-ttl text-[var(--green)]">💡 Estratégia recomendada</div>
              <div className="nudge-body">
                Método <strong>avalanche</strong>: priorize a dívida com maior juros ({debts.sort((a, b) => b.interestRate - a.interestRate)[0]?.name}).
              </div>
            </div>
          )}
        </>
      )}

      {editingAsset && (
        <EditInvestmentModal
          asset={editingAsset}
          onSave={async (id, updates) => { await updateAsset(id, updates); }}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
};
