import React, { useState } from 'react';
import { X, Clock, ShieldCheck, Lock, QrCode } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { TotpSetupModal } from './TotpSetupModal';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, onClose }) => {
  const { formatActivationTime, lockApplication, currentTotpSecret, setupTotp } = useAccounting();
  const [isTotpOpen, setIsTotpOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
        dir="rtl"
      >
        <div className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">دسترسی و امنیت ۲۴ ساعته</h3>
                <p className="text-[11px] text-zinc-400">اتو عبداللهی — حسابداری و امنیت روزمره</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 text-xs">
            {/* Countdown Clock */}
            <div className="p-4 rounded-xl bg-[#141519] border border-[#252830] text-center space-y-1">
              <span className="text-zinc-400 text-[11px] block font-normal">مهلت استفاده باقیمانده</span>
              <div className="font-mono text-2xl font-black text-amber-400 tracking-widest dir-ltr">
                {formatActivationTime()}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-medium pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>دسترسی روزانه فعال و امن</span>
              </div>
            </div>

            <div className="space-y-2 text-zinc-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#191b21] border border-[#242730]">
                <span className="text-zinc-400">روش بازگشایی:</span>
                <span className="font-semibold text-zinc-200">Google Authenticator (RFC 6238)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#191b21] border border-[#242730]">
                <span className="text-zinc-400">ذخیره‌سازی اطلاعات:</span>
                <span className="font-semibold text-zinc-200">محلی و رمزنگاری‌شده (Local-First)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsTotpOpen(true)}
                className="px-3 py-2 bg-[#20222a] hover:bg-[#282b34] text-zinc-200 border border-[#2e313b] font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>مشاهده QR کد اتصال</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  lockApplication();
                }}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>قفل کردن برنامه اکنون</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#26282e] bg-[#141519] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs bg-[#242730] hover:bg-[#2d313c] text-zinc-200 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>

      <TotpSetupModal
        isOpen={isTotpOpen}
        onClose={() => setIsTotpOpen(false)}
        currentSecret={currentTotpSecret}
        onSetupSuccess={async (newSecret) => {
          await setupTotp(newSecret);
          setIsTotpOpen(false);
        }}
      />
    </>
  );
};
