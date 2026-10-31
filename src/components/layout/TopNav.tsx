import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  UserPlus,
  CalendarPlus,
  ChevronDown,
  Menu,
  LogOut,
  CreditCard,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, useClinic } from '../../hooks/useStore';
import { TabType } from '../../types';
import { api } from '../../lib/api';

export interface TopNavProps {
  activeTab?: string;
  onTabChange?: (tab: TabType) => void;
  onOpenRegisterClinic: () => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment: () => void;
  onToggleMobileMenu?: () => void;
}

const tabTitles: Record<string, string> = {
  dashboard: 'Executive Overview',
  appointments: 'Clinical Schedule',
  patients: 'Patient Directory',
  prescriptions: 'Electronic Prescriptions',
  billing: 'Financials & Invoicing',
  team: 'Clinic Profile & Practice Doctors',
};

export const TopNav: React.FC<TopNavProps> = ({
  activeTab = 'dashboard',
  onTabChange,
  onOpenRegisterClinic,
  onOpenNewPatient,
  onOpenNewAppointment,
  onToggleMobileMenu,
}) => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const currentUser = useStore((state) => state.currentUser);
  const currentClinic = useClinic();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMasterAccount = currentUser.role === 'owner';
  const pageTitle = tabTitles[activeTab] || 'Workspace';

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-[#090D14] border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Breadcrumb & Contextual Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {currentClinic.name}
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={pageTitle}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="text-slate-500 dark:text-slate-400 hidden sm:inline truncate font-medium"
              >
                {pageTitle}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Zone 2 & 3: Actions & Executive Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Action: New Appointment */}
          <button
            onClick={onOpenNewAppointment}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0D1117] hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700/80 transition-colors cursor-pointer shadow-2xs"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>New Appointment</span>
          </button>

          {/* Quick Action: Add Patient */}
          <button
            onClick={onOpenNewPatient}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </button>

          {/* Animated Theme Mode Switcher */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer overflow-hidden"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Moon className="w-4 h-4 text-slate-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User Account Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0D1117] transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-semibold text-[11px] shrink-0 font-mono">
                {currentUser.name
                  .replace('Dr.', '')
                  .trim()
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <span className="hidden sm:inline text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                {currentUser.name.split(',')[0]}
              </span>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 shadow-lg p-1.5 z-50 origin-top-right"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{isMasterAccount ? 'Clinic Master' : 'Attending Doctor'}</span>
                      <span className="mx-1">·</span>
                      <span className={currentClinic.status === 'active' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                        {currentClinic.status === 'active' ? 'Active' : 'Pending Activation'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (onTabChange) onTabChange('team');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Clinic Subscription (PKR)</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (onTabChange) onTabChange('team');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Clinic Profile & Staff</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenRegisterClinic();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <span className="text-teal-600 font-bold">+</span>
                      <span>New Clinic Account</span>
                    </button>
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        useStore.getState().showToast('Signing out…', 'info');
                        try {
                          await api.logout();
                        } finally {
                          // Reload so AuthGate re-checks the (now-cleared) session and
                          // shows the login page, rather than leaving stale app state visible.
                          window.location.reload();
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
