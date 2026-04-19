import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

describe('Budget Routes', () => {
  let app: any
  let testUser: any
  let authToken: string

  beforeEach(async () => {
    app = await createTestApp()
    testUser = await createTestUser(true)
    authToken = app.jwt.sign({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      isPro: true,
    })
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should return paginated budgets', async () => {
    await db.budget.create({
      data: {
        userId: testUser.id,
        category: 'Alimentação',
        limit: 500,
        month: '2026-04',
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/budgets',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.total).toBe(1)
    expect(payload.items[0].category).toBe('Alimentação')
  })

  it('should create a new budget', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/budgets',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        category: 'Transporte',
        limit: 300,
        month: '2026-04',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.category).toBe('Transporte')
    expect(payload.limit).toBe(300)
  })

  it('should update a budget', async () => {
    const created = await db.budget.create({
      data: {
        userId: testUser.id,
        category: 'Lazer',
        limit: 200,
        month: '2026-04',
      },
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/budgets/${created.id}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        limit: 250,
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.limit).toBe(250)
  })

  it('should delete a budget', async () => {
    const created = await db.budget.create({
      data: {
        userId: testUser.id,
        category: 'Saúde',
        limit: 400,
        month: '2026-05',
      },
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/budgets/${created.id}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(204)

    const count = await db.budget.count({
      where: { id: created.id },
    })
    expect(count).toBe(0)
  })

  it('should return 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/budgets',
    })

    expect(response.statusCode).toBe(401)
  })
})
