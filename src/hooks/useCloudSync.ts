import { subscribeToCloud } from "@/lib/firestore-sync";
import { saveFromCloud, STORAGE_KEYS } from "@/lib/storage";
import { useEffect } from "react";

export const useCloudSync = (userId: string | undefined | null) => {
  useEffect(() => {
    if (!userId) return;

    // List of keys to sync
    // We filter out ONBOARDING and PRIVACY_MODE if they are device-specific,
    // but usually we want to sync everything.
    // However, storage.ts STORAGE_KEYS includes everything.
    const keysToSync = Object.values(STORAGE_KEYS);

    const unsubscribers: (() => void)[] = [];

    keysToSync.forEach((key) => {
      const unsub = subscribeToCloud(userId, key, (data) => {
        // When data comes from cloud, save it locally
        // This will trigger 'storage-local' event, updating hooks
        if (data) {
          saveFromCloud(key, data);
        }
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userId]);
};
