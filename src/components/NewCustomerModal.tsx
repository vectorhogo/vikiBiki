import React, { useState, useEffect } from 'react';
import { Customer } from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import { X, User, Phone, MapPin, Tag, AlertTriangle, Check } from 'lucide-react';
import { DEALERSHIP_CURRENT_DATE, toPersianDigits } from '../utils/formatters';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer?: Customer | null;
  onCustomerSaved?: (savedCustomer: Customer) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  initialCustomer,
  onCustomerSaved,
}) => {
  const { customers, addCustomer, updateCustomer, showToast } = useAccounting();

  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('مشتری عادی');

  // Pre-fill when editing
  useEffect(() => {
    if (initialCustomer) {
      setFullName(initialCustomer.fullName);
      setNationalId(initialCustomer.nationalId || '');
      setPhone(initialCustomer.phone || '');
      setPhone2(initialCustomer.phone2 || '');
      setAddress(initialCustomer.address || '');
      setNotes(initialCustomer.notes || '');
      setTagsInput(initialCustomer.tags?.join(', ') || '');
    } else {
      setFullName('');
      setNationalId('');
      setPhone('');
      setPhone2('');
      setAddress('');
      setNotes('');
      setTagsInput('مشتری عادی');
    }
  }, [initialCustomer, isOpen]);

  if (!isOpen) return null;

  // Duplicate detection checks (prevent duplicate master entities)
  const duplicateByNationalId = nationalId.trim()
    ? customers.find(
        (c) =>
          c.nationalId &&
          c.nationalId.trim() === nationalId.trim() &&
          c.id !== initialCustomer?.id
      )
    : undefined;

  const duplicateByPhone = phone.trim()
    ? customers.find(
        (c) =>
          c.phone &&
          c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') &&
          c.id !== initialCustomer?.id
      )
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('لطفاً نام و نام خانوادگی مشتری را وارد کنید.', 'warning');
      return;
    }
    if (!phone.trim()) {
      showToast('لطفاً شماره تماس مشتری را وارد کنید.', 'warning');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (initialCustomer) {
      // Update
      const updated: Customer = {
        ...initialCustomer,
        fullName: fullName.trim(),
        nationalId: nationalId.trim(),
        phone: phone.trim(),
        phone2: phone2.trim() || undefined,
        address: address.trim(),
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        updatedAt: DEALERSHIP_CURRENT_DATE,
      };
      updateCustomer(updated);
      showToast('پرونده مشتری با موفقیت به‌روزرسانی شد.', 'success');
      onCustomerSaved?.(updated);
      onClose();
    } else {
      // Create new master customer
      const newFileNo = `C-1405-001${(customers.length + 1).toString().padStart(2, '0')}`;
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        fileNumber: newFileNo,
        fullName: fullName.trim(),
        nationalId: nationalId.trim(),
        phone: phone.trim(),
        phone2: phone2.trim() || undefined,
        address: address.trim(),
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : ['مشتری جدید'],
        status: 'active',
        createdAt: DEALERSHIP_CURRENT_DATE,
      };
      addCustomer(newCustomer);
      showToast(`پرونده جدید مشتری (${newCustomer.fullName}) با شماره ${newFileNo} ایجاد شد.`, 'success');
      onCustomerSaved?.(newCustomer);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#17181d] border border-[#2c2f38] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Header */}
        <div className="px-4 py-3 bg-[#131417] border-b border-[#252830] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-zinc-100">
              {initialCustomer ? 'ویرایش پرونده مشتری' : 'تشکیل پرونده مشتری جدید (Master Entity)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Duplicate Warning */}
          {(duplicateByNationalId || duplicateByPhone) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>توجه: مشتری مشابه در سیستم یافت شد!</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                مشتری با نام <strong>{duplicateByNationalId?.fullName || duplicateByPhone?.fullName}</strong> با همین کد ملی یا تلفن قبلاً پرونده دارد. برای جلوگیری از ثبت تکراری، پیشنهاد می‌شود پرونده قبلی را بازگشایی کنید.
              </p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              نام و نام خانوادگی خریدار / مشتری <span className="text-amber-400">*</span>:
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی رضایی، مهدی صادقی..."
              className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs"
            />
          </div>

          {/* National ID & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                کد ملی ده رقمی:
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="مثال: ۰۰۷۸۹۴۵۶۱۲"
                className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                شماره موبایل اصلی <span className="text-amber-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: ۰۹۱۲-۱۱۱-۲۲۳۳"
                className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Phone 2 & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                شماره تماس دوم / ثابت (اختیاری):
              </label>
              <input
                type="text"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="مثال: ۰۲۱-۲۲۴۴۶۶۸۸"
                className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                برچسب‌ها (با کاما جدا کنید):
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="مثال: مشتری VIP, خرید مکرر, نقدی"
                className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              نشانی محل سکونت / اقامتگاه:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="تهران، منطقه، خیابان، پلاک، واحد..."
              className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              توضیحات و یادداشت پرونده:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط خاص مشتری، سوابق قبلی، یا اطلاعات هویتی..."
              className="w-full bg-[#121317] border border-[#2b2e37] focus:border-amber-500 rounded-lg px-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#252830] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{initialCustomer ? 'ذخیره تغییرات' : 'ثبت پرونده مشتری'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
