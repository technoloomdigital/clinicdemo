import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from './config';

/**
 * AES-256-GCM field encryption for sensitive data at rest (e.g. patient notes, national IDs)
 * once a database is added. Output: `v1.<iv>.<tag>.<ciphertext>` (all base64url).
 * Requires DATA_ENCRYPTION_KEY (32 random bytes, base64):
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
export function encryptField(plain: string, key: Buffer | null = config.dataEncryptionKey): string {
  if (!key) throw new Error('DATA_ENCRYPTION_KEY is not configured');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

export function decryptField(payload: string, key: Buffer | null = config.dataEncryptionKey): string {
  if (!key) throw new Error('DATA_ENCRYPTION_KEY is not configured');
  const [v, iv, tag, ct] = payload.split('.');
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('Malformed ciphertext');
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8'); // throws if tampered
}
