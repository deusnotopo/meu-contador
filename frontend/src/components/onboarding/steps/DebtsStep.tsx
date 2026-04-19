import { memo, useCallback } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { Flame, Trash2, Plus, Zap } from 'lucide-react';
import type { OnboardingDebt } from '@/types';

const createDebtDraft = (): OnboardingDebt => ({
  id: crypto.randomUUID(),
  name: '',
  balance: 0,
  interestRate: 0,
  minPayment: 0,
  category: 'credit_card',
});

export const DebtsStep = memo(function DebtsStep() {
  const { onboardingDebts, setOnboardingDebts, validationErrors } = useOnboarding();

  const handleAddDebt = useCallback(() => {
    setOnboardingDebts(prev => [...prev, createDebtDraft()]);
  }, [setOnboardingDebts]);

  const handleRemoveDebt = useCallback((index: number) => {
    setOnboardingDebts(prev => prev.filter((_, i) => i !== index));
  }, [setOnboardingDebts]);

  const handleDebtChange = useCallback((index: number, field: keyof OnboardingDebt, value: string | number) => {
    setOnboardingDebts(prev => prev.map((debt, i) =>
      i === index ? { ...debt, [field]: value } : debt
    ));
  }, [setOnboardingDebts]);

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-2 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
          <Flame size={32} className="text-rose-400" />
        </div>
        <h2 className="text-3xl font-bold">Vamos zerar as dívidas</h2>
        <p className="text-white/50 text-sm">Registre as suas dívidas e o app vai montar a estratégia de quitação ideal (Método Avalanche).</p>
      </div>

      <div className="space-y-3">
        {onboardingDebts.map((debt, i) => (
          <div key={debt.id} className="p-5 rounded-2xl bg-white/5 border border-rose-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Dívida {i + 1}</span>
              <button
                type="button"
                onClick={() => handleRemoveDebt(i)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} className="text-white/40" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Credor</label>
                <input
                  type="text"
                  value={debt.name}
                  placeholder="Ex: Cartão Nubank"
                  onChange={e => handleDebtChange(i, 'name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-rose-500/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Saldo (R$)</label>
                  <input
                    type="number"
                    value={debt.balance || ''}
                    placeholder="0"
                    onChange={e => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value >= 0) handleDebtChange(i, 'balance', value);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Juros %/mês</label>
                  <input
                    type="number"
                    value={debt.interestRate || ''}
                    placeholder="0"
                    step="0.1"
                    onChange={e => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value >= 0) handleDebtChange(i, 'interestRate', value);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Parcela (R$)</label>
                  <input
                    type="number"
                    value={debt.minPayment || ''}
                    placeholder="0"
                    onChange={e => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value >= 0) handleDebtChange(i, 'minPayment', value);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {onboardingDebts.length < 5 && (
          <button
            type="button"
            onClick={handleAddDebt}
            className="w-full py-4 rounded-2xl border border-dashed border-rose-500/30 text-rose-400/70 text-sm font-semibold hover:border-rose-500/60 hover:text-rose-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar dívida
          </button>
        )}

        {onboardingDebts.length === 0 && (
          <div className="text-center py-4 text-white/30 text-sm">
            Clique acima para registrar sua primeira dívida
          </div>
        )}
        {validationErrors.onboardingDebts && <p className="text-rose-400 text-xs font-medium text-center" role="alert">{validationErrors.onboardingDebts}</p>}
      </div>

      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex gap-3">
        <Zap size={18} className="shrink-0 mt-0.5" />
        <p>Com essas informações, o <strong>Painel de Quitação</strong> vai calcular automaticamente em quanto tempo você fica livre de dívidas usando a Estratégia Avalanche.</p>
      </div>
    </div>
  );
});