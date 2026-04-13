with open("d:\\meu-contador\\frontend\\src\\components\\onboarding\\OnboardingWizard.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_imports = """import { BalanceStep } from "./steps/BalanceStep";
import { BusinessStep } from "./steps/BusinessStep";
import { IdentityStep } from "./steps/IdentityStep";
import { IncomeStep } from "./steps/IncomeStep";
import { WelcomeStep } from "./steps/WelcomeStep";"""

new_imports = """import { BalanceStep } from "./steps/BalanceStep";
import { BusinessStep } from "./steps/BusinessStep";
import { IdentityStep } from "./steps/IdentityStep";
import { IncomeStep } from "./steps/IncomeStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ExpensesStep } from "./steps/ExpensesStep";
import { InvestmentsStep } from "./steps/InvestmentsStep";
import { StrategyStep } from "./steps/StrategyStep";
import { GoalsStep } from "./steps/GoalsStep";
import { AutomationStep } from "./steps/AutomationStep";
import { DebtsStep } from "./steps/DebtsStep";
import { FireGoalStep } from "./steps/FireGoalStep";
import { SummaryStep } from "./steps/SummaryStep";"""

text = text.replace(old_imports, new_imports)

start_idx = text.find('case "expenses":', text.find('function renderStep('))
end_idx = text.find('default:', start_idx)

new_cases_block = """case "expenses":
      return <ExpensesStep profile={profile} onChange={onChange} />;

    case "investments":
      return <InvestmentsStep profile={profile} onChange={onChange} investments={investments} setInvestments={setInvestments} />;

    case "strategy":
      return <StrategyStep profile={profile} strategyRules={strategyRules} />;

    case "goals":
      return <GoalsStep goals={goals} setGoals={setGoals} />;

    case "automation":
      return <AutomationStep profile={profile} reminders={reminders} setReminders={setReminders} pushGranted={pushGranted} setPushGranted={setPushGranted} preferences={preferences} setPreferences={setPreferences} strategyRules={strategyRules} />;

    case "debts":
      return <DebtsStep onboardingDebts={onboardingDebts} setOnboardingDebts={setOnboardingDebts} validationErrors={validationErrors} />;

    case "fire_goal":
      return <FireGoalStep profile={profile} onChange={onChange} validationErrors={validationErrors} />;

    case "summary":
      return <SummaryStep profile={profile} strategyRules={strategyRules} academySignal={academySignal} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteSent={inviteSent} setInviteSent={setInviteSent} currentWorkspaceId={currentWorkspaceId} userId={userId} userUid={userUid} />;

    """

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_cases_block + text[end_idx:]

with open("d:\\meu-contador\\frontend\\src\\components\\onboarding\\OnboardingWizard.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Done")
