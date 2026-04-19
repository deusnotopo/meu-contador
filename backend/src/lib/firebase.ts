/**
 * Firebase Admin Initialization
 * ─────────────────────────────
 * Centralized place for Firebase services.
 */

import firebaseAdmin from 'firebase-admin';

try {
  if (!firebaseAdmin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'meucontador-367cf';

    if (privateKey && clientEmail && !privateKey.includes('dummy')) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
      });
      console.log('[Firebase Admin] Initialized with service account credentials ✅');
    } else {
      firebaseAdmin.initializeApp({ projectId });
      console.warn(
        '[Firebase Admin] ⚠️  Running without service account. ' +
        'Google auth will remain unavailable until FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are configured.'
      );
    }
  }
} catch (e) {
  console.warn('[Firebase Admin] Init error:', e);
}

export { firebaseAdmin };
export default firebaseAdmin;
