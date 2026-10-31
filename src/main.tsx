import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {AuthGate} from './AuthGate';
import {NotFound} from './pages/NotFound.tsx';
import './index.css';

// This app has no client-side router — every screen is an in-app tab, not a URL.
// A literal unknown path (typed in the address bar, or an old bookmark) gets a
// real 404 page instead of silently rendering the dashboard.
const isKnownPath = window.location.pathname === '/' || window.location.pathname === '/index.html';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isKnownPath ? <AuthGate /> : <NotFound />}</StrictMode>,
);
