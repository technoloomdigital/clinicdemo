import { Router } from 'express';
import { z } from 'zod';
import { dummyHashPromise, verifyPassword } from '../auth/passwords';
import { accountThrottle, ipThrottle } from '../auth/loginThrottle';
import { cookieOptions, createSession, destroySession, readCookie, SESSION_COOKIE } from '../auth/sessions';
import { findByEmail, publicUser, usersReady } from '../auth/users';
import { loadSession, requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';

export const authRouter = Router();

const LoginSchema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(200) }).strict();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    await usersReady();
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid request' });
    const { email, password } = body.data;

    const ip = req.ip ?? 'unknown';
    const ipCheck = ipThrottle.check(ip);
    const acctCheck = accountThrottle.check(email.toLowerCase());
    if (!ipCheck.allowed || !acctCheck.allowed) {
      const retryAfter = Math.max(ipCheck.retryAfterSeconds, acctCheck.retryAfterSeconds);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many attempts, please wait and try again.', retryAfterSeconds: retryAfter });
    }

    const user = findByEmail(email);
    // Always run a real scrypt verify, even for unknown emails, so response timing can't reveal
    // which emails exist (constant-time verifyPassword against a real, unrelated hash).
    const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, await dummyHashPromise);

    if (!ok || !user) {
      ipThrottle.fail(ip);
      accountThrottle.fail(email.toLowerCase());
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    ipThrottle.success(ip);
    accountThrottle.success(email.toLowerCase());
    const token = createSession(user.id, user.clinicId);
    res.cookie(SESSION_COOKIE, token, cookieOptions());
    res.json({ user: publicUser(user) });
  }),
);

authRouter.post(
  '/logout',
  loadSession,
  asyncHandler(async (req, res) => {
    destroySession(readCookie(req.headers.cookie, SESSION_COOKIE));
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  }),
);

authRouter.get('/me', loadSession, requireAuth, (req, res) => {
  res.json({ auth: req.auth });
});
