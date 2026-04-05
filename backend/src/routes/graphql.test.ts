import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers';
import { db } from '../lib/db';

describe('GraphQL Routes', () => {
  let app: any;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    app = await createTestApp();
    testUser = await createTestUser();
    authToken = app.jwt.sign({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      isPro: testUser.isPro,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /graphql', () => {
    it('should execute a simple query', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
        payload: {
          query: 'query { user { id email name } }',
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.data.user.id).toBe(testUser.id);
      expect(payload.data.user.email).toBe(testUser.email);
    });

    it('should execute a transactions query', async () => {
      await db.transaction.create({
        data: {
          description: 'Test Transaction',
          amount: 100,
          type: 'income',
          category: 'salary',
          date: new Date(),
          scope: 'personal',
          userId: testUser.id,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
        payload: {
          query: 'query { transactions(limit: 10) { items { id description amount } total } }',
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.data.transactions.total).toBe(1);
      expect(payload.data.transactions.items[0].description).toBe('Test Transaction');
    });

    it('should execute a create transaction mutation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
        payload: {
          query: 'mutation { createTransaction(input: { type: "expense", description: "Coffee", amount: 5.50, category: "food", date: "2026-04-02T00:00:00.000Z", scope: "personal" }) { id description amount } }',
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.data.createTransaction.description).toBe('Coffee');
      expect(payload.data.createTransaction.amount).toBe(5.50);
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: 'query { user { id } }',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle invalid query gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
        payload: {
          query: 'query { nonExistentField }',
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.errors).toBeDefined();
    });
  });

  describe('GET /graphql/schema', () => {
    it('should return GraphQL schema', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/graphql/schema',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.schema).toBeDefined();
      expect(payload.schema).toContain('type Query');
      expect(payload.schema).toContain('type Mutation');
    });
  });
});