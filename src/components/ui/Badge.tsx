import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<string, { bg: string; dot: string }> = {
  default: {
    bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/80',
    dot: 'bg-slate-500',
  },
  neutral: {
    bg: 'bg-slate-100/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200/80 dark:border-slate-800',
    dot: 'bg-slate-400',
  },
  success: {
    bg: 'bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-50/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
    dot: 'bg-amber-600 dark:bg-amber-400',
  },
  danger: {
    bg: 'bg-rose-50/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
    dot: 'bg-rose-600 dark:bg-rose-400',
  },
  info: {
    bg: 'bg-teal-50/80 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/40',
    dot: 'bg-teal-600 dark:bg-teal-400',
  },
  purple: {
    bg: 'bg-indigo-50/80 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
  },
  slate: {
    bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
}) => {
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium tracking-normal border whitespace-nowrap ${currentVariant.bg} ${sizeStyle} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentVariant.dot}`} />}
      {children}
    </span>
  );
};
