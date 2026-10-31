import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useStore } from '../../hooks/useStore';

export const Toast: React.FC = () => {
  const toastMessage = useStore((state) => state.toastMessage);
  const clearToast = useStore((state) => state.clearToast);

  if (!toastMessage) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-teal-500 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100',
    info: 'border-teal-500/30 bg-teal-50/90 dark:bg-teal-950/80 text-teal-900 dark:text-teal-100',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 max-w-md">
      <div className={`flex items-center gap-3 w-full p-1 rounded-lg ${borderMap[toastMessage.type]}`}>
        {iconMap[toastMessage.type]}
        <p className="text-xs font-medium leading-relaxed pr-2">{toastMessage.text}</p>
        <button
          onClick={clearToast}
          className="ml-auto p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-current transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = Toast;

