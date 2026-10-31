# Changes made in this pass

## From the "20 things before launch" checklists (screenshots/videos)
| Item | Status |
|---|---|
| Hide API keys / secrets off the frontend | ✅ `server/` never bundled; verified 0 backend strings in `dist/` |
| Force HTTPS | ✅ redirect in production (`FORCE_HTTPS`) |
| Enforce server-side auth / lock record access | ✅ real login (`scrypt` + sessions); `requireAuth`/`requireRole` ready for data routes |
| Hash passwords | ✅ scrypt, OWASP params |
| Secure session cookies | ✅ httpOnly + secure + SameSite=strict, idle+absolute expiry |
| Rate limit login / add bot protection | ✅ per-IP + per-account exponential backoff, plus general rate limiting |
| Validate all input | ✅ zod schemas on every backend route (frontend already had this) |
| Add security headers / CORS settings | ✅ Helmet + CSP; same-origin only (no cross-origin API exposed) |
| Secure API endpoints / block field tampering | ✅ zod `.strip()`/`.strict()` schemas drop unexpected fields |
| Encrypt sensitive data | ✅ `server/crypto.ts` (AES-256-GCM) ready for when a DB is added |
| Meta titles + descriptions, social preview image, favicon | ✅ already had meta tags; added `og-image.svg` + `theme-color` |
| Sitemap + robots.txt | ✅ `server/routes/seo.ts` (dynamic, marked non-indexable — private app) |
| Custom 404 page | ✅ `src/pages/NotFound.tsx`, served with a real 404 status in production |
| Scan dependencies / remove unused packages | ✅ removed unused `@google/genai`; deduped `vite` |
| Check exposed files | ✅ dev server denies `server/**`, `.env*`, lockfiles; prod serves only `dist/` |
| Check env variables | ✅ `server/config.ts` validates everything at startup, refuses to boot if misconfigured |
| Alt text on images, compress images, check page load speed, fix color contrast | Not applicable yet — the app uses icon components, not `<img>` tags, so there's nothing to add alt text to or compress. Worth revisiting once real photos/uploads exist. |
| Form validation | Already present on the frontend (`src/lib/validation.ts`) |

## From the previous pass (see earlier conversation)
TypeScript strict mode, a real type error and a possible crash fixed, package.json cleanup,
initial `server/` scaffold with prescription HMAC signing and gated `/api/dev/*`.

## Added this pass
- Real authentication: `server/auth/{passwords,sessions,loginThrottle,users}.ts`, `server/routes/auth.ts`.
- `server/middleware/auth.ts` (`loadSession`, `requireAuth`, `requireRole`) — ready to protect
  future data routes (patients, appointments, etc.).
- `server/crypto.ts` — field-level encryption helper for sensitive data at rest.
- `server/routes/seo.ts` — robots.txt / sitemap.xml.
- `src/pages/NotFound.tsx` + `src/main.tsx` now renders it for any unmatched path.
- `og-image.svg`, `theme-color` meta tag.
- `src/lib/api.ts` extended with `login` / `logout` / `me`, using cookie-based sessions.
- Every security threshold (rate limits, backoff timing, session length) is a configurable
  env var, not a hard-coded number.

## Not done (see README "Known limitations")
Frontend data (patients/appointments/invoices/etc.) is still mock data and isn't wired to the
backend yet — the README has a step-by-step section on exactly how to do that.

## Fixed this pass: crash-on-error in async login/logout routes
A thrown error inside an `async` Express 4 route handler (`authRouter.post('/login', ...)`
and `.../logout`) was **not** caught and forwarded to our error middleware — Express 4 doesn't
do this automatically the way Express 5 does. Any unexpected failure there (a bad env value,
a hiccup in the password-hashing call, etc.) crashed the whole Node process instead of just
failing that one request. This is very likely the cause of the "Request to /api/auth/login
failed with 500" error seen when hosting the app: the platform's own generic error page
answered because our server had gone down, not because our code returned a real error.

Fix: added `server/lib/asyncHandler.ts` and wrapped every async route with it, so a thrown
error now always becomes a clean `{"error": "..."}` JSON 500 and the server keeps running.
Also added a process-level `unhandledRejection`/`uncaughtException` logger as a safety net
for any future route added without the wrapper. Verified by deliberately forcing a crash
inside the login handler: before the fix this killed the server; after, it returns a proper
500 and the very next login request still succeeds. See README's new troubleshooting section
for how to find the *original* cause on your specific host now that you can see it.
