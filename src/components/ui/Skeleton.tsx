import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded h-4 w-full'
      : 'rounded-xl';

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/70 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent ${variantClass} ${className}`}
    />
  );
};

export const MetricsSkeletonGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0D0D11] border border-slate-200/80 dark:border-white/10 space-y-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="w-24 h-4" variant="text" />
            <Skeleton className="w-8 h-8" variant="circular" />
          </div>
          <Skeleton className="w-32 h-8" variant="text" />
          <Skeleton className="w-20 h-3" variant="text" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0D0D11] overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-white/5 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-5" variant="text" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-1/3">
              <Skeleton className="w-10 h-10 shrink-0" variant="circular" />
              <div className="w-full space-y-1.5">
                <Skeleton className="w-3/4 h-4" variant="text" />
                <Skeleton className="w-1/2 h-3" variant="text" />
              </div>
            </div>
            <Skeleton className="w-1/4 h-4" variant="text" />
            <Skeleton className="w-1/6 h-6 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};
