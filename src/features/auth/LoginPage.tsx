import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../../hooks/useStore';

interface LoginPageProps {
  onLoggedIn: () => void;
}

const DEMO_ACCOUNTS = [
  { label: 'Aura Health — Owner', email: 'evelyn.vance@auramedical.com' },
  { label: 'Aura Health — Doctor', email: 'marcus.thorne@auramedical.com' },
  { label: 'Aura Health — Receptionist', email: 'sarah.jenkins@auramedical.com' },
  { label: 'Vanguard Ortho — Owner', email: 'robert.chen@vanguardortho.com' },
  { label: 'Vanguard Ortho — Receptionist', email: 'liam@vanguardortho.com' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoggedIn }) => {
  const setAuthenticatedUser = useStore((s) => s.setAuthenticatedUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user } = await api.login(email.trim(), password);
      setAuthenticatedUser(user);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">ClinicOS Enterprise</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your clinic workspace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
          <div className="relative mb-4">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
          <div className="relative mb-5">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-2.5 transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          <p className="mb-1.5 font-medium">Demo accounts (dev only)</p>
          <div className="flex flex-col gap-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => setEmail(a.email)}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {a.label} — {a.email}
              </button>
            ))}
          </div>
          <p className="mt-2">Password: whatever your server's <code>SEED_DEMO_PASSWORD</code> is set to.</p>
        </div>
      </motion.div>
    </div>
  );
};
