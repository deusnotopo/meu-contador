import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../lib/db'
import { createTestApp, cleanupTestData } from '../test/helpers'

function extractCookieValue(cookies: string[] | string | undefined, name: string) {
  const list = Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
  const match = list.find((item) => item.startsWith(`${name}=`))
  return match?.split(';')[0]
}

describe('Auth Routes', () => {
  let app: any

  beforeEach(async () => {
    app = await createTestApp()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should register user and return csrf token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'register@example.com',
        password: 'Test@2026!!',
        name: 'Register User',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.user.email).toBe('register@example.com')
    expect(typeof payload.csrfToken).toBe('string')
    expect(response.headers['set-cookie']).toBeDefined()
  })

  it('should reject invalid login', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'login@example.com',
        password: 'Test@2026!!',
        name: 'Login User',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'login@example.com',
        password: 'wrong-password!!',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should reject duplicate register', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'duplicate@example.com',
        password: 'Test@2026!!',
        name: 'Duplicate User',
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'duplicate@example.com',
        password: 'Test@2026!!',
        name: 'Duplicate User',
      },
    })

    expect(response.statusCode).toBe(409)
  })

  it('should login, refresh session and logout', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'flow@example.com',
        password: 'Test@2026!!',
        name: 'Flow User',
      },
    })

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'flow@example.com',
        password: 'Test@2026!!',
      },
    })

    expect(loginResponse.statusCode).toBe(200)
    const loginCookies = loginResponse.headers['set-cookie'] as string[]
    const refreshCookie = extractCookieValue(loginCookies, 'mc_refresh_token')
    const csrfCookie = extractCookieValue(loginCookies, 'mc_csrf_token')

    expect(refreshCookie).toBeDefined()
    expect(csrfCookie).toBeDefined()

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: {
        cookie: [refreshCookie, csrfCookie].filter(Boolean).join('; '),
      },
    })

    expect(refreshResponse.statusCode).toBe(200)
    const refreshPayload = JSON.parse(refreshResponse.payload)
    expect(refreshPayload.success).toBe(true)
    expect(typeof refreshPayload.csrfToken).toBe('string')

    const sessionCount = await db.session.count()
    const revokedCount = await db.session.count({ where: { revokedAt: { not: null } } })
    expect(sessionCount).toBeGreaterThanOrEqual(2)
    expect(revokedCount).toBeGreaterThanOrEqual(1)

    const refreshedCookies = refreshResponse.headers['set-cookie'] as string[]
    const nextRefreshCookie = extractCookieValue(refreshedCookies, 'mc_refresh_token')

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        cookie: [nextRefreshCookie, extractCookieValue(refreshedCookies, 'mc_csrf_token')].filter(Boolean).join('; '),
      },
    })

    expect(logoutResponse.statusCode).toBe(200)
    expect(JSON.parse(logoutResponse.payload).success).toBe(true)
  }, 20000)

  it('should return current user on /auth/me and block manual upgrade', async () => {
    await cleanupTestData()
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'me@example.com',
        password: 'Test@2026!!',
        name: 'Me User',
      },
    })

    expect(registerResponse.statusCode).toBe(200)
    const registerPayload = JSON.parse(registerResponse.payload)
    const registeredUser = registerPayload.user
    const authToken = app.jwt.sign({
      id: registeredUser.id,
      email: registeredUser.email,
      name: registeredUser.name,
      isPro: false,
    })

    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(meResponse.statusCode).toBe(200)
    expect(JSON.parse(meResponse.payload).email).toBe('me@example.com')

    const upgradeResponse = await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(upgradeResponse.statusCode).toBe(403)
  }, 60000)
})
