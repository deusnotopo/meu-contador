import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { db } from '../lib/db';
import { z } from 'zod';

// WebSocket connection manager
class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();

  addConnection(connectionId: string, userId: string, ws: WebSocket) {
    this.connections.set(connectionId, ws);
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);
  }

  removeConnection(connectionId: string, userId: string) {
    this.connections.delete(connectionId);
    
    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  sendToUser(userId: string, message: any) {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return;

    const messageStr = JSON.stringify(message);
    
    connectionIds.forEach(connectionId => {
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }
}

const wsManager = new WebSocketManager();

// Notification types
enum NotificationType {
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  BUDGET_EXCEEDED = 'budget_exceeded',
  GOAL_REACHED = 'goal_reached',
  INVOICE_DUE = 'invoice_due',
  REMINDER_DUE = 'reminder_due',
  SYNC_COMPLETE = 'sync_complete',
  SYSTEM_ALERT = 'system_alert',
}

// Notification schema
const notificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  timestamp: z.string(),
});

type Notification = z.infer<typeof notificationSchema>;

// Send notification to user
export function sendNotificationToUser(userId: string, notification: Notification) {
  wsManager.sendToUser(userId, {
    type: 'notification',
    payload: notification,
  });
}

// Broadcast system alert
export function broadcastSystemAlert(message: string, data?: any) {
  wsManager.broadcast({
    type: 'system_alert',
    payload: {
      type: NotificationType.SYSTEM_ALERT,
      title: 'System Alert',
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  });
}

// Check and send budget alerts
export async function checkBudgetAlerts(userId: string, transactionAmount: number, category: string) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const budget = await db.budget.findFirst({
    where: {
      userId,
      category,
      month: currentMonth,
    },
  });

  if (budget) {
    const newSpent = budget.spent + Math.abs(transactionAmount);
    
    if (newSpent > budget.limit && budget.spent <= budget.limit) {
      sendNotificationToUser(userId, {
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Orçamento Excedido',
        message: `Seu orçamento de ${category} foi excedido. Limite: R$ ${budget.limit.toFixed(2)}, Gasto: R$ ${newSpent.toFixed(2)}`,
        data: { budget, newSpent },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Check and send goal alerts
export async function checkGoalAlerts(userId: string) {
  const goals = await db.savingsGoal.findMany({
    where: { userId },
  });

  for (const goal of goals) {
    if (goal.currentAmount >= goal.targetAmount) {
      sendNotificationToUser(userId, {
        type: NotificationType.GOAL_REACHED,
        title: 'Meta Alcançada! 🎉',
        message: `Parabéns! Você atingiu sua meta "${goal.name}" de R$ ${goal.targetAmount.toFixed(2)}`,
        data: { goal },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Check and send invoice due alerts
export async function checkInvoiceDueAlerts(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currentWorkspaceId: true },
  });

  const workspaceId = user?.currentWorkspaceId || userId;
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const dueInvoices = await db.invoice.findMany({
    where: {
      workspaceId,
      status: 'pending',
      dueDate: {
        lte: threeDaysFromNow,
      },
    },
  });

  for (const invoice of dueInvoices) {
    sendNotificationToUser(userId, {
      type: NotificationType.INVOICE_DUE,
      title: 'Fatura Próxima do Vencimento',
      message: `A fatura ${invoice.number} de R$ ${invoice.amount.toFixed(2)} vence em breve`,
      data: { invoice },
      timestamp: new Date().toISOString(),
    });
  }
}

// Check and send reminder alerts
export async function checkReminderAlerts(userId: string) {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const dueReminders = await db.billReminder.findMany({
    where: {
      userId,
      isPaid: false,
      dueDate: {
        lte: threeDaysFromNow,
      },
    },
  });

  for (const reminder of dueReminders) {
    sendNotificationToUser(userId, {
      type: NotificationType.REMINDER_DUE,
      title: 'Lembrete de Pagamento',
      message: `O pagamento "${reminder.name}" de R$ ${reminder.amount.toFixed(2)} está próximo do vencimento`,
      data: { reminder },
      timestamp: new Date().toISOString(),
    });
  }
}

// Send transaction notification
export function sendTransactionNotification(userId: string, transaction: any) {
  const isExpense = transaction.type === 'expense';
  
  sendNotificationToUser(userId, {
    type: NotificationType.TRANSACTION_CREATED,
    title: isExpense ? 'Despesa Registrada' : 'Receita Registrada',
    message: `${transaction.description}: R$ ${transaction.amount.toFixed(2)}`,
    data: { transaction },
    timestamp: new Date().toISOString(),
  });
}

// Send sync complete notification
export function sendSyncCompleteNotification(userId: string, accountName: string) {
  sendNotificationToUser(userId, {
    type: NotificationType.SYNC_COMPLETE,
    title: 'Sincronização Concluída',
    message: `A conta ${accountName} foi sincronizada com sucesso`,
    data: { accountName },
    timestamp: new Date().toISOString(),
  });
}

// Register WebSocket routes
export async function websocketRoutes(app: FastifyInstance) {
  // WebSocket upgrade endpoint
  app.get('/ws', { websocket: true } as any, (connection: any, request: any) => {
    const ws = connection.socket as WebSocket;
    const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract user ID from query parameter or token
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Verify JWT token
      const decoded = app.jwt.verify(token) as { id: string };
      const userId = decoded.id;
      
      // Add connection to manager
      wsManager.addConnection(connectionId, userId, ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        payload: {
          connectionId,
          userId,
          timestamp: new Date().toISOString(),
        },
      }));

      // Handle incoming messages
      (ws as any).on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
              break;
              
            case 'subscribe':
              // Handle subscription to specific channels
              ws.send(JSON.stringify({
                type: 'subscribed',
                payload: { channel: data.channel },
                timestamp: new Date().toISOString(),
              }));
              break;
              
            case 'unsubscribe':
              // Handle unsubscription
              ws.send(JSON.stringify({
                type: 'unsubscribed',
                payload: { channel: data.channel },
                timestamp: new Date().toISOString(),
              }));
              break;
              
            default:
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Unknown message type' },
                timestamp: new Date().toISOString(),
              }));
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Invalid JSON' },
            timestamp: new Date().toISOString(),
          }));
        }
      });

      // Handle connection close
      (ws as any).on('close', () => {
        wsManager.removeConnection(connectionId, userId);
      });

      // Handle errors
      (ws as any).on('error', (error: any) => {
        console.error('WebSocket error:', error);
        wsManager.removeConnection(connectionId, userId);
      });

    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  // REST endpoint to get WebSocket status
  app.get('/ws/status', {
    schema: {
      tags: ['WebSocket'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          connections: z.number(),
          userConnections: z.number(),
          timestamp: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    
    return {
      connections: wsManager.getConnectionCount(),
      userConnections: wsManager.getUserConnectionCount(userId),
      timestamp: new Date().toISOString(),
    };
  });

  // REST endpoint to send test notification
  app.post('/ws/test', {
    schema: {
      tags: ['WebSocket'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        message: z.string(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const { message } = request.body as { message: string };
    
    sendNotificationToUser(userId, {
      type: NotificationType.SYSTEM_ALERT,
      title: 'Test Notification',
      message,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: true,
      message: 'Notification sent',
    };
  });

  // REST endpoint to broadcast system alert
  app.post('/ws/broadcast', {
    schema: {
      tags: ['WebSocket'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        message: z.string(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { message } = request.body as { message: string };
    
    broadcastSystemAlert(message);
    
    return {
      success: true,
      message: 'Broadcast sent',
    };
  });
}

// Export WebSocket manager for use in other modules
export { wsManager, NotificationType };