import { db } from '../lib/db'
import { app } from '../app'

export async function createTestApp() {
  await app.ready()
  return app
}

export async function createTestUser() {
  return await db.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: 'hashed-password',
    },
  })
}

export async function cleanupTestData() {
  await db.budget.deleteMany()
  await db.debt.deleteMany()
  await db.transaction.deleteMany()
  await db.investmentSale.deleteMany()
  await db.investment.deleteMany()
  await db.savingsGoal.deleteMany()
  await db.billReminder.deleteMany()
  await db.pushSubscription.deleteMany()
  await db.bankAccount.deleteMany()
  await db.bankConnection.deleteMany()
  await db.user.deleteMany()
}
