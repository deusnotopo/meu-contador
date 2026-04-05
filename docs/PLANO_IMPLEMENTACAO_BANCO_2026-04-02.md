# PLANO DE IMPLEMENTAÇÃO - MELHORIAS DO BANCO DE DADOS
**Data:** 2 de Abril de 2026  
**Baseado em:** AUDITORIA_BANCO_DADOS_2026-04-02.md  
**Score Atual:** 7.3/10 → **Meta:** 9.5/10

---

## 📋 VISÃO GERAL DO PLANO

### Cronograma de Implementação
```
Fase 1 (Semanas 1-2): Correções Críticas de Segurança
Fase 2 (Semanas 3-4): Otimização de Schema e Tipos
Fase 3 (Semanas 5-6): Performance e Índices
Fase 4 (Semanas 7-8): Compliance e Monitoramento
```

### Recursos Necessários
- **Desenvolvedor Backend:** 1 pessoa, 80h
- **DBA/DevOps:** 1 pessoa, 20h (suporte)
- **Ambiente de Testes:** Database PostgreSQL de staging
- **Ferramentas:** Prisma Studio, pgAdmin, scripts de migration

---

## 🔴 FASE 1: CORREÇÕES CRÍTICAS (Semanas 1-2)

### 1.1 Migrar Float para Decimal
**Prioridade:** CRÍTICA  
**Impacto:** Previne erros de arredondamento monetário  
**Risco:** Alto (dados financeiros incorretos)

#### Passo 1: Criar Migration
```prisma
// backend/prisma/migrations/YYYYMMDD_float_to_decimal/migration.sql

-- Transaction
ALTER TABLE "Transaction" 
ALTER COLUMN "amount" TYPE DECIMAL(15,2);

ALTER TABLE "Transaction" 
ALTER COLUMN "originalAmount" TYPE DECIMAL(15,2);

ALTER TABLE "Transaction" 
ALTER COLUMN "exchangeRate" TYPE DECIMAL(10,6);

-- Budget
ALTER TABLE "Budget" 
ALTER COLUMN "limit" TYPE DECIMAL(15,2);

ALTER TABLE "Budget" 
ALTER COLUMN "spent" TYPE DECIMAL(15,2);

-- SavingsGoal
ALTER TABLE "SavingsGoal" 
ALTER COLUMN "targetAmount" TYPE DECIMAL(15,2);

ALTER TABLE "SavingsGoal" 
ALTER COLUMN "currentAmount" TYPE DECIMAL(15,2);

-- Investment
ALTER TABLE "Investment" 
ALTER COLUMN "amount" TYPE DECIMAL(18,8);

ALTER TABLE "Investment" 
ALTER COLUMN "averagePrice" TYPE DECIMAL(15,2);

ALTER TABLE "Investment" 
ALTER COLUMN "currentPrice" TYPE DECIMAL(15,2);

ALTER TABLE "Investment" 
ALTER COLUMN "targetAllocation" TYPE DECIMAL(5,2);

-- Debt
ALTER TABLE "Debt" 
ALTER COLUMN "balance" TYPE DECIMAL(15,2);

ALTER TABLE "Debt" 
ALTER COLUMN "interestRate" TYPE DECIMAL(5,4);

ALTER TABLE "Debt" 
ALTER COLUMN "minPayment" TYPE DECIMAL(15,2);

-- Invoice
ALTER TABLE "Invoice" 
ALTER COLUMN "amount" TYPE DECIMAL(15,2);

-- BillReminder
ALTER TABLE "BillReminder" 
ALTER COLUMN "amount" TYPE DECIMAL(15,2);

-- BankAccount
ALTER TABLE "BankAccount" 
ALTER COLUMN "balance" TYPE DECIMAL(15,2);

-- Dividend
ALTER TABLE "Dividend" 
ALTER COLUMN "amount" TYPE DECIMAL(15,2);

-- InvestmentSale
ALTER TABLE "InvestmentSale" 
ALTER COLUMN "amount" TYPE DECIMAL(18,8);

ALTER TABLE "InvestmentSale" 
ALTER COLUMN "price" TYPE DECIMAL(15,2);

ALTER TABLE "InvestmentSale" 
ALTER COLUMN "totalValue" TYPE DECIMAL(15,2);

-- User
ALTER TABLE "User" 
ALTER COLUMN "monthlyIncome" TYPE DECIMAL(15,2);

ALTER TABLE "User" 
ALTER COLUMN "initialBalance" TYPE DECIMAL(15,2);
```

#### Passo 2: Atualizar Schema Prisma
```prisma
// backend/prisma/schema.prisma

model Transaction {
  // ... outros campos ...
  amount         Decimal   @db.Decimal(15, 2)
  originalAmount Decimal?  @db.Decimal(15, 2)
  exchangeRate   Decimal?  @db.Decimal(10, 6)
}

model Budget {
  // ... outros campos ...
  limit  Decimal @db.Decimal(15, 2)
  spent  Decimal @db.Decimal(15, 2) @default(0)
}

// Repetir para todos os models...
```

#### Passo 3: Atualizar Código TypeScript
```typescript
// backend/src/routes/transactions.ts

// ANTES
amount: z.number().finite()

// DEPOIS
amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
  message: "Amount must be a positive number"
})
```

#### Passo 4: Testes
```typescript
// backend/src/routes/transactions.test.ts

it('should handle decimal precision correctly', async () => {
  const transaction = await db.transaction.create({
    data: {
      description: 'Test',
      amount: new Prisma.Decimal('1234.56'),
      type: 'expense',
      category: 'test',
      date: new Date(),
      scope: 'personal',
      userId: testUser.id,
    },
  });
  
  expect(transaction.amount.toString()).toBe('1234.56');
});
```

**Checklist:**
- [ ] Criar migration SQL
- [ ] Atualizar schema.prisma
- [ ] Executar `prisma migrate dev`
- [ ] Atualizar validações Zod
- [ ] Atualizar tipos TypeScript
- [ ] Executar testes
- [ ] Verificar dados existentes
- [ ] Deploy em staging
- [ ] Deploy em produção

**Estimativa:** 8 horas

---

### 1.2 Criar Enums para Campos Categóricos
**Prioridade:** CRÍTICA  
**Impacto:** Previne inconsistências de dados

#### Enums a Criar
```prisma
// backend/prisma/schema.prisma

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

enum TransactionCategory {
  ALIMENTACAO
  TRANSPORTE
  MORADIA
  SAUDE
  EDUCACAO
  LAZER
  VESTUARIO
  SERVICOS
  INVESTIMENTO
  TRANSFERENCIA
  OUTROS
}

enum PaymentMethod {
  DINHEIRO
  CARTAO_CREDITO
  CARTAO_DEBITO
  PIX
  BOLETO
  TRANSFERENCIA
  DEPOSITO
  OUTROS
}

enum Scope {
  PERSONAL
  BUSINESS
}

enum Classification {
  NECESSITY
  WANT
  INVESTMENT
  DEBT
}

enum RecurrenceInterval {
  WEEKLY
  BIWEEKLY
  MONTHLY
  YEARLY
}

enum InvestmentType {
  STOCK
  FII
  CRYPTO
  FIXED_INCOME
  ETF
  BOND
  OTHER
}

enum DividendType {
  DIVIDEND
  JCP
}

enum DebtCategory {
  CREDIT_CARD
  LOAN
  MORTGAGE
  PERSONAL
  STUDENT
  TAX
  OTHER
}

enum BillRecurring {
  ONCE
  WEEKLY
  MONTHLY
  YEARLY
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
  PARTIALLY_PAID
}

enum BankAccountType {
  CHECKING
  SAVINGS
  CREDIT_CARD
  INVESTMENT
  LOAN
}

enum ConnectionStatus {
  UPDATING
  UPDATED
  LOGIN_ERROR
  WAITING_USER_INPUT
  EXPIRED
}

enum EmploymentType {
  CLT
  PJ
  AUTONOMO
  EMPRESARIO
  ESTAGIARIO
  OUTROS
}

enum RiskProfile {
  CONSERVADOR
  MODERADO
  ARROJADO
  MUITO_ARROJADO
}

enum FinancialGoal {
  SAVE
  INVEST
  PAY_DEBT
  GROW_WEALTH
  EMERGENCY_FUND
  RETIREMENT
  OTHER
}
```

#### Migration para Converter Dados
```sql
-- Criar colunas temporárias
ALTER TABLE "Transaction" ADD COLUMN "type_new" VARCHAR(20);
ALTER TABLE "Transaction" ADD COLUMN "category_new" VARCHAR(20);
ALTER TABLE "Transaction" ADD COLUMN "paymentMethod_new" VARCHAR(20);
ALTER TABLE "Transaction" ADD COLUMN "scope_new" VARCHAR(20);

-- Migrar dados existentes
UPDATE "Transaction" SET 
  type_new = CASE 
    WHEN type = 'income' THEN 'INCOME'
    WHEN type = 'expense' THEN 'EXPENSE'
    ELSE 'EXPENSE'
  END,
  category_new = CASE
    WHEN category IN ('alimentacao', 'food', 'Alimentação') THEN 'ALIMENTACAO'
    WHEN category IN ('transporte', 'transport', 'Transporte') THEN 'TRANSPORTE'
    WHEN category IN ('moradia', 'housing', 'Moradia') THEN 'MORADIA'
    WHEN category IN ('saude', 'health', 'Saúde') THEN 'SAUDE'
    WHEN category IN ('educacao', 'education', 'Educação') THEN 'EDUCACAO'
    WHEN category IN ('lazer', 'entertainment', 'Lazer') THEN 'LAZER'
    WHEN category IN ('vestuario', 'clothing', 'Vestuário') THEN 'VESTUARIO'
    WHEN category IN ('servicos', 'services', 'Serviços') THEN 'SERVICOS'
    WHEN category IN ('investimento', 'investment', 'Investimento') THEN 'INVESTIMENTO'
    ELSE 'OUTROS'
  END,
  scope_new = CASE
    WHEN scope = 'personal' THEN 'PERSONAL'
    WHEN scope = 'business' THEN 'BUSINESS'
    ELSE 'PERSONAL'
  END;

-- Remover colunas antigas
ALTER TABLE "Transaction" DROP COLUMN type;
ALTER TABLE "Transaction" DROP COLUMN category;
ALTER TABLE "Transaction" DROP COLUMN paymentMethod;
ALTER TABLE "Transaction" DROP COLUMN scope;

-- Renomear novas colunas
ALTER TABLE "Transaction" RENAME COLUMN type_new TO type;
ALTER TABLE "Transaction" RENAME COLUMN category_new TO category;
ALTER TABLE "Transaction" RENAME COLUMN paymentMethod_new TO "paymentMethod";
ALTER TABLE "Transaction" RENAME COLUMN scope_new TO scope;
```

**Checklist:**
- [ ] Adicionar enums ao schema
- [ ] Criar migration para converter dados
- [ ] Executar migration
- [ ] Atualizar código para usar enums
- [ ] Atualizar validações Zod
- [ ] Executar testes
- [ ] Verificar dados migrados

**Estimativa:** 6 horas

---

### 1.3 Implementar Soft Delete
**Prioridade:** CRÍTICA  
**Impacto:** Compliance LGPD, recuperação de dados

#### Adicionar Campos deletedAt
```prisma
// backend/prisma/schema.prisma

model User {
  // ... outros campos ...
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Transaction {
  // ... outros campos ...
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Budget {
  // ... outros campos ...
  deletedAt DateTime?
  
  @@index([deletedAt])
}

// Repetir para todos os models que precisam de soft delete...
```

#### Implementar Middleware Prisma
```typescript
// backend/src/lib/prisma-soft-delete.ts

import { Prisma } from '@prisma/client';

export function softDeleteMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Intercept delete operations
    if (params.action === 'delete') {
      // Change to update with deletedAt
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }
    
    // Intercept deleteMany operations
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args.data = { deletedAt: new Date() };
    }
    
    // Filter out soft-deleted records on find operations
    if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
      if (!params.args.where) {
        params.args.where = {};
      }
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
    
    return next(params);
  };
}

// backend/src/lib/db.ts

import { PrismaClient } from '@prisma/client';
import { softDeleteMiddleware } from './prisma-soft-delete';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Apply soft delete middleware
db.$use(softDeleteMiddleware());
```

#### Implementar Restore Endpoint
```typescript
// backend/src/routes/user.ts

app.post('/user/restore/:id', {
  schema: {
    tags: ['User'],
    security: [{ bearerAuth: [] }],
    params: z.object({ id: z.string().uuid() }),
    response: {
      200: z.object({ success: z.boolean(), message: z.string() }),
      404: z.object({ message: z.string() }),
    },
  },
  preHandler: [(app as any).authenticate],
}, async (request, reply) => {
  const userId = (request.user as any).id;
  const { id } = request.params as { id: string };

  const user = await db.user.findFirst({
    where: { id, deletedAt: { not: null } },
  });

  if (!user) {
    return reply.status(404).send({ message: 'User not found or not deleted' });
  }

  await db.user.update({
    where: { id },
    data: { deletedAt: null },
  });

  return { success: true, message: 'User restored successfully' };
});
```

**Checklist:**
- [ ] Adicionar deletedAt a todos os models
- [ ] Criar middleware de soft delete
- [ ] Registrar middleware no db.ts
- [ ] Criar endpoint de restore
- [ ] Atualizar queries para filtrar deletedAt
- [ ] Executar testes
- [ ] Documentar comportamento

**Estimativa:** 6 horas

---

### 1.4 Corrigir onDelete em Dividend/InvestmentSale
**Prioridade:** CRÍTICA  
**Impacto:** Integridade referencial

```prisma
// backend/prisma/schema.prisma

model Dividend {
  // ... outros campos ...
  investment   Investment @relation(fields: [investmentId], references: [id], onDelete: Cascade)
}

model InvestmentSale {
  // ... outros campos ...
  investment   Investment @relation(fields: [investmentId], references: [id], onDelete: Cascade)
}
```

**Migration:**
```sql
-- Dividend
ALTER TABLE "Dividend" 
DROP CONSTRAINT "Dividend_investmentId_fkey";

ALTER TABLE "Dividend" 
ADD CONSTRAINT "Dividend_investmentId_fkey" 
FOREIGN KEY ("investmentId") 
REFERENCES "Investment"("id") 
ON DELETE CASCADE;

-- InvestmentSale
ALTER TABLE "InvestmentSale" 
DROP CONSTRAINT "InvestmentSale_investmentId_fkey";

ALTER TABLE "InvestmentSale" 
ADD CONSTRAINT "InvestmentSale_investmentId_fkey" 
FOREIGN KEY ("investmentId") 
REFERENCES "Investment"("id") 
ON DELETE CASCADE;
```

**Checklist:**
- [ ] Atualizar schema
- [ ] Criar migration
- [ ] Executar migration
- [ ] Testar deleção em cascata

**Estimativa:** 2 horas

---

## 🟡 FASE 2: OTIMIZAÇÃO DE SCHEMA (Semanas 3-4)

### 2.1 Adicionar Timestamps Ausentes
**Prioridade:** ALTA  
**Impacto:** Auditoria e rastreabilidade

```prisma
model Budget {
  // ... outros campos ...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}

model SavingsGoal {
  // ... outros campos ...
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?
  deletedAt   DateTime?
}

model BillReminder {
  // ... outros campos ...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  paidAt    DateTime?
  deletedAt DateTime?
}

model Invoice {
  // ... outros campos ...
  updatedAt DateTime @updatedAt
  paidAt    DateTime?
  deletedAt DateTime?
}

model Debt {
  // ... outros campos ...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}

model Investment {
  // ... outros campos ...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}
```

**Estimativa:** 3 horas

---

### 2.2 Adicionar Constraints CHECK
**Prioridade:** ALTA  
**Impacto:** Integridade de dados

```prisma
model Transaction {
  // ... outros campos ...
  
  @@check(amount > 0, "amount_positive")
}

model Budget {
  // ... outros campos ...
  
  @@check(limit > 0, "limit_positive")
  @@check(spent >= 0, "spent_non_negative")
}

model SavingsGoal {
  // ... outros campos ...
  
  @@check(targetAmount > 0, "target_positive")
  @@check(currentAmount >= 0, "current_non_negative")
}

model Investment {
  // ... outros campos ...
  
  @@check(amount > 0, "amount_positive")
  @@check(averagePrice > 0, "avg_price_positive")
  @@check(currentPrice > 0, "current_price_positive")
}

model Debt {
  // ... outros campos ...
  
  @@check(balance >= 0, "balance_non_negative")
  @@check(interestRate >= 0, "interest_non_negative")
  @@check(minPayment >= 0, "min_payment_non_negative")
}

model Invoice {
  // ... outros campos ...
  
  @@check(amount > 0, "amount_positive")
}
```

**Migration:**
```sql
ALTER TABLE "Transaction" 
ADD CONSTRAINT "amount_positive" CHECK (amount > 0);

ALTER TABLE "Budget" 
ADD CONSTRAINT "limit_positive" CHECK (limit > 0);

ALTER TABLE "Budget" 
ADD CONSTRAINT "spent_non_negative" CHECK (spent >= 0);

-- Repetir para outras tabelas...
```

**Estimativa:** 2 horas

---

### 2.3 Adicionar Unique Constraints
**Prioridade:** ALTA  
**Impacto:** Previne duplicatas

```prisma
model Investment {
  // ... outros campos ...
  
  @@unique([userId, ticker, type], name: "unique_user_investment")
}

model Invoice {
  // ... outros campos ...
  
  @@unique([workspaceId, number], name: "unique_workspace_invoice")
}
```

**Estimativa:** 1 hora

---

### 2.4 Validar JSON Fields
**Prioridade:** MÉDIA  
**Impacto:** Consistência de dados

```typescript
// backend/src/lib/schemas/user-preferences.ts

import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.enum(['pt', 'en', 'es']),
  privacyMode: z.boolean(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }).optional(),
  currency: z.string().length(3).default('BRL'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// backend/src/routes/user.ts

app.patch('/user/preferences', {
  schema: {
    body: UserPreferencesSchema,
  },
}, async (request, reply) => {
  const userId = (request.user as any).id;
  const preferences = request.body;

  // Validate before saving
  const validated = UserPreferencesSchema.parse(preferences);

  await db.user.update({
    where: { id: userId },
    data: { preferences: validated },
  });

  return { success: true };
});
```

**Estimativa:** 3 horas

---

## 🟢 FASE 3: PERFORMANCE (Semanas 5-6)

### 3.1 Adicionar Índices Faltantes
**Prioridade:** MÉDIA  
**Impacto:** Performance de queries

```prisma
model User {
  // ... outros campos ...
  
  @@index([createdAt])
  @@index([email, deletedAt])
}

model SavingsGoal {
  // ... outros campos ...
  
  @@index([userId, status])
  @@index([userId, targetAmount])
}

model Debt {
  // ... outros campos ...
  
  @@index([userId, category])
  @@index([userId, balance])
  @@index([userId, interestRate])
}

model BankAccount {
  // ... outros campos ...
  
  @@index([userId, type])
  @@index([userId, balance])
}
```

**Estimativa:** 2 horas

---

### 3.2 Implementar DataLoader
**Prioridade:** MÉDIA  
**Impacto:** Resolve N+1 queries

```typescript
// backend/src/lib/dataloader.ts

import DataLoader from 'dataloader';
import { db } from './db';

// Batch load users
export const userLoader = new DataLoader(async (userIds: readonly string[]) => {
  const users = await db.user.findMany({
    where: { id: { in: [...userIds] } },
  });
  
  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id) || null);
});

// Batch load transactions
export const transactionLoader = new DataLoader(async (userIds: readonly string[]) => {
  const transactions = await db.transaction.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
    orderBy: { date: 'desc' },
  });
  
  const grouped = new Map<string, typeof transactions>();
  transactions.forEach(t => {
    if (!grouped.has(t.userId)) {
      grouped.set(t.userId, []);
    }
    grouped.get(t.userId)!.push(t);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// backend/src/routes/dashboard.ts

import { userLoader, transactionLoader } from '../lib/dataloader';

app.get('/dashboard', async (request, reply) => {
  const userId = (request.user as any).id;
  
  // Antes: 2 queries separadas
  // const user = await db.user.findUnique({ where: { id: userId } });
  // const transactions = await db.transaction.findMany({ where: { userId } });
  
  // Depois: queries otimizadas com DataLoader
  const [user, transactions] = await Promise.all([
    userLoader.load(userId),
    transactionLoader.load(userId),
  ]);
  
  return { user, transactions };
});
```

**Estimativa:** 4 horas

---

### 3.3 Implementar Paginação com Cursor
**Prioridade:** MÉDIA  
**Impacto:** Performance para grandes datasets

```typescript
// backend/src/routes/transactions.ts

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  scope: z.enum(['personal', 'business']).optional(),
});

app.get('/transactions', {
  schema: {
    querystring: paginationSchema,
  },
}, async (request, reply) => {
  const userId = (request.user as any).id;
  const { cursor, limit, scope } = request.query as z.infer<typeof paginationSchema>;

  const where: any = {
    userId,
    deletedAt: null,
    ...(scope ? { scope } : {}),
  };

  if (cursor) {
    where.id = { lt: cursor };
  }

  const items = await db.transaction.findMany({
    where,
    orderBy: { id: 'desc' },
    take: limit + 1, // Fetch one extra to check if there's more
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    items: data,
    nextCursor,
    hasMore,
  };
});
```

**Estimativa:** 3 horas

---

## 🔵 FASE 4: COMPLIANCE E MONITORAMENTO (Semanas 7-8)

### 4.1 Implementar Data Export (LGPD)
**Prioridade:** MÉDIA  
**Impacto:** Compliance legal

```typescript
// backend/src/routes/user.ts

app.get('/user/export', {
  schema: {
    tags: ['User'],
    security: [{ bearerAuth: [] }],
  },
  preHandler: [(app as any).authenticate],
}, async (request, reply) => {
  const userId = (request.user as any).id;

  const userData = await db.user.findUnique({
    where: { id: userId },
    include: {
      transactions: true,
      budgets: true,
      goals: true,
      investments: true,
      debts: true,
      reminders: true,
    },
  });

  // Remove sensitive fields
  const { passwordHash, ...exportData } = userData;

  // Log export for audit
  await db.auditLog.create({
    data: {
      userId,
      action: 'DATA_EXPORT',
      resource: 'user',
      resourceId: userId,
      metadata: { exportedAt: new Date().toISOString() },
    },
  });

  reply.header('Content-Type', 'application/json');
  reply.header('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
  
  return exportData;
});
```

**Estimativa:** 3 horas

---

### 4.2 Implementar Connection Pool Monitoring
**Prioridade:** MÉDIA  
**Impacto:** Observabilidade

```typescript
// backend/src/lib/db-monitor.ts

import { db } from './db';

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}

export async function getPoolMetrics(): Promise<PoolMetrics> {
  const result = await db.$queryRaw`
    SELECT 
      count(*) as total,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle
    FROM pg_stat_activity 
    WHERE datname = current_database()
  ` as any[];

  return {
    totalConnections: parseInt(result[0].total),
    activeConnections: parseInt(result[0].active),
    idleConnections: parseInt(result[0].idle),
    waitingClients: 0, // Would need to query pool-specific metrics
  };
}

// backend/src/routes/health.ts

app.get('/health/detailed', async (request, reply) => {
  const startTime = Date.now();
  
  // Database check
  await db.$queryRaw`SELECT 1`;
  const dbResponseTime = Date.now() - startTime;
  
  // Pool metrics
  const poolMetrics = await getPoolMetrics();
  
  // Memory usage
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: 'connected',
      responseTimeMs: dbResponseTime,
      pool: poolMetrics,
    },
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
  };
});
```

**Estimativa:** 2 horas

---

### 4.3 Configurar Slow Query Logging
**Prioridade:** BAIXA  
**Impacto:** Debug de performance

```typescript
// backend/src/lib/db.ts

import { PrismaClient } from '@prisma/client';

const SLOW_QUERY_THRESHOLD = 1000; // 1 second

export const db = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
  ],
});

// Log slow queries
db.$on('query', (e) => {
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    console.warn(`[SLOW QUERY] ${e.duration}ms`, {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
    
    // Optionally send to monitoring service
    // sendToMonitoring({ type: 'slow_query', ...e });
  }
});
```

**Estimativa:** 2 horas

---

### 4.4 Implementar Backup Automation
**Prioridade:** BAIXA  
**Impacto:** Disaster recovery

```typescript
// backend/src/workers/backup-worker.ts

import { db } from '../lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

export async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = `/tmp/${filename}`;

  try {
    // Extract connection details from DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL!);
    
    // Create backup using pg_dump
    await execAsync(
      `pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f ${filepath}`,
      { env: { ...process.env, PGPASSWORD: dbUrl.password } }
    );

    // Upload to S3 or other storage
    // await uploadToS3(filepath, filename);

    // Log backup
    await db.auditLog.create({
      data: {
        action: 'BACKUP_CREATED',
        resource: 'database',
        metadata: { filename, timestamp: new Date().toISOString() },
      },
    });

    // Clean up local file
    fs.unlinkSync(filepath);

    return { success: true, filename };
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

// Schedule daily backup
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled backup...');
  try {
    await createBackup();
    console.log('Backup completed successfully');
  } catch (error) {
    console.error('Backup failed:', error);
  }
});
```

**Estimativa:** 3 horas

---

## 📊 RESUMO DE ESTIMATIVAS

### Por Fase
| Fase | Duração | Horas |
|------|---------|-------|
| Fase 1: Correções Críticas | Semanas 1-2 | 22h |
| Fase 2: Otimização Schema | Semanas 3-4 | 9h |
| Fase 3: Performance | Semanas 5-6 | 9h |
| Fase 4: Compliance | Semanas 7-8 | 10h |
| **Total** | **8 semanas** | **50h** |

### Por Prioridade
| Prioridade | Tarefas | Horas |
|------------|---------|-------|
| 🔴 CRÍTICA | 4 | 22h |
| 🟡 ALTA | 3 | 6h |
| 🟢 MÉDIA | 4 | 12h |
| 🔵 BAIXA | 3 | 7h |
| **Total** | **14** | **47h** |

---

## 🚀 CHECKLIST DE DEPLOY

### Pré-Deploy
- [ ] Todos os testes passando
- [ ] Migration testada em staging
- [ ] Backup realizado
- [ ] Rollback plan documentado
- [ ] Monitoramento configurado

### Deploy
- [ ] Executar migration em produção
- [ ] Verificar logs de erro
- [ ] Testar endpoints críticos
- [ ] Monitorar performance
- [ ] Verificar métricas de banco

### Pós-Deploy
- [ ] Monitorar por 24h
- [ ] Verificar alertas
- [ ] Coletar feedback
- [ ] Documentar issues
- [ ] Planejar próxima fase

---

## 📈 MÉTRICAS DE SUCESSO

### Técnicas
- **Score do Banco:** 7.3/10 → 9.5/10
- **Query Performance:** < 100ms para 95% das queries
- **Uptime:** 99.9%
- **Backup Success Rate:** 100%

### Negócio
- **Zero** erros de arredondamento monetário
- **Zero** inconsistências de dados
- **100%** compliance LGPD
- **< 1s** tempo de resposta do dashboard

---

*Plano criado em 02/04/2026*