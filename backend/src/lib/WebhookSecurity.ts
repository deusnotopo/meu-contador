/**
 * WebhookSecurity
 * ───────────────
 * Cryptographic verification for external provider signals.
 */

import crypto from 'crypto';

const TIMESTAMP_SKEW_MS = 5 * 60 * 1000; // 5 minutes

export interface WebhookHeaders {
  signature?: string;
  timestamp?: string;
  secret?: string;
  authorization?: string;
}

export type VerificationResult =
  | { ok: true; mode: 'shared-secret' | 'hmac-signature' | 'insecure-dev' }
  | { ok: false; statusCode: number; error: string };

/**
 * Validates the authenticity of an incoming webhook.
 */
export function verify(
  payload: any,
  headers: WebhookHeaders,
  options: {
    sharedSecret?: string;
    signingSecret?: string;
    allowInsecure?: boolean;
  }
): VerificationResult {
  
  // 1. Shared Secret Check (Simple)
  if (options.sharedSecret && headers.secret) {
    if (safeCompare(options.sharedSecret, headers.secret)) {
      return { ok: true, mode: 'shared-secret' };
    }
  }

  // 2. HMAC Signature Check (Secure)
  if (options.signingSecret && headers.signature && headers.timestamp) {
    const timestamp = Number(headers.timestamp);
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > TIMESTAMP_SKEW_MS) {
      return { ok: false, statusCode: 401, error: 'INVALID_TIMESTAMP' };
    }

    const payloadStr = stableStringify(payload);
    const toSign = `${headers.timestamp}.${payloadStr}`;
    const expected = crypto.createHmac('sha256', options.signingSecret).update(toSign).digest('hex');
    const received = headers.signature.replace(/^sha256=/i, '');

    if (safeCompare(expected, received)) {
      return { ok: true, mode: 'hmac-signature' };
    }
  }

  // 3. Dev Override
  if (options.allowInsecure && process.env.NODE_ENV !== 'production') {
    return { ok: true, mode: 'insecure-dev' };
  }

  return { ok: false, statusCode: 401, error: 'UNAUTHORIZED_WEBHOOK' };
}

/**
 * Helpers
 */

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function stableStringify(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
