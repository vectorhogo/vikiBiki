import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAccounting();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 pointer-events-none" dir="rtl">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          error: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100',
          warning: 'border-amber-500/30 bg-amber-950/80 text-amber-100',
          error: 'border-rose-500/30 bg-rose-950/80 text-rose-100',
          info: 'border-sky-500/30 bg-sky-950/80 text-sky-100',
        };

        const type = toast.type || 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${borders[type]}`}
          >
            {icons[type]}
            <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="mr-2 text-white/50 hover:text-white p-0.5 rounded transition-colors"
              aria-label="بستن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
