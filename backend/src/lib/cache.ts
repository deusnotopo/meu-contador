/**
 * Cache com dois níveis:
 * 1. Redis (Upstash) — compartilhado entre instâncias, persiste cold starts
 *    Ative configurando UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
 *    Conta gratuita: https://upstash.com (10k requests/dia grátis)
 * 2. In-memory Map — fallback quando Redis não está configurado
 *    Limitação: não compartilhado entre instâncias, perde no cold start
 */

import { Redis } from '@upstash/redis';

// --- Tipos ---

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// --- Redis (opcional) ---

let redis: Redis | null = null;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

if (UPSTASH_URL && UPSTASH_TOKEN) {
  redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  console.log('[Cache] Redis (Upstash) configured ✅');
} else {
  console.warn('[Cache] ⚠️  UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory fallback.');
}

// --- In-memory fallback ---

const memoryStore = new Map<string, CacheEntry<unknown>>();
const MAX_MEMORY_ENTRIES = 5000;

function memGet<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

function memSet<T>(key: string, value: T, ttlMs: number): void {
  if (memoryStore.size >= MAX_MEMORY_ENTRIES) {
    // Apaga 10% dos registros antigos baseando-se nas chaves da Map se o limite bater.
    const keys = Array.from(memoryStore.keys()).slice(0, 500);
    keys.forEach(k => memoryStore.delete(k));
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function memDelete(key: string): void {
  memoryStore.delete(key);
}

function memDeleteByPrefix(prefix: string): void {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
}

// --- API pública ---

/**
 * Recupera um valor do cache.
 * Tenta Redis primeiro; fallback para in-memory.
 */
export async function getCacheValue<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const value = await redis.get<T>(key);
      return value ?? null;
    } catch (err) {
      console.warn('[Cache] Redis get error, falling back to memory:', err);
      return memGet<T>(key);
    }
  }
  return memGet<T>(key);
}

/**
 * Armazena um valor no cache com TTL em milissegundos.
 */
export async function setCacheValue<T>(key: string, value: T, ttlMs: number): Promise<void> {
  if (redis) {
    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.warn('[Cache] Redis set error, falling back to memory:', err);
    }
  }
  memSet(key, value, ttlMs);
}

/**
 * Remove um valor do cache.
 */
export async function deleteCacheValue(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      console.warn('[Cache] Redis del error, falling back to memory:', err);
    }
  }
  memDelete(key);
}

export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  if (redis) {
    try {
      const keys = await (redis as unknown as { keys: (pattern: string) => Promise<string[]> }).keys(`${prefix}*`);
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redis!.del(key)));
      }
    } catch (err) {
      console.warn('[Cache] Redis delete by prefix error, falling back to memory:', err);
    }
  }

  memDeleteByPrefix(prefix);
}

/**
 * Verifica se o cache está usando Redis ou memória.
 */
export function getCacheBackend(): 'redis' | 'memory' {
  return redis ? 'redis' : 'memory';
}