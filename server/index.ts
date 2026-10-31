import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config';
import { publicRouter } from './routes/public';
import { authRouter } from './routes/auth';
import { devRouter } from './routes/dev';
import { seoRouter } from './routes/seo';
import { loadSession } from './middleware/auth';
import { usersReady } from './auth/users';
import { connectDB } from './db';

// Last-resort safety net: every async route is wrapped in asyncHandler (see server/lib/asyncHandler.ts),
// which is the real fix for a single bad request crashing the process. This just makes sure that if a
// future handler is added without it, the failure is logged loudly instead of silently killing the server.
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled promise rejection (a route is missing asyncHandler):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught exception:', err);
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

if (config.forceHttps) {
  app.use((req, res, next) => {
    if (req.secure || req.header('x-forwarded-proto') === 'https') return next();
    res.redirect(308, `https://${req.header('host')}${req.originalUrl}`);
  });
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...(config.analyticsScriptHost ? [config.analyticsScriptHost] : [])],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        frameSrc: ["'self'", 'blob:'],
        objectSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", ...(config.analyticsScriptHost ? [config.analyticsScriptHost] : [])],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    // HSTS only makes sense once the site is actually served over https.
    hsts: config.forceHttps ? undefined : false,
  }),
);
app.use(cors({
  origin: 'https://clinicdemo-mauve.vercel.app/',
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));

app.use(loadSession);
app.use(express.json({ limit: '100kb' }));
app.use(loadSession);

app.use('/', seoRouter);

app.use('/api/auth', rateLimit({ windowMs: 60_000, limit: config.rate.authPerMin, standardHeaders: true, legacyHeaders: false }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: config.rate.publicPerMin, standardHeaders: true, legacyHeaders: false }));

app.use('/api/auth', authRouter);
app.use('/api', publicRouter);
app.use('/api/dev', devRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Production: serve the built frontend only. Unknown paths still get the SPA shell
// (client-side main.tsx renders the real NotFound UI) but with a genuine 404 status,
// so both users and crawlers see a correct "not found" response.
const distDir = path.resolve(process.cwd(), 'dist');
if (config.isProd && fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: false, dotfiles: 'deny' }));
  app.get('*', (req, res) => {
    const status = req.path === '/' ? 200 : 404;
    res.status(status).sendFile(path.join(distDir, 'index.html'));
  });
}

// Never leak stack traces to clients.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  await connectDB();
  await usersReady();

  app.listen(config.port, () => {
    console.log(`ClinicOS API listening on :${config.port} (${config.env})`);
    if (config.rxSecretIsEphemeral) console.warn('⚠️  RX_SIGNING_SECRET not set — using an ephemeral dev secret.');
    console.log(`Demo users seeded: ${config.seedDemoUsers ? 'yes' : 'no'}`);
    console.log(`Developer tools: ${config.devTools.enabled ? 'ENABLED (key + loopback gated)' : 'disabled'}`);
  });
}

main().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
