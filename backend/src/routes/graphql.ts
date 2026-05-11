import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  buildSchema,
  graphql,
  GraphQLError,
} from 'graphql';
import { db } from '../lib/db.js';
import * as TransactionService from '../services/TransactionService.js';
import type { CreateTransactionInput, UpdateTransactionInput } from '../services/TransactionService.js';
import * as BudgetService from '../services/BudgetService.js';
import * as GoalService from '../services/GoalService.js';
import * as InvestmentService from '../services/InvestmentService.js';
import * as InvoiceService from '../services/InvoiceService.js';
import * as ReminderService from '../services/ReminderService.js';
import * as UserService from '../services/UserService.js';

// ── Types ──────────────────────────────────────────────────────────────────

interface GraphQLContext {
  userId: string;
  isPro: boolean;
  app: FastifyInstance;
}

// ── Schema ─────────────────────────────────────────────────────────────────

const typeDefs = `
  type Query {
    transactions(page: Int, limit: Int, scope: String): TransactionList!
    transaction(id: ID!): Transaction
    budgets(month: String): [Budget!]!
    goals: [Goal!]!
    investments: [Investment!]!
    debts: [Debt!]!
    invoices: [Invoice!]!
    reminders: [Reminder!]!
    user: User!
    health: HealthStatus!
  }

  type Mutation {
    createTransaction(input: TransactionInput!): Transaction!
    updateTransaction(id: ID!, input: TransactionUpdateInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
    
    createBudget(input: BudgetInput!): Budget!
    updateBudget(id: ID!, input: BudgetUpdateInput!): Budget!
    deleteBudget(id: ID!): Boolean!
    
    createGoal(input: GoalInput!): Goal!
    updateGoal(id: ID!, input: GoalUpdateInput!): Goal!
    deleteGoal(id: ID!): Boolean!
    
    createInvoice(input: InvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: InvoiceUpdateInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
    
    createReminder(input: ReminderInput!): Reminder!
    updateReminder(id: ID!, input: ReminderUpdateInput!): Reminder!
    deleteReminder(id: ID!): Boolean!
  }

  type TransactionList {
    items: [Transaction!]!
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type Transaction {
    id: ID!
    type: String!
    description: String!
    amount: Float!
    category: String!
    date: String!
    scope: String!
    paymentMethod: String
    notes: String
    recurring: Boolean!
    recurrenceInterval: String
    classification: String
    currency: String!
    receiptUrl: String
    createdAt: String!
  }

  type Budget {
    id: ID!
    category: String!
    limit: Float!
    spent: Float!
    month: String!
    createdAt: String!
  }

  type Goal {
    id: ID!
    name: String!
    targetAmount: Float!
    currentAmount: Float!
    deadline: String!
    icon: String
    color: String
    createdAt: String!
  }

  type Investment {
    id: ID!
    name: String!
    ticker: String!
    type: String!
    amount: Float!
    averagePrice: Float!
    currentPrice: Float!
    currency: String!
    sector: String
    targetAllocation: Float
    lastUpdate: String!
  }

  type Debt {
    id: ID!
    name: String!
    balance: Float!
    interestRate: Float!
    minPayment: Float!
    dueDate: String
    category: String!
    createdAt: String!
  }

  type Invoice {
    id: ID!
    number: String!
    client: String!
    amount: Float!
    dueDate: String!
    status: String!
    createdAt: String!
  }

  type Reminder {
    id: ID!
    name: String!
    amount: Float!
    dueDate: String!
    category: String!
    isPaid: Boolean!
    recurring: String!
    createdAt: String!
  }

  type User {
    id: ID!
    email: String!
    name: String
    monthlyIncome: Float
    financialGoal: String
    riskProfile: String
    isPro: Boolean!
    onboardingCompleted: Boolean!
  }

  type HealthStatus {
    status: String!
    timestamp: String!
    version: String!
    uptime: Float!
    database: DatabaseStatus!
  }

  type DatabaseStatus {
    status: String!
    responseTimeMs: Int
  }

  input TransactionInput {
    type: String!
    description: String!
    amount: Float!
    category: String!
    date: String!
    scope: String!
    paymentMethod: String
    notes: String
    recurring: Boolean
    recurrenceInterval: String
    classification: String
    currency: String
    receiptUrl: String
  }

  input TransactionUpdateInput {
    type: String
    description: String
    amount: Float
    category: String
    date: String
    scope: String
    paymentMethod: String
    notes: String
    recurring: Boolean
    recurrenceInterval: String
    classification: String
    currency: String
    receiptUrl: String
  }

  input BudgetInput {
    category: String!
    limit: Float!
    month: String!
  }

  input BudgetUpdateInput {
    limit: Float
  }

  input GoalInput {
    name: String!
    targetAmount: Float!
    deadline: String!
    icon: String
    color: String
  }

  input GoalUpdateInput {
    name: String
    targetAmount: Float
    currentAmount: Float
    deadline: String
    icon: String
    color: String
  }

  input InvoiceInput {
    number: String!
    client: String!
    amount: Float!
    dueDate: String!
    status: String
  }

  input InvoiceUpdateInput {
    number: String
    client: String
    amount: Float
    dueDate: String
    status: String
  }

  input ReminderInput {
    name: String!
    amount: Float!
    dueDate: String!
    category: String!
    isPaid: Boolean
    recurring: String
  }

  input ReminderUpdateInput {
    name: String
    amount: Float
    dueDate: String
    category: String
    isPaid: Boolean
    recurring: String
  }
`;

const schema = buildSchema(typeDefs);

// ── Resolvers ──────────────────────────────────────────────────────────────

function proGuard(isPro: boolean): void {
  if (!isPro) {
    throw new GraphQLError(
      '👑 RECURSO PREMIUM: Esta funcionalidade exige o plano PRO. Faça o upgrade para continuar.',
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
}

function createRootValue(ctx: GraphQLContext) {
  const { userId, isPro, app } = ctx;

  return {
    // ── Queries ──
    transactions: async ({ page = 1, limit = 20, scope }: { page?: number; limit?: number; scope?: string }) => {
      return TransactionService.listTransactions(userId, { page, limit, scope: scope as 'personal' | 'business' | undefined });
    },

    transaction: async ({ id }: { id: string }) => {
      const tx = await TransactionService.getTransaction(id, userId);
      if (!tx) return null;
      return { ...tx, amount: (tx.amount as number) / 100 };
    },

    budgets: async ({ month }: { month?: string }) => {
      const result = await BudgetService.listBudgets(userId, { month, page: 1, limit: 100 });
      return (result as { items: unknown[] }).items || result;
    },

    goals: async () => {
      const result = await GoalService.listGoals(userId, { page: 1, limit: 100 });
      return (result as { items: unknown[] }).items || result;
    },

    investments: async () => {
      proGuard(isPro);
      const result = await InvestmentService.listInvestments(userId, { page: 1, limit: 100 });
      return (result as { items: unknown[] }).items || result;
    },

    debts: async () => {
      return db.debt.findMany({ where: { userId }, orderBy: { dueDate: 'asc' } });
    },

    invoices: async () => {
      proGuard(isPro);
      return InvoiceService.listInvoices(userId);
    },

    reminders: async () => {
      return ReminderService.listReminders(userId);
    },

    user: async () => {
      const user = await UserService.getUserProfile(userId);
      if (!user) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      return user;
    },

    health: async () => {
      const startTime = Date.now();
      await db.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0-enterprise',
        uptime: process.uptime(),
        database: { status: 'connected', responseTimeMs: Date.now() - startTime },
      };
    },

    // ── Mutations ──
    createTransaction: async ({ input }: { input: CreateTransactionInput }) => {
      return TransactionService.createTransaction(userId, input, app);
    },

    updateTransaction: async ({ id, input }: { id: string; input: UpdateTransactionInput }) => {
      return TransactionService.updateTransaction(id, userId, input);
    },

    deleteTransaction: async ({ id }: { id: string }) => {
      await TransactionService.deleteTransaction(id, userId);
      return true;
    },

    createBudget: async ({ input }: { input: Parameters<typeof BudgetService.createBudget>[1] }) => {
      return BudgetService.createBudget(userId, input);
    },

    updateBudget: async ({ id, input }: { id: string; input: Parameters<typeof BudgetService.updateBudget>[2] }) => {
      return BudgetService.updateBudget(id, userId, input);
    },

    deleteBudget: async ({ id }: { id: string }) => {
      await BudgetService.deleteBudget(id, userId);
      return true;
    },

    createGoal: async ({ input }: { input: Parameters<typeof GoalService.createGoal>[1] }) => {
      return GoalService.createGoal(userId, input);
    },

    updateGoal: async ({ id, input }: { id: string; input: Record<string, unknown> }) => {
      return GoalService.updateGoal(id, userId, input);
    },

    deleteGoal: async ({ id }: { id: string }) => {
      await GoalService.deleteGoal(id, userId);
      return true;
    },

    createInvoice: async ({ input }: { input: Parameters<typeof InvoiceService.createInvoice>[1] }) => {
      proGuard(isPro);
      return InvoiceService.createInvoice(userId, input);
    },

    updateInvoice: async ({ id, input }: { id: string; input: Record<string, unknown> }) => {
      proGuard(isPro);
      return InvoiceService.updateInvoice(id, userId, input);
    },

    deleteInvoice: async ({ id }: { id: string }) => {
      proGuard(isPro);
      return InvoiceService.deleteInvoice(id, userId);
    },

    createReminder: async ({ input }: { input: Parameters<typeof ReminderService.createReminder>[1] }) => {
      return ReminderService.createReminder(userId, input);
    },

    updateReminder: async ({ id, input }: { id: string; input: Record<string, unknown> }) => {
      return ReminderService.updateReminder(id, userId, input);
    },

    deleteReminder: async ({ id }: { id: string }) => {
      return ReminderService.deleteReminder(id, userId);
    },
  };
}

// ── Route Registration ─────────────────────────────────────────────────────

export async function graphqlRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Main GraphQL endpoint — uses graphql-js engine (safe, spec-compliant)
  app.post('/graphql', {
    schema: {
      tags: ['GraphQL'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        query: z.string(),
        variables: z.record(z.unknown()).optional(),
        operationName: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.unknown().optional(),
          errors: z.array(z.object({
            message: z.string(),
            locations: z.array(z.object({ line: z.number(), column: z.number() })).optional(),
            path: z.array(z.union([z.string(), z.number()])).optional(),
            extensions: z.record(z.unknown()).optional(),
          })).optional(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user.id;
    const isPro = !!request.user.isPro;
    const { query, variables = {}, operationName } = request.body as {
      query: string;
      variables?: Record<string, unknown>;
      operationName?: string;
    };

    const ctx: GraphQLContext = { userId, isPro, app };
    const rootValue = createRootValue(ctx);

    const result = await graphql({
      schema,
      source: query,
      rootValue,
      contextValue: ctx,
      variableValues: variables,
      operationName,
    });

    return reply.send(result);
  });

  // Schema introspection endpoint
  app.get('/graphql/schema', {
    schema: {
      tags: ['GraphQL'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ schema: z.string() }),
      },
    },
  }, async () => {
    return { schema: typeDefs };
  });
}