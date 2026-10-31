import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Receipt,
  Building2,
  X,
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore, useClinic } from '../../hooks/useStore';
import { TabType } from '../../types';

export interface SidebarProps {
  activeTab: TabType;
  setActiveTab?: (tab: TabType) => void;
  onTabChange?: (tab: TabType) => void;
  onOpenNewClinic?: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  onOpenNewClinic,
  isMobileOpen = false,
  onClose,
}) => {
  const handleTabChange = onTabChange || setActiveTab || (() => {});
  const currentUser = useStore((state) => state.currentUser);
  const currentClinic = useClinic();

  const isMasterAccount = currentUser.role === 'owner';

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'appointments' as TabType,
      label: 'Appointments',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'patients' as TabType,
      label: 'Patients',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'prescriptions' as TabType,
      label: 'Prescriptions',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'billing' as TabType,
      label: 'Billing & Invoices',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'team' as TabType,
      label: 'Clinic & Doctors',
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  const onNavClick = (tabId: TabType) => {
    handleTabChange(tabId);
    if (onClose) onClose();
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* App Wordmark */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
              +
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">
                ClinicOS
              </span>
              <span className="text-[10px] text-slate-400 block font-normal -mt-0.5">
                Practice System
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list with animated active pill */}
        <div className="space-y-0.5 relative">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Clinical Suite
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left select-none ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavHighlight"
                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800/90 rounded-lg shadow-2xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer: Clinic & User summary */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="px-2 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-left">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {currentClinic.name}
            </span>
            <span
              className={`font-mono text-[10px] ${
                currentClinic.status === 'active'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {currentClinic.status === 'active' ? 'ACTIVE' : 'PENDING'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
            <span className="truncate font-medium">{currentUser.name.split(',')[0]}</span>
            <span className="text-slate-400 text-[10px]">{isMasterAccount ? 'Master' : 'Doctor'}</span>
          </div>
        </div>

        {onOpenNewClinic && (
          <button
            onClick={onOpenNewClinic}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            <span>Register New Clinic</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:h-screen lg:sticky lg:top-0 p-3 bg-white dark:bg-[#090D14] border-r border-slate-200/90 dark:border-slate-800 z-20">
        {navContent}
      </aside>

      {/* Mobile Sliding Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#090D14] border-r border-slate-200 dark:border-slate-800 p-4 shadow-xl flex flex-col justify-between h-full z-10">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                ClinicOS
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
