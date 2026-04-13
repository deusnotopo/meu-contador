import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Target, Shield, Brain } from 'lucide-react';
import { useBrasilFinance } from '@/hooks/useBrasilFinance';
import { useEmotionalJournal } from '@/hooks/useEmotionalJournal';
import { useGamification } from '@/hooks/useGamification';
import { useMemo } from 'react';

interface PulseMetric {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

export function FinancialPulse() {
  const { metrics, financialScore, indicators, insights, monthsEmergencyReserve } = useBrasilFinance();
  const { stats: emotionalStats } = useEmotionalJournal();
  useGamification();

  // Calculate all pulse metrics
  const pulseMetrics = useMemo((): PulseMetric[] => {
    const metricsList: PulseMetric[] = [];

    // 1. Savings Rate (Taxa de Poupança)
    const savingsRate = metrics.savingsRate;
    metricsList.push({
      id: 'savings',
      label: 'Taxa de Poupança',
      value: savingsRate,
      maxValue: 30,
      unit: '%',
      icon: <Target size={16} />,
      color: savingsRate >= 20 ? '#22c55e' : savingsRate >= 10 ? '#f59e0b' : '#ef4444',
      status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate > 0 ? 'warning' : 'critical',
      trend: savingsRate >= 15 ? 'up' : savingsRate >= 5 ? 'stable' : 'down',
      description: savingsRate >= 20 
        ? 'Excelente! Você está acima da média brasileira.'
        : savingsRate >= 10 
        ? 'Bom, mas tente chegar a 20% para independência financeira.'
        : 'Atenção! Tente economizar pelo menos 10% da renda.',
    });

    // 2. Emergency Reserve (Reserva de Emergência)
    const emergencyMonths = monthsEmergencyReserve;
    metricsList.push({
      id: 'emergency',
      label: 'Reserva de Emergência',
      value: emergencyMonths,
      maxValue: 12,
      unit: 'meses',
      icon: <Shield size={16} />,
      color: emergencyMonths >= 6 ? '#22c55e' : emergencyMonths >= 3 ? '#f59e0b' : '#ef4444',
      status: emergencyMonths >= 6 ? 'excellent' : emergencyMonths >= 3 ? 'good' : emergencyMonths > 0 ? 'warning' : 'critical',
      trend: emergencyMonths >= 6 ? 'up' : emergencyMonths >= 3 ? 'stable' : 'down',
      description: emergencyMonths >= 6
        ? 'Proteção financeira sólida para imprevistos.'
        : emergencyMonths >= 3
        ? 'Reserva mínima. Continue aumentando.'
        : 'Crítico! Comece sua reserva de emergência hoje.',
    });

    // 3. Debt Ratio (Endividamento)
    const debtRatio = metrics.portfolioValue > 0 
      ? (metrics.totalDebt / metrics.portfolioValue) * 100 
      : metrics.totalDebt > 0 ? 100 : 0;
    metricsList.push({
      id: 'debt',
      label: 'Nível de Endividamento',
      value: debtRatio,
      maxValue: 100,
      unit: '%',
      icon: <AlertTriangle size={16} />,
      color: debtRatio <= 20 ? '#22c55e' : debtRatio <= 50 ? '#f59e0b' : '#ef4444',
      status: debtRatio <= 20 ? 'excellent' : debtRatio <= 50 ? 'good' : 'warning',
      trend: debtRatio <= 20 ? 'up' : debtRatio <= 50 ? 'stable' : 'down',
      description: debtRatio <= 20
        ? 'Endividamento controlado. Continue assim!'
        : debtRatio <= 50
        ? 'Endividamento moderado. Priorize quitar dívidas caras.'
        : 'Endividamento alto! Use o método avalanche.',
    });

    // 4. Investment Diversification (Diversificação)
    const diversification = metrics.investmentTypes;
    metricsList.push({
      id: 'diversification',
      label: 'Diversificação',
      value: diversification,
      maxValue: 5,
      unit: 'tipos',
      icon: <TrendingUp size={16} />,
      color: diversification >= 4 ? '#22c55e' : diversification >= 2 ? '#f59e0b' : '#ef4444',
      status: diversification >= 4 ? 'excellent' : diversification >= 2 ? 'good' : 'warning',
      trend: diversification >= 3 ? 'up' : diversification >= 2 ? 'stable' : 'down',
      description: diversification >= 4
        ? 'Carteira bem diversificada! Excelente proteção.'
        : diversification >= 2
        ? 'Bom começo. Considere adicionar mais classes.'
        : 'Carteira concentrada. Diversifique para reduzir risco.',
    });

    // 5. Emotional Health (Saúde Emocional)
    const emotionalHealth = emotionalStats.averageSatisfaction;
    metricsList.push({
      id: 'emotional',
      label: 'Saúde Emocional',
      value: emotionalHealth,
      maxValue: 5,
      unit: '/5',
      icon: <Heart size={16} />,
      color: emotionalHealth >= 4 ? '#22c55e' : emotionalHealth >= 3 ? '#f59e0b' : '#ef4444',
      status: emotionalHealth >= 4 ? 'excellent' : emotionalHealth >= 3 ? 'good' : 'warning',
      trend: emotionalHealth >= 4 ? 'up' : emotionalHealth >= 3 ? 'stable' : 'down',
      description: emotionalHealth >= 4
        ? 'Compras conscientes! Você no controle.'
        : emotionalHealth >= 3
        ? 'Bom equilíbrio. Continue monitorando.'
        : 'Atenção ao padrão emocional de gastos.',
    });

    // 6. Financial Health Score (Score Geral)
    metricsList.push({
      id: 'score',
      label: 'Score Financeiro',
      value: financialScore.score,
      maxValue: 100,
      unit: 'pts',
      icon: <Zap size={16} />,
      color: financialScore.cor,
      status: financialScore.score >= 80 ? 'excellent' : financialScore.score >= 60 ? 'good' : financialScore.score >= 40 ? 'warning' : 'critical',
      trend: financialScore.score >= 70 ? 'up' : financialScore.score >= 50 ? 'stable' : 'down',
      description: financialScore.classificacao,
    });

    return metricsList;
  }, [metrics, financialScore, monthsEmergencyReserve, emotionalStats]);

  // Calculate overall pulse (heartbeat)
  const overallPulse = useMemo(() => {
    const excellentCount = pulseMetrics.filter(m => m.status === 'excellent').length;
    const goodCount = pulseMetrics.filter(m => m.status === 'good').length;
    const warningCount = pulseMetrics.filter(m => m.status === 'warning').length;
    const criticalCount = pulseMetrics.filter(m => m.status === 'critical').length;

    if (criticalCount > 0) return { bpm: 120, status: 'critical', color: '#ef4444', emoji: '🚨' };
    if (warningCount > 1) return { bpm: 90, status: 'warning', color: '#f59e0b', emoji: '⚠️' };
    if (goodCount >= 3) return { bpm: 72, status: 'good', color: '#22c55e', emoji: '💚' };
    if (excellentCount >= 3) return { bpm: 60, status: 'excellent', color: '#22c55e', emoji: '🎉' };
    return { bpm: 75, status: 'stable', color: '#94a3b8', emoji: '📊' };
  }, [pulseMetrics]);

  return (
    <div className="space-y-6">
      {/* Main Pulse Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--bg)]/80 to-[var(--card)]/80 border border-white/10 p-6"
      >
        {/* Animated Heartbeat Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 60 / overallPulse.bpm,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 left-1/2 -tran[var(--t3)]x-1/2 -tran[var(--t3)]y-1/2 w-[400px] h-[400px] rounded-full"
            style={{ background: `radial-gradient(circle, ${overallPulse.color}20 0%, transparent 70%)` }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 60 / overallPulse.bpm, repeat: Infinity }}
              className="p-3 rounded-2xl"
              style={{ background: `${overallPulse.color}20` }}
            >
              <Heart size={28} style={{ color: overallPulse.color }} />
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Pulse Financeiro</h2>
              <p className="text-sm text-[var(--t3)]">Monitoramento em tempo real</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: overallPulse.color }}>
              {overallPulse.bpm} BPM
            </div>
            <div className="text-xs text-[var(--t4)] uppercase tracking-widest font-bold">
              {overallPulse.status}
            </div>
          </div>
        </div>

        {/* Pulse Metrics Grid */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {pulseMetrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: `${metric.color}20` }}>
                    {metric.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.trend === 'up' && <TrendingUp size={12} className="text-emerald-400" />}
                    {metric.trend === 'down' && <TrendingDown size={12} className="text-rose-400" />}
                    {metric.trend === 'stable' && <div className="w-3 h-0.5 bg-[var(--t4)] rounded-full" />}
                  </div>
                </div>

                {/* Metric Value */}
                <div className="mb-2">
                  <div className="text-2xl font-black" style={{ color: metric.color }}>
                    {metric.value.toFixed(metric.id === 'emotional' ? 1 : 0)}
                    <span className="text-sm font-medium text-[var(--t3)] ml-1">{metric.unit}</span>
                  </div>
                  <div className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">
                    {metric.label}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: metric.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((metric.value / metric.maxValue) * 100, 100)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>

                {/* Description */}
                <p className="text-[10px] text-[var(--t4)] leading-relaxed">{metric.description}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Insights */}
        {insights.length > 0 && (
          <div className="relative z-10 mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-indigo-400" />
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Insights Rápidos</span>
            </div>
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight, i) => (
                <p key={i} className="text-xs text-[var(--t2)] leading-relaxed">{insight}</p>
              ))}
            </div>
          </div>
        )}

        {/* Brazilian Indicators */}
        <div className="relative z-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(indicators).slice(0, 4).map(([key, indicator]) => (
            <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] text-[var(--t4)] uppercase tracking-widest font-bold mb-1">
                {indicator.nome}
              </div>
              <div className="text-lg font-black text-white">
                {indicator.valor.toFixed(key === 'TR' ? 2 : 2)}%
              </div>
              <div className="text-[9px] text-[var(--t4)]">{indicator.fonte}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Health Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-[var(--bg)]/80 to-[var(--card)]/80 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Resumo da Saúde</h3>
            <p className="text-sm text-[var(--t3)]">{financialScore.classificacao}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black" style={{ color: financialScore.cor }}>
              {financialScore.score}
            </div>
            <div className="text-xs text-[var(--t4)] uppercase tracking-widest font-bold">de 100</div>
          </div>
        </div>

        {/* Recommendations */}
        {financialScore.recomendacoes.length > 0 && (
          <div className="mt-4 space-y-2">
            {financialScore.recomendacoes.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[var(--t3)]">
                <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
