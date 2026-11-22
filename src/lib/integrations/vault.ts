/**
 * CALLBACX MARKETING — Credential vault
 *
 * AES-256-GCM encryption for OAuth tokens, API keys and webhook secrets at
 * rest. The encryption key is the INTEGRATION_VAULT_KEY environment variable
 * (32 random bytes, base64-encoded). It is server-only: never expose it to
 * the browser, never log it, never commit it.
 *
 * Operations requiring the vault (read credentials, rotate tokens, webhook
 * signature verification keys) MUST run in server-side route handlers or
 * service functions using the Supabase service-role client.
 */

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";
import { IntegrationError } from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const VAULT_KEY_BASE64 = process.env.INTEGRATION_VAULT_KEY;

function getVaultKey(): Buffer {
  if (!VAULT_KEY_BASE64) {
    throw new IntegrationError(
      "INTEGRATION_VAULT_KEY_MISSING",
      "INTEGRATION_VAULT_KEY is not set. Credential encryption is unavailable until an administrator configures it.",
      500,
    );
  }
  let key: Buffer;
  try {
    key = Buffer.from(VAULT_KEY_BASE64, "base64");
  } catch {
    throw new IntegrationError(
      "INTEGRATION_VAULT_KEY_INVALID",
      "INTEGRATION_VAULT_KEY is not valid base64.",
      500,
    );
  }
  if (key.length !== 32) {
    throw new IntegrationError(
      "INTEGRATION_VAULT_KEY_INVALID_LENGTH",
      "INTEGRATION_VAULT_KEY must decode to exactly 32 bytes (AES-256).",
      500,
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Encrypt / decrypt
// ---------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

/**
 * Encrypt a plaintext secret. Returns base64-encoded ciphertext, IV and auth tag.
 */
export function encryptCredential(plaintext: string): { encryptedValue: string; iv: string; tag: string } {
  const key = getVaultKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from("callbacx-integration-vault", "utf8"));

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedValue: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt a credential previously produced by encryptCredential.
 */
export function decryptCredential(input: {
  encryptedValue: string;
  iv: string;
  tag: string;
}): string {
  const key = getVaultKey();
  try {
    const encrypted = Buffer.from(input.encryptedValue, "base64");
    const iv = Buffer.from(input.iv, "base64");
    const tag = Buffer.from(input.tag, "base64");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from("callbacx-integration-vault", "utf8"));

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new IntegrationError(
      "INTEGRATION_CREDENTIAL_DECRYPT_FAILED",
      "Stored credential could not be decrypted. The vault key may have rotated.",
      500,
      undefined,
      undefined,
    );
  }
}

// ---------------------------------------------------------------------------
// Constant-time comparison (for webhook signatures etc.)
// ---------------------------------------------------------------------------

/**
 * Constant-time equality check to avoid timing attacks when comparing
 * signatures / secrets.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
