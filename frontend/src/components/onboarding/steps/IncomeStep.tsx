import { useOnboarding } from "../OnboardingContext";
import { Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/formatters";

export const IncomeStep = () => {
  const { profile, handleProfileChange: onChange, validationErrors } = useOnboarding();

  return (
  <div className="space-y-8 pt-6 text-center">
    <div className="space-y-2">
      <h2 className="text-3xl font-bold">Qual sua renda mensal?</h2>
      <p className="text-white/50">Isso define sua capacidade de aporte e reserva.</p>
    </div>
    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
      <div className="text-5xl font-black tabular-nums text-indigo-400 tracking-tighter">{formatCurrency(profile.monthlyIncome)}</div>
      <Slider value={[profile.monthlyIncome]} onValueChange={([v]) => onChange("monthlyIncome", v)} min={1000} max={50000} step={500} className="py-4" />
      {validationErrors.monthlyIncome && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.monthlyIncome}</p>}
      <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest"><span>R$ 1k</span><span>R$ 50k+</span></div>
    </div>
    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 flex gap-3 text-left">
      <Zap size={18} className="shrink-0" />
      <p>Usaremos este valor para calcular sua <strong>estratégia 50/30/20</strong> de forma automática no próximo passo.</p>
    </div>
  </div>
);
};
