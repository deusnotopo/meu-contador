import { useState } from "react";
import { TrendingUp, Calculator, ShieldAlert, ArrowLeft } from "lucide-react";

export const InvestmentsSection = () => {
  const [tab, setTab] = useState<"geral" | "juros" | "dividas">("geral");

  // Mock data for UI presentation
  const equity = 17540.23;
  const cdb = 15000;
  const cx = 2540.23;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ padding: "10px 0" }}>
      <div style={{ padding: "0 16px" }}>
        {/* Header Tabs */}
        <div className="tnav">
          <button className={`tnav-i ${tab === "geral" ? "active" : ""}`} onClick={() => setTab("geral")}>
            Visão Geral
          </button>
          <button className={`tnav-i ${tab === "juros" ? "active" : ""}`} onClick={() => setTab("juros")}>
            <Calculator size={11} className="inline mr-1" /> Juros Comp.
          </button>
          <button className={`tnav-i ${tab === "dividas" ? "active" : ""}`} onClick={() => setTab("dividas")}>
            Dívidas
          </button>
        </div>

        {tab === "geral" && (
          <div className="space-y-4">
            <div className="hero" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>
                    Patrimônio Total
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "var(--t1)", letterSpacing: "-1px", fontFamily: "var(--mono)" }}>
                    R$ {equity.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--green)", marginTop: 6, fontWeight: 500 }}>
                    ▲ +R$ 340,12 vs. mês passado
                  </div>
                </div>
                <button
                  style={{
                    width: 36, height: 36, borderRadius: 12, background: "var(--glass2)",
                    border: "1px solid var(--border)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "var(--t1)", cursor: "pointer"
                  }}
                >
                  <TrendingUp size={16} />
                </button>
              </div>

              {/* Alloc bar */}
              <div className="alloc">
                <div className="alloc-s" style={{ width: `${(cdb / equity) * 100}%`, background: "var(--blue)" }} />
                <div className="alloc-s" style={{ width: `${(cx / equity) * 100}%`, background: "var(--purple)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <span style={{ color: "var(--blue)" }}>85% Renda Fixa</span>
                <span style={{ color: "var(--purple)" }}>15% Caixinha</span>
              </div>
            </div>

            <div className="sec-hd"><span className="sec-title">Posições</span></div>
            <div className="card space-y-3">
              <div className="row">
                <div className="row-ico" style={{ background: "rgba(74,139,255,0.1)", fontSize: 18 }}>🏦</div>
                <div className="row-main">
                  <div className="row-title">CDB Itaú 110%</div>
                  <div className="row-sub">Venc. 2026</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--t1)" }}>R$ 15.000,00</div>
                  <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginTop: 2 }}>+R$ 120,50 esse mês</div>
                </div>
              </div>
              <div className="row">
                <div className="row-ico" style={{ background: "rgba(155,127,255,0.1)", fontSize: 18 }}>📦</div>
                <div className="row-main">
                  <div className="row-title">Caixinha Nu</div>
                  <div className="row-sub">Reserva Emerg.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--t1)" }}>R$ 2.540,23</div>
                  <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginTop: 2 }}>+R$ 20,40 esse mês</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "juros" && (
          <div className="space-y-4">
            <div className="card">
              <div className="sl-grp">
                <div className="sl-lbl"><span>Patrimônio inicial</span><span>R$ 10.000</span></div>
                <input type="range" className="w-full" min="0" max="100000" defaultValue="10000" />
              </div>
              <div className="sl-grp">
                <div className="sl-lbl"><span>Aporte mensal</span><span>R$ 1.500</span></div>
                <input type="range" className="w-full" min="0" max="10000" defaultValue="1500" />
              </div>
              <div className="sl-grp">
                <div className="sl-lbl"><span>Taxa anual (bruta)</span><span>11,5%</span></div>
                <input type="range" className="w-full" min="0" max="25" step="0.5" defaultValue="11.5" />
              </div>
              <div className="sl-grp mb-0">
                <div className="sl-lbl"><span>Prazo</span><span>10 anos</span></div>
                <input type="range" className="w-full" min="1" max="50" defaultValue="10" />
              </div>

              <div className="res-grid">
                <div className="res-box">
                  <div className="res-lbl">Total investido</div>
                  <div className="res-val" style={{ color: "var(--t2)" }}>R$ 190k</div>
                </div>
                <div className="res-box">
                  <div className="res-lbl">Total em Juros</div>
                  <div className="res-val" style={{ color: "var(--green)" }}>R$ 143k</div>
                </div>
                <div className="res-box" style={{ background: "var(--blue3)", borderColor: "rgba(74,139,255,0.3)" }}>
                  <div className="res-lbl" style={{ color: "var(--blue)" }}>Resultado Final</div>
                  <div className="res-val" style={{ color: "var(--blue)" }}>R$ 333k</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "dividas" && (
          <div className="space-y-4">
            <div className="hero" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>
                Total em Dívidas
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--red)", letterSpacing: "-1px", fontFamily: "var(--mono)" }}>
                R$ 8.450,00
              </div>
              <div className="payoff-bar" style={{ marginTop: 14 }}>
                <div className="payoff-fill" style={{ width: "22%", background: "var(--red)" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 6, textAlign: "right" }}>
                22% quitado
              </div>
            </div>

            <div className="sec-hd"><span className="sec-title">Estratégia: Avalanche</span></div>
            <div className="card space-y-4">
              <div className="row">
                <div className="row-ico" style={{ background: "var(--red-d)", color: "var(--red)" }}><ShieldAlert size={16} /></div>
                <div className="row-main">
                  <div className="row-title">Cartão Nubank</div>
                  <div className="row-sub">CET: 14% a.m. (Prioridade Máxima)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--t1)" }}>R$ 2.450,00</div>
                  <div className="recurrence-chip" style={{ marginTop: 4 }}>Foco mês atual</div>
                </div>
              </div>
              <div className="row">
                <div className="row-ico" style={{ background: "var(--amber-d)", color: "var(--amber)" }}><ShieldAlert size={16} /></div>
                <div className="row-main">
                  <div className="row-title">Empréstimo BB</div>
                  <div className="row-sub">CET: 4.5% a.m. (Aguardando)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--t1)" }}>R$ 6.000,00</div>
                  <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>Pagando só a parcela</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
