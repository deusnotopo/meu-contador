import os
import glob
import re

wizard_path = "d:/meu-contador/frontend/src/components/onboarding/OnboardingWizard.tsx"
with open(wizard_path, "r", encoding="utf-8") as f:
    wizard_text = f.read()

# Replace states
wizard_text = wizard_text.replace(
    'const { refreshUser, user } = useAuth();',
    'const { refreshUser, user } = useAuth();\n  const {\n    profile, setProfile, handleProfileChange,\n    budgets, goals, setGoals, reminders, setReminders,\n    investments, setInvestments, onboardingDebts, setOnboardingDebts,\n    pushGranted, setPushGranted, inviteEmail, setInviteEmail,\n    inviteSent, setInviteSent, preferences, setPreferences,\n    validationErrors, setValidationErrors, strategyRules,\n    saveDraft, clearDraft, loadedStep\n  } = useOnboarding();\n'
)

# Remove all individual useStates
wizard_text = re.sub(r'  // -- State: Profile --[\s\S]*?\}\);\n', '', wizard_text)
wizard_text = re.sub(r'  // -- State: Validation --\n  const \[validationErrors, setValidationErrors\] = useState<Record<string, string>>\(\{\}\);\n', '', wizard_text)
wizard_text = re.sub(r'  // -- State: Finance Data --\n  const \[budgets\] = useState<OnboardingBudget\[\]>\(budgetTemplates\.moderate \|\| \[\]\);\n  const \[goals, setGoals\] = useState<OnboardingGoal\[\]>\(goalPresets\);\n  const \[reminders, setReminders\] = useState<OnboardingReminder\[\]>\(commonBillReminders\);\n  const \[investments, setInvestments\] = useState<OnboardingInvestment\[\]>\(\[\]\);\n  const \[onboardingDebts, setOnboardingDebts\] = useState<OnboardingDebt\[\]>\(\[\]\);\n  const \[pushGranted, setPushGranted\] = useState\(false\);\n  const \[inviteEmail, setInviteEmail\] = useState\(\'\'\);\n  const \[inviteSent, setInviteSent\] = useState\(false\);\n  const \[preferences, setPreferences\] = useState\(\{\n    showScore: true,\n    showPredictions: true,\n    weeklyReport: true,\n    alerts: true,\n  \}\);\n', '', wizard_text)

# Remove strategyRules
wizard_text = re.sub(r'  const strategyRules = useStrategyRules\(\{[\s\S]*?\}\);\n', '', wizard_text)
wizard_text = re.sub(r'import { useStrategyRules } from "@/hooks/useStrategyRules";\n', '', wizard_text)
# Remove unused imports from wizard
wizard_text = wizard_text.replace('import {\n  commonBillReminders,\n  goalPresets,\n  budgetTemplates,\n} from "@/types/onboarding";\n', '')

# Remove helper handleProfileChange
wizard_text = re.sub(r'  // -- Helpers --\n  const handleProfileChange = \(field: keyof UserProfile \| ExpenseField, value: unknown\) => \{\n    setProfile\(prev => \(\{ \.\.\.prev, \[field\]: value \}\)\);\n  \};\n', '', wizard_text)

# Add saveDraft to paginate
wizard_text = wizard_text.replace(
    '  const paginate = (newDirection: number) => {\n',
    '  const paginate = (newDirection: number) => {\n'
)
wizard_text = wizard_text.replace(
    '    setDirection(newDirection);\n    setCurrentStep(nextStepIndex);\n  };',
    '    setDirection(newDirection);\n    setCurrentStep(nextStepIndex);\n    saveDraft(nextStepIndex);\n  };'
)

# Add loadedStep handling
wizard_text = wizard_text.replace(
    '  useEffect(() => {\n    stepHeadingRef.current?.focus();\n  }, [currentStep]);',
    '  useEffect(() => {\n    stepHeadingRef.current?.focus();\n  }, [currentStep]);\n\n  useEffect(() => {\n    if (loadedStep !== null && loadedStep > 0 && currentStep === 0) {\n      setCurrentStep(loadedStep);\n      showSuccess("Rascunho detectado! Retomamos de onde parou.");\n    }\n  }, [loadedStep]);'
)

# Add clearDraft to onComplete
wizard_text = wizard_text.replace('saveOnboarding(data);', 'saveOnboarding(data);\n      clearDraft();')

# Modify academySignal getAcademySignal usage, user?.id issue
# Let's remove the props from the step calls safely
steps = ["WelcomeStep", "IdentityStep", "BusinessStep", "IncomeStep", "BalanceStep", "ExpensesStep", "InvestmentsStep", "StrategyStep", "GoalsStep", "AutomationStep", "DebtsStep", "FireGoalStep", "SummaryStep"]
for step in steps:
    wizard_text = re.sub(r'<' + step + r' [^>]+>', '<' + step + ' />', wizard_text)

# Rename OnboardingWizard to OnboardingWizardInner
wizard_text = wizard_text.replace('export const OnboardingWizard = ({ onComplete, onSkip }: Props) => {', 'const OnboardingWizardInner = ({ onComplete, onSkip }: Props) => {')

wrapper = """
import { OnboardingProvider, useOnboarding } from './OnboardingContext';

export const OnboardingWizard = (props: Props) => (
  <OnboardingProvider>
    <OnboardingWizardInner {...props} />
  </OnboardingProvider>
);
"""
wizard_text = wizard_text + wrapper

with open(wizard_path, "w", encoding="utf-8") as f:
    f.write(wizard_text)


# Refactor steps!
steps_dir = "d:/meu-contador/frontend/src/components/onboarding/steps"
step_files = glob.glob(os.path.join(steps_dir, "*.tsx"))

for step_file in step_files:
    with open(step_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "import { useOnboarding }" not in content:
        content = 'import { useOnboarding } from "../OnboardingContext";\n' + content
        
    content = re.sub(r'import type \{ BaseStepProps \} from "\.\./types";\n?', '', content)
    content = re.sub(r'interface [A-Za-z]+Props \{[\s\S]*?\}\n\n', '', content)
    
    # Example: export const WelcomeStep = ({ profile, onChange, validationErrors }: BaseStepProps) => (
    match = re.search(r'export const ([A-Za-z]+) = \(\s*\{([^}]+)\}\s*(?:[:\w\s]+)?\)\s*=>\s*(\{|()|)', content)
    if match:
        step_name = match.group(1)
        props_str = match.group(2)
        has_brace = match.group(3) == '{'
        
        # Rename `onChange` to `handleProfileChange: onChange` and `onChange(x,y)` works out of the box because we alias it.
        props_clean = [p.strip() for p in props_str.split(',')]
        new_props = []
        for p in props_clean:
            if not p: continue
            if p == 'onChange': new_props.append('handleProfileChange: onChange')
            else: new_props.append(p)
            
        use_statement = '  const { ' + ', '.join(new_props) + ' } = useOnboarding();\n'

        signature_regex = r'export const ' + step_name + r'\s*=\s*\([^\)]+\)\s*=>\s*'
        
        if has_brace:
            replacement = f'export const {step_name} = () => {{\n{use_statement}'
            content = re.sub(signature_regex + r'\{', replacement, content)
        else:
            replacement = f'export const {step_name} = () => {{\n{use_statement}\n  return ('
            content = re.sub(signature_regex + r'\(', replacement, content)
            
            # Close the component properly
            last_idx = content.rfind(');')
            if last_idx != -1:
                content = content[:last_idx] + ');\n};\n' + content[last_idx+2:]
            else:
                last_idx = content.rfind(')')
                if last_idx != -1:
                    content = content[:last_idx] + ');\n};\n' + content[last_idx+1:]
        
    with open(step_file, "w", encoding="utf-8") as f:
        f.write(content)

print("Step refactoring complete.")
