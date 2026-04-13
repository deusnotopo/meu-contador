import { db } from '../lib/db'
import { app } from '../app'

export async function createTestApp() {
  await app.ready()
  return app
}

export async function createTestUser() {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        name: 'Test User',
        passwordHash: 'hashed-password',
      },
    })

    const workspace = await tx.workspace.create({
      data: {
        name: 'Workspace de Teste',
        ownerId: user.id,
        members: { connect: { id: user.id } },
      },
    })

    return tx.user.update({
      where: { id: user.id },
      data: { currentWorkspaceId: workspace.id },
    })
  })
}

export async function cleanupTestData() {
  // 🔴 ORDEM CRÍTICA - respeita TODAS as foreign keys do schema Prisma
  // 1. Tabelas com FK para Investment
  await db.investmentSale.deleteMany()
  await db.dividend.deleteMany()

  // 2. Tabelas com FK para BankAccount e BankConnection
  await db.transaction.deleteMany()

  // 3. BankAccount depende de BankConnection
  await db.bankAccount.deleteMany()

  // 4. BankConnection depende de User
  await db.bankConnection.deleteMany()

  // 5. Investment depende de User
  await db.investment.deleteMany()

  // 6. Tabelas com FK direta para User
  await db.budget.deleteMany()
  await db.debt.deleteMany()
  await db.savingsGoal.deleteMany()
  await db.billReminder.deleteMany()
  await db.provision.deleteMany()

  // 7. Invoice depende de Workspace (deve vir ANTES de Workspace)
  await db.invoice.deleteMany()
  await db.workspaceInvite.deleteMany()

  // 8. PushSubscription, Session e Notification dependem de User (onDelete Cascade)
  await db.pushSubscription.deleteMany()
  await db.session.deleteMany()
  await db.notification.deleteMany()

  // 9. AuditLog depende de User (onDelete SetNull)
  await db.auditLog.deleteMany()

  // 10. Workspace depende de User
  await db.workspace.deleteMany()

  // 11. Finalmente deletar User
  await db.user.deleteMany()
}
