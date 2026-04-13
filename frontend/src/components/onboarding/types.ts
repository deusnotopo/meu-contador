import type { LucideIcon } from "lucide-react";
import type { UserProfile } from "@/types";

export type ExpenseKey =
  | "housing"
  | "food"
  | "transport"
  | "health"
  | "education"
  | "leisure"
  | "subscriptions"
  | "shopping";

export type ExpenseField = `expense_${ExpenseKey}`;
export type OnboardingProfile = UserProfile & Partial<Record<ExpenseField, number>>;

export interface AcademySignal {
  title: string;
  reason: string;
  emoji: string;
  color: string;
}

export interface FeatureCardProps {
  icon: LucideIcon;
  label: string;
}

export interface SelectCardProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  sub: string;
}

export interface StrategyRowProps {
  color: string;
  label: string;
  sub: string;
  val: string;
}

export interface SummaryItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export type OnboardingChangeHandler = (
  field: keyof UserProfile | ExpenseField,
  value: unknown,
) => void;

export interface ExpensesStepProps {
  profile: OnboardingProfile;
  onChange: OnboardingChangeHandler;
}
