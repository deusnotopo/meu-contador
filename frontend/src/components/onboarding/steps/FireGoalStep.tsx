import { useOnboarding } from "../OnboardingContext";
import { Home, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export function FireGoalStep() {
  const { profile, handleProfileChange: onChange, validationErrors } = useOnboarding();
  return (
    <div className="space-y-8 pt-6 text-center">
      <div className="space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 flex items-center justify-center mb-2">
          <Home size={32} className="text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold">Com quantos anos você quer se aposentar?</h2>
        <p className="text-white/50 text-sm">Seu Número Mágico FIRE vai aparecer no painel de Aposentadoria.</p>
      </div>

      <div className="space-y-6">
        {/* Slider de Idade */}
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Idade Alvo</p>
            <div className="text-6xl font-black tabular-nums text-amber-400">
              {profile.retirementAge ?? 60}
              <span className="text-2xl text-white/30 ml-2">anos</span>
            </div>
          </div>
          <Slider
            value={[profile.retirementAge ?? 60]}
            onValueChange={([v]) => onChange('retirementAge', v)}
            min={35} max={80} step={1}
            className="py-4"
          />
          {validationErrors.retirementAge && <p className="text-rose-400 text-xs font-medium text-center" role="alert">{validationErrors.retirementAge}</p>}
          <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
            <span>35 anos</span>
            <span>80 anos</span>
          </div>
        </div>

        {/* Renda desejada na aposentadoria */}
        <div className="space-y-3 text-left">
          <Label className="text-amber-400 font-bold uppercase tracking-widest text-[10px]">Renda Mensal Desejada na Aposentadoria (R$)</Label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-white/30">R$</div>
            <Input
              type="number"
              value={profile.fireTargetIncome ?? profile.monthlyIncome}
              onChange={e => onChange('fireTargetIncome', parseFloat(e.target.value) || 0)}
              aria-invalid={!!validationErrors.fireTargetIncome}
              className={`h-16 pl-14 bg-white/5 border-white/10 rounded-2xl text-2xl font-black ${validationErrors.fireTargetIncome ? 'border-rose-500/60' : ''}`}
              placeholder={String(profile.monthlyIncome)}
            />
          </div>
          {validationErrors.fireTargetIncome && <p className="text-rose-400 text-xs font-medium text-center" role="alert">{validationErrors.fireTargetIncome}</p>}
          <p className="text-xs text-white/30 text-center">Pré-preenchido com sua renda atual. Ajuste se quiser mais ou menos no futuro.</p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex gap-3 text-left">
          <TrendingUp size={18} className="shrink-0 mt-0.5" />
          <p>Com base nesses números, o <strong>Simulador FIRE</strong> vai calcular exatamente quanto patrimônio você precisa acumular e quanto te falta.</p>
        </div>

        {/* ── Trilha da Academia ── */}
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Qual assunto te interessa mais em Aprender?</p>
            <p className="text-xs text-white/30">Isso define sua trilha prioritária de aprendizado.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'base', emoji: '🏗️', label: 'Educação Financeira' },
              { value: 'renda_var', emoji: '📈', label: 'Renda Variável (B3)' },
              { value: 'dividendos', emoji: '💰', label: 'Dividendos' },
              { value: 'fire', emoji: '🔥', label: 'Independência FIRE' },
              { value: 'cripto', emoji: '₿', label: 'Cripto' },
              { value: 'contabilidade', emoji: '🧾', label: 'Contabilidade PJ' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('educationTrack', opt.value)}
                className={`p-4 rounded-2xl border text-sm font-bold transition-all text-left flex items-center gap-3 ${
                  profile.educationTrack === opt.value
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-xs leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
