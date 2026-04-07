import { api } from './api';

const VAPID_PUBLIC_KEY = 'BBhUSpKA2tLaHG5o-tB6ByZjrx_9oYjy7_hhoztT5OdkwoHPF9vT2j8L4t0_QOr3gjbWJbK6jEfZo_t3Fb7Xk9k';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestPushPermission() {
  if (!('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificação negada.');
  }
  return permission;
}

export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  // Verifica se já existe uma subscrição
  let subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    return subscription;
  }

  // Se não houver, cria uma nova
  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  };

  subscription = await registration.pushManager.subscribe(subscribeOptions);
  return subscription;
}

export async function registerPushWithBackend(subscription: PushSubscription) {
  // Converte a subscrição para o formato que o backend espera
  const subJSON = subscription.toJSON();
  
  const payload = {
    endpoint: subJSON.endpoint,
    keys: {
      p256dh: subJSON.keys?.p256dh,
      auth: subJSON.keys?.auth
    }
  };

  return await api.post('/api/push/subscribe', payload);
}

export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
