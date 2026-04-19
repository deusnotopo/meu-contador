import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import type {
  OnboardingBudget,
  OnboardingGoal,
  OnboardingReminder,
  UserProfile,
  OnboardingInvestment,
  OnboardingDebt,
} from "@/types";
import { commonBillReminders, goalPresets, budgetTemplates } from "@/types/onboarding";
import { useStrategyRules } from "@/hooks/useStrategyRules";
import type { OnboardingProfile, ExpenseField } from "./types";

const ensureDebtIds = (debts: OnboardingDebt[] = []): OnboardingDebt[] =>
  debts.map((debt, index) => ({
    ...debt,
    id: debt.id || `debt_${index}_${Math.random().toString(36).slice(2, 8)}`,
  }));

interface OnboardingContextProps {
  profile: OnboardingProfile;
  setProfile: React.Dispatch<React.SetStateAction<OnboardingProfile>>;
  handleProfileChange: (field: keyof UserProfile | ExpenseField, value: unknown) => void;
  
  budgets: OnboardingBudget[];
  setBudgets: React.Dispatch<React.SetStateAction<OnboardingBudget[]>>;
  
  goals: OnboardingGoal[];
  setGoals: React.Dispatch<React.SetStateAction<OnboardingGoal[]>>;
  
  reminders: OnboardingReminder[];
  setReminders: React.Dispatch<React.SetStateAction<OnboardingReminder[]>>;
  
  investments: OnboardingInvestment[];
  setInvestments: React.Dispatch<React.SetStateAction<OnboardingInvestment[]>>;
  
  onboardingDebts: OnboardingDebt[];
  setOnboardingDebts: React.Dispatch<React.SetStateAction<OnboardingDebt[]>>;
  
  pushGranted: boolean;
  setPushGranted: React.Dispatch<React.SetStateAction<boolean>>;
  
  inviteEmail: string;
  setInviteEmail: React.Dispatch<React.SetStateAction<string>>;
  
  inviteSent: boolean;
  setInviteSent: React.Dispatch<React.SetStateAction<boolean>>;
  
  preferences: {
    showScore: boolean;
    showPredictions: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  };
  setPreferences: React.Dispatch<React.SetStateAction<{
    showScore: boolean;
    showPredictions: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  }>>;
  
  validationErrors: Record<string, string>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  
  strategyRules: ReturnType<typeof useStrategyRules>;
  
  saveDraft: (currentStep: number) => void;
  clearDraft: () => void;
  loadedStep: number | null;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedStep, setLoadedStep] = useState<number | null>(null);

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

  const [budgets, setBudgets] = useState<OnboardingBudget[]>(budgetTemplates.moderate || []);
  const [goals, setGoals] = useState<OnboardingGoal[]>(goalPresets);
  const [reminders, setReminders] = useState<OnboardingReminder[]>(commonBillReminders);
  const [investments, setInvestments] = useState<OnboardingInvestment[]>([]);
  const [onboardingDebts, setOnboardingDebts] = useState<OnboardingDebt[]>([]);
  const [pushGranted, setPushGranted] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [preferences, setPreferences] = useState({
    showScore: true,
    showPredictions: true,
    weeklyReport: true,
    alerts: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const strategyRules = useStrategyRules({
    monthlyIncome: profile.monthlyIncome,
    hasDebts: profile.hasDebts,
    riskProfile: profile.riskProfile,
    employmentType: profile.employmentType,
    dependents: profile.dependents,
    age: profile.age,
  });

  const handleProfileChange = useCallback((field: keyof UserProfile | ExpenseField, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  // Carregar rascunho (Draft)
  useEffect(() => {
    const draftJson = localStorage.getItem("ONBOARDING_DRAFT");
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        if (draft.profile) setProfile(draft.profile);
        if (draft.budgets) setBudgets(draft.budgets);
        if (draft.goals) setGoals(draft.goals);
        if (draft.reminders) setReminders(draft.reminders);
        if (draft.investments) setInvestments(draft.investments);
        if (draft.onboardingDebts) setOnboardingDebts(ensureDebtIds(draft.onboardingDebts));
        if (draft.preferences) setPreferences(draft.preferences);
        
        // Retomar passo logado
        if (typeof draft.currentStep === 'number') {
          setLoadedStep(draft.currentStep);
        }
      } catch (err) {
        import("@/services/ErrorService").then(({ ErrorService }) => {
          ErrorService.log(err, "OnboardingContext:draft");
        });
      }
    }
    setIsLoaded(true);
  }, []);

  const saveDraft = useCallback((currentStep: number) => {
    const draft = {
      currentStep,
      profile,
      budgets,
      goals,
      reminders,
      investments,
      onboardingDebts,
      preferences,
    };
    localStorage.setItem("ONBOARDING_DRAFT", JSON.stringify(draft));
  }, [profile, budgets, goals, reminders, investments, onboardingDebts, preferences]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem("ONBOARDING_DRAFT");
  }, []);

  if (!isLoaded) return null; // Avoid rendering until draft is loaded

  const contextValue = useMemo(() => ({
    profile, setProfile, handleProfileChange,
    budgets, setBudgets,
    goals, setGoals,
    reminders, setReminders,
    investments, setInvestments,
    onboardingDebts, setOnboardingDebts,
    pushGranted, setPushGranted,
    inviteEmail, setInviteEmail,
    inviteSent, setInviteSent,
    preferences, setPreferences,
    validationErrors, setValidationErrors,
    strategyRules,
    saveDraft,
    clearDraft,
    loadedStep
  }), [
    profile, handleProfileChange,
    budgets,
    goals,
    reminders,
    investments,
    onboardingDebts,
    pushGranted,
    inviteEmail,
    inviteSent,
    preferences,
    validationErrors,
    strategyRules,
    saveDraft,
    clearDraft,
    loadedStep
  ]);

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding requires an OnboardingProvider");
  }
  return context;
};
