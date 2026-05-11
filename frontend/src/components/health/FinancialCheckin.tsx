import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInvestments } from "@/hooks/useInvestments";
import { api } from "@/lib/api";
import { ArrowLeft, Brain, CheckCircle } from "lucide-react";
import type { TabType } from "@/types/navigation";

interface FinancialCheckinProps {
  onBack?: (tab: TabType) => void;
}

type StressLevel = 1 | 2 | 3 | 4 | 5;
type MoodOption = "optimista" | "neutro" | "preocupado" | "ansioso" | "confiante";

interface CheckinData {
  date: string;
  stressLevel: StressLevel;
  mood: MoodOption;
  notes: string;
  sleepQuality: number;
  financialConfidence: number;
}

export const FinancialCheckin = ({ onBack }: FinancialCheckinProps) => {
  const { totals } = useTransactions("personal");
  const { totals: debtTotals } = useDebts();
  const { totals: investTotals } = useInvestments();

  const [currentStep, setCurrentStep] = useState(0);
  const [checkinData, setCheckinData] = useState<Partial<CheckinData>>({});
  const [history, setHistory] = useState<CheckinData[]>([]);

  const stressLabels = [
    "Muito baixo - Totalmente tranquilo",
    "Baixo - Pouca preocupação",
    "Moderado - Preocupações normais",
    "Alto - Significativamente estressado",
    "Muito alto - Extremamente ansioso"
  ];

  const moodOptions: { value: MoodOption; label: string; emoji: string }[] = [
    { value: "optimista", label: "Otimista", emoji: "😊" },
    { value: "confiante", label: "Confiante", emoji: "💪" },
    { value: "neutro", label: "Neutro", emoji: "😐" },
    { value: "preocupado", label: "Preocupado", emoji: "😟" },
    { value: "ansioso", label: "Ansioso", emoji: "😰" }
  ];

  const calculateFinancialHealth = () => {
    const savingsRate = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0;
    const debtRatio = investTotals.currentValue > 0 ? (debtTotals.totalBalance / investTotals.currentValue) * 100 : 0;
    
    let score = 50; // Base
    
    if (savingsRate > 20) score += 20;
    else if (savingsRate > 10) score += 10;
    else if (savingsRate < 0) score -= 20;

    if (debtRatio < 30) score += 15;
    else if (debtRatio > 70) score -= 15;

    if (checkinData.stressLevel) {
      score += (3 - checkinData.stressLevel) * 5;
    }

    return Math.max(0, Math.min(100, score));
  };

  const MOOD_TO_EMOTION: Record<MoodOption, string> = {
    optimista: "excited",
    confiante: "proud",
    neutro: "neutral",
    preocupado: "anxious",
    ansioso: "stressed",
  };

  const handleSubmit = async () => {
    if (!checkinData.stressLevel || !checkinData.mood) return;

    const newCheckin: CheckinData = {
      date: new Date().toISOString(),
      stressLevel: checkinData.stressLevel,
      mood: checkinData.mood,
      notes: checkinData.notes || "",
      sleepQuality: checkinData.sleepQuality || 3,
      financialConfidence: checkinData.financialConfidence || 3,
    };

    // Optimistic update
    setHistory(prev => [newCheckin, ...prev]);
    setCheckinData({});
    setCurrentStep(0);

    // Persist to backend
    try {
      await api.post("/emotional", {
        emotion: MOOD_TO_EMOTION[newCheckin.mood],
        regretLevel: newCheckin.stressLevel,
        satisfactionLevel: newCheckin.financialConfidence,
        notes: newCheckin.notes || undefined,
        triggers: newCheckin.stressLevel >= 4 ? ["financial_stress"] : undefined,
      });
    } catch {
      // Silently fail — checkin already saved to local state
    }
  };


  const healthScore = calculateFinancialHealth();

  if (currentStep === 0) {
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
            <h1 className="text-xl font-black text-white">Check-in Financeiro</h1>
            <p className="text-xs text-neutral-500">Como você está se sentindo hoje?</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="premium-card p-6 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {healthScore >= 80 ? "🌟" : healthScore >= 60 ? "😊" : healthScore >= 40 ? "😐" : "😟"}
            </div>
            <div className="text-2xl font-black text-white mb-2">{healthScore}/100</div>
            <div className="text-sm text-neutral-500">Score de Saúde Financeira</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="premium-card p-3 text-center">
            <div className="text-lg font-bold text-green-400">
              {totals.income > 0 ? `${((totals.balance / totals.income) * 100).toFixed(0)}%` : "0%"}
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">Poupança</div>
          </div>
          <div className="premium-card p-3 text-center">
            <div className="text-lg font-bold text-blue-400">
              {debtTotals.totalBalance > 0 ? `R$ ${(debtTotals.totalBalance / 1000).toFixed(1)}k` : "R$ 0"}
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">Dívidas</div>
          </div>
          <div className="premium-card p-3 text-center">
            <div className="text-lg font-bold text-purple-400">
              {investTotals.currentValue > 0 ? `R$ ${(investTotals.currentValue / 1000).toFixed(1)}k` : "R$ 0"}
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">Investido</div>
          </div>
        </div>

        {/* Start Check-in Button */}
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-center gap-3">
            <Brain size={24} />
            <span>Iniciar Check-in</span>
          </div>
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-white mb-4">Histórico de Check-ins</h3>
            <div className="space-y-3">
              {history.slice(0, 5).map((item, index) => (
                <div key={index} className="premium-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {moodOptions.find(m => m.value === item.mood)?.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white capitalize">
                          {moodOptions.find(m => m.value === item.mood)?.label}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">
                        Stress: {item.stressLevel}/5
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button 
          onClick={() => setCurrentStep(0)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Check-in Financeiro</h1>
          <p className="text-xs text-neutral-500">Etapa {currentStep} de 3</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-2 mb-6">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>

      {/* Step 1: Stress Level */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">😰</div>
            <h2 className="text-lg font-bold text-white">Nível de Estresse Financeiro</h2>
            <p className="text-sm text-neutral-500">Como você avalia seu estresse com dinheiro hoje?</p>
          </div>

          <div className="space-y-3">
            {stressLabels.map((label, index) => (
              <button
                key={index}
                onClick={() => setCheckinData(prev => ({ ...prev, stressLevel: (index + 1) as StressLevel }))}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  checkinData.stressLevel === index + 1
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                    {index + 1}
                  </div>
                  <div className="text-sm text-white">{label}</div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentStep(2)}
            disabled={!checkinData.stressLevel}
            className="w-full p-4 bg-blue-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Step 2: Mood */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">💭</div>
            <h2 className="text-lg font-bold text-white">Como você está se sentindo?</h2>
            <p className="text-sm text-neutral-500">Escolha a opção que melhor descreve seu humor</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setCheckinData(prev => ({ ...prev, mood: option.value }))}
                className={`p-4 rounded-xl text-center transition-all ${
                  checkinData.mood === option.value
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="text-sm text-white">{option.label}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 p-4 bg-white/10 rounded-xl text-white font-bold"
            >
              Voltar
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!checkinData.mood}
              className="flex-1 p-4 bg-blue-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Notes */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-lg font-bold text-white">Alguma observação?</h2>
            <p className="text-sm text-neutral-500">Opcional: anote como se sente sobre suas finanças</p>
          </div>

          <textarea
            value={checkinData.notes || ""}
            onChange={(e) => setCheckinData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Ex: Estou preocupado com as contas do mês, mas confiante que vou conseguir guardar dinheiro..."
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm resize-none h-32"
          />

          <div className="premium-card p-4">
            <h3 className="text-sm font-bold text-white mb-3">Resumo do Check-in</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Nível de Estresse:</span>
                <span className="text-sm font-bold text-amber-400">{checkinData.stressLevel}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Humor:</span>
                <span className="text-sm font-bold text-white">
                  {moodOptions.find(m => m.value === checkinData.mood)?.emoji} {moodOptions.find(m => m.value === checkinData.mood)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Score de Saúde:</span>
                <span className="text-sm font-bold text-green-400">{healthScore}/100</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 p-4 bg-white/10 rounded-xl text-white font-bold"
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold"
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                <span>Salvar Check-in</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};