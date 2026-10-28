import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  X,
  Calendar,
  Wallet,
  Building2,
  Users,
  Car,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Info,
  Scale,
} from 'lucide-react';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  TransferredAdvanceItem,
  TransferredReimbursementItem,
  OtherOpeningBalance,
} from '../types/accounting';

interface OpeningDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (periodId: string) => void;
}

export const OpeningDocumentModal: React.FC<OpeningDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    activePeriod,
    activePeriodId,
    getOpenItemsForNewPeriod,
    createOpeningPeriod,
    getSmartOpeningSuggestions,
    reconcileOpeningVsClosing,
  } = useAccounting();

  // Multi-step wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [periodTitle, setPeriodTitle] = useState('');
  const [startDate, setStartDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [notes, setNotes] = useState('');
  const [cashBalanceStr, setCashBalanceStr] = useState('');
  const [bankBalanceStr, setBankBalanceStr] = useState('');

  // Transferred items
  const [advances, setAdvances] = useState<TransferredAdvanceItem[]>([]);
  const [reimbursements, setReimbursements] = useState<TransferredReimbursementItem[]>([]);
  const [otherBalances, setOtherBalances] = useState<OtherOpeningBalance[]>([]);

  // Other balance input
  const [newOtherTitle, setNewOtherTitle] = useState('');
  const [newOtherAmount, setNewOtherAmount] = useState('');
  const [newOtherType, setNewOtherType] = useState<'asset' | 'liability'>('asset');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize data when modal opens
  const openItems = useMemo(() => {
    if (!isOpen) return { openAdvances: [], openReimbursements: [], vehicleSummaries: [], openExpensesWithoutReceiptCount: 0 };
    return getOpenItemsForNewPeriod();
  }, [isOpen, getOpenItemsForNewPeriod]);

  // Sync open items on modal open
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage(null);
      setStartDate(DEALERSHIP_CURRENT_DATE);
      setCashBalanceStr('');
      setBankBalanceStr('');
      setNotes('');
      setOtherBalances([]);

      // Auto-suggest next period title
      const nextYear = 'سال ۱۴۰۶';
      setPeriodTitle(nextYear);

      // Default advances and reimbursements
      setAdvances(openItems.openAdvances);
      setReimbursements(openItems.openReimbursements);
    }
  }, [isOpen, openItems]);

  if (!isOpen) return null;

  const cashBalance = Number(cashBalanceStr.replace(/,/g, '')) || 0;
  const bankBalance = Number(bankBalanceStr.replace(/,/g, '')) || 0;
  const totalCashBank = cashBalance + bankBalance;

  const totalTransferredAdvance = advances
    .filter((a) => a.action === 'transfer')
    .reduce((sum, a) => sum + a.remainingAmount, 0);

  const totalTransferredReimbursement = reimbursements
    .filter((r) => r.action === 'transfer')
    .reduce((sum, r) => sum + r.amount, 0);

  const reconciliation = useMemo(() => {
    return reconcileOpeningVsClosing(activePeriodId, {
      cash: cashBalance,
      bank: bankBalance,
      advances: totalTransferredAdvance,
      reimbursements: totalTransferredReimbursement,
    });
  }, [
    activePeriodId,
    cashBalance,
    bankBalance,
    totalTransferredAdvance,
    totalTransferredReimbursement,
    reconcileOpeningVsClosing,
  ]);

  const handleAdvanceActionToggle = (personId: string) => {
    setAdvances((prev) =>
      prev.map((a) =>
        a.personId === personId
          ? { ...a, action: a.action === 'transfer' ? 'settle' : 'transfer' }
          : a
      )
    );
  };

  const handleReimbursementActionToggle = (personId: string) => {
    setReimbursements((prev) =>
      prev.map((r) =>
        r.personId === personId
          ? { ...r, action: r.action === 'transfer' ? 'settle' : 'transfer' }
          : r
      )
    );
  };

  const handleAddOtherBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(newOtherAmount.replace(/,/g, ''));
    if (!newOtherTitle.trim() || cleanAmount <= 0) return;

    setOtherBalances((prev) => [
      ...prev,
      {
        id: `other_${Date.now()}`,
        title: newOtherTitle.trim(),
        amount: cleanAmount,
        type: newOtherType,
      },
    ]);

    setNewOtherTitle('');
    setNewOtherAmount('');
  };

  const handleRemoveOtherBalance = (id: string) => {
    setOtherBalances((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFinalSubmit = async () => {
    if (!periodTitle.trim()) {
      setErrorMessage('لطفاً عنوان دوره را وارد فرمایید.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createOpeningPeriod({
      title: periodTitle.trim(),
      startDate: startDate.trim() || DEALERSHIP_CURRENT_DATE,
      notes: notes.trim(),
      cashBalance,
      bankBalance,
      transferredAdvances: advances,
      transferredReimbursements: reimbursements,
      otherBalances,
      previousPeriodClosingCash: reconciliation.items[0]?.previousClosing,
      previousPeriodClosingBank: reconciliation.items[1]?.previousClosing,
    });

    setIsSubmitting(false);

    if (result.success && result.periodId) {
      if (onSuccess) onSuccess(result.periodId);
      onClose();
    } else {
      setErrorMessage(result.error || 'خطا در ایجاد سند افتتاحیه و شروع دوره جدید.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-[#15161b] border border-[#2b2e38] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262832] bg-[#1a1c23] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>سند افتتاحیه دوره مالی جدید</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  بدون حذف اطلاعات
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                شروع دوره جدید با انتقال امن مانده‌ها و بایگانی دوره گذشته
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#252834] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-[#121318] px-4 py-2.5 border-b border-[#242630] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setStep(1)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                step === 1
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1e2029]'
              }`}
            >
              <span>۱. مشخصات و نقدینگی</span>
            </button>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => setStep(2)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                step === 2
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1e2029]'
              }`}
            >
              <span>۲. تنخواه و مطالبات</span>
              {(advances.length > 0 || reimbursements.length > 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => setStep(3)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                step === 3
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1e2029]'
              }`}
            >
              <span>۳. خودروها و سایر مانده‌ها</span>
            </button>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => setStep(4)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                step === 4
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1e2029]'
              }`}
            >
              <span>۴. تأیید نهایی</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">خطا در فرآیند</div>
                <div className="mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Warning Banner on Open Items in Current Period */}
          {(openItems.openAdvances.length > 0 ||
            openItems.openReimbursements.length > 0 ||
            openItems.openExpensesWithoutReceiptCount > 0) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-200/90 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-300">توجه: برخی موارد دوره فعلی هنوز باز هستند</div>
                <div className="text-[11px] text-amber-300/80 leading-relaxed">
                  می‌توانید مانده‌ها را بدون ثبت سند تکراری به عنوان مانده افتتاحیه به دوره جدید منتقل
                  کنید، یا قبل از شروع دوره آنها را تسویه نمایید.
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Basic Info & Cash/Bank */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="font-bold text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>مشخصات دوره مالی جدید</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">عنوان دوره جدید *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: سال ۱۴۰۶ یا نیمسال دوم ۱۴۰۵"
                      value={periodTitle}
                      onChange={(e) => setPeriodTitle(e.target.value)}
                      className="w-full bg-[#121318] border border-[#2e313d] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">تاریخ شروع دوره *</label>
                    <input
                      type="text"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="۱۴۰۵/۰۶/۲۹"
                      className="w-full bg-[#121318] border border-[#2e313d] rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">یادداشت / توضیحات افتتاحیه (اختیاری)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="توضیحات مربوط به افتتاح حساب‌ها و سیاست‌های این دوره..."
                    className="w-full bg-[#121318] border border-[#2e313d] rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Cash and Bank Opening Balances */}
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="font-bold text-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>موجودی نقدینگی در شروع دوره</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestions = getSmartOpeningSuggestions(startDate);
                      if (suggestions.suggestedCash > 0) {
                        setCashBalanceStr(suggestions.suggestedCash.toLocaleString());
                      }
                      if (suggestions.suggestedBank > 0) {
                        setBankBalanceStr(suggestions.suggestedBank.toLocaleString());
                      }
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>پیشنهاد خودکار بر اساس مانده دوره فعلی</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">موجودی صندوق / نقد</label>
                    <input
                      type="text"
                      placeholder="۰"
                      value={cashBalanceStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCashBalanceStr(val ? Number(val).toLocaleString() : '');
                      }}
                      className="w-full bg-[#121318] border border-[#2e313d] rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    {cashBalance > 0 && (
                      <div className="text-[11px] text-emerald-400 mt-1">
                        {formatToman(cashBalance)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">موجودی حساب‌های بانکی</label>
                    <input
                      type="text"
                      placeholder="۰"
                      value={bankBalanceStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setBankBalanceStr(val ? Number(val).toLocaleString() : '');
                      }}
                      className="w-full bg-[#121318] border border-[#2e313d] rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    {bankBalance > 0 && (
                      <div className="text-[11px] text-emerald-400 mt-1">
                        {formatToman(bankBalance)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-[#14151a] rounded-lg flex items-center justify-between text-xs">
                  <span className="text-zinc-400">مجموع نقدینگی افتتاحیه:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {formatToman(totalCashBank)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Advances & Personnel Reimbursements */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Carried-forward Advances */}
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-zinc-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>مانده تنخواه‌های باز پرسنل</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {toPersianDigits(advances.length)} نفر دارای مانده تنخواه
                  </span>
                </div>

                {advances.length === 0 ? (
                  <div className="text-center py-4 text-zinc-400 bg-[#14151a] rounded-lg">
                    هیچ تنخواه بازی وجود ندارد. تمام تنخواه‌ها تسویه شده‌اند.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {advances.map((item) => (
                      <div
                        key={item.personId}
                        className="p-3 bg-[#14151a] border border-[#242630] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{item.personName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                            <span>کل تنخواه: {formatToman(item.originalAmount)}</span>
                            <span>•</span>
                            <span>هزینه شده: {formatToman(item.spentAmount)}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">
                              مانده در دست: {formatToman(item.remainingAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdvanceActionToggle(item.personId)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                              item.action === 'transfer'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {item.action === 'transfer'
                              ? 'انتقال مانده به دوره جدید (فعال)'
                              : 'تسویه قبل از شروع دوره'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-zinc-400 leading-relaxed bg-[#131419] p-2.5 rounded-lg">
                  💡 انتقال مانده تنخواه، سند هزینه تکراری ایجاد نمی‌کند. این مبلغ صرفاً به عنوان موجودی اولیه تنخواه این پرسنل در دوره جدید لحاظ می‌گردد.
                </div>
              </div>

              {/* Personal Expenses Reimbursement Liability */}
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-zinc-100 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-sky-400" />
                    <span>مطالبات پرسنل (پرداخت‌های شخصی در انتظار بازپرداخت)</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {toPersianDigits(reimbursements.length)} نفر
                  </span>
                </div>

                {reimbursements.length === 0 ? (
                  <div className="text-center py-4 text-zinc-400 bg-[#14151a] rounded-lg">
                    هیچ هزینه شخصی در انتظار بازپرداختی وجود ندارد.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reimbursements.map((item) => (
                      <div
                        key={item.personId}
                        className="p-3 bg-[#14151a] border border-[#242630] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{item.personName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                            <span>{toPersianDigits(item.expenseCount)} فقره فاکتور شخصی</span>
                            <span>•</span>
                            <span className="text-sky-400 font-semibold">
                              مبلغ طلب: {formatToman(item.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReimbursementActionToggle(item.personId)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                              item.action === 'transfer'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {item.action === 'transfer'
                              ? 'انتقال بدهی بازپرداخت به دوره جدید'
                              : 'تسویه خارج از دوره'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Vehicles & Other Balances */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Vehicles Summary */}
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-zinc-100 flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>سوابق خودروها تا قبل از دوره جدید</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {toPersianDigits(openItems.vehicleSummaries.length)} خودرو
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  خودروها موجودیت‌های اصلی نمایشگاه هستند و هیچ‌گاه در دوره‌های جدید تکثیر نمی‌شوند. هزینه‌های گذشته در بایگانی حفظ شده و دوره جدید با سوابق پاک برای ثبت هزینه‌های آتی آغاز می‌شود:
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#242630]">
                  {openItems.vehicleSummaries.map((v) => (
                    <div key={v.vehicleId} className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-200 font-medium">{v.vehicleLabel}</span>
                      <span className="text-zinc-400 font-mono">
                        مجموع هزینه‌های گذشته: {formatToman(v.totalExpensesBefore)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Opening Balances (Optional) */}
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="font-bold text-zinc-100 flex items-center justify-between">
                  <span>سایر مانده‌های افتتاحیه (اختیاری)</span>
                  <span className="text-[11px] text-zinc-400">چک‌ها، پیش‌پرداخت‌ها یا مطالبات</span>
                </div>

                {/* List */}
                {otherBalances.length > 0 && (
                  <div className="space-y-1.5">
                    {otherBalances.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-[#14151a] border border-[#242630] rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-zinc-200">{item.title}</span>
                          <span className={`mr-2 px-2 py-0.5 rounded text-[10px] ${
                            item.type === 'asset'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}>
                            {item.type === 'asset' ? 'دارایی / طلب' : 'بدهی'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-zinc-100">
                            {formatToman(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOtherBalance(item.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new item */}
                <form onSubmit={handleAddOtherBalance} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="عنوان مانده..."
                    value={newOtherTitle}
                    onChange={(e) => setNewOtherTitle(e.target.value)}
                    className="sm:col-span-2 bg-[#121318] border border-[#2e313d] rounded-lg px-2.5 py-1.5 text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="مبلغ (تومان)"
                    value={newOtherAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNewOtherAmount(val ? Number(val).toLocaleString() : '');
                    }}
                    className="bg-[#121318] border border-[#2e313d] rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#252834] hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: Summary & Mandatory Backup Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-[#1a1c24] border border-[#292c37] p-4 rounded-xl space-y-3">
                <div className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>خلاصه سند افتتاحیه جهت تأیید و اجرا</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#131419] rounded-lg space-y-1.5">
                    <span className="text-zinc-400">عنوان دوره جدید:</span>
                    <div className="font-bold text-zinc-100 text-sm">{periodTitle}</div>
                    <div className="text-[11px] text-zinc-400">تاریخ شروع: {startDate}</div>
                  </div>

                  <div className="p-3 bg-[#131419] rounded-lg space-y-1.5">
                    <span className="text-zinc-400">نقدینگی در شروع:</span>
                    <div className="font-bold text-emerald-400 text-sm">{formatToman(totalCashBank)}</div>
                    <div className="text-[11px] text-zinc-400">
                      نقد: {formatToman(cashBalance)} | بانک: {formatToman(bankBalance)}
                    </div>
                  </div>

                  <div className="p-3 bg-[#131419] rounded-lg space-y-1.5">
                    <span className="text-zinc-400">تنخواه‌های انتقالی به دوره جدید:</span>
                    <div className="font-bold text-amber-400 text-sm">
                      {formatToman(totalTransferredAdvance)}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {toPersianDigits(advances.filter((a) => a.action === 'transfer').length)} نفر مسئول تنخواه
                    </div>
                  </div>

                  <div className="p-3 bg-[#131419] rounded-lg space-y-1.5">
                    <span className="text-zinc-400">بدهی بازپرداخت شخصی انتقالی:</span>
                    <div className="font-bold text-sky-400 text-sm">
                      {formatToman(totalTransferredReimbursement)}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {toPersianDigits(reimbursements.filter((r) => r.action === 'transfer').length)} نفر طلبکار
                    </div>
                  </div>
                </div>

                {/* Reconciliation Comparison with Previous Period */}
                <div className="p-3.5 bg-[#14151a] border border-[#2b2e3a] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>تطبیق ارقام افتتاحیه با مانده بستن دوره قبلی ({activePeriod?.title})</span>
                    </div>
                    {reconciliation.overallStatus === 'matched' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        تطابق کامل
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        دارای مغایرت تراز
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {reconciliation.items.map((item, idx) => (
                      <div key={idx} className="p-2 bg-[#191b22] border border-[#262833] rounded-lg flex items-center justify-between">
                        <span className="text-zinc-400">{item.title}:</span>
                        <div className="text-left font-mono">
                          <span className="text-zinc-300">{formatToman(item.newOpening)}</span>
                          {item.status === 'discrepancy' && (
                            <span className="text-rose-400 text-[10px] block">
                              اختلاف: {formatToman(item.difference)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {reconciliation.warnings && reconciliation.warnings.length > 0 && (
                    <div className="text-[10px] text-amber-300/80 bg-amber-500/5 p-2 rounded border border-amber-500/15">
                      {reconciliation.warnings.map((w: string, i: number) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mandatory Pre-Backup Notice */}
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-300">
                      پشتیبان‌گیری خودکار و تضمین عدم حذف داده‌ها
                    </div>
                    <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                      قبل از نهایی شدن، یک نسخه پشتیبان کامل ZIP با ساختار استاندارد ایجاد خواهد شد. دوره قبلی
                      بایگانی شده و کلیه سوابق آن در بخش گزارش‌ها و فیلتر دوره‌ها برای همیشه در دسترس خواهد بود.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-[#262832] bg-[#1a1c23] flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg bg-[#252834] hover:bg-[#2e3240] text-zinc-300 font-bold transition-colors flex items-center gap-1.5 text-xs"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors text-xs"
              >
                انصراف
              </button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !periodTitle.trim()) {
                    setErrorMessage('لطفاً عنوان دوره را مشخص فرمایید.');
                    return;
                  }
                  setErrorMessage(null);
                  setStep((prev) => (prev + 1) as any);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <span>مرحله بعد</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold rounded-lg transition-all flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>در حال پشتیبان‌گیری و راه‌اندازی دوره...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ایجاد سند افتتاحیه و شروع دوره جدید</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
