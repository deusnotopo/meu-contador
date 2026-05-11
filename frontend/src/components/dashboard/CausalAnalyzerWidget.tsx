/**
 * CausalAnalyzerWidget
 * ─────────────────────
 * Interface de simulação contrafatual ("e se?").
 * Permite ao usuário explorar o impacto causal de decisões financeiras passadas.
 *
 * Powered by: CausalInferenceService (Granger Causality + OLS puro)
 */

import { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import '../../styles/cognitive-engine.css';
import {
  computeCounterfactual,
  type InterventionType,
  type MonthlyData,
  type CounterfactualResult,
} from '@/services/CausalInferenceService';
import { analyticsDB } from '../../services/DuckDBService';
import { logger } from '@/lib/logger';

// ── Constants ─────────────────────────────────────────────────────────────────

const INTERVENTION_OPTIONS: { value: InterventionType; label: string; placeholder: string; needsCategory: boolean; needsValue: boolean }[] = [
  {
    value: 'REMOVE_CATEGORY',
    label: '❌ Remover categoria de gastos',
    placeholder: 'Ex: Restaurantes',
    needsCategory: true,
    needsValue: false,
  },
  {
    value: 'CAP_SPENDING',
    label: '🎯 Limitar gastos mensais (R$)',
    placeholder: '',
    needsCategory: false,
    needsValue: true,
  },
  {
    value: 'INCREASE_INCOME',
    label: '💰 Aumentar renda mensal (R$)',
    placeholder: '',
    needsCategory: false,
    needsValue: true,
  },
  {
    value: 'REDUCE_DEBT_PAYMENT',
    label: '🔄 Reduzir pagamento de dívidas (R$/mês)',
    placeholder: '',
    needsCategory: false,
    needsValue: true,
  },
];

const STRENGTH_CONFIG = {
  STRONG: { label: 'Forte', color: '#22c55e', icon: '💪' },
  MODERATE: { label: 'Moderado', color: '#f59e0b', icon: '📊' },
  WEAK: { label: 'Fraco', color: '#94a3b8', icon: '📉' },
  NEGLIGIBLE: { label: 'Negligível', color: '#64748b', icon: '≈' },
};

const fmt = (cents: number) =>
  `R$ ${(Math.abs(cents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// ── Chart Data ────────────────────────────────────────────────────────────────

function buildChartData(result: CounterfactualResult) {
  const months = result.originalTrajectory.map(p => p.month);
  return months.map((month, i) => ({
    month,
    'Real': Math.round((result.originalTrajectory[i]?.cumulativeSavingsCents ?? 0) / 100),
    'E se?': Math.round((result.counterfactualTrajectory[i]?.cumulativeSavingsCents ?? 0) / 100),
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CausalAnalyzerWidget() {
  const [interventionType, setInterventionType] = useState<InterventionType>('REMOVE_CATEGORY');
  const [categoryName, setCategoryName] = useState('');
  const [valueReais, setValueReais] = useState('');
  const [monthsBack, setMonthsBack] = useState(6);
  const [result, setResult] = useState<CounterfactualResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = INTERVENTION_OPTIONS.find(o => o.value === interventionType)!;

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        type: interventionType,
        monthsBack,
      };

      let valueInCents = undefined;
      if (selectedOption.needsCategory && categoryName.trim()) {
        body.categoryName = categoryName.trim();
      }

      if (selectedOption.needsValue && valueReais) {
        valueInCents = Math.round(parseFloat(valueReais) * 100);
        body.valueInCents = valueInCents;
      }

      // Consulta analítica de alta performance no DuckDB WASM
      const rows = await analyticsDB.query(`
        SELECT 
          substring(date, 1, 7) as month,
          type,
          category,
          sum(amount) as amount
        FROM transactions
        WHERE cast(substring(date, 1, 10) as DATE) >= current_date() - INTERVAL ${monthsBack} MONTH
        GROUP BY month, type, category
        ORDER BY month ASC
      `);

      const monthlyMap: Record<string, MonthlyData> = {};
      for (const row of rows) {
        const month = row.month as string;
        const type = row.type as string;
        const category = row.category as string;
        const amount = row.amount as number;
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, incomeCents: 0, expenseCents: 0, categoryCents: {} };
        }
        if (type === 'income') {
          monthlyMap[month].incomeCents += amount;
        } else if (type === 'expense') {
          monthlyMap[month].expenseCents += amount;
          monthlyMap[month].categoryCents[category] = amount;
        }
      }

      const monthlyData: MonthlyData[] = Object.values(monthlyMap);
      const computed = computeCounterfactual(monthlyData, {
        type: interventionType,
        categoryName: categoryName.trim(),
        valueInCents: valueInCents,
        monthsBack
      });

      setResult(computed);
    } catch (err) {
      logger.error('[CausalAnalyzerWidget] Analysis failed', err);
      setError('Não foi possível executar a análise. Verifique se há dados suficientes.')
    } finally {
      setLoading(false);
    }
  }, [interventionType, categoryName, valueReais, monthsBack, selectedOption]);

  return (
    <div className="causal-widget">
      {/* Header */}
      <div className="causal-widget__header">
        <div>
          <h3 className="causal-widget__title">🔬 Analisador Causal</h3>
          <p className="causal-widget__subtitle">
            "E se eu não tivesse feito X?" — Simulação contrafatual com Inferência Causal
          </p>
        </div>
        <div className="causal-widget__badge">
          <span>Granger + OLS</span>
        </div>
      </div>

      {/* Controls */}
      <div className="causal-widget__controls">
        {/* Intervention type */}
        <div className="causal-widget__field">
          <label className="causal-widget__label">Intervenção</label>
          <select
            id="causal-intervention-type"
            className="causal-widget__select"
            value={interventionType}
            onChange={e => {
              setInterventionType(e.target.value as InterventionType);
              setCategoryName('');
              setValueReais('');
              setResult(null);
            }}
          >
            {INTERVENTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category input */}
        {selectedOption.needsCategory && (
          <div className="causal-widget__field">
            <label className="causal-widget__label">Categoria</label>
            <input
              id="causal-category-name"
              type="text"
              className="causal-widget__input"
              placeholder={selectedOption.placeholder}
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
            />
          </div>
        )}

        {/* Value input */}
        {selectedOption.needsValue && (
          <div className="causal-widget__field">
            <label className="causal-widget__label">Valor (R$)</label>
            <input
              id="causal-value"
              type="number"
              min="0"
              step="50"
              className="causal-widget__input"
              placeholder="500,00"
              value={valueReais}
              onChange={e => setValueReais(e.target.value)}
            />
          </div>
        )}

        {/* Months back */}
        <div className="causal-widget__field">
          <label className="causal-widget__label">Período de análise</label>
          <select
            id="causal-months-back"
            className="causal-widget__select"
            value={monthsBack}
            onChange={e => setMonthsBack(Number(e.target.value))}
          >
            {[3, 6, 9, 12].map(m => (
              <option key={m} value={m}>{m} meses</option>
            ))}
          </select>
        </div>

        <button
          id="causal-run-button"
          className="causal-widget__button"
          onClick={runAnalysis}
          disabled={loading}
        >
          {loading ? '⏳ Analisando...' : '🔬 Simular'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="causal-widget__error">{error}</div>
      )}

      {/* Results */}
      {result && (
        <div className="causal-widget__results">
          {/* Impact summary */}
          <div
            className="causal-widget__impact"
            style={{
              borderColor: result.deltaWealthCents > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
              background: result.deltaWealthCents > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            }}
          >
            <div className="causal-widget__impact-main">
              <span
                className="causal-widget__delta"
                style={{ color: result.deltaWealthCents > 0 ? '#22c55e' : '#ef4444' }}
              >
                {result.deltaWealthCents > 0 ? '+' : '-'}{fmt(result.deltaWealthCents)}
              </span>
              <span className="causal-widget__delta-label">
                diferença em patrimônio acumulado
              </span>
            </div>
            <div className="causal-widget__impact-meta">
              <div className="causal-widget__strength">
                <span>{STRENGTH_CONFIG[result.causalStrength].icon}</span>
                <span style={{ color: STRENGTH_CONFIG[result.causalStrength].color }}>
                  Força causal: {STRENGTH_CONFIG[result.causalStrength].label}
                </span>
              </div>
              <div className="causal-widget__ci">
                IC 90%: {fmt(result.confidenceInterval[0])} → {fmt(result.confidenceInterval[1])}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <p className="causal-widget__explanation">{result.explanation}</p>

          {/* Chart */}
          {result.originalTrajectory.length > 0 && (
            <div className="causal-widget__chart">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={buildChartData(result)}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorCF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="Real"
                    stroke="#64748b"
                    strokeWidth={2}
                    fill="url(#colorReal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="E se?"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#colorCF)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Attribution */}
          <div className="causal-widget__attribution">
            🤖 Granger Causality · OLS · Counterfactual Simulation · LGPD-proof
          </div>
        </div>
      )}
    </div>
  );
}
