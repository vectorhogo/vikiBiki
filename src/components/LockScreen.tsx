import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertTriangle, Clock, RefreshCw, QrCode } from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

interface LockScreenProps {
  onUnlock: (code: string) => Promise<{ success: boolean; error?: string }>;
  isConfigured: boolean;
  onOpenSetup: () => void;
  lockoutRemainingSec: number;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  isConfigured,
  onOpenSetup,
  lockoutRemainingSec,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [lockoutRemainingSec]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric input
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Support pasting a 6-digit code
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((ch, i) => {
        if (i < 6) newDigits[i] = ch;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean[0];
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5 && clean[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleUnlockSubmit();
    }
  };

  const handleUnlockSubmit = async () => {
    if (lockoutRemainingSec > 0) {
      setErrorMessage(`لطفاً ${toPersianDigits(lockoutRemainingSec)} ثانیه تا تلاش مجدد صبر کنید.`);
      return;
    }

    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('لطفاً کد ۶ رقمی را به طور کامل وارد کنید.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await onUnlock(fullCode);
      if (!result.success) {
        setErrorMessage(result.error || 'کد واردشده صحیح نیست.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('کد واردشده صحیح نیست.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="app-lock-screen"
      className="min-h-screen w-full bg-[#0d0e12] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500/20"
      dir="rtl"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-[#16171d] border border-[#272932] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Dealership Identity */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
            <span className="text-black font-extrabold text-sm tracking-tight">AA</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-base text-zinc-100">نمایشگاه خودرو اتو عبداللهی</div>
            <div className="text-[11px] text-zinc-400">سامانه مدیریت تنخواه و حسابداری</div>
          </div>
        </div>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#1f2129] border border-[#2d303b] flex items-center justify-center mb-4 text-amber-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        {/* Prompt-specified clean lock texts */}
        <h1 className="text-lg font-bold text-zinc-100 mb-1">دسترسی برنامه منقضی شده است.</h1>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          برای ادامه استفاده، کد تأیید را وارد کنید.
        </p>

        {/* Lockout notice if rate-limited */}
        {lockoutRemainingSec > 0 && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-rose-400 animate-spin" />
            <span>
              تعداد تلاش‌های ناموفق زیاد بوده است. لطفاً{' '}
              <strong className="font-mono text-white">{toPersianDigits(lockoutRemainingSec)}</strong> ثانیه صبر
              کنید.
            </span>
          </div>
        )}

        {/* 6-digit code inputs */}
        <div className="w-full mb-5">
          <label className="block text-[11px] font-medium text-zinc-400 mb-2.5">
            کد تأیید Google Authenticator
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 dir-ltr" dir="ltr">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                id={`totp-digit-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={lockoutRemainingSec > 0 || isVerifying}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 text-center text-xl font-bold font-mono bg-[#111216] border border-[#2e313c] focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner disabled:opacity-50"
                placeholder="-"
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="w-full mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Unlock Button */}
        <button
          id="btn-unlock-app"
          onClick={handleUnlockSubmit}
          disabled={isVerifying || lockoutRemainingSec > 0}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>در حال اعتبارسنجی...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>باز کردن برنامه</span>
            </>
          )}
        </button>

        {/* Safety Guarantee */}
        <div className="mt-6 pt-5 border-t border-[#23252d] w-full flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تمامی اطلاعات حسابداری و اسناد به صورت امن و دست‌نخورده ذخیره شده‌اند.</span>
        </div>

        {/* Initial Setup or Re-pairing trigger */}
        {!isConfigured ? (
          <div className="mt-4 pt-3 w-full">
            <button
              onClick={onOpenSetup}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              راه‌اندازی اولیه و اتصال به Google Authenticator
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <button
              onClick={onOpenSetup}
              className="text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              نمایش QR کد یا تنظیم مجدد احراز هویت
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
