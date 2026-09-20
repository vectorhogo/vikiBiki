import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Trash2, Paperclip, AlertTriangle } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentSource, ReceiptAttachment } from '../types/accounting';
import { formatToman, parseTomanInput, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import { useAccounting } from '../context/AccountingContext';

interface EditExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: (ExpenseCategory | 'دسته‌بندی نشده')[] = [
  'سوخت',
  'کارشناسی',
  'حمل و یدک‌کش',
  'تعمیر و سرویس',
  'شستشو و دیتیلینگ',
  'پذیرایی و مصرفی',
  'کمیسیون',
  'عوارض و خلافی',
  'سایر',
  'دسته‌بندی نشده',
];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
}) => {
  const { personnel, vehicles, cashAdvances, updateExpense, showToast } = useAccounting();

  const [rawAmount, setRawAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory | 'دسته‌بندی نشده'>('دسته‌بندی نشده');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [personId, setPersonId] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('company_direct');
  const [cashAdvanceId, setCashAdvanceId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receipts, setReceipts] = useState<ReceiptAttachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expense) {
      setRawAmount(expense.amount.toString());
      setDescription(expense.description || '');
      setCategory(expense.category || 'دسته‌بندی نشده');
      setVehicleId(expense.vehicleId || '');
      setPersonId(expense.personId);
      setPaymentSource(expense.paymentSource || (expense.cashAdvanceId ? 'advance' : 'company_direct'));
      setCashAdvanceId(expense.cashAdvanceId || '');
      setDate(expense.date);
      setNotes(expense.notes || '');
      setReceipts(expense.receipts || []);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const parsedAmount = parseTomanInput(rawAmount);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const url = loadEvt.target?.result as string;
        const newReceipt: ReceiptAttachment = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          url,
          size: file.size,
          uploadedAt: date || DEALERSHIP_CURRENT_DATE,
        };
        setReceipts((prev) => [...prev, newReceipt]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      showToast('مبلغ باید بزرگتر از صفر باشد', 'error');
      return;
    }

    const selectedPerson = personnel.find((p) => p.id === personId);
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

    updateExpense(expense.id, {
      amount: parsedAmount,
      description: description.trim() || 'هزینه جاری',
      category,
      vehicleId: vehicleId || undefined,
      vehicleLabel: selectedVehicle?.fullName || undefined,
      personId,
      personName: selectedPerson?.name || expense.personName,
      paymentSource,
      cashAdvanceId: paymentSource === 'advance' ? cashAdvanceId || undefined : undefined,
      date,
      notes: notes.trim() || undefined,
      receipts,
    });

    onClose();
  };

  const personAdvances = cashAdvances.filter((a) => a.personId === personId && a.status !== 'settled');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">تکمیل و ویرایش اطلاعات هزینه</h3>
            <p className="text-[11px] text-zinc-400">تکمیل سرفصل، خودرو، رسید یا تغییر جزئیات بدون ایجاد رکورد تکراری</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Person & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">شخص پرداخت‌کننده</label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
              >
                {personnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">مبلغ (تومان)</label>
              <input
                type="text"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-100 font-mono text-sm focus:outline-none"
              />
              {parsedAmount > 0 && (
                <div className="text-[10px] text-amber-400 mt-0.5">{formatToman(parsedAmount)}</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">بابت (شرح هزینه)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">دسته‌بندی / سرفصل هزینه</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory | 'دسته‌بندی نشده')}
              className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">خودرو مرتبط</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="">-- بدون ارتباط به خودرو (هزینه عمومی / اداری) --</option>
              {vehicles
                .filter((v) => v.status === 'active')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({toPersianDigits(v.plate)})
                  </option>
                ))}
            </select>
          </div>

          {/* Payment Source */}
          <div className="p-3 bg-[#131417] border border-[#26282e] rounded-xl space-y-2">
            <label className="block font-semibold text-zinc-200">منبع پرداخت:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'advance', label: 'تنخواه' },
                { id: 'personal', label: 'شخصی' },
                { id: 'company_direct', label: 'مستقیم شرکت' },
                { id: 'other', label: 'سایر' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPaymentSource(s.id as PaymentSource)}
                  className={`p-1.5 text-center rounded border transition-colors cursor-pointer ${
                    paymentSource === s.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#18191f] border-[#292c36] text-zinc-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {paymentSource === 'advance' && (
              <div className="pt-2">
                <label className="block text-zinc-400 text-[11px] mb-1">تنخواه مرتبط:</label>
                <select
                  value={cashAdvanceId}
                  onChange={(e) => setCashAdvanceId(e.target.value)}
                  className="w-full bg-[#18191e] border border-[#2d3038] rounded px-2.5 py-1 text-zinc-200 text-xs focus:outline-none"
                >
                  <option value="">-- انتخاب تنخواه --</option>
                  {personAdvances.map((a) => (
                    <option key={a.id} value={a.id}>
                      تنخواه {formatToman(a.amount)} ({a.reason}) — {toPersianDigits(a.date)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Receipts Attachment */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">ضمیمه فاکتور / رسید</label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 border border-dashed border-[#2f323c] hover:border-amber-500 rounded-lg bg-[#141519] flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>بارگذاری فاکتور جدید</span>
              </button>

              {receipts.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {receipts.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-1.5 p-1.5 pr-2 bg-[#1e2027] border border-[#2b2e38] rounded-md text-zinc-300 text-[11px]"
                    >
                      <Paperclip className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[130px]">{rec.name}</span>
                      <button
                        type="button"
                        onClick={() => removeReceipt(rec.id)}
                        className="text-zinc-500 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">تاریخ</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">توضیحات تکمیلی</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none"
                placeholder="توضیحات و یادداشت..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-[#26282e]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#202228] transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
