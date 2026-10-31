import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual, createHash } from 'node:crypto';
import { config } from '../config';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/** Constant-time string comparison (hashes first so lengths never leak). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Gate for developer-only routes.
 *
 * Every failure returns a plain 404 — identical to a route that does not exist —
 * so regular users (or scanners) cannot even tell developer endpoints are there.
 *
 * A request is allowed only when ALL of these hold:
 *   1. DEV_TOOLS_ENABLED=true and a DEV_API_KEY (>=32 chars) is configured
 *   2. Not production (unless DEV_TOOLS_ALLOW_IN_PRODUCTION=true)
 *   3. Request comes from this machine (unless DEV_ALLOW_REMOTE=true)
 *   4. The `x-dev-key` header matches DEV_API_KEY (constant-time compare)
 */
export function requireDeveloper(req: Request, res: Response, next: NextFunction) {
  const notFound = () => res.status(404).json({ error: 'Not found' });

  if (!config.devTools.enabled) return notFound();

  if (!config.devTools.allowRemote) {
    const ip = req.socket.remoteAddress ?? '';
    if (!LOOPBACK.has(ip)) return notFound();
  }

  const provided = req.header('x-dev-key');
  if (!provided || !safeEqual(provided, config.devTools.apiKey)) return notFound();

  next();
}
