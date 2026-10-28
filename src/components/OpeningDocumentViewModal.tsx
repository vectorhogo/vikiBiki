import React, { useState } from 'react';
import { OpeningDocument } from '../types/accounting';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  X,
  Printer,
  Layers,
  Calendar,
  CheckCircle2,
  Building2,
  UserCheck,
  AlertTriangle,
  Car,
  Check,
} from 'lucide-react';

interface OpeningDocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OpeningDocument | null;
}

export const OpeningDocumentViewModal: React.FC<OpeningDocumentViewModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { settleOpeningReimbursement } = useAccounting();
  const [settlingPersonId, setSettlingPersonId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');

  if (!isOpen || !document) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalCashBank = document.cashBalance + document.bankBalance;

  const handleStartSettle = (personId: string, maxAmount: number) => {
    setSettlingPersonId(personId);
    setSettleAmount(maxAmount.toString());
  };

  const handleConfirmSettle = (personId: string) => {
    const amt = Number(settleAmount.replace(/,/g, ''));
    if (amt <= 0) return;
    settleOpeningReimbursement(document.id, personId, amt);
    setSettlingPersonId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-[#15161b] border border-[#2b2e38] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:w-full print:h-auto print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Header - Screen only */}
        <div className="p-4 border-b border-[#262832] bg-[#1a1c23] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>مشاهده سند افتتاحیه: {document.periodTitle}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    document.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {document.status === 'active' ? 'دوره فعال' : 'بایگانی‌شده'}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">تاریخ شروع: {document.startDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#252834] hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ سند (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#252834] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs print:p-0 print:text-black print:overflow-visible">
          {/* Formal Printable Header */}
          <div className="border-b-2 border-zinc-700 pb-4 print:border-black flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-base sm:text-lg font-black text-zinc-100 print:text-black">
                نمایشگاه اتومبیل عبدالهی
              </div>
              <div className="text-xs text-zinc-400 print:text-zinc-600">
                سند رسمی افتتاحیه دوره مالی و انتقال تراز مانده‌ها
              </div>
            </div>

            <div className="text-left space-y-1 text-xs">
              <div className="font-bold text-zinc-200 print:text-black">
                دوره مالی: {document.periodTitle}
              </div>
              <div className="text-zinc-400 print:text-zinc-700 font-mono">
                تاریخ شروع: {document.startDate}
              </div>
              <div className="text-[10px] text-zinc-500 print:text-zinc-600 font-mono">
                شماره سند: {document.id}
              </div>
            </div>
          </div>

          {/* Reconciliation Status notice if discrepancy */}
          {document.reconciliationStatus === 'discrepancy' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 flex items-center gap-2 print:border-zinc-500 print:text-black">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                توجه: این سند افتتاحیه با مغایرت نسبت به تراز اختتامیه دوره قبل ثبت گردیده است (اختلاف:{' '}
                {formatToman(document.reconciliationDifference || 0)}).
              </span>
            </div>
          )}

          {/* Section 1: Cash and Bank Opening Balances */}
          <div className="space-y-2">
            <div className="font-bold text-zinc-200 print:text-black text-xs flex items-center gap-2 border-b border-[#252834] pb-1 print:border-zinc-400">
              <span>۱. نقدینگی و موجودی‌های نقدی و بانکی در افتتاحیه</span>
            </div>

            <table className="w-full text-right border-collapse border border-[#282a35] print:border-black">
              <thead>
                <tr className="bg-[#1b1d25] print:bg-zinc-100 text-zinc-300 print:text-black border-b border-[#282a35] print:border-black text-[11px]">
                  <th className="p-2">ردیف</th>
                  <th className="p-2">عنوان حساب / سرفصل</th>
                  <th className="p-2">نوع موجودی</th>
                  <th className="p-2 text-left">مبلغ (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20222a] print:divide-zinc-300">
                <tr>
                  <td className="p-2 font-mono">۱</td>
                  <td className="p-2 font-semibold">صندوق اصلی نمایشگاه (نقد)</td>
                  <td className="p-2 text-zinc-400 print:text-zinc-700">موجودی نقدی</td>
                  <td className="p-2 text-left font-mono font-bold text-emerald-400 print:text-black">
                    {formatToman(document.cashBalance)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">۲</td>
                  <td className="p-2 font-semibold">حساب‌های بانکی و جاری</td>
                  <td className="p-2 text-zinc-400 print:text-zinc-700">موجودی بانک</td>
                  <td className="p-2 text-left font-mono font-bold text-emerald-400 print:text-black">
                    {formatToman(document.bankBalance)}
                  </td>
                </tr>
                <tr className="bg-[#181a21] print:bg-zinc-200 font-bold">
                  <td colSpan={3} className="p-2 text-right">
                    جمع کل نقدینگی افتتاحیه:
                  </td>
                  <td className="p-2 text-left font-mono text-emerald-400 print:text-black text-sm">
                    {formatToman(totalCashBank)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Transferred Advances */}
          <div className="space-y-2">
            <div className="font-bold text-zinc-200 print:text-black text-xs flex items-center gap-2 border-b border-[#252834] pb-1 print:border-zinc-400">
              <span>۲. مانده تنخواه‌های باز پرسنل (انتقال‌یافته به دوره جدید)</span>
            </div>

            {document.transferredAdvances && document.transferredAdvances.length > 0 ? (
              <table className="w-full text-right border-collapse border border-[#282a35] print:border-black">
                <thead>
                  <tr className="bg-[#1b1d25] print:bg-zinc-100 text-zinc-300 print:text-black border-b border-[#282a35] print:border-black text-[11px]">
                    <th className="p-2">ردیف</th>
                    <th className="p-2">نام و نام خانوادگی</th>
                    <th className="p-2">کل تنخواه قبلی</th>
                    <th className="p-2">هزینه قطعی شده</th>
                    <th className="p-2">اقدام در افتتاحیه</th>
                    <th className="p-2 text-left">مانده انتقالی (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20222a] print:divide-zinc-300">
                  {document.transferredAdvances.map((adv, idx) => (
                    <tr key={adv.personId}>
                      <td className="p-2 font-mono">{toPersianDigits(idx + 1)}</td>
                      <td className="p-2 font-bold">{adv.personName}</td>
                      <td className="p-2 font-mono text-zinc-400 print:text-zinc-700">
                        {formatToman(adv.originalAmount)}
                      </td>
                      <td className="p-2 font-mono text-zinc-400 print:text-zinc-700">
                        {formatToman(adv.spentAmount)}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            adv.action === 'transfer'
                              ? 'bg-amber-500/15 text-amber-300 print:text-black'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {adv.action === 'transfer' ? 'انتقال مانده به دوره جدید' : 'تسویه قبل از دوره'}
                        </span>
                      </td>
                      <td className="p-2 text-left font-mono font-bold text-amber-400 print:text-black">
                        {adv.action === 'transfer' ? formatToman(adv.remainingAmount) : '۰'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#181a21] print:bg-zinc-200 font-bold">
                    <td colSpan={5} className="p-2 text-right">
                      جمع مانده تنخواه‌های انتقالی به دوره جدید:
                    </td>
                    <td className="p-2 text-left font-mono text-amber-400 print:text-black">
                      {formatToman(document.totalTransferredAdvanceAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="p-3 bg-[#14151a] rounded text-zinc-400">
                هیچ مانده تنخواهی برای انتقال به این دوره وجود ندارد.
              </div>
            )}
          </div>

          {/* Section 3: Transferred Reimbursements */}
          <div className="space-y-2">
            <div className="font-bold text-zinc-200 print:text-black text-xs flex items-center gap-2 border-b border-[#252834] pb-1 print:border-zinc-400">
              <span>۳. بدهی بازپرداخت هزینه‌های شخصی پرسنل (مطالبات افتتاحیه)</span>
            </div>

            {document.transferredReimbursements && document.transferredReimbursements.length > 0 ? (
              <table className="w-full text-right border-collapse border border-[#282a35] print:border-black">
                <thead>
                  <tr className="bg-[#1b1d25] print:bg-zinc-100 text-zinc-300 print:text-black border-b border-[#282a35] print:border-black text-[11px]">
                    <th className="p-2">ردیف</th>
                    <th className="p-2">نام طلبکار (پرسنل)</th>
                    <th className="p-2">تعداد فاکتور</th>
                    <th className="p-2">وضعیت پرداخت</th>
                    <th className="p-2 text-left">مبلغ بدهی افتتاحیه (تومان)</th>
                    <th className="p-2 text-center print:hidden">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20222a] print:divide-zinc-300">
                  {document.transferredReimbursements.map((r, idx) => {
                    const isFullySettled = (r.settledAmount || 0) >= r.amount;
                    const remainingToSettle = r.amount - (r.settledAmount || 0);

                    return (
                      <tr key={r.personId}>
                        <td className="p-2 font-mono">{toPersianDigits(idx + 1)}</td>
                        <td className="p-2 font-bold">{r.personName}</td>
                        <td className="p-2 font-mono">{toPersianDigits(r.expenseCount)} فاکتور</td>
                        <td className="p-2">
                          {isFullySettled ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              تسویه شده ({toPersianDigits(r.settledAt || '')})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/15 text-sky-300 print:text-black">
                              انتقال بدهی بازپرداخت
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-left font-mono font-bold text-sky-400 print:text-black">
                          {r.action === 'transfer' ? formatToman(r.amount) : '۰'}
                        </td>
                        <td className="p-2 text-center print:hidden">
                          {!isFullySettled && document.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleStartSettle(r.personId, remainingToSettle)}
                              className="px-2 py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              تسویه و پرداخت بدهی
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#181a21] print:bg-zinc-200 font-bold">
                    <td colSpan={4} className="p-2 text-right">
                      جمع بدهی بازپرداخت‌های شخصی افتتاحیه:
                    </td>
                    <td className="p-2 text-left font-mono text-sky-400 print:text-black">
                      {formatToman(document.totalTransferredReimbursementAmount)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="p-3 bg-[#14151a] rounded text-zinc-400">
                هیچ طلب یا هزینه شخصی تسویه‌نشده‌ای وجود ندارد.
              </div>
            )}
          </div>

          {/* Settle Reimbursement Modal / Popover */}
          {settlingPersonId && (
            <div className="p-3 bg-[#1d202b] border border-sky-500/30 rounded-xl space-y-2 animate-in fade-in-50">
              <div className="font-bold text-sky-300 text-xs flex items-center justify-between">
                <span>ثبت پرداخت بدهی افتتاحیه پرسنل (بدون ایجاد هزینه مضاعف)</span>
                <button
                  onClick={() => setSettlingPersonId(null)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                این عملیات بدهی ناشی از دوره گذشته را مستقیماً از نقدینگی جاری تسویه می‌کند و مجدداً در
                هزینه‌های این دوره فاکتور ثبت نخواهد شد.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="bg-[#14151c] border border-[#2e3242] rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs w-48"
                  placeholder="مبلغ پرداختی..."
                />
                <button
                  type="button"
                  onClick={() => handleConfirmSettle(settlingPersonId)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
                >
                  تأیید پرداخت
                </button>
              </div>
            </div>
          )}

          {/* Section 4: Vehicle Historical Balance */}
          {document.vehicleSummaries && document.vehicleSummaries.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-zinc-200 print:text-black text-xs flex items-center gap-2 border-b border-[#252834] pb-1 print:border-zinc-400">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>۴. خلاصه سوابق هزینه‌کرد خودروهای موجود در انبار تا شروع دوره</span>
              </div>
              <table className="w-full text-right border-collapse border border-[#282a35] print:border-black">
                <thead>
                  <tr className="bg-[#1b1d25] print:bg-zinc-100 text-zinc-300 print:text-black border-b border-[#282a35] print:border-black text-[11px]">
                    <th className="p-2">خودرو / شناسه</th>
                    <th className="p-2 text-left">مجموع هزینه‌های ثبت‌شده قبل از این دوره (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20222a] print:divide-zinc-300">
                  {document.vehicleSummaries.map((v) => (
                    <tr key={v.vehicleId}>
                      <td className="p-2 font-bold">{v.vehicleLabel}</td>
                      <td className="p-2 text-left font-mono font-bold text-zinc-300 print:text-black">
                        {formatToman(v.totalExpensesBefore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 5: Other Balances */}
          {document.otherBalances && document.otherBalances.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-zinc-200 print:text-black text-xs flex items-center gap-2 border-b border-[#252834] pb-1 print:border-zinc-400">
                <span>۵. سایر مانده‌ها و تعهدات افتتاحیه</span>
              </div>
              <table className="w-full text-right border-collapse border border-[#282a35] print:border-black">
                <thead>
                  <tr className="bg-[#1b1d25] print:bg-zinc-100 text-zinc-300 print:text-black border-b border-[#282a35] print:border-black text-[11px]">
                    <th className="p-2">عنوان سرفصل</th>
                    <th className="p-2">ماهیت</th>
                    <th className="p-2 text-left">مبلغ (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20222a] print:divide-zinc-300">
                  {document.otherBalances.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-bold">{item.title}</td>
                      <td className="p-2">{item.type === 'asset' ? 'دارایی / طلب' : 'بدهی / تعهد'}</td>
                      <td className="p-2 text-left font-mono font-bold">{formatToman(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {document.notes && (
            <div className="p-3 bg-[#181a22] print:bg-zinc-100 border border-[#282a35] print:border-zinc-300 rounded-lg space-y-1">
              <span className="font-bold text-zinc-300 print:text-black">
                یادداشت‌ها و توضیحات افتتاحیه:
              </span>
              <p className="text-zinc-400 print:text-zinc-800 leading-relaxed whitespace-pre-wrap">
                {document.notes}
              </p>
            </div>
          )}

          {/* Signatures for Print */}
          <div className="pt-8 border-t border-zinc-700 print:border-black grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-10">
              <div className="font-bold text-zinc-300 print:text-black">
                تنظیم‌کننده و مسئول تنخواه:
              </div>
              <div className="text-[11px] text-zinc-500 print:text-zinc-600">امضا و تاریخ</div>
            </div>

            <div className="space-y-10">
              <div className="font-bold text-zinc-300 print:text-black">
                تأیید مدیریت نمایشگاه اتومبیل:
              </div>
              <div className="text-[11px] text-zinc-500 print:text-zinc-600">امضا و مهر</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#262832] bg-[#1a1c23] flex items-center justify-between print:hidden">
          <span className="text-[11px] text-zinc-500 font-mono">شناسه سند: {document.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#252834] hover:bg-[#2e3240] text-zinc-300 font-semibold rounded-lg text-xs transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
