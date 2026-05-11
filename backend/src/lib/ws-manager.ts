/**
 * WebSocketManager
 * ────────────────
 * Infrastructure component for real-time signal management.
 */

export interface WsSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: 'message', cb: (data: Buffer) => void): void;
  on(event: 'close', cb: () => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
  readyState: number;
}

export enum NotificationType {
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  BUDGET_EXCEEDED = 'budget_exceeded',
  GOAL_REACHED = 'goal_reached',
  INVOICE_DUE = 'invoice_due',
  REMINDER_DUE = 'reminder_due',
  SYNC_COMPLETE = 'sync_complete',
  SYSTEM_ALERT = 'system_alert',
  SPENDING_ANOMALY = 'spending_anomaly',  // NEW: Proactive anomaly alerts
  WEEKLY_BRIEFING = 'weekly_briefing',    // NEW: AI-generated weekly summary
}

class WebSocketManager {
  private connections: Map<string, WsSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();

  addConnection(connectionId: string, userId: string, ws: WsSocket) {
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

  sendToUser(userId: string, message: Record<string, unknown>) {
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

  broadcast(message: Record<string, unknown>) {
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

export const wsManager = new WebSocketManager();
