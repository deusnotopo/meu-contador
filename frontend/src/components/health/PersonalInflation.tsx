import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calculator, Info } from "lucide-react";
import type { TabType } from "@/types/navigation";

interface PersonalInflationProps {
  onBack?: (tab: TabType) => void;
}

export const PersonalInflation = ({ onBack }: PersonalInflationProps) => {
  const { transactions, categoryData } = useTransactions("personal");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Calculate personal inflation based on spending patterns
  const inflationData = useMemo(() => {
    const currentMonth = selectedMonth;
    const previousMonth = new Date(new Date(selectedMonth + "-01").getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const currentExpenses = transactions
      .filter(t => t.type === "expense" && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.amount, 0);

    const previousExpenses = transactions
      .filter(t => t.type === "expense" && t.date.startsWith(previousMonth))
      .reduce((acc, t) => acc + t.amount, 0);

    // Official IPCA (simplified - in real app would come from IBGE API)
    const officialIPCA = 0.45; // % monthly

    // Personal inflation rate
    const personalRate = previousExpenses > 0 
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 
      : 0;

    // Category breakdown
    const categoryInflation = categoryData.map(cat => {
      const current = transactions
        .filter(t => t.type === "expense" && t.category === cat.name && t.date.startsWith(currentMonth))
        .reduce((acc, t) => acc + t.amount, 0);
      
      const previous = transactions
        .filter(t => t.type === "expense" && t.category === cat.name && t.date.startsWith(previousMonth))
        .reduce((acc, t) => acc + t.amount, 0);

      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return {
        name: cat.name,
        current,
        previous,
        change,
        impact: (current / currentExpenses) * 100
      };
    }).filter(cat => cat.current > 0 || cat.previous > 0);

    return {
      currentExpenses,
      previousExpenses,
      personalRate,
      officialIPCA,
      difference: personalRate - officialIPCA,
      categoryInflation
    };
  }, [transactions, categoryData, selectedMonth]);

  const getTrendIcon = (value: number) => {
    if (value > 2) return <TrendingUp size={16} className="text-red-400" />;
    if (value < -2) return <TrendingDown size={16} className="text-green-400" />;
    return <Minus size={16} className="text-neutral-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 2) return "text-red-400";
    if (value < -2) return "text-green-400";
    return "text-neutral-500";
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        {onBack && (
          <button 
            onClick={() => onBack("inicio")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-black text-white">Inflação Pessoal</h1>
          <p className="text-xs text-neutral-500">Compare sua inflação real vs. IPCA oficial</p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
        />
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="premium-card p-4">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Sua Inflação</div>
          <div className={`text-2xl font-black ${getTrendColor(inflationData.personalRate)}`}>
            {inflationData.personalRate > 0 ? "+" : ""}{inflationData.personalRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {inflationData.currentExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <div className="premium-card p-4">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">IPCA Oficial</div>
          <div className="text-2xl font-black text-blue-400">
            +{inflationData.officialIPCA.toFixed(1)}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Índice oficial (simplificado)</div>
        </div>
      </div>

      {/* Difference Card */}
      <div className="premium-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Diferença</div>
            <div className={`text-xl font-black ${inflationData.difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {inflationData.difference > 0 ? '+' : ''}{inflationData.difference.toFixed(1)} pontos
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <Calculator size={24} className="text-amber-400" />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-white/5 border-l-4 border-amber-500">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-neutral-400">
              {inflationData.difference > 0 
                ? "Sua inflação pessoal está acima do IPCA. Considere revisar gastos nas categorias que mais subiram."
                : inflationData.difference < 0
                ? "Parabéns! Sua inflação pessoal está abaixo do IPCA oficial."
                : "Sua inflação pessoal está alinhada com o IPCA oficial."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Inflação por Categoria</h3>
        <div className="space-y-3">
          {inflationData.categoryInflation.length === 0 ? (
            <div className="premium-card p-6 text-center">
              <p className="text-sm text-neutral-500">Dados insuficientes para calcular inflação por categoria.</p>
              <p className="text-xs text-neutral-500 mt-2">Adicione mais transações para ver a análise completa.</p>
            </div>
          ) : (
            inflationData.categoryInflation.map((cat, index) => (
              <div key={index} className="premium-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      {getTrendIcon(cat.change)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{cat.name}</div>
                      <div className="text-[10px] text-neutral-500">
                        Impacto: {cat.impact.toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getTrendColor(cat.change)}`}>
                      {cat.change > 0 ? '+' : ''}{cat.change.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {cat.current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="premium-card p-4">
        <h3 className="text-sm font-bold text-white mb-3">Dicas para Controlar sua Inflação</h3>
        <div className="space-y-3">
          {[
            "📊 Monitore categorias com aumento acima de 5% ao mês",
            "🎯 Defina limites de gastos para categorias voláteis",
            "💡 Considere alternativas mais econômicas em categorias em alta",
            "📅 Use a regra 50-30-20 para equilibrar necessidades, desejos e poupança"
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm">{tip.split(' ')[0]}</span>
              <p className="text-xs text-neutral-400">{tip.substring(tip.indexOf(' ') + 1)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
