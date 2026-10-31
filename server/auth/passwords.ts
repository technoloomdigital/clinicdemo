import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// scrypt (memory-hard, built into Node) — OWASP-recommended parameters (N=2^17, r=8, p=1).
const N = 131072;
const R = 8;
const P = 1;
const KEYLEN = 64;
const OPTS: ScryptOptions = { N, r: R, p: P, maxmem: 256 * 1024 * 1024 };

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password.normalize('NFKC'), salt, KEYLEN, OPTS, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Returns `scrypt$N$r$p$saltB64$hashB64` — parameters are stored so they can be upgraded later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  const actual = await scrypt(password, salt);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A real hash of a random value, verified against when the email is unknown so timing doesn't reveal which accounts exist. */
export const dummyHashPromise = hashPassword(randomBytes(16).toString('hex'));
