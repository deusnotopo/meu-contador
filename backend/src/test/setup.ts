import { beforeAll, afterAll } from 'vitest'
import { db } from '../lib/db'

beforeAll(async () => {
  // Ensure database connection for tests
  await db.$connect()
})

afterAll(async () => {
  await db.$disconnect()
})
