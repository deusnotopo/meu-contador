import { useMemo } from 'react';

export interface StrategyParams {
  monthlyIncome: number;
  monthlyExpenses?: number;
  hasDebts?: boolean;
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  employmentType?: 'clt' | 'pj';
  dependents?: number;
  age?: number;
}

export const useStrategyRules = (params: StrategyParams) => {
  return useMemo(() => {
    let pE = 0.5, pL = 0.3, pF = 0.2; // Moderado Clássico
    let ruleName = "50/30/20";
    let reserveMonths = 6;

    if (params.monthlyIncome < 3000 || params.hasDebts) {
      pE = 0.6; pL = 0.3; pF = 0.1;
      ruleName = "60/30/10";
      reserveMonths = 3;
    } else if (params.riskProfile === "aggressive") {
      pE = 0.4; pL = 0.2; pF = 0.4;
      ruleName = "40/20/40";
      reserveMonths = 3;
    } else if (params.riskProfile === "conservative") {
      pE = 0.5; pL = 0.2; pF = 0.3;
      ruleName = "50/20/30";
      reserveMonths = 12;
    }

    if (params.employmentType === "pj") {
      reserveMonths = Math.max(reserveMonths, 12);
    }
    if ((params.dependents ?? 0) > 2) {
      reserveMonths = Math.max(reserveMonths, 9);
    }

    const data = [
      { name: 'Essencial', value: pE * 100, color: '#6366f1' },
      { name: 'Estilo de Vida', value: pL * 100, color: '#a855f7' },
      { name: 'Futuro', value: pF * 100, color: '#10b981' },
    ];

    const monthlyInvest = params.monthlyIncome * pF;
    const monthlyExpenseBase = Math.max(params.monthlyExpenses || 0, params.monthlyIncome * pE);
    const rate = 0.0087; // approx 10.5% a.a. Focus: CDI BR
    const projection10y = monthlyInvest * ((Math.pow(1 + rate, 120) - 1) / rate);
    const projection20y = monthlyInvest * ((Math.pow(1 + rate, 240) - 1) / rate);

    return {
      ruleName,
      pE, pL, pF,
      reserveMonths,
      data,
      monthlyInvest,
      projection10y,
      projection20y,
      reserveTarget: monthlyExpenseBase * reserveMonths,
      essentialsTarget: params.monthlyIncome * pE,
      lifestyleTarget: params.monthlyIncome * pL,
    };
  }, [params]);
};
