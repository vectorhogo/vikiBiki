import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, ArrowLeft, Wallet, User, Calendar } from 'lucide-react';
import { CashAdvance } from '../types/accounting';
import { formatToman, parseTomanInput, toPersianDigits } from '../utils/formatters';
import { useAccounting } from '../context/AccountingContext';

interface SettlementModalProps {
  advance: CashAdvance | null;
  onClose: () => void;
  onConfirmSettlement?: (advanceId: string) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  advance,
  onClose,
}) => {
  const { expenses, settleCashAdvanceWithDetails, showToast } = useAccounting();

  const [actualReturnRaw, setActualReturnRaw] = useState<string>('');
  const [differenceReason, setDifferenceReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Find expenses linked to this advance
  const linkedExpenses = advance
    ? expenses.filter(
        (e) => e.status === 'active' && e.paymentSource === 'advance' && e.cashAdvanceId === advance.id
      )
    : [];

  const totalSpent = linkedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedReturn = advance ? Math.max(0, advance.amount - totalSpent) : 0;

  useEffect(() => {
    if (advance) {
      setActualReturnRaw(expectedReturn.toString());
      setDifferenceReason('');
      setNotes('');
    }
  }, [advance, expectedReturn]);

  if (!advance) return null;

  const actualReturn = parseTomanInput(actualReturnRaw);
  const difference = actualReturn - expectedReturn;

  const handleConfirm = () => {
    if (difference !== 0 && !differenceReason.trim()) {
      showToast('در صورت وجود اختلاف بین مبلغ محاسباتی و مبلغ واریزی، ثبت دلیل اختلاف الزامی است', 'error');
      return;
    }

    const res = settleCashAdvanceWithDetails(advance.id, actualReturn, differenceReason, notes);
    if (res.success) {
      onClose();
    } else if (res.error) {
      showToast(res.error, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">تسویه قطعی تنخواه</h3>
              <p className="text-[11px] text-zinc-400">ثبت اسنپ‌شات و بستن رسمی دوره تنخواه بدون تغییر در هزینه‌ها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[#1c1e24] border border-[#2c2f37] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#262932]">
              <span className="text-zinc-400">شخص تنخواه‌دار:</span>
              <span className="font-bold text-zinc-200 text-sm">{advance.personName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">مبلغ کل تنخواه اعطایی (ثابت و غیرقابل تغییر):</span>
              <span className="font-mono font-bold text-zinc-200">{formatToman(advance.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">مجموع هزینه‌های متصل ({toPersianDigits(linkedExpenses.length)} فقره):</span>
              <span className="font-mono font-bold text-rose-400">-{formatToman(totalSpent)}</span>
            </div>
            <div className="pt-2 border-t border-[#262932] flex items-center justify-between text-sm">
              <span className="font-semibold text-zinc-300">مبلغ محاسباتی عودت به صندوق:</span>
              <span className="font-mono font-extrabold text-amber-400">{formatToman(expectedReturn)}</span>
            </div>
          </div>

          {/* Actual Cash Return Field */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141519] border border-[#26282e]">
            <label className="block font-semibold text-zinc-200">
              مبلغ واقعی عودت داده شده به صندوق:
            </label>
            <div className="relative">
              <input
                type="text"
                value={actualReturnRaw}
                onChange={(e) => setActualReturnRaw(e.target.value)}
                className="w-full bg-[#1c1e24] border border-[#2f333e] focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none"
                placeholder="مثال: ۱,۵۰۰,۰۰۰"
              />
              <div className="absolute left-3 top-2.5 text-xs text-zinc-400 pointer-events-none">تومان</div>
            </div>
            {actualReturn > 0 && (
              <div className="text-[11px] text-zinc-400 font-medium pt-0.5">
                {formatToman(actualReturn)}
              </div>
            )}

            {/* Difference Indicator */}
            {difference !== 0 && (
              <div className="pt-2 border-t border-[#22242a] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-medium">اختلاف با مبلغ محاسباتی:</span>
                  <span className={`font-mono font-bold ${difference > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {difference > 0 ? `+${formatToman(difference)} (مازاد)` : `${formatToman(difference)} (کسری)`}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-amber-300 mb-1">
                    دلیل اختلاف (الزامی) <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: هزینه متفرقه نقدی خارج از رسید، تخفیف نقدی و..."
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    className="w-full bg-[#1c1e24] border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">یادداشت تسویه (اختیاری):</label>
            <input
              type="text"
              placeholder="توضیحات و شماره فیش واریز..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#141519] border border-[#282a32] rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Linked Expenses List */}
          <div>
            <div className="text-xs font-semibold text-zinc-300 mb-1.5">
              فهرست هزینه‌های منتسب به این دوره ({toPersianDigits(linkedExpenses.length)} ردیف):
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {linkedExpenses.length === 0 ? (
                <div className="text-zinc-500 text-center py-2 bg-[#141519] rounded-lg text-[11px]">
                  هیچ هزینه‌ای به این تنخواه متصل نشده است
                </div>
              ) : (
                linkedExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2 rounded-lg bg-[#141519] border border-[#26282e] flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{exp.description}</div>
                      <div className="text-[10px] text-zinc-500">{exp.category} • {toPersianDigits(exp.date)}</div>
                    </div>
                    <span className="font-mono font-semibold text-zinc-300">{formatToman(exp.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              با ثبت تسویه، اسنپ‌شات قطعی در تاریخ جاری ثبت و تنخواه بسته می‌شود. هزینه‌های تاریخی بدون دستکاری در سامانه باقی می‌مانند.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#26282e] bg-[#141519] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#202228] transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ثبت قطعی تسویه تنخواه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
