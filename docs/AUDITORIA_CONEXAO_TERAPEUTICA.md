# Auditoria de Código — Conexão Terapêutica

**Data:** 16 de Abril de 2026  
**Auditor:** Code Review Automatizado  
**Projetos Analisados:**

1. **App** — `C:\Users\GN\.gemini\antigravity\scratch\conexao-terapeutica` (Expo/React Native)
2. **Website** — `C:\Users\GN\.gemini\antigravity\playground\uni-camp` (Vite/React/Tailwind)

---

## Resumo Executivo

Ambos os projetos apresentam dividendo técnico aceitável para um MVP, porém possuem dividendo crítico que compromete performance, manutenibilidade e experiência do usuário. O App sofre com fetching sequencial de dados e ausência de skeleton loading. O Website replica código desnecessariamente e não trata erros adequadamente. Recomenda-se correção priorizada conforme matrix abaixo.

---

## Análise do App

### Stack Identificada

- **Framework:** Expo SDK 52 (React Native)
- **Navegação:** React Navigation (Stack + Bottom Tabs)
- **Estado:** Context API (UserContext, ThemeContext)
- **Backend:** Supabase
- **UI:** Componentes customizados + lucide-react-native
- **Utils:** date-fns, AsyncStorage

### Arquitetura

```
src/
├── context/
│   ├── UserContext.js     # Estado global de usuário
│   └── ThemeContext.js    # Tema (claro/escuro)
├── screens/main/         # ~40 telas
│   ├── DashboardScreen.js
│   ├── MedicationsScreen.js
│   └── ...
├── components/
│   ├── Button.js
│   ├── LoadingState.js
│   └── ...
└── navigation/
    ├── AppNavigator.js
    └── MainTabs.js
```

### Pontos Observados

- **Tamanho de arquivos:** DashboardScreen.js com **460 linhas** — componente monolítico sem拆分
- **Padrão(Context):** UserContext faz fetching em sequência (profile → dependents → caregiver_access)
- **Loading:** LoadingState usa apenas ActivityIndicator, sem skeleton
- **Erro:** Catch block sem retry logic, apenas webAlert genérico

---

## Análise do Website

### Stack Identificada

- **Build:** Vite
- **Framework:** React 18
- **Estilização:** Tailwind CSS
- **Ícones:** lucide-react

### Arquitetura

```
src/components/
├── Hero.tsx
├── Mission.tsx
├── Benefits.tsx
├── AppDownload.tsx
├── WhyUs.tsx
├── Team.tsx
├── Testimonials.tsx
├── Contact.tsx
├── Navbar.tsx
└── Footer.tsx
```

### Pontos Observados

- **scrollToSection:** Função idêntica replicada em Hero.tsx:5-12, Mission.tsx:12-19, Navbar.tsx:42-50
- **IntersectionObserver:** Criado em useEffect sem useRef (Navbar.tsx:27-40) — comportamento indefinido em dev mode
- **Form:** Contact.tsx handleSubmit apenas setSubmitted(true), sem integração com API
- **Error Boundary:** Ausente em todo o codebase

---

## Problemas Identificados

### APP (conexao-terapeutica)

| # | Arquivo | Linha | Problema | Severidade |
|---|---------|-------|---------|------------|
| 1 | UserContext.js | 44-94 | Fetching sequencial (profile → primaryDependents → sharedDependents). Queries dependem de resultado anterior, mas poderiam并行 com Promise.all | Alta |
| 2 | LoadingState.js | 5-9 | Apenas ActivityIndicator. Sem shimmer/skeleton para percepção de loading progressive | Média |
| 3 | UserContext.js | 105-113 | Catch block sem retry logic. Usuário precisa手动 refresh em caso de transient failure | Alta |
| 4 | Screens/*.js | — | Lista de items sem useMemo/useCallback. Render desnecessário em qualquer mudança de estado | Média |
| 5 | DashboardScreen.js | 1-460 | Componente com 460 linhas. Responsibilities: header, tips, stats widgets, next event, quick access. Violação SRP | Crítica |

### WEBSITE (uni-camp)

| # | Arquivo | Linha | Problema | Severidade |
|---|---------|-------|---------|------------|
| 1 | Navbar.tsx | 27-40 | IntersectionObserver[] criado diretamente no useEffect. Ausência de useRef para persistência de instância entre re-renders causa memory leak em dev mode | Alta |
| 2 | Hero.tsx, Mission.tsx, Navbar.tsx | — | Função scrollToSection duplicada 3x. ~15 linhas replicadas. DRY violado | Média |
| 3 | App.tsx ou main.tsx | — | Error Boundary inexistente. Qualquer erro não capturado quebra a aplicação inteira | Crítica |
| 4 | Contact.tsx | 16-23 | handleSubmit seta submitted=true localmente. Form não envia dados para nenhum endpoint. Featurefake | Alta |

---

## Recomendações

### APP

1. **Paralelizar queries em UserContext.js:**
   ```javascript
   // ANTES (sequencial)
   const profile = await supabase.from('profiles')...
   const primary = await supabase.from('dependents')...
   const shared = await supabase.from('caregiver_access')...

   // DEPOIS (paralelo)
   const [profileRes, primaryRes, sharedRes] = await Promise.all([
     supabase.from('profiles')...
     supabase.from('dependents')...
     supabase.from('caregiver_access')...
   ]);
   ```

2. **Criar SkeletonLoader component:**
   - Utilizar библиотека como `@shopify/react-native-skeltion` ou criar wrapper com shimmer animation
   - Substituir LoadingState em telas de lista

3. **Implementar retry logic:**
   - Utilizar react-query (TanStack Query) com retry: 3 automatico
   - Ou implementar wrapper manual com exponential backoff

4. **Memoização:**
   - Adicionar useCallback em handlers de list item
   - Utilizar useMemo em flatList.renderItem

5. **Split DashboardScreen:**
   - Extrair DashboardHeader, StatsWidget, NextEventCard, QuickAccessGrid como componentes separados
   - Target: <150 linhas por arquivo

### WEBSITE

1. **Extrair useScrollToSection hook:**
   ```typescript
   const useScrollToSection = (offset = -70) => {
     const scrollToSection = useCallback((sectionId: string) => {
       const el = document.getElementById(sectionId);
       if (el) {
         const y = el.getBoundingClientRect().top + window.pageYOffset + offset;
         window.scrollTo({ top: y, behavior: 'smooth' });
       }
     }, [offset]);
     return scrollToSection;
   };
   ```

2. **Corrigir IntersectionObserver com useRef:**
   ```typescript
   const observersRef = useRef<IntersectionObserver[]>([]);
   useEffect(() => {
     // ref，而非 nova array a cada render
   }, []);
   ```

3. **Criar ErrorBoundary:**
   ```typescript
   class ErrorBoundary extends React.Component {
     state = { hasError: false };
     static getDerivedStateFromError() { return { hasError: true }; }
     render() {
       if (this.state.hasError) return <FallbackUI />;
       return this.props.children;
     }
   }
   ```

4. **Integrar Contact form com endpoint real:**
   - Submissão para API endpoint (Supabase Edge Function, Formspree, etc.)
   - Validação client-side (Zod/Yup)

---

## Priorização

### MUST FIX (Crítico — Corrigir antes de production release)

| Projeto | Problema | Local |
|---------|---------|-------|
| App | DashboardScreen monolítico | DashboardScreen.js:1-460 |
| Website | Error Boundary ausente | App.tsx/main.tsx |
| Website | Contact form fake | Contact.tsx:16-23 |

### SHOULD FIX (Alta prioridade — Corrigir no próximo sprint)

| Projeto | Problema | Local |
|---------|---------|-------|
| App | Fetching sequencial | UserContext.js:44-94 |
| App | Sem retry logic | UserContext.js:105-113 |
| Website | scrollToSection duplicado | Hero.tsx, Mission.tsx, Navbar.tsx |
| Website | IntersectionObserver sem ref | Navbar.tsx:27-40 |

### NICE TO HAVE (Média prioridade — Planejar para próximos meses)

| Projeto | Problema | Local |
|---------|---------|-------|
| App | Loading skeletons | LoadingState.js |
| App | Lista sem memoização | Screens/*.js |

---

## Conclusão

O código demonstra competência funcional, porém requer intervenções estruturais antes de escalar. A ausência de padrões como Error Boundary e a replicação de lógica (scrollToSection) são anti-patterns que custam manutenção cara. A performance do App será impactada se o number de dependents/caregivers crescer — fetching sequencial de N+1 queries é insustentável.

Recomenda-se correção dos MUST FIX antes de qualquer expansão de features. O código é usável no estado atual, mas não é production-ready para carga real.

---

*Auditoria executada em 16/04/2026. Próxima revisão recomendada: 90 dias.*