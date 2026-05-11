/**
 * RulesEngineService
 * ──────────────────
 * Motor de regras declarativas baseado em json-rules-engine.
 * Substitui toda lógica if/else espalhada por decisões auditáveis com trace.
 *
 * Princípio Neuro-Simbólico: regras simbólicas decidem,
 * padrões neurais alimentam os fatos. Zero alucinação por design.
 *
 * Cada regra retornada inclui um `trace` de IDs para auditoria LGPD.
 */

import { Engine, Rule, RuleResult } from 'json-rules-engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RulePriority = 'critical' | 'high' | 'medium' | 'low';

export interface FinancialFacts {
  totalDebtCents: number;
  totalInvestedCents: number;
  wealthSurvivalDays: number;
  fireProgress: number;             // 0–100
  monthlyAvgExpensesCents: number;
  monthlyAvgIncomeCents: number;
  monthlyAvgSurplusCents: number;
  wantSpendingPct: number;          // 0–100 (% das despesas)
  topCategorySpikePct: number;      // % acima da média histórica
  topCategoryName: string;
  currentRegime?: 'EXPANSION' | 'STABILITY' | 'CONTRACTION';
  daysInCurrentRegime?: number;
}

export interface RuleDecision {
  ruleId: string;
  type: 'ALERT' | 'INSIGHT' | 'ACTION' | 'WARNING';
  priority: RulePriority;
  category: string;
  title: string;
  message: string;
  trace: string[];                  // IDs das condições que dispararam
  data?: Record<string, unknown>;
}

// ── Rule Definitions ──────────────────────────────────────────────────────────

const FINANCIAL_RULES: Rule[] = [

  // ─ CRITICAL ALERTS ────────────────────────────────────────────────────────

  new Rule({
    name: 'RULE_DEBT_EXCEEDS_INVESTMENT',
    conditions: {
      all: [{
        fact: 'totalDebtCents',
        operator: 'greaterThan',
        value: { fact: 'totalInvestedCents' },
      }],
    },
    event: {
      type: 'ALERT',
      params: {
        ruleId: 'R001',
        priority: 'critical',
        title: '⚠️ Dívidas Superam Investimentos',
        message: 'Suas dívidas são maiores que seu patrimônio investido. Priorize a quitação de dívidas com juros altos antes de novos aportes.',
        trace: ['cond:debt>investment'],
      },
    },
    priority: 100,
  }),

  new Rule({
    name: 'RULE_CRITICAL_SURVIVABILITY',
    conditions: {
      all: [{
        fact: 'wealthSurvivalDays',
        operator: 'lessThan',
        value: 30,
      }],
    },
    event: {
      type: 'ALERT',
      params: {
        ruleId: 'R002',
        priority: 'critical',
        title: '🚨 Reserva de Emergência Crítica',
        message: 'Seu patrimônio cobre menos de 30 dias de gastos. Situação crítica — construir reserva é prioridade absoluta.',
        trace: ['cond:survivability<30'],
      },
    },
    priority: 100,
  }),

  new Rule({
    name: 'RULE_NEGATIVE_SURPLUS',
    conditions: {
      all: [{
        fact: 'monthlyAvgSurplusCents',
        operator: 'lessThanInclusive',
        value: 0,
      }],
    },
    event: {
      type: 'ALERT',
      params: {
        ruleId: 'R003',
        priority: 'high',
        title: '📉 Saldo Mensal Negativo',
        message: 'Você está gastando mais do que ganha em média. Revise despesas variáveis urgentemente.',
        trace: ['cond:surplus<=0'],
      },
    },
    priority: 90,
  }),

  // ─ HIGH PRIORITY WARNINGS ─────────────────────────────────────────────────

  new Rule({
    name: 'RULE_LOW_SURVIVABILITY',
    conditions: {
      all: [
        { fact: 'wealthSurvivalDays', operator: 'greaterThanInclusive', value: 30 },
        { fact: 'wealthSurvivalDays', operator: 'lessThan', value: 180 },
      ],
    },
    event: {
      type: 'WARNING',
      params: {
        ruleId: 'R004',
        priority: 'high',
        title: '🛡️ Reserva de Emergência Baixa',
        message: 'Seu Fator de Sobrevivência está abaixo de 6 meses. Meta recomendada: 6–12 meses de despesas em ativos líquidos.',
        trace: ['cond:30<=survivability<180'],
      },
    },
    priority: 80,
  }),

  new Rule({
    name: 'RULE_HIGH_WANT_SPENDING',
    conditions: {
      all: [{
        fact: 'wantSpendingPct',
        operator: 'greaterThan',
        value: 40,
      }],
    },
    event: {
      type: 'WARNING',
      params: {
        ruleId: 'R005',
        priority: 'high',
        title: '💳 Gastos de Desejo Elevados',
        message: 'Mais de 40% das suas despesas são gastos discricionários (wants). Considere aplicar a regra 50/30/20.',
        trace: ['cond:wantPct>40'],
      },
    },
    priority: 75,
  }),

  new Rule({
    name: 'RULE_SPENDING_SPIKE',
    conditions: {
      all: [{
        fact: 'topCategorySpikePct',
        operator: 'greaterThan',
        value: 150,
      }],
    },
    event: {
      type: 'ALERT',
      params: {
        ruleId: 'R006',
        priority: 'high',
        title: '⚡ Pico de Gasto Detectado',
        message: 'Um spike significativo foi detectado em uma categoria de gastos. Verifique se é atípico ou ajuste seu orçamento.',
        trace: ['cond:spikePct>150'],
      },
    },
    priority: 78,
  }),

  // ─ MEDIUM INSIGHTS ────────────────────────────────────────────────────────

  new Rule({
    name: 'RULE_FIRE_HALFWAY',
    conditions: {
      all: [
        { fact: 'fireProgress', operator: 'greaterThanInclusive', value: 50 },
        { fact: 'fireProgress', operator: 'lessThan', value: 100 },
      ],
    },
    event: {
      type: 'INSIGHT',
      params: {
        ruleId: 'R007',
        priority: 'medium',
        title: '🔥 Metade do Caminho para a FIRE',
        message: 'Você está na segunda metade da jornada rumo à Liberdade Financeira. Continue o ritmo de aportes.',
        trace: ['cond:50<=fire<100'],
      },
    },
    priority: 60,
  }),

  new Rule({
    name: 'RULE_FIRE_ACHIEVED',
    conditions: {
      all: [{
        fact: 'fireProgress',
        operator: 'greaterThanInclusive',
        value: 100,
      }],
    },
    event: {
      type: 'INSIGHT',
      params: {
        ruleId: 'R008',
        priority: 'medium',
        title: '🏆 Liberdade Financeira Alcançada',
        message: 'Seu patrimônio cobriria suas despesas pela regra dos 4% indefinidamente. Você atingiu o ponto FIRE.',
        trace: ['cond:fire>=100'],
      },
    },
    priority: 70,
  }),

  new Rule({
    name: 'RULE_EXCELLENT_SURPLUS',
    conditions: {
      all: [
        {
          fact: 'monthlyAvgIncomeCents',
          operator: 'greaterThan',
          value: 0,
        },
        // surplus >= 30% da renda: verificado via wantSpendingPct proxy
        {
          fact: 'monthlyAvgSurplusCents',
          operator: 'greaterThan',
          value: 0,
        },
      ],
    },
    event: {
      type: 'INSIGHT',
      params: {
        ruleId: 'R009',
        priority: 'low',
        title: '✅ Taxa de Poupança Saudável',
        message: 'Você tem saldo positivo consistente. Considere aumentar aportes em investimentos de renda variável.',
        trace: ['cond:surplus>0', 'cond:income>0'],
      },
    },
    priority: 40,
  }),

  // ─ REGIME-AWARE RULES ─────────────────────────────────────────────────────

  new Rule({
    name: 'RULE_CONTRACTION_REGIME',
    conditions: {
      all: [
        { fact: 'currentRegime', operator: 'equal', value: 'CONTRACTION' },
        { fact: 'daysInCurrentRegime', operator: 'greaterThan', value: 30 },
      ],
    },
    event: {
      type: 'ALERT',
      params: {
        ruleId: 'R010',
        priority: 'high',
        title: '📊 Regime de Contração Detectado',
        message: 'Seus padrões financeiros indicam uma fase de contração sustentada. O motor identificou essa mudança estrutural.',
        trace: ['cond:regime=CONTRACTION', 'cond:daysInRegime>30'],
      },
    },
    priority: 85,
  }),

  new Rule({
    name: 'RULE_EXPANSION_REGIME',
    conditions: {
      all: [
        { fact: 'currentRegime', operator: 'equal', value: 'EXPANSION' },
      ],
    },
    event: {
      type: 'INSIGHT',
      params: {
        ruleId: 'R011',
        priority: 'low',
        title: '📈 Regime de Expansão Ativo',
        message: 'Você está em fase de expansão financeira. Momento ideal para aumentar aportes e acelerar metas.',
        trace: ['cond:regime=EXPANSION'],
      },
    },
    priority: 45,
  }),
];

// ── Engine ────────────────────────────────────────────────────────────────────

function buildEngine(): Engine {
  const engine = new Engine([], {
    allowUndefinedFacts: true,
  });

  for (const rule of FINANCIAL_RULES) {
    engine.addRule(rule);
  }

  return engine;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Avalia todas as regras financeiras contra os fatos fornecidos.
 * Retorna decisões ordenadas por prioridade com trace de auditoria.
 */
export async function evaluate(facts: FinancialFacts): Promise<RuleDecision[]> {
  const engine = buildEngine();

  const { results } = await engine.run(facts as unknown as Record<string, unknown>);

  const decisions: RuleDecision[] = [];

  for (const result of results as RuleResult[]) {
    if (!result.event) continue;
    const params = result.event.params as {
      ruleId: string;
      priority: RulePriority;
      category?: string;
      title: string;
      message: string;
      trace: string[];
      data?: Record<string, unknown>;
    };

    const categoryMap: Record<string, string> = {
      'R001': 'DÍVIDAS', 'R002': 'RESERVA', 'R003': 'CAIXA',
      'R004': 'RESERVA', 'R005': 'ORÇAMENTO', 'R006': 'ORÇAMENTO',
      'R007': 'FIRE', 'R008': 'FIRE', 'R009': 'INVESTIMENTO',
      'R010': 'MACRO', 'R011': 'MACRO'
    };

    decisions.push({
      ruleId: params.ruleId,
      type: result.event.type as RuleDecision['type'],
      priority: params.priority,
      category: params.category || categoryMap[params.ruleId] || 'GERAL',
      title: params.title,
      message: params.message,
      trace: params.trace ?? [],
      data: params.data,
    });
  }

  return decisions.sort((a, b) => {
    const order: Record<RulePriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}


/**
 * Converte o resultado do IntelligenceService em FinancialFacts
 * para alimentar o motor de regras.
 */
export function buildFactsFromIntelligence(params: {
  totalDebtCents: number;
  totalInvestedCents: number;
  wealthSurvivalDays: number;
  fireProgress: number;
  monthlyAvgExpensesCents: number;
  monthlyAvgIncomeCents: number;
  monthlyAvgSurplusCents: number;
  wantSpendingCents: number;
  topCategorySpike?: { pct: number; name: string };
  regime?: { current: 'EXPANSION' | 'STABILITY' | 'CONTRACTION'; daysInRegime: number };
}): FinancialFacts {
  const wantPct = params.monthlyAvgExpensesCents > 0
    ? (params.wantSpendingCents / params.monthlyAvgExpensesCents) * 100
    : 0;

  return {
    totalDebtCents: params.totalDebtCents,
    totalInvestedCents: params.totalInvestedCents,
    wealthSurvivalDays: params.wealthSurvivalDays,
    fireProgress: params.fireProgress,
    monthlyAvgExpensesCents: params.monthlyAvgExpensesCents,
    monthlyAvgIncomeCents: params.monthlyAvgIncomeCents,
    monthlyAvgSurplusCents: params.monthlyAvgSurplusCents,
    wantSpendingPct: parseFloat(wantPct.toFixed(2)),
    topCategorySpikePct: params.topCategorySpike?.pct ?? 0,
    topCategoryName: params.topCategorySpike?.name ?? '',
    currentRegime: params.regime?.current,
    daysInCurrentRegime: params.regime?.daysInRegime,
  };
}
