import { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/formatters";

interface RetirementViewProps {
  onBack?: (tab?: TabType) => void;
}

export const RetirementView = ({ onBack }: RetirementViewProps) => {
  const { user } = useAuth();
  const { totals } = useInvestments();

  const [currentAge, setCurrentAge] = useState(user?.age || 30);
  const [retireAge, setRetireAge] = useState(user?.retirementAge || 60);
  const [monthlyContribution, setMonthlyContribution] = useState(Math.round((user?.monthlyIncome || 0) * 0.15) || 1500);
  const [expectedReturnPct, setExpectedReturnPct] = useState(7); // Real return above inflation
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(Math.round((user?.monthlyIncome || 0) * 0.8) || 10000);

  // 1. Calculate the FIRE Target (Safe Withdrawal Rate of 4% per year)
  // Annual expenses = Monthly * 12
  // Target = Annual Expenses * 25 (which is 100/4)
  const fireTarget = targetMonthlyIncome * 12 * 25;

  // 2. Project future growth
  const initialCapital = totals.currentValue;
  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const monthsToRetire = yearsToRetire * 12;
  const monthlyRate = Math.pow(1 + expectedReturnPct / 100, 1 / 12) - 1;

  // FV = P(1+r)^n + PMT [ ((1+r)^n - 1) / r ]
  const futureValue = useMemo(() => {
    if (monthlyRate === 0) return initialCapital + monthlyContribution * monthsToRetire;
    
    // Growth of initial capital
    const compoundInitial = initialCapital * Math.pow(1 + monthlyRate, monthsToRetire);
    // Growth of PMT
    const compoundContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate);
    
    return compoundInitial + compoundContributions;
  }, [initialCapital, monthlyRate, monthsToRetire, monthlyContribution]);

  // Is on track?
  const isOnTrack = futureValue >= fireTarget;
  const progressToTarget = fireTarget > 0 ? (futureValue / fireTarget) * 100 : 0;
  
  // Calculate when they would actually hit the target at this rate
  const yearsToHitTarget = useMemo(() => {
    if (monthlyRate === 0) {
      if (monthlyContribution === 0) return 999;
      return (fireTarget - initialCapital) / (monthlyContribution * 12);
    }
    // NPER formula to find months to hit FV 
    // n = log( (FV*r + PMT) / (PV*r + PMT) ) / log(1+r)
    const num = fireTarget * monthlyRate + monthlyContribution;
    const den = initialCapital * monthlyRate + monthlyContribution;
    if (num <= 0 || den <= 0) return 999;
    const months = Math.log(num / den) / Math.log(1 + monthlyRate);
    return isNaN(months) ? 999 : months / 12;
  }, [fireTarget, initialCapital, monthlyContribution, monthlyRate]);

  const projectedRetireAge = Math.round(currentAge + yearsToHitTarget);

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease", paddingBottom: "100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => onBack?.()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <div className="eyebrow">Projeção FIRE</div>
          <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Futuro</div>
        </div>
      </div>

      <div className="hero" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>Patrimônio Projetado aos {retireAge}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: isOnTrack ? "var(--green)" : "var(--blue)", fontFamily: "var(--mono)", letterSpacing: "-1px" }}>
              {formatCurrency(futureValue)}
            </div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>
              Objetivo: {formatCurrency(fireTarget)}
            </div>
          </div>
        </div>

        <div className="prog" style={{ height: 8 }}>
          <div 
            className="prog-fill" 
            style={{ 
              width: `${Math.min(progressToTarget, 100)}%`, 
              background: isOnTrack ? "var(--green)" : "var(--blue)" 
            }} 
          />
        </div>
        
        {isOnTrack ? (
           <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8, fontWeight: 500 }}>
             ✓ Você alcançará a independência aos {projectedRetireAge} anos!
           </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 8, fontWeight: 500 }}>
             Faltam {formatCurrency(fireTarget - futureValue)} para a meta aos {retireAge} anos.
          </div>
        )}
      </div>

      {/* Simulator Sliders */}
      <div className="sec-hd"><span className="sec-title">Simulador</span></div>
      
      <div className="card">
        {/* Target Income */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: "var(--t1)", fontWeight: 500 }}>Renda Mensal na Aposentadoria</span>
            <span style={{ fontSize: 14, color: "var(--green)", fontFamily: "var(--mono)", fontWeight: 700 }}>{formatCurrency(targetMonthlyIncome)}</span>
          </div>
          <input 
            type="range" 
            min="2000" max="50000" step="500" 
            value={targetMonthlyIncome} 
            onChange={e => setTargetMonthlyIncome(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--green)" }}
          />
          <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>
            Define o Patrimônio Alvo (Regra dos 4%): {formatCurrency(fireTarget)}
          </div>
        </div>

        {/* Investimento Mensal */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: "var(--t1)", fontWeight: 500 }}>Aporte Mensal</span>
            <span style={{ fontSize: 14, color: "var(--blue)", fontFamily: "var(--mono)", fontWeight: 700 }}>{formatCurrency(monthlyContribution)}</span>
          </div>
          <input 
            type="range" 
            min="0" max="20000" step="100" 
            value={monthlyContribution} 
            onChange={e => setMonthlyContribution(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--blue)" }}
          />
        </div>

        {/* Idades */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 6 }}>Sua idade hoje</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button 
                className="btn-ghost" 
                style={{ padding: "0 12px", height: 36, fontSize: 18 }} 
                onClick={() => setCurrentAge(Math.max(18, currentAge - 1))}
              >-</button>
              <div style={{ fontSize: 18, fontFamily: "var(--mono)", fontWeight: 600, flex: 1, textAlign: "center" }}>{currentAge}</div>
              <button 
                className="btn-ghost" 
                style={{ padding: "0 12px", height: 36, fontSize: 18 }} 
                onClick={() => setCurrentAge(Math.min(90, currentAge + 1))}
              >+</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 6 }}>Idade objetivo</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button 
                className="btn-ghost" 
                style={{ padding: "0 12px", height: 36, fontSize: 18 }} 
                onClick={() => setRetireAge(Math.max(currentAge + 1, retireAge - 1))}
              >-</button>
              <div style={{ fontSize: 18, fontFamily: "var(--mono)", fontWeight: 600, flex: 1, textAlign: "center" }}>{retireAge}</div>
              <button 
                className="btn-ghost" 
                style={{ padding: "0 12px", height: 36, fontSize: 18 }} 
                onClick={() => setRetireAge(Math.min(100, retireAge + 1))}
              >+</button>
            </div>
          </div>
        </div>

        {/* Juros Reais */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: "var(--t1)", fontWeight: 500 }}>Taxa de Juros (Acima da inflação)</span>
            <span style={{ fontSize: 14, color: "var(--purple)", fontFamily: "var(--mono)", fontWeight: 700 }}>{expectedReturnPct}% ao ano</span>
          </div>
          <input 
            type="range" 
            min="0" max="15" step="0.5" 
            value={expectedReturnPct} 
            onChange={e => setExpectedReturnPct(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--purple)" }}
          />
        </div>
      </div>
      
      {/* Insight Contextual */}
      <div className="nudge good" style={{ marginTop: 16 }}>
        <div className="nudge-ttl" style={{ color: "var(--green)" }}>💡 A Mágica dos Juros Compostos</div>
        <div className="nudge-body" style={{ lineHeight: 1.5 }}>
          Ao investir {formatCurrency(monthlyContribution)} todo mês por {yearsToRetire} anos, você tirou do bolso <strong>{formatCurrency(monthlyContribution * monthsToRetire)}</strong>. <br/><br/>
          Mas com o rendimento de {expectedReturnPct}% a.a., seu patrimônio chega a <strong>{formatCurrency(futureValue)}</strong>.<br/>
          Ou seja, <strong>{Math.round(((futureValue - (monthlyContribution * monthsToRetire + initialCapital)) / futureValue) * 100)}%</strong> do seu patrimônio final veio de juros ganhos pelo tempo, não de suor!
        </div>
      </div>
    </div>
  );
};
