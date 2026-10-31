import { config } from '../config';

interface Entry {
  failures: number;
  blockedUntil: number;
  lastFailure: number;
}

/**
 * Exponential backoff (not a hard lockout): after `freeAttempts` failures, each further
 * failure doubles the wait (base * 2^n) up to a configured maximum. Counters reset after
 * a quiet window or a successful login. Thresholds all come from config.
 */
export class BackoffThrottle {
  private map = new Map<string, Entry>();
  constructor(private freeAttempts: number, private maxEntries = 20_000) {}

  check(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const e = this.map.get(key);
    const now = Date.now();
    if (!e) return { allowed: true, retryAfterSeconds: 0 };
    if (now - e.lastFailure > config.login.windowMs) {
      this.map.delete(key);
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (now < e.blockedUntil) return { allowed: false, retryAfterSeconds: Math.ceil((e.blockedUntil - now) / 1000) };
    return { allowed: true, retryAfterSeconds: 0 };
  }

  fail(key: string) {
    const now = Date.now();
    if (this.map.size >= this.maxEntries && !this.map.has(key)) this.prune(now);
    const e = this.map.get(key) ?? { failures: 0, blockedUntil: 0, lastFailure: now };
    e.failures += 1;
    e.lastFailure = now;
    if (e.failures > this.freeAttempts) {
      const over = e.failures - this.freeAttempts;
      const seconds = Math.min(config.login.baseSeconds * 2 ** (over - 1), config.login.maxSeconds);
      e.blockedUntil = now + seconds * 1000;
    }
    this.map.set(key, e);
  }

  success(key: string) {
    this.map.delete(key);
  }

  private prune(now: number) {
    for (const [k, e] of this.map) if (now - e.lastFailure > config.login.windowMs) this.map.delete(k);
    if (this.map.size >= this.maxEntries) this.map.clear(); // extreme flood: fail open on memory, rate limiter still applies
  }
}

export const ipThrottle = new BackoffThrottle(config.login.ip.freeAttempts);
export const accountThrottle = new BackoffThrottle(config.login.account.freeAttempts);
