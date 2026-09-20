import React, { useState, useEffect } from 'react';
import { X, Wallet, User, Calendar, FileText } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { DEALERSHIP_CURRENT_DATE, formatToman, parseTomanInput } from '../utils/formatters';

interface NewCashAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersonId?: string;
}

export const NewCashAdvanceModal: React.FC<NewCashAdvanceModalProps> = ({
  isOpen,
  onClose,
  initialPersonId,
}) => {
  const { personnel, addCashAdvance } = useAccounting();

  const [personId, setPersonId] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [date, setDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPersonId(initialPersonId || personnel[0]?.id || '');
      setRawAmount('');
      setDate(DEALERSHIP_CURRENT_DATE);
      setReason('');
      setNotes('');
    }
  }, [isOpen, initialPersonId, personnel]);

  if (!isOpen) return null;

  const parsedAmount = parseTomanInput(rawAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    const person = personnel.find((p) => p.id === personId);
    if (!person) return;

    addCashAdvance({
      personId,
      personName: person.name,
      amount: parsedAmount,
      date,
      reason: reason.trim() || 'تنخواه جاری امور نمایشگاه',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">پرداخت تنخواه جدید</h3>
              <p className="text-[11px] text-zinc-400">تخصیص وجه نقد یا واریز به کارت پرسنل جهت هزینه‌کرد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Person selector */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">
              تحویل‌گیرنده تنخواه <span className="text-amber-400">*</span>
            </label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none"
            >
              {personnel
                .filter((p) => p.status === 'active')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">
              مبلغ تنخواه <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 font-mono text-zinc-100 focus:outline-none"
              />
              <div className="absolute left-3 top-2 text-zinc-400">تومان</div>
            </div>
            {parsedAmount > 0 && (
              <div className="text-[11px] text-amber-400 font-medium mt-1">
                {formatToman(parsedAmount)}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">تاریخ تخصیص</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 font-mono text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">بابت / عنوان تنخواه</label>
            <input
              type="text"
              placeholder="مثال: هزینه‌های سوخت، پذیرایی، کارشناسی یا امور ترابری"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">توضیحات و نحوه پرداخت (اختیاری)</label>
            <input
              type="text"
              placeholder="مثال: نقدی از صندوق / واریز به کارت ملت"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#26282e] flex items-center justify-between">
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
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-bold rounded-lg transition-colors cursor-pointer"
            >
              ثبت و تخصیص تنخواه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
