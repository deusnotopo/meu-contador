import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { FastifyInstance } from "fastify"
import { createTestUser, createTestApp, cleanupTestData } from "../test/helpers"
import { db } from "../lib/db"

describe("Debt Routes", () => {
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

  it("should return user debts", async () => {
    await db.debt.create({
      data: {
        name: "Test Credit Card",
        balance: 5000,
        interestRate: 15.99,
        minPayment: 150,
        category: "credit_card",
        userId: testUser.id,
      },
    })

    const response = await app.inject({
      method: "GET",
      url: "/debts",
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.total).toBe(1)
    expect(payload.items).toHaveLength(1)
    expect(payload.items[0].name).toBe("Test Credit Card")
  })

  it("should create a new debt", async () => {
    const debtData = {
      name: "New Credit Card",
      balance: 2500,
      interestRate: 18.99,
      minPayment: 75,
      category: "credit_card",
    }

    const response = await app.inject({
      method: "POST",
      url: "/debts",
      headers: { authorization: `Bearer ${authToken}` },
      payload: debtData,
    })

    expect(response.statusCode).toBe(200)
    const debt = JSON.parse(response.payload)
    expect(debt.name).toBe("New Credit Card")
    expect(debt.balance).toBe(2500)
    expect(debt.interestRate).toBe(18.99)
  })

  it("should validate required fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/debts",
      headers: { authorization: `Bearer ${authToken}` },
      payload: { name: "Invalid Debt" },
    })

    expect(response.statusCode).toBe(400)
    const parsed = JSON.parse(response.payload)
    expect(parsed.message).toBe("Validation error")
  })
})
