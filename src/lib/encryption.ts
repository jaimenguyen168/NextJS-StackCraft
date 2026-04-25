import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

/**
 * Encrypts a plaintext string. Returns a colon-separated base64 string:
 * `iv:authTag:ciphertext`
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypts a value produced by `encrypt()`. Returns the original plaintext.
 * Throws if the value has been tampered with or the key is wrong.
 */
export function decrypt(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted value");
  const [ivB64, authTagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}
