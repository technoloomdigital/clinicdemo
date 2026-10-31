import { Router } from 'express';
import { config } from '../config';
import { requireDeveloper } from '../middleware/requireDeveloper';

/**
 * DEVELOPER-ONLY endpoints. Mounted at /api/dev and protected by requireDeveloper
 * (feature flag + API key + loopback-only by default). Invisible (404) to everyone else.
 */
export const devRouter = Router();
devRouter.use(requireDeveloper);

devRouter.get('/status', (_req, res) => {
  res.json({
    env: config.env,
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    rxSecretIsEphemeral: config.rxSecretIsEphemeral,
    devRemoteAllowed: config.devTools.allowRemote,
  });
});

devRouter.get('/routes', (_req, res) => {
  res.json({
    public: ['GET /api/health', 'POST /api/rx/sign', 'POST /api/rx/verify'],
    developerOnly: ['GET /api/dev/status', 'GET /api/dev/routes'],
  });
});
