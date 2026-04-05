import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../lib/db'
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers'

vi.mock('../services/pluggy', () => ({
  getConnectToken: vi.fn().mockResolvedValue('pluggy-token'),
  syncBankConnection: vi.fn().mockResolvedValue({ ok: true }),
}))

describe('Open Finance Routes', () => {
  let getConnectTokenMock: any
  let syncBankConnectionMock: any

  let app: any
  let testUser: any
  let authToken: string
  const originalEnv = { ...process.env }

  beforeEach(async () => {
    const pluggyModule = await import('../services/pluggy.js')
    getConnectTokenMock = pluggyModule.getConnectToken
    syncBankConnectionMock = pluggyModule.syncBankConnection
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    app = await createTestApp()
    testUser = await createTestUser()
    authToken = app.jwt.sign({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      isPro: false,
    })
  })

  afterEach(async () => {
    process.env = { ...originalEnv }
    await cleanupTestData()
  })

  it('should return connect token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/open-finance/token',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.accessToken).toBe('pluggy-token')
  })

  it('should list connections paginated', async () => {
    await db.bankConnection.create({
      data: {
        userId: testUser.id,
        pluggyItemId: 'item-1',
        status: 'UPDATED',
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/open-finance/connections?page=1&limit=10',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.total).toBe(1)
    expect(payload.items[0].pluggyItemId).toBe('item-1')
  })

  it('should forbid sync for connection owned by another user', async () => {
    const otherUser = await createTestUser()
    await db.bankConnection.create({
      data: {
        userId: otherUser.id,
        pluggyItemId: 'foreign-item',
        status: 'UPDATED',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/open-finance/sync/foreign-item',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('should reject webhook when no secret is configured', async () => {
    delete process.env.OPEN_FINANCE_WEBHOOK_SECRET
    delete process.env.OPEN_FINANCE_WEBHOOK_SIGNING_SECRET
    delete process.env.OPEN_FINANCE_ALLOW_INSECURE_WEBHOOKS

    const response = await app.inject({
      method: 'POST',
      url: '/open-finance/webhook',
      payload: { event: 'item/updated', itemId: 'item-123' },
    })

    expect(response.statusCode).toBe(503)
  })

  it('should reject webhook with invalid shared secret', async () => {
    process.env.OPEN_FINANCE_WEBHOOK_SECRET = 'expected-secret'

    const response = await app.inject({
      method: 'POST',
      url: '/open-finance/webhook',
      headers: { 'x-open-finance-webhook-secret': 'wrong-secret' },
      payload: { event: 'item/updated', itemId: 'item-123' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should accept webhook with valid shared secret and sync item updates', async () => {
    process.env.OPEN_FINANCE_WEBHOOK_SECRET = 'expected-secret'
    await db.bankConnection.create({
      data: {
        userId: testUser.id,
        pluggyItemId: 'item-123',
        status: 'UPDATED',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/open-finance/webhook',
      headers: { 'x-open-finance-webhook-secret': 'expected-secret' },
      payload: { event: 'item/updated', itemId: 'item-123' },
    })

    expect(response.statusCode).toBe(202)
    expect(syncBankConnectionMock).toHaveBeenCalledWith('item-123', testUser.id)
  })

  it('should reject unsupported webhook events even with valid secret', async () => {
    process.env.OPEN_FINANCE_WEBHOOK_SECRET = 'expected-secret'

    const response = await app.inject({
      method: 'POST',
      url: '/open-finance/webhook',
      headers: { 'x-open-finance-webhook-secret': 'expected-secret' },
      payload: { event: 'item/deleted', itemId: 'item-123' },
    })

    expect(response.statusCode).toBe(400)
  })
})