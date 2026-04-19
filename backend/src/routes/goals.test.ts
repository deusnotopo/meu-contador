import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

describe('Goals Routes', () => {
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

  it('should return paginated goals', async () => {
    await db.savingsGoal.create({
      data: {
        userId: testUser.id,
        name: 'Viagem Europa',
        targetAmount: 10000,
        currentAmount: 2000,
        deadline: new Date('2027-12-31'),
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/goals',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.total).toBe(1)
    expect(payload.items[0].name).toBe('Viagem Europa')
  })

  it('should create a new goal', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/goals',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        name: 'Carro Novo',
        targetAmount: 50000,
        currentAmount: 5000,
        deadline: new Date('2028-06-30').toISOString(),
        icon: 'car',
        color: '#ff0000',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.name).toBe('Carro Novo')
    expect(payload.targetAmount).toBe(50000)
  })

  it('should update a goal via PATCH', async () => {
    const created = await db.savingsGoal.create({
      data: {
        userId: testUser.id,
        name: 'Reserva Emergência',
        targetAmount: 20000,
        currentAmount: 0,
        deadline: new Date('2026-12-31'),
      },
    })

    const response = await app.inject({
      method: 'PATCH',
      url: `/goals/${created.id}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        currentAmount: 5000,
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.currentAmount).toBe(5000)
  })

  it('should delete a goal', async () => {
    const created = await db.savingsGoal.create({
      data: {
        userId: testUser.id,
        name: 'Meta Temp',
        targetAmount: 5000,
        currentAmount: 0,
        deadline: new Date('2027-01-01'),
      },
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/goals/${created.id}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(204)
    const count = await db.savingsGoal.count({
      where: { id: created.id },
    })
    expect(count).toBe(0)
  })

  it('should return 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/goals',
    })

    expect(response.statusCode).toBe(401)
  })
})
