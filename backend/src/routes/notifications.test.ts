import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestUser, createTestApp, cleanupTestData } from '../test/helpers';
import { db } from '../lib/db';

describe('Notifications Routes', () => {
  let app: any;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    app = await createTestApp();
    testUser = await createTestUser();
    authToken = app.jwt.sign({
      id: testUser.id as string,
      email: testUser.email,
      name: testUser.name || '',
      isPro: (testUser.isPro as boolean) ?? false,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('GET /notifications — returns empty list by default', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/notifications',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.notifications).toBeInstanceOf(Array);
    expect(body.unreadCount).toBe(0);
  });

  it('GET /notifications — returns persisted notifications', async () => {
    await db.notification.create({
      data: {
        userId: testUser.id,
        type: 'budget_exceeded',
        title: 'Orçamento Excedido',
        body: 'Você excedeu o limite de Alimentação',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/notifications',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.notifications).toHaveLength(1);
    expect(body.unreadCount).toBe(1);
    expect(body.notifications[0].title).toBe('Orçamento Excedido');
    expect(body.notifications[0].readAt).toBeNull();
  });

  it('PATCH /notifications/:id/read — marks notification as read', async () => {
    const notif = await db.notification.create({
      data: {
        userId: testUser.id,
        type: 'system',
        title: 'Test',
        body: 'Test body',
      },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/notifications/${notif.id}/read`,
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).success).toBe(true);

    // Verify in DB
    const updated = await db.notification.findUnique({ where: { id: notif.id } });
    expect(updated?.readAt).not.toBeNull();
  });

  it('POST /notifications/read-all — marks all as read', async () => {
    await db.notification.createMany({
      data: [
        { userId: testUser.id, type: 'system', title: 'A', body: 'b1' },
        { userId: testUser.id, type: 'system', title: 'B', body: 'b2' },
      ],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/notifications/read-all',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.count).toBe(2);

    const checkRes = await app.inject({
      method: 'GET',
      url: '/notifications',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(JSON.parse(checkRes.payload).unreadCount).toBe(0);
  });

  it('DELETE /notifications/:id — removes notification', async () => {
    const notif = await db.notification.create({
      data: { userId: testUser.id, type: 'system', title: 'Del', body: 'del body' },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/notifications/${notif.id}`,
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);

    const found = await db.notification.findUnique({ where: { id: notif.id } });
    expect(found).toBeNull();
  });

  it('GET /notifications — returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/notifications' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /notifications?unreadOnly=true — filters correctly', async () => {
    const n1 = await db.notification.create({
      data: { userId: testUser.id, type: 'system', title: 'A', body: '' },
    });
    await db.notification.create({
      data: { userId: testUser.id, type: 'system', title: 'B', body: '', readAt: new Date() },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/notifications?unreadOnly=true',
      headers: { authorization: `Bearer ${authToken}` },
    });
    const body = JSON.parse(res.payload);
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].id).toBe(n1.id);
  });
});
