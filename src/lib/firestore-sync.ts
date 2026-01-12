import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Syncs a specific key-value pair to Firestore user document.
 * @param userId - The Firebase user ID
 * @param key - The storage key (e.g., 'transactions')
 * @param data - The data to save
 */
export const syncToCloud = async (userId: string, key: string, data: any) => {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId, "data", key);
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
 * Loads a specific key from Firestore.
 * @param userId - The Firebase user ID
 * @param key - The storage key
 */
export const loadFromCloud = async (userId: string, key: string) => {
  if (!userId) return null;
  try {
    const userRef = doc(db, "users", userId, "data", key);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
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
  onUpdate: (data: any) => void
) => {
  if (!userId) return () => {};

  const userRef = doc(db, "users", userId, "data", key);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data().payload);
    }
  });
};
