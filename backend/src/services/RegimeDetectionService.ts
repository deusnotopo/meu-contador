/**
 * RegimeDetectionService
 * ──────────────────────
 * Detecção do regime financeiro atual usando Hidden Markov Model (HMM).
 *
 * 3 regimes: EXPANSION | STABILITY | CONTRACTION
 * Implementação puramente matemática em TypeScript — zero dependências externas.
 *
 * Algoritmos:
 * - Viterbi: decodificação da sequência mais provável de regimes
 * - Change Point Detection (CUSUM): detecta quando o regime mudou
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type FinancialRegime = 'EXPANSION' | 'STABILITY' | 'CONTRACTION';

export interface RegimePoint {
  month: string;              // 'YYYY-MM'
  regime: FinancialRegime;
  surplusRatio: number;       // surplus / income (normalizado)
  expenseGrowth: number;      // crescimento % de despesas
  confidence: number;         // 0–1
}

export interface RegimeResult {
  currentRegime: FinancialRegime;
  regimeSince: string;          // 'YYYY-MM'
  daysInRegime: number;
  confidence: number;
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  history: RegimePoint[];
  changePoints: string[];       // meses onde houve troca de regime
}

export interface MonthlyObservation {
  month: string;
  totalIncomeCents: number;
  totalExpenseCents: number;
}

// ── HMM Parameters ───────────────────────────────────────────────────────────
// Parâmetros pré-estimados com base em comportamento típico de finanças pessoais.
// Em produção, seria atualizado com Baum-Welch por usuário.

const REGIME_NAMES: FinancialRegime[] = ['EXPANSION', 'STABILITY', 'CONTRACTION'];
const N_STATES = 3;

// Probabilidades de transição entre regimes (matriz 3x3)
// [de EXPANSION][para EXPANSION, STABILITY, CONTRACTION]
const TRANSITION_MATRIX: number[][] = [
  [0.70, 0.25, 0.05],  // De EXPANSION
  [0.20, 0.65, 0.15],  // De STABILITY
  [0.05, 0.30, 0.65],  // De CONTRACTION
];

// Prior de início: maioria começa em STABILITY
const INITIAL_PROBS: number[] = [0.15, 0.65, 0.20];

// Parâmetros de emissão: Gaussian Mixture por estado
// [μ (surplus ratio médio), σ (desvio padrão)]
const EMISSION_PARAMS: { mean: number; std: number }[] = [
  { mean: 0.30, std: 0.10 },   // EXPANSION: surplus ~30% da renda
  { mean: 0.10, std: 0.08 },   // STABILITY: surplus ~10% da renda
  { mean: -0.10, std: 0.12 },  // CONTRACTION: déficit médio de 10%
];

// ── Math Utilities ────────────────────────────────────────────────────────────

function gaussianPDF(x: number, mean: number, std: number): number {
  const variance = std * std;
  const exponent = -Math.pow(x - mean, 2) / (2 * variance);
  return (1 / (Math.sqrt(2 * Math.PI * variance))) * Math.exp(exponent);
}

function normalizeVector(v: number[]): number[] {
  const sum = v.reduce((a, b) => a + b, 0);
  if (sum === 0) return v.map(() => 1 / v.length);
  return v.map(x => x / sum);
}

// ── Viterbi Algorithm ─────────────────────────────────────────────────────────

function viterbi(observations: number[]): { path: number[]; confidences: number[] } {
  const T = observations.length;
  if (T === 0) return { path: [], confidences: [] };

  // dp[t][s] = max log prob de chegar ao estado s no tempo t
  const dp: number[][] = Array.from({ length: T }, () => new Array(N_STATES).fill(-Infinity));
  // backpointer[t][s] = estado anterior que maximizou dp[t][s]
  const backpointer: number[][] = Array.from({ length: T }, () => new Array(N_STATES).fill(0));

  // Inicialização
  for (let s = 0; s < N_STATES; s++) {
    const emission = gaussianPDF(observations[0], EMISSION_PARAMS[s].mean, EMISSION_PARAMS[s].std);
    dp[0][s] = Math.log(INITIAL_PROBS[s] + 1e-300) + Math.log(emission + 1e-300);
  }

  // Recursão
  for (let t = 1; t < T; t++) {
    for (let s = 0; s < N_STATES; s++) {
      const emission = gaussianPDF(observations[t], EMISSION_PARAMS[s].mean, EMISSION_PARAMS[s].std);
      const logEmission = Math.log(emission + 1e-300);

      let maxProb = -Infinity;
      let maxPrev = 0;

      for (let prev = 0; prev < N_STATES; prev++) {
        const prob = dp[t - 1][prev] + Math.log(TRANSITION_MATRIX[prev][s] + 1e-300) + logEmission;
        if (prob > maxProb) {
          maxProb = prob;
          maxPrev = prev;
        }
      }

      dp[t][s] = maxProb;
      backpointer[t][s] = maxPrev;
    }
  }

  // Backtrack
  const path: number[] = new Array(T).fill(0);
  path[T - 1] = dp[T - 1].indexOf(Math.max(...dp[T - 1]));

  for (let t = T - 2; t >= 0; t--) {
    path[t] = backpointer[t + 1][path[t + 1]];
  }

  // Calcular confiança: softmax das probabilidades do último estado
  const lastProbs = dp[T - 1].map(Math.exp);
  const sumProbs = lastProbs.reduce((a, b) => a + b, 0);
  const confidences = lastProbs.map(p => p / (sumProbs || 1));

  return { path, confidences };
}

// ── Change Point Detection (CUSUM) ────────────────────────────────────────────

function detectChangePoints(series: number[], threshold = 0.15): number[] {
  const changePoints: number[] = [];
  let posCusum = 0;
  let negCusum = 0;
  const mean = series.reduce((a, b) => a + b, 0) / series.length;

  for (let i = 1; i < series.length; i++) {
    const deviation = series[i] - mean;
    posCusum = Math.max(0, posCusum + deviation);
    negCusum = Math.max(0, negCusum - deviation);

    if (posCusum > threshold || negCusum > threshold) {
      changePoints.push(i);
      posCusum = 0;
      negCusum = 0;
    }
  }

  return changePoints;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analisa série temporal de observações financeiras mensais
 * e retorna o regime atual + histórico de transições.
 */
export function detectRegime(observations: MonthlyObservation[]): RegimeResult {
  if (observations.length < 3) {
    return {
      currentRegime: 'STABILITY',
      regimeSince: observations[0]?.month ?? new Date().toISOString().slice(0, 7),
      daysInRegime: 0,
      confidence: 0.5,
      trend: 'STABLE',
      history: [],
      changePoints: [],
    };
  }

  // 1. Calcular surplus ratio por mês (observação principal)
  const surplusRatios = observations.map(obs => {
    if (obs.totalIncomeCents === 0) return 0;
    return (obs.totalIncomeCents - obs.totalExpenseCents) / obs.totalIncomeCents;
  });

  // 2. Calcular crescimento de despesas mês a mês
  const expenseGrowths = observations.map((obs, i) => {
    if (i === 0) return 0;
    const prev = observations[i - 1].totalExpenseCents;
    if (prev === 0) return 0;
    return (obs.totalExpenseCents - prev) / prev;
  });

  // 3. Feature combinada: surplus ratio (80% peso) + expense growth invertido (20%)
  const features = surplusRatios.map((sr, i) => sr * 0.8 - expenseGrowths[i] * 0.2);

  // 4. Viterbi para decodificação do regime
  const { path, confidences } = viterbi(features);

  // 5. Change points
  const cpIndices = detectChangePoints(features);
  const changePointMonths = cpIndices.map(i => observations[i].month);

  // 6. Construir histórico
  const history: RegimePoint[] = observations.map((obs, i) => ({
    month: obs.month,
    regime: REGIME_NAMES[path[i]],
    surplusRatio: parseFloat(surplusRatios[i].toFixed(4)),
    expenseGrowth: parseFloat(expenseGrowths[i].toFixed(4)),
    confidence: parseFloat(
      normalizeVector([
        gaussianPDF(features[i], EMISSION_PARAMS[path[i]].mean, EMISSION_PARAMS[path[i]].std),
        0.1,
      ])[0].toFixed(3)
    ),
  }));

  // 7. Regime atual e desde quando
  const currentStateIdx = path[path.length - 1];
  const currentRegime = REGIME_NAMES[currentStateIdx];
  const currentConfidence = confidences[currentStateIdx] ?? 0.5;

  // Encontrar o início do regime atual (última mudança)
  let regimeSinceIdx = history.length - 1;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].regime !== currentRegime) break;
    regimeSinceIdx = i;
  }

  const regimeSinceMonth = history[regimeSinceIdx].month;

  // Calcular dias desde o início do regime
  const [year, month] = regimeSinceMonth.split('-').map(Number);
  const regimeSinceDate = new Date(year, month - 1, 1);
  const daysInRegime = Math.floor((Date.now() - regimeSinceDate.getTime()) / (1000 * 60 * 60 * 24));

  // 8. Tendência: comparar último mês vs penúltimo
  let trend: RegimeResult['trend'] = 'STABLE';
  if (history.length >= 2) {
    const last = history[history.length - 1].surplusRatio;
    const prev = history[history.length - 2].surplusRatio;
    const delta = last - prev;
    if (delta > 0.05) trend = 'IMPROVING';
    else if (delta < -0.05) trend = 'DETERIORATING';
  }

  return {
    currentRegime,
    regimeSince: regimeSinceMonth,
    daysInRegime: Math.max(0, daysInRegime),
    confidence: parseFloat(currentConfidence.toFixed(3)),
    trend,
    history,
    changePoints: changePointMonths,
  };
}
