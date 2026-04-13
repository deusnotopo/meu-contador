import { initializeApp } from "firebase/app";
import { logger } from '@/lib/logger';
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getRemoteConfig } from "firebase/remote-config";
import type { FirebaseStorage } from "firebase/storage";
import type { RemoteConfig } from "firebase/remote-config";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase core (always required)
const app = initializeApp(firebaseConfig);

// Core services - always available
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Optional services - may fail gracefully if config is missing or CSP blocks them
export let storage: FirebaseStorage | undefined;
export let remoteConfig: RemoteConfig | undefined;
export let analytics: Analytics | null = null;

// Storage init
try {
  storage = getStorage(app);
} catch (e) {
  logger.warn("[Firebase] Storage unavailable:", e);
}

// Analytics + RemoteConfig: deferred to avoid blocking app startup if CSP blocks GTM.
// Uses a small timeout so the main React tree renders first.
if (typeof window !== "undefined" && firebaseConfig.appId && firebaseConfig.measurementId) {
  setTimeout(() => {
    try {
      remoteConfig = getRemoteConfig(app);
      analytics = getAnalytics(app);
    } catch (_e) {
      // Silently fail - analytics is non-critical. CSP may block GTM in some environments.
      logger.warn("[Firebase] Analytics unavailable (CSP or config issue). App continues normally.");
    }
  }, 2000);
}

export default app;
