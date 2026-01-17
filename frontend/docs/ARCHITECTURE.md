# System Architecture

## Overview

My Accountant (Meu Contador) is a **Progressive Web Application (PWA)** built for high-performance financial management. It follows a **Service-Oriented Frontend Architecture**.

## High-Level Design

```mermaid
graph TD
    User[User] -->|Interacts| UI[UI Layer (React/Vite)]
    UI -->|State Updates| Context[Context Layer]
    Context -->|Business Logic| Hooks[Custom Hooks]
    Hooks -->|Data Persistence| Storage[Storage Layer]
    Storage -->|Sync| Firebase[Firebase Cloud]
    Storage -->|Cache| LocalStorage[Local Storage]
```

## Component Architecture

The application is transitioning to a **Feature-Based Structure** to ensure scalability.

```mermaid
classDiagram
    class App {
        +RouterProvider
        +GlobalErrorBoundary
        +AuthProvider
    }
    class AuthProvider {
        +User user
        +login()
        +logout()
        +syncState()
    }
    class PersonalFinance {
        +Transactions[]
        +Budgets[]
    }
    class BusinessFinance {
        +Invoices[]
        +DRE_Reports
        +CashFlow
    }

    App *-- AuthProvider
    AuthProvider *-- PersonalFinance
    AuthProvider *-- BusinessFinance
```

## Data Flow (Optimistic UI)

We use an **Optimistic UI** pattern. Actions (like adding a transaction) update the local state immediately, allowing for instant feedback, while the synchronization with Firebase happens in the background.

```mermaid
sequenceDiagram
    participant User
    participant UI as Component
    participant State as Local State
    participant Cloud as Firebase

    User->>UI: Adds Transaction
    UI->>State: Update Local List
    UI->>User: Show Success Toast
    State->>Cloud: Sync Data (Background)
    Cloud-->>State: Confirm / Reject
```

## Tech Stack

- **Core**: React 18, TypeScript 5, Vite
- **Styling**: Tailwind CSS, Shadcn/UI (Radix Primitives)
- **State**: React Context + Custom Hooks
- **Backend/Auth**: Firebase (Auth, Firestore)
- **Visuals**: Framer Motion
