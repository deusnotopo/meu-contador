import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error('Erro ao pesquisar service worker:', e);
    }
  };

  const subscribe = async () => {
    try {
      setLoading(true);
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão negada ou não respondida pelo usuário');
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
         throw new Error('Chave VAPID_PÚBLICA do Firebase/WebPush inexistente no .env');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário Requer Login no App Primeiro');

      // Manda essa Chave para a API Push no Fastify Server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
         throw new Error('Falha ao registrar assinatura no servidor');
      }

      setIsSubscribed(true);
      return true;

    } catch (error) {
      console.error('Falha de Registro WebPush:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { isSupported, isSubscribed, loading, subscribe };
}
