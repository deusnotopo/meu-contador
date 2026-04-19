import { memo, useCallback } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import type { ExpenseField, ExpenseKey } from '../types';

interface ExpensesStepProps {
  profile?: ReturnType<typeof useOnboarding>['profile'];
  onChange?: (key: ExpenseField, value: number) => void;
}

export const ExpensesStep = memo(function ExpensesStep(props: Partial<ExpensesStepProps> = {}) {
  const { profile: contextProfile, handleProfileChange } = useOnboarding();
  const profile = props.profile ?? contextProfile;
  const onChange = props.onChange ?? handleProfileChange;

  const handleExpenseChange = useCallback((key: ExpenseField, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0) {
      onChange(key, numValue);
    }
  }, [onChange]);

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Seus Gastos Mensais</h2>
        <p className="text-white/50">Entenda para onde seu dinheiro vai.</p>
      </div>
      
      <div className="space-y-4">
        {/* Gastos Essenciais */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-indigo-400 uppercase tracking-wider">🏠 Essenciais</h3>
          <div className="space-y-3">
            {[
              { key: "housing", label: "Moradia (Aluguel/Financiamento)", placeholder: "Ex: 1500" },
              { key: "food", label: "Alimentação", placeholder: "Ex: 800" },
              { key: "transport", label: "Transporte", placeholder: "Ex: 400" },
              { key: "health", label: "Saúde", placeholder: "Ex: 300" },
              { key: "education", label: "Educação", placeholder: "Ex: 200" },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-4">
                <Label className="text-xs text-white/60 w-40">{item.label}</Label>
                <Input 
                  type="number"
                  placeholder={item.placeholder}
                  value={profile[`expense_${item.key as ExpenseKey}`] || ""}
                  onChange={e => handleExpenseChange(`expense_${item.key as ExpenseKey}`, e.target.value)}
                  className="h-12 bg-white/5 border border-white/10 rounded-xl text-sm font-bold flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gastos Lifestyle */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-purple-400 uppercase tracking-wider">✨ Lifestyle</h3>
          <div className="space-y-3">
            {[
              { key: "leisure", label: "Lazer", placeholder: "Ex: 500" },
              { key: "subscriptions", label: "Assinaturas", placeholder: "Ex: 150" },
              { key: "shopping", label: "Compras", placeholder: "Ex: 300" },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-4">
                <Label className="text-xs text-white/60 w-40">{item.label}</Label>
                <Input 
                  type="number"
                  placeholder={item.placeholder}
                  value={profile[`expense_${item.key as ExpenseKey}`] || ""}
                  onChange={e => handleExpenseChange(`expense_${item.key as ExpenseKey}`, e.target.value)}
                  className="h-12 bg-white/5 border border-white/10 rounded-xl text-sm font-bold flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 flex gap-3">
          <Zap size={18} className="shrink-0" />
          <p>Esses dados ajudam a estimar sua capacidade real de poupança e sugerir um orçamento inicial.</p>
        </div>
      </div>
    </div>
  );
});