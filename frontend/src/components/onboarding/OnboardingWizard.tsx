import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import { applyOnboardingConfig, saveOnboarding } from "@/lib/onboarding";
import { showSuccess } from "@/lib/toast";
import type {
  OnboardingBudget,
  OnboardingData,
  OnboardingExpense,
  OnboardingGoal,
  OnboardingReminder,
  UserProfile,
} from "@/types";
import {
  budgetTemplates,
  commonBillReminders,
  financialGoalTemplates,
  goalPresets,
} from "@/types/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Brain,
  Building2,
  Check,
  Crown,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", title: "Início", icon: Sparkles },
  { id: "profile", title: "Perfil", icon: Wallet },
  { id: "balance", title: "Saldo", icon: Wallet },
  { id: "expenses", title: "Gastos", icon: TrendingUp },
  { id: "investments", title: "Invest.", icon: Briefcase },
  { id: "business", title: "Empresa", icon: Building2 },
  { id: "budgets", title: "Budgets", icon: Target },
  { id: "goals", title: "Metas", icon: TrendingUp },
  { id: "reminders", title: "Contas", icon: Bell },
  { id: "preferences", title: "Opções", icon: Settings },
];

const initialProfile: UserProfile = {
  name: "",
  monthlyIncome: 5000,
  financialGoal: "save",
  riskProfile: "moderate",
  hasEmergencyFund: false,
  hasDebts: false,
  initialBalance: 0,
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95,
  }),
};

export const OnboardingWizard = ({ onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [historicalExpenses, setHistoricalExpenses] = useState<
    OnboardingExpense[]
  >([]);
  const [budgets, setBudgets] = useState<OnboardingBudget[]>(
    budgetTemplates.moderate
  );
  const [goals, setGoals] = useState<OnboardingGoal[]>(goalPresets);
  const [reminders, setReminders] =
    useState<OnboardingReminder[]>(commonBillReminders);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [preferences, setPreferences] = useState({
    showScore: true,
    showPredictions: true,
    weeklyReport: true,
    alerts: true,
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateBudgetsFromProfile = (income: number, riskProfile: string) => {
    const template =
      budgetTemplates[riskProfile as keyof typeof budgetTemplates] ||
      budgetTemplates.moderate;
    setBudgets(
      template.map((b) => ({
        ...b,
        amount: Math.round((b.percentage / 100) * income),
      }))
    );
  };

  const handleProfileChange = (field: keyof UserProfile, value: unknown) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);

    if (field === "monthlyIncome" || field === "riskProfile") {
      updateBudgetsFromProfile(
        field === "monthlyIncome" ? (value as number) : profile.monthlyIncome,
        field === "riskProfile" ? (value as string) : profile.riskProfile
      );
    }
  };

  const handleComplete = () => {
    const data: OnboardingData = {
      profile,
      budgets,
      goals,
      reminders,
      historicalExpenses,
      preferences,
      investments,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveOnboarding(data);
    applyOnboardingConfig(data);
    showSuccess(`Bem-vindo(a), ${profile.name}! Tudo pronto.`);
    onComplete();
  };

  const paginate = (newDirection: number) => {
    if (
      (currentStep === 0 && newDirection === -1) ||
      (currentStep === STEPS.length - 1 && newDirection === 1)
    ) {
      if (newDirection === 1) handleComplete();
      return;
    }
    setDirection(newDirection);
    setCurrentStep(currentStep + newDirection);
  };

  const renderStep = () => {
    const commonProps = {
      key: currentStep,
      custom: direction,
      variants: variants,
      initial: "enter",
      animate: "center",
      exit: "exit",
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    };

    switch (STEPS[currentStep].id) {
      case "welcome":
        return (
          <motion.div {...commonProps} className="w-full">
            <WelcomeStep profile={profile} onChange={handleProfileChange} />
          </motion.div>
        );
      case "profile":
        return (
          <motion.div {...commonProps} className="w-full">
            <ProfileStep profile={profile} onChange={handleProfileChange} />
          </motion.div>
        );
      case "balance":
        return (
          <motion.div {...commonProps} className="w-full">
            <BalanceStep profile={profile} onChange={handleProfileChange} />
          </motion.div>
        );
      case "expenses":
        return (
          <motion.div {...commonProps} className="w-full">
            <ExpensesStep
              expenses={historicalExpenses}
              setExpenses={setHistoricalExpenses}
            />
          </motion.div>
        );
      case "investments":
        return (
          <motion.div {...commonProps} className="w-full">
            <InvestmentsStep
              investments={investments}
              setInvestments={setInvestments}
            />
          </motion.div>
        );
      case "business":
        return (
          <motion.div {...commonProps} className="w-full">
            <BusinessStep profile={profile} setProfile={setProfile} />
          </motion.div>
        );
      case "budgets":
        return (
          <motion.div {...commonProps} className="w-full">
            <BudgetsStep
              budgets={budgets}
              setBudgets={setBudgets}
              income={profile.monthlyIncome}
            />
          </motion.div>
        );
      case "goals":
        return (
          <motion.div {...commonProps} className="w-full">
            <GoalsStep goals={goals} setGoals={setGoals} />
          </motion.div>
        );
      case "reminders":
        return (
          <motion.div {...commonProps} className="w-full">
            <RemindersStep reminders={reminders} setReminders={setReminders} />
          </motion.div>
        );
      case "preferences":
        return (
          <motion.div {...commonProps} className="w-full">
            <PreferencesStep
              preferences={preferences}
              setPreferences={setPreferences}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] overflow-hidden flex items-center justify-center font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-5xl h-[90vh] md:h-auto flex flex-col md:flex-row relative z-10 p-4 md:p-8 gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <Crown className="text-white fill-white" size={20} />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Setup
              </span>
            </div>

            <nav className="space-y-1">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (index < currentStep) {
                        setDirection(-1);
                        setCurrentStep(index);
                      }
                    }}
                    className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                        ${
                          isActive
                            ? "bg-white/10 text-white shadow-inner border border-white/5 backdrop-blur-sm"
                            : isCompleted
                            ? "text-slate-400 hover:text-white hover:bg-white/5"
                            : "text-slate-600 cursor-not-allowed"
                        }
                      `}
                    disabled={index > currentStep}
                  >
                    <div
                      className={`
                         w-6 h-6 rounded-lg flex items-center justify-center transition-colors
                         ${
                           isActive
                             ? "bg-indigo-500 text-white"
                             : isCompleted
                             ? "bg-emerald-500/20 text-emerald-500"
                             : "bg-white/5 text-slate-500"
                         }
                      `}
                    >
                      {isCompleted ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <step.icon size={14} />
                      )}
                    </div>
                    {step.title}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="px-4 py-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/5 mt-4 md:mt-0">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl relative">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 hide-scrollbar flex items-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 md:px-10 md:py-8 border-t border-white/5 bg-white/[0.02] flex justify-between items-center backdrop-blur-sm">
            <Button
              variant="ghost"
              onClick={() => paginate(-1)}
              disabled={currentStep === 0}
              className={`
                    text-slate-400 hover:text-white hover:bg-white/5 rounded-xl px-6 h-12 gap-2 text-base font-medium transition-all
                    ${
                      currentStep === 0
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100"
                    }
                 `}
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>

            <Button
              onClick={() => paginate(1)}
              className="bg-white hover:bg-indigo-50 text-indigo-950 rounded-xl px-8 h-12 gap-3 text-base font-bold shadow-lg shadow-white/5 hover:scale-105 transition-all duration-300"
            >
              {currentStep === STEPS.length - 1
                ? "Concluir Setup"
                : "Continuar"}
              {currentStep === STEPS.length - 1 ? (
                <Check size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= Step Components =============

const WelcomeStep = ({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: unknown) => void;
}) => (
  <div className="text-center space-y-8 max-w-lg mx-auto">
    <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8 animate-float">
      <Sparkles className="text-white drop-shadow-md" size={48} />
    </div>

    <div className="space-y-4">
      <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-lg">
        Bem-vindo(a)!
      </h2>
      <p className="text-lg text-slate-400 font-medium leading-relaxed">
        Sou sua inteligência financeira. Vou organizar sua vida financeira em
        menos de 2 minutos.
      </p>
    </div>

    <div className="pt-8 text-left">
      <Label className="text-sm font-bold text-slate-300 uppercase tracking-widest pl-1 mb-2 block">
        Primeiro, seu nome
      </Label>
      <Input
        value={profile.name}
        onChange={(e) => onChange("name", e.target.value)}
        placeholder="Como quer ser chamado?"
        className="h-16 text-xl rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500/50 transition-all font-medium backdrop-blur-sm"
        autoFocus
      />
    </div>

    <div className="flex flex-wrap justify-center gap-3 pt-8 opacity-80">
      {[
        { icon: Zap, text: "Automático" },
        { icon: Brain, text: "Inteligente" },
        { icon: Shield, text: "Privado" },
      ].map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider backdrop-blur-sm"
        >
          <Icon size={14} className="text-indigo-400" />
          {text}
        </div>
      ))}
    </div>
  </div>
);

const ProfileStep = ({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: unknown) => void;
}) => (
  <div className="space-y-8 max-w-3xl mx-auto">
    <div className="text-center mb-10">
      <h2 className="text-3xl font-bold text-white mb-3">Perfil Financeiro</h2>
      <p className="text-slate-400 text-lg">
        Personalize a IA para o seu momento de vida
      </p>
    </div>

    <div className="grid gap-8">
      {/* Renda */}
      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm transition-colors hover:bg-white/[0.07]">
        <Label className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 block">
          Renda Mensal Estimada
        </Label>
        <div className="flex items-end gap-2 mb-6">
          <span className="text-5xl font-black text-white tracking-tight">
            {profile.monthlyIncome.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        <Slider
          value={[profile.monthlyIncome]}
          onValueChange={([v]) => onChange("monthlyIncome", v)}
          min={1000}
          max={50000}
          step={500}
          className="py-4"
        />
        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mt-2">
          <span>R$ 1k</span>
          <span>R$ 50k+</span>
        </div>
      </div>

      {/* Objetivo */}
      <div>
        <Label className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 block pl-2">
          Objetivo Principal
        </Label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(financialGoalTemplates).map(
            ([key, { name, icon }]) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={key}
                onClick={() => onChange("financialGoal", key)}
                className={`
                p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group
                ${
                  profile.financialGoal === key
                    ? "bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                }
              `}
              >
                <span className="text-3xl mb-4 block transform group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </span>
                <p
                  className={`font-bold text-sm ${
                    profile.financialGoal === key
                      ? "text-white"
                      : "text-slate-300"
                  }`}
                >
                  {name}
                </p>
                {profile.financialGoal === key && (
                  <motion.div
                    layoutId="active-check"
                    className="absolute top-4 right-4 text-indigo-400"
                  >
                    <Check size={18} strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil de Risco */}
        <div>
          <Label className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 block pl-2">
            Estilo de Gastos
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "conservative", label: "Econômico" },
              { key: "moderate", label: "Moderado" },
              { key: "aggressive", label: "Livre" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onChange("riskProfile", key)}
                className={`
                  py-3 px-2 rounded-xl text-sm font-bold border transition-all
                  ${
                    profile.riskProfile === key
                      ? "bg-white text-indigo-950 border-white shadow-lg"
                      : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1 block pl-2">
            Situação Atual
          </Label>
          <div className="flex-1 flex gap-4">
            <div
              className={`
                    flex-1 rounded-2xl border p-4 flex flex-col justify-between transition-colors cursor-pointer
                    ${
                      profile.hasEmergencyFund
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }
                 `}
              onClick={() =>
                onChange("hasEmergencyFund", !profile.hasEmergencyFund)
              }
            >
              <span
                className={`text-xs font-bold uppercase ${
                  profile.hasEmergencyFund
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                Reserva
              </span>
              <div className="flex justify-between items-center">
                <Shield
                  size={20}
                  className={
                    profile.hasEmergencyFund
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }
                />
                <Switch
                  checked={profile.hasEmergencyFund}
                  onCheckedChange={(v) => onChange("hasEmergencyFund", v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            <div
              className={`
                    flex-1 rounded-2xl border p-4 flex flex-col justify-between transition-colors cursor-pointer
                    ${
                      profile.hasDebts
                        ? "bg-rose-500/10 border-rose-500/30"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }
                 `}
              onClick={() => onChange("hasDebts", !profile.hasDebts)}
            >
              <span
                className={`text-xs font-bold uppercase ${
                  profile.hasDebts ? "text-rose-400" : "text-slate-500"
                }`}
              >
                Dívidas
              </span>
              <div className="flex justify-between items-center">
                <TrendingUp
                  size={20}
                  className={
                    profile.hasDebts ? "text-rose-400" : "text-slate-600"
                  }
                />
                <Switch
                  checked={profile.hasDebts}
                  onCheckedChange={(v) => onChange("hasDebts", v)}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BudgetsStep = ({
  budgets,
  setBudgets,
  income,
}: {
  budgets: OnboardingBudget[];
  setBudgets: (b: OnboardingBudget[]) => void;
  income: number;
}) => {
  const totalPercent = budgets
    .filter((b) => b.enabled)
    .reduce((s, b) => s + b.percentage, 0);

  const updateBudget = (index: number, updates: Partial<OnboardingBudget>) => {
    const newBudgets = [...budgets];
    newBudgets[index] = { ...newBudgets[index], ...updates };
    if (updates.percentage !== undefined) {
      newBudgets[index].amount = Math.round(
        (updates.percentage / 100) * income
      );
    }
    setBudgets(newBudgets);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Orçamentos Inteligentes
        </h2>
        <p className="text-slate-400">
          Sugestão baseada no método 50/30/20 adaptado
        </p>
      </div>

      <div
        className={`
         p-4 rounded-2xl flex justify-between items-center border backdrop-blur-md transition-colors
         ${
           totalPercent > 100
             ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
             : totalPercent === 100
             ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
             : "bg-amber-500/10 border-amber-500/30 text-amber-200"
         }
      `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              totalPercent > 100 ? "bg-rose-500/20" : "bg-emerald-500/20"
            }`}
          >
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <span className="font-bold text-sm">Alocação Total</span>
        </div>
        <span className="text-2xl font-black tracking-tight">
          {totalPercent}%
        </span>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {budgets.map((budget, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={budget.category}
            className={`
               group p-5 rounded-2xl border transition-all duration-300
               ${
                 budget.enabled
                   ? "bg-white/5 border-white/5 hover:border-white/10"
                   : "opacity-50 grayscale border-transparent"
               }
            `}
          >
            <div className="flex items-center gap-4 mb-4">
              <Switch
                checked={budget.enabled}
                onCheckedChange={(v) => updateBudget(i, { enabled: v })}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-lg">
                    {budget.category}
                  </span>
                  <span className="text-indigo-400 font-bold">
                    {formatCurrency(budget.amount)}
                  </span>
                </div>
              </div>
            </div>

            {budget.enabled && (
              <div className="pl-14">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                  <span>Proporção</span>
                  <span>{budget.percentage}%</span>
                </div>
                <Slider
                  value={[budget.percentage]}
                  onValueChange={([v]) => updateBudget(i, { percentage: v })}
                  min={0}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const GoalsStep = ({
  goals,
  setGoals,
}: {
  goals: OnboardingGoal[];
  setGoals: (g: OnboardingGoal[]) => void;
}) => {
  const toggleGoal = (index: number) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], enabled: !newGoals[index].enabled };
    setGoals(newGoals);
  };

  const updateGoal = (index: number, amount: number) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], targetAmount: amount };
    setGoals(newGoals);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Suas Metas</h2>
        <p className="text-slate-400">O que você quer conquistar esse ano?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal, i) => (
          <motion.div
            layout
            key={goal.name}
            className={`
               relative p-6 rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer group
               ${
                 goal.enabled
                   ? "bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                   : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
               }
            `}
            onClick={() => toggleGoal(i)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl grayscale-0">
              {goal.icon}
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-3xl drop-shadow-md">{goal.icon}</span>
              <div
                className={`
                   w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                   ${
                     goal.enabled
                       ? "bg-indigo-500 border-indigo-500"
                       : "border-slate-600"
                   }
                `}
              >
                {goal.enabled && (
                  <Check size={14} className="text-white" strokeWidth={4} />
                )}
              </div>
            </div>

            <p
              className={`font-bold text-lg mb-4 relative z-10 ${
                goal.enabled ? "text-white" : "text-slate-300"
              }`}
            >
              {goal.name}
            </p>

            <AnimatePresence>
              {goal.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 relative z-10"
                >
                  <Label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                    Valor Alvo
                  </Label>
                  <Input
                    type="number"
                    value={goal.targetAmount}
                    onChange={(e) => updateGoal(i, Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="h-10 bg-black/20 border-white/10 text-white rounded-xl focus:border-indigo-500"
                    placeholder="R$ 0,00"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const RemindersStep = ({
  reminders,
  setReminders,
}: {
  reminders: OnboardingReminder[];
  setReminders: (r: OnboardingReminder[]) => void;
}) => {
  const toggleReminder = (index: number) => {
    const newReminders = [...reminders];
    newReminders[index] = {
      ...newReminders[index],
      enabled: !newReminders[index].enabled,
    };
    setReminders(newReminders);
  };

  const updateReminder = (index: number, amount: number) => {
    const newReminders = [...reminders];
    newReminders[index] = { ...newReminders[index], amount };
    setReminders(newReminders);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Contas Fixas</h2>
        <p className="text-slate-400">
          Vamos configurar lembretes automáticos para você não pagar juros.
        </p>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, i) => (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            key={reminder.name}
            className={`
               flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 group
               ${
                 reminder.enabled
                   ? "bg-white/10 border-indigo-500/30 shadow-lg"
                   : "bg-white/5 border-white/5 hover:bg-white/[0.07]"
               }
            `}
          >
            <Switch
              checked={reminder.enabled}
              onCheckedChange={() => toggleReminder(i)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-base ${
                    reminder.enabled ? "text-white" : "text-slate-400"
                  }`}
                >
                  {reminder.name}
                </span>
                {reminder.enabled && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wide">
                    Ativo
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-slate-500">
                Vence dia {reminder.dueDay}
              </span>
            </div>

            {reminder.enabled && (
              <div className="w-32 animate-in slide-in-from-right-4 fade-in duration-300">
                <Input
                  type="number"
                  value={reminder.amount || ""}
                  onChange={(e) => updateReminder(i, Number(e.target.value))}
                  className="h-10 bg-black/20 border-white/10 text-white rounded-xl text-right font-medium"
                  placeholder="Valor"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const BalanceStep = ({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: unknown) => void;
}) => {
  return (
    <div className="space-y-8 max-w-lg mx-auto text-center">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Ponto de Partida</h2>
        <p className="text-slate-400">
          Qual é o saldo total de suas contas hoje?
        </p>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-indigo-400">
            R$
          </span>
          <Input
            type="number"
            value={profile.initialBalance || ""}
            onChange={(e) => onChange("initialBalance", Number(e.target.value))}
            className="pl-16 h-24 text-4xl md:text-5xl font-black rounded-3xl bg-white/5 border-white/10 text-white placeholder:text-slate-700/50 focus:bg-white/10 focus:border-indigo-500 transition-all text-center tracking-tight"
            placeholder="0,00"
            autoFocus
          />
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        Não se preocupe, você pode ajustar isso depois
      </p>
    </div>
  );
};

const BusinessStep = ({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}) => {
  const [hasBusiness, setHasBusiness] = useState(!!profile.businessProfile);

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Modo Empresarial</h2>
        <p className="text-slate-400">
          Ative ferramentas exclusivas para PJ e MEI
        </p>
      </div>

      <div
        className={`
            p-8 rounded-3xl border-2 transition-all cursor-pointer group hover:scale-[1.02] duration-300
            ${
              hasBusiness
                ? "bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/20"
                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
            }
         `}
        onClick={() => {
          const newValue = !hasBusiness;
          setHasBusiness(newValue);
          if (newValue) {
            setProfile({
              ...profile,
              businessProfile: { name: "", sector: "" },
            });
          } else {
            const { businessProfile, ...rest } = profile;
            setProfile(rest as UserProfile);
          }
        }}
      >
        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-full ${
              hasBusiness
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50"
                : "bg-white/10 text-slate-500"
            }`}
          >
            <Building2 size={40} />
          </div>
        </div>

        <h3
          className={`text-xl font-bold mb-2 ${
            hasBusiness ? "text-white" : "text-slate-300"
          }`}
        >
          Eu tenho uma empresa
        </h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
          Separa suas finanças pessoais das empresariais em um único lugar.
        </p>

        <Switch
          checked={hasBusiness}
          onCheckedChange={setHasBusiness}
          className="data-[state=checked]:bg-indigo-500"
        />
      </div>

      <AnimatePresence>
        {hasBusiness && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 text-left"
          >
            <div className="space-y-2">
              <Label className="pl-1 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                Nome da Empresa
              </Label>
              <Input
                value={profile.businessProfile?.name || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    businessProfile: {
                      ...profile.businessProfile!,
                      name: e.target.value,
                    },
                  })
                }
                placeholder="Ex: Minha Loja Ltda"
                className="rounded-xl h-14 bg-white/5 border-white/10 text-white font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="pl-1 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                Ramo de Atividade
              </Label>
              <Input
                value={profile.businessProfile?.sector || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    businessProfile: {
                      ...profile.businessProfile!,
                      sector: e.target.value,
                    },
                  })
                }
                placeholder="Ex: Varejo, Tecnologia, Serviços..."
                className="rounded-xl h-14 bg-white/5 border-white/10 text-white font-medium"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PreferencesStep = ({
  preferences,
  setPreferences,
}: {
  preferences: {
    showScore: boolean;
    showPredictions: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  };
  setPreferences: (p: {
    showScore: boolean;
    showPredictions: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  }) => void;
}) => {
  const items = [
    {
      key: "showScore",
      label: "Score Financeiro",
      desc: "Exibir sua pontuação de saúde financeira",
      icon: <Target className="text-emerald-400" size={20} />,
    },
    {
      key: "showPredictions",
      label: "Previsões IA",
      desc: "Previsões inteligentes de gastos futuros",
      icon: <Brain className="text-purple-400" size={20} />,
    },
    {
      key: "weeklyReport",
      label: "Relatório Semanal",
      desc: "Resumo semanal das suas finanças",
      icon: <TrendingUp className="text-indigo-400" size={20} />,
    },
    {
      key: "alerts",
      label: "Alertas Inteligentes",
      desc: "Notificações sobre gastos excessivos",
      icon: <Bell className="text-amber-400" size={20} />,
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Suas Preferências
        </h2>
        <p className="text-slate-400">
          Personalize sua experiência com a nossa IA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ key, label, desc, icon }, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={key}
            className={`
               p-5 rounded-2xl border transition-all duration-300
               ${
                 preferences[key as keyof PreferencesType]
                   ? "bg-white/10 border-indigo-500/30 shadow-lg"
                   : "bg-white/5 border-white/5 hover:bg-white/[0.07]"
               }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white/5">{icon}</div>
              <Switch
                checked={preferences[key as keyof PreferencesType]}
                onCheckedChange={(v) =>
                  setPreferences({ ...preferences, [key]: v })
                }
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
            <div>
              <p
                className={`font-bold text-base ${
                  preferences[key as keyof PreferencesType]
                    ? "text-white"
                    : "text-slate-300"
                }`}
              >
                {label}
              </p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                {desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10 backdrop-blur-md relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
          <Sparkles size={64} className="text-indigo-400" />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Check className="text-white" size={24} strokeWidth={3} />
          </div>
          <div>
            <p className="font-black text-white text-xl tracking-tight">
              Tudo pronto!
            </p>
            <p className="text-sm text-slate-400 font-medium">
              Sua vida financeira está prestes a mudar.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ExpensesStep = ({
  expenses,
  setExpenses,
}: {
  expenses: OnboardingExpense[];
  setExpenses: (e: OnboardingExpense[]) => void;
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7);
  const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2))
    .toISOString()
    .slice(0, 7);

  const categories = [
    { name: "Alimentação", icon: "🍱" },
    { name: "Moradia", icon: "🏠" },
    { name: "Transporte", icon: "🚗" },
    { name: "Lazer", icon: "🎭" },
    { name: "Saúde", icon: "🏥" },
    { name: "Educação", icon: "🎓" },
    { name: "Contas", icon: "🧾" },
  ];

  const updateExpense = (category: string, month: string, amount: number) => {
    const newExpenses = [...expenses].filter(
      (e) => !(e.category === category && e.month === month)
    );
    if (amount > 0) {
      newExpenses.push({ category, month, amount });
    }
    setExpenses(newExpenses);
  };

  const getAmount = (category: string, month: string) => {
    return (
      expenses.find((e) => e.category === category && e.month === month)
        ?.amount || 0
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold italic tracking-tighter uppercase mb-1 text-white">
          Seus Gastos Mensais
        </h2>
        <p className="text-muted-foreground text-sm">
          Insira seus gastos médios dos últimos meses para uma análise mais
          precisa da IA. Isso ajudará a criar previsões reais.
        </p>
      </div>

      <div className="space-y-8 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {[twoMonthsAgo, prevMonth, currentMonth].map((month) => (
          <div key={month} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="font-black text-lg uppercase tracking-widest text-white/90">
                {month === currentMonth ? "Mês Atual" : "Mês Passado"} ({month})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </span>
                    <span className="font-bold text-sm text-slate-300">
                      {cat.name}
                    </span>
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400">
                      R$
                    </span>
                    <Input
                      type="number"
                      value={getAmount(cat.name, month) || ""}
                      onChange={(e) =>
                        updateExpense(cat.name, month, Number(e.target.value))
                      }
                      className="h-10 pl-8 bg-black/40 border-white/10 rounded-xl font-black text-right text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InvestmentsStep = ({
  investments,
  setInvestments,
}: {
  investments: Investment[];
  setInvestments: (i: Investment[]) => void;
}) => {
  const [newAsset, setNewAsset] = useState({
    ticker: "",
    type: "stock" as const,
    amount: 1,
    averagePrice: 0,
  });

  const addAsset = () => {
    if (!newAsset.ticker) return;
    const asset: Investment = {
      id: Date.now(),
      name: newAsset.ticker.toUpperCase(),
      ticker: newAsset.ticker.toUpperCase(),
      type: newAsset.type,
      amount: newAsset.amount,
      averagePrice: newAsset.averagePrice,
      currentPrice: newAsset.averagePrice, // Placeholder
      sector: "Geral",
      lastUpdate: new Date().toISOString(),
    };
    setInvestments([...investments, asset]);
    setNewAsset({
      ticker: "",
      type: "stock",
      amount: 1,
      averagePrice: 0,
    });
  };

  const removeAsset = (id: number) => {
    setInvestments(investments.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-white">
          Seus Investimentos 📈
        </h2>
        <p className="text-slate-400 text-sm">
          Você já possui ações, FIIs ou criptos? Adicione-os aqui para que a IA
          possa analisar sua carteira e sugerir rebalanceamentos.
        </p>
      </div>

      <div className="premium-card p-6 bg-indigo-500/5 border-indigo-500/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Ticker / Nome
            </Label>
            <Input
              value={newAsset.ticker}
              onChange={(e) =>
                setNewAsset({ ...newAsset, ticker: e.target.value })
              }
              className="h-12 bg-black/40 border-white/10 rounded-xl font-bold uppercase"
              placeholder="Ex: PETR4"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Tipo
            </Label>
            <select
              value={newAsset.type}
              onChange={(e) =>
                setNewAsset({ ...newAsset, type: e.target.value as any })
              }
              className="w-full h-12 bg-black/40 border-white/10 rounded-xl px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="stock" className="bg-slate-900">Ação</option>
              <option value="fii" className="bg-slate-900">FII</option>
              <option value="crypto" className="bg-slate-900">Cripto</option>
              <option value="fixed_income" className="bg-slate-900">Renda Fixa</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Preço Médio
            </Label>
            <Input
              type="number"
              value={newAsset.averagePrice}
              onChange={(e) =>
                setNewAsset({ ...newAsset, averagePrice: Number(e.target.value) })
              }
              className="h-12 bg-black/40 border-white/10 rounded-xl font-bold"
              placeholder="R$ 0,00"
            />
          </div>
          <Button
            onClick={addAsset}
            className="h-12 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90"
          >
            Adicionar
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {investments.map((asset) => (
          <div
            key={asset.id}
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold uppercase text-xs">
                {asset.ticker.slice(0, 2)}
              </div>
              <div>
                <p className="font-black text-white text-sm uppercase tracking-tight">
                  {asset.ticker}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {asset.type} • PM: {formatCurrency(asset.averagePrice)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeAsset(asset.id)}
              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              Remover
            </Button>
          </div>
        ))}
        {investments.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <p className="text-slate-500 text-sm font-medium">Nenhum investimento adicionado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};
