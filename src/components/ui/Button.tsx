import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-600 dark:hover:bg-teal-500 shadow-xs border border-teal-700/20 active:opacity-95',
  secondary:
    'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-xs active:opacity-95',
  outline:
    'border border-slate-300/90 dark:border-slate-700/90 bg-white dark:bg-[#0D1117] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 shadow-2xs',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-rose-700/20',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-xs font-semibold rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm font-semibold rounded-lg gap-2.5',
  icon: 'p-2 rounded-lg aspect-square',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
