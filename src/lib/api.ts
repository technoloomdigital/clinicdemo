/**
 * Thin client for the ClinicOS backend. Only calls PUBLIC endpoints — the
 * developer-only /api/dev/* routes are intentionally never referenced here.
 * Session auth uses an httpOnly cookie (set by the server), so there is no
 * token to store in JS — `credentials: 'include'` just makes sure the
 * cookie rides along with each request.
 */
export interface RxSeal {
  issuedAt: string;
  signature: string;
}

export interface RxPayload {
  clinicId: string;
  patientId: string;
  doctorId: string;
  date: string;
  drugList: string;
}

export interface PublicUser {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  role: 'owner' | 'doctor' | 'receptionist';
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${url} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: PublicUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ auth: { userId: string; clinicId: string; role: string } }>('/api/auth/me'),

  signPrescription: (payload: RxPayload) => request<RxSeal>('/api/rx/sign', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPrescription: (payload: RxPayload & RxSeal) =>
    request<{ valid: boolean }>('/api/rx/verify', { method: 'POST', body: JSON.stringify(payload) }),
  health: async () => {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  },
};
