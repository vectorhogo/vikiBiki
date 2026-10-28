import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, Tag, Car, User, FileText } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { IncomeCategory } from '../types/accounting';
import { DEALERSHIP_CURRENT_DATE, formatToman, parseTomanInput, toPersianDigits } from '../utils/formatters';

interface NewIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INCOME_CATEGORIES: IncomeCategory[] = [
  'کمیسیون و حق‌العمل',
  'خدمات و کارشناسی',
  'بیعانه و قرارداد',
  'سود معامله خودرو',
  'واریز به صندوق',
  'سایر دریافتی‌ها',
];

export const NewIncomeModal: React.FC<NewIncomeModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, personnel, addIncome } = useAccounting();

  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('کمیسیون و حق‌العمل');
  const [vehicleId, setVehicleId] = useState('');
  const [personId, setPersonId] = useState('');
  const [date, setDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setRawAmount('');
      setCategory('کمیسیون و حق‌العمل');
      setVehicleId('');
      setPersonId('');
      setDate(DEALERSHIP_CURRENT_DATE);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseTomanInput(rawAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0 || !description.trim()) return;

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
    const selectedPerson = personnel.find((p) => p.id === personId);

    addIncome({
      amount: parsedAmount,
      description: description.trim(),
      category,
      vehicleId: selectedVehicle?.id,
      vehicleLabel: selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.plate || selectedVehicle.year})` : undefined,
      personId: selectedPerson?.id,
      personName: selectedPerson?.name,
      date,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      id="new-income-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div
        id="new-income-modal"
        className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#26282f] bg-[#141519]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">ثبت درآمد و دریافتی جدید</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">ثبت دریافتی روزمره، کمیسیون یا واریزی به صندوق</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-[#23252c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              عنوان / بابت دریافتی <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: کمیسیون فروش تویوتا کمری یا کارشناسی فنی خودرو"
                required
                className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Amount (Toman) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              مبلغ دریافتی (تومان) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                placeholder="مثال: ۲۵,۰۰۰,۰۰۰"
                required
                className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-hidden font-mono transition-colors"
              />
              <span className="absolute left-3 top-2.5 text-xs text-zinc-500">تومان</span>
            </div>
            {parsedAmount > 0 && (
              <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
                معادل: {formatToman(parsedAmount)}
              </p>
            )}
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>سرفصل / دسته‌بندی</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-2.5 py-2 text-xs text-zinc-200 outline-hidden transition-colors"
              >
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#18191e] text-zinc-200">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>تاریخ ثبت</span>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-hidden font-mono transition-colors"
              />
            </div>
          </div>

          {/* Vehicle and Person (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-zinc-400" />
                <span>خودروی مرتبط (اختیاری)</span>
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-2.5 py-2 text-xs text-zinc-200 outline-hidden transition-colors"
              >
                <option value="" className="bg-[#18191e] text-zinc-500">
                  بدون اتصال به خودرو
                </option>
                {vehicles
                  .filter((v) => v.status === 'active')
                  .map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#18191e] text-zinc-200">
                      {v.model} ({v.plate || v.year})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>شخص / کارشناس (اختیاری)</span>
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-2.5 py-2 text-xs text-zinc-200 outline-hidden transition-colors"
              >
                <option value="" className="bg-[#18191e] text-zinc-500">
                  صندوق کلی نمایشگاه
                </option>
                {personnel
                  .filter((p) => p.status === 'active')
                  .map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#18191e] text-zinc-200">
                      {p.name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>توضیحات و شماره پیگیری / ارجاع</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: شماره پیگیری پوز یا شماره چک واریزی..."
              className="w-full bg-[#131418] border border-[#2c2f37] focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-hidden resize-none transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#26282f] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#23252c] rounded-lg transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={parsedAmount <= 0 || !description.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ثبت قطعی دریافتی</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
