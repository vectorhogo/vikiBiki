import React, { useState, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';
import { toPersianDigits, formatToman } from '../utils/formatters';
import { PeriodIntegrityResult } from '../types/accounting';

interface PeriodIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PeriodIntegrityModal: React.FC<PeriodIntegrityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    checkPeriodIntegrity,
    activePeriod,
    periods,
    expenses,
    cashAdvances,
    showToast,
  } = useAccounting();

  const [result, setResult] = useState<PeriodIntegrityResult | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const runAudit = () => {
    setIsRunningCheck(true);
    setTimeout(() => {
      const res = checkPeriodIntegrity();
      setResult(res);
      setIsRunningCheck(false);
    }, 250);
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const errorCount = result?.issues.filter((i) => i.severity === 'error').length || 0;
  const warningCount = result?.issues.filter((i) => i.severity === 'warning').length || 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-[#161820] border border-[#2b2e3b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#121319] px-5 py-4 border-b border-[#252834] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                بررسی صحت اطلاعات و دوره‌های مالی
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                بررسی یکپارچگی ارجاعات، تاریخ‌های ثبتی و مانده‌های مالی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAudit}
              disabled={isRunningCheck}
              className="px-2.5 py-1.5 rounded-lg bg-[#20222c] hover:bg-[#282b38] border border-[#2f3240] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="اجرای مجدد آزمون صحت‌سنجی"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningCheck ? 'animate-spin text-amber-400' : ''}`} />
              <span>بررسی مجدد</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#252834] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Summary Banner */}
          {result && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                result.status === 'clean'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              {result.status === 'clean' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold text-sm">
                  {result.status === 'clean'
                    ? 'وضعیت دوره کاملاً منظم و یکپارچه است'
                    : `تعداد ${toPersianDigits(result.issueCount)} مورد نیازمند بررسی یافت شد`}
                </div>
                <div className="text-[11px] mt-1 text-zinc-300 leading-relaxed">
                  {result.status === 'clean'
                    ? `تعداد ${toPersianDigits(result.totalRecordsChecked)} رکورد مالی بررسی گردید و هیچ مغایرت ساختاری، تاریخ خارج از محدوده یا مانده منفی مشاهده نشد.`
                    : `بررسی روی ${toPersianDigits(result.totalRecordsChecked)} رکورد مالی انجام شد (${toPersianDigits(errorCount)} خطا، ${toPersianDigits(warningCount)} هشدار).`}
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#1a1c24] border border-[#292c37] p-3 rounded-xl">
              <span className="text-[10px] text-zinc-400 block font-medium">دوره‌های مالی موجود</span>
              <span className="text-base font-bold text-zinc-100 font-mono mt-0.5 block">
                {toPersianDigits(periods.length)} دوره
              </span>
            </div>
            <div className="bg-[#1a1c24] border border-[#292c37] p-3 rounded-xl">
              <span className="text-[10px] text-zinc-400 block font-medium">کل رکوردهای بررسی‌شده</span>
              <span className="text-base font-bold text-zinc-100 font-mono mt-0.5 block">
                {toPersianDigits(result?.totalRecordsChecked || 0)}
              </span>
            </div>
            <div className="bg-[#1a1c24] border border-[#292c37] p-3 rounded-xl">
              <span className="text-[10px] text-zinc-400 block font-medium">دوره جاری فعال</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block truncate">
                {activePeriod?.title || 'نامشخص'}
              </span>
            </div>
          </div>

          {/* Issues List */}
          {result && result.issues.length > 0 ? (
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-200 text-xs flex items-center justify-between">
                <span>فهرست مغایرت‌ها و موارد شناسایی‌شده:</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {toPersianDigits(result.issues.length)} مورد
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {result.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                      issue.severity === 'error'
                        ? 'bg-rose-500/5 border-rose-500/25 text-rose-300'
                        : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-0.5">
                      <div className="font-bold text-zinc-200 flex items-center justify-between">
                        <span>{issue.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            issue.severity === 'error'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {issue.severity === 'error' ? 'نیازمند اصلاح' : 'هشدار دوره'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 leading-relaxed">
                        {issue.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-400 space-y-2 bg-[#191b22] border border-[#252834] rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="font-bold text-zinc-200">صحت‌سنجی دوره با موفقیت انجام شد</div>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                هیچ‌گونه تراکنش خارج از بازه دوره، سند افتتاحیه تکراری یا مغایرت تنخواه در داده‌های ثبت‌شده یافت نشد.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#121319] px-5 py-3 border-t border-[#252834] flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-400 font-mono">
            آخرین تاریخ بررسی: {toPersianDigits(result?.checkedAt || '')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#242734] hover:bg-[#2c3040] text-zinc-200 font-bold transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
