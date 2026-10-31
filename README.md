# ClinicOS Enterprise

Multi-tenant clinic management system: patients, appointments, e-prescriptions, invoicing
and staff management. React 19 + Vite + Tailwind 4 + Zustand frontend, Express backend.

## Project layout

```
index.html        <- app entry page (project ROOT, next to package.json — Vite requires this)
src/               <- browser code (everything here ships to users)
public/            <- static files served as-is (favicon, social preview image)
server/            <- BACKEND — developers only, never bundled or served to browsers
  config.ts           env validation (zod) — every threshold configurable, no hard-coded secrets
  index.ts            Express app: security headers, https redirect, sessions, rate limits
  crypto.ts           AES-256-GCM field encryption helper (for once a database is added)
  rxSigning.ts        HMAC-SHA256 prescription sealing
  auth/
    passwords.ts        scrypt password hashing (memory-hard, OWASP params)
    sessions.ts         httpOnly/secure/SameSite=strict cookie sessions, idle+absolute timeout
    loginThrottle.ts    exponential backoff on repeated failed logins (per-IP AND per-account)
    users.ts            in-memory user store — mirrors the 5 demo accounts in src/hooks/useStore.ts
  routes/
    auth.ts             POST /api/auth/login, /logout, GET /api/auth/me
    public.ts           GET /api/health, POST /api/rx/sign, /api/rx/verify
    seo.ts               /robots.txt, /sitemap.xml
    dev.ts               /api/dev/*  — developer-only (see below)
  middleware/
    auth.ts              loadSession / requireAuth / requireRole
    requireDeveloper.ts   gate for /api/dev/*
```

## Connecting your backend data to the frontend (read this first)

Right now the frontend's data (patients, appointments, invoices, users — everything in
`src/hooks/useStore.ts`) is **mock data held in memory in the browser**. It resets on every
page refresh and isn't connected to the Express backend at all yet. The backend currently
only handles **auth** (login/session) and **prescription signing** — the two things that
truly need a server (a password check and a cryptographic secret can't safely live in the
browser). Here's exactly how to wire the rest together as you add a real database:

1. **Add real endpoints in `server/routes/`** — one file per resource is a good pattern
   (e.g. `server/routes/patients.ts` with `GET /api/patients`, `POST /api/patients`, ...).
   Protect each with `requireAuth` (any logged-in user) or `requireRole('owner', 'doctor')`
   from `server/middleware/auth.ts`, and always filter by `req.auth.clinicId` server-side —
   never trust a `clinic_id` sent from the browser, or one tenant could read another's data.
2. **Call them from the frontend through `src/lib/api.ts`** — add one function per endpoint
   there (following the pattern of `api.login` / `api.signPrescription`), using
   `credentials: 'include'` so the session cookie rides along automatically.
3. **Replace the Zustand actions in `src/hooks/useStore.ts`** one at a time — e.g. today
   `addPatient` just pushes into local state; change it to `await api.createPatient(...)`
   then update state from the real response. You don't have to do this all at once: the
   mock store and the real API can coexist feature-by-feature while you migrate.
4. **In development**, `npm run dev:all` runs the frontend (:3000) and backend (:3001)
   together, and Vite proxies `/api/*` to the backend (see `vite.config.ts`), so `fetch('/api/...')`
   from the browser just works with no CORS setup needed, in dev or in production.

## Run locally

```bash
npm install
cp .env.example .env.local        # then edit — at minimum set SEED_DEMO_PASSWORD for local logins
npm run dev:all                   # frontend :3000 + backend :3001 (proxied at /api)
```
Log in with any of the 5 seeded accounts (e.g. `evelyn.vance@auramedical.com`) and the
password you set as `SEED_DEMO_PASSWORD`.

## Production

```bash
npm run build
RX_SIGNING_SECRET=<48+ random chars> npm start   # serves dist/ + API on $PORT (default 3001)
```
The server refuses to start in production without `RX_SIGNING_SECRET`, and refuses
`SEED_DEMO_USERS=true` without a `SEED_DEMO_PASSWORD` (>=12 chars) — so it can't silently
ship demo logins with no password into production.

## How the backend stays developer-only

1. **Location** — `server/` is outside `src/` and `public/`, so it's never in the browser bundle
   (verified: the built `dist/` contains none of its code, secret names, or password logic).
2. **Dev server blocked** — `vite.config.ts` denies `**/server/**`, `.env*` and lockfiles (403).
3. **Production** — only `dist/` is served as static files; a request for `/server/...` gets
   the app shell (or a 404), never source.
4. **The developer API itself (`/api/dev/*`)** is off by default. It needs all of:
   `DEV_TOOLS_ENABLED=true`, a `DEV_API_KEY` (>=32 chars) sent as an `x-dev-key` header, and
   a request from the local machine (`DEV_ALLOW_REMOTE=true` to relax that). It's disabled in
   production unless you explicitly set `DEV_TOOLS_ALLOW_IN_PRODUCTION=true`. Every failure
   returns a plain **404** — identical to a route that doesn't exist — so it's invisible to
   regular users, not just locked.
   ```bash
   curl -H "x-dev-key: $DEV_API_KEY" http://127.0.0.1:3001/api/dev/status
   ```
5. **Secrets** live only in `.env.local` (git-ignored) and are validated at startup (`server/config.ts`)
   — the app refuses to boot with a malformed or too-short secret rather than silently using a weak one.

## Security features (backend)

- **Passwords**: scrypt (memory-hard, OWASP-recommended parameters), never stored or logged in plain text.
- **Sessions**: random 256-bit tokens, `httpOnly` + `secure` + `SameSite=strict` cookies (JS can't
  read them, so XSS can't steal them), idle + absolute expiry, only a hash of the token kept server-side.
- **Login throttling**: exponential backoff per-IP *and* per-account after a few failed attempts
  (not a hard lockout, so it can't be used to lock a real user out).
- **Timing-safe checks**: login always runs a real password hash comparison, even for unknown
  emails, so response time can't reveal which accounts exist; signature checks use `timingSafeEqual`.
- **Rate limiting** on all API routes (stricter on `/api/auth/*`), **Helmet** security headers +
  a real Content-Security-Policy, HTTPS redirect in production, encrypted cookies-in-transit.
- **Input validation**: every request body is checked against a strict `zod` schema server-side
  (`src/lib/validation.ts` already does this for forms; the backend applies the same discipline).
- **`server/crypto.ts`**: AES-256-GCM helper for encrypting sensitive fields at rest, ready for
  when a real database is added.
- **No secrets in git**: `.env.example` documents every variable; real values only ever go in
  `.env.local`, which is git-ignored.

## Site hygiene (frontend)

- `robots.txt` / `sitemap.xml` served dynamically from `server/routes/seo.ts` (this is a private,
  logged-in app, not a public site, so it's marked non-indexable — update it if that changes).
- Real favicon, Open Graph / Twitter social preview image, and `theme-color`.
- A genuine 404 page (`src/pages/NotFound.tsx`) for any unmatched URL, served with an actual
  404 HTTP status in production (`server/index.ts`), not just a silent redirect to the dashboard.

## Troubleshooting: "Request to /api/auth/login failed with 500" on a hosted deployment

This means the server crashed on that request instead of returning a real error message —
your hosting platform's own generic error page answered instead of ours. As of this build,
every async route is wrapped in `asyncHandler` (`server/lib/asyncHandler.ts`), which is the
actual fix: Express 4 does not automatically catch errors thrown inside `async` route
handlers, so before this fix, one failing login request could crash the entire process.
After this fix, a failure returns a clean `{"error": "..."}` with a 500 and the server keeps
running — so if you still see the generic (non-JSON) message, something is stopping the
process from ever sending a response at all. Check, in order:

1. **Your server's own console/log output** for the request — it now always prints the real
   error (`console.error` in `server/index.ts`'s error handler, or `⚠️ Unhandled promise
   rejection` / `🔥 Uncaught exception` from the process-level safety net). This tells you
   the actual cause far faster than guessing.
2. **Environment variables are actually set on the host** — `RX_SIGNING_SECRET` (production
   requires it), and if you want the 5 demo accounts to work, `SEED_DEMO_USERS=true` and
   `SEED_DEMO_PASSWORD` (>=12 chars). `server/config.ts` refuses to boot on a genuinely
   invalid value, but a variable that's simply *missing* on the host (as opposed to being in
   your local `.env.local`, which the host never sees) can produce different behavior than
   you expect locally.
3. **Memory limits on free/low-tier hosting.** Password hashing uses `scrypt` with
   memory-hard parameters (~128 MB per login, by design — this is what makes password
   cracking expensive). A host that caps the process at ~256 MB or less can run out of
   memory under this plus normal Node/React overhead. If your host's logs mention an
   out-of-memory kill, this is likely why.
4. **The process is actually running as a persistent Node server**, not as a static site or
   a serverless function without the right adapter — this project's backend
   (`npm start` running `server/index.ts`) needs a host that keeps a long-running Node
   process (e.g. Railway, Render, Fly.io, a VPS), not a static-file-only host.


`dev` `dev:server` `dev:all` `build` `start` `preview` `clean` `lint` (`tsc --noEmit`, strict mode)

## Known limitations (not yet production-ready)
- **Frontend data isn't connected to the backend yet** — see the section above for exactly
  how to do it. Patients/appointments/invoices/etc. are still mock data in the browser.
- **No database** — users, sessions and login-attempt counters are all in-memory and reset
  when the server restarts. Swap `server/auth/users.ts` for real DB reads first; nothing else
  needs to change, since routes only call its exported functions.
- **RBAC is enforced in the UI only** for anything besides login (`requireRole` exists and
  works, but no data routes use it yet, because there are no data routes yet — see above).
