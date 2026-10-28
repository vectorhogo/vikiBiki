import React, { useState } from 'react';
import { SmartContract, ContractStatus } from '../types/contract';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  X,
  Printer,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Car,
  User,
  History,
  Paperclip,
  Ban,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { PrintableContractModal } from './PrintableContractModal';

interface ContractDetailDrawerProps {
  contractId: string | null;
  onClose: () => void;
  onOpenCustomerProfile?: (customerId: string) => void;
}

type TabType = 'overview' | 'installments' | 'clauses' | 'history' | 'attachments';

export const ContractDetailDrawer: React.FC<ContractDetailDrawerProps> = ({
  contractId,
  onClose,
  onOpenCustomerProfile,
}) => {
  const { contracts, indirectTransactions, cancelContract, showToast } = useAccounting();

  const contract = contracts.find((c) => c.id === contractId);
  const contractIndirects = indirectTransactions.filter(
    (tx) => tx.contractId === contract?.id || tx.contractNumber === contract?.contractNumber
  );

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRegisterPaymentOpen, setIsRegisterPaymentOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('فسخ با توافق طرفین معامله');

  if (!contract) return null;

  const isSale = contract.contractType === 'sale';

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">پیش‌نویس</span>;
      case 'ready_to_sign':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">آماده امضا</span>;
      case 'signed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">امضا شده و معتبر</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">تسویه کامل و خاتمه‌یافته</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">فسخ / باطل شده</span>;
      default:
        return null;
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellationReason.trim()) {
      showToast('لطفاً دلیل فسخ قرارداد را وارد نمایید.', 'error');
      return;
    }
    cancelContract(contract.id, cancellationReason.trim());
    setIsCancelConfirmOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn" dir="rtl">
      <div className="w-full max-w-3xl bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 font-mono">
                  {contract.contractNumber}
                </h2>
                {getStatusBadge(contract.status)}
                <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                  {isSale ? 'قرارداد فروش' : 'قرارداد خرید'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {contract.vehicleLabel} — تاریخ انعقاد: {toPersianDigits(contract.contractDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="چاپ نسخه رسمی مبایعه‌نامه"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Financial Summary Ribbon */}
        <div className="grid grid-cols-4 gap-2 px-5 py-3 bg-zinc-950/40 border-b border-zinc-800/80 text-xs text-center">
          <div>
            <span className="text-zinc-500 block text-[11px]">مبلغ کل قرارداد:</span>
            <span className="font-bold text-zinc-200 font-en-num">
              {formatToman(contract.financials.totalAgreedPrice)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">سود اقساطی:</span>
            <span className="font-semibold text-amber-400 font-en-num">
              {formatToman(contract.financials.installmentProfit)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">کل وصول‌شده:</span>
            <span className="font-bold text-emerald-400 font-en-num">
              {formatToman(contract.financials.paidSoFar)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">مانده اقساط:</span>
            <span className="font-bold text-sky-400 font-en-num">
              {formatToman(contract.financials.remainingBalance)}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/20 px-5 text-xs font-medium">
          {[
            { id: 'overview', label: 'خلاصه و طرفین' },
            { id: 'installments', label: `جدول اقساط (${toPersianDigits(contract.installments.length)})` },
            { id: 'clauses', label: 'مواد و دفترخانه' },
            { id: 'history', label: `سوابق ویرایش (${toPersianDigits(contract.versionHistory?.length || 0)})` },
            { id: 'attachments', label: 'اسناد و پیوست‌ها' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Vehicle Snapshot */}
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>مشخصات فنی خودروی موضوع معامله</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">مدل:</span>
                    <span className="font-semibold text-zinc-200">{contract.vehicleLabel}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">پلاک:</span>
                    <span className="font-mono text-zinc-200">{toPersianDigits(contract.vehicleSnapshot.licensePlate || '---')}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">رنگ و سال:</span>
                    <span className="text-zinc-200">{contract.vehicleSnapshot.color || 'سفید'} ({toPersianDigits(contract.vehicleSnapshot.year || 1402)})</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">کارکرد:</span>
                    <span className="font-mono text-zinc-200">{toPersianDigits(contract.vehicleSnapshot.mileage ? `${contract.vehicleSnapshot.mileage.toLocaleString()} کیلومتر` : 'صفر')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block mb-0.5">شماره شاسی (VIN):</span>
                    <span className="font-mono text-zinc-300">{contract.vehicleSnapshot.chassisNumber || '---'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block mb-0.5">شماره موتور:</span>
                    <span className="font-mono text-zinc-300">{contract.vehicleSnapshot.engineNumber || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      خریدار: {contract.parties.buyer.name}
                    </span>
                    {contract.buyerId && onOpenCustomerProfile && (
                      <button
                        onClick={() => onOpenCustomerProfile(contract.buyerId!)}
                        className="text-amber-400 hover:underline cursor-pointer text-[11px]"
                      >
                        پرونده مشتری
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    <div>کد ملی: <span className="font-mono">{toPersianDigits(contract.parties.buyer.nationalId || '---')}</span></div>
                    <div>تلفن: <span className="font-mono">{toPersianDigits(contract.parties.buyer.phone || '---')}</span></div>
                    <div>نشانی: <span>{contract.parties.buyer.address || '---'}</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      فروشنده: {contract.parties.seller.name}
                    </span>
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    <div>کد / شناسه ملی: <span className="font-mono">{toPersianDigits(contract.parties.seller.nationalId || '---')}</span></div>
                    <div>تلفن: <span className="font-mono">{toPersianDigits(contract.parties.seller.phone || '---')}</span></div>
                    <div>نشانی: <span>{contract.parties.seller.address || 'تهران'}</span></div>
                  </div>
                </div>
              </div>

              {/* Detailed Financial Terms Segregation Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>تفکیک شرایط مالی و تعهدات قراردادی</span>
                  <span className="text-[11px] text-zinc-400">
                    شیوه: {contract.financials.paymentArrangement === 'cash' ? 'نقدی' : contract.financials.paymentArrangement === 'installment' ? 'اقساطی' : 'ترکیبی نقد و اقساط'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-zinc-800/80 pt-3">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">قیمت اصلی خودرو:</span>
                    <span className="font-semibold text-zinc-200 font-en-num">
                      {formatToman(contract.financials.baseVehiclePrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">سود قراردادی اقساط:</span>
                    <span className="font-semibold text-amber-400 font-en-num">
                      {formatToman(contract.financials.installmentProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">مبلغ کل توافق‌شده:</span>
                    <span className="font-bold text-emerald-400 font-en-num text-sm">
                      {formatToman(contract.financials.totalAgreedPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">پیش‌پرداخت نقدی:</span>
                    <span className="font-semibold text-zinc-200 font-en-num">
                      {formatToman(contract.financials.downPayment)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      ({contract.financials.downPaymentPaid ? 'وصول شده' : 'توافق‌شده'})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">مانده اقساط در جریان:</span>
                    <span className="font-bold text-sky-400 font-en-num text-sm">
                      {formatToman(contract.financials.remainingBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">بستانکاری تخصیص‌نیافته:</span>
                    <span className="font-semibold text-zinc-300 font-en-num">
                      {formatToman(contract.unappliedCredit || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancellation Notice if Cancelled */}
              {contract.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                    <Ban className="w-4 h-4" />
                    این قرارداد فسخ و باطل گردیده است
                  </div>
                  <p>دلیل فسخ: {contract.cancellationReason}</p>
                  <p className="text-[11px] text-red-400/70">
                    تاریخ فسخ: {toPersianDigits(contract.cancelledAt || '---')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* INSTALLMENTS TAB */}
          {activeTab === 'installments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">
                    جدول سررسید اقساط و ثبت پرداخت‌ها
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    تخصیص هوشمند مبالغ به قدیمی‌ترین قسط معوق ابتدا انجام می‌شود.
                  </p>
                </div>
                {contract.status !== 'cancelled' && contract.financials.remainingBalance > 0 && (
                  <button
                    onClick={() => setIsRegisterPaymentOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>ثبت وصول وجه / قسط جدید</span>
                  </button>
                )}
              </div>

              {/* Installments Table */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5 w-10">قسط</th>
                      <th className="p-2.5">تاریخ سررسید</th>
                      <th className="p-2.5">مبلغ قسط</th>
                      <th className="p-2.5">وصول‌شده</th>
                      <th className="p-2.5">مانده</th>
                      <th className="p-2.5">تضمین</th>
                      <th className="p-2.5">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {contract.installments.map((inst) => {
                      const remaining = Math.max(0, inst.amount - inst.paidAmount);
                      return (
                        <tr key={inst.id} className="hover:bg-zinc-900/30">
                          <td className="p-2.5 font-mono font-bold text-zinc-300">
                            {toPersianDigits(inst.installmentNumber)}
                          </td>
                          <td className="p-2.5 font-mono text-zinc-200">
                            {toPersianDigits(inst.dueDate)}
                          </td>
                          <td className="p-2.5 font-mono font-semibold text-zinc-100">
                            {formatToman(inst.amount)}
                          </td>
                          <td className="p-2.5 font-mono text-emerald-400">
                            {formatToman(inst.paidAmount)}
                          </td>
                          <td className="p-2.5 font-mono text-amber-400">
                            {formatToman(remaining)}
                          </td>
                          <td className="p-2.5 text-zinc-400">
                            {inst.chequeNumber ? (
                              <span className="font-mono">چک: {inst.chequeNumber}</span>
                            ) : (
                              'سفته / قرارداد'
                            )}
                          </td>
                          <td className="p-2.5">
                            {inst.status === 'paid' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                تسویه شده
                              </span>
                            )}
                            {inst.status === 'partial' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                پرداخت ناقص
                              </span>
                            )}
                            {inst.status === 'upcoming' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
                                در انتظار سررسید
                              </span>
                            )}
                            {inst.status === 'overdue' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/30">
                                معوق
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phase 09B: Direct vs. Indirect Transactions Audit Trail */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    تسویه‌های مستقیم خارج از صندوق (تراکنش‌های غیرمستقیم):
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                    Zero-Cash-Flow Audit
                  </span>
                </div>

                {contractIndirects.length > 0 ? (
                  <div className="space-y-2">
                    {contractIndirects.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300 font-mono">{tx.trackingNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                              تسویه بدون گردش صندوق
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-300 mt-1">
                            <span>پرداخت مستقیم از طرف <strong>{tx.payerName}</strong> به <strong>{tx.receiverName}</strong></span>
                          </div>
                          {tx.supportingDocument && (
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              مستند/سند: {tx.supportingDocument}
                            </span>
                          )}
                        </div>

                        <div className="text-left">
                          <span className="text-sm font-bold font-en-num text-amber-400 block">
                            {formatToman(tx.amount)}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {toPersianDigits(tx.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-500 text-center">
                    هیچ تراکنش غیرمستقیمی برای این قرارداد ثبت نشده و تمام پرداخت‌ها مستقیماً وارد صندوق/بانک شرکت شده است.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CLAUSES & NOTARY TAB */}
          {activeTab === 'clauses' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-200">ماده ۴: شرایط تحویل خودرو و مدارک</span>
                <p className="text-zinc-400 leading-relaxed">{contract.clauses.deliveryTerms}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-200">ماده ۵: انتقال سند رسمی در دفترخانه</span>
                <p className="text-zinc-400 leading-relaxed">{contract.clauses.ownershipTransfer}</p>
                <div className="pt-2 border-t border-zinc-800 text-zinc-300">
                  دفترخانه: {contract.notaryOffice || '---'} | تاریخ محضر: {toPersianDigits(contract.notaryDate || '---')}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-200">ماده ۶: خسارات تاخیر، شروط ضمن عقد و اسقاط خیارات</span>
                <p className="text-zinc-400 leading-relaxed">{contract.clauses.penaltiesAndDamages}</p>
              </div>
            </div>
          )}

          {/* VERSION HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200">سوابق اصلاحات و نسخه‌های قرارداد</h3>
              {(!contract.versionHistory || contract.versionHistory.length === 0) ? (
                <div className="p-6 text-center text-xs text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-950/40">
                  هیچ اصلاحیه‌ای تاکنون برای این قرارداد ثبت نشده و قرارداد در نسخه اولیه ۱.۰ قرار دارد.
                </div>
              ) : (
                <div className="space-y-2">
                  {contract.versionHistory.map((ver) => (
                    <div key={ver.versionNumber} className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-zinc-200">
                          نسخه {toPersianDigits(ver.versionNumber)}: {ver.changeSummary}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          توسط: {ver.savedBy} | زمان ثبت: {new Date(ver.savedAt).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                        ذخیره شده
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ATTACHMENTS TAB */}
          {activeTab === 'attachments' && (
            <div className="space-y-4 text-xs">
              <div className="p-6 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 text-zinc-400 space-y-2">
                <Paperclip className="w-6 h-6 mx-auto text-zinc-600" />
                <p>پیوست اسناد اسکن‌شده، برگه چک‌های صیادی و تصویر مبایعه‌نامه با امضای فیزیکی طرفین</p>
                <p className="text-[11px] text-zinc-500">پشتیبانی از فایل‌های تصویری و PDF تا حداکثر ۱۰ مگابایت</p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div>
            {contract.status !== 'cancelled' && (
              <button
                onClick={() => setIsCancelConfirmOpen(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>فسخ / ابطال قرارداد</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ مبایعه‌نامه</span>
            </button>
            {contract.status !== 'cancelled' && contract.financials.remainingBalance > 0 && (
              <button
                onClick={() => setIsRegisterPaymentOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>ثبت وصول وجه قسط</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Registration Modal */}
      <RegisterPaymentModal
        isOpen={isRegisterPaymentOpen}
        onClose={() => setIsRegisterPaymentOpen(false)}
        contract={contract}
      />

      {/* Printable Contract Modal */}
      <PrintableContractModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        contract={contract}
      />

      {/* Cancellation Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>تأیید فسخ / ابطال قرارداد</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              آیا از ابطال قرارداد شماره <span className="font-mono text-zinc-100 font-bold">{contract.contractNumber}</span> اطمینان دارید؟ سوابق این قرارداد در بایگانی جهت مراجعات قانونی محفوظ خواهد ماند.
            </p>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                علت فسخ قرارداد:
              </label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelConfirmOpen(false)}
                className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-lg cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
              >
                تأیید فسخ قرارداد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
