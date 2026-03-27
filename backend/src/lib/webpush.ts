import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

webpush.setVapidDetails(
  'mailto:admin@meucontador.app',
  process.env.PUBLIC_VAPID_KEY || '',
  process.env.PRIVATE_VAPID_KEY || ''
);

export { webpush };
