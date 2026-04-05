import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

describe('Investment Routes', () => {
  let app: any
  let testUser: any
  let authToken: string

  beforeEach(async () => {
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
    await cleanupTestData()
  })

  it('should return paginated investments', async () => {
    await db.investment.create({
      data: {
        userId: testUser.id,
        name: 'Tesouro Selic',
        ticker: 'SELIC',
        type: 'fixed_income',
        amount: 1,
        averagePrice: 100,
        currentPrice: 100,
        currency: 'BRL',
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/investments',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.total).toBe(1)
    expect(payload.items[0].ticker).toBe('SELIC')
  })

  it('should create a new investment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/investments',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        name: 'CDB Banco X',
        ticker: 'CDB-BX',
        type: 'fixed_income',
        amount: 1000,
        averagePrice: 1.05,
        currentPrice: 1.08,
        currency: 'BRL',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.name).toBe('CDB Banco X')
    expect(payload.ticker).toBe('CDB-BX')
  })

  it('should update an investment', async () => {
    const created = await db.investment.create({
      data: {
        userId: testUser.id,
        name: 'Ação Y',
        ticker: 'XYZZZ3',
        type: 'equity',
        amount: 100,
        averagePrice: 25,
        currentPrice: 28,
        currency: 'BRL',
      },
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/investments/${created.id}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        currentPrice: 30,
        name: 'Ação Y Atualizada',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.currentPrice).toBe(30)
    expect(payload.name).toBe('Ação Y Atualizada')
  })

  it('should delete an investment', async () => {
    const created = await db.investment.create({
      data: {
        userId: testUser.id,
        name: 'Fundo Z',
        ticker: 'FUNDOZ',
        type: 'investment_fund',
        amount: 500,
        averagePrice: 1,
        currentPrice: 1.2,
        currency: 'BRL',
      },
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/investments/${created.id}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(204)

    const count = await db.investment.count({
      where: { id: created.id },
    })
    expect(count).toBe(0)
  })

  it('should record a dividend', async () => {
    const investment = await db.investment.create({
      data: {
        userId: testUser.id,
        name: 'Ações PETR4',
        ticker: 'PETR4',
        type: 'equity',
        amount: 200,
        averagePrice: 20,
        currentPrice: 22,
        currency: 'BRL',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: `/investments/${investment.id}/dividends`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        amount: 50,
        date: new Date().toISOString(),
        type: 'dividend',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.amount).toBe(50)
    expect(payload.type).toBe('dividend')
  })

  it('should record a sale', async () => {
    const investment = await db.investment.create({
      data: {
        userId: testUser.id,
        name: 'Ações VALE3',
        ticker: 'VALE3',
        type: 'equity',
        amount: 100,
        averagePrice: 50,
        currentPrice: 55,
        currency: 'BRL',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: `/investments/${investment.id}/sales`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        amount: 10,
        price: 60,
        date: new Date().toISOString(),
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.amount).toBe(10)
    expect(payload.price).toBe(60)
  })

  it('should return 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/investments',
    })

    expect(response.statusCode).toBe(401)
  })
})
