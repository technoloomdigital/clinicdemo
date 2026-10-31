import React, { useEffect, useState } from 'react';
import App from './App';
import { LoginPage } from './features/auth/LoginPage';
import { api } from './lib/api';
import { useStore } from './hooks/useStore';

type Status = 'checking' | 'authenticated' | 'unauthenticated';

/**
 * Gates the whole app behind a real session. On mount it asks the backend
 * (GET /api/auth/me, cookie-based) whether this browser already has a valid
 * session; if not, it shows LoginPage until a successful POST /api/auth/login.
 */
export const AuthGate: React.FC = () => {
  const [status, setStatus] = useState<Status>('checking');
  const setAuthenticatedUser = useStore((s) => s.setAuthenticatedUser);
  const users = useStore((s) => s.users);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ auth }) => {
        if (cancelled) return;
        const backendUser = users.find((u) => u.id === auth.userId);
        setAuthenticatedUser({
          id: auth.userId,
          clinicId: auth.clinicId,
          name: backendUser?.name ?? 'Signed-in user',
          email: backendUser?.email ?? '',
          role: auth.role as 'owner' | 'doctor' | 'receptionist',
        });
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
    // Runs once on mount; `users` is the static mock roster, not reactive session state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginPage onLoggedIn={() => setStatus('authenticated')} />;
  }

  return <App />;
};
