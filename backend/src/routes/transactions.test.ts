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
    const transactions = JSON.parse(response.payload)
    expect(transactions.length).toBe(1)
    expect(transactions[0].description).toBe('Test Transaction')
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
