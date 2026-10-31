import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config';

export interface Session {
  userId: string;
  clinicId: string;
  createdAt: number;
  lastSeen: number;
}

// In-memory for now (single process). Swap for Redis/DB when scaling out.
// Only a SHA-256 of the token is stored, so a memory dump never reveals usable cookies.
const store = new Map<string, Session>();
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export function createSession(userId: string, clinicId: string): string {
  const token = randomBytes(32).toString('base64url'); // 256 bits
  const now = Date.now();
  store.set(hash(token), { userId, clinicId, createdAt: now, lastSeen: now });
  return token;
}

export function getSession(token: string | undefined): Session | null {
  if (!token) return null;
  const key = hash(token);
  const s = store.get(key);
  if (!s) return null;
  const now = Date.now();
  if (now - s.lastSeen > config.session.idleMs || now - s.createdAt > config.session.absoluteMs) {
    store.delete(key);
    return null;
  }
  s.lastSeen = now; // sliding idle timeout, capped by the absolute lifetime above
  return s;
}

export function destroySession(token: string | undefined) {
  if (token) store.delete(hash(token));
}

export function destroyAllSessionsForUser(userId: string) {
  for (const [k, s] of store) if (s.userId === userId) store.delete(k);
}

// Periodic cleanup so abandoned sessions cannot grow memory forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, s] of store)
    if (now - s.lastSeen > config.session.idleMs || now - s.createdAt > config.session.absoluteMs) store.delete(k);
}, 60_000).unref();

export const SESSION_COOKIE = config.isProd ? '__Host-clinicos_sid' : 'clinicos_sid';

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export function cookieOptions() {
  return {
    httpOnly: true, // JavaScript can never read the cookie (XSS can't steal it)
    secure: true, // https only in production
    sameSite: 'none' as const, // never sent on cross-site requests (CSRF defence)
    path: '/', // required for the __Host- prefix
    maxAge: config.session.absoluteMs,
  };
}
