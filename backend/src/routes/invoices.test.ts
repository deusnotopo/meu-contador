import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestUser, createTestApp, cleanupTestData } from '../test/helpers'
import { db } from '../lib/db'

describe('Invoice Routes', () => {
  let app: any
  let testUser: any
  let authToken: string
  let workspaceId: string

  beforeEach(async () => {
    app = await createTestApp()
    testUser = await createTestUser()
    workspaceId = testUser.currentWorkspaceId
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

  it('should return user invoices', async () => {
    await db.invoice.create({
      data: {
        number: 'INV-001',
        client: 'Test Client',
        amount: 1000,
        dueDate: new Date(),
        status: 'pending',
        workspaceId,
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: '/invoices',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.length).toBe(1)
    expect(payload[0].number).toBe('INV-001')
  })

  it('should create a new invoice', async () => {
    const invoiceData = {
      number: 'INV-002',
      client: 'New Client',
      amount: 2000,
      dueDate: new Date().toISOString(),
      status: 'pending',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/invoices',
      headers: { authorization: `Bearer ${authToken}` },
      payload: invoiceData,
    })

    expect(response.statusCode).toBe(201)
    const payload = JSON.parse(response.payload)
    expect(payload.number).toBe('INV-002')
    expect(payload.client).toBe('New Client')
  })

  it('should update an invoice', async () => {
    const invoice = await db.invoice.create({
      data: {
        number: 'INV-003',
        client: 'Old Client',
        amount: 500,
        dueDate: new Date(),
        status: 'pending',
        workspaceId,
      },
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/invoices/${invoice.id}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { status: 'paid' },
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.status).toBe('paid')
  })

  it('should delete an invoice', async () => {
    const invoice = await db.invoice.create({
      data: {
        number: 'INV-004',
        client: 'Delete Client',
        amount: 300,
        dueDate: new Date(),
        status: 'pending',
        workspaceId,
      },
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/invoices/${invoice.id}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(204)
  })

  it('should return 404 for non-existent invoice', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/invoices/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})