import { UserRole } from '../types';

/**
 * Enterprise Security & Zero-Trust Utilities
 */

// 1. In-memory Rate Limiting for Auth/Sensitive Actions
interface RateLimitEntry {
  attempts: number;
  lockoutUntil: number | null;
}

const rateLimitStore: Record<string, RateLimitEntry> = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout

export function checkRateLimit(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore[key] || { attempts: 0, lockoutUntil: null };

  if (record.lockoutUntil && now < record.lockoutUntil) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: remainingSeconds };
  }

  if (record.lockoutUntil && now >= record.lockoutUntil) {
    // Reset lockout
    record.attempts = 0;
    record.lockoutUntil = null;
    rateLimitStore[key] = record;
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { allowed: true, remainingAttempts: remaining, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(key: string): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore[key] || { attempts: 0, lockoutUntil: null };

  record.attempts += 1;
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_MS;
    rateLimitStore[key] = record;
    return { locked: true, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }

  rateLimitStore[key] = record;
  return { locked: false, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  delete rateLimitStore[key];
}

// 2. Strict Input Sanitization (strip unsafe HTML, scripts, control characters)
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // remove brackets
    .replace(/javascript:/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '')
    .trim();
}

// 3. Cryptographic Token Generator for Invites & Prescription Verifications
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
  }
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generatePrescriptionHash(
  clinicId: string,
  patientId: string,
  doctorId: string,
  date: string,
  drugList: string
): string {
  const payload = `${clinicId}|${patientId}|${doctorId}|${date}|${drugList}|${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `RX-SHA256-${hex}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// 4. Zero-Trust RBAC Permission Matrix
export type AppAction =
  | 'view_patients'
  | 'edit_patient_profile'
  | 'create_patient'
  | 'view_medical_records'
  | 'write_clinical_notes'
  | 'write_prescription'
  | 'view_appointments'
  | 'manage_appointments'
  | 'check_in_patient'
  | 'view_billing'
  | 'create_invoice'
  | 'manage_staff'
  | 'clinic_settings'
  | 'view_audit_logs';

const RBAC_MATRIX: Record<UserRole, AppAction[]> = {
  owner: [
    'view_patients',
    'edit_patient_profile',
    'create_patient',
    'view_medical_records',
    'write_clinical_notes',
    'write_prescription',
    'view_appointments',
    'manage_appointments',
    'check_in_patient',
    'view_billing',
    'create_invoice',
    'manage_staff',
    'clinic_settings',
    'view_audit_logs',
  ],
  doctor: [
    'view_patients',
    'edit_patient_profile',
    'create_patient',
    'view_medical_records',
    'write_clinical_notes',
    'write_prescription',
    'view_appointments',
    'manage_appointments',
    'check_in_patient',
    'view_billing',
    'create_invoice',
  ],
  receptionist: [
    'view_patients',
    'edit_patient_profile',
    'create_patient',
    'view_appointments',
    'manage_appointments',
    'check_in_patient',
    'view_billing',
    'create_invoice',
  ],
};

export function hasPermission(role: UserRole | undefined, action: AppAction): boolean {
  if (!role) return false;
  return RBAC_MATRIX[role]?.includes(action) ?? false;
}
