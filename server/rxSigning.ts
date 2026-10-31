import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config';

export interface RxPayload {
  clinicId: string;
  patientId: string;
  doctorId: string;
  date: string;
  drugList: string;
}

function canonical(p: RxPayload, issuedAt: string): string {
  // JSON array => unambiguous encoding; a "|" inside a field cannot forge another field.
  return JSON.stringify([p.clinicId, p.patientId, p.doctorId, p.date, p.drugList, issuedAt]);
}

/** Real HMAC-SHA256 seal (the client-side "hash" is only a display checksum). */
export function signPrescription(p: RxPayload) {
  const issuedAt = new Date().toISOString();
  const digest = createHmac('sha256', config.rxSigningSecret).update(canonical(p, issuedAt)).digest('hex');
  return { issuedAt, signature: `RX-HMAC-${digest.slice(0, 32).toUpperCase()}` };
}

export function verifyPrescription(p: RxPayload, issuedAt: string, signature: string): boolean {
  const digest = createHmac('sha256', config.rxSigningSecret).update(canonical(p, issuedAt)).digest('hex');
  const expected = Buffer.from(`RX-HMAC-${digest.slice(0, 32).toUpperCase()}`);
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
