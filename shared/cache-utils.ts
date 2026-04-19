/**
 * cache-utils.ts — Shared cache utilities
 * ──────────────────────────────────────────
 * AKITA RULE: Never use a fixed TTL across all services simultaneously.
 * A fixed TTL causes all caches to expire and rebuild at the same time
 * (thundering herd), which spikes database load.
 *
 * Use withJitter() to randomize TTL within ±20% of the base value.
 */

/**
 * Adds random jitter to a cache TTL to prevent thundering herd.
 *
 * @param baseTtlMs  Base TTL in milliseconds (e.g. 300_000 for 5 minutes)
 * @param jitterPct  Max jitter fraction (default 0.2 = ±20%)
 * @returns          TTL between baseTtlMs * 0.8 and baseTtlMs * 1.2
 *
 * @example
 * const CACHE_TTL = withJitter(300_000); // 4min..6min instead of always 5min
 */
export function withJitter(baseTtlMs: number, jitterPct = 0.2): number {
  const delta = baseTtlMs * jitterPct;
  return Math.floor(baseTtlMs + (Math.random() * 2 - 1) * delta);
}
