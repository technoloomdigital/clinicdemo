import type { NextFunction, Request, Response } from 'express';
import { getSession, readCookie, SESSION_COOKIE } from '../auth/sessions';
import { findById, publicUser, type Role } from '../auth/users';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; clinicId: string; role: Role };
    }
  }
}

/** Attaches req.auth from the session cookie; does not itself reject unauthenticated requests. */
export function loadSession(req: Request, _res: Response, next: NextFunction) {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  const session = getSession(token);
  if (session) {
    const user = findById(session.userId);
    if (user) req.auth = { userId: user.id, clinicId: session.clinicId, role: user.role };
  }
  next();
}

/** Rejects unauthenticated requests. Use after loadSession. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

/** Rejects requests whose session role isn't in `roles`. Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function currentPublicUser(userId: string) {
  const u = findById(userId);
  return u ? publicUser(u) : null;
}
