/**
 * Server configuration. Loaded ONLY by the Node backend (never imported by src/).
 * All secrets come from environment variables; nothing sensitive is hard-coded.
 * Every security threshold is configurable (nothing hard-coded).
 */
import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const bool = (def: 'true' | 'false') =>
  z.enum(['true', 'false']).default(def).transform((v) => v === 'true');
const int = (def: number, min = 0, max = 1_000_000) => z.coerce.number().int().min(min).max(max).default(def);
// An unset .env value often arrives as '' (e.g. copied straight from .env.example), not
// undefined — treat blank strings as "not provided" for every optional field below.
const blank = (v: unknown) => (v === '' ? undefined : v);
const optionalUrl = () => z.preprocess(blank, z.string().url().optional());
const optionalString = (min: number) => z.preprocess(blank, z.string().min(min).optional());
const optionalEnum = <T extends [string, ...string[]]>(values: T) => z.preprocess(blank, z.enum(values).optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: int(3001, 0, 65535),
  /** Public https URL of the site, e.g. https://app.example.com (used for sitemap + social tags). */
  APP_URL: optionalUrl(),

  // --- Secrets ---
  RX_SIGNING_SECRET: optionalString(32),
  /** 32 random bytes, base64. Used by server/crypto.ts for encrypting sensitive fields at rest. */
  DATA_ENCRYPTION_KEY: optionalString(1),

  // --- Transport ---
  /** Number of reverse-proxy hops to trust (0 = none). Needed for correct IP + https detection. */
  TRUST_PROXY: int(0, 0, 10),
  /** Redirect http -> https in production. */
  FORCE_HTTPS: bool('true'),

  // --- Sessions ---
  SESSION_IDLE_MINUTES: int(30, 1, 1440),
  SESSION_ABSOLUTE_HOURS: int(8, 1, 720),

  // --- Rate limits (requests per minute per IP) ---
  RATE_PUBLIC_PER_MIN: int(120, 1),
  RATE_AUTH_PER_MIN: int(20, 1),
  RATE_AUTHED_PER_MIN: int(300, 1),

  // --- Login exponential backoff (not a hard lockout) ---
  LOGIN_IP_FREE_ATTEMPTS: int(10, 1),
  LOGIN_ACCOUNT_FREE_ATTEMPTS: int(4, 1),
  LOGIN_BACKOFF_BASE_SECONDS: int(2, 1),
  LOGIN_BACKOFF_MAX_SECONDS: int(900, 1),
  LOGIN_ATTEMPT_WINDOW_MINUTES: int(30, 1),

  // --- Users (temporary in-memory store until a database is added) ---
  SEED_DEMO_USERS: optionalEnum(['true', 'false']),
  /** Password for the seeded demo users (min 12 chars). If unset in dev, a random one is printed once. */
  SEED_DEMO_PASSWORD: optionalString(12),

  // --- Optional privacy-friendly analytics script host (added to CSP only when set) ---
  ANALYTICS_SCRIPT_HOST: optionalUrl(),

  // --- Developer-only tools ---
  DEV_TOOLS_ENABLED: bool('false'),
  DEV_API_KEY: optionalString(32),
  DEV_ALLOW_REMOTE: bool('false'),
  DEV_TOOLS_ALLOW_IN_PRODUCTION: bool('false'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid server environment configuration:');
  for (const issue of parsed.error.issues) console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const env = parsed.data;
const isProd = env.NODE_ENV === 'production';

if (isProd && !env.RX_SIGNING_SECRET) {
  console.error('❌ RX_SIGNING_SECRET (>=32 chars) is required when NODE_ENV=production.');
  process.exit(1);
}
if (env.DATA_ENCRYPTION_KEY && Buffer.from(env.DATA_ENCRYPTION_KEY, 'base64').length !== 32) {
  console.error('❌ DATA_ENCRYPTION_KEY must be 32 random bytes, base64-encoded.');
  process.exit(1);
}

const seedDemo = env.SEED_DEMO_USERS ? env.SEED_DEMO_USERS === 'true' : !isProd;
if (isProd && seedDemo && !env.SEED_DEMO_PASSWORD) {
  console.error('❌ SEED_DEMO_USERS=true in production requires SEED_DEMO_PASSWORD (>=12 chars).');
  process.exit(1);
}

export const config = {
  env: env.NODE_ENV,
  isProd,
  port: env.PORT,
  appUrl: env.APP_URL?.replace(/\/$/, ''),
  rxSigningSecret: env.RX_SIGNING_SECRET ?? `dev-${randomBytes(24).toString('hex')}`,
  rxSecretIsEphemeral: !env.RX_SIGNING_SECRET,
  dataEncryptionKey: env.DATA_ENCRYPTION_KEY ? Buffer.from(env.DATA_ENCRYPTION_KEY, 'base64') : null,
  trustProxy: env.TRUST_PROXY,
  forceHttps: isProd && env.FORCE_HTTPS,
  session: {
    idleMs: env.SESSION_IDLE_MINUTES * 60_000,
    absoluteMs: env.SESSION_ABSOLUTE_HOURS * 3_600_000,
  },
  rate: {
    publicPerMin: env.RATE_PUBLIC_PER_MIN,
    authPerMin: env.RATE_AUTH_PER_MIN,
    authedPerMin: env.RATE_AUTHED_PER_MIN,
  },
  login: {
    ip: { freeAttempts: env.LOGIN_IP_FREE_ATTEMPTS },
    account: { freeAttempts: env.LOGIN_ACCOUNT_FREE_ATTEMPTS },
    baseSeconds: env.LOGIN_BACKOFF_BASE_SECONDS,
    maxSeconds: env.LOGIN_BACKOFF_MAX_SECONDS,
    windowMs: env.LOGIN_ATTEMPT_WINDOW_MINUTES * 60_000,
  },
  seedDemoUsers: seedDemo,
  seedDemoPassword: env.SEED_DEMO_PASSWORD,
  analyticsScriptHost: env.ANALYTICS_SCRIPT_HOST,
  devTools: {
    enabled: env.DEV_TOOLS_ENABLED && !!env.DEV_API_KEY && (!isProd || env.DEV_TOOLS_ALLOW_IN_PRODUCTION),
    apiKey: env.DEV_API_KEY ?? '',
    allowRemote: env.DEV_ALLOW_REMOTE,
  },
} as const;

if (env.DEV_TOOLS_ENABLED && !env.DEV_API_KEY) {
  console.warn('⚠️  DEV_TOOLS_ENABLED=true but DEV_API_KEY is missing/too short (<32) — developer routes stay OFF.');
}
