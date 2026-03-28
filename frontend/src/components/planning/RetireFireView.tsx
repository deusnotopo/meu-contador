import { useState } from "react";
import type { TabType } from "@/types/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/formatters";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";
import { useFireCalculation } from "@/hooks/useFireCalculation";


interface RetireFireViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

export const RetireFireView = ({ onBack, onNavigate }: RetireFireViewProps) => {
  const { user } = useAuth();
  const { totals: invTotals, loading: invLoading } = useInvestments();
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: debtTotals, isLoading: debtLoading } = useDebts();

  // ── Loading state ──
  const isLoading = invLoading || personal.isLoading || business.isLoading || debtLoading;

  // ── Real data ──
  const patrimonioAtual = Math.max(0,
    (personal.totals.balance + business.totals.balance + invTotals.currentValue) - debtTotals.totalBalance
  );
  const rendaAtual = personal.totals.income + business.totals.income;

  // ── Controlled state ──
  const [despesa, setDespesa] = useState(() =>
    Math.round((personal.totals.expense || 8000))
  );
  const [aporte, setAporte] = useState(() =>
    Math.round((rendaAtual * 0.2) || 2000)
  );
  const [taxaAnual, setTaxaAnual] = useState(10); // % ao ano

  // ── FIRE calculation (fully reactive) ──
  const WITHDRAWAL_RATE = 0.032; // 3.2% — conservative for Brazil

  const { months, targets } = useFireCalculation({
    currentNetWorth: patrimonioAtual,
    monthlyExpenses: despesa,
    monthlyDeposit: aporte,
    yearlyReturn: taxaAnual,
    withdrawalRate: WITHDRAWAL_RATE
  });

  const meta = targets.base;
  const meses = months.base;

  const anos = (meses / 12).toFixed(1);
  const atingivel = meses < 600;
  const progresoFire = Math.min(100, (patrimonioAtual / meta) * 100);

  // Year of FIRE
  const anoFire = new Date().getFullYear() + Math.round(meses / 12);
  const idadeAtual = (user as any)?.age || 30;
  const idadeFire = idadeAtual + Math.round(meses / 12);

  // Lean FIRE and Fat FIRE — use months from hook (fix: was using undeclared taxaMes)
  const leanMeta = targets.lean;
  const fatMeta = targets.fat;
  const leanMeses = months.lean;
  const fatMeses = months.fat;

  if (isLoading) {
    return (
      <div style={{ paddingTop: "10px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button className="back-btn" onClick={() => onBack?.()}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Independência financeira</div>
            <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Calculadora FIRE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12, color: "var(--t3)" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Carregando dados financeiros...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => onBack?.()}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Independência financeira</div>
          <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Calculadora FIRE</div>
        </div>
        <AreaTutorialButton area="futuro" onNavigate={onNavigate} />
      </div>

      {/* Hero — FIRE result */}
      <div className="hero" style={{ textAlign: "center", padding: "24px 20px" }}>
        <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 8 }}>
          {atingivel ? "Data estimada FIRE" : "Meta inalcançável no prazo"}
        </div>
        {atingivel ? (
          <>
            <div style={{ fontSize: 38, fontWeight: 700, color: "var(--t1)", letterSpacing: "-1.5px", fontFamily: "var(--mono)" }}>
              {anoFire}
            </div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>
              {anos} anos · aos {idadeFire} anos de idade
            </div>
          </>
        ) : (
          <div style={{ fontSize: 15, color: "var(--amber)", fontWeight: 600, marginTop: 4 }}>
            Aumente o aporte ou reduza a despesa desejada.
          </div>
        )}

        {/* Progress bar — current vs meta */}
        <div style={{ margin: "16px 0 6px" }}>
          <div className="prog" style={{ height: 10 }}>
            <div className="prog-fill" style={{
              width: `${progresoFire}%`,
              background: "linear-gradient(90deg, var(--blue), var(--purple))",
            }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
          <span>Atual: {formatCurrency(patrimonioAtual)}</span>
          <span>{Math.round(progresoFire)}%</span>
          <span>Meta: {meta >= 1e6 ? `R$ ${(meta / 1e6).toFixed(1)}M` : formatCurrency(meta)}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="metric-grid" style={{ marginTop: 12 }}>
        <div className="metric">
          <div className="m-label">Taxa de retirada</div>
          <div className="m-val blue mono">{(WITHDRAWAL_RATE * 100).toFixed(1)}%</div>
          <div className="m-delta">Safe — dados históricos BR</div>
        </div>
        <div className="metric">
          <div className="m-label">Patrimônio alvo</div>
          <div className="m-val mono">{meta >= 1e6 ? `R$ ${(meta / 1e6).toFixed(1)}M` : formatCurrency(meta)}</div>
          <div className="m-delta">{Math.round(1 / WITHDRAWAL_RATE)}× despesas anuais</div>
        </div>
        <div className="metric">
          <div className="m-label">Renda passiva</div>
          <div className="m-val green mono">{formatCurrency(despesa)}</div>
          <div className="m-delta">em valores atuais</div>
        </div>
        <div className="metric">
          <div className="m-label">Patrimônio atual</div>
          <div className="m-val mono">{patrimonioAtual >= 1e6 ? `R$ ${(patrimonioAtual / 1e6).toFixed(2)}M` : formatCurrency(patrimonioAtual)}</div>
          <div className="m-delta">patrimônio líquido real</div>
        </div>
      </div>

      {/* Interactive simulator */}
      <div className="sec-hd"><span className="sec-title">Simulador — ajuste sua meta</span></div>
      <div className="card">
        {/* Despesa desejada */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>Despesa mensal desejada na IF</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{formatCurrency(despesa)}</div>
          </div>
          <input type="range" min="2000" max="30000" step="500" value={despesa}
            onChange={e => setDespesa(+e.target.value)}
            style={{ width: "100%", accentColor: "#7B6FFF", cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--t3)", marginTop: 2 }}>
            <span>R$ 2.000 (Lean)</span><span>R$ 30.000 (Fat)</span>
          </div>
        </div>

        {/* Aporte mensal */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>Aporte mensal</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{formatCurrency(aporte)}</div>
          </div>
          <input type="range" min="100" max="15000" step="100" value={aporte}
            onChange={e => setAporte(+e.target.value)}
            style={{ width: "100%", accentColor: "#7B6FFF", cursor: "pointer" }} />
          {rendaAtual > 0 && (
            <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 2 }}>
              {Math.round((aporte / rendaAtual) * 100)}% da sua renda atual
            </div>
          )}
        </div>

        {/* Taxa de rendimento */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>Rentabilidade (a.a.)</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{taxaAnual}%</div>
          </div>
          <input type="range" min="1" max="20" step="0.5" value={taxaAnual}
            onChange={e => setTaxaAnual(+e.target.value)}
            style={{ width: "100%", accentColor: "#7B6FFF", cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--t3)", marginTop: 2 }}>
            <span>Poupança</span><span>CDI</span><span>Ações BR</span><span>Ações EUA</span>
          </div>
        </div>

        {/* Dynamic result */}
        <div style={{ marginTop: 16, padding: 14, background: "var(--blue3)", borderRadius: 12, border: "1px solid rgba(74,139,255,0.15)" }}>
          <div style={{ fontSize: 10, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
            Resultado com esses parâmetros
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Patrimônio alvo</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>
                {meta >= 1e6 ? `R$ ${(meta / 1e6).toFixed(1)}M` : formatCurrency(meta)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Anos para FIRE</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: atingivel ? "var(--blue)" : "var(--amber)", fontFamily: "var(--mono)" }}>
                {meses >= 600 ? "> 50 anos" : `${anos} anos`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIRE modalities — using hook values (fix: was using undeclared taxaMes) */}
      <div className="sec-hd"><span className="sec-title">Tipos de FIRE</span></div>
      {[
        {
          em: "🌱", nm: "Lean FIRE",
          desc: `${formatCurrency(Math.round(despesa * 0.6))}/mês`,
          target: leanMeta,
          months: leanMeses,
          color: "var(--green)",
        },
        {
          em: "🔥", nm: "Regular FIRE",
          desc: `${formatCurrency(despesa)}/mês`,
          target: meta,
          months: meses,
          color: "var(--blue)",
          isActive: true,
        },
        {
          em: "💎", nm: "Fat FIRE",
          desc: `${formatCurrency(Math.round(despesa * 1.8))}/mês`,
          target: fatMeta,
          months: fatMeses,
          color: "var(--amber)",
        },
      ].map(({ em, nm, desc, target, months: m, color, isActive }) => {
        const y = (m / 12).toFixed(1);
        return (
          <div key={nm} className="card" style={{
            marginBottom: 10,
            borderColor: isActive ? color : "transparent",
            borderWidth: isActive ? 1.5 : 1,
            borderStyle: "solid",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24 }}>{em}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{nm} {isActive && "← você"}</div>
                <div style={{ fontSize: 12, color: "var(--t2)" }}>{desc}</div>
                <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>
                  Alvo: {target >= 1e6 ? `R$ ${(target / 1e6).toFixed(1)}M` : formatCurrency(target)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "var(--mono)" }}>
                  {m >= 600 ? ">50 a." : `${y} a.`}
                </div>
                <div style={{ fontSize: 9, color: "var(--t3)" }}>{m < 600 ? `${new Date().getFullYear() + Math.round(m / 12)}` : "—"}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};