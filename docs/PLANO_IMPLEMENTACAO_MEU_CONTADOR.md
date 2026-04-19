# Plano de Implementação — Meu Contador (Frontend)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Responsável:** Kilo (Engineering Lead)  
**Estilo:** Fabio Akita — direto, técnico, sem enrolação

---

## 1. Visão Geral

Este plano detalha a implementação de melhorias no frontend do **Meu Contador** através de três fases progressivas. O objetivo é entregar estabilidade operacional na Semana 1, melhorias arquiteturais na Semana 2, e consolidação de qualidade com testes na Semana 3.

**Premissas:**
- Frontend existente em React + TypeScript + Vite
- Stack: React 18, React Router 6, TanStack Query (não visível no código atual mas implícito), Axios, Framer Motion
- ~100+ componentes, ~30 hooks customizados
- App.tsx com 379 linhas atualmente (monolítico)
- CSRF handling já implementado em `frontend/src/lib/api.ts` (linhas 49-119)
- Hook `useIsDesktop` já extraído em `frontend/src/hooks/useMediaQuery.ts` (linhas 18-19)

**Dependências já resolvidas (DONE):**
- CSRF expiration handling: `lib/api.ts:149-155` — retry automático com `tryRefreshSession()`
- Extract `useIsDesktop`: `hooks/useMediaQuery.ts:18-19` — implementado como thin wrapper sobre `useMediaQuery`

---

## 2. Fases de Implementação

| Fase | Período | Foco | Entregável |
|------|--------|------|------------|
| **Fase 1: Estabilidade** | Semana 1 | Bug fixes críticos, DX | App funcional sem crashing |
| **Fase 2: Arquitetura** | Semana 2 | Refactoring, extração | Código maintainable |
| **Fase 3: Qualidade** | Semana 3 | Tests, loading states | Cobertura, DX |

---

## 3. Fase 1: Estabilidade (Semana 1)

**Objetivo:** Eliminar crashes críticos e melhorar developer experience antes de qualquer refactoring.

### 3.1 CSRF Expiration Handling — ✅ JÁ FEITO

**Status:** DONE  
**Local:** `frontend/src/lib/api.ts:149-155`

Implementação atual:

```typescript
// Retry ONLY for 401 (expired session). 403 is plan-gated — no point refreshing.
if (response.status === 401) {
  const refreshed = await tryRefreshSession();
  if (refreshed) {
    response = await doFetch();
  }
}
```

**Problema identificado:** O retry funciona, mas não há fallback para cenários onde o refresh também retorna 401 (token revogado). Falta logic de redirect para `/login` após exaustão de retries.

**Melhoria necessária:**
- Adicionar retry limit (max 2 tentativas)
- Após exaustão, fazer `clearAuthSession()` + redirect programático para `/login`
- Adicionar delay exponencial entre retries (500ms → 1000ms)

**Arquivo:** `frontend/src/lib/api.ts`  
**Linha:** ~150

### 3.2 Extract useIsDesktop Hook — ✅ JÁ FEITO

**Status:** DONE  
**Local:** `frontend/src/hooks/useMediaQuery.ts:18-19`

Implementação atual:

```typescript
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
```

**Utilização em App.tsx:** `frontend/src/App.tsx:93`

```typescript
const isDesktop = useIsDesktop();
```

**Verificar:** Se há duplicação ou se o hook precisa ser exportado de um index barrel. Verificar se existe `frontend/src/hooks/index.ts`.

### 3.3 ErrorBoundary Consolidation

**Problema:** Existe múltiplos ErrorBoundary em pontos distintos do DOM tree:
- `frontend/src/App.tsx:279`: `<ErrorBoundary featureName="AppShell">`
- `frontend/src/App.tsx:358`: `<ErrorBoundary featureName="Main Content">`

Cada ErrorBoundary tem lógica redundante. Precisamos de apenas 1-2 para o app inteiro, não 10+ distribuídos.

**Arquivos:**
- `frontend/src/components/ErrorBoundary.tsx` — componente único
- `frontend/src/App.tsx` — consumo

**Critério de mudança:**
1. Reter apenas 1 ErrorBoundary no topo da app (`AppShell`)
2. inner ErrorBoundary (`Main Content`) é redundante se o AppShell já envolve tudo
3. Para features específicas (routes), usar route-level ErrorBoundary não por componente

**Implementação atual — ErrorBoundary.tsx:22-53:**

```typescript
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { featureName = 'Unknown Feature' } = this.props;
    
    // Log error details
    logger.error(`Error in ${featureName}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Send to Sentry
    captureException(error, {
      feature: featureName,
      componentStack: errorInfo.componentStack ?? '',
    });

    this.setState({ errorInfo });
  }
  // ...
}
```

**Melhoria proposta:**
- Adicionar prop `onReset?: () => void` para callback externo após reset
- Adicionar prop `retryCount?: number` para auto-retry antes de mostrar UI de erro
- Extrair para functional component com useErrorBoundary custom hook

### 3.4 API Retry Utility Extraction

**Problema:** Lógica de retry está duplicada entre:
- `lib/api.ts:149-155` — retry em request
- `lib/api-client.ts` — não tem retry (apenas logging)

**Solução:** Extrair para `lib/retry.ts` ou usar tanstack-query para server state management.

**Opção A: TanStack Query (Recomendado)**

Instalar se ainda não presente:

```bash
npm install @tanstack/react-query
```

Criar `lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});
```

Usar em hooks existentes:

```typescript
// hooks/useTransactions.ts — refactor para usar query
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<Transaction[]>('/transactions'),
  });
}
```

**Opção B: Utility standalone** (se TanStack Query for overhead)

Criar `lib/retry.ts`:

```typescript
interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 500,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(backoffMultiplier, attempt - 1)));
    }
  }

  throw lastError!;
}
```

---

## 4. Fase 2: Arquitetura (Semana 2)

**Objetivo:** Reduzir complexidade de App.tsx e eliminar prop drilling.

### 4.1 Split App.tsx

**Problema:** App.tsx com 379 linhas fazmuita coisa:
- Gerencia estado local (tabs, modals, wizard)
- Define todas as rotas
- Renderiza UI layout (PhoneShell, Sidebar, BottomNav)
- Lida com callbacks de navegação

**Arquivo:** `frontend/src/App.tsx`

**Solução:** Criar estrutura de diretórios:

```
src/
├── features/
│   ├── app-shell/
│   │   ├── AppShell.tsx
│   │   ├── components/
│   │   │   ├── PhoneShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── BottomNav.tsx
│   │   └── hooks/
│   │       ├── useAppNavigation.ts
│   │       └── useAppState.ts
│   └── routes/
│       ├── Routes.tsx
│       └── route-config.ts
└── context/
    └── AppContext.tsx
```

**Passos:**

1. **Extrair Routes** — `app/routes.tsx` já existe (~58 imports). Criar componente que usa isso.

```typescript
// features/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppNavigation } from '../app-shell/hooks/useAppNavigation';

export function AppRoutes() {
  const { navigate, goHome, goBack } = useAppNavigation();
  
  return (
    <Routes>
      {/* ... todas as rotas existentes em App.tsx:157-209 */}
    </Routes>
  );
}
```

2. **Extrair AppState** — states como `activeTab`, `showFunctions`, `showWizard`, `showCelebration`

```typescript
// features/app-shell/hooks/useAppState.ts
import { useState, useCallback } from 'react';
import type { TabType } from '@/types/navigation';

interface AppState {
  activeTab: TabType;
  showFunctions: boolean;
  showWizard: boolean;
  showCelebration: boolean;
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    activeTab: 'inicio',
    showFunctions: false,
    showWizard: false,
    showCelebration: false,
  });

  const setActiveTab = useCallback((tab: TabType) => {
    setState(s => ({ ...s, activeTab: tab }));
  }, []);

  const toggleFunctions = useCallback((show?: boolean) => {
    setState(s => ({ ...s, showFunctions: show ?? !s.showFunctions }));
  }, []);

  // ... outros setters

  return { state, setActiveTab, toggleFunctions, ... };
}
```

3. **Criar AppProvider** — wrapper que provê context

```typescript
// context/AppContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useAppState } from '@/features/app-shell/hooks/useAppState';

const AppContext = createContext<ReturnType<typeof useAppState> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const appState = useAppState();
  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

4. **App.tsx final** — component apenas de composição:

```typescript
// App.tsx após refactor (~50 linhas)
// BEFORE: 379 linhas
// AFTER: ~50 linhas

export default function App() {
  const { user, loading } = useAuth();
  const { state } = useApp();

  if (!user) return <LoginForm />;

  return (
    <AppProvider>
      <TourProvider>
        <ErrorBoundary featureName="App">
          <AppRoutes />
        </ErrorBoundary>
      </TourProvider>
    </AppProvider>
  );
}
```

### 4.2 Prop Drilling Elimination

**Problema atual:** diversos componentes recebem props desnecessários via prop drilling:

```typescript
// App.tsx:156 — renderedView
<Routes {...}>
  <Route path="/" element={<GlobalDashboard onNavigate={navTo} />} />
  <Route path="/health" element={<HealthSection onBack={goHome} onNavigate={navTo} />} />
  <Route path="/settings" element={<SettingsSection onBack={goHome} />} />
  {/* ~30+ rotas, cada uma com 1-3 props de navegação */}
</Routes>
```

**Solução:** Usar useNavigate() diretamente nos componentes, remover props redundantes.

Padrão Anti:

```typescript
// GlobalDashboard.tsx
export function GlobalDashboard({ onNavigate }: { onNavigate: (t: TabType) => void }) {
  const navigate = useNavigate();
  // ... duas formas de navegar coexistem
}
```

Padrão Correto:

```typescript
// GlobalDashboard.tsx
export function GlobalDashboard() {
  const navigate = useNavigate();
  // usar navigate diretamente
}
```

**Refactor em cascata:**
1. Remover props `onNavigate`, `onBack` de todos os componentes de rota
2. Criar hook `useAppNavigation()` que expõe navigate internamente
3. Atualizar ~30+ arquivos de componentes

**Arquivos afetados:**
- `features/personal/components/DashboardTab.tsx`
- `features/personal/components/InsightsTab.tsx`
- `features/settings/components/SettingsSection.tsx`
- `features/health/components/HealthSection.tsx`
- Etc.

### 4.3 Constants File Creation

**Problema:** Valores hardcoded espalhados pelo código:

```typescript
// App.tsx:288
<BottomNav currentTab={isLaunchMenuOpen ? "launch" : activeTab} />

// useMediaQuery.ts:19
return useMediaQuery("(min-width: 1024px)");

// api.ts:144
signal: options.signal || AbortSignal.timeout(20000),
```

**Solução:** Criar `lib/constants.ts`:

```typescript
// frontend/src/lib/constants.ts

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 20000,
  API_RETRY_DELAY: 500,
  API_MAX_RETRIES: 3,
} as const;

// Routes
export const DEFAULT_TAB = 'inicio' as TabType;
export const LAUNCH_TAB = 'launch' as TabType;

// Storage Keys
export const STORAGE_KEYS = {
  ONBOARDING_DONE: 'onboarding_done_',
  USER_PREFERENCES: 'user_preferences',
} as const;

// Feature Flags (se não existir FeatureFlagsContext)
export const FEATURES = {
  PREMIUM_ANALYTICS: 'premium_analytics',
  PREMIUM_INVOICES: 'premium_invoices',
  AI_ADVISOR: 'ai_advisor',
} as const;

// Animation Durations
export const ANIMATION = {
  PAGE_TRANSITION: 200,
  MODAL_ENTER: 300,
  MODAL_EXIT: 200,
} as const;
```

**Atualizar referências:**

```typescript
// useMediaQuery.ts — ANTES
return useMediaQuery("(min-width: 1024px)");

// useMediaQuery.ts — DEPOIS
import { BREAKPOINTS } from '@/lib/constants';
return useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
```

---

## 5. Fase 3: Qualidade (Semana 3)

**Objetivo:** Padronizar UX (loading states, error handling) e adicionar tests.

### 5.1 Loading States Standardization

**Problema:** Cada componente implementa seu próprio loading state. alguns usam `LoadingSkeleton`, outros `<Suspense>`, outros `null`.

**Estado actuel:**
- `App.tsx:64`: `function LoadingFallback() { return <LoadingSkeleton />; }`
- Vários componentes: loading inline via `isLoading` state

**Solução:** Criar componentes padronizados:

```typescript
// components/ui/PageLoader.tsx
interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Carregando...' }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-400">{message}</p>
      </div>
    </div>
  );
}

// components/ui/PageError.tsx
interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  title = 'Erro ao carregar',
  message = 'Tente novamente mais tarde.',
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-neutral-400 mb-4">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-primary">
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
```

**Hook utilitário:**

```typescript
// hooks/usePageState.ts
import { useState } from 'react';

type PageState = 'loading' | 'success' | 'error';

export function usePageState<T>(
  fetcher: () => Promise<T>
) {
  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setState('loading');
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setState('success');
    } catch (e) {
      setError(e as Error);
      setState('error');
    }
  };

  return { state, data, error, execute, isLoading: state === 'loading' };
}
```

### 5.2 Error Handling Improvements

**Melhorias necessárias:**

1. **API errors** — centralizar mensagens já existem em `lib/api.ts:28-47` (`getDefaultErrorMessage`). Adotar Consistentemente nos componentes.

```typescript
// api.ts — já existe
function getDefaultErrorMessage(status: number) {
  switch (status) {
    case 400:
      return 'Requisição inválida.';
    case 401:
      return 'Sua sessão expirou. Faça login novamente.';
    // ...
  }
}
```

Criar utilitário para exibir em toast automaticamente:

```typescript
// lib/toast-utils.ts
import { showError, showWarning } from './toast';

export function notifyApiError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      showWarning(error.message);
      navigate('/login');
      return;
    }
    showError(error.message);
    return;
  }
  showError('Erro inesperado. Tente novamente.');
}
```

2. **Retry button** — já existe em ErrorBoundary.tsx:100-106 mas pode ser melhorado para suporte a retry automático.

```typescript
// ErrorBoundary.tsx — adicionar prop
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
  retryCount?: number; // NOVO: auto-retry attempts
  onError?: (error: Error) => void;
}
```

### 5.3 Tests

**Testes existentes:**
- `frontend/src/context/AuthContext.test.tsx`
- `frontend/src/context/LanguageContext.test.tsx`
- `frontend/src/hooks/useTransactions.test.ts`
- `frontend/src/components/ErrorBoundary.test.tsx`
- `frontend/src/lib/api.test.ts`

**Coverage atual:** não verificado mas presumivelmente baixo.

**Plano de testes:**

1. **Critical paths** (testes funcionais):

| Path | Arquivo | Tipo |
|------|--------|------|
| Login flow | `context/AuthContext.test.tsx` | Unit |
| App rendering | `App.test.tsx` | E2E (Playwright) |
| Navigation | `app/routes.test.tsx` | Unit |
| API retry | `lib/api.test.ts` | Unit |

2. **Hooks tests** (adicionar):
- `hooks/useMediaQuery.test.ts`
- `hooks/useAppState.test.ts`
- `hooks/usePageState.test.ts`

3. **Component tests** (adicionar):
- `components/ErrorBoundary.test.tsx` — já existe
- `components/PageLoader.test.tsx` — NOVO
- `components/PageError.test.tsx` — NOVO

**Configuração Vitest:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 6. Checklist por Arquivo

### Fase 1: Estabilidade

| Arquivo | Ação | Linha | Prioridade |
|--------|------|-------|-----------|
| `lib/api.ts` | Adicionar retry limit + redirect após exhausção | ~150 | Alta |
| `lib/api.ts` | Adicionar delay exponencial | ~152 | Alta |
| `components/ErrorBoundary.tsx` | Adicionar onReset callback | ~55 | Média |
| `components/ErrorBoundary.tsx` | Adicionar retryCount prop | ~10 | Média |
| `hooks/index.ts` | Verify export barrel | — | Baixa |
| `lib/retry.ts` | Criar utility (se TanStack Query não usado) | — | Média |

### Fase 2: Arquitetura

| Arquivo | Ação | Linha | Prioridade |
|--------|------|-------|-----------|
| `App.tsx` | Refactor para ~50 linhas | 379 → 50 | Alta |
| `features/app-shell/` | Criar directory + arquivos | — | Alta |
| `features/app-shell/hooks/useAppState.ts` | Criar hook | — | Alta |
| `context/AppContext.tsx` | Criar Provider | — | Alta |
| `features/routes/AppRoutes.tsx` | Extrair rotas | — | Alta |
| `lib/constants.ts` | Criar constants file | — | Média |
| `*/components/*.tsx` | Remove onNavigate/onBack props | — | Média |
| `types/navigation.ts` | Verificar TabType export | — | Baixa |

### Fase 3: Qualidade

| Arquivo | Ação | Linha | Prioridade |
|--------|------|-------|-----------|
| `components/ui/PageLoader.tsx` | Criar componente | — | Alta |
| `components/ui/PageError.tsx` | Criar componente | — | Alta |
| `hooks/usePageState.ts` | Criar hook | — | Alta |
| `lib/toast-utils.ts` | Criar utilitário | — | Média |
| `vitest.config.ts` | Configurar coverage | — | Alta |
| `hooks/useMediaQuery.test.ts` | Criar teste | — | Média |
| `hooks/useAppState.test.ts` | Criar teste | — | Média |
| `components/PageLoader.test.tsx` | Criar teste | — | Baixa |

---

## 7. Estimativa de Tempo

| Fase | Task | Estimated Hours |
|------|------|------------------|
| **Fase 1** | CSRF retry limit + redirect | 2h |
| | ErrorBoundary enhancements | 3h |
| | API retry utility OR TanStack Query | 4h |
| | **Subtotal Fase 1** | **9h** |
| **Fase 2** | App.tsx refactor | 6h |
| | useAppState + context | 4h |
| | Constants file | 2h |
| | Prop drilling elimination | 6h |
| | **Subtotal Fase 2** | **18h** |
| **Fase 3** | PageLoader + PageError components | 3h |
| | usePageState hook | 2h |
| | Error handling improvements | 3h |
| | Test setup + coverage config | 3h |
| | Write tests (critical paths) | 8h |
| | **Subtotal Fase 3** | **19h** |
| **TOTAL** | | | **46h** (~6 dias de 8h) |

** buffer de 15% (+7h): 53h total (~7 dias)

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| TanStack Query introduz breaking changes na API existente | Média | Alto | Usar Versão 4 (estável), manter Axios como fallback |
| Prop drilling removal quebra componentes | Alta | Alto | Criar backwards-compatible wrapper (useAppNavigation) primeiro |
| Test coverage slow down entrega | Baixa | Médio | Priorizar critical paths, deixar low-priority sem teste |
| App.tsx refactor revela acoplamento invisível | Alta | Alto | Iterar incremental: primeiro extrair Routes, depois state |
| CSRF redirect loop (401 → refresh → 401) | Média | Médio | Adicionar máximo de 2 refresh attempts antes de logout |

---

## 9. Próximos Passos

1. **HOJE:** Confirmar dependência TanStack Query via `npm list @tanstack/react-query`
2. **HOJE:** Executar `npm run test` para verificar coverage atual
3. **SEGUNDO:** Iniciar Fase 1 com CSRF retry limit
4. **TERCEIRO:** Validar ErrorBoundary atual via reproduction local

**Dependências para confirmar:**
- [ ] TanStack Query instalado
- [ ] Vitest configurado (já existe: `package.json:14-16`)
- [ ] Test setup (`src/test/setup.ts`) verificado

---

**FIM DO PLANO**

Proceeding para implementação fase por fase a partir da próxima iteração.