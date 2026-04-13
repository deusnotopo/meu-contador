import re

with open("d:\\meu-contador\\frontend\\src\\components\\onboarding\\OnboardingWizard.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace top block
split_str = '// ----------------------------------------------------------------------------\n// Main Component\n// ----------------------------------------------------------------------------'

parts = text.split(split_str)
if len(parts) >= 2:
    start_text = parts[0]
    rest_text = split_str + parts[1]
else:
    print("Error splitting")
    exit(1)

new_start_block = """import { Button } from "@/components/ui/button";
import { applyOnboardingConfig, saveOnboarding } from "@/lib/onboarding";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { useStrategyRules } from "@/hooks/useStrategyRules";
import type {
  OnboardingBudget,
  OnboardingData,
  OnboardingGoal,
  OnboardingReminder,
  UserProfile,
  OnboardingInvestment,
  OnboardingDebt,
} from "@/types";
import {
  commonBillReminders,
  goalPresets,
} from "@/types/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";

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
import type { OnboardingProfile, ExpenseField, ExpenseKey, AcademySignal } from "./types";

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

"""

# Also strip the extra AcademySignal interface that was defined inline
# because we imported it!
rest_text = re.sub(
    r'// Dados para recomendação contextual da Academia\s*(?:export\s+)?interface AcademySignal \{\s*title: string;\s*reason: string;\s*emoji: string;\s*color: string;\s*\}\s*',
    '',
    rest_text
)

# Remove the bottom Sub-components block
sub_components_idx = rest_text.find('// ----------------------------------------------------------------------------\n// Sub-components')
if sub_components_idx != -1:
    rest_text = rest_text[:sub_components_idx]

# Assemble the file
final_text = new_start_block + rest_text

with open("d:\\meu-contador\\frontend\\src\\components\\onboarding\\OnboardingWizard.tsx", "w", encoding="utf-8") as f:
    f.write(final_text)

print("Done")
