import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import { applyOnboardingConfig, saveOnboarding } from "@/lib/onboarding";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "@/lib/api";
import type {
  OnboardingBudget,
  OnboardingData,
  OnboardingExpense,
  OnboardingGoal,
  OnboardingReminder,
  UserProfile,
  OnboardingInvestment,
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
  Briefcase,
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
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
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
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    scale: 0.97,
  }),
};

export const OnboardingWizard = ({ onComplete, onSkip }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [historicalExpenses, setHistoricalExpenses] = useState<OnboardingExpense[]>([]);
  const [budgets, setBudgets] = useState<OnboardingBudget[]>(budgetTemplates.moderate ?? []);
  const [goals, setGoals] = useState<OnboardingGoal[]>(goalPresets);
  const [reminders, setReminders] = useState<OnboardingReminder[]>(commonBillReminders);
  const [investments, setInvestments] = useState<OnboardingInvestment[]>([]);
  const [preferences, setPreferences] = useState({
    showScore: true,
    showPredictions: true,
    weeklyReport: true,
    alerts: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const progress = ((currentStep + 1) / Math.max(1, STEPS.length)) * 100;

  const updateBudgetsFromProfile = (income: number, riskProfile: string) => {
    const template =
      budgetTemplates[riskProfile as keyof typeof budgetTemplates] ||
      budgetTemplates.moderate || [];
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

  const handleComplete = async () => {
    setIsSaving(true);
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
    try {
      await api.put('/users/onboarding', data);
      saveOnboarding(data);
      applyOnboardingConfig(data);
      showSuccess(`Bem-vindo(a), ${profile.name}! Tudo pronto na Nuvem.`);
      onComplete();
    } catch {
      showError("Falha na sincronização. Sua sessão pode ter expirado.");
    } finally {
      setIsSaving(false);
    }
  };

  const paginate = (newDirection: number) => {
    if (currentStep === 0 && newDirection === -1) return;
    if (currentStep === STEPS.length - 1 && newDirection === 1) {
      handleComplete();
      return;
    }
    setDirection(newDirection);
    setCurrentStep(currentStep + newDirection);
  };

  const renderStep = () => {
    const commonProps = {
      custom: direction,
      variants,
      initial: "enter",
      animate: "center",
      exit: "exit",
      transition: {
        x: { type: "spring", stiffness: 350, damping: 35 },
        opacity: { duration: 0.15 },
      },
    };

    const step = STEPS[currentStep];
    if (!step) return null;

    switch (step.id) {
      case "welcome":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <WelcomeStep profile={profile} onChange={handleProfileChange} />
          </motion.div>
        );
      case "profile":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <ProfileStep profile={profile} onChange={handleProfileChange} />
          </motion.div>
        );
      case "balance":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <BalanceStep profile={profile} onChange={handleProfileChange} />
          </motion.div>
        );
      case "expenses":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <ExpensesStep expenses={historicalExpenses} setExpenses={setHistoricalExpenses} />
          </motion.div>
        );
      case "investments":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <InvestmentsStep investments={investments} setInvestments={setInvestments} />
          </motion.div>
        );
      case "business":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <BusinessStep profile={profile} setProfile={setProfile} />
          </motion.div>
        );
      case "budgets":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <BudgetsStep budgets={budgets} setBudgets={setBudgets} income={profile.monthlyIncome} />
          </motion.div>
        );
      case "goals":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <GoalsStep goals={goals} setGoals={setGoals} />
          </motion.div>
        );
      case "reminders":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <RemindersStep reminders={reminders} setReminders={setReminders} />
          </motion.div>
        );
      case "preferences":
        return (
          <motion.div key={currentStep} {...commonProps} className="w-full">
            <PreferencesStep preferences={preferences} setPreferences={setPreferences} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#030712] flex flex-col font-sans overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-indigo-600/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-purple-600/20 rounded-full blur-[80px] animate-pulse delay-1000" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
        {/* Logo + step info */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <Crown className="text-white fill-white" size={13} />
          </div>
          <div>
            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">
              Etapa {currentStep + 1}/{STEPS.length}
            </div>
            <div className="text-sm font-bold text-white leading-tight">
              {STEPS[currentStep]?.title}
            </div>
          </div>
        </div>

        {/* Step dots (compact) */}
        <div className="flex items-center gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-4 h-1.5 bg-indigo-400"
                  : i < currentStep
                  ? "w-1.5 h-1.5 bg-emerald-500"
                  : "w-1.5 h-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Skip */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="relative z-10 h-0.5 bg-white/5 shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* ── Scrollable step content ── */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 hide-scrollbar">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* ── Footer navigation ── */}
      <div className="relative z-10 px-4 py-3 border-t border-white/5 bg-[#030712]/60 flex justify-between items-center backdrop-blur-sm shrink-0"
        style={{ paddingBottom: `max(env(safe-area-inset-bottom, 12px), 12px)` }}>
        <Button
          variant="ghost"
          onClick={() => paginate(-1)}
          disabled={currentStep === 0}
          className={`h-11 px-4 gap-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all ${
            currentStep === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>

        {/* Step counter center */}
        <span className="text-[11px] text-slate-600 font-medium tabular-nums">
          {currentStep + 1} / {STEPS.length}
        </span>

        <Button
          onClick={() => paginate(1)}
          disabled={isSaving}
          className="h-11 px-5 gap-2 text-sm font-bold bg-white hover:bg-indigo-50 text-indigo-950 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200"
        >
          {isSaving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Salvando...
            </>
          ) : currentStep === STEPS.length - 1 ? (
            <>
              Finalizar
              <Check size={15} />
            </>
          ) : (
            <>
              Continuar
              <ArrowRight size={15} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// ============================================================
// STEP: Welcome
// ============================================================
const WelcomeStep = ({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: unknown) => void;
}) => (
  <div className="text-center space-y-6 max-w-sm mx-auto w-full pt-2">
    <div className="w-16 h-16 mx-auto bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden">
      <img
        src="/logo-new.png"
        alt="Logo"
        className="w-full h-full object-contain p-2.5"
      />
    </div>

    <div className="space-y-2">
      <h2 className="text-3xl font-black tracking-tighter text-white">
        Bem-vindo(a)!
      </h2>
      <p className="text-sm text-slate-400 font-medium leading-relaxed">
        Sou sua inteligência financeira. Vou organizar sua vida em menos de 2 minutos.
      </p>
    </div>

    <div className="text-left">
      <Label className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1 mb-2 block">
        Primeiro, seu nome
      </Label>
      <Input
        value={profile.name}
        onChange={(e) => onChange("name", e.target.value)}
        placeholder="Como quer ser chamado?"
        className="h-14 text-base rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500/50 transition-all font-medium"
        autoFocus
      />
    </div>

    <div className="flex flex-wrap justify-center gap-2 opacity-80">
      {[
        { icon: Zap, text: "Automático" },
        { icon: Brain, text: "Inteligente" },
        { icon: Shield, text: "Privado" },
      ].map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-wider"
        >
          <Icon size={11} className="text-indigo-400" />
          {text}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// STEP: Profile
// ============================================================
const ProfileStep = ({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: unknown) => void;
}) => (
  <div className="space-y-5 w-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-1">Perfil Financeiro</h2>
      <p className="text-slate-400 text-sm">Personalize a IA para o seu momento de vida</p>
    </div>

    {/* Renda */}
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
      <Label className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 block">
        Renda Mensal Estimada
      </Label>
      <div className="text-3xl font-black text-white tracking-tight mb-4">
        {profile.monthlyIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </div>
      <Slider
        value={[profile.monthlyIncome]}
        onValueChange={([v]) => onChange("monthlyIncome", v)}
        min={1000}
        max={50000}
        step={500}
        className="py-2"
      />
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mt-1">
        <span>R$ 1k</span>
        <span>R$ 50k+</span>
      </div>
    </div>

    {/* Objetivo — 2 cols on mobile */}
    <div>
      <Label className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 block pl-1">
        Objetivo Principal
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(financialGoalTemplates).map(([key, { name, icon }]) => (
          <motion.button
            whileTap={{ scale: 0.97 }}
            key={key}
            onClick={() => onChange("financialGoal", key)}
            className={`p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden
              ${
                profile.financialGoal === key
                  ? "bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
          >
            <span className="text-2xl mb-2 block">{icon}</span>
            <p className={`font-bold text-xs ${profile.financialGoal === key ? "text-white" : "text-slate-300"}`}>
              {name}
            </p>
            {profile.financialGoal === key && (
              <div className="absolute top-2 right-2 text-indigo-400">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>

    {/* Estilo de Gastos */}
    <div>
      <Label className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 block pl-1">
        Estilo de Gastos
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "conservative", label: "Econômico" },
          { key: "moderate", label: "Moderado" },
          { key: "aggressive", label: "Livre" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange("riskProfile", key)}
            className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all
              ${
                profile.riskProfile === key
                  ? "bg-white text-indigo-950 border-white shadow-lg"
                  : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
              }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    {/* Situação Atual */}
    <div>
      <Label className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 block pl-1">
        Situação Atual
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {/* div not button — Switch already renders a <button> inside */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onChange("hasEmergencyFund", !profile.hasEmergencyFund)}
          onKeyDown={(e) => e.key === "Enter" && onChange("hasEmergencyFund", !profile.hasEmergencyFund)}
          className={`rounded-2xl border p-4 flex items-center justify-between transition-colors cursor-pointer
            ${profile.hasEmergencyFund ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/5"}`}
        >
          <div className="text-left">
            <span className={`text-xs font-bold uppercase block ${profile.hasEmergencyFund ? "text-emerald-400" : "text-slate-500"}`}>
              Reserva
            </span>
            <Shield size={16} className={`mt-1 ${profile.hasEmergencyFund ? "text-emerald-400" : "text-slate-600"}`} />
          </div>
          <Switch
            checked={profile.hasEmergencyFund}
            onCheckedChange={(v) => onChange("hasEmergencyFund", v)}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onChange("hasDebts", !profile.hasDebts)}
          onKeyDown={(e) => e.key === "Enter" && onChange("hasDebts", !profile.hasDebts)}
          className={`rounded-2xl border p-4 flex items-center justify-between transition-colors cursor-pointer
            ${profile.hasDebts ? "bg-rose-500/10 border-rose-500/30" : "bg-white/5 border-white/5"}`}
        >
          <div className="text-left">
            <span className={`text-xs font-bold uppercase block ${profile.hasDebts ? "text-rose-400" : "text-slate-500"}`}>
              Dívidas
            </span>
            <TrendingUp size={16} className={`mt-1 ${profile.hasDebts ? "text-rose-400" : "text-slate-600"}`} />
          </div>
          <Switch
            checked={profile.hasDebts}
            onCheckedChange={(v) => onChange("hasDebts", v)}
            className="data-[state=checked]:bg-rose-500"
          />
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// STEP: Balance
// ============================================================
const BalanceStep = ({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: unknown) => void;
}) => (
  <div className="space-y-6 w-full text-center pt-4">
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Ponto de Partida</h2>
      <p className="text-slate-400 text-sm">Qual é o saldo total de suas contas hoje?</p>
    </div>

    <div className="relative group max-w-xs mx-auto">
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-indigo-400">R$</span>
        <Input
          type="number"
          value={profile.initialBalance || ""}
          onChange={(e) => onChange("initialBalance", Number(e.target.value))}
          className="pl-12 h-20 text-3xl font-black rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700/50 focus:bg-white/10 focus:border-indigo-500 transition-all text-center tracking-tight"
          placeholder="0,00"
          autoFocus
        />
      </div>
    </div>

    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
      Você pode ajustar isso depois
    </p>
  </div>
);

// ============================================================
// STEP: Expenses
// ============================================================
const ExpensesStep = ({
  expenses,
  setExpenses,
}: {
  expenses: OnboardingExpense[];
  setExpenses: (e: OnboardingExpense[]) => void;
}) => {
  // Anchor to 1st of month to avoid day-31 rollover bug in JS Date
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

  const [activeMonth, setActiveMonth] = useState(currentMonth);

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
    if (amount > 0) newExpenses.push({ category, month, amount });
    setExpenses(newExpenses);
  };

  const getAmount = (category: string, month: string) =>
    expenses.find((e) => e.category === category && e.month === month)?.amount || 0;

  return (
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Gastos Mensais</h2>
        <p className="text-slate-400 text-sm">
          Insira seus gastos para que a IA crie previsões reais.
        </p>
      </div>

      {/* Month tabs */}
      <div className="flex gap-2">
        {[prevMonth, currentMonth].map((month) => (
          <button
            key={month}
            onClick={() => setActiveMonth(month)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border
              ${activeMonth === month
                ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                : "bg-white/5 border-white/5 text-slate-400"
              }`}
          >
            {month === currentMonth ? "Mês Atual" : "Mês Anterior"}
            <div className="text-[9px] opacity-60 font-normal mt-0.5">{month}</div>
          </button>
        ))}
      </div>

      {/* Category inputs */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="bg-white/5 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3"
          >
            <span className="text-xl shrink-0">{cat.icon}</span>
            <span className="flex-1 font-medium text-sm text-slate-300">{cat.name}</span>
            <div className="relative w-28 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400">R$</span>
              <Input
                type="number"
                value={getAmount(cat.name, activeMonth) || ""}
                onChange={(e) => updateExpense(cat.name, activeMonth, Number(e.target.value))}
                className="h-10 pl-7 bg-black/40 border-white/10 rounded-xl font-bold text-right text-white text-sm"
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// STEP: Investments
// ============================================================
const InvestmentsStep = ({
  investments,
  setInvestments,
}: {
  investments: OnboardingInvestment[];
  setInvestments: (i: OnboardingInvestment[]) => void;
}) => {
  const [newAsset, setNewAsset] = useState<{
    ticker: string;
    type: "stock" | "fii" | "crypto" | "fixed_income";
    amount: number;
    averagePrice: number;
  }>({
    ticker: "",
    type: "stock",
    amount: 1,
    averagePrice: 0,
  });

  const addAsset = () => {
    if (!newAsset.ticker) return;
    const asset: OnboardingInvestment = {
      id: Date.now(),
      name: newAsset.ticker.toUpperCase(),
      ticker: newAsset.ticker.toUpperCase(),
      type: newAsset.type,
      amount: newAsset.amount,
      averagePrice: newAsset.averagePrice,
      currentPrice: newAsset.averagePrice,
      sector: "Geral",
      lastUpdate: new Date().toISOString(),
    };
    setInvestments([...investments, asset]);
    setNewAsset({ ticker: "", type: "stock", amount: 1, averagePrice: 0 });
  };

  const removeAsset = (id: number) => {
    setInvestments(investments.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Seus Investimentos 📈</h2>
        <p className="text-slate-400 text-sm">
          Ações, FIIs ou criptos? Adicione para a IA analisar sua carteira.
        </p>
      </div>

      {/* Add form — stacked on mobile */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ticker</Label>
            <Input
              value={newAsset.ticker}
              onChange={(e) => setNewAsset({ ...newAsset, ticker: e.target.value })}
              className="h-11 bg-black/40 border-white/10 rounded-xl font-bold uppercase text-sm"
              placeholder="Ex: PETR4"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</Label>
            <select
              value={newAsset.type}
              onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as "stock" | "fii" | "crypto" | "fixed_income" })}
              className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="stock" className="bg-slate-900">Ação</option>
              <option value="fii" className="bg-slate-900">FII</option>
              <option value="crypto" className="bg-slate-900">Cripto</option>
              <option value="fixed_income" className="bg-slate-900">Renda Fixa</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preço Médio (R$)</Label>
          <Input
            type="number"
            value={newAsset.averagePrice || ""}
            onChange={(e) => setNewAsset({ ...newAsset, averagePrice: Number(e.target.value) })}
            className="h-11 bg-black/40 border-white/10 rounded-xl font-bold text-sm"
            placeholder="0,00"
          />
        </div>
        <Button
          onClick={addAsset}
          className="w-full h-11 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 text-sm"
        >
          + Adicionar Ativo
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {investments.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold uppercase text-xs shrink-0">
                {asset.ticker.slice(0, 2)}
              </div>
              <div>
                <p className="font-black text-white text-sm uppercase">{asset.ticker}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  {asset.type} · PM: {formatCurrency(asset.averagePrice)}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeAsset(asset.id)}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {investments.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-slate-500 text-sm">Nenhum investimento adicionado.</p>
            <p className="text-slate-600 text-xs mt-1">Opcional — pode pular.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// STEP: Business
// ============================================================
const BusinessStep = ({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}) => {
  const [hasBusiness, setHasBusiness] = useState(!!profile.businessName || !!profile.businessSector);

  return (
    <div className="space-y-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Modo Empresarial</h2>
        <p className="text-slate-400 text-sm">Ative ferramentas exclusivas para PJ e MEI</p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          const newValue = !hasBusiness;
          setHasBusiness(newValue);
          if (newValue) {
            setProfile({ ...profile, businessName: "", businessSector: "" });
          } else {
            const { businessName: _bn, businessSector: _bs, businessCnpj: _bc, ...rest } = profile;
            void _bn; void _bs; void _bc;
            setProfile(rest as UserProfile);
          }
        }}
        onKeyDown={(e) => e.key === "Enter" && setHasBusiness(!hasBusiness)}
        className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-center cursor-pointer
          ${hasBusiness
            ? "bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/20"
            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
          }`}
      >
        <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center
          ${hasBusiness ? "bg-indigo-500 shadow-lg shadow-indigo-500/50" : "bg-white/10"}`}>
          <Building2 size={28} className={hasBusiness ? "text-white" : "text-slate-500"} />
        </div>
        <h3 className={`text-lg font-bold mb-1 ${hasBusiness ? "text-white" : "text-slate-300"}`}>
          Eu tenho uma empresa
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Separe finanças pessoais das empresariais.
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="space-y-1">
              <Label className="pl-1 text-xs font-bold text-indigo-300 uppercase tracking-widest">Nome da Empresa</Label>
              <Input
                value={profile.businessName || ""}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                placeholder="Ex: Minha Loja Ltda"
                className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-medium"
              />
            </div>
            <div className="space-y-1">
              <Label className="pl-1 text-xs font-bold text-indigo-300 uppercase tracking-widest">Ramo de Atividade</Label>
              <Input
                value={profile.businessSector || ""}
                onChange={(e) => setProfile({ ...profile, businessSector: e.target.value })}
                placeholder="Ex: Varejo, Tecnologia, Serviços..."
                className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-medium"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// STEP: Budgets
// ============================================================
const BudgetsStep = ({
  budgets,
  setBudgets,
  income,
}: {
  budgets: OnboardingBudget[];
  setBudgets: (b: OnboardingBudget[]) => void;
  income: number;
}) => {
  const totalPercent = budgets.filter((b) => b.enabled).reduce((s, b) => s + b.percentage, 0);

  const updateBudget = (index: number, updates: Partial<OnboardingBudget>) => {
    const newBudgets = [...budgets];
    newBudgets[index] = { ...newBudgets[index], ...updates } as OnboardingBudget;
    if (updates.percentage !== undefined) {
      newBudgets[index].amount = Math.round((updates.percentage / 100) * income);
    }
    setBudgets(newBudgets);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Orçamentos</h2>
        <p className="text-slate-400 text-sm">Baseado no método 50/30/20</p>
      </div>

      {/* Total indicator */}
      <div className={`p-3 rounded-xl flex justify-between items-center border
        ${totalPercent > 100
          ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
          : totalPercent === 100
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
        }`}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="animate-pulse" />
          <span className="font-bold text-sm">Alocação Total</span>
        </div>
        <span className="text-xl font-black">{totalPercent}%</span>
      </div>

      {/* Budget list */}
      <div className="space-y-2">
        {budgets.map((budget, i) => (
          <div
            key={budget.category}
            className={`p-4 rounded-xl border transition-all
              ${budget.enabled ? "bg-white/5 border-white/5" : "opacity-40 border-transparent"}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Switch
                checked={budget.enabled}
                onCheckedChange={(v) => updateBudget(i, { enabled: v })}
              />
              <div className="flex-1 flex justify-between items-center">
                <span className="font-bold text-white text-sm">{budget.category}</span>
                <span className="text-indigo-400 font-bold text-sm">{formatCurrency(budget.amount)}</span>
              </div>
            </div>
            {budget.enabled && (
              <div className="pl-11">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1.5">
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
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// STEP: Goals
// ============================================================
const GoalsStep = ({
  goals,
  setGoals,
}: {
  goals: OnboardingGoal[];
  setGoals: (g: OnboardingGoal[]) => void;
}) => {
  const toggleGoal = (index: number) => {
    const newGoals = [...goals];
    if (!newGoals[index]) return;
    newGoals[index] = { ...newGoals[index], enabled: !newGoals[index].enabled } as OnboardingGoal;
    setGoals(newGoals);
  };

  const updateGoal = (index: number, amount: number) => {
    const newGoals = [...goals];
    if (!newGoals[index]) return;
    newGoals[index] = { ...newGoals[index], targetAmount: amount } as OnboardingGoal;
    setGoals(newGoals);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Suas Metas</h2>
        <p className="text-slate-400 text-sm">O que você quer conquistar esse ano?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal, i) => (
          <motion.div
            layout
            key={goal.name}
            onClick={() => toggleGoal(i)}
            className={`relative p-4 rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer
              ${goal.enabled
                ? "bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl">{goal.icon}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                ${goal.enabled ? "bg-indigo-500 border-indigo-500" : "border-slate-600"}`}>
                {goal.enabled && <Check size={11} className="text-white" strokeWidth={4} />}
              </div>
            </div>
            <p className={`font-bold text-xs leading-tight mb-2 ${goal.enabled ? "text-white" : "text-slate-300"}`}>
              {goal.name}
            </p>
            <AnimatePresence>
              {goal.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    type="number"
                    value={goal.targetAmount}
                    onChange={(e) => updateGoal(i, Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 bg-black/20 border-white/10 text-white rounded-lg text-xs"
                    placeholder="R$ 0"
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

// ============================================================
// STEP: Reminders
// ============================================================
const RemindersStep = ({
  reminders,
  setReminders,
}: {
  reminders: OnboardingReminder[];
  setReminders: (r: OnboardingReminder[]) => void;
}) => {
  const toggleReminder = (index: number) => {
    const newReminders = [...reminders];
    if (!newReminders[index]) return;
    newReminders[index] = {
      ...newReminders[index],
      enabled: !newReminders[index].enabled,
    } as OnboardingReminder;
    setReminders(newReminders);
  };

  const updateReminder = (index: number, amount: number) => {
    const newReminders = [...reminders];
    if (!newReminders[index]) return;
    newReminders[index] = { ...newReminders[index], amount } as OnboardingReminder;
    setReminders(newReminders);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Contas Fixas</h2>
        <p className="text-slate-400 text-sm">Lembretes automáticos para não pagar juros.</p>
      </div>

      <div className="space-y-2">
        {reminders.map((reminder, i) => (
          <div
            key={reminder.name}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
              ${reminder.enabled ? "bg-white/10 border-indigo-500/30" : "bg-white/5 border-white/5"}`}
          >
            <Switch
              checked={reminder.enabled}
              onCheckedChange={() => toggleReminder(i)}
            />
            <div className="flex-1 min-w-0">
              <span className={`font-bold text-sm block truncate ${reminder.enabled ? "text-white" : "text-slate-400"}`}>
                {reminder.name}
              </span>
              <span className="text-[10px] text-slate-500">Dia {reminder.dueDay}</span>
            </div>
            {reminder.enabled && (
              <div className="relative w-24 shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-400">R$</span>
                <Input
                  type="number"
                  value={reminder.amount || ""}
                  onChange={(e) => updateReminder(i, Number(e.target.value))}
                  className="h-9 pl-6 bg-black/20 border-white/10 text-white rounded-lg text-right text-xs font-medium"
                  placeholder="Valor"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// STEP: Preferences
// ============================================================
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
      desc: "Pontuação de saúde financeira",
      icon: <Target className="text-emerald-400" size={18} />,
    },
    {
      key: "showPredictions",
      label: "Previsões IA",
      desc: "Previsões inteligentes de gastos",
      icon: <Brain className="text-purple-400" size={18} />,
    },
    {
      key: "weeklyReport",
      label: "Relatório Semanal",
      desc: "Resumo semanal das finanças",
      icon: <TrendingUp className="text-indigo-400" size={18} />,
    },
    {
      key: "alerts",
      label: "Alertas Inteligentes",
      desc: "Notificações de gastos excessivos",
      icon: <Bell className="text-amber-400" size={18} />,
    },
  ];

  return (
    <div className="space-y-4 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Preferências</h2>
        <p className="text-slate-400 text-sm">Personalize sua experiência com a IA</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map(({ key, label, desc, icon }) => (
          <div
            key={key}
            className={`p-4 rounded-xl border flex items-center gap-3 transition-all
              ${(preferences as Record<string, boolean>)[key]
                ? "bg-white/10 border-indigo-500/30"
                : "bg-white/5 border-white/5"
              }`}
          >
            <div className="p-2 rounded-lg bg-white/5 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${(preferences as Record<string, boolean>)[key] ? "text-white" : "text-slate-300"}`}>
                {label}
              </p>
              <p className="text-xs text-slate-500 leading-snug">{desc}</p>
            </div>
            <Switch
              checked={(preferences as Record<string, boolean>)[key]}
              onCheckedChange={(v) => setPreferences({ ...preferences, [key]: v })}
              className="data-[state=checked]:bg-indigo-500 shrink-0"
            />
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <Check className="text-white" size={20} strokeWidth={3} />
          </div>
          <div>
            <p className="font-black text-white text-base tracking-tight">Tudo pronto!</p>
            <p className="text-xs text-slate-400">Sua vida financeira está prestes a mudar.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
