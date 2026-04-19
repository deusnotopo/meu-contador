import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { z } from 'zod';
import { wsManager, NotificationType } from '../lib/ws-manager.js';
import * as NotificationService from '../services/NotificationService.js';

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
        payload: { connectionId, userId, timestamp: new Date().toISOString() },
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
              ws.send(JSON.stringify({
                type: 'subscribed',
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
      (ws as any).on('close', () => wsManager.removeConnection(connectionId, userId));

      // Handle errors
      (ws as any).on('error', (error: any) => {
        request.log.error(error);
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
    preHandler: [app.authenticate],
  }, async (request) => {
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
      body: z.object({ message: z.string() }),
      response: { 200: z.object({ success: z.boolean(), message: z.string() }) },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const userId = (request.user as any).id;
    const { message } = request.body as { message: string };
    
    NotificationService.sendNotification(userId, {
      type: NotificationType.SYSTEM_ALERT,
      title: 'Test Notification',
      message
    });
    
    return { success: true, message: 'Notification sent' };
  });

  // REST endpoint to broadcast system alert
  app.post('/ws/broadcast', {
    schema: {
      tags: ['WebSocket'],
      security: [{ bearerAuth: [] }],
      body: z.object({ message: z.string() }),
      response: { 200: z.object({ success: z.boolean(), message: z.string() }) },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { message } = request.body as { message: string };
    NotificationService.broadcastSystemAlert(message);
    return { success: true, message: 'Broadcast sent' };
  });
}

// Re-export type and manager for other services
export { NotificationType };