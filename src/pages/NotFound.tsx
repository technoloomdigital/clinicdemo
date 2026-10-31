import React from 'react';

/**
 * Client-side 404 for unmatched routes. The Express server also serves this same
 * built app for unknown paths (SPA fallback) with a 404 status, so both direct
 * navigation and in-app dead links land on a real, on-brand not-found page.
 */
export const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
    <div className="text-center max-w-md">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mb-6">
        <span className="text-white font-bold text-2xl">404</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2.5 text-white font-medium hover:bg-teal-700 transition-colors"
      >
        Back to dashboard
      </a>
    </div>
  </div>
);
