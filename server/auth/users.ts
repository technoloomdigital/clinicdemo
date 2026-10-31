import { hashPassword } from './passwords';
import { config } from '../config';

export type Role = 'owner' | 'doctor' | 'receptionist';

export interface BackendUser {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
}

// In-memory for now — same five demo accounts as the frontend's mock data (src/hooks/useStore.ts),
// so a login here maps onto the same users/clinics the UI already shows.
// Replace this whole module with real DB reads once a database is added; nothing else
// (routes/auth.ts, middleware) needs to change, since they only call the functions below.
const seedMeta: Array<Omit<BackendUser, 'passwordHash'>> = [
  { id: 'user-aura-owner', clinicId: 'clinic-aura-01', name: 'Dr. Evelyn Vance, MD', email: 'evelyn.vance@auramedical.com', role: 'owner' },
  { id: 'user-aura-doc2', clinicId: 'clinic-aura-01', name: 'Dr. Marcus Thorne, MD', email: 'marcus.thorne@auramedical.com', role: 'doctor' },
  { id: 'user-aura-rec', clinicId: 'clinic-aura-01', name: 'Sarah Jenkins', email: 'sarah.jenkins@auramedical.com', role: 'receptionist' },
  { id: 'user-vanguard-owner', clinicId: 'clinic-vanguard-02', name: 'Dr. Robert Chen, MD, FACS', email: 'robert.chen@vanguardortho.com', role: 'owner' },
  { id: 'user-vanguard-rec', clinicId: 'clinic-vanguard-02', name: "Liam O'Connor", email: 'liam@vanguardortho.com', role: 'receptionist' },
];

const byEmail = new Map<string, BackendUser>();
const byId = new Map<string, BackendUser>();

let ready: Promise<void> | null = null;

/** Must be awaited once before login/lookup; call lazily so config + password hashing stay async. */
export function usersReady(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (!config.seedDemoUsers) return; // production with real users: leave the store empty
    const password = config.seedDemoPassword ?? (() => {
      const generated = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      console.warn(`⚠️  SEED_DEMO_PASSWORD not set — using a random dev-only password for all demo accounts: ${generated}`);
      return generated;
    })();
    const hash = await hashPassword(password);
    for (const u of seedMeta) {
      const full: BackendUser = { ...u, passwordHash: hash };
      byEmail.set(u.email.toLowerCase(), full);
      byId.set(u.id, full);
    }
  })();
  return ready;
}

export function findByEmail(email: string): BackendUser | undefined {
  return byEmail.get(email.trim().toLowerCase());
}

export function findById(id: string): BackendUser | undefined {
  return byId.get(id);
}

export function publicUser(u: BackendUser) {
  const { passwordHash: _drop, ...rest } = u;
  return rest;
}
