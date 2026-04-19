# Auditoria de Código — Meu Contador (Frontend)

**Data:** 16/04/2026  
**Escopo:** `frontend/src/App.tsx`, `AuthContext.tsx`, `AuthService.ts`, `useAppNavigate.ts`, `useTransactions.ts`, `api.ts`  
**Estilo:** Fabio Akita — direto, técnico, sem enrolação.

---

## 1. Resumo Executivo

O frontend do Meu Contador está em um estado **razoável com pendências pontuais**. A arquitetura geral é sólida: há separações claras de responsabilidades, retry logic implementado, ErrorBoundary em uso, e padrões de clean code aplicados em hooks e serviços.

Os problemas principais são:
- `App.tsx` com 393 linhas e hook inline (`useIsDesktop`)
- ErrorBoundary duplicado em múltiplos pontos
- Prop drilling ainda presente em alguns componentes

**Veredicto:** Código produzível, mas com oportunidades claras de refatoração.

---

## 2. Stack Identificada

| Camada | Tecnologia |
|--------|------------|
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| Estado | Context API + useState |
| Estilização | Tailwind CSS |
| HTTP Client | fetch com wrapper customizado (`api.ts`) |
| Autenticação | Firebase Auth + CSRF Token |
| Observabilidade | Sentry + logger customizado |
| Build Tool | Vite |

---

## 3. Arquitetura

```
App.tsx (393 linhas)
├── Routes (SPA routing via react-router-dom)
├── ErrorBoundary (linha 293 - AppShell)
│   └── ErrorBoundary (linha 372 - Main Content)
├── AuthContext (fornece user, login, logout)
├── Hooks
│   ├── useTransactions (277 linhas)
│   ├── useGamification
│   ├── useNotifications
│   └── Custom hooks para UI (useIsDesktop inline)
└── Providers
    └── TourProvider → ScreenReaderAnnouncer → GlobalLoadingProgress
```

**Fluxo de Dados:**
- `AuthContext` → `AuthService` → `api.ts` (HTTP layer)
- `api.ts` gerencia CSRF, retry de sessão (401), e `ApiRequestError`
- Componentes consomem hooks diretamente (`useTransactions`, `useAppNavigate`)

---

## 4. Pontos Fortes (Good Patterns)

### 4.1 Retry Logic no AuthContext (LINHA 52-65)
```typescript
async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T>
```
- Implementa cold-start retry com `COLD_START_RETRY_DELAY_MS = 2000ms`
- Distingue network errors de errors do app
- Evita "backend não acordou" no primeiro acesso

**Nota:** Este padrão deveria ser isolado num utilitário reutilizável.

### 4.2 AuthService — Separação de Concerns (127 linhas)
- Service layer limpo, sem lógica de UI
- Mapeamento explícito: `mapBackendUserToAuthUser`
- Tracking de analytics em cada operação
- Não expõe detalhes de Firebase diretamente

### 4.3 ErrorBoundary Já Implementado
- `ErrorBoundary.tsx` (114 linhas) com Sentry integration
- Usado em dois pontos: AppShell e Main Content
- Fallback UI com Retry button
- Diferencia modo DEV vs PROD nos detalhes do erro

### 4.4 useAppNavigate — Hook Pattern (35 linhas)
```typescript
export function useAppNavigate() {
  const navigate = useNavigate();
  const navigateTo = useCallback((tab: TabType) => navigate(TAB_PATHS[tab]), [navigate]);
  const goBack = useCallback((fallback = 'inicio') => navigate(TAB_PATHS[fallback]), [navigate]);
  return { navigateTo, goBack };
}
```
- Elimina prop drilling de `onNavigate`/`onBack` por 5+ níveis
- Consiste com `TAB_PATHS` do `routes.tsx`

### 4.5 useTransactions — Padrão de Cleanup (LINHA 29, 64)
```typescript
let cancelled = false;
// ...
return () => { cancelled = true; }; // Cleanup function
```
- Flag `cancelled` previne setState em componente desmontado
- Uso correto de cleanup no `useEffect` (linha 67-78)
- Escopo-aware (suporta "personal" ou "business")

### 4.6 api.ts — Error Handling Robusto
- `ApiRequestError` class com status, code, details
- CSRF token lido do cookie automaticamente (linha 52-59)
- Session refresh automático em 401 (linha 150-155)
- Headers corretos para FormData (linha 131-133)
- Timeout de 20s configurado (linha 143)

### 4.7 CSRF Handling Bem Implementado
- Cookie `mc_csrf_token` (non-HttpOnly) lido no startup
- Token injetado em todas as requisições exceto GET/HEAD/OPTIONS
- `setCsrfToken()` e `clearAuthSession()` com listeners (observer pattern)

---

## 5. Problemas Identificados

### 5.1 App.tsx — Monolito de 393 Linhas

**Severidade:** **MÉDIA**

O arquivo `App.tsx` concentra:
- Definição de Routes (170-224)
- Estado de UI (tabs, modais, wizard)
- Lógica de autenticação (linha 123-144)
- Interceptadores de notificação (linha 84-103)
- Render condicional para desktop/mobile
- Imports de ~25 componentes

**Problema:** Violação do princípio de responsabilidade única. Dificulta:
- Testes unitários (nãoconsegue testar rotas isoladamente)
- Code review (precisa processar 393 linhas de uma vez)
- Onboarding de devs novos

**Recomendação:** Extrair para:
```
src/
├── components/
│   ├── AppRoutes.tsx    ( Routes definitions only )
│   ├── AppState.tsx     ( state management hook )
│   └── AppLayout.tsx    ( PhoneShell, Sidebar, BottomNav )
└── App.tsx (composition only)
```

---

### 5.2 Hook `useIsDesktop` Definido Inline

**Severidade:** **BAIXA** (Technical Debt)

**Localização:** `App.tsx`, linhas 10-21

```typescript
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useStateMedia(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );
  useEffectMedia(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}
```

**Problemas:**
- Mix de imports (linha 7 importa `useEffect as useEffectMedia`)
- Função definida em arquivo de componente (não em `hooks/`)
- Nome genérico sem contexto (deveria ser `useIsDesktopBreakpoint`)

**Recomendação:** Mover para `src/hooks/useMediaQuery.ts`:
```typescript
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
```

---

### 5.3 ErrorBoundary Duplicado

**Severidade:** **BAIXA**

**Localização:** `App.tsx`, linhas 293 e 372

```typescript
<ErrorBoundary featureName="AppShell">
  ...
  <ErrorBoundary featureName="Main Content">
    {renderedView}
  </ErrorBoundary>
</ErrorBoundary>
```

**Análise:** Não é exatamente "duplicado" — são duas instâncias para escopos diferentes:
- AppShell: catching errors no layout/navigation
- Main Content: catching errors nas páginas

**Por que é problema:** Aninhamento cria cenários confusos:
- Se Main Content falha, qual ErrorBoundary captura?
- Código repetido de instância poderia ser evitado com composition pattern

**Recomendação:** Considerar `createBoundary()` pattern ou usar o componente uma vez só no root com `featureName` dinâmico.

---

### 5.4 Prop Drilling Persistente

**Severidade:** **MÉDIA**

Apesar do `useAppNavigate` existir, há ainda componentes usando `onNavigate` como prop.

**Evidência:**Olhar os routes definidos:
```typescript
<Route path="/budget" element={<BudgetDashboard onNavigate={navTo} />} />
<Route path="/budget/analytics" element={<PremiumGate ...><AnalyticsDashboard transactions={transactions} /></PremiumGate>} />
```

**Quantos componentes usam prop drilling?** Diff rápido sugere ~15 componentes ainda recebem `onNavigate` como prop.

**Recomendação:** Audit completo em `src/app/routes.tsx` para migrar para `useAppNavigate`.

---

### 5.5 Missing Error Handling em Operações CRUD

**Severidade:** **MÉDIA**

**Localização:** `useTransactions.ts`, linha 53-57

```typescript
} catch (err) {
  if (!cancelled) {
    console.error("Transactions API Error:", err);  // ← só log
    setError("Não foi possível conectar ao servidor. Verifique sua conexão.");
  }
}
```

**Problema:** O hook retorna `error` state mas não expõe se o erro é retriável ou não. O caller não sabe se deve fazer retry.

**Recomendação:** Retornar `errorType` ou `canRetry`:
```typescript
return { error, canRetry: error?.includes('conexão'), refresh: fetchTransactions };
```

---

### 5.6 CSRF Token Expira Silenciosamente

**Severidade:** **ALTA** (Ponto de Falha)

**Localização:** `AuthContext.tsx`, linha 105-108

```typescript
const unsub = subscribeToAuthSession((snapshot) => {
  if (!snapshot.isAuthenticated && !snapshot.csrfToken && !cancelled) {
    setUser((prev) => prev ? prev : null);  // ← usuário mantém acesso mesmo sem token!
    setIsPro(false);
  }
});
```

**Problema:** Quando o CSRF expira:
1. Usuário logado permanece visualmente no app
2. Mas toda requisição non-GET vai falhar com 401
3. O código só remove `isPro`, não faz logout
4. Usuário fica em estado inconsistente até tentar uma ação

**Recomendação:** Forçar redirect para login OU auto-refresh sessão:
```typescript
if (!snapshot.isAuthenticated && !snapshot.csrfToken && !cancelled) {
  navigate('/login');  // ou tryRefreshSession()
}
```

---

### 5.7 Magic Numbers e Strings

**Severidade:** **BAIXA**

Exemplos:
- `window.innerWidth >= 1024` (linha 12)
- `COLD_START_RETRY_DELAY_MS = 2000` (linha 11)
- `REQUEST_TIMEOUT_MS = 10000` (linha 10)
- `"onboarding_done_${user.id}"` (linha 133)

**Recomendação:** Criar `src/constants/app.ts`:
```typescript
export const BREAKPOINTS = { DESKTOP: 1024 };
export const TIMEOUTS = { REQUEST: 10000, COLD_START_RETRY: 2000 };
export const STORAGE_KEYS = { ONBOARDING_DONE: 'onboarding_done' };
```

---

### 5.8 Ausência de Loading State nos Hooks

**Severidade:** **BAIXA**

`useTransactions` retorna `isLoading` mas `useAppNavigate`, `AuthService` não expõem loading state consistente.

**Recomendação:** Padronizar retorno:
```typescript
return { isLoading, error, data, retry };
```

---

## 6. Recomendações

| # | Recomendação | Tipo |
|---|--------------|------|
| 1 | Extrair `AppRoutes.tsx`, `AppState.ts`, `AppLayout.tsx` do App.tsx | Refatoração |
| 2 | Mover `useIsDesktop` para `src/hooks/useMediaQuery.ts` | Refatoração |
| 3 | Consolidar ErrorBoundary usage — uma vez no root | Refatoração |
| 4 | Audit completo de prop drilling → migrar para `useAppNavigate` | Migration |
| 5 | Adicionar `canRetry` no error state de `useTransactions` | Melhoria |
| 6 | Tratar expiração de CSRF com redirect para login | Bug Fix |
| 7 | Criar `src/constants/app.ts` para magic numbers | Technical Debt |
| 8 | Padronizar API hook return: `{ isLoading, error, data }` | Convention |
| 9 | Extrair `fetchWithRetry` para `src/utils/retry.ts` | Reutilização |

---

## 7. Priorização

### MUST FIX (Ponto de Falha)
- **5.6** CSRF token expira silenciosamente — usuário em estado inconsistente
- **5.4** Prop drilling em componentes críticos que não usam `useAppNavigate`

### SHOULD FIX (Melhorias Significativas)
- **5.1** App.tsx monolito — dificultam manutenção e testes
- **5.5** Error handling sem retry info em useTransactions
- **5.2** useIsDesktop inline

### NICE TO HAVE (Refinamento)
- **5.3** ErrorBoundary aninhado — baixa prioridade
- **5.7** Magic numbers — consistency only
- **5.8** Loading state padronizado

---

## 8. Conclusão

O código está **produzível e estável** — a equipe não está cometendo erros grotescos. Os padrões seguidos (hooks, services, ErrorBoundary, CSRF handling) são profissionais.

O workup necessário é **refatoração incremental**, não rewrites. Começando pelos MUST FIX (CSRF handling), depois Extrair App.tsx, e finalmente padronizar convenções.

A base é sólida. O path para maturidade é clareza de arquitetura e eliminação de technical debt pontual.