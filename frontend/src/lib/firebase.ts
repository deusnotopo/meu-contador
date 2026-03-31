import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getRemoteConfig } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);

import type { FirebaseStorage } from "firebase/storage";
import type { RemoteConfig } from "firebase/remote-config";
import type { Analytics } from "firebase/analytics";

// Services that require specific config variables
export let storage: FirebaseStorage | undefined;
export let remoteConfig: RemoteConfig | undefined;
export let analytics: Analytics | null = null;

try {
  storage = getStorage(app);
} catch (e) {
  console.warn("Storage failed to initialize:", e);
}

try {
  if (firebaseConfig.appId) {
    remoteConfig = getRemoteConfig(app);
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  } else {
    console.warn("Firebase appId missing. Analytics and Remote Config disabled.");
  }
} catch (e) {
  console.warn("Optional Firebase services failed to initialize:", e);
}

export default app;
