import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestUser, createTestApp, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

describe('Transaction Routes', () => {
  let app: any
  let testUser: any
  let authToken: string

  beforeEach(async () => {
    app = await createTestApp()
    testUser = await createTestUser()
    authToken = app.jwt.sign({
      id: testUser.id as string,
      email: testUser.email,
      name: testUser.name || '',
      isPro: (testUser.isPro as boolean) ?? false,
    })
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should return user transactions', async () => {
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
    })

    const response = await app.inject({
      method: 'GET',
      url: '/transactions',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.items.length).toBe(1)
    expect(payload.total).toBe(1)
    expect(payload.items[0].description).toBe('Test Transaction')
  })

  it('should paginate transactions', async () => {
    await db.transaction.createMany({
      data: Array.from({ length: 3 }).map((_, index) => ({
        description: `Tx ${index}`,
        amount: index + 1,
        type: 'income',
        category: 'salary',
        date: new Date(Date.now() + index * 1000),
        scope: 'personal',
        userId: testUser.id,
      })),
    })

    const response = await app.inject({
      method: 'GET',
      url: '/transactions?page=2&limit=2',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.page).toBe(2)
    expect(payload.limit).toBe(2)
    expect(payload.total).toBe(3)
    expect(payload.items).toHaveLength(1)
  })

  it('should create a new transaction', async () => {
    const transactionData = {
      description: 'New Transaction',
      amount: 150,
      type: 'income',
      category: 'freelance',
      date: new Date().toISOString(),
      scope: 'personal',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      headers: { authorization: `Bearer ${authToken}` },
      payload: transactionData,
    })

    expect(response.statusCode).toBe(200)
    const transaction = JSON.parse(response.payload)
    expect(transaction.description).toBe('New Transaction')
    expect(transaction.amount).toBe(150)
    expect(transaction.type).toBe('income')
  })

  it('should return 401 without auth', async () => {
    const response = await app.inject({ method: 'GET', url: '/transactions' })
    expect(response.statusCode).toBe(401)
  })
})
