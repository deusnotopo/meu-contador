/**
 * RegimeWidget
 * ────────────
 * Exibe o regime financeiro atual detectado pelo HMM (Hidden Markov Model).
 * Mostra: regime atual, há quantos dias, tendência e histórico de transições.
 */

import '../../styles/cognitive-engine.css';

type FinancialRegime = 'EXPANSION' | 'STABILITY' | 'CONTRACTION';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegimePoint {
  month: string;
  regime: FinancialRegime;
  surplusRatio: number;
  confidence: number;
}

export interface RegimeResult {
  currentRegime: FinancialRegime;
  regimeSince: string;
  daysInRegime: number;
  confidence: number;
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  history: RegimePoint[];
  changePoints: string[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const REGIME_CONFIG: Record<FinancialRegime, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  EXPANSION: {
    label: 'Expansão',
    emoji: '📈',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    description: 'Suas finanças estão crescendo. Momento ideal para aumentar aportes.',
  },
  STABILITY: {
    label: 'Estabilidade',
    emoji: '⚖️',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    description: 'Padrão financeiro estável. Mantenha a disciplina e planeje o próximo passo.',
  },
  CONTRACTION: {
    label: 'Contração',
    emoji: '📉',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Fase de contração detectada. Revise gastos e fortaleça sua reserva.',
  },
};

const TREND_CONFIG = {
  IMPROVING: { label: 'Melhorando', icon: '↗', color: '#22c55e' },
  STABLE: { label: 'Estável', icon: '→', color: '#94a3b8' },
  DETERIORATING: { label: 'Piorando', icon: '↘', color: '#ef4444' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface RegimeWidgetProps {
  regime?: RegimeResult | null;
  isLoading?: boolean;
}

export function RegimeWidget({ regime, isLoading }: RegimeWidgetProps) {
  if (isLoading) {
    return (
      <div className="regime-widget animate-pulse-akita opacity-50 bg-white/5 border border-white/10 rounded-3xl h-[280px]" />
    );
  }

  if (!regime) {
    return (
      <div className="regime-widget regime-widget--error">
        <span>⚠️ Dados insuficientes para análise de regime.</span>
        <span className="regime-widget__hint">Registre pelo menos 3 meses de transações.</span>
      </div>
    );
  }

  const config = regime.currentRegime in REGIME_CONFIG ? REGIME_CONFIG[regime.currentRegime] : REGIME_CONFIG.STABILITY;
  const trendConfig = regime.trend in TREND_CONFIG ? TREND_CONFIG[regime.trend] : TREND_CONFIG.STABLE;

  return (
    <div
      className="regime-widget"
      style={{ borderColor: config.borderColor, background: config.bgColor }}
    >
      {/* Header */}
      <div className="regime-widget__header">
        <div className="regime-widget__badge" style={{ color: config.color }}>
          <span className="regime-widget__emoji">{config.emoji}</span>
          <span className="regime-widget__label" style={{ color: config.color }}>
            Regime {config.label}
          </span>
        </div>
        <div
          className="regime-widget__trend"
          style={{ color: trendConfig.color }}
          title={`Tendência: ${trendConfig.label}`}
        >
          <span>{trendConfig.icon}</span>
          <span className="regime-widget__trend-label">{trendConfig.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="regime-widget__description">{config.description}</p>

      {/* Stats */}
      <div className="regime-widget__stats">
        <div className="regime-widget__stat">
          <span className="regime-widget__stat-value">{regime.daysInRegime}</span>
          <span className="regime-widget__stat-label">dias neste regime</span>
        </div>
        <div className="regime-widget__stat">
          <span className="regime-widget__stat-value">
            {Math.round(regime.confidence * 100)}%
          </span>
          <span className="regime-widget__stat-label">confiança do modelo</span>
        </div>
        <div className="regime-widget__stat">
          <span className="regime-widget__stat-value">{regime.changePoints.length}</span>
          <span className="regime-widget__stat-label">mudanças detectadas</span>
        </div>
      </div>

      {/* History timeline */}
      {regime.history.length > 0 && (
        <div className="regime-widget__timeline">
          <span className="regime-widget__timeline-title">Histórico de regimes</span>
          <div className="regime-widget__bars">
            {regime.history.slice(-12).map((point) => {
              const c = point.regime in REGIME_CONFIG ? REGIME_CONFIG[point.regime] : REGIME_CONFIG.STABILITY;
              const isChangePoint = regime.changePoints.includes(point.month);
              return (
                <div
                  key={point.month}
                  className="regime-widget__bar-wrapper"
                  title={`${point.month}: ${c.label} (${Math.round(point.surplusRatio * 100)}% surplus)`}
                >
                  <div
                    className={`regime-widget__bar ${isChangePoint ? 'regime-widget__bar--change' : ''}`}
                    style={{
                      backgroundColor: c.color,
                      opacity: 0.4 + (point.confidence * 0.6),
                    }}
                  />
                  {isChangePoint && (
                    <div className="regime-widget__change-marker" style={{ color: c.color }}>
                      ●
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="regime-widget__legend">
            {Object.entries(REGIME_CONFIG).map(([key, val]) => (
              <div key={key} className="regime-widget__legend-item">
                <div
                  className="regime-widget__legend-dot"
                  style={{ backgroundColor: val.color }}
                />
                <span>{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HMM attribution */}
      <div className="regime-widget__footer">
        <span>🤖 Motor HMM (Viterbi) · LGPD-proof</span>
        <span>Desde {regime.regimeSince}</span>
      </div>
    </div>
  );
}
