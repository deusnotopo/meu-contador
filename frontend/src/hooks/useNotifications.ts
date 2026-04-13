import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
}

// ── WebSocket singleton ───────────────────────────────────────────────────────
let wsInstance: WebSocket | null = null;
let wsListeners: Array<(n: AppNotification) => void> = [];

function getWSUrl(): string {
  const token = localStorage.getItem('auth_token');
  const base = import.meta.env.VITE_WS_URL ||
    (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/ws';
  return `${base}?token=${token ?? ''}`;
}

function connectWS() {
  if (wsInstance && wsInstance.readyState <= WebSocket.OPEN) return;

  const token = localStorage.getItem('auth_token');
  if (!token) return;

  try {
    wsInstance = new WebSocket(getWSUrl());

    wsInstance.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'notification:new') {
          wsListeners.forEach(fn => fn(msg.payload as AppNotification));
        }
      } catch { /* ignore parse errors */ }
    };

    wsInstance.onerror = () => { wsInstance = null; };
    wsInstance.onclose = () => { wsInstance = null; };
  } catch (err) {
    logger.warn('[useNotifications] WS connect failed', err);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
  });

  const listenerRef = useRef<((n: AppNotification) => void) | null>(null);

  // Load from API
  const load = useCallback(async () => {
    try {
      const data = await api.get<{ notifications: AppNotification[]; unreadCount: number }>(
        '/notifications?limit=30'
      );
      setState(prev => ({ ...prev, notifications: data.notifications, unreadCount: data.unreadCount, loading: false }));
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();

    // Connect WebSocket and listen for real-time notifications
    connectWS();

    const listener = (n: AppNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [n, ...prev.notifications].slice(0, 30),
        unreadCount: prev.unreadCount + 1,
      }));
    };

    listenerRef.current = listener;
    wsListeners.push(listener);

    // Ping keep-alive every 25 seconds
    const pingInterval = setInterval(() => {
      if (wsInstance?.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify({ type: 'ping' }));
      } else {
        connectWS(); // reconnect if dropped
      }
    }, 25000);

    return () => {
      wsListeners = wsListeners.filter(fn => fn !== listenerRef.current);
      clearInterval(pingInterval);
    };
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all', {});
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, readAt: prev.notifications[0]?.readAt ?? new Date().toISOString() })),
        unreadCount: 0,
      }));
    } catch { /* ignore */ }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setState(prev => {
        const removed = prev.notifications.find(n => n.id === id);
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== id),
          unreadCount: removed && !removed.readAt ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        };
      });
    } catch { /* ignore */ }
  }, []);

  const clearRead = useCallback(async () => {
    try {
      await api.delete('/notifications');
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => !n.readAt),
      }));
    } catch { /* ignore */ }
  }, []);

  return {
    ...state,
    markRead,
    markAllRead,
    remove,
    clearRead,
    refresh: load,
  };
}
