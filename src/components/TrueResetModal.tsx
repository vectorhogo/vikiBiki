import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { AlertTriangle, ShieldAlert, X, Download, Trash2 } from 'lucide-react';

interface TrueResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONFIRMATION_PHRASE = 'حذف تمام اطلاعات';

export const TrueResetModal: React.FC<TrueResetModalProps> = ({ isOpen, onClose }) => {
  const { resetAllData, createManualBackup } = useAccounting();
  const [typedPhrase, setTypedPhrase] = useState('');
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleBackupFirst = async () => {
    setIsProcessing(true);
    await createManualBackup();
    setHasBackedUp(true);
    setIsProcessing(false);
  };

  const handleExecuteReset = async () => {
    if (typedPhrase !== CONFIRMATION_PHRASE) return;

    setIsProcessing(true);
    // Ensure final backup was created
    if (!hasBackedUp) {
      await createManualBackup();
    }

    resetAllData();
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-[#171416] border border-rose-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-sm font-bold text-rose-200">عملیات پیشرفته: پاکسازی کامل اطلاعات</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-zinc-300">
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl space-y-1.5 text-rose-200">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>هشدار جدی: این عمل غیرقابل بازگشت است!</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200/90">
              «شروع از اول» در سیستم‌های حسابداری معمولاً از طریق <strong>سند افتتاحیه جدید</strong> انجام می‌شود که سوابق را حفظ می‌کند. این دکمه فقط برای تست یا راه‌اندازی صفر مطلق پایگاه داده است و تمام هزینه‌ها، خودروها و تنخواه‌ها را پاکسازی می‌کند.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-zinc-300 font-bold">
              گام ۱: دریافت پشتیبان اضطراری نهایی (الزامی)
            </label>
            <button
              onClick={handleBackupFirst}
              disabled={isProcessing}
              className={`w-full py-2.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                hasBackedUp
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {hasBackedUp ? '✓ پشتیبان اضطراری دانلود و ذخیره شد' : 'دریافت فایل پشتیبان ZIP قبل از پاکسازی'}
              </span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-zinc-300 font-bold">
              گام ۲: جهت تأیید، عبارت زیر را دقیقاً تایپ فرمایید:
            </label>
            <div className="p-2 bg-black/40 rounded border border-zinc-800 text-center font-bold text-rose-400 select-all font-mono">
              {CONFIRMATION_PHRASE}
            </div>
            <input
              type="text"
              placeholder="عبارت بالا را اینجا تایپ کنید..."
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              className="w-full bg-[#0f0e11] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-center font-bold focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#121012] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            انصراف و بازگشت
          </button>

          <button
            onClick={handleExecuteReset}
            disabled={typedPhrase !== CONFIRMATION_PHRASE || isProcessing}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>پاکسازی کامل پایگاه داده</span>
          </button>
        </div>
      </div>
    </div>
  );
};
