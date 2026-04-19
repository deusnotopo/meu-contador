/**
 * currency.ts — Shared currency conversion utilities
 * ────────────────────────────────────────────────────
 * AKITA RULE: All cent conversions go through here — no Math.round(* 100) inline.
 *
 * The database stores all monetary values as INTEGER CENTS.
 * The API surface always uses FLOAT R$ (e.g. 1050 cents = R$ 10.50).
 */

/**
 * Converts a float R$ value to integer cents.
 * Safe against floating-point drift (e.g. 10.50 * 100 = 1049.99...).
 */
export function toCents(value: number): number {
  return Math.round(value * 100);
}

/**
 * Converts integer cents to float R$.
 * e.g. fromCents(1050) = 10.50
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Rounds a R$ float value to 2 decimal places.
 * Use for display formatting — not for DB writes (use toCents for that).
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
