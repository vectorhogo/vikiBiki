import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, DollarSign, User, Calendar, CreditCard } from 'lucide-react';
import { Expense } from '../types/accounting';
import { formatToman, parseTomanInput, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import { useAccounting } from '../context/AccountingContext';

interface RecordReimbursementModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordReimbursementModal: React.FC<RecordReimbursementModalProps> = ({
  expense,
  isOpen,
  onClose,
}) => {
  const { recordReimbursement, showToast } = useAccounting();

  const [rawAmount, setRawAmount] = useState<string>('');
  const [date, setDate] = useState<string>(DEALERSHIP_CURRENT_DATE);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (expense) {
      setRawAmount(expense.amount.toString());
      setDate(DEALERSHIP_CURRENT_DATE);
      setNote('');
      setError('');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const parsedAmount = parseTomanInput(rawAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parsedAmount <= 0) {
      setError('مبلغ بازپرداخت باید بزرگتر از صفر باشد');
      return;
    }

    if (parsedAmount > expense.amount) {
      setError('مبلغ بازپرداخت نمی‌تواند بیشتر از مبلغ هزینه باشد.');
      return;
    }

    const res = recordReimbursement(expense.id, parsedAmount, date, note.trim() || undefined);
    if (!res.success) {
      setError(res.error || 'خطا در ثبت بازپرداخت');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">ثبت بازپرداخت به پرسنل</h3>
              <p className="text-[11px] text-zinc-400">تسویه هزینه شخصی پرداخت‌شده توسط پرسنل</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Expense Detail Summary */}
          <div className="p-3.5 rounded-xl bg-[#141519] border border-[#26282e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">شخص پرداخت‌کننده:</span>
              <span className="font-bold text-zinc-200">{expense.personName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">شرح هزینه:</span>
              <span className="text-zinc-300 font-medium">{expense.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">مبلغ کل فاکتور/هزینه:</span>
              <span className="font-mono font-bold text-amber-400">{formatToman(expense.amount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#22242a] text-[11px]">
              <span className="text-zinc-400">تاریخ ثبت اولیه:</span>
              <span className="text-zinc-400 font-mono">{toPersianDigits(expense.date)}</span>
            </div>
          </div>

          {/* Amount to reimburse */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              مبلغ بازپرداخت <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={rawAmount}
                onChange={(e) => {
                  setRawAmount(e.target.value);
                  setError('');
                }}
                placeholder="مثال: ۱,۸۰۰,۰۰۰"
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none"
              />
              <div className="absolute left-3 top-2.5 text-xs text-zinc-400 pointer-events-none">تومان</div>
            </div>
            {parsedAmount > 0 && (
              <div className="text-[11px] text-sky-400 font-semibold mt-1">
                {formatToman(parsedAmount)}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">تاریخ بازپرداخت</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-sky-500 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              توضیحات / شماره پیگیری واریز <span className="text-zinc-500 font-normal">(اختیاری)</span>
            </label>
            <input
              type="text"
              placeholder="مثال: واریز از حساب سپه، شماره پیگیری ۷۲۸۱..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-sky-500 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-[#26282e]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#202228] transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={parsedAmount <= 0}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأیید و ثبت واریز</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
