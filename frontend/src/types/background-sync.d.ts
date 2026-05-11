/**
 * Background Sync API type declarations
 * Spec: https://wicg.github.io/background-sync/spec/
 *
 * Não há @types/service-worker-background-sync no npm.
 * Esta declaração local cobre o uso em useOfflineSync.ts.
 */

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}
