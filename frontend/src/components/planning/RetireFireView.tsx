import { useState, useEffect } from "react";
import type { TabType } from "@/types/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";
import { formatCurrency } from "@/lib/formatters";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";
import { useFireCalculation } from "@/hooks/useFireCalculation";

const sliderClass = "w-full cursor-pointer accent-[#7B6FFF]";
const labelClass = "text-[13px] text-[var(--t1)] font-medium";
const valueClass = "text-[15px] font-bold text-[var(--t1)] font-mono";
const subClass = "flex justify-between text-[9px] text-[var(--t3)] mt-0.5";

interface RetireFireViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
  isTab?: boolean;
}

export const RetireFireView = ({ onBack, onNavigate, isTab }: RetireFireViewProps) => {
  const { user } = useAuth();
  const { totals: invTotals, loading: invLoading } = useInvestments();
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: debtTotals, isLoading: debtLoading } = useDebts();

  const isLoading = invLoading || personal.isLoading || business.isLoading || debtLoading;

  const patrimonioAtual = Math.max(0,
    (personal.totals.balance + business.totals.balance + invTotals.currentValue) - debtTotals.totalBalance
  );
  const rendaAtual = personal.totals.income + business.totals.income;

  const { fireConfig, updateFireConfig } = usePreferences();

  const [despesa, setDespesa] = useState(() => fireConfig.expense ?? Math.round(personal.totals.expense || 8000));
  const [aporte, setAporte] = useState(() => fireConfig.contribution ?? Math.round(rendaAtual * 0.2 || 2000));
  const [taxaAnual, setTaxaAnual] = useState(() => fireConfig.rate ?? 10);

  useEffect(() => {
    if (fireConfig.expense !== undefined) setDespesa(fireConfig.expense);
    if (fireConfig.contribution !== undefined) setAporte(fireConfig.contribution);
    if (fireConfig.rate !== undefined) setTaxaAnual(fireConfig.rate);
  }, [fireConfig.expense, fireConfig.contribution, fireConfig.rate]);

  const WITHDRAWAL_RATE = 0.032;
  const { months, targets } = useFireCalculation({
    currentNetWorth: patrimonioAtual,
    monthlyExpenses: despesa,
    monthlyDeposit: aporte,
    yearlyReturn: taxaAnual,
    withdrawalRate: WITHDRAWAL_RATE,
  });

  const meta = targets.base;
  const meses = months.base;
  const anos = (meses / 12).toFixed(1);
  const atingivel = meses < 600;
  const progresoFire = Math.min(100, (patrimonioAtual / meta) * 100);
  const anoFire = new Date().getFullYear() + Math.round(meses / 12);
  const idadeAtual = user?.age || 30;
  const idadeFire = idadeAtual + Math.round(meses / 12);
  const leanMeta = targets.lean;
  const fatMeta = targets.fat;
  const leanMeses = months.lean;
  const fatMeses = months.fat;

  const Header = () => (
    <div className="flex items-center gap-2.5 mb-5">
      <Button variant="ghost" size="icon" onClick={() => onBack?.()} className="rounded-xl">
        <ArrowLeft size={16} />
      </Button>
      <div className="flex-1">
        <div className="eyebrow">Independência financeira</div>
        <div className="page-title text-[22px] m-0 flex items-center gap-2">
          Calculadora FIRE
          <HelpButton tooltipText="Projete sua independência financeira com patrimônio atual, aporte mensal, despesas desejadas e taxa de retorno." />
        </div>
      </div>
      <AreaTutorialButton area="futuro" onNavigate={onNavigate} />
    </div>
  );

  if (isLoading) {
    return (
      <div className={`${isTab ? "pt-0" : "pt-2.5"} flex flex-col gap-4`}>
        {!isTab && <Header />}
        <div className="flex items-center justify-center py-16 gap-3 text-[var(--t3)]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[14px]">Carregando dados financeiros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isTab ? "pt-0" : "pt-2.5"} pb-24 animate-in fade-in duration-300`}>
      {!isTab && <Header />}

      {/* Hero */}
      <div className="hero text-center px-5 py-6">
        <div className="text-[10px] text-[var(--t3)] uppercase tracking-[0.12em] font-semibold mb-2">
          {atingivel ? "Data estimada FIRE" : "Meta inalcançável no prazo"}
        </div>
        {atingivel ? (
          <>
            <div className="text-[38px] font-bold text-[var(--t1)] tracking-[-1.5px] font-mono">{anoFire}</div>
            <div className="text-[13px] text-[var(--t2)] mt-1">{anos} anos · aos {idadeFire} anos de idade</div>
          </>
        ) : (
          <div className="text-[15px] text-[var(--amber)] font-semibold mt-1">
            Aumente o aporte ou reduza a despesa desejada.
          </div>
        )}

        <div className="my-4">
          <div className="prog h-2.5">
            <div className="prog-fill" style={{ width: `${progresoFire}%`, background: "linear-gradient(90deg,var(--blue),var(--purple))" }} />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-[var(--t3)] font-mono">
          <span>Atual: {formatCurrency(patrimonioAtual)}</span>
          <span>{Math.round(progresoFire)}%</span>
          <span>Meta: {meta >= 1e6 ? `R$ ${(meta / 1e6).toFixed(1)}M` : formatCurrency(meta)}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="metric-grid mt-3">
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

      {/* Simulator */}
      <div className="sec-hd"><span className="sec-title">Simulador — ajuste sua meta</span></div>
      <div className="card">
        {/* Despesa */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className={labelClass}>Despesa mensal desejada na IF</div>
            <div className={valueClass}>{formatCurrency(despesa)}</div>
          </div>
          <input type="range" min="2000" max="30000" step="500" value={despesa}
            onChange={e => { const v = +e.target.value; setDespesa(v); updateFireConfig({ expense: v }); }}
            className={sliderClass}
          />
          <div className={subClass}><span>R$ 2.000 (Lean)</span><span>R$ 30.000 (Fat)</span></div>
        </div>

        {/* Aporte */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className={labelClass}>Aporte mensal</div>
            <div className={valueClass}>{formatCurrency(aporte)}</div>
          </div>
          <input type="range" min="100" max="15000" step="100" value={aporte}
            onChange={e => { const v = +e.target.value; setAporte(v); updateFireConfig({ contribution: v }); }}
            className={sliderClass}
          />
          {rendaAtual > 0 && (
            <div className="text-[9px] text-[var(--t3)] mt-0.5">
              {Math.round((aporte / rendaAtual) * 100)}% da sua renda atual
            </div>
          )}
        </div>

        {/* Taxa */}
        <div className="mb-1">
          <div className="flex justify-between items-center mb-2">
            <div className={labelClass}>Rentabilidade (a.a.)</div>
            <div className={valueClass}>{taxaAnual}%</div>
          </div>
          <input type="range" min="1" max="20" step="0.5" value={taxaAnual}
            onChange={e => { const v = +e.target.value; setTaxaAnual(v); updateFireConfig({ rate: v }); }}
            className={sliderClass}
          />
          <div className={subClass}><span>Poupança</span><span>CDI</span><span>Ações BR</span><span>Ações EUA</span></div>
        </div>

        {/* Result box */}
        <div className="mt-4 p-3.5 bg-[var(--blue3)] rounded-xl border border-blue-500/15">
          <div className="text-[10px] text-[var(--blue)] uppercase tracking-[0.06em] font-bold mb-2">
            Resultado com esses parâmetros
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-[var(--t3)] uppercase tracking-[0.05em] mb-0.5">Patrimônio alvo</div>
              <div className="text-[16px] font-bold text-[var(--t1)] font-mono">
                {meta >= 1e6 ? `R$ ${(meta / 1e6).toFixed(1)}M` : formatCurrency(meta)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--t3)] uppercase tracking-[0.05em] mb-0.5">Anos para FIRE</div>
              <div className="text-[16px] font-bold font-mono" style={{ color: atingivel ? "var(--blue)" : "var(--amber)" }}>
                {meses >= 600 ? "> 50 anos" : `${anos} anos`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIRE types */}
      <div className="sec-hd"><span className="sec-title">Tipos de FIRE</span></div>
      {[
        { em: "🌱", nm: "Lean FIRE", desc: `${formatCurrency(Math.round(despesa * 0.6))}/mês`, target: leanMeta, months: leanMeses, color: "var(--green)" },
        { em: "🔥", nm: "Regular FIRE", desc: `${formatCurrency(despesa)}/mês`, target: meta, months: meses, color: "var(--blue)", isActive: true },
        { em: "💎", nm: "Fat FIRE", desc: `${formatCurrency(Math.round(despesa * 1.8))}/mês`, target: fatMeta, months: fatMeses, color: "var(--amber)" },
      ].map(({ em, nm, desc, target, months: m, color, isActive }) => {
        const y = (m / 12).toFixed(1);
        return (
          <div
            key={nm}
            className="card mb-2.5"
            style={{ borderColor: isActive ? color : "transparent", borderWidth: isActive ? 1.5 : 1, borderStyle: "solid" }}
          >
            <div className="flex items-center gap-3">
              <div className="text-[24px]">{em}</div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[var(--t1)]">{nm} {isActive && "← você"}</div>
                <div className="text-[12px] text-[var(--t2)]">{desc}</div>
                <div className="text-[10px] text-[var(--t3)] mt-0.5">
                  Alvo: {target >= 1e6 ? `R$ ${(target / 1e6).toFixed(1)}M` : formatCurrency(target)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold font-mono" style={{ color }}>
                  {m >= 600 ? ">50 a." : `${y} a.`}
                </div>
                <div className="text-[9px] text-[var(--t3)]">{m < 600 ? `${new Date().getFullYear() + Math.round(m / 12)}` : "—"}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};