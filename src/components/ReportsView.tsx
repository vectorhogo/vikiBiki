import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Expense, ExpenseCategory, PaymentSource } from '../types/accounting';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  BarChart3,
  Receipt,
  Wallet,
  Car,
  FileQuestion,
  Users,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowDownRight,
  Filter,
  Search,
  Printer,
  ChevronLeft,
  Edit,
  Eye,
  Paperclip,
} from 'lucide-react';
import { RecordReimbursementModal } from './RecordReimbursementModal';
import { EditExpenseModal } from './EditExpenseModal';
import { ExpenseDetailDrawer } from './ExpenseDetailDrawer';
import { OpeningDocumentModal } from './OpeningDocumentModal';
import { OpeningDocumentsListModal } from './OpeningDocumentsListModal';
import { Plus, FileText, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export type ReportType =
  | 'expenses'
  | 'personnel'
  | 'vehicles'
  | 'consignment'
  | 'commissions_rep'
  | 'investor_rep'
  | 'direct_indirect_rep'
  | 'accounts_ledger_rep'
  | 'investor_liab_rep'
  | 'contract_recon_rep'
  | 'categories'
  | 'payment_sources'
  | 'advances'
  | 'reimbursements'
  | 'receipts'
  | 'incomplete';

interface ReportsViewProps {
  initialReportType?: ReportType;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialReportType = 'expenses' }) => {
  const {
    expenses,
    cashAdvances,
    vehicles,
    personnel,
    personnelBalances,
    metrics,
    settlementRecords,
    archiveExpense,
    periods,
    activePeriodId,
    openingDocuments,
    consignmentAgreements,
    ownerSettlements,
    liveFinancialAccounts,
    accountTransfers,
    indirectTransactions,
    dealCommissions,
    investorProfiles,
    investorSummaries,
    contracts,
    incomes,
  } = useAccounting();

  const [activeReport, setActiveReport] = useState<ReportType>(initialReportType);
  const [reportPeriodId, setReportPeriodId] = useState<string>('current');

  // Modals state
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Expense | null>(null);
  const [reimbursingExpense, setReimbursingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isOpeningDocModalOpen, setIsOpeningDocModalOpen] = useState(false);
  const [isOpeningDocsListOpen, setIsOpeningDocsListOpen] = useState(false);

  // Filters for Expense Report
  const [expenseSearch, setExpenseSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterReceipt, setFilterReceipt] = useState<'all' | 'with' | 'without'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'month'>('all');

  // Selected period title for UI / print
  const selectedPeriodTitle = useMemo(() => {
    if (reportPeriodId === 'all') return 'همه دوره‌ها (تجمعی)';
    if (reportPeriodId === 'current') {
      const p = periods.find((x) => x.id === activePeriodId);
      return p ? `${p.title} (دوره فعلی)` : 'دوره فعلی';
    }
    const p = periods.find((x) => x.id === reportPeriodId);
    return p ? `${p.title} (بایگانی)` : 'دوره بایگانی‌شده';
  }, [reportPeriodId, periods, activePeriodId]);

  const activeExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.status !== 'active') return false;
      if (reportPeriodId === 'all') return true;
      const targetPeriod = reportPeriodId === 'current' ? activePeriodId : reportPeriodId;
      return !e.periodId || e.periodId === targetPeriod;
    });
  }, [expenses, reportPeriodId, activePeriodId]);

  // Total expense sum
  const totalExpenseSum = useMemo(() => {
    return activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [activeExpenses]);

  // 1. FILTERED EXPENSES FOR EXPENSE REPORT
  const filteredExpenses = useMemo(() => {
    return activeExpenses.filter((e) => {
      if (expenseSearch) {
        const q = expenseSearch.toLowerCase();
        const mDesc = e.description.toLowerCase().includes(q);
        const mPerson = e.personName.toLowerCase().includes(q);
        const mVehicle = e.vehicleLabel ? e.vehicleLabel.toLowerCase().includes(q) : false;
        const mCat = (e.category || '').toLowerCase().includes(q);
        if (!mDesc && !mPerson && !mVehicle && !mCat) return false;
      }
      if (filterPerson !== 'all' && e.personId !== filterPerson) return false;
      if (filterVehicle !== 'all') {
        if (filterVehicle === 'general' && e.vehicleId) return false;
        if (filterVehicle !== 'general' && e.vehicleId !== filterVehicle) return false;
      }
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterSource !== 'all') {
        const src = e.paymentSource || (e.cashAdvanceId ? 'advance' : 'company_direct');
        if (src !== filterSource) return false;
      }
      if (filterReceipt === 'with' && !e.hasReceipt) return false;
      if (filterReceipt === 'without' && e.hasReceipt) return false;
      if (filterDateRange === 'today' && e.date !== DEALERSHIP_CURRENT_DATE && e.date !== '1405/06/29') return false;
      if (filterDateRange === 'month' && !e.date.startsWith('1405/06')) return false;

      return true;
    });
  }, [
    activeExpenses,
    expenseSearch,
    filterPerson,
    filterVehicle,
    filterCategory,
    filterSource,
    filterReceipt,
    filterDateRange,
  ]);

  // 2. CATEGORY REPORT STATS
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    activeExpenses.forEach((e) => {
      const cat = e.category || 'دسته‌بندی نشده';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [activeExpenses]);

  // 3. VEHICLE REPORT STATS
  const vehicleStats = useMemo(() => {
    return vehicles.map((v) => {
      const vExpenses = activeExpenses.filter((e) => e.vehicleId === v.id);
      const totalCost = vExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Category breakdown for this vehicle
      const catBreakdown: Record<string, number> = {};
      vExpenses.forEach((e) => {
        const cat = e.category || 'سایر';
        catBreakdown[cat] = (catBreakdown[cat] || 0) + e.amount;
      });

      return {
        vehicle: v,
        totalCost,
        expenseCount: vExpenses.length,
        catBreakdown,
        expenses: vExpenses,
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  }, [vehicles, activeExpenses]);

  // General expenses not linked to any vehicle
  const generalExpenses = useMemo(() => {
    return activeExpenses.filter((e) => !e.vehicleId);
  }, [activeExpenses]);

  const generalExpenseTotal = useMemo(() => {
    return generalExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [generalExpenses]);

  // 4. PERSONNEL REPORT STATS
  const personnelStats = useMemo(() => {
    return personnelBalances.map((pb) => {
      const pExpenses = activeExpenses.filter((e) => e.personId === pb.personId);
      const totalAllExpenses = pExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        ...pb,
        totalAllExpenses,
        expenseCount: pExpenses.length,
      };
    });
  }, [personnelBalances, activeExpenses]);

  // 5. PAYMENT SOURCE REPORT STATS
  const paymentSourceStats = useMemo(() => {
    const stats: Record<PaymentSource, { count: number; total: number; label: string; desc: string }> = {
      advance: {
        count: 0,
        total: 0,
        label: 'تنخواه گردان پرسنل',
        desc: 'پرداخت شده از محل نقدینگی پیش‌پرداخت شده به پرسنل',
      },
      personal: {
        count: 0,
        total: 0,
        label: 'پرداخت شخصی پرسنل',
        desc: 'پرداخت شده از جیب کارمند که نمایشگاه باید به ایشان بازپرداخت نماید',
      },
      company_direct: {
        count: 0,
        total: 0,
        label: 'مستقیم حساب شرکت / نمایشگاه',
        desc: 'انتقال مستقیم از کارت‌خوان یا حساب بانکی نمایشگاه بدون درگیری تنخواه',
      },
      other: {
        count: 0,
        total: 0,
        label: 'سایر منابع مالی',
        desc: 'شرکا، حساب‌های موقت یا تهاتر',
      },
    };

    activeExpenses.forEach((e) => {
      const src = e.paymentSource || (e.cashAdvanceId ? 'advance' : 'company_direct');
      if (stats[src]) {
        stats[src].count += 1;
        stats[src].total += e.amount;
      }
    });

    return stats;
  }, [activeExpenses]);

  // 6. CASH ADVANCES & SETTLEMENTS
  const advanceReportData = useMemo(() => {
    return cashAdvances.map((adv) => {
      const linked = activeExpenses.filter(
        (e) => e.paymentSource === 'advance' && e.cashAdvanceId === adv.id
      );
      const spent = linked.reduce((sum, e) => sum + e.amount, 0);
      const remaining = Math.max(0, adv.amount - spent);
      const settlementsList = settlementRecords.filter((s) => s.advanceId === adv.id);
      return {
        advance: adv,
        spent,
        remaining,
        expenseCount: linked.length,
        settlements: settlementsList,
      };
    });
  }, [cashAdvances, activeExpenses, settlementRecords]);

  // 7. REIMBURSEMENTS REPORT (Personal Expenses)
  const personalExpenses = useMemo(() => {
    return activeExpenses.filter((e) => e.paymentSource === 'personal');
  }, [activeExpenses]);

  const pendingReimbursements = useMemo(() => {
    return personalExpenses.filter((e) => e.reimbursementStatus !== 'reimbursed');
  }, [personalExpenses]);

  const settledReimbursements = useMemo(() => {
    return personalExpenses.filter((e) => e.reimbursementStatus === 'reimbursed');
  }, [personalExpenses]);

  // 8. RECEIPTS COVERAGE REPORT
  const missingReceiptExpenses = useMemo(() => {
    return activeExpenses.filter((e) => !e.hasReceipt || e.receipts.length === 0);
  }, [activeExpenses]);

  const verifiedReceiptExpenses = useMemo(() => {
    return activeExpenses.filter((e) => e.hasReceipt && e.receipts.length > 0);
  }, [activeExpenses]);

  const missingReceiptSum = useMemo(() => {
    return missingReceiptExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [missingReceiptExpenses]);

  // 9. INCOMPLETE EXPENSES REPORT
  const incompleteExpenses = useMemo(() => {
    return activeExpenses.filter((e) => {
      const isMissingCategory = !e.category || e.category === 'دسته‌بندی نشده';
      const isMissingReceipt = !e.hasReceipt || e.receipts.length === 0;
      // Vehicle inspection or repairs without vehicleId
      const isVehicleCostWithoutVehicle =
        (e.category === 'کارشناسی' || e.category === 'تعمیر و سرویس' || e.category === 'شستشو و دیتیلینگ') &&
        !e.vehicleId;

      return isMissingCategory || isMissingReceipt || isVehicleCostWithoutVehicle;
    });
  }, [activeExpenses]);

  const reportTabs: { id: ReportType; label: string; count?: number; badgeColor?: string }[] = [
    { id: 'expenses', label: 'همه هزینه‌ها' },
    { id: 'personnel', label: 'گزارش پرسنل' },
    { id: 'vehicles', label: 'گزارش بهای خودروها' },
    {
      id: 'consignment',
      label: 'مالکیت و خودروهای امانی',
      count: vehicles.filter((v) => v.ownershipType === 'consignment').length,
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      id: 'commissions_rep',
      label: 'کمیسیون‌ها و کارمزد',
      count: dealCommissions.filter((c) => c.status !== 'settled').length,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'investor_rep',
      label: 'صورت‌حساب سرمایه‌گذاران',
      count: investorProfiles.length,
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'direct_indirect_rep',
      label: 'جریان وجوه مستقیم و غیرمستقیم',
      count: indirectTransactions.length,
      badgeColor: 'bg-sky-500/20 text-sky-300',
    },
    {
      id: 'accounts_ledger_rep',
      label: 'حساب‌های بانکی و صندوق‌ها',
      count: liveFinancialAccounts.length,
      badgeColor: 'bg-teal-500/20 text-teal-300',
    },
    {
      id: 'investor_liab_rep',
      label: 'تعهدات باز به سرمایه‌گذاران',
    },
    {
      id: 'contract_recon_rep',
      label: 'تطبیق مالی قراردادها',
      count: contracts.length,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    { id: 'categories', label: 'دسته‌بندی‌ها' },
    { id: 'payment_sources', label: 'منابع پرداخت' },
    { id: 'advances', label: 'تنخواه‌ها و تسویه' },
    {
      id: 'reimbursements',
      label: 'بازپرداخت پرسنل',
      count: pendingReimbursements.length,
      badgeColor: 'bg-sky-500/20 text-sky-300',
    },
    {
      id: 'receipts',
      label: 'پوشش رسیدها',
      count: missingReceiptExpenses.length,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'incomplete',
      label: 'هزینه‌های ناقص',
      count: incompleteExpenses.length,
      badgeColor: 'bg-rose-500/20 text-rose-300',
    },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto" dir="rtl">
      {/* Header & Overview */}
      <div className="bg-[#17181d] border border-[#26282e] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>مرکز گزارش‌های مالی و تحلیلی نمایشگاه</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            گزارش‌های دقیق هزینه‌ها، تفکیک تنخواه و هزینه‌های شخصی، وضعیت خودروها و کنترل اسناد
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Period Selector in Reports */}
          <div className="flex items-center gap-1.5 bg-[#121316] border border-[#2a2c35] rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">دوره گزارش:</span>
            <select
              value={reportPeriodId}
              onChange={(e) => setReportPeriodId(e.target.value)}
              aria-label="انتخاب دوره گزارش"
              className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="current" className="bg-[#17181d] text-zinc-200">
                دوره فعلی ({periods.find((p) => p.id === activePeriodId)?.title || 'جاری'})
              </option>
              {periods
                .filter((p) => p.id !== activePeriodId)
                .map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#17181d] text-zinc-300">
                    {p.title} (بایگانی‌شده)
                  </option>
                ))}
              <option value="all" className="bg-[#17181d] text-amber-300 font-bold">
                همه دوره‌ها (تجمعی)
              </option>
            </select>
          </div>

          <button
            onClick={() => setIsOpeningDocsListOpen(true)}
            className="px-2.5 py-1.5 bg-[#21232c] hover:bg-[#2c2f3b] text-zinc-300 border border-[#323644] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="مشاهده اسناد افتتاحیه دوره‌ها"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>اسناد افتتاحیه</span>
          </button>

          <button
            onClick={() => setIsOpeningDocModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ سند افتتاحیه</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#23262e] hover:bg-[#2d313c] text-zinc-300 border border-[#363945] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>چاپ / PDF</span>
          </button>
        </div>
      </div>

      {/* Period Notice Banner (Visible in Print & UI) */}
      <div className="p-3 bg-[#14151a] border border-[#282b35] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">محدوده زمانی و دوره گزارش:</span>
          <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            {selectedPeriodTitle}
          </span>
          {reportPeriodId !== 'all' && reportPeriodId !== 'current' && (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
              دوره بایگانی‌شده (فقط خواندنی)
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500 hidden sm:block">
          تاریخ صدور گزارش: {DEALERSHIP_CURRENT_DATE}
        </div>
      </div>

      {/* 4 Universal KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#17181d] border border-[#26282e]">
          <span className="text-[11px] text-zinc-400 block mb-1">مجموع کل هزینه‌ها</span>
          <span className="text-base sm:text-lg font-mono font-bold text-zinc-100">{formatToman(totalExpenseSum)}</span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">{toPersianDigits(activeExpenses.length)} فقره تراکنش</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17181d] border border-[#26282e]">
          <span className="text-[11px] text-zinc-400 block mb-1">مانده تنخواه در دست پرسنل</span>
          <span className="text-base sm:text-lg font-mono font-bold text-amber-400">{formatToman(metrics.totalActiveCashAdvance)}</span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">نقدینگی فعال تنخواه</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17181d] border border-[#26282e]">
          <span className="text-[11px] text-zinc-400 block mb-1">طلب پرسنل (پرداخت شخصی)</span>
          <span className="text-base sm:text-lg font-mono font-bold text-sky-400">{formatToman(metrics.pendingReimbursementAmount)}</span>
          <span className="text-[10px] text-sky-400/80 block mt-0.5">{toPersianDigits(metrics.pendingReimbursementCount)} هزینه در انتظار واریز</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#17181d] border border-[#26282e]">
          <span className="text-[11px] text-zinc-400 block mb-1">شاخص سلامت و پوشش مدارک</span>
          <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">{toPersianDigits(metrics.receiptCoveragePct)}٪</span>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">{toPersianDigits(metrics.missingReceiptCount)} فاکتور بدون رسید</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#252830] no-scrollbar">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeReport === tab.id
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'bg-[#18191e] hover:bg-[#22242a] text-zinc-300 border border-[#292c35]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeReport === tab.id ? 'bg-zinc-950 text-amber-400' : tab.badgeColor || 'bg-zinc-700 text-zinc-300'
                }`}
              >
                {toPersianDigits(tab.count)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL EXPENSES REPORT (WITH MULTI-FILTER) */}
      {activeReport === 'expenses' && (
        <div className="space-y-3">
          {/* Multi-Filter Toolbar */}
          <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="جستجو در شرح، شخص، خودرو..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full bg-[#131417] border border-[#2d3038] rounded-lg pr-9 pl-3 py-1.5 text-zinc-200 focus:outline-none"
                />
              </div>

              {/* Person Filter */}
              <select
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value)}
                className="bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
              >
                <option value="all">همه پرسنل</option>
                {personnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>

              {/* Vehicle Filter */}
              <select
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                className="bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
              >
                <option value="all">همه خودروها</option>
                <option value="general">فقط هزینه‌های عمومی (بدون خودرو)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({toPersianDigits(v.plate)})
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#131417] border border-[#2d3038] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none"
              >
                <option value="all">همه سرفصل‌ها</option>
                {categoryStats.map(([cat]) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#23252b]">
              <div className="flex flex-wrap items-center gap-2">
                {/* Source Filter */}
                <span className="text-zinc-400 text-[11px]">منبع پرداخت:</span>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="bg-[#131417] border border-[#2d3038] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none text-xs"
                >
                  <option value="all">همه منابع</option>
                  <option value="advance">تنخواه</option>
                  <option value="personal">شخصی</option>
                  <option value="company_direct">مستقیم شرکت</option>
                  <option value="other">سایر</option>
                </select>

                {/* Receipt Filter */}
                <span className="text-zinc-400 text-[11px] mr-2">وضعیت رسید:</span>
                <select
                  value={filterReceipt}
                  onChange={(e) => setFilterReceipt(e.target.value as any)}
                  className="bg-[#131417] border border-[#2d3038] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none text-xs"
                >
                  <option value="all">همه</option>
                  <option value="with">دارای رسید</option>
                  <option value="without">بدون رسید</option>
                </select>

                {/* Date Filter */}
                <span className="text-zinc-400 text-[11px] mr-2">بازه زمانی:</span>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value as any)}
                  className="bg-[#131417] border border-[#2d3038] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none text-xs"
                >
                  <option value="all">کل دوره</option>
                  <option value="today">امروز</option>
                  <option value="month">ماه جاری (شهریور)</option>
                </select>
              </div>

              <div className="text-zinc-400 text-[11px]">
                نتایج: <span className="text-zinc-200 font-bold">{toPersianDigits(filteredExpenses.length)}</span> ردیف |
                مجموع: <span className="text-amber-400 font-bold font-mono">
                  {formatToman(filteredExpenses.reduce((s: number, e) => s + e.amount, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e]">
                  <tr>
                    <th className="py-2.5 px-3">تاریخ</th>
                    <th className="py-2.5 px-3">شرح</th>
                    <th className="py-2.5 px-3">سرفصل</th>
                    <th className="py-2.5 px-3">پرسنل</th>
                    <th className="py-2.5 px-3">خودرو</th>
                    <th className="py-2.5 px-3">منبع پرداخت</th>
                    <th className="py-2.5 px-3 text-left">مبلغ (تومان)</th>
                    <th className="py-2.5 px-3 text-center">رسید</th>
                    <th className="py-2.5 px-3 text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22242a]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        موردی با این فیلترها یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#1f2128]/70">
                        <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                          {toPersianDigits(exp.date)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-200 max-w-[200px] truncate">
                          {exp.description}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-300">
                          {exp.category || 'دسته‌بندی نشده'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-300">{exp.personName}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400">
                          {exp.vehicleLabel || 'عمومی'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {exp.paymentSource === 'advance' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                              تنخواه
                            </span>
                          )}
                          {exp.paymentSource === 'personal' && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]">
                              شخصی ({exp.reimbursementStatus === 'reimbursed' ? 'تسویه' : 'طلب'})
                            </span>
                          )}
                          {exp.paymentSource === 'company_direct' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                              شرکت
                            </span>
                          )}
                          {exp.paymentSource === 'other' && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">سایر</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-amber-400 whitespace-nowrap">
                          {formatToman(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {exp.hasReceipt && exp.receipts.length > 0 ? (
                            <span className="text-emerald-400">✓</span>
                          ) : (
                            <span className="text-amber-400 font-bold">!</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingExpense(exp)}
                              className="p-1 text-zinc-400 hover:text-amber-400 rounded hover:bg-[#252830]"
                              title="ویرایش و تکمیل"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setSelectedExpenseForDetail(exp)}
                              className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-[#252830]"
                              title="مشاهده"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONNEL REPORT */}
      {activeReport === 'personnel' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl text-xs text-zinc-400">
            گزارش عملکرد مالی پرسنل، وضعیت تنخواه‌های دریافتی، نقدینگی باقیمانده نزد ایشان و طلب پرسنل بابت هزینه‌های شخصی:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {personnelStats.map((p) => (
              <div
                key={p.personId}
                className="bg-[#17181d] border border-[#26282e] rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#23252b]">
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">{p.personName}</h3>
                      <span className="text-[11px] text-zinc-400">{p.role}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {p.personName.slice(0, 1)}
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">کل تنخواه‌های دریافتی:</span>
                      <span className="font-mono text-zinc-200 font-semibold">{formatToman(p.totalAdvanced)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">هزینه‌کرد از تنخواه:</span>
                      <span className="font-mono text-rose-400 font-semibold">-{formatToman(p.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#23252b]">
                      <span className="text-zinc-300 font-medium">موجودی باقیمانده تنخواه:</span>
                      <span className="font-mono text-amber-400 font-bold">{formatToman(p.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#23252b]">
                      <span className="text-sky-400">طلب از شرکت (هزینه شخصی):</span>
                      <span className="font-mono text-sky-400 font-bold">{formatToman(p.needsReimbursementTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#23252b] text-[11px] text-zinc-500 flex justify-between">
                  <span>تعداد کل هزینه‌های منتسب:</span>
                  <span className="font-mono text-zinc-300 font-semibold">{toPersianDigits(p.expenseCount)} فقره</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE REPORT */}
      {activeReport === 'vehicles' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              پرونده مالی خودروهای نمایشگاه (کارشناسی، سرویس، حمل، شستشو، کمیسیون و...)
            </span>
            <span className="text-zinc-300 font-mono">
              هزینه‌های عمومی بدون خودرو:{' '}
              <strong className="text-amber-400">{formatToman(generalExpenseTotal)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicleStats.map((item) => (
              <div
                key={item.vehicle.id}
                className="bg-[#17181d] border border-[#26282e] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#23252b]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 text-xs sm:text-sm">{item.vehicle.fullName}</h3>
                      <span className="text-[11px] text-zinc-400 font-mono">{toPersianDigits(item.vehicle.plate)}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block">مجموع هزینه‌ها</span>
                    <span className="text-sm sm:text-base font-mono font-bold text-amber-400">
                      {formatToman(item.totalCost)}
                    </span>
                  </div>
                </div>

                {/* Categories breakdown */}
                <div>
                  <div className="text-[11px] text-zinc-400 mb-1.5">تفکیک سرفصل‌های هزینه:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {Object.entries(item.catBreakdown).length === 0 ? (
                      <span className="text-zinc-500 col-span-2 text-[11px]">بدون ثبت هزینه</span>
                    ) : (
                      Object.entries(item.catBreakdown).map(([cat, amount]) => (
                        <div key={cat} className="p-1.5 bg-[#131417] rounded border border-[#24262d] flex justify-between">
                          <span className="text-zinc-400">{cat}:</span>
                          <span className="font-mono text-zinc-200 font-semibold">{formatToman(amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#23252b] text-[11px] text-zinc-500 flex justify-between">
                  <span>وضعیت خودرو: {item.vehicle.status === 'active' ? 'موجود در نمایشگاه' : 'فروخته شده'}</span>
                  <span className="font-mono text-zinc-400">{toPersianDigits(item.expenseCount)} ردیف هزینه</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CONSIGNMENT & OWNERSHIP REPORT (Phase 08) */}
      {activeReport === 'consignment' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-[#161722] to-[#121319] border border-indigo-500/30 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-100">
                  تفکیک مالی خودروهای نمایشگاه در برابر خودروهای امانی
                </h3>
              </div>
              <div className="text-xs text-zinc-400">
                عدم تداخل گردش مالی: کمیسیون و سهم نمایشگاه از تسویه مالک کاملاً مجزا محاسبه می‌گردد.
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#111218] border border-[#232535] rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">خودروهای تحت تملک نمایشگاه</span>
                <span className="font-bold text-sm text-amber-400 font-mono">
                  {toPersianDigits(vehicles.filter((v) => (v.ownershipType || 'owned') === 'owned').length)} دستگاه
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">سود/زیان بر اساس بهای تمام‌شده</span>
              </div>

              <div className="p-3 bg-[#111218] border border-[#232535] rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">خودروهای امانی (مالک دیگر)</span>
                <span className="font-bold text-sm text-indigo-400 font-mono">
                  {toPersianDigits(vehicles.filter((v) => v.ownershipType === 'consignment').length)} دستگاه
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">درآمد از محل حق کمیسیون</span>
              </div>

              <div className="p-3 bg-[#111218] border border-[#232535] rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">مجموع کمیسیون‌های شناسایی‌شده</span>
                <span className="font-bold text-sm text-emerald-400 font-mono">
                  {formatToman(
                    ownerSettlements.reduce((sum, s) => sum + s.dealershipCommission, 0)
                  )}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">درآمد واقعی نمایشگاه از امانی</span>
              </div>

              <div className="p-3 bg-[#111218] border border-[#232535] rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">مانده بدهی به مالکان خودروها</span>
                <span className="font-bold text-sm text-rose-400 font-mono">
                  {formatToman(
                    ownerSettlements.reduce((sum, s) => sum + s.remainingAmount, 0)
                  )}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">تعهد تسویه با مالکان</span>
              </div>
            </div>
          </div>

          {/* Consignment Settlements Table */}
          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-[#23252b] pb-2">
              <h4 className="text-xs font-bold text-zinc-200">
                گزارش تسویه‌حساب معاملات امانی با مالکان (تفکیک بهای فروش، سهم مالک و کمیسیون نمایشگاه):
              </h4>
              <span className="text-[11px] font-mono text-zinc-400">
                {toPersianDigits(ownerSettlements.length)} پرونده تسویه
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e]">
                  <tr>
                    <th className="py-2.5 px-3">خودرو</th>
                    <th className="py-2.5 px-3">مالک</th>
                    <th className="py-2.5 px-3">مبلغ ناخالص فروش</th>
                    <th className="py-2.5 px-3">هزینه‌های کسرشده مالک</th>
                    <th className="py-2.5 px-3">کمیسیون نمایشگاه</th>
                    <th className="py-2.5 px-3">سهم قابل تسویه مالک</th>
                    <th className="py-2.5 px-3">واریزشده</th>
                    <th className="py-2.5 px-3">مانده تسویه</th>
                    <th className="py-2.5 px-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22242a]">
                  {ownerSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        هنوز تسویه‌حسابی برای خودروهای امانی در سیستم صادر نشده است.
                      </td>
                    </tr>
                  ) : (
                    ownerSettlements.map((s) => (
                      <tr key={s.id} className="hover:bg-[#1a1b22] transition-colors">
                        <td className="py-2.5 px-3 font-medium text-zinc-200">
                          {s.vehicleFullName}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300">
                          {s.ownerName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-100 font-semibold">
                          {formatToman(s.grossSaleAmount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-300">
                          {formatToman(s.deductibleExpenseAmount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                          {formatToman(s.dealershipCommission)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-indigo-300 font-bold">
                          {formatToman(s.netPayableToOwner)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-300">
                          {formatToman(s.paidAmount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {formatToman(s.remainingAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.status === 'fully_settled'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : s.status === 'partially_settled'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {s.status === 'fully_settled' && 'تسویه کامل'}
                            {s.status === 'partially_settled' && 'تسویه ناقص'}
                            {s.status === 'unsettled' && 'تسویه نشده'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORY REPORT */}
      {activeReport === 'categories' && (
        <div className="bg-[#17181d] border border-[#26282e] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#23252b]">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">تحلیل هزینه‌ها بر اساس سرفصل (دسته‌بندی)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">درصد سهم هر رسته هزینه از کل مخارج نمایشگاه</p>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              کل مخارج: <strong className="text-amber-400">{formatToman(totalExpenseSum)}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {categoryStats.map(([cat, data]) => {
              const pct = totalExpenseSum > 0 ? Math.round((data.total / totalExpenseSum) * 100) : 0;
              const avg = data.count > 0 ? Math.round(data.total / data.count) : 0;

              return (
                <div key={cat} className="p-3 bg-[#131417] border border-[#252830] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100">{cat}</span>
                      <span className="text-zinc-500 text-[11px] font-mono">
                        ({toPersianDigits(data.count)} فقره • میانگین: {formatToman(avg)})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400">{formatToman(data.total)}</span>
                      <span className="text-xs font-mono font-bold text-zinc-300 w-10 text-left">
                        {toPersianDigits(pct)}٪
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#202228] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENT SOURCE REPORT */}
      {activeReport === 'payment_sources' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl text-xs text-zinc-400">
            بررسی ترکیب منابع تأمین مالی هزینه‌های نمایشگاه (تنخواه، پرداخت شخصی کارمندان، حساب مستقیم نمایشگاه):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(paymentSourceStats).map(([key, item]) => {
              const pct = totalExpenseSum > 0 ? Math.round((item.total / totalExpenseSum) * 100) : 0;

              return (
                <div key={key} className="bg-[#17181d] border border-[#26282e] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#23252b]">
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">{item.label}</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-lg font-mono font-bold text-amber-400">{formatToman(item.total)}</span>
                      <span className="text-xs text-zinc-400 block">{toPersianDigits(pct)}٪ کل هزینه‌ها</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#202228] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        key === 'personal'
                          ? 'bg-sky-400'
                          : key === 'advance'
                          ? 'bg-amber-400'
                          : key === 'company_direct'
                          ? 'bg-emerald-400'
                          : 'bg-zinc-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                    <span>تعداد تراکنش‌های ثبت‌شده:</span>
                    <span className="font-mono font-semibold text-zinc-200">{toPersianDigits(item.count)} فقره</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: CASH ADVANCES & SETTLEMENTS REPORT */}
      {activeReport === 'advances' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl text-xs text-zinc-400">
            فهرست کلیه تنخواه‌های تخصیص‌یافته، مبالغ کسرشده، باقیمانده و تاریخچه تسویه‌ها (مطابق قانون عدم تغییر مبالغ اولیه):
          </div>

          <div className="space-y-3">
            {advanceReportData.map((item) => (
              <div key={item.advance.id} className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#23252b]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">{item.advance.personName}</h3>
                      <span className="text-[11px] text-zinc-400">
                        {item.advance.reason} • تاریخ اعطا: {toPersianDigits(item.advance.date)}
                      </span>
                    </div>
                  </div>

                  <div>
                    {item.advance.status === 'settled' ? (
                      <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                        تسویه شده قطعی
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                        فعال (در جریان)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-[#131417] rounded-lg border border-[#24262d]">
                    <span className="text-zinc-400 block text-[11px]">مبلغ اعطا شده:</span>
                    <span className="font-mono font-bold text-zinc-200">{formatToman(item.advance.amount)}</span>
                  </div>
                  <div className="p-2.5 bg-[#131417] rounded-lg border border-[#24262d]">
                    <span className="text-zinc-400 block text-[11px]">هزینه‌کرد از این تنخواه:</span>
                    <span className="font-mono font-bold text-rose-400">-{formatToman(item.spent)}</span>
                  </div>
                  <div className="p-2.5 bg-[#131417] rounded-lg border border-[#24262d]">
                    <span className="text-zinc-400 block text-[11px]">مانده نقدینگی نزد پرسنل:</span>
                    <span className="font-mono font-bold text-amber-400">{formatToman(item.remaining)}</span>
                  </div>
                </div>

                {/* Settlement history snapshot if any */}
                {item.settlements.length > 0 && (
                  <div className="pt-2 border-t border-[#23252b] space-y-1.5 text-[11px]">
                    <div className="text-zinc-400 font-semibold">سوابق ثبت تسویه رسمی:</div>
                    {item.settlements.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded bg-[#131417] border border-emerald-500/20 text-zinc-300 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <span>تاریخ تسویه: <strong>{toPersianDigits(s.settledAt)}</strong></span>
                          <span className="mr-3">مبلغ عودت: <strong>{formatToman(s.actualReturn)}</strong></span>
                          {s.difference !== 0 && (
                            <span className="mr-3 text-amber-400">
                              (اختلاف: {formatToman(s.difference)} {s.differenceReason ? `- ${s.differenceReason}` : ''})
                            </span>
                          )}
                        </div>
                        {s.notes && <span className="text-zinc-400">{s.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: REIMBURSEMENTS REPORT */}
      {activeReport === 'reimbursements' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-[#17181d] border border-sky-500/20 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-sky-300 block">گزارش بازپرداخت هزینه‌های شخصی پرسنل:</span>
              <span className="text-zinc-400 text-[11px]">
                هزینه‌هایی که کارمندان بدون تنخواه یا با کارت شخصی خود پرداخت کرده‌اند و مستحق دریافت وجه هستند.
              </span>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-zinc-400 block">کل طلب پرسنل</span>
              <span className="text-base font-mono font-bold text-sky-400">{formatToman(metrics.pendingReimbursementAmount)}</span>
            </div>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e]">
                  <tr>
                    <th className="py-3 px-4">تاریخ ثبت</th>
                    <th className="py-3 px-4">پرسنل پرداخت‌کننده</th>
                    <th className="py-3 px-4">شرح هزینه</th>
                    <th className="py-3 px-4">خودرو</th>
                    <th className="py-3 px-4 text-left">مبلغ هزینه</th>
                    <th className="py-3 px-4 text-center">وضعیت تسویه</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22242a]">
                  {personalExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        هیچ هزینه شخصی ثبت نشده است
                      </td>
                    </tr>
                  ) : (
                    personalExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#1f2128]/70">
                        <td className="py-3 px-4 font-mono text-zinc-400">{toPersianDigits(exp.date)}</td>
                        <td className="py-3 px-4 font-bold text-zinc-200">{exp.personName}</td>
                        <td className="py-3 px-4 text-zinc-300">{exp.description}</td>
                        <td className="py-3 px-4 text-zinc-400">{exp.vehicleLabel || 'عمومی'}</td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-sky-400">
                          {formatToman(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {exp.reimbursementStatus === 'reimbursed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تسویه شد ({toPersianDigits(exp.reimbursementDate || '')})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                              <AlertCircle className="w-3 h-3" />
                              <span>نیازمند بازپرداخت</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {exp.reimbursementStatus !== 'reimbursed' ? (
                            <button
                              onClick={() => setReimbursingExpense(exp)}
                              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded text-xs transition-colors cursor-pointer"
                            >
                              ثبت بازپرداخت
                            </button>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RECEIPTS REPORT */}
      {activeReport === 'receipts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl">
              <span className="text-zinc-400 text-[11px] block">پوشش مدارک و فاکتورها:</span>
              <span className="text-lg font-mono font-bold text-emerald-400">{toPersianDigits(metrics.receiptCoveragePct)}٪</span>
            </div>
            <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl">
              <span className="text-zinc-400 text-[11px] block">تعداد هزینه‌های بدون رسید:</span>
              <span className="text-lg font-mono font-bold text-amber-400">{toPersianDigits(missingReceiptExpenses.length)} فقره</span>
            </div>
            <div className="p-3 bg-[#17181d] border border-[#26282e] rounded-xl">
              <span className="text-zinc-400 text-[11px] block">مجموع مبلغ هزینه‌های بدون مدرک:</span>
              <span className="text-lg font-mono font-bold text-rose-400">{formatToman(missingReceiptSum)}</span>
            </div>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-200 mb-3">فهرست هزینه‌های نیازمند پیگیری و تحویل فاکتور:</h3>

            <div className="divide-y divide-[#22242a]">
              {missingReceiptExpenses.length === 0 ? (
                <div className="text-center py-6 text-emerald-400 text-xs">
                  تمامی هزینه‌ها دارای مدارک و فاکتور معتبر هستند
                </div>
              ) : (
                missingReceiptExpenses.map((exp) => (
                  <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-zinc-200">{exp.description}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {exp.personName} • {exp.category} • {toPersianDigits(exp.date)}
                        {exp.vehicleLabel && ` • خودرو: ${exp.vehicleLabel}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400">{formatToman(exp.amount)}</span>
                      <button
                        onClick={() => setSelectedExpenseForDetail(exp)}
                        className="px-2.5 py-1 rounded bg-[#23262e] hover:bg-[#2c303a] text-zinc-200 border border-[#353945] text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3 text-amber-400" />
                        <span>افزودن رسید</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: INCOMPLETE EXPENSES REPORT */}
      {activeReport === 'incomplete' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-[#17181d] border border-rose-500/20 rounded-xl text-xs text-zinc-400">
            هزینه‌هایی که اطلاعات ناقص دارند (فاقد دسته‌بندی مشخص، بدون فاکتور، یا هزینه خودرویی بدون انتخاب خودرو).
            کاربر می‌تواند مستقیماً با زدن دکمه «تکمیل اطلاعات» آن‌ها را تکمیل نماید.
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#22242a]">
              {incompleteExpenses.length === 0 ? (
                <div className="text-center py-8 text-emerald-400 text-xs font-semibold">
                  هیچ هزینه ناقصی در سیستم وجود ندارد. تمامی رکوردها کامل هستند.
                </div>
              ) : (
                incompleteExpenses.map((exp) => {
                  const missingParts: string[] = [];
                  if (!exp.category || exp.category === 'دسته‌بندی نشده') missingParts.push('فاقد دسته‌بندی');
                  if (!exp.hasReceipt || exp.receipts.length === 0) missingParts.push('بدون رسید');
                  if (!exp.vehicleId && (exp.category === 'کارشناسی' || exp.category === 'تعمیر و سرویس')) {
                    missingParts.push('عدم انتساب به خودرو');
                  }

                  return (
                    <div key={exp.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#1c1e24]/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{exp.description}</span>
                          <span className="font-mono text-zinc-500 text-[11px]">{toPersianDigits(exp.date)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-zinc-400">ثبت‌شده توسط: {exp.personName}</span>
                          <span className="text-zinc-600">•</span>
                          {missingParts.map((part, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px]">
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-400 text-sm">{formatToman(exp.amount)}</span>
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تکمیل اطلاعات</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. COMMISSIONS REPORT */}
      {activeReport === 'commissions_rep' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">گزارش کمیسیون‌ها و کارمزد معاملات</h3>
              <p className="text-xs text-zinc-400 mt-0.5">تفکیک سهم خریدار و فروشنده، مبالغ وصول‌شده و مانده معوق</p>
            </div>
            <div className="text-xs text-zinc-300 font-mono font-bold">
              {toPersianDigits(dealCommissions.length)} پرونده
            </div>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121316] text-zinc-400 border-b border-[#26282e]">
                <tr>
                  <th className="py-3 px-4">خودرو / معامله</th>
                  <th className="py-3 px-4">شماره قرارداد</th>
                  <th className="py-3 px-4">کمیسیون توافقی</th>
                  <th className="py-3 px-4">سهم خریدار</th>
                  <th className="py-3 px-4">سهم فروشنده</th>
                  <th className="py-3 px-4">وصول‌شده (درآمد)</th>
                  <th className="py-3 px-4">مانده معوق</th>
                  <th className="py-3 px-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26282e]">
                {dealCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-zinc-200">{c.vehicleLabel}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{c.contractNumber || '—'}</td>
                    <td className="py-3 px-4 font-en-num font-bold text-white">{formatToman(c.totalAgreedCommission)}</td>
                    <td className="py-3 px-4 font-en-num text-zinc-300">{formatToman(c.buyerShare)}</td>
                    <td className="py-3 px-4 font-en-num text-zinc-300">{formatToman(c.sellerShare)}</td>
                    <td className="py-3 px-4 font-en-num font-bold text-emerald-400">{formatToman(c.receivedAmount)}</td>
                    <td className="py-3 px-4 font-en-num font-bold text-amber-400">{formatToman(c.outstandingAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'settled'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.status === 'partially_paid'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {c.status === 'settled' ? 'تسویه کامل' : c.status === 'partially_paid' ? 'وصول جزئی' : 'معوق'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. INVESTOR STATEMENT REPORT */}
      {activeReport === 'investor_rep' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">صورت‌حساب و بیلان عملکرد سرمایه‌گذاران</h3>
              <p className="text-xs text-zinc-400 mt-0.5">تفکیک اصل سرمایه تأمینی، سودهای محقق‌شده و مبالغ تسویه‌شده</p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              Investor Ledger
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investorSummaries.map((inv) => (
              <div key={inv.investorId} className="p-4 rounded-xl bg-[#17181d] border border-[#26282e] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#26282e] pb-2.5">
                  <span className="font-bold text-zinc-100 text-sm">{inv.investorName}</span>
                  <span className="font-mono text-zinc-400">{toPersianDigits(inv.phone)}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-zinc-300">
                    <span>اصل سرمایه تأمین‌شده:</span>
                    <span className="font-bold font-en-num text-white">{formatToman(inv.totalContributedCapital)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>سرمایه فعال در گردش خودروها:</span>
                    <span className="font-en-num text-sky-300">{formatToman(inv.activeAllocatedCapital)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>سرمایه آزاد (آماده به‌کار):</span>
                    <span className="font-en-num text-teal-300">{formatToman(inv.unallocatedCapital)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300 pt-1.5 border-t border-[#26282e]">
                    <span>کل سود محقق‌شده از معاملات:</span>
                    <span className="font-bold font-en-num text-emerald-400">+{formatToman(inv.totalRealizedProfit)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>سود پرداخت‌شده به سرمایه‌گذار:</span>
                    <span className="font-en-num text-rose-300">-{formatToman(inv.totalProfitSettled)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>اصل سرمایه عودت‌داده‌شده:</span>
                    <span className="font-en-num text-rose-300">-{formatToman(inv.totalCapitalRepaid)}</span>
                  </div>
                  <div className="flex justify-between text-amber-300 pt-1.5 border-t border-[#26282e] font-bold">
                    <span>سود معوق در انتظار تسویه:</span>
                    <span className="font-en-num">{formatToman(inv.unsettledProfit)}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex justify-between items-center font-bold">
                  <span className="text-zinc-200">مانده کل تعهد نمایشگاه:</span>
                  <span className="font-en-num text-emerald-400 text-sm">{formatToman(inv.currentDealershipLiability)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DIRECT VS. INDIRECT FLOW REPORT */}
      {activeReport === 'direct_indirect_rep' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">گزارش جریان وجوه مستقیم و غیرمستقیم</h3>
              <p className="text-xs text-zinc-400 mt-0.5">تفکیک گردش نقدینگی صندوق شرکت از تسویه‌های مستقیم بین خریدار و فروشنده (Zero-Cash-Flow)</p>
            </div>
            <span className="text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
              Cash vs. Zero-Flow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 space-y-2 text-xs">
              <span className="text-emerald-400 font-bold block text-sm">گردش مستقیم (صندوق و بانک‌های شرکت):</span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                تمام دریافت‌های بیعانه، وصول اقساط مستقیم، کارمزدها و هزینه‌های جاری که از مجرای حساب‌های بانکی، پوز یا صندوق نمایشگاه عبور کرده‌اند.
              </p>
              <div className="pt-2 border-t border-emerald-500/20 flex justify-between font-bold">
                <span className="text-zinc-300">مجموع درآمدهای وصولی:</span>
                <span className="font-en-num text-emerald-300">
                  {formatToman(incomes.reduce((s, i) => s + i.amount, 0))}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-500/20 space-y-2 text-xs">
              <span className="text-amber-400 font-bold block text-sm">گردش غیرمستقیم (تسویه خارج از صندوق):</span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                مبالغی که خریدار مستقیماً به حساب فروشنده/مالک خودرو واریز نموده و در تعهدات قرارداد لحاظ شده ولی وارد نقدینگی شرکت نشده است.
              </p>
              <div className="pt-2 border-t border-amber-500/20 flex justify-between font-bold">
                <span className="text-zinc-300">مجموع تسویه‌های غیرمستقیم:</span>
                <span className="font-en-num text-amber-300">
                  {formatToman(indirectTransactions.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <div className="p-3 bg-[#121316] border-b border-[#26282e] font-bold text-xs text-zinc-300">
              ریز تراکنش‌های غیرمستقیم ثبت‌شده در سیستم
            </div>
            <table className="w-full text-right text-xs">
              <thead className="bg-[#14151a] text-zinc-400 border-b border-[#26282e]">
                <tr>
                  <th className="py-2.5 px-4">کد رهگیری</th>
                  <th className="py-2.5 px-4">تاریخ</th>
                  <th className="py-2.5 px-4">پرداخت‌کننده</th>
                  <th className="py-2.5 px-4">دریافت‌کننده</th>
                  <th className="py-2.5 px-4">خودرو / قرارداد</th>
                  <th className="py-2.5 px-4">مبلغ تسویه</th>
                  <th className="py-2.5 px-4">سند و مدرک</th>
                  <th className="py-2.5 px-4">نشان مالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26282e]">
                {indirectTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{tx.trackingNumber}</td>
                    <td className="py-3 px-4 font-mono text-zinc-300">{toPersianDigits(tx.date)}</td>
                    <td className="py-3 px-4 text-zinc-200">{tx.payerName}</td>
                    <td className="py-3 px-4 text-zinc-200">{tx.receiverName}</td>
                    <td className="py-3 px-4 text-zinc-300">{tx.vehicleLabel || tx.contractNumber || '—'}</td>
                    <td className="py-3 px-4 font-bold font-en-num text-amber-300">{formatToman(tx.amount)}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{tx.supportingDocument || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                        Zero-Cash-Flow
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. BANK & CASH ACCOUNTS LEDGER */}
      {activeReport === 'accounts_ledger_rep' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">دفتر معین حساب‌های بانکی و صندوق‌ها</h3>
              <p className="text-xs text-zinc-400 mt-0.5">مانده اولیه، گردش ورودی و خروجی، انتقال‌های بین‌حسابی و موجودی لحظه‌ای</p>
            </div>
            <span className="text-xs bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded font-mono">
              Accounts Balance
            </span>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121316] text-zinc-400 border-b border-[#26282e]">
                <tr>
                  <th className="py-3 px-4">عنوان حساب / صندوق</th>
                  <th className="py-3 px-4">نوع</th>
                  <th className="py-3 px-4">شماره حساب / پایانه</th>
                  <th className="py-3 px-4">شماره شبا</th>
                  <th className="py-3 px-4">مانده افتتاحیه</th>
                  <th className="py-3 px-4">موجودی لحظه‌ای</th>
                  <th className="py-3 px-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26282e]">
                {liveFinancialAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-zinc-100">{acc.name}</td>
                    <td className="py-3 px-4 text-zinc-400">
                      {acc.type === 'bank' ? 'بانکی' : acc.type === 'cash' ? 'صندوق نقد' : acc.type === 'pos' ? 'کارت‌خوان' : 'کارت شرکت'}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">{acc.accountNumber || '—'}</td>
                    <td className="py-3 px-4 font-mono text-sky-400 text-[11px] truncate max-w-[160px]">{acc.shabaNumber || '—'}</td>
                    <td className="py-3 px-4 font-en-num text-zinc-400">{formatToman(acc.openingBalance)}</td>
                    <td className="py-3 px-4 font-en-num font-bold text-emerald-400 text-sm">{formatToman(acc.currentBalance || 0)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        acc.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {acc.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. INVESTOR LIABILITIES REPORT */}
      {activeReport === 'investor_liab_rep' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">گزارش تعهدات باز و دیون به سرمایه‌گذاران</h3>
              <p className="text-xs text-zinc-400 mt-0.5">تفکیک اصل سرمایه در گردش معاملات، سرمایه آزاد و سودهای پرداخت‌نشده</p>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
              Investor Liabilities
            </span>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121316] text-zinc-400 border-b border-[#26282e]">
                <tr>
                  <th className="py-3 px-4">سرمایه‌گذار</th>
                  <th className="py-3 px-4">کل سرمایه تأمین‌شده</th>
                  <th className="py-3 px-4">سرمایه در گردش خودروها</th>
                  <th className="py-3 px-4">سرمایه آزاد (آماده)</th>
                  <th className="py-3 px-4">سود محقق‌شده</th>
                  <th className="py-3 px-4">سود تسویه‌شده</th>
                  <th className="py-3 px-4">سود معوق</th>
                  <th className="py-3 px-4">مجموع تعهد قطعی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26282e]">
                {investorSummaries.map((inv) => (
                  <tr key={inv.investorId} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-zinc-100">{inv.investorName}</td>
                    <td className="py-3 px-4 font-en-num text-zinc-300">{formatToman(inv.totalContributedCapital)}</td>
                    <td className="py-3 px-4 font-en-num text-sky-400">{formatToman(inv.activeAllocatedCapital)}</td>
                    <td className="py-3 px-4 font-en-num text-teal-400">{formatToman(inv.unallocatedCapital)}</td>
                    <td className="py-3 px-4 font-en-num text-emerald-400">{formatToman(inv.totalRealizedProfit)}</td>
                    <td className="py-3 px-4 font-en-num text-zinc-400">{formatToman(inv.totalProfitSettled)}</td>
                    <td className="py-3 px-4 font-en-num font-bold text-amber-400">{formatToman(inv.unsettledProfit)}</td>
                    <td className="py-3 px-4 font-en-num font-bold text-white text-sm bg-zinc-900/40">
                      {formatToman(inv.currentDealershipLiability)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CONTRACT FINANCIAL RECONCILIATION */}
      {activeReport === 'contract_recon_rep' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#17181d] border border-[#26282e] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">تطبیق مالی قراردادها و مبایعه‌نامه‌ها</h3>
              <p className="text-xs text-zinc-400 mt-0.5">قیمت اصلی خودرو، سود اقساط، پرداختی‌های مستقیم و غیرمستقیم، مانده مطالبات</p>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
              Contracts Reconciliation
            </span>
          </div>

          <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121316] text-zinc-400 border-b border-[#26282e]">
                <tr>
                  <th className="py-3 px-4">شماره قرارداد</th>
                  <th className="py-3 px-4">نوع</th>
                  <th className="py-3 px-4">خودرو</th>
                  <th className="py-3 px-4">قیمت اصلی</th>
                  <th className="py-3 px-4">سود اقساط</th>
                  <th className="py-3 px-4">ثمن کل توافق‌شده</th>
                  <th className="py-3 px-4">وصول مستقیم شرکت</th>
                  <th className="py-3 px-4">تسویه مستقیم طرفین</th>
                  <th className="py-3 px-4">مانده تعهد</th>
                  <th className="py-3 px-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26282e]">
                {contracts.map((ctr) => {
                  const ctrIndirectSum = indirectTransactions
                    .filter((t) => t.contractId === ctr.id || t.contractNumber === ctr.contractNumber)
                    .reduce((s, t) => s + t.amount, 0);

                  const directPaid = Math.max(0, ctr.financials.paidSoFar - ctrIndirectSum);

                  return (
                    <tr key={ctr.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{ctr.contractNumber}</td>
                      <td className="py-3 px-4 text-zinc-300">{ctr.contractType === 'sale' ? 'فروش' : 'خرید'}</td>
                      <td className="py-3 px-4 font-bold text-zinc-200">{ctr.vehicleLabel}</td>
                      <td className="py-3 px-4 font-en-num text-zinc-300">{formatToman(ctr.financials.baseVehiclePrice)}</td>
                      <td className="py-3 px-4 font-en-num text-amber-400">{formatToman(ctr.financials.installmentProfit)}</td>
                      <td className="py-3 px-4 font-en-num font-bold text-white">{formatToman(ctr.financials.totalAgreedPrice)}</td>
                      <td className="py-3 px-4 font-en-num text-emerald-400">{formatToman(directPaid)}</td>
                      <td className="py-3 px-4 font-en-num text-amber-300 font-semibold">{formatToman(ctrIndirectSum)}</td>
                      <td className="py-3 px-4 font-en-num font-bold text-sky-400">{formatToman(ctr.financials.remainingBalance)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ctr.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ctr.status === 'signed'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : ctr.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {ctr.status === 'completed' ? 'تکمیل‌شده' : ctr.status === 'signed' ? 'در جریان' : ctr.status === 'cancelled' ? 'فسخ‌شده' : 'پیش‌نویس'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ExpenseDetailDrawer
        expense={selectedExpenseForDetail}
        onClose={() => setSelectedExpenseForDetail(null)}
        onArchive={archiveExpense}
      />

      <RecordReimbursementModal
        expense={reimbursingExpense}
        isOpen={Boolean(reimbursingExpense)}
        onClose={() => setReimbursingExpense(null)}
      />

      <EditExpenseModal
        expense={editingExpense}
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
      />

      <OpeningDocumentModal
        isOpen={isOpeningDocModalOpen}
        onClose={() => setIsOpeningDocModalOpen(false)}
      />

      <OpeningDocumentsListModal
        isOpen={isOpeningDocsListOpen}
        onClose={() => setIsOpeningDocsListOpen(false)}
        onOpenNewModal={() => setIsOpeningDocModalOpen(true)}
      />
    </div>
  );
};
