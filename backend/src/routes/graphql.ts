import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { deleteCacheByPrefix } from '../lib/cache';

// GraphQL Schema Definition
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

// GraphQL Resolvers
function createResolvers(userId: string, isPro: boolean) {
  const invalidateBudgetCache = async () => {
    await deleteCacheByPrefix(`budgets:list:${userId}:`);
  };

  const proGuard = () => {
    if (!isPro) {
      throw new Error('👑 RECURSO PREMIUM: Esta funcionalidade exige o plano PRO. Faça o upgrade para continuar.');
    }
  };

  return {
    Query: {
      transactions: async ({ page = 1, limit = 20, scope }: { page?: number; limit?: number; scope?: string }) => {
        const skip = (page - 1) * limit;
        const where: any = { userId };
        if (scope) where.scope = scope;

        const [items, total] = await Promise.all([
          db.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            skip,
            take: limit,
          }),
          db.transaction.count({ where }),
        ]);

        return {
          items,
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        };
      },

      transaction: async ({ id }: { id: string }) => {
        return db.transaction.findFirst({
          where: { id, userId },
        });
      },

      budgets: async ({ month }: { month?: string }) => {
        const where: any = { userId };
        if (month) where.month = month;
        const budgets = await db.budget.findMany({ where, orderBy: { month: 'desc' } });

        return Promise.all(
          budgets.map(async (budget) => {
            const start = new Date(`${budget.month}-01T00:00:00.000Z`);
            const end = new Date(start);
            end.setUTCMonth(end.getUTCMonth() + 1);

            const aggregate = await db.transaction.aggregate({
              where: {
                userId,
                type: 'expense',
                category: {
                  equals: budget.category,
                  mode: 'insensitive',
                },
                date: {
                  gte: start,
                  lt: end,
                },
              },
              _sum: {
                amount: true,
              },
            });

            return {
              ...budget,
              spent: Math.abs(aggregate._sum.amount ?? 0),
            };
          }),
        );
      },

      goals: async () => {
        return db.savingsGoal.findMany({
          where: { userId },
          orderBy: { deadline: 'asc' },
        });
      },

      investments: async () => {
        proGuard();
        return db.investment.findMany({
          where: { userId },
          orderBy: { lastUpdate: 'desc' },
        });
      },

      debts: async () => {
        return db.debt.findMany({
          where: { userId },
          orderBy: { dueDate: 'asc' },
        });
      },

      invoices: async () => {
        proGuard();
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { currentWorkspaceId: true },
        });
        const workspaceId = user?.currentWorkspaceId || userId;
        return db.invoice.findMany({
          where: { workspaceId },
          orderBy: { dueDate: 'desc' },
        });
      },

      reminders: async () => {
        return db.billReminder.findMany({
          where: { userId },
          orderBy: { dueDate: 'asc' },
        });
      },

      user: async () => {
        const user = await db.user.findUnique({
          where: { id: userId },
        });
        if (!user) throw new Error('User not found');
        return user;
      },

      health: async () => {
        const startTime = Date.now();
        await db.$queryRaw`SELECT 1`;
        const dbResponseTime = Date.now() - startTime;
        const memoryUsage = process.memoryUsage();

        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0-enterprise',
          uptime: process.uptime(),
          database: {
            status: 'connected',
            responseTimeMs: dbResponseTime,
          },
        };
      },
    },

    Mutation: {
      createTransaction: async ({ input }: { input: any }) => {
        const created = await db.transaction.create({
          data: { ...input, userId },
        });

        await invalidateBudgetCache();
        return created;
      },

      updateTransaction: async ({ id, input }: { id: string; input: any }) => {
        const existing = await db.transaction.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Transaction not found');
        const updated = await db.transaction.update({
          where: { id },
          data: input,
        });

        await invalidateBudgetCache();
        return updated;
      },

      deleteTransaction: async ({ id }: { id: string }) => {
        const existing = await db.transaction.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Transaction not found');
        await db.transaction.delete({ where: { id } });
        await invalidateBudgetCache();
        return true;
      },

      createBudget: async ({ input }: { input: any }) => {
        const created = await db.budget.create({
          data: { ...input, userId },
        });

        await invalidateBudgetCache();

        return {
          ...created,
          spent: 0,
        };
      },

      updateBudget: async ({ id, input }: { id: string; input: any }) => {
        const existing = await db.budget.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Budget not found');

        const updated = await db.budget.update({
          where: { id },
          data: {
            ...(input.limit !== undefined ? { limit: input.limit } : {}),
          },
        });

        const start = new Date(`${updated.month}-01T00:00:00.000Z`);
        const end = new Date(start);
        end.setUTCMonth(end.getUTCMonth() + 1);

        const aggregate = await db.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            category: {
              equals: updated.category,
              mode: 'insensitive',
            },
            date: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          ...updated,
          spent: Math.abs(aggregate._sum.amount ?? 0),
        };
      },

      deleteBudget: async ({ id }: { id: string }) => {
        const existing = await db.budget.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Budget not found');
        await db.budget.delete({ where: { id } });
        await invalidateBudgetCache();
        return true;
      },

      createGoal: async ({ input }: { input: any }) => {
        return db.savingsGoal.create({
          data: { ...input, userId },
        });
      },

      updateGoal: async ({ id, input }: { id: string; input: any }) => {
        const existing = await db.savingsGoal.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Goal not found');
        return db.savingsGoal.update({
          where: { id },
          data: input,
        });
      },

      deleteGoal: async ({ id }: { id: string }) => {
        const existing = await db.savingsGoal.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Goal not found');
        await db.savingsGoal.delete({ where: { id } });
        return true;
      },

      createInvoice: async ({ input }: { input: any }) => {
        proGuard();
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { currentWorkspaceId: true },
        });
        const workspaceId = user?.currentWorkspaceId || userId;
        return db.invoice.create({
          data: { ...input, workspaceId },
        });
      },

      updateInvoice: async ({ id, input }: { id: string; input: any }) => {
        proGuard();
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { currentWorkspaceId: true },
        });
        const workspaceId = user?.currentWorkspaceId || userId;
        const existing = await db.invoice.findFirst({
          where: { id, workspaceId },
        });
        if (!existing) throw new Error('Invoice not found');
        return db.invoice.update({
          where: { id },
          data: input,
        });
      },

      deleteInvoice: async ({ id }: { id: string }) => {
        proGuard();
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { currentWorkspaceId: true },
        });
        const workspaceId = user?.currentWorkspaceId || userId;
        const existing = await db.invoice.findFirst({
          where: { id, workspaceId },
        });
        if (!existing) throw new Error('Invoice not found');
        await db.invoice.delete({ where: { id } });
        return true;
      },

      createReminder: async ({ input }: { input: any }) => {
        return db.billReminder.create({
          data: { ...input, userId },
        });
      },

      updateReminder: async ({ id, input }: { id: string; input: any }) => {
        const existing = await db.billReminder.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Reminder not found');
        return db.billReminder.update({
          where: { id },
          data: input,
        });
      },

      deleteReminder: async ({ id }: { id: string }) => {
        const existing = await db.billReminder.findFirst({
          where: { id, userId },
        });
        if (!existing) throw new Error('Reminder not found');
        await db.billReminder.delete({ where: { id } });
        return true;
      },
    },
  };
}

// Simple GraphQL query parser and executor
function parseQuery(query: string) {
  // Remove extra whitespace and newlines
  const cleaned = query.replace(/\s+/g, ' ').trim();
  
  // Extract operation type
  const operationMatch = cleaned.match(/^(query|mutation)\s*/i);
  const operation = operationMatch ? operationMatch[1].toLowerCase() : 'query';
  
  // Extract fields
  const fieldMatch = cleaned.match(/{\s*(.+)\s*}/s);
  const fields = fieldMatch ? fieldMatch[1] : cleaned;
  
  return { operation, fields };
}

function executeResolver(resolvers: any, operation: string, fieldName: string, args: any = {}) {
  const resolverGroup = resolvers[operation === 'mutation' ? 'Mutation' : 'Query'];
  if (!resolverGroup || !resolverGroup[fieldName]) {
    throw new Error(`Resolver not found for ${operation}.${fieldName}`);
  }
  return resolverGroup[fieldName](args);
}

function normalizeMutationInput(args: Record<string, unknown>) {
  if ('input' in args) return args;
  return { input: args };
}

// Register GraphQL routes
export async function graphqlRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    await (app as any).authenticate(request, reply);
  });

  // GraphQL endpoint
  app.post('/graphql', {
    schema: {
      tags: ['GraphQL'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        query: z.string(),
        variables: z.record(z.any()).optional(),
        operationName: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.any().optional(),
          errors: z.array(z.object({
            message: z.string(),
            locations: z.array(z.object({
              line: z.number(),
              column: z.number(),
            })).optional(),
            path: z.array(z.string()).optional(),
          })).optional(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const isPro = !!(request.user as any).isPro;
    const { query, variables = {} } = request.body as { query: string; variables?: any };

    try {
      const resolvers = createResolvers(userId, isPro);
      
      // Parse the query to extract operation and field
      const { operation, fields } = parseQuery(query);
      
      // Extract field name and arguments from the query
      const fieldMatch = fields.match(/(\w+)(?:\(([^)]*)\))?/);
      if (!fieldMatch) {
        throw new Error('Invalid GraphQL query format');
      }
      
      const fieldName = fieldMatch[1];
      const argsString = fieldMatch[2];
      
      // Parse arguments
      let args: any = {};
      if (argsString) {
        // Simple argument parsing - handles basic cases
        const argMatches = argsString.matchAll(/(\w+):\s*(?:"([^"]*)"|(\d+(?:\.\d+)?)|(\w+))/g);
        for (const match of argMatches) {
          const key = match[1];
          const value = match[2] || match[3] || match[4];
          args[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
      
      // Merge with variables
      args = { ...args, ...variables };
      
      // Execute the resolver
      const normalizedArgs = operation === 'mutation' ? normalizeMutationInput(args) : args;
      const result = await executeResolver(resolvers, operation, fieldName, normalizedArgs);
      
      return { data: { [fieldName]: result } };
    } catch (error: any) {
      request.log.error(error);
      return {
        errors: [{
          message: error.message || 'GraphQL execution error',
          path: ['query'],
        }],
      };
    }
  });

  // GraphQL schema introspection endpoint
  app.get('/graphql/schema', {
    schema: {
      tags: ['GraphQL'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          schema: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    return { schema: typeDefs };
  });
}