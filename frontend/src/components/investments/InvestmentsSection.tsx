import { useState, useMemo } from "react";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { MarketDataWidget } from "./MarketDataWidget";
import { RealTimeQuotes } from "./RealTimeQuotes";
import { TesouroDiretoRates } from "./TesouroDiretoRates";
import { ShieldAlert, Trash2, Plus } from "lucide-react";
import type { Investment } from "@/types";

const fmt = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtM = (n: number) => n >= 1e6 ? 'R$ ' + (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);
const fmtCurr = (n: number) => 'R$\u00a0' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    fixed_income: '#4A8BFF',
    stock: '#00D991',
    etf: '#FFAD3B',
    fii: '#9B7FFF',
    crypto: '#FF6B6B',
  };
  return Object.entries(byType).map(([type, value]) => ({
    type,
    value,
    pct: Math.round((value / total) * 100),
    color: COLORS[type] || '#888',
    label: assetTypeName(type),
  }));
}

export const InvestmentsSection = () => {
  const [tab, setTab] = useState<"geral" | "juros" | "dividas">("geral");
  const { debts, totals: debtTotals, deleteDebt, addDebt } = useDebts();
  const { assets, loading: assetsLoading, totals: investTotals, deleteAsset } = useInvestments();

  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newDebt, setNewDebt] = useState({ name: "", balance: 0, interestRate: 0, minPayment: 0, category: "credit_card" as any });

  // Juros compostos slider state
  const [aporte, setAporte] = useState(1200);
  const [taxa, setTaxa] = useState(10);
  const [anos, setAnos] = useState(25);

  const jurosResult = useMemo(() => {
    const r = taxa / 100 / 12;
    const n = anos * 12;
    const total = aporte * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const aportado = aporte * n;
    const rendimento = total - aportado;
    return { total, aportado, rendimento };
  }, [aporte, taxa, anos]);

  const allocation = useMemo(() => allocationByType(assets), [assets]);
  const totalInvested = investTotals.currentValue;
  const totalCost = investTotals.totalInvested;
  const totalReturn = totalInvested - totalCost;
  const returnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease" }}>
      {/* Dynamic Header */}
      {tab === "geral" && (
        <>
          <div className="eyebrow">Visão consolidada</div>
          <div className="page-title">Patrimônio</div>
          <div className="page-sub" style={{ marginBottom: "14px" }}>Ativos, dívidas e alocação</div>
        </>
      )}
      {tab === "juros" && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <button className="back-btn" onClick={() => setTab("geral")}>←</button>
          <div>
            <div className="eyebrow">Calculadora</div>
            <div className="page-title" style={{ fontSize: "22px", margin: 0 }}>Juros compostos</div>
          </div>
        </div>
      )}
      {tab === "dividas" && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <button className="back-btn" onClick={() => setTab("geral")}>←</button>
          <div>
            <div className="eyebrow">Gestão</div>
            <div className="page-title" style={{ fontSize: "22px", margin: 0 }}>Dívidas</div>
          </div>
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

      {/* TAB: GERAL */}
      {tab === "geral" && (
        <>
          <div className="hero">
            <div style={{ fontSize: "10px", color: "rgba(74,139,255,0.9)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "10px" }}>Total investido</div>
            <div className="bignum">
              {assetsLoading ? <span style={{ color: "var(--t3)" }}>Carregando...</span> : fmtM(totalInvested)}
            </div>
            {!assetsLoading && totalCost > 0 && (
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                <span className={`bdg ${returnPct >= 0 ? 'bdg-g' : 'bdg-r'}`}>
                  {returnPct >= 0 ? '▲' : '▼'} {Math.abs(returnPct).toFixed(2)}% total
                </span>
                <span style={{ fontSize: "11px", color: returnPct >= 0 ? "var(--green)" : "var(--red)", fontFamily: "var(--mono)" }}>
                  {returnPct >= 0 ? '+' : ''}{fmt(totalReturn)}
                </span>
              </div>
            )}

            {/* Allocation bar */}
            {allocation.length > 0 && (
              <>
                <div style={{ marginTop: "16px", fontSize: "9.5px", color: "var(--t3)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Alocação atual</div>
                <div className="alloc">
                  {allocation.map((a, i) => (
                    <div key={i} className="alloc-s" style={{ width: `${a.pct}%`, background: a.color }} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                  {allocation.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "3px 0" }}>
                      <span style={{ width: "8px", height: "8px", background: a.color, borderRadius: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", color: "var(--t2)", flex: 1 }}>{a.label}</span>
                      <span style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Posições reais */}
          <div className="sec-hd"><span className="sec-title">Posições</span></div>
          <div className="card">
            {assetsLoading ? (
              [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8 }} />)
            ) : assets.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
                Nenhum ativo cadastrado ainda.<br />
                <span style={{ color: "var(--blue)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Use o botão abaixo para adicionar</span>
              </div>
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
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="row-amt">{fmtM(currentVal)}</div>
                      <div className={retPct >= 0 ? "trend-up" : "trend-down"}>
                        {retPct >= 0 ? '▲' : '▼'} {Math.abs(retPct).toFixed(1)}%
                      </div>
                    </div>
                    <button onClick={() => deleteAsset(a.id)} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", padding: "4px", marginLeft: 6, opacity: 0.6 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Alertas tributários — só se tiver ativos */}
          {assets.length > 0 && (
            <div className="nudge warn">
              <div className="nudge-ttl" style={{ color: "var(--amber)" }}>⚠ Come-cotas em dezembro</div>
              <div className="nudge-body">Fundos de renda fixa cobram come-cotas semestral. Verifique sua posição antes de dezembro.</div>
            </div>
          )}

          <div className="sec-hd"><span className="sec-title">Dívidas ativas</span><span className="sec-link" onClick={() => setTab("dividas")}>Ver detalhes</span></div>
          <div className="card">
            {debts.length === 0 ? (
              <div className="row" style={{ cursor: "pointer" }} onClick={() => setTab("dividas")}>
                <div className="row-ico" style={{ background: "var(--glass2)" }}>💳</div>
                <div className="row-main">
                  <div className="row-title">Sem dívidas cadastradas</div>
                  <div className="row-sub">Toque para adicionar</div>
                </div>
              </div>
            ) : debts.slice(0, 2).map((d, i) => (
              <div key={d.id || i} className="row" onClick={() => setTab("dividas")} style={{ cursor: "pointer" }}>
                <div className="row-ico">💳</div>
                <div className="row-main">
                  <div className="row-title">{d.name}</div>
                  <div className="row-sub">CET: {d.interestRate}% a.m.</div>
                </div>
                <div className="m-val r" style={{ fontSize: "14px" }}>{fmt(d.balance)}</div>
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

      {/* TAB: JUROS COMPOSTOS */}
      {tab === "juros" && (
        <>
          <div className="card" style={{ marginBottom: "10px" }}>
            <div className="sl-grp">
              <div className="sl-lbl"><span>Aporte mensal</span><span>R$ {aporte.toLocaleString('pt-BR')}</span></div>
              <input type="range" min="200" max="5000" step="100" value={aporte} onChange={e => setAporte(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div className="sl-grp">
              <div className="sl-lbl"><span>Taxa de retorno</span><span>{taxa}% a.a.</span></div>
              <input type="range" min="4" max="18" step="0.5" value={taxa} onChange={e => setTaxa(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div className="sl-grp">
              <div className="sl-lbl"><span>Período</span><span>{anos} anos</span></div>
              <input type="range" min="5" max="35" step="1" value={anos} onChange={e => setAnos(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
          <div className="res-grid">
            <div className="res-box"><div className="res-lbl">Total acum.</div><div className="res-val" style={{ color: "var(--green)", fontSize: "13px" }}>{fmtM(jurosResult.total)}</div></div>
            <div className="res-box"><div className="res-lbl">Aportado</div><div className="res-val">{fmtM(jurosResult.aportado)}</div></div>
            <div className="res-box"><div className="res-lbl">Rendimento</div><div className="res-val" style={{ color: "var(--blue)", fontSize: "13px" }}>{fmtM(jurosResult.rendimento)}</div></div>
          </div>
          <div className="card" style={{ padding: "14px", marginTop: "10px" }}>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", fontWeight: 600 }}>Evolução</div>
            <svg width="100%" height="70" viewBox="0 0 318 70">
              <path d={`M0,70 Q100,65 150,50 T318,${Math.max(5, 70 - (jurosResult.rendimento / jurosResult.total) * 65)} L318,70 Z`} fill="rgba(74,139,255,0.2)" />
              <path d={`M0,70 Q100,65 150,50 T318,${Math.max(5, 70 - (jurosResult.rendimento / jurosResult.total) * 65)}`} fill="none" stroke="var(--blue)" strokeWidth="2" />
            </svg>
          </div>
          <div className="nudge good" style={{ marginTop: "12px" }}>
            <div className="nudge-ttl" style={{ color: "var(--green)" }}>💡 Poder dos juros compostos</div>
            <div className="nudge-body">
              Aportando <strong>R$ {aporte.toLocaleString('pt-BR')}/mês</strong> por <strong>{anos} anos</strong> a <strong>{taxa}% a.a.</strong>, você transforma <strong>{fmtM(jurosResult.aportado)}</strong> em <strong style={{ color: "var(--green)" }}>{fmtM(jurosResult.total)}</strong>.
            </div>
          </div>
        </>
      )}

      {/* TAB: DÍVIDAS */}
      {tab === "dividas" && (
        <>
          <div className="metric-grid">
            <div className="metric"><div className="m-label">Total devendo</div><div className="m-val r">{fmt(debtTotals.totalBalance)}</div></div>
            <div className="metric"><div className="m-label">Nº dívidas</div><div className="m-val">{debts.length}</div></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", marginBottom: "12px" }}>
            <span className="sec-title">Mapa de dívidas</span>
            <button onClick={() => setShowAddDebt(!showAddDebt)} style={{ fontSize: "11px", color: "var(--blue)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <Plus size={14} /> Nova
            </button>
          </div>

          {showAddDebt && (
            <div className="card" style={{ marginBottom: "14px", padding: "14px" }}>
              <input type="text" placeholder="Nome (ex: Cartão Nubank)" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", color: "var(--t1)", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} value={newDebt.name} onChange={e => setNewDebt({ ...newDebt, name: e.target.value })} />
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input type="number" placeholder="Saldo (R$)" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", color: "var(--t1)", outline: "none" }} value={newDebt.balance || ""} onChange={e => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })} />
                <input type="number" step="0.1" placeholder="Juros (% a.m.)" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", color: "var(--t1)", outline: "none" }} value={newDebt.interestRate || ""} onChange={e => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <button onClick={() => { if (newDebt.name) { addDebt(newDebt); setShowAddDebt(false); setNewDebt({ name: "", balance: 0, interestRate: 0, minPayment: 0, category: "credit_card" }); } }} style={{ background: "var(--blue)", color: "#fff", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, width: "100%", border: "none", cursor: "pointer" }}>
                Salvar
              </button>
            </div>
          )}

          <div className="card">
            {debts.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
                Nenhuma dívida cadastrada. Ótimo! 🎉
              </div>
            ) : debts.map((d, i) => (
              <div key={d.id || i} className="row" style={{ alignItems: "flex-start", padding: "14px 0" }}>
                <div className="row-ico" style={{ background: "var(--red-d)", marginTop: "2px", color: "var(--red)" }}><ShieldAlert size={16} /></div>
                <div className="row-main">
                  <div className="row-title">{d.name}</div>
                  <div className="row-sub">CET: {d.interestRate}% a.m.</div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <span className="bdg bdg-r">{d.interestRate}% a.m.</span>
                    <span className="bdg bdg-b">Ativa</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div className="m-val r" style={{ fontSize: "14px" }}>{fmt(d.balance)}</div>
                  <button onClick={() => deleteDebt(d.id)} style={{ background: "none", border: "none", color: "var(--t3)", marginTop: "12px", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {debts.length > 0 && (
            <div className="nudge good" style={{ marginTop: "14px" }}>
              <div className="nudge-ttl" style={{ color: "var(--green)" }}>💡 Estratégia recomendada</div>
              <div className="nudge-body">
                Método <strong>avalanche</strong>: priorize a dívida com maior juros ({debts.sort((a, b) => b.interestRate - a.interestRate)[0]?.name}).
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
