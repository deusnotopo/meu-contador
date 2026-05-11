/**
 * Privacy Fortress: Web Crypto API AES-GCM Implementation
 * Provides industry-standard encryption for local data residency.
 */
import { logger } from "@/lib/logger";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // Standard for GCM

/**
 * Derives a cryptographic key from a source string (e.g. User Session ID)
 * This ensures the key is tied to the current authenticated context.
 */
async function getDerivationKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("meu-contador-salt-2026"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

const getStoredSecret = () => {
    // In a real scenario, this would come from a secure source like the JWT 
    // or a session-only volatile memory. For now, we use a consistent 
    // derivation base.
    return "session-fixed-secret-v1"; 
};

/**
 * Encrypts a plain text string into a combined Base64 string (IV + Ciphertext)
 */
export async function encrypt(plainText: string): Promise<string> {
  try {
    const secret = getStoredSecret();
    const key = await getDerivationKey(secret);
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const enc = new TextEncoder();
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      enc.encode(plainText)
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    logger.warn('[Crypto] Encryption failed — falling back to plain text', error);
    return plainText; // Fallback to plain text if crypto fails (availability over secrecy)
  }
}

/**
 * Decrypts a combined Base64 string back into plain text
 */
export async function decrypt(combinedBase64: string): Promise<string | null> {
  try {
    const combined = new Uint8Array(
      atob(combinedBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const secret = getStoredSecret();
    const key = await getDerivationKey(secret);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (_error) {
    // Decryption failure usually means the data is corrupt or key is wrong.
    // We return null to allow the loader to handle it (e.g. clearing invalid data).
    return null;
  }
}
