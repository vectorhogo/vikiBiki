import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';

interface PeriodManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'close' | 'reopen';
  periodId?: string;
}

export const PeriodManagementModal: React.FC<PeriodManagementModalProps> = ({
  isOpen,
  onClose,
  mode,
  periodId,
}) => {
  const {
    periods,
    activePeriodId,
    closePeriodWithCheck,
    reopenClosedPeriod,
    expenses,
    incomes,
    cashAdvances,
  } = useAccounting();

  const [notesOrReason, setNotesOrReason] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetPeriodId = periodId || activePeriodId;
  const targetPeriod = periods.find((p) => p.id === targetPeriodId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPeriod) return;

    setIsSubmitting(true);
    if (mode === 'close') {
      const res = closePeriodWithCheck(targetPeriod.id, notesOrReason);
      if (res.success) {
        onClose();
      }
    } else {
      if (!notesOrReason.trim()) {
        setIsSubmitting(false);
        return;
      }
      const res = reopenClosedPeriod(targetPeriod.id, notesOrReason);
      if (res.success) {
        onClose();
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-[#161820] border border-[#2b2e3b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#121319] px-5 py-4 border-b border-[#252834] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                mode === 'close'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              {mode === 'close' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                {mode === 'close' ? 'بستن و قفل دوره مالی' : 'بازگشایی و اصلاح دوره بسته'}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                دوره: {targetPeriod?.title || 'نامشخص'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#252834] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {mode === 'close' ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>اثرات بستن دوره مالی:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-300 leading-relaxed pr-1">
                  <li>دوره در حالت «فقط-خواندنی» قرار گرفته و ثبت مستقیم تراکنش‌های جدید در آن متوقف می‌شود.</li>
                  <li>خلاصه آماری نهایی (ترازنامه پایانی) محاسبه و به صورت تغییرناپذیر بایگانی می‌گردد.</li>
                  <li>برای تغییر رکوردهای این دوره نیاز به ثبت دلیل رسمی اصلاح خواهد بود.</li>
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  یادداشت یا توضیحات پایانی دوره (اختیاری):
                </label>
                <textarea
                  value={notesOrReason}
                  onChange={(e) => setNotesOrReason(e.target.value)}
                  placeholder="مثال: پایان سال مالی و انبارگردانی، تسویه با پرسنل..."
                  rows={3}
                  className="w-full bg-[#1a1c24] border border-[#2b2e3c] rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-hidden focus:border-rose-500/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-2 text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>ثبت دلیل رسمی بازگشایی الزامی است:</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  برای حفظ قابلیت حسابرسی دقیق (Audit Trail)، هرگونه بازگشایی دوره بسته مستلزم ثبت دلیل رسمی است.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  دلیل بازگشایی / اصلاح دوره (الزامی):
                </label>
                <textarea
                  value={notesOrReason}
                  onChange={(e) => setNotesOrReason(e.target.value)}
                  placeholder="مثال: اصلاح فاکتور جامانده قطعات مورخ ۲۵ اسفند به دستور مدیریت..."
                  rows={3}
                  required
                  className="w-full bg-[#1a1c24] border border-[#2b2e3c] rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#20222c] hover:bg-[#282b37] text-zinc-300 font-bold transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (mode === 'reopen' && !notesOrReason.trim())}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                mode === 'close'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow-lg shadow-amber-950/40'
              }`}
            >
              {mode === 'close' ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>بستن و قفل دوره</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>تأیید و بازگشایی دوره</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
