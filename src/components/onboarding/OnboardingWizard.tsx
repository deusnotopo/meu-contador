import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  { id: "welcome", title: "Bem-vindo", icon: Sparkles },
  { id: "profile", title: "Seu Perfil", icon: Wallet },
  { id: "balance", title: "Seu Saldo", icon: Wallet },
  { id: "expenses", title: "Gastos", icon: TrendingUp },
  { id: "business", title: "Empresa", icon: Building2 },
  { id: "budgets", title: "Orçamentos", icon: Target },
  { id: "goals", title: "Metas", icon: TrendingUp },
  { id: "reminders", title: "Lembretes", icon: Bell },
  { id: "preferences", title: "Preferências", icon: Settings },
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

export const OnboardingWizard = ({ onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
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
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveOnboarding(data);
    applyOnboardingConfig(data);
    showSuccess(
      `Bem-vindo, ${profile.name}! Suas configurações foram aplicadas.`
    );
    onComplete();
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "welcome":
        return <WelcomeStep profile={profile} onChange={handleProfileChange} />;
      case "profile":
        return <ProfileStep profile={profile} onChange={handleProfileChange} />;
      case "balance":
        return <BalanceStep profile={profile} onChange={handleProfileChange} />;
      case "expenses":
        return (
          <ExpensesStep
            expenses={historicalExpenses}
            setExpenses={setHistoricalExpenses}
          />
        );
      case "business":
        return <BusinessStep profile={profile} setProfile={setProfile} />;
      case "budgets":
        return (
          <BudgetsStep
            budgets={budgets}
            setBudgets={setBudgets}
            income={profile.monthlyIncome}
          />
        );
      case "goals":
        return <GoalsStep goals={goals} setGoals={setGoals} />;
      case "reminders":
        return (
          <RemindersStep reminders={reminders} setReminders={setReminders} />
        );
      case "preferences":
        return (
          <PreferencesStep
            preferences={preferences}
            setPreferences={setPreferences}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] overflow-auto">
      <div className="hero-glow" />
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        {/* Header */}
        <div className="w-full max-w-2xl mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 gradient-premium rounded-2xl shadow-premium">
                <Crown className="text-white fill-white" size={24} />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tighter text-white glow-text">
                  Meu Contador
                </span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Sua Jornada Premium
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">
                Progresso
              </span>
              <span className="text-lg font-black text-white">
                {currentStep + 1} / {STEPS.length}
              </span>
            </div>
          </div>

          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-8">
            <div
              className="h-full gradient-premium transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Premium Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                    ${
                      isComplete
                        ? "bg-success/20 text-success border border-success/30"
                        : ""
                    }
                    ${
                      isActive
                        ? "gradient-premium text-white scale-110 shadow-premium"
                        : ""
                    }
                    ${
                      !isActive && !isComplete
                        ? "bg-white/5 text-slate-600 border border-white/5"
                        : ""
                    }
                  `}
                  >
                    {isComplete ? (
                      <Check size={20} className="font-black" />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? "text-primary" : "text-slate-600"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="w-full max-w-2xl glass-panel border-none shadow-premium rounded-[3rem] overflow-hidden">
          <CardContent className="p-10 md:p-14">
            <div className="animate-fade-in">{renderStep()}</div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="w-full max-w-2xl flex justify-between mt-10">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-3 h-16 px-10 rounded-2xl font-black text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
          >
            <ArrowLeft size={20} />
            VOLTAR
          </Button>
          <Button
            onClick={nextStep}
            className="gap-3 h-16 px-12 rounded-2xl font-black bg-white text-indigo-950 hover:bg-indigo-50 shadow-premium border-0"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                CONCLUIR E LIBERAR
                <Check size={20} />
              </>
            ) : (
              <>
                PRÓXIMO PASSO
                <ArrowRight size={20} />
              </>
            )}
          </Button>
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
  <div className="text-center space-y-6">
    <div className="w-20 h-20 mx-auto gradient-primary rounded-2xl flex items-center justify-center">
      <Sparkles className="text-primary-foreground" size={40} />
    </div>
    <div>
      <h2 className="text-2xl md:text-3xl font-bold">
        Bem-vindo ao Meu Contador!
      </h2>
      <p className="text-muted-foreground mt-2">
        O gestor financeiro mais inteligente do mercado. Vamos configurar tudo
        para você em apenas alguns passos.
      </p>
    </div>
    <div className="max-w-sm mx-auto space-y-4 text-left">
      <div>
        <Label className="font-semibold">Como podemos te chamar?</Label>
        <Input
          value={profile.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Seu nome"
          className="mt-1"
        />
      </div>
    </div>
    <div className="flex flex-wrap justify-center gap-3 pt-4">
      {[
        { icon: Zap, text: "Configuração em 2 min" },
        { icon: Brain, text: "IA Personalizada" },
        { icon: Shield, text: "Dados Seguros" },
      ].map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full text-sm"
        >
          <Icon size={16} className="text-primary" />
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
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Seu Perfil Financeiro</h2>
      <p className="text-muted-foreground">
        Isso nos ajuda a personalizar suas recomendações
      </p>
    </div>

    <div className="space-y-4">
      <div>
        <Label className="font-semibold">Renda Mensal Aproximada</Label>
        <div className="mt-2">
          <div className="text-3xl font-bold text-primary mb-2">
            {formatCurrency(profile.monthlyIncome)}
          </div>
          <Slider
            value={[profile.monthlyIncome]}
            onValueChange={([v]) => onChange("monthlyIncome", v)}
            min={1000}
            max={50000}
            step={500}
            className="mt-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>R$ 1.000</span>
            <span>R$ 50.000</span>
          </div>
        </div>
      </div>

      <div>
        <Label className="font-semibold">
          Qual seu principal objetivo financeiro?
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {Object.entries(financialGoalTemplates).map(
            ([key, { name, icon }]) => (
              <button
                key={key}
                onClick={() => onChange("financialGoal", key)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  profile.financialGoal === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-xs font-medium mt-1">{name}</p>
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <Label className="font-semibold">Perfil de Gastos</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            {
              key: "conservative",
              label: "Econômico",
              desc: "Foco em economizar",
            },
            { key: "moderate", label: "Equilibrado", desc: "Equilíbrio ideal" },
            { key: "aggressive", label: "Investidor", desc: "Máxima economia" },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => onChange("riskProfile", key)}
              className={`p-3 rounded-xl border-2 transition-all ${
                profile.riskProfile === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 rounded-xl border">
          <span className="text-sm font-medium">
            Tem reserva de emergência?
          </span>
          <Switch
            checked={profile.hasEmergencyFund}
            onCheckedChange={(v) => onChange("hasEmergencyFund", v)}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl border">
          <span className="text-sm font-medium">Possui dívidas ativas?</span>
          <Switch
            checked={profile.hasDebts}
            onCheckedChange={(v) => onChange("hasDebts", v)}
          />
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Seus Orçamentos</h2>
        <p className="text-muted-foreground">
          Ajustamos automaticamente baseado no seu perfil. Personalize se
          quiser!
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <span>Total alocado</span>
        <span
          className={`font-bold ${
            totalPercent > 100 ? "text-danger" : "text-success"
          }`}
        >
          {totalPercent}%
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {budgets.map((budget, i) => (
          <div
            key={budget.category}
            className="flex items-center gap-3 p-3 rounded-xl border"
          >
            <Switch
              checked={budget.enabled}
              onCheckedChange={(v) => updateBudget(i, { enabled: v })}
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{budget.category}</span>
                <span className="text-xs text-muted-foreground">
                  {budget.percentage}%
                </span>
              </div>
              <Slider
                value={[budget.percentage]}
                onValueChange={([v]) => updateBudget(i, { percentage: v })}
                min={0}
                max={50}
                step={1}
                disabled={!budget.enabled}
                className="mt-2"
              />
              <div className="text-right text-sm font-semibold text-primary mt-1">
                {formatCurrency(budget.amount)}
              </div>
            </div>
          </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Suas Metas</h2>
        <p className="text-muted-foreground">
          Selecione as metas que você quer alcançar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {goals.map((goal, i) => (
          <button
            key={goal.name}
            onClick={() => toggleGoal(i)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              goal.enabled
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{goal.icon}</span>
              {goal.enabled && <Check size={18} className="text-primary" />}
            </div>
            <p className="font-semibold text-sm mt-2">{goal.name}</p>
            {goal.enabled && (
              <div className="mt-2">
                <Input
                  type="number"
                  value={goal.targetAmount}
                  onChange={(e) => updateGoal(i, Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 text-sm"
                  placeholder="Valor alvo"
                />
              </div>
            )}
          </button>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lembretes de Contas</h2>
        <p className="text-muted-foreground">
          Nunca mais esqueça uma conta! Selecione suas contas recorrentes.
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {reminders.map((reminder, i) => (
          <div
            key={reminder.name}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              reminder.enabled ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Switch
              checked={reminder.enabled}
              onCheckedChange={() => toggleReminder(i)}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{reminder.name}</span>
                <span className="text-xs text-muted-foreground">
                  Dia {reminder.dueDay}
                </span>
              </div>
            </div>
            {reminder.enabled && (
              <Input
                type="number"
                value={reminder.amount || ""}
                onChange={(e) => updateReminder(i, Number(e.target.value))}
                className="w-28 h-8"
                placeholder="Valor"
              />
            )}
          </div>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Saldo Inicial</h2>
        <p className="text-muted-foreground">
          Quanto você tem disponível hoje (contas e dinheiro)?
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-lg">Total em Caixa</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary">
              R$
            </span>
            <Input
              type="number"
              value={profile.initialBalance || ""}
              onChange={(e) =>
                onChange("initialBalance", Number(e.target.value))
              }
              className="pl-14 h-16 text-2xl font-black rounded-2xl"
              placeholder="0,00"
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Este valor será usado como saldo inicial no seu dashboard.
          </p>
        </div>
      </div>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Perfil da Empresa</h2>
        <p className="text-muted-foreground">
          Deseja gerenciar também suas finanças empresariais?
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <p className="font-semibold text-lg">Área Empresarial</p>
              <p className="text-sm text-muted-foreground">
                Separar finanças PJ de PF
              </p>
            </div>
          </div>
          <Switch
            checked={hasBusiness}
            onCheckedChange={(v) => {
              setHasBusiness(v);
              if (v) {
                setProfile({
                  ...profile,
                  businessProfile: { name: "", sector: "" },
                });
              } else {
                const { businessProfile, ...rest } = profile;
                setProfile(rest as UserProfile);
              }
            }}
          />
        </div>

        {hasBusiness && (
          <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
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
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Ramo de Atividade</Label>
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
                placeholder="Ex: Comércio, TI, Consultoria"
                className="rounded-xl h-12"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PreferencesType {
  showScore: boolean;
  showPredictions: boolean;
  weeklyReport: boolean;
  alerts: boolean;
}

const PreferencesStep = ({
  preferences,
  setPreferences,
}: {
  preferences: PreferencesType;
  setPreferences: (p: PreferencesType) => void;
}) => {
  const items = [
    {
      key: "showScore",
      label: "Score Financeiro",
      desc: "Exibir sua pontuação de saúde financeira",
      icon: "📊",
    },
    {
      key: "showPredictions",
      label: "Previsões IA",
      desc: "Previsões inteligentes de gastos futuros",
      icon: "🔮",
    },
    {
      key: "weeklyReport",
      label: "Relatório Semanal",
      desc: "Resumo semanal das suas finanças",
      icon: "📈",
    },
    {
      key: "alerts",
      label: "Alertas Inteligentes",
      desc: "Notificações sobre gastos excessivos",
      icon: "🔔",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Preferências</h2>
        <p className="text-muted-foreground">Personalize sua experiência</p>
      </div>

      <div className="space-y-3">
        {items.map(({ key, label, desc, icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-xl border"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Switch
              checked={preferences[key as keyof PreferencesType]}
              onCheckedChange={(v) =>
                setPreferences({ ...preferences, [key]: v })
              }
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <Sparkles className="text-primary" size={24} />
          <div>
            <p className="font-semibold">Tudo pronto!</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Concluir" para começar a usar o Meu Contador com todas
              as suas configurações.
            </p>
          </div>
        </div>
      </div>
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
