import { memo, useCallback } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { Label } from '@/components/ui/label';
import { Sparkles, TrendingUp } from 'lucide-react';
import { SelectCard } from '../StepCards';
import { formatCurrency } from '@/lib/formatters';
import type { OnboardingInvestment } from '@/types';

const createInvestmentDraft = (): OnboardingInvestment => ({
  id: crypto.randomUUID() as unknown as number,
  name: '',
  ticker: '',
  type: 'stock',
  amount: 0,
  averagePrice: 0,
  currentPrice: 0,
  sector: 'Geral',
  lastUpdate: new Date().toISOString(),
});

export const InvestmentsStep = memo(function InvestmentsStep() {
  const { profile, handleProfileChange, investments, setInvestments } = useOnboarding();

  const handleRiskProfileChange = useCallback((value: 'conservative' | 'moderate' | 'aggressive') => {
    handleProfileChange('riskProfile', value);
  }, [handleProfileChange]);

  const handleAddInvestment = useCallback(() => {
    setInvestments(prev => [...prev, createInvestmentDraft()]);
  }, [setInvestments]);

  const handleRemoveInvestment = useCallback((id: string | number) => {
    setInvestments(prev => prev.filter(item => item.id !== id));
  }, [setInvestments]);

  const handleInvestmentChange = useCallback((id: string | number, field: keyof OnboardingInvestment, value: string | number) => {
    setInvestments(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'ticker') {
          return { ...item, ticker: String(value).toUpperCase(), name: item.name || String(value).toUpperCase() };
        }
        if (field === 'amount' || field === 'averagePrice' || field === 'currentPrice') {
          const numValue = parseFloat(String(value)) || 0;
          if (numValue >= 0) {
            return { ...item, [field]: numValue };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  }, [setInvestments]);

  const handleClearInvestments = useCallback(() => {
    setInvestments([]);
  }, [setInvestments]);

  const totalInvested = investments.reduce((sum, investment) => 
    sum + ((investment.amount || 0) * (investment.averagePrice || 0)), 0
  );

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Perfil de Investidor</h2>
        <p className="text-white/50">Vamos personalizar suas recomendações.</p>
      </div>

      {/* Experiência */}
      <div className="space-y-4">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Experiência com Investimentos</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "beginner", label: "Iniciante", icon: Sparkles },
            { id: "intermediate", label: "Intermediário", icon: TrendingUp },
          ].map(exp => (
            <SelectCard 
              key={exp.id}
              active={profile.riskProfile === (exp.id === "beginner" ? "conservative" : "moderate")} 
              onClick={() => handleRiskProfileChange(exp.id === "beginner" ? "conservative" : "moderate")}
              icon={exp.icon} 
              label={exp.label} 
              sub={exp.id === "beginner" ? "Poupança e renda fixa" : "Ações e fundos"}
            />
          ))}
        </div>
      </div>

      {/* Tolerância a Risco */}
      <div className="space-y-4">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Tolerância a Risco</Label>
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mx-auto w-fit border border-white/5">
          {["conservative", "moderate", "aggressive"].map(mode => (
            <button 
              key={mode}
              onClick={() => handleRiskProfileChange(mode as 'conservative' | 'moderate' | 'aggressive')}
              aria-label={`Selecionar perfil de risco: ${mode === "conservative" ? "Conservador" : mode === "moderate" ? "Moderado" : "Agressivo"}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                profile.riskProfile === mode ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white"
              }`}
            >
              {mode === "conservative" ? "Conservador" : mode === "moderate" ? "Moderado" : "Agressivo"}
            </button>
          ))}
        </div>
      </div>

      {/* Valor Investido */}
      <div className="space-y-4 text-center">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Valor Total Investido Hoje</Label>
        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
          <div className="text-4xl font-black tabular-nums text-indigo-400 tracking-tighter">
            {formatCurrency(totalInvested)}
          </div>
          <p className="text-[10px] text-white/30 mt-2">Opcional — registre seus ativos para personalizar melhor o painel</p>
        </div>
      </div>

      <div className="space-y-3">
        {investments.map((investment, index) => (
          <div key={investment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Ativo {index + 1}</p>
              <button
                type="button"
                onClick={() => handleRemoveInvestment(investment.id)}
                className="text-white/40 hover:text-white text-xs"
              >
                remover
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={investment.ticker}
                placeholder="Ticker"
                onChange={(e) => handleInvestmentChange(investment.id, 'ticker', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
              <select
                value={investment.type}
                onChange={(e) => handleInvestmentChange(investment.id, 'type', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="stock">Ação</option>
                <option value="fii">FII</option>
                <option value="fixed_income">Renda fixa</option>
                <option value="etf">ETF</option>
                <option value="crypto">Cripto</option>
              </select>
              <input
                type="number"
                value={investment.amount || ''}
                placeholder="Qtd"
                onChange={(e) => handleInvestmentChange(investment.id, 'amount', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
              <input
                type="number"
                step="0.01"
                value={investment.averagePrice || ''}
                placeholder="Preço médio"
                onChange={(e) => handleInvestmentChange(investment.id, 'averagePrice', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddInvestment}
            className="flex-1 py-3 rounded-2xl border border-dashed border-indigo-500/30 text-indigo-300 text-sm font-semibold hover:border-indigo-400"
          >
            + adicionar ativo
          </button>
          <button
            type="button"
            onClick={handleClearInvestments}
            className="px-4 py-3 rounded-2xl bg-white/5 text-white/60 text-sm"
          >
            configurar depois
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-200">
        Registrar seus ativos libera recomendações melhores e já conta como marco inicial da sua jornada.
      </div>
    </div>
  );
});