// @ts-ignore - web-push has no official @types package bundled
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

const publicKey = process.env.PUBLIC_VAPID_KEY;
const privateKey = process.env.PRIVATE_VAPID_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@meucontador.app',
    publicKey,
    privateKey
  );
} else {
  console.warn('[WebPush] VAPID keys not set — push notifications disabled.');
}

export { webpush };
