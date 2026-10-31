import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  accent?: 'teal' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate';
  onClick?: () => void;
}

const accentStripeClasses: Record<string, { stripe: string; iconBg: string }> = {
  teal: {
    stripe: 'border-l-teal-600 dark:border-l-teal-500',
    iconBg: 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200/80 dark:border-teal-800/60',
  },
  emerald: {
    stripe: 'border-l-emerald-600 dark:border-l-emerald-500',
    iconBg: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60',
  },
  amber: {
    stripe: 'border-l-amber-600 dark:border-l-amber-500',
    iconBg: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
  },
  indigo: {
    stripe: 'border-l-indigo-600 dark:border-l-indigo-500',
    iconBg: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60',
  },
  rose: {
    stripe: 'border-l-rose-600 dark:border-l-rose-500',
    iconBg: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60',
  },
  slate: {
    stripe: 'border-l-slate-600 dark:border-l-slate-400',
    iconBg: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'teal',
  onClick,
}) => {
  const accentConfig = accentStripeClasses[accent] || accentStripeClasses.teal;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800/90 border-l-4 ${accentConfig.stripe} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        onClick
          ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div className={`p-1.5 rounded-lg border text-xs shrink-0 ${accentConfig.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3.5">
        <div className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold font-mono tabular-nums ${
                trend.positive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
