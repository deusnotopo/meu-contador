import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

describe('User Routes', () => {
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

  it('should return user preferences', async () => {
    await db.user.update({
      where: { id: testUser.id },
      data: {
        preferences: JSON.stringify({ theme: 'dark', language: 'pt', privacyMode: false }),
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/users/preferences',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.theme).toBeDefined()
    expect(payload.language).toBeDefined()
  })

  it('should update user profile', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/users/me',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { name: 'Updated User', monthlyIncome: 3500 },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.name).toBe('Updated User')
    expect(payload.monthlyIncome).toBe(3500)
  })
})