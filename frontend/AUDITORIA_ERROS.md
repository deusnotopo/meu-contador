# AUDITORIA DE ERROS - Projeto meu-contador (frontend)

**Data:** 2026-04-17
**Diretório:** D:\meu-contador\frontend

---

## RESUMO EXECUTIVO

| Métrica            | Total |
| ------------------ | ----- |
| Erros TypeScript   | 83    |
| Erros ESLint       | 1     |
| Warnings ESLint    | 70    |
| Erros de Build     | 0     |
| Total de problemas | 154   |

---

## ERROS TYPESCRIPT (tsc --noEmit)

### CRÍTICOS

**Arquivo:** `src/components/onboarding/steps/AutomationStep.tsx`

- **Linha 11:** TS2304 - Cannot find name 'AutomationStepProps'
- **Linha 20:** TS7006 - Parameter 'r' implicitly has an 'any' type
- **Linha 20:** TS7006 - Parameter 'i' implicitly has an 'any' type
- **Linha 181:** TS7006 - Parameter 'prev' implicitly has an 'any' type

**Arquivo:** `src/components/onboarding/steps/DebtsStep.tsx`

- **Linha 5:** TS2304 - Cannot find name 'DebtsStepProps'
- **Linha 17:** TS7006 - Parameter 'debt' implicitly has an 'any' type
- **Linha 17:** TS7006 - Parameter 'i' implicitly has an 'any' type
- **Linha 23:** TS7006 - Parameter 'prev' implicitly has an 'any' type
- **Linha 23:** TS7006 - Parameter '\_' implicitly has an 'any' type
- **Linha 23:** TS7006 - Parameter 'idx' implicitly has an 'any' type
- **Linha 96:** TS7006 - Parameter 'prev' implicitly has an 'any' type

**Arquivo:** `src/components/onboarding/steps/ExpensesStep.tsx`

- **Linha 8:** TS2304 - Cannot find name 'ExpensesStepProps'

**Arquivo:** `src/components/onboarding/steps/FireGoalStep.tsx`

- **Linha 9:** TS2304 - Cannot find name 'FireGoalStepProps'

**Arquivo:** `src/components/onboarding/steps/GoalsStep.tsx`

- **Linha 5:** TS2304 - Cannot find name 'GoalsStepProps'
- **Linha 13:** TS7006 - Parameter 'g' implicitly has an 'any' type
- **Linha 13:** TS7006 - Parameter 'i' implicitly has an 'any' type

**Arquivo:** `src/components/onboarding/steps/InvestmentsStep.tsx`

- **Linha 9:** TS2304 - Cannot find name 'InvestmentsStepProps'
- **Linha 62:** TS7006 - Parameter 'sum' implicitly has an 'any' type
- **Linha 62:** TS7006 - Parameter 'investment' implicitly has an 'any' type
- **Linha 70:** TS7006 - Parameter 'investment' implicitly has an 'any' type
- **Linha 70:** TS7006 - Parameter 'index' implicitly has an 'any' type
- **Linha 76:** TS7006 - Parameter 'prev' implicitly has an 'any' type
- **Linha 76:** TS7006 - Parameter 'item' implicitly has an 'any' type
- **Linha 87:** TS7006 - Parameter 'prev' implicitly has an 'any' type
- **Linha 87:** TS7006 - Parameter 'item' implicitly has an 'any' type
- **Linha 92:** TS7006 - Parameter 'prev' implicitly has an 'any' type
- **Linha 92:** TS7006 - Parameter 'item' implicitly has an 'any' type
- **Linha 105:** TS7006 - Parameter 'prev' implicitly has an 'any' type
- **Linha 105:** TS7006 - Parameter 'item' implicitly has an 'any' type
- **Linha 113:** TS7006 - Parameter 'prev' implicitly has an 'any' type
- **Linha 113:** TS7006 - Parameter 'item' implicitly has an 'any' type
- **Linha 123:** TS7006 - Parameter 'prev' implicitly has an 'any' type

**Arquivo:** `src/components/onboarding/steps/StrategyStep.tsx`

- **Linha 8:** TS2304 - Cannot find name 'StrategyStepProps'
- **Linha 41:** TS7006 - Parameter 'entry' implicitly has an 'any' type
- **Linha 41:** TS7006 - Parameter 'index' implicitly has an 'any' type

**Arquivo:** `src/components/onboarding/steps/SummaryStep.tsx`

- **Linha 13:** TS2304 - Cannot find name 'SummaryStepProps'

### ALTO

**Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`

- **Linha 7:** TS6196 - 'OnboardingBudget' is declared but never used
- **Linha 9:** TS6196 - 'OnboardingGoal' is declared but never used
- **Linha 10:** TS6196 - 'OnboardingReminder' is declared but never used
- **Linha 11:** TS6196 - 'UserProfile' is declared but never used
- **Linha 12:** TS6196 - 'OnboardingInvestment' is declared but never used
- **Linha 38:** TS6196 - 'ExpenseField' is declared but never used
- **Linha 109:** TS6133 - 'user' is declared but its value is never read
- **Linha 111:** TS6133 - 'setProfile' is declared but its value is never read
- **Linha 111:** TS6133 - 'handleProfileChange' is declared but its value is never read
- **Linha 112:** TS6133 - 'setGoals' is declared but its value is never read
- **Linha 112:** TS6133 - 'setReminders' is declared but its value is never read
- **Linha 113:** TS6133 - 'setInvestments' is declared but its value is never read
- **Linha 113:** TS6133 - 'setOnboardingDebts' is declared but its value is never read
- **Linha 114:** TS6133 - 'pushGranted' is declared but its value is never read
- **Linha 114:** TS6133 - 'setPushGranted' is declared but its value is never read
- **Linha 114:** TS6133 - 'inviteEmail' is declared but its value is never read
- **Linha 114:** TS6133 - 'setInviteEmail' is declared but its value is never read
- **Linha 115:** TS6133 - 'inviteSent' is declared but its value is never read
- **Linha 115:** TS6133 - 'setInviteSent' is declared but its value is never read
- **Linha 115:** TS6133 - 'setPreferences' is declared but its value is never read
- **Linha 116:** TS6133 - 'validationErrors' is declared but its value is never read
- **Linha 116:** TS6133 - 'strategyRules' is declared but its value is never read
- **Linha 296:** TS6133 - 'academySignal' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/AutomationStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 5:** TS6133 - 'OnboardingReminder' is declared but its value is never read
- **Linha 6:** TS6133 - 'OnboardingProfile' is declared but its value is never read
- **Linha 7:** TS6133 - 'useStrategyRules' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/DebtsStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 3:** TS6133 - 'OnboardingDebt' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/ExpensesStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 5:** TS6196 - 'ExpenseField' is declared but never used
- **Linha 5:** TS6196 - 'OnboardingProfile' is declared but never used
- **Linha 6:** TS6133 - 'UserProfile' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/FireGoalStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 6:** TS6192 - All imports in import declaration are unused
- **Linha 7:** TS6133 - 'UserProfile' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/GoalsStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 3:** TS6133 - 'OnboardingGoal' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/InvestmentsStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 6:** TS6192 - All imports in import declaration are unused
- **Linha 7:** TS6196 - 'UserProfile' is declared but never used

**Arquivo:** `src/components/onboarding/steps/StrategyStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 5:** TS6133 - 'OnboardingProfile' is declared but its value is never read
- **Linha 6:** TS6133 - 'useStrategyRules' is declared but its value is never read

**Arquivo:** `src/components/onboarding/steps/SummaryStep.tsx`

- **Linha 1:** TS6133 - 'useOnboarding' is declared but its value is never read
- **Linha 6:** TS6192 - All imports in import declaration are unused
- **Linha 7:** TS6133 - 'useStrategyRules' is declared but its value is never read

---

## ERROS ESLINT

### CRÍTICOS

**Arquivo:** `src/components/investments/views/DebtOptimizer.tsx`

- **Linha 42:** prefer-const - 'pool' is never reassigned. Use 'const' instead

---

## WARNINGS ESLINT

### ALTO

**Arquivo:** `src/components/ai/FinancialCommandCenter.tsx`

- **Linha 191:** @typescript-eslint/no-explicit-any (×4)
- **Linha 217:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/components/investments/InvestmentsDashboard.tsx`

- **Linha 216:** @typescript-eslint/no-explicit-any
- **Linha 476:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/components/investments/views/BentoCockpit.tsx`

- **Linha 50:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/components/market/FipeVehicleManager.tsx`

- **Linha 79:** @typescript-eslint/no-explicit-any
- **Linha 91:** @typescript-eslint/no-explicit-any
- **Linha 168:** @typescript-eslint/no-explicit-any
- **Linha 246:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/components/onboarding/OnboardingContext.tsx`

- **Linha 55:** @typescript-eslint/no-explicit-any
- **Linha 109:** @typescript-eslint/no-explicit-any
- **Linha 110:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/hooks/useFipe.ts\*\*

- **Linha 44:** @typescript-eslint/no-explicit-any
- **Linha 58:** @typescript-eslint/no-explicit-any
- **Linha 72:** @typescript-eslint/no-explicit-any
- **Linha 88:** @typescript-eslint/no-explicit-any
- **Linha 103:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/hooks/useIntelligence.ts`

- **Linha 22:** @typescript-eslint/no-explicit-any
- **Linha 25:** @typescript-eslint/no-explicit-any
- **Linha 35:** @typescript-eslint/no-explicit-any
- **Linha 37:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/lib/pdf-export.ts`

- **Linha 122:** @typescript-eslint/no-explicit-any
- **Linha 225:** @typescript-eslint/no-explicit-any
- **Linha 510:** @typescript-eslint/no-explicit-any

**Arquivo:** `src/sw.ts`

- **Linha 82:** @typescript-eslint/no-explicit-any
- **Linha 93:** @typescript-eslint/no-explicit-any
- **Linha 96:** @typescript-eslint/no-explicit-any
- **Linha 103:** @typescript-eslint/no-explicit-any
- **Linha 107:** @typescript-eslint/no-explicit-any
- **Linha 140:** @typescript-eslint/no-explicit-any
- **Linha 146:** @typescript-eslint/no-explicit-any
- **Linha 153:** @typescript-eslint/no-explicit-any
- **Linha 183:** @typescript-eslint/no-explicit-any
- **Linha 188:** @typescript-eslint/no-explicit-any
- **Linha 192:** @typescript-eslint/no-explicit-any
- **Linha 192:** @typescript-eslint/no-explicit-any
- **Linha 202:** @typescript-eslint/no-explicit-any

### MÉDIO

**Arquivo:** `src/components/ai/AdviserOverlay.tsx`

- **Linha 115:** react-refresh/only-export-components

**Arquivo:** `src/components/onboarding/OnboardingContext.tsx\*\*

- **Linha 189:** react-refresh/only-export-components

**Arquivo:** `src/context/OverlayContext.tsx`

- **Linha 54:** react-refresh/only-export-components

**Arquivo:** `src/context/PreferencesContext.tsx`

- **Linha 218:** react-refresh/only-export-components

**Arquivo:** `src/components/education/EducationSection.tsx\*\*

- **Linha 137:** react-hooks/exhaustive-deps
- **Linha 185:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/education/FinancialInsightsTutor.tsx`

- **Linha 276:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/investments/InvestmentIntelligence.tsx\*\*

- **Linha 193:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/investments/InvestmentsDashboard.tsx\*\*

- **Linha 129:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/investments/views/BentoCockpit.tsx\*\*

- **Linha 33:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/market/FipeVehicleManager.tsx\*\*

- **Linha 112:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/settings/WorkspaceManager.tsx\*\*

- **Linha 66:** react-hooks/exhaustive-deps

**Arquivo:** `src/components/transactions/LaunchScreen.tsx\*\*

- **Linha 173:** react-hooks/exhaustive-deps

**Arquivo:** `src/hooks/useDebtStrategy.ts\*\*

- **Linha 134:** react-hooks/exhaustive-deps
- **Linha 190:** react-hooks/exhaustive-deps

**Arquivo:** `src/hooks/useEmotionalJournal.ts\*\*

- **Linha 49:** react-hooks/exhaustive-deps

**Arquivo:** `src/hooks/useGamification.ts\*\*

- **Linha 112:** react-hooks/exhaustive-deps

### BAIXO

**Arquivo:** `src/context/CurrencyContext.tsx\*\*

- **Linha 48:** @typescript-eslint/no-unused-vars ('error' unused)

**Arquivo:** `src/hooks/useInterestRates.ts\*\*

- **Linha 61:** @typescript-eslint/no-unused-vars ('e' unused)

**Arquivo:** `src/lib/crypto.ts\*\*

- **Linha 96:** @typescript-eslint/no-unused-vars ('error' unused)

**Arquivo:** `src/lib/storage.ts\*\*

- **Linha 37:** @typescript-eslint/no-unused-vars ('e' unused)

**Arquivo:** `src/sw.ts\*\*

- **Linha 5:** @typescript-eslint/no-unused-vars ('OFFLINE_URL' unused)

---

## WARNINGS DE BUILD

**Fonte:** Vite Build Output

1. **Aviso de classe CSS ambígua:**
   - `duration-[180ms]` está ambíguo e corresponde a múltiplas utilities

2. **Aviso de chunk dinâmico:**
   - `src/lib/api.ts` é importado dinamicamente em `transaction.ts` mas também estaticamente em múltiplos arquivos
   - Módulo não será movido para outro chunk

---

## ARQUIVOS DE LOG ANALISADOS

- `tsc_errors.log` - 83 erros TypeScript
- `build_check.log` - binário (não legível)
- `build_error.log` - binário (não legível)
- `full_error.log` - binário (não legível)
- `my_build.log` - binário (não legível)
- Outros logs: `build_debug.log`, `build_phase4.log`, `playwright_error.log`, `vite.log`, etc.

---

## PRIORIDADES DE CORREÇÃO

### 🔴 PRIORIDADE CRÍTICA (Corrigir imediatamente)

1. **Onboarding Steps Props faltantes** - 8 arquivos com `Cannot find name 'XProps'` (TS2304)
2. **Parâmetros implícitos `any`** - 30+ ocorrências em Steps de onboarding (TS7006)
3. **Variáveis nunca usadas** - 50+ ocorrências em OnboardingWizard e Steps (TS6133/TS6196)
4. **Imports não usados** - 4 arquivos com imports totalmente não utilizados (TS6192)
5. **Erro ESLint prefer-const** - 1 erro (crítico por quebrar padrão de código)

### 🟠 PRIORIDADE ALTA (Corrigir esta sprint)

1. **Uso de `any`** - 50+ ocorrências em hooks, componentes e libs
2. **Dependências de useMemo/useEffect** - 15+ avisos de deps
3. **Fast refresh issues** - 4 arquivos exportando não-componentes

### 🟡 PRIORIDADE MÉDIA (Corrigir próxima sprint)

1. **Variáveis não usadas menores** - erros em contextos e hooks
2. **Warnings de catch error** - 3 ocorrências

---

## IMPACTO

- **Build atual:** ✅ Sucesso (produz dist/)
- **TypeScript:** ❌ 83 erros impedem compilação limpa
- **ESLint:** ⚠️ 1 erro + 70 warnings (com --max-warnings=0 falharia)
- **Manutenibilidade:** Baixa - código com muitos any e dead code
- **Risco Runtime:** Médio - any types podem causar erros não tipados

---

## RECOMENDAÇÕES

1. **Corrija Steps de Onboarding** - Props interfaces estão faltando ou mal definidas
2. **Tipagem explícita** - Substitua `any` por tipos específicos
3. **Limpeza dead code** - Remova imports/variáveis não usadas
4. **Ajuste useMemo/useEffect** - Corrija dependency arrays
5. **Separe constants** - Arquivos com mixed exports (componentes + funções)
