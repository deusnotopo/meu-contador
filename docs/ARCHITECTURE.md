# Architecture Overview

## 🏗️ System Architecture

Meu Contador follows a **Feature-First Architecture** with clear separation of concerns and modular design.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Features   │  │  Components  │  │    Hooks     │      │
│  │              │  │              │  │              │      │
│  │ • Personal   │  │ • UI Kit     │  │ • useAuth    │      │
│  │ • Business   │  │ • Layout     │  │ • useData    │      │
│  │ • Investment │  │ • Forms      │  │ • useVitals  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                  │              │
│           └────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │   Context API   │                        │
│                   │  • Auth         │                        │
│                   │  • Language     │                        │
│                   │  • Theme        │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Firebase SDK  │
                    │  • Auth         │
                    │  • Firestore    │
                    │  • Functions    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                   Backend (Node.js)                          │
│                            │                                 │
│           ┌────────────────┴────────────────┐                │
│           │                                 │                │
│  ┌────────▼────────┐              ┌────────▼────────┐       │
│  │  Cloud Functions│              │   Express API   │       │
│  │                 │              │                 │       │
│  │ • AI Insights   │              │ • Auth Routes   │       │
│  │ • Reports       │              │ • Data Routes   │       │
│  │ • Notifications │              │ • Analytics     │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Frontend Architecture

### Feature-First Structure

Each feature is self-contained with its own components, hooks, and utilities:

```
src/
├── features/
│   ├── personal/
│   │   ├── components/
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── BudgetsTab.tsx
│   │   │   └── GoalsTab.tsx
│   │   ├── hooks/
│   │   │   └── useTransactions.ts
│   │   └── types/
│   │       └── index.ts
│   ├── business/
│   ├── investments/
│   └── education/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── ErrorBoundary.tsx
├── lib/
│   ├── logger.ts        # Logging utility
│   ├── storage.ts       # Data persistence
│   ├── currency.ts      # Currency utilities
│   └── formatters.ts    # Formatting helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useWebVitals.ts
│   └── useLanguage.ts
├── context/
│   ├── AuthContext.tsx
│   ├── LanguageContext.tsx
│   └── ThemeContext.tsx
└── types/
    ├── index.ts
    └── navigation.ts
```

### Key Principles

1. **Feature Isolation**: Each feature is independent and can be developed/tested separately
2. **Shared Components**: Common UI components in `components/ui`
3. **Type Safety**: 100% TypeScript, zero `any` types
4. **Error Boundaries**: Granular error handling per feature
5. **Performance**: Web Vitals monitoring, lazy loading

---

## 🔄 Data Flow

### State Management

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
Context API / Hook
    │
    ├─► Local State (useState)
    │
    ├─► Local Storage (persistence)
    │
    └─► Firebase (cloud sync)
         │
         ▼
    Firestore Database
         │
         ▼
    Real-time Updates
         │
         ▼
    Component Re-render
```

### Authentication Flow

```
1. User Login (Email/Google)
    │
    ▼
2. Firebase Auth
    │
    ▼
3. Get ID Token
    │
    ▼
4. Backend Verification
    │
    ▼
5. Load User Data
    │
    ├─► Profile (users collection)
    │
    ├─► Preferences
    │
    └─► Workspace Data
         │
         ▼
6. Sync to Local Storage
    │
    ▼
7. App Ready
```

---

## 🛡️ Error Handling

### Error Boundary Hierarchy

```
App
 │
 ├─► ErrorBoundary (Global)
 │     │
 │     ├─► Personal Finance Feature
 │     │     └─► ErrorBoundary (Feature-level)
 │     │
 │     ├─► Business Feature
 │     │     └─► ErrorBoundary (Feature-level)
 │     │
 │     └─► Investments Feature
 │           └─► ErrorBoundary (Feature-level)
```

**Benefits**:

- Isolated failures (one feature crash doesn't affect others)
- User-friendly error messages
- Automatic error logging
- Recovery options

---

## 📊 Performance Strategy

### Optimization Techniques

1. **Code Splitting**

   ```typescript
   const PersonalFinance = lazy(() => import("./features/personal"));
   const Business = lazy(() => import("./features/business"));
   ```

2. **Lazy Loading**

   - Route-based splitting
   - Component-level splitting for heavy features

3. **Memoization**

   ```typescript
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   ```

4. **Web Vitals Monitoring**
   - CLS, FID, FCP, LCP, TTFB, INP
   - Real-time performance tracking
   - Analytics integration ready

---

## 🔐 Security Architecture

### Authentication Layers

```
Frontend
    │
    ├─► Firebase Auth (Email/Google)
    │
    ▼
Backend
    │
    ├─► ID Token Verification
    │
    ├─► Role-Based Access Control
    │
    └─► Data Validation
         │
         ▼
    Firestore Security Rules
         │
         ├─► User-level permissions
         │
         └─► Workspace-level permissions
```

### Security Measures

- ✅ Firebase Authentication
- ✅ HTTPS only
- ✅ Token-based API access
- ✅ Firestore security rules
- ✅ Input validation
- ✅ XSS protection
- ✅ CSRF protection

---

## 🧪 Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← Playwright (Planned)
        │   (10%)     │
        └─────────────┘
       ┌───────────────┐
       │  Integration  │  ← React Testing Library
       │    (30%)      │
       └───────────────┘
      ┌─────────────────┐
      │   Unit Tests    │  ← Vitest
      │     (60%)       │
      └─────────────────┘
```

**Current Status**:

- ✅ Vitest configured
- ✅ Test files created (formatters, logger, currency)
- ⚠️ Module resolution issues (in progress)
- 📋 Target: 40%+ coverage

---

## 🚀 CI/CD Pipeline

### Workflow

```
Developer Push
    │
    ▼
GitHub Actions Triggered
    │
    ├─► ESLint Check
    │
    ├─► TypeScript Compilation
    │
    ├─► Unit Tests
    │
    ├─► Build Verification
    │
    └─► Security Audit
         │
         ▼
    All Checks Pass?
         │
         ├─► Yes → Deploy Preview (PR)
         │         │
         │         └─► Vercel Preview URL
         │
         └─► No → Block Merge
```

---

## 📦 Build & Deployment

### Build Process

```bash
# Development
npm run dev          # Vite dev server

# Production
npm run build        # TypeScript + Vite build
npm run preview      # Preview production build
```

### Deployment Targets

- **Frontend**: Vercel (recommended) or Firebase Hosting
- **Backend**: Firebase Cloud Functions
- **Database**: Firebase Firestore

---

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env`):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Backend** (`.env`):

```env
FIREBASE_PROJECT_ID=
MISTRAL_API_KEY=
```

---

## 📈 Monitoring & Observability

### Metrics Tracked

1. **Performance**

   - Web Vitals (CLS, FID, LCP, etc.)
   - Bundle size
   - Load times

2. **Errors**

   - Error boundaries
   - Logger integration
   - Ready for Sentry

3. **Usage**
   - Feature adoption
   - User flows
   - Ready for Google Analytics

---

## 🔄 Future Architecture Plans

### Planned Improvements

1. **Microservices** (if needed)

   - Separate services for AI, reports, notifications
   - API Gateway pattern

2. **Caching Layer**

   - Redis for frequently accessed data
   - Service Worker for offline support

3. **Real-time Features**

   - WebSocket for live collaboration
   - Firestore real-time listeners

4. **Mobile App**
   - React Native
   - Shared business logic

---

## 📚 Additional Resources

- [Frontend README](../frontend/README.md)
- [Backend README](../backend/README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [CI/CD Documentation](../.github/workflows/README.md)

---

**Last Updated**: January 2026  
**Architecture Version**: 2.0
