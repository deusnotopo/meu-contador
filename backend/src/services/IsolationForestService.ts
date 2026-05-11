/**
 * IsolationForestService
 * ──────────────────────
 * Detecção de anomalias via Isolation Forest — substitui o threshold fixo 1.5x.
 *
 * Vantagem: aprende o comportamento NORMAL daquele usuário específico.
 * Não precisa de calibração manual. Funciona com dados esparsos.
 *
 * Paper original: Liu, Fei Tony, Kai Ming Ting, and Zhi-Hua Zhou.
 * "Isolation forest." ICDM 2008.
 *
 * Implementação: TypeScript puro, zero dependências.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TransactionFeature {
  id: string;
  category: string;
  amountCents: number;
  dayOfMonth: number;    // 1–31
  dayOfWeek: number;     // 0–6 (0=Domingo)
  monthOfYear: number;   // 1–12
  isRecurring: boolean;
}

export interface AnomalyScore {
  transactionId: string;
  category: string;
  amountCents: number;
  anomalyScore: number;    // 0–1 (1 = mais anômalo)
  isAnomaly: boolean;
  reason: string;
}

// ── Isolation Tree ────────────────────────────────────────────────────────────

interface IsolationNode {
  feature?: number;        // índice da feature usada para split
  splitValue?: number;     // valor do split
  left?: IsolationNode;
  right?: IsolationNode;
  size: number;            // número de pontos que chegam a este nó
  isLeaf: boolean;
}

const MAX_DEPTH = 8;        // limitar profundidade para eficiência
const N_TREES = 100;        // número de árvores
const SAMPLE_SIZE = 256;    // sub-amostra por árvore (padrão do paper)
const ANOMALY_THRESHOLD = 0.6;  // score > 0.6 = anomalia

// Fator de normalização (Equação 2 do paper original)
function harmonicNumber(n: number): number {
  // Aproximação de Euler-Mascheroni
  return Math.log(n) + 0.5772156649;
}

function expectedPathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * harmonicNumber(n - 1) - (2 * (n - 1) / n);
}

// ── Tree Building ─────────────────────────────────────────────────────────────

function buildIsolationTree(
  data: number[][],
  depth: number,
  maxDepth: number
): IsolationNode {
  const n = data.length;

  if (n <= 1 || depth >= maxDepth) {
    return { size: n, isLeaf: true };
  }

  const nFeatures = data[0].length;

  // Escolher feature aleatória
  const featureIdx = Math.floor(Math.random() * nFeatures);
  const values = data.map(row => row[featureIdx]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  if (minVal === maxVal) {
    return { size: n, isLeaf: true };
  }

  // Split aleatório entre min e max
  const splitValue = minVal + Math.random() * (maxVal - minVal);

  const leftData = data.filter(row => row[featureIdx] < splitValue);
  const rightData = data.filter(row => row[featureIdx] >= splitValue);

  return {
    feature: featureIdx,
    splitValue,
    left: buildIsolationTree(leftData, depth + 1, maxDepth),
    right: buildIsolationTree(rightData, depth + 1, maxDepth),
    size: n,
    isLeaf: false,
  };
}

function pathLength(point: number[], node: IsolationNode, depth: number): number {
  if (node.isLeaf || node.feature === undefined || node.splitValue === undefined) {
    return depth + expectedPathLength(node.size);
  }

  if (point[node.feature] < node.splitValue) {
    return pathLength(point, node.left!, depth + 1);
  } else {
    return pathLength(point, node.right!, depth + 1);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export class IsolationForestService {
  private trees: IsolationNode[] = [];
  private trainedSampleSize = 0;

  /**
   * Treina o forest com os dados históricos de transações.
   * Deve ser chamado com dados dos últimos N meses.
   */
  public train(features: TransactionFeature[]): void {
    if (features.length < 4) {
      this.trees = [];
      return;
    }

    const vectors = features.map(f => this.featureToVector(f));
    const sampleSize = Math.min(SAMPLE_SIZE, features.length);
    this.trainedSampleSize = sampleSize;
    this.trees = [];

    for (let t = 0; t < N_TREES; t++) {
      // Sub-amostrar aleatoriamente
      const shuffled = [...vectors].sort(() => Math.random() - 0.5);
      const sample = shuffled.slice(0, sampleSize);
      this.trees.push(buildIsolationTree(sample, 0, MAX_DEPTH));
    }
  }

  /**
   * Calcula o score de anomalia para uma transação.
   * Retorna 0–1. Score > ANOMALY_THRESHOLD = anomalia.
   */
  public score(feature: TransactionFeature): number {
    if (this.trees.length === 0) return 0;

    const vector = this.featureToVector(feature);
    const avgPathLength = this.trees.reduce(
      (sum, tree) => sum + pathLength(vector, tree, 0),
      0
    ) / this.trees.length;

    // Normalização (Equação 1 do paper)
    const c = expectedPathLength(this.trainedSampleSize);
    if (c === 0) return 0;

    return parseFloat(Math.pow(2, -avgPathLength / c).toFixed(4));
  }

  /**
   * Analisa um conjunto de transações e retorna apenas as anômalas,
   * com score e razão explicada.
   */
  public detectAnomalies(
    historical: TransactionFeature[],
    current: TransactionFeature[]
  ): AnomalyScore[] {
    this.train(historical);

    return current
      .map(tx => {
        const s = this.score(tx);
        return {
          transactionId: tx.id,
          category: tx.category,
          amountCents: tx.amountCents,
          anomalyScore: s,
          isAnomaly: s > ANOMALY_THRESHOLD,
          reason: this.generateReason(tx, s),
        };
      })
      .filter(r => r.isAnomaly)
      .sort((a, b) => b.anomalyScore - a.anomalyScore);
  }

  private featureToVector(f: TransactionFeature): number[] {
    return [
      f.amountCents / 1_000_000,   // normalizar valor (assume max ~R$ 10k)
      f.dayOfMonth / 31,
      f.dayOfWeek / 6,
      f.monthOfYear / 12,
      f.isRecurring ? 0 : 1,       // não-recorrente = mais suspeito
    ];
  }

  private generateReason(tx: TransactionFeature, score: number): string {
    const pct = Math.round(score * 100);
    if (score > 0.85) {
      return `Transação altamente atípica (score: ${pct}%) — valor e timing raramente observados no histórico.`;
    }
    if (score > 0.75) {
      return `Padrão incomum detectado (score: ${pct}%) — esta combinação de valor e categoria é rara.`;
    }
    return `Anomalia moderada (score: ${pct}%) — comportamento levemente fora do padrão habitual.`;
  }
}
