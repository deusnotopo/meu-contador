import { doc, getDoc, onSnapshot, setDoc, DocumentSnapshot } from "firebase/firestore";
import { logger } from '@/lib/logger';
import { db, auth } from "./firebase";

const FIRESTORE_SYNC_ENABLED =
  import.meta.env.VITE_ENABLE_FIRESTORE_SYNC === "true" || import.meta.env.PROD;

/**
 * Firestore sync only works for users authenticated via Firebase (Google login).
 * Email/password users have PostgreSQL UUIDs, not Firebase UIDs.
 * We verify by checking auth.currentUser.uid matches the userId being synced.
 */
const canUseFirestoreSync = (userId?: string | null) => {
  if (!FIRESTORE_SYNC_ENABLED) return false;
  if (!userId || !auth.currentUser) return false;
  // Critical: Only sync if userId matches Firebase Auth UID.
  // This prevents email/password users from triggering Firestore calls that always timeout.
  if (auth.currentUser.uid !== userId) return false;
  return true;
};

/**
 * Syncs a specific key-value pair to Firestore user document.
 * @param userId - The Firebase user ID
 * @param key - The storage key (e.g., 'transactions')
 * @param data - The data to save
 */
export const syncToCloud = async (
  userId: string,
  key: string,
  data: unknown,
  collectionName: string = "users"
) => {
  // Em desenvolvimento local, o sync com Firestore fica desabilitado por padrão
  // para evitar timeouts e ruído no console. Ative com VITE_ENABLE_FIRESTORE_SYNC=true.
  if (!canUseFirestoreSync(userId)) {
    return;
  }
  try {
    const userRef = doc(db, collectionName, userId, "data", key);
    await setDoc(
      userRef,
      {
        payload: data,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Sync error for ${key}:`, error);
  }
};

/**
 * Loads a specific key from Firestore with a timeout to prevent infinite hanging.
 * @param userId - The Firebase user ID
 * @param key - The storage key
 */
export const loadFromCloud = async (
  userId: string,
  key: string,
  collectionName: string = "users"
) => {
  // Em desenvolvimento local, o sync com Firestore fica desabilitado por padrão.
  if (!canUseFirestoreSync(userId)) {
    return null;
  }
  try {
    const userRef = doc(db, collectionName, userId, "data", key);
    
    // Add a 10s timeout because getDoc can hang indefinitely if Firebase is blocked or offline
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Firestore getDoc timeout")), 10000)
    );
    
    const snap = await Promise.race([
      getDoc(userRef),
      timeoutPromise
    ]) as DocumentSnapshot;

    if (snap && snap.exists && snap.exists()) {
      return snap.data().payload;
    }
    return null;
  } catch (error) {
    console.error(`Load error for ${key}:`, error);
    return null;
  }
};

/**
 * Sets up a listener for cloud data changes.
 * Calls the callback when cloud data is newer or different.
 */
export const subscribeToCloud = (
  userId: string,
  key: string,
  onUpdate: (data: unknown) => void,
  collectionName: string = "users"
) => {
  if (!canUseFirestoreSync(userId)) {
    return () => {};
  }

  const userRef = doc(db, collectionName, userId, "data", key);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data().payload);
      }
    },
    (err) => logger.warn(`Firestore snapshot error for ${key}:`, err)
  );
};
