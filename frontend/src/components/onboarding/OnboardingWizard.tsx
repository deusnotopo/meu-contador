import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import { applyOnboardingConfig, saveOnboarding } from "@/lib/onboarding";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useStrategyRules } from "@/hooks/useStrategyRules";
import type {
  OnboardingBudget,
  OnboardingData,
  OnboardingGoal,
  OnboardingReminder,
  UserProfile,
  OnboardingInvestment,
} from "@/types";
import {
  budgetTemplates,
  commonBillReminders,
  goalPresets,
} from "@/types/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Brain,
  Briefcase,
  Building2,
  Check,
  Crown,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Loader2,
  X,
  CreditCard,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { LucideIcon } from "lucide-react";

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

type ExpenseKey = 'housing' | 'food' | 'transport' | 'health' | 'education' | 'leisure' | 'subscriptions' | 'shopping';
type ExpenseField = `expense_${ExpenseKey}`;
type OnboardingProfile = UserProfile & Partial<Record<ExpenseField, number>>;

interface FeatureCardProps {
  icon: LucideIcon;
  label: string;
}

interface SelectCardProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  sub: string;
}

interface StrategyRowProps {
  color: string;
  label: string;
  sub: string;
  val: string;
}

interface SummaryItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

// ----------------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------------

const STEPS = [
  { id: "welcome", title: "Boas-vindas", act: 0 },
  { id: "identity", title: "Quem é Você", act: 1 },
  { id: "income", title: "Sua Renda", act: 1 },
  { id: "expenses", title: "Seus Gastos", act: 1 },
  { id: "balance", title: "Seu Patrimônio", act: 1 },
  { id: "investments", title: "Perfil de Investidor", act: 2 },
  { id: "goals", title: "Suas Metas", act: 2 },
  { id: "automation", title: "Piloto Automático", act: 2 },
  { id: "strategy", title: "Sua Estratégia", act: 3 },
  { id: "summary", title: "Diagnóstico Final", act: 3 },
];

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

// Dados para recomendação contextual da Academia
interface AcademySignal {
  title: string;
  reason: string;
  emoji: string;
  color: string;
}

function getAcademySignal(profile: { hasDebts?: boolean; hasEmergencyFund?: boolean; employmentType?: string; financialGoal?: string }): AcademySignal {
  if (profile.hasDebts) return {
    title: "Quitação Inteligente de Dívidas",
    reason: "Você indicou que possui dívidas. Quitar antes de investir é a estratégia mais rentável.",
    emoji: "🛑",
    color: "rose",
  };
  if (!profile.hasEmergencyFund) return {
    title: "Construindo sua Reserva de Emergência",
    reason: "Sem reserva, qualquer imprevisto vira dívida. Esse é o passo mais importante agora.",
    emoji: "🛡️",
    color: "amber",
  };
  if (profile.employmentType === 'pj') return {
    title: "Finanças do PJ: Pró-labore e CNPJ",
    reason: "Como PJ, separar pessoa física de jurídica protege seu patrimônio e reduz imposto.",
    emoji: "🏢",
    color: "indigo",
  };
  if (profile.financialGoal === 'invest' || profile.financialGoal === 'retire') return {
    title: "Primeiro Aporte: Do Zero ao Mercado",
    reason: "Você quer investir. Começar pelo básico de renda fixa e tesouro é o caminho mais seguro.",
    emoji: "📈",
    color: "emerald",
  };
  return {
    title: "Orçamento Consciente: Método 50/30/20",
    reason: "Uma base financeira sólida começa com um orçamento que você de fato consegue seguir.",
    emoji: "📊",
    color: "indigo",
  };
}

export const OnboardingWizard = ({ onComplete, onSkip }: Props) => {
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDots] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 6)] ?? '#6366f1',
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.4,
    }))
  );

  // -- State: Profile --
  const [profile, setProfile] = useState<OnboardingProfile>({
    name: "",
    monthlyIncome: 5000,
    financialGoal: "save",
    riskProfile: "moderate",
    employmentType: "clt",
    hasEmergencyFund: false,
    hasDebts: false,
    initialBalance: 0,
    age: 30,
    dependents: 0,
    businessName: "",
    businessSector: "technology",
    businessCnpj: "",
  });

  // -- State: Validation --
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // -- State: Finance Data --
  const [budgets] = useState<OnboardingBudget[]>(budgetTemplates.moderate || []);
  const [goals, setGoals] = useState<OnboardingGoal[]>(goalPresets);
  const [reminders, setReminders] = useState<OnboardingReminder[]>(commonBillReminders);
  const [investments] = useState<OnboardingInvestment[]>([]);
  const [preferences] = useState({
    showScore: true,
    showPredictions: true,
    weeklyReport: true,
    alerts: true,
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const step = STEPS[currentStep];

  const strategyRules = useStrategyRules({
    monthlyIncome: profile.monthlyIncome,
    hasDebts: profile.hasDebts,
    riskProfile: profile.riskProfile as any,
    employmentType: profile.employmentType as any,
    dependents: profile.dependents,
    age: profile.age
  });

  // -- Helpers --
  const handleProfileChange = (field: keyof UserProfile | ExpenseField, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // -- Validation per step --
  const validateCurrentStep = (): boolean => {
    const stepId = STEPS[currentStep]?.id;
    const errors: Record<string, string> = {};

    switch (stepId) {
      case "identity":
        if (!profile.name.trim()) errors.name = "Nome é obrigatório";
        if ((profile.age ?? 0) < 18 || (profile.age ?? 0) > 120) errors.age = "Idade deve ser entre 18 e 120";
        if ((profile.dependents ?? 0) < 0) errors.dependents = "Dependentes não pode ser negativo";
        break;
      case "income":
        if (profile.monthlyIncome <= 0) errors.monthlyIncome = "Renda deve ser maior que zero";
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const paginate = (newDirection: number) => {
    if (currentStep === 0 && newDirection === -1) return;
    if (currentStep === STEPS.length - 1 && newDirection === 1) {
      finalize();
      return;
    }

    // Validar antes de avançar
    if (newDirection === 1 && !validateCurrentStep()) return;
    
    let nextStepIndex = currentStep + newDirection;
    // Pular a etapa de empresa se for CLT
    if (STEPS[nextStepIndex]?.id === "business" && profile.employmentType === "clt") {
      nextStepIndex += newDirection;
    }

    setValidationErrors({});
    setDirection(newDirection);
    setCurrentStep(nextStepIndex);
  };

  const finalize = async () => {
    setIsSaving(true);
    const data: OnboardingData = {
      profile,
      budgets,
      goals,
      reminders,
      preferences,
      investments,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    try {
      const sanitizedProfile = {
        ...profile,
        businessName: profile.businessName?.trim() ? profile.businessName.trim() : undefined,
        businessCnpj: profile.businessCnpj?.trim() ? profile.businessCnpj.trim() : undefined,
        businessSector: profile.businessSector?.trim() ? profile.businessSector.trim() : undefined,
      };

      const expenseKeys: ExpenseKey[] = ['housing', 'food', 'transport', 'health', 'education', 'leisure', 'subscriptions', 'shopping'];
      const historicalExpenses = expenseKeys
        .map(key => ({
          category: key,
          amount: profile[`expense_${key}`] || 0,
          month: new Date().toISOString().slice(0, 7),
        }))
        .filter(exp => exp.amount > 0);

      const payload = {
        profile: {
          ...sanitizedProfile,
          investmentHorizon: sanitizedProfile.riskProfile === "conservative" ? "long" : sanitizedProfile.riskProfile === "moderate" ? "medium" : "short",
        },
        budgets,
        goals,
        reminders,
        investments,
        historicalExpenses,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await api.put('/users/onboarding', payload);
      saveOnboarding(data);
      applyOnboardingConfig(data);
      await refreshUser();

      // 🎉 Celebração antes de fechar
      setShowCelebration(true);
      showSuccess(`Incrível, ${profile.name}! Sua jornada financeira começa agora! 🚀`);
      setTimeout(() => {
        setShowCelebration(false);
        onComplete();
      }, 2200);
    } catch (_err) {
      showError("Erro ao sincronizar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Sinal contextual da Academia calculado a partir do perfil coletado
  const academySignal = useMemo(() => getAcademySignal(profile), [
    profile.hasDebts, profile.hasEmergencyFund, profile.employmentType, profile.financialGoal
  ]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-[100] bg-[#030712] flex flex-col font-sans overflow-hidden text-white">
      {/* 🎉 Confetti Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
          >
            {celebrationDots.map(dot => (
              <motion.div
                key={dot.id}
                initial={{ x: '50vw', y: '50vh', opacity: 1, scale: 0 }}
                animate={{
                  x: `${dot.x}vw`,
                  y: `${dot.y}vh`,
                  opacity: 0,
                  scale: 1.5,
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{ duration: 1.8, delay: dot.delay, ease: 'easeOut' }}
                className="absolute rounded-full"
                style={{ width: dot.size, height: dot.size, backgroundColor: dot.color }}
              />
            ))}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center z-10"
            >
              <div className="text-7xl mb-4">🎉</div>
              <p className="text-2xl font-black text-white">Jornada Iniciada!</p>
              <p className="text-white/50 text-sm mt-2">Preparando seu dashboard...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[100px]" 
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Crown size={16} className="fill-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">
              Ato {step?.act ?? 0} de 3
            </p>
            <h1 className="text-sm font-bold tracking-tight">{step?.title ?? ""}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
              i === currentStep ? "w-6 bg-indigo-500" : i < currentStep ? "w-1.5 bg-emerald-500" : "w-1.5 bg-white/10"
            }`} />
          ))}
        </div>

        {onSkip && (
          <button onClick={onSkip} aria-label="Pular onboarding" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={18} className="text-white/40" />
          </button>
        )}
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 h-[2px] bg-white/5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" 
        />
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center hide-scrollbar">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg mx-auto"
          >
            {renderStep(currentStep, profile, handleProfileChange, goals, setGoals, reminders, setReminders, validationErrors, strategyRules, academySignal)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 p-6 pt-2 bg-black/40 backdrop-blur-xl border-t border-white/5 flex gap-4 items-center" 
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
        <Button 
          variant="ghost" 
          onClick={() => paginate(-1)}
          disabled={currentStep === 0}
          className="h-14 flex-1 bg-white/5 hover:bg-white/10 border-white/5 text-white/60 rounded-2xl transition-all"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={() => paginate(1)}
          disabled={isSaving}
          className="h-14 flex-[2] bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-lg rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" />
          ) : currentStep === STEPS.length - 1 ? (
            "Começar Agora"
          ) : (
            <>
              Confirmar
              <ArrowRight size={20} className="ml-2" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Step Renderer
// ----------------------------------------------------------------------------

function renderStep(
  index: number,
  profile: OnboardingProfile,
  onChange: (f: keyof UserProfile | ExpenseField, v: unknown) => void,
  goals: OnboardingGoal[],
  setGoals: React.Dispatch<React.SetStateAction<OnboardingGoal[]>>,
  reminders: OnboardingReminder[],
  setReminders: React.Dispatch<React.SetStateAction<OnboardingReminder[]>>,
  validationErrors: Record<string, string>,
  strategyRules: ReturnType<typeof useStrategyRules>,
  academySignal: AcademySignal
) {
  const step = STEPS[index];
  const stepId = step?.id;

  switch (stepId) {
    case "welcome":
      return (
        <div className="text-center space-y-8 pt-10">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center p-5 shadow-2xl shadow-indigo-500/40"
          >
            <Sparkles size={48} className="text-white fill-white/20" />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Olá! Vamos blindar sua <span className="text-indigo-400">Vida Financeira.</span>
            </h2>
            <p className="text-lg text-white/50 font-medium">
              Em 2 minutos, transformaremos seus dados em uma estratégia de elite.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <FeatureCard icon={Brain} label="Inteligência BR" />
            <FeatureCard icon={Shield} label="Privacidade Total" />
          </div>
        </div>
      );

    case "identity":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Quem é você?</h2>
            <p className="text-white/50">Esses dados personalizam sua estratégia financeira.</p>
          </div>
          
          {/* Nome */}
          <div className="space-y-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Seu Nome ou Apelido</Label>
            <Input 
              value={profile.name} 
              onChange={e => onChange("name", e.target.value)}
              placeholder="Ex: João Silva" 
              aria-invalid={!!validationErrors.name}
              className={`h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-bold focus:ring-2 ring-indigo-500/50 transition-all ${validationErrors.name ? 'border-rose-500/60 ring-rose-500/30' : ''}`}
            />
            {validationErrors.name && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.name}</p>}
          </div>

          {/* Idade + Dependentes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sua Idade</Label>
              <Input 
                type="number"
                value={profile.age || ""} 
                onChange={e => onChange("age", parseInt(e.target.value) || 0)}
                className="h-16 bg-white/5 border-white/10 rounded-2xl text-2xl font-black text-center"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Dependentes</Label>
              <Input 
                type="number"
                value={profile.dependents?.toString() || ""} 
                onChange={e => onChange("dependents", parseInt(e.target.value) || 0)}
                className="h-16 bg-white/5 border-white/10 rounded-2xl text-2xl font-black text-center"
              />
            </div>
          </div>

          {/* Situação Trabalhista */}
          <div className="space-y-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sua Situação</Label>
            <div className="grid grid-cols-2 gap-4">
              <SelectCard 
                active={profile.employmentType === 'clt'} 
                onClick={() => onChange("employmentType", "clt")}
                icon={Briefcase} 
                label="CLT / Funcional" 
                sub="Estabilidade e FGTS"
              />
              <SelectCard 
                active={profile.employmentType === 'pj'} 
                onClick={() => onChange("employmentType", "pj")}
                icon={Building2} 
                label="PJ / Empresário" 
                sub="Lucro e blindagem"
              />
            </div>
          </div>
        </div>
      );

    case "expenses":
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
                      onChange={e => onChange(`expense_${item.key as ExpenseKey}`, parseFloat(e.target.value) || 0)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-sm font-bold flex-1"
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
                      onChange={e => onChange(`expense_${item.key as ExpenseKey}`, parseFloat(e.target.value) || 0)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-sm font-bold flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 flex gap-3">
              <Zap size={18} className="shrink-0" />
              <p>Esses dados nos ajudam a calcular sua **capacidade real de poupança** e criar envelopes de orçamento personalizados.</p>
            </div>
          </div>
        </div>
      );

    case "investments":
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
                  onClick={() => onChange("riskProfile", exp.id === "beginner" ? "conservative" : "moderate")}
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
                  onClick={() => onChange("riskProfile", mode as "conservative" | "moderate" | "aggressive")}
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
                {formatCurrency(profile.initialBalance)}
              </div>
              <p className="text-[10px] text-white/30 mt-2">Já informado na etapa anterior</p>
            </div>
          </div>
        </div>
      );

    case "income":
      return (
        <div className="space-y-8 pt-6 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Qual sua renda mensal?</h2>
            <p className="text-white/50">Isso define sua capacidade de aporte e reserva.</p>
          </div>
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="text-5xl font-black tabular-nums text-indigo-400 tracking-tighter">
              {formatCurrency(profile.monthlyIncome)}
            </div>
            <Slider 
              value={[profile.monthlyIncome]} 
              onValueChange={([v]) => onChange("monthlyIncome", v)}
              min={1000} max={50000} step={500} 
              className="py-4"
            />
            <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
              <span>R$ 1k</span>
              <span>R$ 50k+</span>
            </div>
          </div>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 flex gap-3 text-left">
            <Zap size={18} className="shrink-0" />
            <p>Usaremos este valor para calcular sua **estratégia 50/30/20** de forma automática no próximo passo.</p>
          </div>
        </div>
      );

    case "balance":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">Seu Ponto de Partida</h2>
            <p className="text-white/50">Quanto você tem disponível hoje (contas + investimentos)?</p>
          </div>
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/30">R$</div>
              <Input 
                type="number"
                value={profile.initialBalance || ""}
                onChange={e => onChange("initialBalance", parseFloat(e.target.value) || 0)}
                className="h-24 pl-16 bg-white/5 border-white/10 rounded-[2.5rem] text-4xl font-black focus:bg-white/10 transition-all border-dashed"
                placeholder="0,00"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                role="button"
                tabIndex={0}
                aria-pressed={profile.hasEmergencyFund}
                aria-label="Marcar se possui reserva de emergência"
                onKeyDown={e => e.key === 'Enter' && onChange("hasEmergencyFund", !profile.hasEmergencyFund)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${profile.hasEmergencyFund ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"}`}
                onClick={() => onChange("hasEmergencyFund", !profile.hasEmergencyFund)}>
                <Shield className={profile.hasEmergencyFund ? "text-emerald-400" : "text-white/20"} />
                <p className="mt-3 font-bold text-sm">Tenho Reserva de Emergência</p>
              </div>
              <div 
                role="button"
                tabIndex={0}
                aria-pressed={profile.hasDebts}
                aria-label="Marcar se possui dívidas atuais"
                onKeyDown={e => e.key === 'Enter' && onChange("hasDebts", !profile.hasDebts)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${profile.hasDebts ? "bg-rose-500/20 border-rose-500/50" : "bg-white/5 border-white/10"}`}
                onClick={() => onChange("hasDebts", !profile.hasDebts)}>
                <CreditCard className={profile.hasDebts ? "text-rose-400" : "text-white/20"} />
                <p className="mt-3 font-bold text-sm">Possuo Dívidas Atuais</p>
              </div>
            </div>
          </div>
        </div>
      );

    case "strategy": {
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
                <p className="text-3xl font-black text-emerald-400">{formatCurrency(profile.monthlyIncome * reserveMonths)}</p>
                <p className="text-[10px] text-white/40">Valor Alvo</p>
              </div>
            </div>
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

    case "goals":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">O que vamos conquistar?</h2>
            <p className="text-white/50">Defina suas prioridades de vida.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {goals.map((g, i) => (
              <div 
                key={i}
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
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                  g.enabled ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10"
                }`}
              >
                <span className="text-2xl block mb-2">{g.icon}</span>
                <p className="font-bold text-sm leading-tight">{g.name}</p>
                {g.enabled && <Check size={14} className="absolute top-4 right-4 text-indigo-400" />}
              </div>
            ))}
          </div>
        </div>
      );

    case "automation":
      return (
        <div className="space-y-6 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">Piloto Automático</h2>
            <p className="text-white/50">Ative e edite as contas que a IA vai te lembrar.</p>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto px-1 pr-2 hide-scrollbar">
            {reminders.map((r, i) => (
              <div
                key={i}
                className={`rounded-2xl border transition-all ${
                  r.enabled ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                }`}
              >
                {/* Toggle row */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    const newR = [...reminders];
                    if (newR[i]) { newR[i].enabled = !newR[i].enabled; setReminders(newR); }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.enabled ? "bg-indigo-500" : "bg-white/5"}`}>
                      <Bell size={14} className={r.enabled ? "text-white" : "text-white/20"} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{r.name}</p>
                      <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                        {(r.amount || 0) > 0 ? `R$ ${(r.amount || 0).toLocaleString('pt-BR')} · ` : ""}Dia {r.dueDay}
                      </p>
                    </div>
                  </div>
                  <Switch checked={r.enabled} onCheckedChange={() => {}} />
                </div>

                {/* Editable fields — only when enabled */}
                {r.enabled && (
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Nome</label>
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => {
                          const newR = [...reminders];
                          if (newR[i]) { newR[i].name = e.target.value; setReminders(newR); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Valor (R$)</label>
                      <input
                        type="number"
                        value={r.amount || ""}
                        placeholder="0"
                        onChange={(e) => {
                          const newR = [...reminders];
                          if (newR[i]) { newR[i].amount = Number(e.target.value); setReminders(newR); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Dia Vcto.</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={r.dueDay}
                        onChange={(e) => {
                          const newR = [...reminders];
                          if (newR[i]) { newR[i].dueDay = Number(e.target.value); setReminders(newR); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Adicionar conta personalizada */}
            <button
              type="button"
              onClick={() => {
                setReminders([...reminders, {
                  name: "Nova Conta",
                  amount: 0,
                  dueDay: 10,
                  category: "Outros",
                  enabled: true,
                }]);
              }}
              className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-white/40 text-sm font-semibold hover:border-indigo-500/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">＋</span> Adicionar conta personalizada
            </button>
          </div>
        </div>
      );

    case "summary": {
      const isPJ = profile.employmentType === 'pj';
      const hasDebts = !!profile.hasDebts;
      const noReserve = !profile.hasEmergencyFund;
      const savingsCapacity = profile.monthlyIncome * strategyRules.pF;
      
      // Determinar status geral para coloração
      void (hasDebts ? 'rose' : noReserve ? 'amber' : 'emerald'); // statusColor derivado implicitamente
      const statusLabel = hasDebts ? '⚠️ Prioridade: Quitar Dívidas' : noReserve ? '🛡️ Prioridade: Construir Reserva' : '🚀 Pronto para Crescer';
      const statusBg = hasDebts ? 'bg-rose-500/10 border-rose-500/30' : noReserve ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
      const statusText = hasDebts ? 'text-rose-400' : noReserve ? 'text-amber-400' : 'text-emerald-400';

      return (
        <div className="space-y-6 pt-6">
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40"
            >
              <Target size={36} className="text-white" />
            </motion.div>
            <h2 className="text-3xl font-black">Diagnóstico Pronto!</h2>
            <p className="text-white/50 text-sm">
              Perfil <span className="font-bold text-white">{isPJ ? 'Empresário PJ' : 'CLT'}</span>
              {profile.age ? `, ${profile.age} anos` : ''}
              {(profile.dependents ?? 0) > 0 ? `, ${profile.dependents} dependente${(profile.dependents ?? 0) > 1 ? 's' : ''}` : ''}
            </p>
          </div>

          {/* Status Banner Contextual */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-2xl border flex items-center gap-3 ${statusBg}`}
          >
            <span className={`text-lg font-black ${statusText}`}>{statusLabel}</span>
          </motion.div>

          {/* Dados Financeiros */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-3"
          >
            <SummaryItem label="Regra de Alocação" value={strategyRules.ruleName} />
            <SummaryItem label="Renda Mensal" value={formatCurrency(profile.monthlyIncome)} />
            <SummaryItem
              label={hasDebts ? "⚠️ Direcionar para Dívidas" : "Capacidade de Aporte"}
              value={formatCurrency(savingsCapacity)}
              highlight={!hasDebts}
              danger={hasDebts}
            />
            <SummaryItem
              label="Reserva de Emergência"
              value={`${strategyRules.reserveMonths} meses · ${formatCurrency(profile.monthlyIncome * strategyRules.reserveMonths)}`}
            />
            {hasDebts && (
              <div className="pt-2 text-xs text-rose-300 flex items-start gap-2 border-t border-white/5">
                <span>🔴</span>
                <span>Recomendamos quitar dívidas antes de investir. Cada R$1 em juros é prejuízo direto.</span>
              </div>
            )}
            {noReserve && !hasDebts && (
              <div className="pt-2 text-xs text-amber-300 flex items-start gap-2 border-t border-white/5">
                <span>⚡</span>
                <span>Construir a reserva primeiro protege você de voltar ao zero em imprevistos.</span>
              </div>
            )}
          </motion.div>

          {/* Card de Recomendação da Academia */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`p-5 rounded-2xl border ${
              academySignal.color === 'rose' ? 'bg-rose-500/10 border-rose-500/20' :
              academySignal.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
              academySignal.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
              'bg-indigo-500/10 border-indigo-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{academySignal.emoji}</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Seu Primeiro Módulo na Academia</p>
                <p className="font-bold text-sm text-white leading-tight mb-1.5">{academySignal.title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{academySignal.reason}</p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

const FeatureCard = ({ icon: Icon, label }: FeatureCardProps) => (
  <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl">
    <Icon size={14} className="text-indigo-400" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{label}</span>
  </div>
);

const SelectCard = ({ active, onClick, icon: Icon, label, sub }: SelectCardProps) => (
  <Button 
    type="button"
    variant="glossy"
    onClick={onClick}
    aria-pressed={active}
    aria-label={`Selecionar ${label}`}
    className={`p-6 h-auto flex-col items-start justify-start rounded-2xl border text-left transition-all relative ${
      active 
        ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
    }`}
  >
    <Icon className={`mb-3 transition-colors ${active ? "text-indigo-400" : "text-white/30"}`} size={24} />
    <p className="font-bold text-sm block mb-1 text-left">{label}</p>
    <p className="text-[10px] text-white/40 leading-tight text-left">{sub}</p>
    {active && <Check size={14} className="absolute top-4 right-4 text-indigo-400" />}
  </Button>
);

const StrategyRow = ({ color, label, sub, val }: StrategyRowProps) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-8 rounded-full ${color}`} />
      <div>
        <p className="text-xs font-bold leading-none mb-1">{label}</p>
        <p className="text-[9px] text-white/30 font-medium">{sub}</p>
      </div>
    </div>
    <div className="text-sm font-black tabular-nums">{val}</div>
  </div>
);

const SummaryItem = ({ label, value, highlight, danger }: SummaryItemProps & { danger?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 border-dashed">
    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black ${
      danger ? "text-rose-400" : highlight ? "text-emerald-400" : "text-white"
    }`}>{value}</span>
  </div>
);
