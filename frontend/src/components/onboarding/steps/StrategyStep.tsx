import { useOnboarding } from "../OnboardingContext";
import { StrategyRow } from "../StepCards";
import { formatCurrency } from "@/lib/formatters";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


export function StrategyStep() {
  const { profile, strategyRules } = useOnboarding();
  const {
    ruleName,
    pE, pL, pF,
    reserveMonths,
    data,
    monthlyInvest,
    projection10y,
    projection20y
  } = strategyRules;
  
  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Sua Estratégia Personalizada</h2>
        <p className="text-white/50">Baseada no seu perfil de {profile.employmentType?.toUpperCase()}, {profile.age} anos e {profile.dependents} dependentes.</p>
      </div>

      {/* Regra de Alocação */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-bold text-sm text-indigo-400 uppercase tracking-wider text-center">📊 Regra de Alocação: {ruleName}</h3>
        
        <div className="h-[200px] w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={8}
                dataKey="value"
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toFixed(0)}%`, 'Alocação']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Alocação</span>
            <span className="text-2xl font-black">{ruleName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-left">
          <StrategyRow color="bg-indigo-500" label={`Necessidades (${pE*100}%)`} sub="Moradia, alimentação, saúde" val={formatCurrency(profile.monthlyIncome * pE)} />
          <StrategyRow color="bg-purple-500" label={`Lifestyle (${pL*100}%)`} sub="Lazer, compras, assinaturas" val={formatCurrency(profile.monthlyIncome * pL)} />
          <StrategyRow color="bg-emerald-500" label={`Futuro (${pF*100}%)`} sub="Investimento, dívidas, reserva" val={formatCurrency(profile.monthlyIncome * pF)} />
        </div>
      </div>

      {/* Reserva de Emergência */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">🛡️ Reserva de Emergência Recomendada</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-400">{reserveMonths}</p>
            <p className="text-[10px] text-white/40">Meses</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-400">{formatCurrency(strategyRules.reserveTarget)}</p>
            <p className="text-[10px] text-white/40">Valor Alvo</p>
          </div>
        </div>
        <p className="text-[10px] text-white/35 text-center">Base: maior valor entre seus gastos informados e a alocação essencial recomendada.</p>
      </div>

      {/* Projeção de Juros Compostos */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-bold text-sm text-indigo-400 uppercase tracking-wider">📈 Efeito Juros Compostos</h3>
        <p className="text-xs text-white/50 text-center">Investindo {formatCurrency(monthlyInvest)}/mês (seus {pF*100}%)</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-[10px] text-white/40 uppercase">Em 10 anos</p>
            <p className="text-xl font-black text-indigo-400">{formatCurrency(projection10y)}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[10px] text-white/40 uppercase">Em 20 anos</p>
            <p className="text-xl font-black text-emerald-400">{formatCurrency(projection20y)}</p>
          </div>
        </div>
        
        <p className="text-[10px] text-center text-white/30 italic">
          *Baseado na Selic atual projetada e aporte constante.
        </p>
      </div>
    </div>
  );
}
