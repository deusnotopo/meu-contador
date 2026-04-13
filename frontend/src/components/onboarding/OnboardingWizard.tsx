import { Button } from "@/components/ui/button";
import { applyOnboardingConfig, saveOnboarding } from "@/lib/onboarding";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
  OnboardingData,
  OnboardingDebt,
} from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Crown,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";

import { WelcomeStep } from "./steps/WelcomeStep";
import { IdentityStep } from "./steps/IdentityStep";
import { BusinessStep } from "./steps/BusinessStep";
import { IncomeStep } from "./steps/IncomeStep";
import { BalanceStep } from "./steps/BalanceStep";
import { ExpensesStep } from "./steps/ExpensesStep";
import { DebtsStep } from "./steps/DebtsStep";
import { InvestmentsStep } from "./steps/InvestmentsStep";
import { GoalsStep } from "./steps/GoalsStep";
import { AutomationStep } from "./steps/AutomationStep";
import { StrategyStep } from "./steps/StrategyStep";
import { FireGoalStep } from "./steps/FireGoalStep";
import { SummaryStep } from "./steps/SummaryStep";
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import type { OnboardingProfile, ExpenseKey } from "./types";

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

// ----------------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------------

const STEPS = [
  { id: "welcome", title: "Boas-vindas", act: 0 },
  { id: "identity", title: "Quem é Você", act: 1 },
  { id: "business", title: "Sua Empresa", act: 1 },      // condicional: PJ
  { id: "income", title: "Sua Renda", act: 1 },
  { id: "expenses", title: "Seus Gastos", act: 1 },
  { id: "balance", title: "Seu Patrimônio", act: 1 },
  { id: "debts", title: "Suas Dívidas", act: 2 },        // condicional: hasDebts
  { id: "investments", title: "Perfil de Investidor", act: 2 },
  { id: "goals", title: "Suas Metas", act: 2 },
  { id: "automation", title: "Piloto Automático", act: 2 },
  { id: "strategy", title: "Sua Estratégia", act: 3 },
  { id: "fire_goal", title: "Sua Aposentadoria", act: 3 }, // novo
  { id: "summary", title: "Diagnóstico Final", act: 3 },
];

// Steps que são condicionais e podem ser pulados
const CONDITIONAL_STEPS: Record<string, (profile: OnboardingProfile, debts: OnboardingDebt[]) => boolean> = {
  business: (profile) => profile.employmentType !== 'pj',
  debts: (profile) => !profile.hasDebts,
};

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------



const OnboardingWizardInner = ({ onComplete, onSkip }: Props) => {
  const { refreshUser } = useAuth();
  const {
    profile,
    budgets, goals, reminders,
    investments, onboardingDebts,
    preferences,
    setValidationErrors,
    saveDraft, clearDraft, loadedStep
  } = useOnboarding();

    const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);

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




  const step = STEPS[currentStep];
  const visibleSteps = useMemo(
    () => STEPS.filter((candidate) => !CONDITIONAL_STEPS[candidate.id]?.(profile, onboardingDebts)),
    [profile, onboardingDebts]
  );
  const visibleStepIndex = Math.max(
    visibleSteps.findIndex((candidate) => candidate.id === step?.id),
    0
  );
  const isFirstVisibleStep = visibleStepIndex === 0;
  const isLastVisibleStep = visibleStepIndex === visibleSteps.length - 1;
  const progress = ((visibleStepIndex + 1) / Math.max(visibleSteps.length, 1)) * 100;


  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [currentStep]);

  useEffect(() => {
    if (loadedStep !== null && loadedStep > 0 && currentStep === 0) {
      const loadedStepId = STEPS[loadedStep]?.id;
      const resolvedStepIndex = loadedStepId
        ? STEPS.findIndex(
            (candidate) =>
              candidate.id === loadedStepId &&
              !CONDITIONAL_STEPS[candidate.id]?.(profile, onboardingDebts)
          )
        : -1;

      setCurrentStep(resolvedStepIndex >= 0 ? resolvedStepIndex : 0);
      showSuccess("Rascunho detectado! Retomamos de onde parou.");
    }
  }, [loadedStep, currentStep, profile, onboardingDebts]);


  // -- Validation per step --
  const validateCurrentStep = (): boolean => {
    const stepId = STEPS[currentStep]?.id;
    const errors: Record<string, string> = {};
    const normalizedBusinessCnpj = (profile.businessCnpj || '').replace(/\D/g, '');
    const enabledGoals = goals.filter((goal) => goal.enabled);

    switch (stepId) {
      case "welcome":
        if (!profile.lgpdConsent) errors.lgpdConsent = "Você precisa autorizar o tratamento dos dados para continuar";
        break;
      case "identity":
        if (!profile.name.trim()) errors.name = "Nome é obrigatório";
        if ((profile.age ?? 0) < 18 || (profile.age ?? 0) > 120) errors.age = "Idade deve ser entre 18 e 120";
        if ((profile.dependents ?? 0) < 0) errors.dependents = "Dependentes não pode ser negativo";
        break;
      case "business":
        if (!profile.businessName?.trim()) errors.businessName = "Nome da empresa é obrigatório";
        if (normalizedBusinessCnpj.length !== 14) errors.businessCnpj = "Informe um CNPJ válido com 14 dígitos";
        break;
      case "income":
        if (profile.monthlyIncome <= 0) errors.monthlyIncome = "Renda deve ser maior que zero";
        break;
      case "balance":
        if (profile.initialBalance < 0) errors.initialBalance = "Use apenas patrimônio disponível. Dívidas devem ser cadastradas na etapa seguinte";
        break;
      case "debts":
        if (profile.hasDebts) {
          if (onboardingDebts.length === 0) {
            errors.onboardingDebts = "Adicione pelo menos uma dívida para continuar";
          } else if (onboardingDebts.some((debt) => !debt.name.trim() || debt.balance <= 0 || debt.minPayment <= 0 || debt.interestRate < 0)) {
            errors.onboardingDebts = "Preencha credor, saldo, juros e parcela mínima corretamente em todas as dívidas";
          }
        }
        break;
      case "goals":
        if (enabledGoals.some((goal) => !goal.targetAmount || goal.targetAmount <= 0 || !goal.deadline)) {
          errors.goals = "Defina valor alvo e prazo para cada meta ativada";
        }
        break;
      case "fire_goal":
        if ((profile.retirementAge ?? 0) < 18 || (profile.retirementAge ?? 0) > 99) errors.retirementAge = "Escolha uma idade entre 18 e 99 anos";
        if ((profile.fireTargetIncome ?? 0) <= 0) errors.fireTargetIncome = "Informe uma renda desejada maior que zero";
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const paginate = (newDirection: number) => {
    if (newDirection === -1 && isFirstVisibleStep) return;
    if (newDirection === 1 && isLastVisibleStep) return finalize();

    // Validar antes de avançar
    if (newDirection === 1 && !validateCurrentStep()) return;

    const nextVisibleStep = visibleSteps[visibleStepIndex + newDirection];
    if (!nextVisibleStep) return;

    const nextStepIndex = STEPS.findIndex((candidate) => candidate.id === nextVisibleStep.id);
    if (nextStepIndex === -1) return;

    setValidationErrors({});
    setDirection(newDirection);
    setCurrentStep(nextStepIndex);
    saveDraft(nextStepIndex);
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
          // Preserva a trilha da academia escolhida pelo usuário (investmentHorizon)
          // só usa fallback se não foi selecionada manualmente
          investmentHorizon: sanitizedProfile.investmentHorizon || (
            sanitizedProfile.riskProfile === "conservative" ? "long"
            : sanitizedProfile.riskProfile === "moderate" ? "medium"
            : "short"
          ),
          // Novos campos coletados no Wizard
          retirementAge: sanitizedProfile.retirementAge,
          fireTargetIncome: sanitizedProfile.fireTargetIncome,
          investorProfile: sanitizedProfile.investorProfile,
          lgpdConsent: sanitizedProfile.lgpdConsent ?? false,
          openFinanceBank: sanitizedProfile.openFinanceBank,
          insuranceTypes: sanitizedProfile.insuranceTypes,
        },
        budgets,
        goals,
        reminders,
        investments,
        debts: onboardingDebts,
        historicalExpenses,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await api.put('/users/onboarding', payload);

      saveOnboarding(data);
      clearDraft();
      applyOnboardingConfig(data);
      await refreshUser();

      // 🎉 Celebração antes de fechar
      setShowCelebration(true);
      showSuccess(`Incrível, ${profile.name}! Sua jornada financeira começa agora! 🚀`);
      setTimeout(() => {
        setShowCelebration(false);
        onComplete();
      }, 2200);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erro ao sincronizar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };



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
          {visibleSteps.map((visibleStep, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
              visibleStep.id === step?.id ? "w-6 bg-indigo-500" : i < visibleStepIndex ? "w-1.5 bg-emerald-500" : "w-1.5 bg-white/10"
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
            {(() => {
              switch (step?.id) {
                case "welcome": return <WelcomeStep />;
                case "identity": return <IdentityStep />;
                case "business": return <BusinessStep />;
                case "income": return <IncomeStep />;
                case "balance": return <BalanceStep />;
                case "expenses": return <ExpensesStep />;
                case "investments": return <InvestmentsStep />;
                case "strategy": return <StrategyStep />;
                case "goals": return <GoalsStep />;
                case "automation": return <AutomationStep />;
                case "debts": return <DebtsStep />;
                case "fire_goal": return <FireGoalStep />;
                case "summary": return <SummaryStep />;
                default: return null;
              }
            })()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 p-6 pt-2 bg-black/40 backdrop-blur-xl border-t border-white/5 flex gap-4 items-center" 
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
        <Button 
          variant="ghost" 
          onClick={() => paginate(-1)}
          disabled={isSaving || isFirstVisibleStep}
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
          ) : isLastVisibleStep ? (
            "Começar Agora"
          ) : (
            <>
              {visibleStepIndex < visibleSteps.length - 2 ? 'Continuar' : 'Revisar plano'}
              <ArrowRight size={20} className="ml-2" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
};

export const OnboardingWizard = (props: Props) => (
  <OnboardingProvider>
    <OnboardingWizardInner {...props} />
  </OnboardingProvider>
);

