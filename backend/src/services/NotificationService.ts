/**
 * NotificationService
 * ───────────────────
 * Managed alert logic for financial triggers and system messages.
 * This version ensures all alerts are persisted to the database and emitted via WS.
 */

import { db } from "../lib/db.js";
import { wsManager, NotificationType } from "../lib/ws-manager.js";
import { logger } from "../lib/logger.js";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Standard delivery: Persist to DB + Emit over WebSocket
 */
export async function notifyUser(userId: string, payload: {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  try {
    // 1. Persist to DB
    const notification = await db.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.message,
        data: payload.data ? JSON.stringify(payload.data) : null,
      },
    });

    // 2. Emit over WebSocket
    wsManager.sendToUser(userId, {
      type: 'notification:new',
      payload: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      },
    });

    return notification;
  } catch (err) {
    logger.error(`[NotificationService] Failed to notify user ${userId}`, err);
    // Fallback: attempted WS-only if DB fails (degraded mode)
    wsManager.sendToUser(userId, {
      type: 'notification:new',
      payload: {
        id: `temp-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      }
    });
  }
}

/**
 * Legacy wrapper for backward compatibility during refactor
 */
export function sendNotification(userId: string, payload: Omit<NotificationPayload, 'timestamp'>) {
  notifyUser(userId, payload);
}

export function broadcastSystemAlert(message: string, data?: Record<string, unknown>) {
  wsManager.broadcast({
    type: 'system_alert',
    payload: {
      type: NotificationType.SYSTEM_ALERT,
      title: 'Alerta de Sistema',
      message,
      data,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Business Rule Triggers
 */

export async function checkBudgetAlerts(userId: string, transactionAmount: number, category: string) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const budget = await db.budget.findFirst({
    where: { userId, category, month: currentMonth },
  });

  if (budget) {
    const newSpent = budget.spent + Math.abs(transactionAmount);
    if (newSpent > budget.limit && budget.spent <= budget.limit) {
      await notifyUser(userId, {
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Orçamento Excedido ⚠️',
        message: `Seu limite para ${category} (R$ ${(budget.limit / 100).toFixed(2)}) foi ultrapassado.`,
        data: { budgetId: budget.id, category, limit: budget.limit, newSpent }
      });
    }
  }
}

export async function checkGoalAlerts(userId: string) {
  const goals = await db.savingsGoal.findMany({
    where: { userId, currentAmount: { gte: 0 } },
  });

  for (const goal of goals) {
    if (goal.currentAmount >= goal.targetAmount) {
      await notifyUser(userId, {
        type: NotificationType.GOAL_REACHED,
        title: 'Meta Alcançada! 🎉',
        message: `Parabéns! Você atingiu sua meta "${goal.name}".`,
        data: { goalId: goal.id, name: goal.name }
      });
    }
  }
}

export async function checkInvoiceDueAlerts(userId: string, workspaceId: string) {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const dueInvoices = await db.invoice.findMany({
    where: {
      workspaceId,
      status: 'pending',
      dueDate: { lte: threeDaysFromNow }
    },
  });

  for (const inv of dueInvoices) {
    await notifyUser(userId, {
      type: NotificationType.INVOICE_DUE,
      title: 'Fatura Vencendo',
      message: `A fatura ${inv.number} de R$ ${(inv.amount / 100).toFixed(2)} vence em breve.`,
      data: { invoiceId: inv.id, number: inv.number }
    });
  }
}

export function sendTransactionAlert(userId: string, transaction: { id: string; type: string; description: string; amount: number }) {
  const isExpense = transaction.type === 'expense';
  notifyUser(userId, {
    type: NotificationType.TRANSACTION_CREATED,
    title: isExpense ? 'Despesa Registrada' : 'Receita Registrada',
    message: `${transaction.description}: R$ ${(Math.abs(transaction.amount) / 100).toFixed(2)}`,
    data: { transactionId: transaction.id }
  });
}
