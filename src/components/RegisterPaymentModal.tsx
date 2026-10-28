import React, { useState, useEffect, useMemo } from 'react';
import { SmartContract, PaymentAllocationProposal } from '../types/contract';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import { proposePaymentAllocation } from '../utils/contractEngine';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: SmartContract | null;
  onSuccess?: () => void;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const { registerInstallmentPayment, liveFinancialAccounts, showToast } = useAccounting();

  // Find oldest unpaid/partial installment to set smart default amount
  const firstUnpaid = useMemo(() => {
    if (!contract) return null;
    return contract.installments.find((i) => i.status === 'overdue' || i.status === 'partial') ||
      contract.installments.find((i) => i.status === 'upcoming');
  }, [contract]);

  const defaultSuggestedAmount = firstUnpaid ? (firstUnpaid.amount - firstUnpaid.paidAmount) : (contract?.financials.remainingBalance || 0);

  const [amount, setAmount] = useState<number>(defaultSuggestedAmount);
  const [amountInputStr, setAmountInputStr] = useState<string>(defaultSuggestedAmount.toString());
  const [paymentDate, setPaymentDate] = useState<string>(DEALERSHIP_CURRENT_DATE);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'pos'>('pos');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customAllocations, setCustomAllocations] = useState<{ [instId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Phase 09B: Direct vs. Indirect Transactions
  const [isIndirect, setIsIndirect] = useState<boolean>(false);
  const [indirectReceiverName, setIndirectReceiverName] = useState<string>('');
  const [financialAccountId, setFinancialAccountId] = useState<string>('');

  useEffect(() => {
    if (contract) {
      const initAmount = firstUnpaid ? (firstUnpaid.amount - firstUnpaid.paidAmount) : (contract.financials.remainingBalance || 0);
      setAmount(initAmount);
      setAmountInputStr(initAmount > 0 ? initAmount.toString() : '');
      setCustomAllocations({});
      setIsCustomMode(false);
      setIsIndirect(false);
      setIndirectReceiverName(contract.parties.seller.name || '');
      if (liveFinancialAccounts.length > 0) {
        setFinancialAccountId(liveFinancialAccounts[0].id);
      }
    }
  }, [contract, firstUnpaid, liveFinancialAccounts]);

  // Compute smart proposal whenever amount changes
  const proposal: PaymentAllocationProposal = useMemo(() => {
    if (!contract || amount <= 0) {
      return { allocations: [], unallocatedAmount: amount > 0 ? amount : 0, message: '' };
    }
    return proposePaymentAllocation(contract, amount);
  }, [contract, amount]);

  if (!isOpen || !contract) return null;

  const handleAmountChange = (valStr: string) => {
    const raw = valStr.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setAmountInputStr(raw);
    setAmount(num);
  };

  const setFullRemaining = () => {
    const rem = contract.financials.remainingBalance;
    setAmount(rem);
    setAmountInputStr(rem.toString());
  };

  const setNextInstallmentAmount = () => {
    if (firstUnpaid) {
      const needed = firstUnpaid.amount - firstUnpaid.paidAmount;
      setAmount(needed);
      setAmountInputStr(needed.toString());
    }
  };

  const handleCustomAllocChange = (instId: string, val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setCustomAllocations((prev) => ({
      ...prev,
      [instId]: num,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('لطفاً مبلغ پرداختی معتبر وارد نمایید.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let customList: { installmentId: string; amount: number }[] | undefined = undefined;

      if (isCustomMode) {
        customList = Object.entries(customAllocations)
          .map(([installmentId, allocAmount]) => ({ installmentId, amount: allocAmount }))
          .filter((a) => a.amount > 0);

        const customSum = customList.reduce((s, a) => s + a.amount, 0);
        if (customSum > amount) {
          showToast('مجموع مبالغ تخصیص‌یافته به اقساط نمی‌تواند از کل مبلغ پرداختی بیشتر باشد.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      const res = registerInstallmentPayment({
        contractId: contract.id,
        amount,
        paymentDate,
        paymentMethod,
        trackingNumber: trackingNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        customAllocations: customList,
        isIndirect,
        indirectReceiverName: isIndirect ? indirectReceiverName.trim() : undefined,
        supportingDoc: trackingNumber.trim() || undefined,
        financialAccountId: !isIndirect ? financialAccountId : undefined,
      });

      if (!res.success) {
        showToast(res.error || 'خطا در ثبت پرداخت قسط', 'error');
        setIsSubmitting(false);
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'خطا در اجرای فرآیند تخصیص پرداخت', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-zinc-900/95 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                ثبت و تخصیص هوشمند وجه قسط
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                  {contract.contractNumber}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                خودرو: {contract.vehicleLabel} | خریدار: {contract.parties.buyer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-400 block mb-0.5">مبلغ کل قرارداد:</span>
              <span className="font-semibold text-zinc-200 font-en-num">
                {formatToman(contract.financials.totalAgreedPrice)}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">مجموع وصول‌شده:</span>
              <span className="font-semibold text-emerald-400 font-en-num">
                {formatToman(contract.financials.paidSoFar)}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">مانده کل اقساط:</span>
              <span className="font-semibold text-amber-400 font-en-num">
                {formatToman(contract.financials.remainingBalance)}
              </span>
            </div>
          </div>

          {/* Amount and Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                مبلغ دریافتی (تومان) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                {firstUnpaid && (
                  <button
                    type="button"
                    onClick={setNextInstallmentAmount}
                    className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    قسط سررسید ({formatToman(firstUnpaid.amount - firstUnpaid.paidAmount)})
                  </button>
                )}
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={setFullRemaining}
                  className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  تسویه کل ({formatToman(contract.financials.remainingBalance)})
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={amountInputStr ? Number(amountInputStr).toLocaleString('en-US') : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="مثلاً: ۵۰,۰۰۰,۰۰۰"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-lg font-bold text-emerald-400 text-left font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                تومان
              </span>
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                نحوه وصول وجه <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'pos', label: 'کارت‌خوان (POS)' },
                  { id: 'bank_transfer', label: 'انتقال شبا / حواله' },
                  { id: 'cash', label: 'وجه نقد' },
                  { id: 'cheque', label: 'وصول چک' },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                      paymentMethod === m.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  تاریخ وصول / تراکنش <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  placeholder="۱۴۰۵/۰۱/۱۵"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  شماره پیگیری / فیش / شناسه صیاد
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثلاً: TRK-982341"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Direct vs. Indirect Payment Channel */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                نوع و کانال تراکنش مالی:
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setIsIndirect(false)}
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    !isIndirect
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  پرداخت مستقیم به شرکت (صندوق/بانک)
                </button>
                <button
                  type="button"
                  onClick={() => setIsIndirect(true)}
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    isIndirect
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  تسویه غیرمستقیم (مستقیم بین طرفین)
                </button>
              </div>
            </div>

            {!isIndirect ? (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  واریز به کدام حساب / صندوق نمایشگاه:
                </label>
                <select
                  value={financialAccountId}
                  onChange={(e) => setFinancialAccountId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {liveFinancialAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatToman(a.currentBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  <span className="font-bold">تسویه بدون گردش صندوق (Zero Cash Flow):</span> این وجه مستقیماً بین خریدار و فروشنده/مالک خودرو تبادل شده و تعهدات قرارداد را تسویه می‌کند، اما هیچ تغییری در موجودی نقد یا بانک نمایشگاه ایجاد نخواهد کرد.
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    نام دریافت‌کننده وجه (فروشنده / مالک خودرو):
                  </label>
                  <input
                    type="text"
                    value={indirectReceiverName}
                    onChange={(e) => setIndirectReceiverName(e.target.value)}
                    placeholder="نام دریافت‌کننده وجه..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              یادداشت یا توضیحات پیوست
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیحات واریزکننده یا حساب مقصد..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Allocation Preview / Override Section */}
          <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  پیش‌نمایش تخصیص هوشمند به اقساط (قدیمی‌ترین سررسید ابتدا)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isCustomMode ? 'بازگشت به تخصیص خودکار' : 'تنظیم مبالغ به‌صورت دستی'}</span>
              </button>
            </div>

            {/* List of installments with visual allocation */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {contract.installments.map((inst) => {
                const smartAlloc = proposal.allocations.find((a) => a.installmentId === inst.id);
                const plannedAlloc = isCustomMode
                  ? customAllocations[inst.id] || 0
                  : smartAlloc?.allocatedAmount || 0;

                const willBeFullyPaid = inst.paidAmount + plannedAlloc >= inst.amount;
                const willBePartiallyPaid = !willBeFullyPaid && (inst.paidAmount + plannedAlloc > 0);

                return (
                  <div
                    key={inst.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                      plannedAlloc > 0
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-zinc-900/50 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 font-en-num">
                        {toPersianDigits(inst.installmentNumber)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200 font-medium">
                            سررسید: <span className="font-mono text-zinc-300">{toPersianDigits(inst.dueDate)}</span>
                          </span>
                          {inst.status === 'overdue' && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                              معوق
                            </span>
                          )}
                          {inst.status === 'paid' && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                              قبلاً تسویه شده
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>مبلغ قسط: <span className="font-en-num">{formatToman(inst.amount)}</span></span>
                          <span>|</span>
                          <span>پرداختی قبلی: <span className="font-en-num">{formatToman(inst.paidAmount)}</span></span>
                          {inst.chequeNumber && (
                            <>
                              <span>|</span>
                              <span className="font-mono text-zinc-400">چک: {inst.chequeNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCustomMode ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 text-[11px]">تخصیص:</span>
                          <input
                            type="text"
                            value={plannedAlloc > 0 ? plannedAlloc.toString() : ''}
                            onChange={(e) => handleCustomAllocChange(inst.id, e.target.value)}
                            placeholder="۰"
                            className="w-28 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-left font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="text-left">
                          {plannedAlloc > 0 ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-en-num">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>+{formatToman(plannedAlloc)}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">بدون تخصیص</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unallocated Credit Notice */}
            {proposal.unallocatedAmount > 0 && !isCustomMode && (
              <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300 flex items-center justify-between">
                <span>مازاد پرداختی که به عنوان بستانکاری در پرونده قرارداد ثبت می‌شود:</span>
                <span className="font-bold font-mono text-sky-200">
                  {formatToman(proposal.unallocatedAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Strict Accounting Rule Notice */}
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            isIndirect
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}>
            <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isIndirect ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div className="space-y-1">
              <p className={`font-semibold ${isIndirect ? 'text-amber-300' : 'text-emerald-300'}`}>
                {isIndirect ? 'تسویه بدون گردش صندوق (Zero-Cash-Flow):' : 'اثر مالی مستقیم در دفتر کل و صندوق نمایشگاه:'}
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isIndirect
                  ? 'این پرداخت مستقیماً بین خریدار و فروشنده صورت گرفته و تعهدات قرارداد را کاهش می‌دهد، اما هیچ ردیف درآمدی یا تغییری در نقدینگی صندوق نمایشگاه ثبت نخواهد شد.'
                  : 'بر اساس ضوابط مالی نمایشگاه، ثبت این فرم مستقیماً یک ردیف تراکنش واقعی دریافت وجه (Income) در سرفصل «بیعانه و قرارداد» ثبت نموده و مانده طلب قرارداد و وضعیت اقساط را به‌روزرسانی می‌کند.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>در حال پردازش...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید و ثبت وصول وجه ({formatToman(amount)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
