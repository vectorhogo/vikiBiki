import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  generateRandomBase32Secret,
  getTotpUri,
  verifyTotpCode,
} from '../utils/security';
import { toPersianDigits } from '../utils/formatters';

interface TotpSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupSuccess: (secret: string) => Promise<void>;
  currentSecret?: string | null;
}

export const TotpSetupModal: React.FC<TotpSetupModalProps> = ({
  isOpen,
  onClose,
  onSetupSuccess,
  currentSecret,
}) => {
  const [secret, setSecret] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize or generate secret
  useEffect(() => {
    if (!isOpen) return;

    let activeSecret = currentSecret;
    if (!activeSecret) {
      activeSecret = generateRandomBase32Secret(20);
    }
    setSecret(activeSecret);
    setVerificationCode('');
    setErrorMessage(null);
    setSuccessMessage(null);

    const uri = getTotpUri(activeSecret, 'مدیر_اتو_عبداللهی', 'اتو_عبداللهی');

    QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [isOpen, currentSecret]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerateSecret = () => {
    const newSecret = generateRandomBase32Secret(20);
    setSecret(newSecret);
    setVerificationCode('');
    setErrorMessage(null);

    const uri = getTotpUri(newSecret, 'مدیر_اتو_عبداللهی', 'اتو_عبداللهی');
    QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl);
  };

  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('کد تأیید باید دقیقاً ۶ رقم باشد.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const isValid = await verifyTotpCode(secret, cleanCode);
      if (!isValid) {
        setErrorMessage('کد واردشده صحیح نیست. لطفاً کد فعلی اپلیکیشن را بررسی کنید.');
        setIsVerifying(false);
        return;
      }

      setSuccessMessage('فعالسازی با موفقیت انجام شد.');
      await onSetupSuccess(secret);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setErrorMessage('خطا در اعتبارسنجی کد تأیید.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Format secret with spacing for manual entry
  const formattedSecret = secret.match(/.{1,4}/g)?.join(' ') || secret;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-[#18191e] border border-[#2d3038] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                اتصال برنامه به Google Authenticator
              </h3>
              <p className="text-[11px] text-zinc-400">راه‌اندازی ورود امن و بازگشایی ۲۴ ساعته</p>
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
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {/* Instructions Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[11px] font-bold">
                ۱
              </span>
              <span>اسکن کد QR با گوشی یا ثبت کلید دستی</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#141519] border border-[#26282f] p-4 rounded-xl">
              {/* QR Code */}
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Google Authenticator QR"
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-zinc-400">
                    در حال ساخت...
                  </div>
                )}
              </div>

              {/* Manual Key & Info */}
              <div className="flex-1 space-y-3 w-full">
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  اپلیکیشن Google Authenticator را در گوشی همراه باز کنید، علامت + را زده و گزینه Scan a QR code را انتخاب کنید.
                </p>

                {/* Manual Secret Box */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-semibold text-zinc-300">کلید دستی (در صورت عدم اسکن):</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[10px] font-medium cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>کپی کلید</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1a1c22] border border-[#2f323c] font-mono text-center text-xs tracking-widest text-amber-300 font-bold select-all dir-ltr">
                    {formattedSecret}
                  </div>
                </div>

                {!currentSecret && (
                  <button
                    type="button"
                    onClick={handleRegenerateSecret}
                    className="text-[10px] text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>تولید کلید جدید تصادفی</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Verification Form Step 2 */}
          <form onSubmit={handleVerifyAndActivate} className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[11px] font-bold">
                ۲
              </span>
              <span>تأیید و راه‌اندازی با کد ۶ رقمی</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141519] border border-[#26282f] space-y-3">
              <label className="block text-zinc-300 font-medium">
                کد ۶ رقمی جاری نمایش داده شده در اپلیکیشن را وارد کنید:
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="مثال: ۴۸۲۱۹۳"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-[#1a1c22] border border-[#2e313b] focus:border-amber-500 rounded-xl px-4 py-2.5 text-center text-lg font-bold font-mono tracking-widest text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dir-ltr"
                />

                <button
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>اعتبارسنجی...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأیید و فعال‌سازی</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status messages */}
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-bold">{successMessage}</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#26282e] bg-[#141519] flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            کلید شما به صورت رمزنگاری‌شده در سیستم ذخیره می‌شود.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
