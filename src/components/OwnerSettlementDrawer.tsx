import React, { useState } from 'react';
import { OwnerSettlement, OwnerSettlementPayment } from '../types/consignment';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  X,
  Wallet,
  DollarSign,
  User,
  Car,
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  Building,
  RotateCcw,
} from 'lucide-react';

interface OwnerSettlementDrawerProps {
  settlement: OwnerSettlement;
  onClose: () => void;
  onUpdateSettlement: (updated: OwnerSettlement) => void;
}

export const OwnerSettlementDrawer: React.FC<OwnerSettlementDrawerProps> = ({
  settlement,
  onClose,
  onUpdateSettlement,
}) => {
  const { showToast } = useAccounting();

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'check' | 'cash'>('transfer');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(paymentAmount.replace(/[^\d]/g, ''), 10);
    if (!amountNum || amountNum <= 0) {
      showToast('لطفاً مبلغ واریزی معتبری وارد نمایید.', 'error');
      return;
    }

    if (amountNum > settlement.remainingAmount) {
      if (
        !window.confirm(
          'مبلغ پرداختی بیشتر از مانده طلب مالک است. آیا از ثبت این واریز اطمینان دارید؟'
        )
      ) {
        return;
      }
    }

    const newPayment: OwnerSettlementPayment = {
      id: `osp-${Date.now()}`,
      amount: amountNum,
      date: paymentDate,
      method: paymentMethod,
      trackingNumber: trackingNumber.trim() || undefined,
      checkNumber: checkNumber.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      createdAt: DEALERSHIP_CURRENT_DATE,
    };

    const newPaidAmount = settlement.paidAmount + amountNum;
    const newRemaining = Math.max(0, settlement.netPayableToOwner - newPaidAmount);
    const newStatus =
      newRemaining === 0 ? 'fully_settled' : newPaidAmount > 0 ? 'partially_settled' : 'unsettled';

    const updated: OwnerSettlement = {
      ...settlement,
      paidAmount: newPaidAmount,
      remainingAmount: newRemaining,
      status: newStatus,
      payments: [...settlement.payments, newPayment],
      updatedAt: DEALERSHIP_CURRENT_DATE,
    };

    onUpdateSettlement(updated);
    showToast('پرداخت به مالک با موفقیت ثبت شد.', 'success');
    setIsAddingPayment(false);
    setPaymentAmount('');
    setTrackingNumber('');
    setPaymentNotes('');
  };

  const getStatusBadge = () => {
    switch (settlement.status) {
      case 'fully_settled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تسویه کامل شده</span>
          </span>
        );
      case 'partially_settled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>تسویه ناقص (در حال پرداخت)</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>تسویه نشده</span>
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-[#14151b] border-r border-[#292c3c] w-full max-w-xl h-full shadow-2xl flex flex-col justify-between text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#111216] border-b border-[#252834] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-100">
                  تسویه حساب مالک خودروی امانی
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {settlement.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                محاسبه شفاف سهم مالک، کمیسیون نمایشگاه و کسر هزینه‌های مرتبط
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#20222a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Status & Parties Card */}
          <div className="p-4 bg-[#171822] border border-[#272938] rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-zinc-100">{settlement.ownerName}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span>{settlement.vehicleFullName}</span>
              </div>
            </div>

            <div>{getStatusBadge()}</div>
          </div>

          {/* Financial Calculation Breakdown Table */}
          <div className="bg-[#121317] border border-[#252834] rounded-2xl overflow-hidden divide-y divide-[#20222a]">
            <div className="p-3 bg-[#161720] text-zinc-300 font-bold flex items-center justify-between text-xs">
              <span>شرح محاسبات تسویه خودروی امانی</span>
              <span>مبلغ (تومان)</span>
            </div>

            {/* 1. Gross Sale Price */}
            <div className="p-3 flex items-center justify-between text-zinc-200">
              <div>
                <span className="font-semibold block">مبلغ کل فروش خودرو (Gross Sale):</span>
                <span className="text-[10px] text-zinc-500">
                  ثبت‌شده در قرارداد فروش خودرو
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-zinc-100">
                {formatToman(settlement.grossSaleAmount)}
              </span>
            </div>

            {/* 2. Dealership Commission */}
            <div className="p-3 flex items-center justify-between text-amber-400/90 bg-amber-500/5">
              <div>
                <span className="font-semibold block">کسر: حق کمیسیون نمایشگاه اتو عبداللهی:</span>
                <span className="text-[10px] text-zinc-500">
                  طبق مفاد قرارداد امانی (درصدی یا مبلغ توافقی)
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-amber-400">
                - {formatToman(settlement.dealershipCommission)}
              </span>
            </div>

            {/* 3. Deductible Expenses */}
            <div className="p-3 flex items-center justify-between text-rose-400/90 bg-rose-500/5">
              <div>
                <span className="font-semibold block">کسر: هزینه‌های انجام‌شده به عهده مالک:</span>
                <span className="text-[10px] text-zinc-500">
                  کارواش، کارشناسی فنی، پولیش یا تعمیرات هماهنگ‌شده
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-rose-400">
                - {formatToman(settlement.deductibleExpenseAmount)}
              </span>
            </div>

            {/* 4. Net Payable to Owner */}
            <div className="p-3.5 flex items-center justify-between bg-[#181924] text-zinc-100">
              <div>
                <span className="font-black text-sm block text-purple-300">
                  مبلغ خالص قابل تسویه با مالک:
                </span>
                <span className="text-[10px] text-zinc-400">
                  (قیمت فروش منهای کمیسیون و هزینه‌های کسرشده)
                </span>
              </div>
              <span className="font-mono font-black text-base text-purple-300">
                {formatToman(settlement.netPayableToOwner)}
              </span>
            </div>

            {/* 5. Paid To Date */}
            <div className="p-3 flex items-center justify-between text-emerald-400 bg-emerald-500/5">
              <div>
                <span className="font-semibold block">کل مبلغ پرداخت‌شده به مالک تا کنون:</span>
                <span className="text-[10px] text-zinc-500">
                  مجموع واریزی‌ها و چک‌های وصول‌شده
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-emerald-400">
                {formatToman(settlement.paidAmount)}
              </span>
            </div>

            {/* 6. Remaining Balance */}
            <div className="p-3.5 flex items-center justify-between bg-[#19161a] text-zinc-100">
              <div>
                <span className="font-black text-sm block text-amber-400">
                  مانده طلب نهایی مالک (جهت تسویه):
                </span>
                <span className="text-[10px] text-zinc-400">
                  مبلغ باقی‌مانده که باید به مالک پرداخت شود
                </span>
              </div>
              <span className="font-mono font-black text-lg text-amber-400">
                {formatToman(settlement.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Payments to Owner Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>تاریخچه واریزی‌ها به مالک:</span>
              </span>

              {settlement.remainingAmount > 0 && !isAddingPayment && (
                <button
                  type="button"
                  onClick={() => setIsAddingPayment(true)}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ثبت واریزی جدید</span>
                </button>
              )}
            </div>

            {/* Add Payment Form */}
            {isAddingPayment && (
              <form
                onSubmit={handleAddPayment}
                className="p-4 bg-[#171822] border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span>ثبت واریزی جدید به حساب مالک</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingPayment(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] block mb-1">مبلغ واریزی (تومان):</span>
                    <input
                      type="text"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`حداکثر ${settlement.remainingAmount.toLocaleString()}`}
                      className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 font-mono text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500"
                      required
                    />
                    {paymentAmount && (
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">
                        {formatToman(parseInt(paymentAmount.replace(/[^\d]/g, ''), 10) || 0)}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] block mb-1">تاریخ پرداخت:</span>
                    <input
                      type="text"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] block mb-1">روش پرداخت:</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="transfer">واریز بانکی / پایا / ساتنا</option>
                      <option value="check">چک صیادی</option>
                      <option value="cash">نقدی</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] block mb-1">
                      {paymentMethod === 'check' ? 'شماره چک صیادی:' : 'شماره پیگیری بانکی:'}
                    </span>
                    <input
                      type="text"
                      value={paymentMethod === 'check' ? checkNumber : trackingNumber}
                      onChange={(e) =>
                        paymentMethod === 'check'
                          ? setCheckNumber(e.target.value)
                          : setTrackingNumber(e.target.value)
                      }
                      placeholder="کد ارجاع / پیگیری..."
                      className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 text-[10px] block mb-1">توضیحات:</span>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="مثال: تسویه مرحله اول پس از وصول چک خریدار..."
                      className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#252834]">
                  <button
                    type="button"
                    onClick={() => setIsAddingPayment(false)}
                    className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl"
                  >
                    ثبت واریزی و به‌روزرسانی مانده
                  </button>
                </div>
              </form>
            )}

            {/* Payments List */}
            {settlement.payments.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 bg-[#121317] border border-dashed border-[#262834] rounded-xl">
                تاکنون هیچ پرداختی به حساب مالک ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2">
                {settlement.payments.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#121317] border border-[#252834] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono flex items-center justify-center text-[10px] font-bold">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span className="font-bold text-zinc-100">
                          {formatToman(p.amount)}
                        </span>
                        <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800">
                          {p.method === 'transfer'
                            ? 'واریز بانکی'
                            : p.method === 'check'
                            ? 'چک صیادی'
                            : 'نقدی'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 pr-7">
                        تاریخ: {toPersianDigits(p.date)}{' '}
                        {p.trackingNumber && `• پیگیری: ${p.trackingNumber}`}
                        {p.notes && ` • «${p.notes}»`}
                      </div>
                    </div>

                    <span className="text-emerald-400 text-[10px] font-bold">پرداخت شده ✓</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#111216] border-t border-[#252834] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">مانده قابل پرداخت:</span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {formatToman(settlement.remainingAmount)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#20222a] hover:bg-[#282a34] text-zinc-200 text-xs font-semibold rounded-xl"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
