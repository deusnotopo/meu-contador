import { useOnboarding } from "../OnboardingContext";
import { Check } from "lucide-react";


export function GoalsStep() {
  const { goals, setGoals, validationErrors } = useOnboarding();

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">O que vamos conquistar?</h2>
        <p className="text-white/50">Defina suas prioridades de vida.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {goals.map((g, i) => (
          <div key={i} className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
            g.enabled ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10"
          }`}>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={g.enabled}
              aria-label={`Meta: ${g.name}`}
              onKeyDown={e => e.key === 'Enter' && (() => {
                const newGoals = [...goals];
                if (newGoals[i]) {
                  newGoals[i].enabled = !newGoals[i].enabled;
                  setGoals(newGoals);
                }
              })()}
              onClick={() => {
                const newGoals = [...goals];
                if (newGoals[i]) {
                  newGoals[i].enabled = !newGoals[i].enabled;
                  setGoals(newGoals);
                }
              }}
              className="cursor-pointer"
            >
              <span className="text-2xl block mb-2">{g.icon}</span>
              <p className="font-bold text-sm leading-tight pr-6">{g.name}</p>
              {g.enabled && <Check size={14} className="absolute top-4 right-4 text-indigo-400" />}
            </div>

            {g.enabled && (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Valor alvo</label>
                  <input
                    type="number"
                    value={g.targetAmount || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const newGoals = [...goals];
                      if (newGoals[i]) newGoals[i].targetAmount = Number(e.target.value);
                      setGoals(newGoals);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Prazo</label>
                  <input
                    type="date"
                    value={g.deadline || ''}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      if (newGoals[i]) newGoals[i].deadline = e.target.value;
                      setGoals(newGoals);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {validationErrors.goals && (
        <p className="text-rose-400 text-xs font-medium text-center" role="alert">
          {validationErrors.goals}
        </p>
      )}
      <p className="text-xs text-white/35 text-center">Ative apenas as metas que quer acompanhar já no primeiro dia.</p>
    </div>
  );
}
