import React, { useState, useMemo } from 'react';
import { SmartContract, ContractStatus, ContractType } from '../types/contract';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  FileText,
  Search,
  Plus,
  CreditCard,
  Printer,
  Calendar,
  User,
  Car,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronDown,
  Filter,
  DollarSign,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { NewContractModal } from './NewContractModal';
import { ContractDetailDrawer } from './ContractDetailDrawer';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { PrintableContractModal } from './PrintableContractModal';

interface ContractsViewProps {
  onOpenCustomerProfile?: (customerId: string) => void;
  onOpenVehicleExpenses?: (vehicleId: string) => void;
}

type FilterTab = 'all' | 'sale' | 'purchase' | 'overdue' | 'signed' | 'draft_ready' | 'completed';

export const ContractsView: React.FC<ContractsViewProps> = ({
  onOpenCustomerProfile,
  onOpenVehicleExpenses,
}) => {
  const { contracts } = useAccounting();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');

  // Modal & Drawer States
  const [selectedContractIdForDrawer, setSelectedContractIdForDrawer] = useState<string | null>(null);
  const [contractForPayment, setContractForPayment] = useState<SmartContract | null>(null);
  const [contractForPrint, setContractForPrint] = useState<SmartContract | null>(null);
  const [isNewContractOpen, setIsNewContractOpen] = useState<boolean>(false);

  // High-level Metrics Calculation
  const metrics = useMemo(() => {
    let totalAgreed = 0;
    let totalProfit = 0;
    let totalCollected = 0;
    let totalRemaining = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    contracts.forEach((c) => {
      if (c.status !== 'cancelled') {
        totalAgreed += c.financials.totalAgreedPrice;
        totalProfit += c.financials.installmentProfit;
        totalCollected += c.financials.paidSoFar;
        totalRemaining += c.financials.remainingBalance;

        c.installments.forEach((inst) => {
          if (inst.status === 'overdue') {
            overdueCount++;
            overdueAmount += Math.max(0, inst.amount - inst.paidAmount);
          }
        });
      }
    });

    return {
      totalAgreed,
      totalProfit,
      totalCollected,
      totalRemaining,
      overdueCount,
      overdueAmount,
      activeCount: contracts.filter((c) => c.status !== 'cancelled').length,
    };
  }, [contracts]);

  // Filtered List
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        c.contractNumber.toLowerCase().includes(searchLower) ||
        c.vehicleLabel.toLowerCase().includes(searchLower) ||
        c.parties.buyer.name.toLowerCase().includes(searchLower) ||
        c.parties.seller.name.toLowerCase().includes(searchLower) ||
        (c.vehicleSnapshot.chassisNumber && c.vehicleSnapshot.chassisNumber.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Filter Tabs
      if (activeFilterTab === 'sale') return c.contractType === 'sale';
      if (activeFilterTab === 'purchase') return c.contractType === 'purchase';
      if (activeFilterTab === 'signed') return c.status === 'signed';
      if (activeFilterTab === 'draft_ready') return c.status === 'draft' || c.status === 'ready_to_sign';
      if (activeFilterTab === 'completed') return c.status === 'completed';
      if (activeFilterTab === 'overdue') {
        return c.installments.some((i) => i.status === 'overdue');
      }

      return true;
    });
  }, [contracts, searchTerm, activeFilterTab]);

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">پیش‌نویس</span>;
      case 'ready_to_sign':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">آماده امضا</span>;
      case 'signed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">امضا شده</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">تسویه کامل</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">فسخ شده</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      {/* Top Header & New Contract Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>قراردادها و مبایعه‌نامه‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            مدیریت هوشمند مبایعه‌نامه‌های فروش و خرید، تفکیک سود اقساطی، زمان‌بندی و وصول مطالبات
          </p>
        </div>

        <button
          onClick={() => setIsNewContractOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تنظیم قرارداد جدید</span>
        </button>
      </div>

      {/* Overdue Installments Warning Banner */}
      {metrics.overdueCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-zinc-900 border border-red-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-red-300 block">
                تعداد {toPersianDigits(metrics.overdueCount)} قسط سررسید گذشته با مجموع مبلغ {formatToman(metrics.overdueAmount)} تومان نیازمند پیگیری و وصول است.
              </span>
              <span className="text-[11px] text-zinc-400">
                جهت مشاهده، فیلتر «اقساط معوق» را انتخاب نموده یا نسبت به ثبت وصول اقدام فرمایید.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveFilterTab('overdue')}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
          >
            مشاهده معوقات
          </button>
        </div>
      )}

      {/* Metrics Cards Ribbon (Strict Financial Segregation) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Contractual Volume */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[11px] block mb-1">ارزش کل قراردادها:</span>
          <span className="text-sm sm:text-base font-bold text-zinc-100 font-en-num">
            {formatToman(metrics.totalAgreed)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">
            {toPersianDigits(metrics.activeCount)} معامله فعال
          </span>
        </div>

        {/* Actual Cash Collected */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[11px] block mb-1">کل وصولی‌های واقعی:</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400 font-en-num">
            {formatToman(metrics.totalCollected)}
          </span>
          <span className="text-[10px] text-emerald-500/80 block mt-1">
            ثبت‌شده در اسناد درآمد
          </span>
        </div>

        {/* Installment Profit (Segregated!) */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[11px] block mb-1">سود قراردادی اقساط:</span>
          <span className="text-sm sm:text-base font-bold text-amber-400 font-en-num">
            {formatToman(metrics.totalProfit)}
          </span>
          <span className="text-[10px] text-amber-500/80 block mt-1">
            مجزا از بهای تمام‌شده
          </span>
        </div>

        {/* Remaining Balance */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[11px] block mb-1">مانده اقساط در جریان:</span>
          <span className="text-sm sm:text-base font-bold text-sky-400 font-en-num">
            {formatToman(metrics.totalRemaining)}
          </span>
          <span className="text-[10px] text-sky-500/80 block mt-1">
            مطالبات آتی نمایشگاه
          </span>
        </div>

        {/* Overdue Total */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-md col-span-2 lg:col-span-1">
          <span className="text-zinc-500 text-[11px] block mb-1">اقساط معوق سررسیدشده:</span>
          <span className={`text-sm sm:text-base font-bold font-en-num ${metrics.overdueAmount > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
            {formatToman(metrics.overdueAmount)}
          </span>
          <span className="text-[10px] text-red-500/80 block mt-1">
            {toPersianDigits(metrics.overdueCount)} قسط بدون وصول
          </span>
        </div>
      </div>

      {/* Search and Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="جستجو با شماره قرارداد، خریدار، خودرو یا شماره شاسی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
          {[
            { id: 'all', label: 'همه قراردادها' },
            { id: 'sale', label: 'فروش' },
            { id: 'purchase', label: 'خرید' },
            { id: 'overdue', label: 'اقساط معوق' },
            { id: 'signed', label: 'امضا شده' },
            { id: 'draft_ready', label: 'پیش‌نویس / آماده' },
            { id: 'completed', label: 'خاتمه‌یافته' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeFilterTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid / Cards List */}
      {filteredContracts.length === 0 ? (
        <div className="p-12 text-center border border-zinc-800 rounded-2xl bg-zinc-900/40 space-y-3">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">هیچ قراردادی یافت نشد</h3>
          <p className="text-xs text-zinc-500">
            قراردادی مطابق با جستجو یا فیلتر جاری وجود ندارد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContracts.map((cnt) => {
            const isSale = cnt.contractType === 'sale';
            const totalInstCount = cnt.installments.length;
            const paidInstCount = cnt.installments.filter((i) => i.status === 'paid').length;
            const hasOverdue = cnt.installments.some((i) => i.status === 'overdue');
            const nextDueInst = cnt.installments.find((i) => i.status === 'overdue') ||
              cnt.installments.find((i) => i.status === 'partial') ||
              cnt.installments.find((i) => i.status === 'upcoming');

            return (
              <div
                key={cnt.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all hover:border-zinc-700 bg-zinc-900/70 shadow-lg ${
                  hasOverdue ? 'border-red-500/30' : 'border-zinc-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Identifiers, Vehicle, Parties */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                        {cnt.contractNumber}
                      </span>
                      {getStatusBadge(cnt.status)}
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-800 text-zinc-400 font-medium">
                        {isSale ? 'مبایعه‌نامه فروش' : 'قرارداد خرید'}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        تاریخ انعقاد: {toPersianDigits(cnt.contractDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-bold text-zinc-100">{cnt.vehicleLabel}</span>
                      <span className="text-xs font-mono text-zinc-400 font-en-num">
                        ({toPersianDigits(cnt.vehicleSnapshot.licensePlate || '---')})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <div>
                        <span>خریدار: </span>
                        <span className="font-semibold text-zinc-200">{cnt.parties.buyer.name}</span>
                      </div>
                      <span className="text-zinc-600">|</span>
                      <div>
                        <span>فروشنده: </span>
                        <span className="font-semibold text-zinc-200">{cnt.parties.seller.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Financial Breakdown (Segregated) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] mb-0.5">قیمت خودرو:</span>
                      <span className="font-semibold text-zinc-300 font-en-num">
                        {formatToman(cnt.financials.baseVehiclePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] mb-0.5">سود اقساط:</span>
                      <span className="font-semibold text-amber-400 font-en-num">
                        {formatToman(cnt.financials.installmentProfit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] mb-0.5">مبلغ کل توافق‌شده:</span>
                      <span className="font-bold text-emerald-400 font-en-num">
                        {formatToman(cnt.financials.totalAgreedPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] mb-0.5">مانده اقساط:</span>
                      <span className="font-bold text-sky-400 font-en-num">
                        {formatToman(cnt.financials.remainingBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Installment Progress & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0">
                    {totalInstCount > 0 && (
                      <div className="w-full sm:w-auto text-left lg:text-left text-xs">
                        <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-400 mb-1">
                          <span>پیشرفت اقساط:</span>
                          <span className="font-mono font-bold text-zinc-200">
                            {toPersianDigits(paidInstCount)} از {toPersianDigits(totalInstCount)} تسویه شده
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full sm:w-36 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${hasOverdue ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(paidInstCount / totalInstCount) * 100}%` }}
                          />
                        </div>
                        {nextDueInst && (
                          <div className="text-[10px] text-zinc-400 mt-1">
                            سررسید بعدی: <span className="font-mono text-zinc-300">{toPersianDigits(nextDueInst.dueDate)}</span>
                            {nextDueInst.status === 'overdue' && (
                              <span className="text-red-400 mr-1 font-bold">(معوق)</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setContractForPrint(cnt)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                        title="چاپ مبایعه‌نامه رسمی"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {cnt.status !== 'cancelled' && cnt.financials.remainingBalance > 0 && (
                        <button
                          onClick={() => setContractForPayment(cnt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>وصول قسط</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedContractIdForDrawer(cnt.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <span>مشاهده پرونده</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Contract Modal */}
      <NewContractModal
        isOpen={isNewContractOpen}
        onClose={() => setIsNewContractOpen(false)}
        onContractCreated={(newCnt) => {
          setSelectedContractIdForDrawer(newCnt.id);
        }}
      />

      {/* Contract Detail Drawer */}
      {selectedContractIdForDrawer && (
        <ContractDetailDrawer
          contractId={selectedContractIdForDrawer}
          onClose={() => setSelectedContractIdForDrawer(null)}
          onOpenCustomerProfile={onOpenCustomerProfile}
        />
      )}

      {/* Payment Allocation Modal */}
      <RegisterPaymentModal
        isOpen={!!contractForPayment}
        onClose={() => setContractForPayment(null)}
        contract={contractForPayment}
      />

      {/* Printable Contract Modal */}
      <PrintableContractModal
        isOpen={!!contractForPrint}
        onClose={() => setContractForPrint(null)}
        contract={contractForPrint}
      />
    </div>
  );
};
