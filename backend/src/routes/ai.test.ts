import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, createTestUser, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() }
})

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}))

describe('AI Routes', () => {
  let app: any
  let testUser: any
  let authToken: string
  const originalEnv = { ...process.env }

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
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
    process.env = { ...originalEnv }
    await cleanupTestData()
  })

  it('should return fallback demo response when API key is missing', async () => {
    delete process.env.GEMINI_API_KEY

    const response = await app.inject({
      method: 'POST',
      url: '/ai-proxy',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        conversation: [{ role: 'user', content: 'Como melhorar meu orçamento?' }],
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).response).toContain('Modo demonstração')
  })

  it('should block non-PRO users when API key exists', async () => {
    process.env.GEMINI_API_KEY = 'test-key'

    const response = await app.inject({
      method: 'POST',
      url: '/ai-proxy',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        conversation: [{ role: 'user', content: 'Analise meus gastos' }],
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).response).toContain('RECURSO PREMIUM')
  })

  it('should reject oversized prompt footprints', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    await db.user.update({ where: { id: testUser.id }, data: { isPro: true } })

    const response = await app.inject({
      method: 'POST',
      url: '/ai-proxy',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        conversation: Array.from({ length: 12 }).map(() => ({ role: 'user', content: 'x'.repeat(2000) })),
        systemContext: 'y'.repeat(5000),
        userMessage: 'z'.repeat(2000),
        financialSnapshot: {
          balance: 1500,
          monthlyIncome: 7000,
          monthlyExpenses: 4000,
          topCategories: Array.from({ length: 20 }).map((_, index) => ({
            category: `Categoria-${index}-${'a'.repeat(60)}`,
            amount: 1000 + index,
          })),
          alerts: Array.from({ length: 20 }).map((_, index) => `Alerta-${index}-${'b'.repeat(180)}`),
          recommendations: Array.from({ length: 20 }).map((_, index) => `Recomendacao-${index}-${'c'.repeat(260)}`),
          predictions: Array.from({ length: 20 }).map((_, index) => `Previsao-${index}-${'d'.repeat(260)}`),
        },
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.payload).message).toContain('Prompt excede')
  }, 20000)

  it('should return provider response with explanation for PRO user', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    await db.user.update({ where: { id: testUser.id }, data: { isPro: true } })
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Resposta IA ok' },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/ai-proxy',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        conversation: [{ role: 'user', content: 'Analise meu fluxo de caixa' }],
        userMessage: 'Meu CPF é 123.456.789-10',
        financialSnapshot: {
          balance: 1500,
          monthlyIncome: 7000,
          monthlyExpenses: 4000,
          topCategories: [{ category: 'Moradia', amount: 2000 }],
        },
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.response).toBe('Resposta IA ok')
  })
})