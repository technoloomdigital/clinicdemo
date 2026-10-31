import { Router } from 'express';
import { z } from 'zod';
import { signPrescription, verifyPrescription } from '../rxSigning';

export const publicRouter = Router();

const str = z.string().min(1).max(500);
const rxSchema = z.object({
  clinicId: str,
  patientId: str,
  doctorId: str,
  date: str,
  drugList: z.string().max(4000),
});

/** Minimal liveness probe. Deliberately reveals no versions, env, or config. */
publicRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

publicRouter.post('/rx/sign', (req, res) => {
  const body = rxSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid request' });
  res.json(signPrescription(body.data));
});

publicRouter.post('/rx/verify', (req, res) => {
  const body = rxSchema.extend({ issuedAt: str, signature: str }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid request' });
  const { issuedAt, signature, ...payload } = body.data;
  res.json({ valid: verifyPrescription(payload, issuedAt, signature) });
});
