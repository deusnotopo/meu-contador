import { beforeAll, afterAll } from 'vitest'
import { db } from '../lib/db'

beforeAll(async () => {
  // Ensure database connection for tests
  await db.$connect()

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "refreshTokenHash" TEXT NOT NULL UNIQUE,
      "csrfToken" TEXT NOT NULL,
      "userAgent" TEXT,
      "ipAddress" TEXT,
      "expiresAt" TIMESTAMP NOT NULL,
      "revokedAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "resource" TEXT NOT NULL,
      "resourceId" TEXT,
      "metadata" JSONB,
      "piiRedacted" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" TIMESTAMP
    )
  `)
})

afterAll(async () => {
  await db.$disconnect()
})
