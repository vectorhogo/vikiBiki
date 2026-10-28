import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  AlertTriangle,
  Paperclip,
  Check,
  DollarSign,
  User,
  Car,
  Calendar,
  Tag,
  Trash2,
  Wallet,
  Building2,
  CreditCard,
  Layers,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { ExpenseCategory, ReceiptAttachment, Expense, PaymentSource } from '../types/accounting';
import { DEALERSHIP_CURRENT_DATE, formatToman, parseTomanInput, toPersianDigits } from '../utils/formatters';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVehicleId?: string;
  initialPersonId?: string;
  initialCashAdvanceId?: string;
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

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  initialVehicleId,
  initialPersonId,
  initialCashAdvanceId,
}) => {
  const { personnel, vehicles, cashAdvances, expenses, addExpense, showToast, checkDuplicateReceipt, isPeriodReadOnly } = useAccounting();

  const [personId, setPersonId] = useState<string>('');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory | 'دسته‌بندی نشده' | ''>('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('company_direct');
  const [cashAdvanceId, setCashAdvanceId] = useState<string>('');
  const [date, setDate] = useState<string>(DEALERSHIP_CURRENT_DATE);
  const [notes, setNotes] = useState<string>('');
  const [receipts, setReceipts] = useState<ReceiptAttachment[]>([]);
  const [expenseResponsibility, setExpenseResponsibility] = useState<'dealership' | 'owner' | 'contract'>('dealership');

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<Expense | null>(null);

  // Duplicate receipt attachment warning state
  const [duplicateReceiptWarning, setDuplicateReceiptWarning] = useState<{
    newReceipt: ReceiptAttachment;
    matchedExpenseDesc?: string;
  } | null>(null);

  // Advance excess warning state
  const [excessAdvanceWarning, setExcessAdvanceWarning] = useState<{
    advanceAmount: number;
    remaining: number;
    expenseAmount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      const defaultPerson = initialPersonId || personnel[0]?.id || '';
      setPersonId(defaultPerson);
      setRawAmount('');
      setDescription('');
      setCategory('');
      setVehicleId(initialVehicleId || '');
      setDate(DEALERSHIP_CURRENT_DATE);
      setNotes('');
      setReceipts([]);
      setDuplicateWarning(null);
      setExcessAdvanceWarning(null);

      // Auto-detect payment source:
      if (initialCashAdvanceId) {
        setPaymentSource('advance');
        setCashAdvanceId(initialCashAdvanceId);
      } else {
        // check if person has an open advance
        const openAdv = cashAdvances.find((a) => a.personId === defaultPerson && a.status === 'open');
        if (openAdv) {
          setPaymentSource('advance');
          setCashAdvanceId(openAdv.id);
        } else {
          setPaymentSource('company_direct');
          setCashAdvanceId('');
        }
      }
    }
  }, [isOpen, initialPersonId, initialVehicleId, initialCashAdvanceId, personnel, cashAdvances]);

  // When person changes, if in advance mode, pick their open advance
  const handlePersonChange = (newPersonId: string) => {
    setPersonId(newPersonId);
    if (paymentSource === 'advance') {
      const openAdv = cashAdvances.find((a) => a.personId === newPersonId && a.status === 'open');
      setCashAdvanceId(openAdv ? openAdv.id : '');
    }
  };

  // When payment source changes
  const handlePaymentSourceChange = (src: PaymentSource) => {
    setPaymentSource(src);
    setExcessAdvanceWarning(null);
    if (src === 'advance') {
      const openAdv = cashAdvances.find((a) => a.personId === personId && a.status === 'open');
      setCashAdvanceId(openAdv ? openAdv.id : '');
    } else {
      setCashAdvanceId('');
    }
  };

  if (!isOpen) return null;

  const parsedAmount = parseTomanInput(rawAmount);

  // Available advances for the chosen person
  const personAdvances = cashAdvances.filter(
    (a) => a.personId === personId && a.status !== 'settled'
  );

  // Compute selected advance remaining balance
  const selectedAdvance = cashAdvances.find((a) => a.id === cashAdvanceId);
  const selectedAdvanceRemaining = selectedAdvance
    ? selectedAdvance.amount -
      expenses
        .filter((e) => e.status === 'active' && e.paymentSource === 'advance' && e.cashAdvanceId === selectedAdvance.id)
        .reduce((sum, e) => sum + e.amount, 0)
    : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (loadEvt) => {
        const url = loadEvt.target?.result as string;
        const newReceipt: ReceiptAttachment = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          url,
          size: file.size,
          uploadedAt: date,
        };

        const dupCheck = await checkDuplicateReceipt(url);
        if (dupCheck.isDuplicate) {
          setDuplicateReceiptWarning({
            newReceipt,
            matchedExpenseDesc: dupCheck.matchedExpense?.description,
          });
        } else {
          setReceipts((prev) => [...prev, newReceipt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (ignoreDuplicate: boolean = false, forceOutsideAdvance: boolean = false) => {
    if (!personId) {
      showToast('لطفاً شخص را انتخاب کنید', 'error');
      return;
    }
    if (parsedAmount <= 0) {
      showToast('لطفاً مبلغ معتبر به تومان وارد کنید', 'error');
      return;
    }

    const finalPaymentSource = forceOutsideAdvance ? 'company_direct' : paymentSource;
    const finalCashAdvanceId = forceOutsideAdvance ? undefined : (finalPaymentSource === 'advance' ? cashAdvanceId : undefined);

    // Check advance balance safety if payment source is advance
    if (finalPaymentSource === 'advance' && finalCashAdvanceId && !forceOutsideAdvance) {
      if (parsedAmount > selectedAdvanceRemaining) {
        setExcessAdvanceWarning({
          advanceAmount: selectedAdvance?.amount || 0,
          remaining: selectedAdvanceRemaining,
          expenseAmount: parsedAmount,
        });
        return;
      }
    }

    const selectedPerson = personnel.find((p) => p.id === personId);
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

    const res = addExpense(
      {
        personId,
        personName: selectedPerson?.name || '',
        amount: parsedAmount,
        description: description.trim() || 'خرید / هزینه جاری',
        category: category || 'دسته‌بندی نشده',
        vehicleId: vehicleId || undefined,
        vehicleLabel: selectedVehicle?.fullName || undefined,
        paymentSource: finalPaymentSource,
        cashAdvanceId: finalCashAdvanceId,
        date: date || DEALERSHIP_CURRENT_DATE,
        receipts,
        notes: notes.trim() || undefined,
        expenseResponsibility: vehicleId ? expenseResponsibility : undefined,
      },
      ignoreDuplicate
    );

    if (res.duplicateWarning) {
      setDuplicateWarning(res.duplicateWarning);
      return;
    }

    if (res.error) {
      showToast(res.error, 'error');
      return;
    }

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div
        id="modal-quick-expense"
        className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#15161a]">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">+ ثبت هزینه</h2>
            <p className="text-[11px] text-zinc-400">ثبت سریع هزینه بدون نیاز به تنخواه با امکان تکمیل بعدی فیلدها</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Duplicate Warning Prompt */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>احتمال ثبت هزینه تکراری</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                هزینه‌ای با همین مبلغ ({formatToman(duplicateWarning.amount)})، توسط{' '}
                {duplicateWarning.personName} در تاریخ {toPersianDigits(duplicateWarning.date)} با شرح «
                {duplicateWarning.description}» قبلاً ثبت شده است.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-2.5 py-1 text-xs bg-[#242730] hover:bg-[#2e323e] text-zinc-200 rounded-md transition-colors"
                >
                  ویرایش اطلاعات
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-md transition-colors"
                >
                  ثبت به هر حال
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Receipt Warning Prompt */}
          {duplicateReceiptWarning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>این فایل قبلاً ثبت شده است.</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                تصویر رسید انتخابی ({duplicateReceiptWarning.newReceipt.name}) دقیقاً مشابه یک رسید ثبت‌شده قبلی
                {duplicateReceiptWarning.matchedExpenseDesc ? ` در هزینه «${duplicateReceiptWarning.matchedExpenseDesc}»` : ''} است.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDuplicateReceiptWarning(null)}
                  className="px-2.5 py-1 text-xs bg-[#242730] hover:bg-[#2e323e] text-zinc-200 rounded-md transition-colors"
                >
                  لغو
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReceipts((prev) => [...prev, duplicateReceiptWarning.newReceipt]);
                    setDuplicateReceiptWarning(null);
                  }}
                  className="px-2.5 py-1 text-xs bg-[#292c36] hover:bg-[#343846] text-amber-300 border border-amber-500/30 rounded-md transition-colors"
                >
                  استفاده از فایل قبلی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReceipts((prev) => [...prev, duplicateReceiptWarning.newReceipt]);
                    setDuplicateReceiptWarning(null);
                  }}
                  className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-md transition-colors"
                >
                  ثبت به هر حال
                </button>
              </div>
            </div>
          )}

          {/* Excess Advance Warning Prompt */}
          {excessAdvanceWarning && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>مبلغ این هزینه از مانده تنخواه بیشتر است</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                مانده باقیمانده تنخواه انتخابی {formatToman(excessAdvanceWarning.remaining)} است، اما مبلغ هزینه{' '}
                {formatToman(excessAdvanceWarning.expenseAmount)} وارد شده است. برای جلوگیری از منفی شدن تنخواه، هزینه باید خارج از تنخواه ثبت شود.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setExcessAdvanceWarning(null)}
                  className="px-2.5 py-1 text-xs bg-[#242730] hover:bg-[#2e323e] text-zinc-200 rounded-md transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false, true)}
                  className="px-2.5 py-1 text-xs bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold rounded-md transition-colors"
                >
                  ثبت به عنوان هزینه خارج از تنخواه (شرکت)
                </button>
              </div>
            </div>
          )}

          {/* شخص (Person - Required) */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              شخص <span className="text-amber-400">*</span>
            </label>
            <select
              value={personId}
              onChange={(e) => handlePersonChange(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
            >
              {personnel
                .filter((p) => p.status === 'active')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role}
                  </option>
                ))}
            </select>
          </div>

          {/* مبلغ (Amount - Required) */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              مبلغ <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="مثال: ۳,۰۰۰,۰۰۰"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none transition-colors"
              />
              <div className="absolute left-3 top-2.5 text-xs text-zinc-400 pointer-events-none">تومان</div>
            </div>
            {parsedAmount > 0 && (
              <div className="text-[11px] text-amber-400 font-semibold mt-1">
                {formatToman(parsedAmount)}
              </div>
            )}
          </div>

          {/* بابت (Description - Optional / short) */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              بابت <span className="text-zinc-500 font-normal">(اختیاری)</span>
            </label>
            <input
              type="text"
              placeholder="مثال: خرید قطعه، بنزین، پذیرایی، یا لوازم مصرفی..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none transition-colors"
            />
          </div>

          {/* خودرو (Vehicle - Optional) */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              خودرو <span className="text-zinc-500 font-normal">(اختیاری)</span>
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none"
            >
              <option value="">-- بدون ارتباط به خودرو (هزینه عمومی / اداری) --</option>
              {vehicles
                .filter((v) => v.status === 'active')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({toPersianDigits(v.plate)}) {v.ownershipType === 'consignment' ? '[امانی]' : '[نمایشگاه]'}
                  </option>
                ))}
            </select>

            {vehicleId && (
              <div className="mt-2 p-2.5 bg-[#131417] border border-[#2b2d38] rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-300">مسئولیت پرداخت این هزینه خودرو:</span>
                  <span className="text-[10px] text-zinc-400">
                    {vehicles.find(v => v.id === vehicleId)?.ownershipType === 'consignment'
                      ? 'خودروی امانی (مالک دیگر)'
                      : 'خودروی نمایشگاه'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setExpenseResponsibility('dealership')}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      expenseResponsibility === 'dealership'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-[#1b1c24] text-zinc-400 hover:text-white border border-[#292c3a]'
                    }`}
                  >
                    بر عهده نمایشگاه
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseResponsibility('owner')}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      expenseResponsibility === 'owner'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                        : 'bg-[#1b1c24] text-zinc-400 hover:text-white border border-[#292c3a]'
                    }`}
                  >
                    بر عهده مالک (کسر از تسویه)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseResponsibility('contract')}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      expenseResponsibility === 'contract'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                        : 'bg-[#1b1c24] text-zinc-400 hover:text-white border border-[#292c3a]'
                    }`}
                  >
                    طبق قرارداد
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* دسته‌بندی (Category - Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-zinc-300">
                دسته‌بندی <span className="text-zinc-500 font-normal">(اختیاری)</span>
              </label>
              {category && (
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  پاک کردن انتخاب
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                      : 'bg-[#1e2026] text-zinc-400 hover:text-zinc-200 hover:bg-[#252831] border border-[#2a2d36]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* منبع پرداخت (Payment Source) */}
          <div className="p-3 bg-[#131417] border border-[#26282e] rounded-xl space-y-2.5">
            <label className="block font-semibold text-zinc-200">منبع پرداخت:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePaymentSourceChange('advance')}
                className={`p-2 rounded-lg border text-right transition-colors cursor-pointer ${
                  paymentSource === 'advance'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#1a1c22] border-[#292c36] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>تنخواه</span>
                </div>
                <span className="text-[10px] font-normal text-zinc-500 block mt-0.5">کسر از تنخواه باز</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentSourceChange('personal')}
                className={`p-2 rounded-lg border text-right transition-colors cursor-pointer ${
                  paymentSource === 'personal'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                    : 'bg-[#1a1c22] border-[#292c36] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>پرداخت شخصی</span>
                </div>
                <span className="text-[10px] font-normal text-zinc-500 block mt-0.5">نیازمند بازپرداخت</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentSourceChange('company_direct')}
                className={`p-2 rounded-lg border text-right transition-colors cursor-pointer ${
                  paymentSource === 'company_direct'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#1a1c22] border-[#292c36] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>مستقیم شرکت</span>
                </div>
                <span className="text-[10px] font-normal text-zinc-500 block mt-0.5">صندوق / حساب نمایشگاه</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentSourceChange('other')}
                className={`p-2 rounded-lg border text-right transition-colors cursor-pointer ${
                  paymentSource === 'other'
                    ? 'bg-zinc-700/30 border-zinc-500 text-zinc-200 font-bold'
                    : 'bg-[#1a1c22] border-[#292c36] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>سایر</span>
                </div>
                <span className="text-[10px] font-normal text-zinc-500 block mt-0.5">کارت به کارت / سایر</span>
              </button>
            </div>

            {/* Smart reaction: If advance, show cash advance selector */}
            {paymentSource === 'advance' && (
              <div className="pt-2 border-t border-[#22242a] space-y-1.5">
                <label className="block text-zinc-300 font-medium">انتخاب تنخواه:</label>
                {personAdvances.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] leading-relaxed">
                    این شخص در حال حاضر تنخواه بازی ندارد. می‌توانید هزینه را با منبع «پرداخت شخصی» یا «مستقیم شرکت» ثبت کنید.
                  </div>
                ) : (
                  <select
                    value={cashAdvanceId}
                    onChange={(e) => setCashAdvanceId(e.target.value)}
                    className="w-full bg-[#18191e] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
                  >
                    <option value="">-- انتخاب تنخواه --</option>
                    {personAdvances.map((a) => (
                      <option key={a.id} value={a.id}>
                        تنخواه {formatToman(a.amount)} ({a.reason}) — تاریخ {toPersianDigits(a.date)}
                      </option>
                    ))}
                  </select>
                )}
                {selectedAdvance && (
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-0.5">
                    <span>مانده تنخواه انتخابی:</span>
                    <span className="font-mono font-bold text-amber-400">{formatToman(selectedAdvanceRemaining)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Smart reaction: If personal payment, show reimbursement status */}
            {paymentSource === 'personal' && (
              <div className="pt-2 border-t border-[#22242a] flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">وضعیت بازپرداخت به پرسنل:</span>
                <span className="px-2.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold">
                  نیازمند بازپرداخت
                </span>
              </div>
            )}
          </div>

          {/* رسید (Receipt - Optional) */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              رسید یا فاکتور <span className="text-zinc-500 font-normal">(اختیاری)</span>
            </label>
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
                className="w-full py-2.5 px-3 border border-dashed border-[#2f323c] hover:border-amber-500 rounded-lg bg-[#141519] hover:bg-[#1a1b21] transition-colors flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>انتخاب یا کشیدن تصویر فاکتور / رسید</span>
              </button>

              {/* Receipt thumbnails list */}
              {receipts.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {receipts.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-2 p-1.5 pr-2.5 bg-[#1e2027] border border-[#2b2e38] rounded-lg text-zinc-300 text-[11px]"
                    >
                      <Paperclip className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[140px]">{rec.name}</span>
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

          {/* Grid: تاریخ + توضیحات تکمیلی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">تاریخ هزینه</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                توضیحات تکمیلی <span className="text-zinc-500 font-normal">(اختیاری)</span>
              </label>
              <input
                type="text"
                placeholder="یادداشت و جزئیات..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#26282e] bg-[#141519] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#202228] transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!personId || parsedAmount <= 0}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
          >
            ثبت هزینه
          </button>
        </div>
      </div>
    </div>
  );
};
