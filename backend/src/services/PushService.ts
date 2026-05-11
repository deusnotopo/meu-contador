/**
 * PushService
 * ───────────
 * Application layer for WebPush notifications.
 */

import { db } from "../lib/db.js";
import { webpush } from "../lib/webpush.js";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribe(userId: string, subscription: PushSubscriptionInput) {
  const { endpoint, keys } = subscription;
  
  const pushSub = await db.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
    },
  });

  // Welcome signal
  const payload = JSON.stringify({
    title: 'Meu Contador',
    body: 'Notificações Inteligentes ativadas com sucesso.',
  });

  // Fire and forget
  webpush.sendNotification({
    endpoint: pushSub.endpoint,
    keys: { p256dh: pushSub.p256dh, auth: pushSub.auth }
  }, payload).catch(() => {});

  return pushSub;
}

export async function sendUserTestNotification(userId: string, options: { title?: string, body?: string }) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return { successCount: 0, failureCount: 0 };

  const payload = JSON.stringify({
    title: options.title || 'Notificação de Teste',
    body: options.body || 'O sistema WebPush no backend disparou perfeitamente.',
  });

  let successCount = 0;
  let failureCount = 0;

  for (const subRecord of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: subRecord.endpoint,
        keys: { p256dh: subRecord.p256dh, auth: subRecord.auth }
      }, payload);
      successCount++;
    } catch (error: unknown) {
      failureCount++;
      // Cleanup for 410 (Gone) or 404 (Not Found)
      const statusCode = error instanceof Object && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 0;
      if (statusCode === 410 || statusCode === 404) {
        await db.pushSubscription.delete({ where: { id: subRecord.id } });
      }
    }
  }

  return { successCount, failureCount };
}
