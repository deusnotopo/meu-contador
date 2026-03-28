import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { loadProfile } from "@/lib/storage";
import { 
  ArrowLeft, 
  Shield, 
  Heart, 
  Home, 
  Car, 
  Briefcase,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import type { TabType } from "@/types/navigation";

interface InsurancePlannerProps {
  onBack?: (tab: TabType) => void;
}

interface InsuranceRecommendation {
  type: string;
  icon: React.ReactNode;
  name: string;
  priority: "alta" | "média" | "baixa";
  coverage: string;
  estimatedCost: string;
  reason: string;
  implemented: boolean;
}

export const InsurancePlanner = ({ onBack }: InsurancePlannerProps) => {
  const { user } = useAuth();
  const { totals } = useTransactions("personal");
  const { totals: investTotals } = useInvestments();
  const { totals: debtTotals } = useDebts();
  const profile = loadProfile();

  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);

  // Calculate financial data
  const monthlyIncome = totals.income;
  const netWorth = totals.balance + investTotals.currentValue - debtTotals.totalBalance;
  const hasDependents = (profile?.dependents || 0) > 0;
  const hasProperty = true; // Simplified assumption
  const hasVehicle = true; // Simplified assumption

  // Generate recommendations based on profile
  const recommendations: InsuranceRecommendation[] = [
    {
      type: "vida",
      icon: <Heart size={20} className="text-red-400" />,
      name: "Seguro de Vida",
      priority: hasDependents ? "alta" : "média",
      coverage: `R$ ${(monthlyIncome * 12 * 10).toLocaleString('pt-BR')}`,
      estimatedCost: `R$ ${(monthlyIncome * 0.02).toLocaleString('pt-BR')}/mês`,
      reason: hasDependents 
        ? "Protege sua família financeiramente em caso de falecimento"
        : "Garante proteção financeira para seus herdeiros",
      implemented: false
    },
    {
      type: "saude",
      icon: <Shield size={20} className="text-blue-400" />,
      name: "Plano de Saúde",
      priority: "alta",
      coverage: "Cobertura médica completa",
      estimatedCost: `R$ ${(monthlyIncome * 0.08).toLocaleString('pt-BR')}/mês`,
      reason: "Evita gastos excessivos com saúde e garante atendimento de qualidade",
      implemented: true
    },
    {
      type: "residencial",
      icon: <Home size={20} className="text-green-400" />,
      name: "Seguro Residencial",
      priority: hasProperty ? "alta" : "baixa",
      coverage: `R$ ${(netWorth * 0.3).toLocaleString('pt-BR')}`,
      estimatedCost: `R$ ${(monthlyIncome * 0.01).toLocaleString('pt-BR')}/mês`,
      reason: "Protege seu patrimônio contra incêndio, roubo e desastres naturais",
      implemented: false
    },
    {
      type: "automovel",
      icon: <Car size={20} className="text-amber-400" />,
      name: "Seguro Automóvel",
      priority: hasVehicle ? "alta" : "baixa",
      coverage: "Cobertura total do veículo",
      estimatedCost: `R$ ${(monthlyIncome * 0.03).toLocaleString('pt-BR')}/mês`,
      reason: "Obrigatório por lei e protege contra acidentes e roubo",
      implemented: hasVehicle
    },
    {
      type: "emprego",
      icon: <Briefcase size={20} className="text-purple-400" />,
      name: "Seguro Desemprego",
      priority: monthlyIncome > 5000 ? "média" : "alta",
      coverage: `R$ ${(monthlyIncome * 0.5 * 6).toLocaleString('pt-BR')}`,
      estimatedCost: `R$ ${(monthlyIncome * 0.015).toLocaleString('pt-BR')}/mês`,
      reason: "Garante renda por até 6 meses em caso de demissão sem justa causa",
      implemented: false
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "text-red-400 bg-red-500/10";
      case "média": return "text-amber-400 bg-amber-500/10";
      case "baixa": return "text-green-400 bg-green-500/10";
      default: return "text-slate-400 bg-slate-500/10";
    }
  };

  const totalMonthlyCost = recommendations
    .filter(r => selectedInsurances.includes(r.type))
    .reduce((acc, r) => {
      const cost = parseFloat(r.estimatedCost.replace(/[^\d,]/g, '').replace(',', '.'));
      return acc + cost;
    }, 0);

  const handleToggleInsurance = (type: string) => {
    setSelectedInsurances(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        {onBack && (
          <button 
            onClick={() => onBack("health")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-black text-white">Planejar Seguros</h1>
          <p className="text-xs text-slate-400">Proteja seu patrimônio e família</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="premium-card p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Calculator size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Resumo Financeiro</div>
            <div className="text-[10px] text-slate-400">Base para cálculo dos seguros</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Renda Mensal</div>
            <div className="text-lg font-bold text-green-400">
              R$ {monthlyIncome.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Patrimônio Líquido</div>
            <div className="text-lg font-bold text-blue-400">
              R$ {netWorth.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Dependentes</div>
            <div className="text-lg font-bold text-amber-400">
              {profile?.dependents || 0}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Custo Total Mensal</div>
            <div className="text-lg font-bold text-purple-400">
              R$ {totalMonthlyCost.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Seguros Recomendados</h3>
        <div className="space-y-3">
          {recommendations.map((insurance) => (
            <div 
              key={insurance.type}
              className={`premium-card p-4 transition-all ${
                selectedInsurances.includes(insurance.type) 
                  ? 'ring-2 ring-blue-500/50' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    {insurance.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{insurance.name}</div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(insurance.priority)}`}>
                      Prioridade {insurance.priority}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleInsurance(insurance.type)}
                  disabled={insurance.implemented}
                  className={`p-2 rounded-lg transition-colors ${
                    insurance.implemented
                      ? 'bg-green-500/20 text-green-400'
                      : selectedInsurances.includes(insurance.type)
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {insurance.implemented ? (
                    <CheckCircle size={18} />
                  ) : (
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedInsurances.includes(insurance.type)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-400'
                    }`} />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Cobertura</div>
                  <div className="text-sm font-bold text-white">{insurance.coverage}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Custo Estimado</div>
                  <div className="text-sm font-bold text-amber-400">{insurance.estimatedCost}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-300">{insurance.reason}</p>
                </div>
              </div>

              {insurance.implemented && (
                <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Você já possui este seguro</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      {selectedInsurances.length > 0 && (
        <div className="premium-card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">Resumo da Proteção</h3>
          
          <div className="space-y-3 mb-4">
            {recommendations
              .filter(r => selectedInsurances.includes(r.type))
              .map(insurance => (
                <div key={insurance.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {insurance.icon}
                    <span className="text-sm text-white">{insurance.name}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {insurance.estimatedCost}
                  </span>
                </div>
              ))}
          </div>

          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Custo Mensal Total</span>
              <span className="text-lg font-bold text-green-400">
                R$ {totalMonthlyCost.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {(totalMonthlyCost / monthlyIncome * 100).toFixed(1)}% da sua renda mensal
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border-l-4 border-amber-500">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-200">
                Recomendamos que o custo total com seguros não ultrapasse 10% da sua renda mensal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="premium-card p-4">
        <h3 className="text-sm font-bold text-white mb-3">Dicas para Escolher Seguros</h3>
        <div className="space-y-3">
          {[
            "🛡️ Priorize seguros de vida e saúde se tiver dependentes",
            "📊 Avalie o custo-benefício: cobertura vs. prêmio mensal",
            "🔍 Leia as cláusulas de exclusão antes de contratar",
            "💡 Considere franquias mais altas para reduzir o prêmio",
            "📅 Revise seus seguros anualmente conforme sua situação muda"
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm">{tip.split(' ')[0]}</span>
              <p className="text-xs text-slate-300">{tip.substring(tip.indexOf(' ') + 1)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      {selectedInsurances.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
          <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-bold shadow-lg">
            <div className="flex items-center justify-center gap-2">
              <Shield size={18} />
              <span>Simular Contratação ({selectedInsurances.length})</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};