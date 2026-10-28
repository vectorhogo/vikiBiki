import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  Wallet,
  Receipt,
  Clock,
  FileQuestion,
  AlertCircle,
  ArrowUpLeft,
  CheckCircle2,
  Car,
  ChevronLeft,
  CreditCard,
  Building2,
  Users,
  FileText,
  ScrollText,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { DailySummaryCard } from './DailySummaryCard';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab, subTab?: string) => void;
  onOpenQuickExpense: () => void;
  onOpenCashAdvance: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickExpense,
  onOpenCashAdvance,
}) => {
  const { metrics, needsAttentionItems, activities, customers, saleDossiers, contracts } = useAccounting();

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* 5 Core Metrics Grid (Phase 03 Smart Accounting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: موجودی تنخواه */}
        <div
          id="metric-cash-balance"
          onClick={() => onNavigate('advances')}
          className="bg-[#191b20] border border-[#282a32] hover:border-amber-500/40 p-3.5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">موجودی تنخواه پرسنل</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-zinc-100 tracking-tight">
            {formatToman(metrics.totalActiveCashAdvance)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span>تنخواه فعال در دست</span>
            <span className="text-amber-400/80 group-hover:text-amber-400 flex items-center gap-0.5">
              تنخواه‌ها <ChevronLeft className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 2: هزینه امروز */}
        <div
          id="metric-today-expenses"
          onClick={() => onNavigate('expenses')}
          className="bg-[#191b20] border border-[#282a32] hover:border-rose-500/40 p-3.5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">هزینه ثبت‌شده امروز</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-zinc-100 tracking-tight">
            {formatToman(metrics.todayExpenseTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span>تاریخ: امروز</span>
            <span className="text-rose-400/80 group-hover:text-rose-400 flex items-center gap-0.5">
              جزئیات <ChevronLeft className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 3: هزینه‌های شخصی در انتظار بازپرداخت (NEW Phase 03) */}
        <div
          id="metric-pending-reimbursement"
          onClick={() => onNavigate('reports', 'reimbursements')}
          className="bg-[#191b20] border border-[#282a32] hover:border-sky-500/40 p-3.5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">طلب پرسنل (پرداخت شخصی)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-zinc-100 tracking-tight">
            {formatToman(metrics.pendingReimbursementAmount)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span>{toPersianDigits(metrics.pendingReimbursementCount)} هزینه نیاز به بازپرداخت</span>
            <span className="text-sky-400/80 group-hover:text-sky-400 flex items-center gap-0.5">
              واریز <ChevronLeft className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 4: در انتظار تسویه تنخواه */}
        <div
          id="metric-pending-settlements"
          onClick={() => onNavigate('advances')}
          className="bg-[#191b20] border border-[#282a32] hover:border-emerald-500/40 p-3.5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">تنخواه‌های باز</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-zinc-100 tracking-tight flex items-baseline gap-1.5">
            <span>{toPersianDigits(metrics.pendingSettlementCount)}</span>
            <span className="text-xs font-normal text-zinc-400">فقره در انتظار تسویه</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span>دستیار تسویه رسمی</span>
            <span className="text-emerald-400/80 group-hover:text-emerald-400 flex items-center gap-0.5">
              تسویه <ChevronLeft className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 5: نیازمند رسید */}
        <div
          id="metric-missing-receipts"
          onClick={() => onNavigate('reports', 'receipts')}
          className="bg-[#191b20] border border-[#282a32] hover:border-amber-500/40 p-3.5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">نیازمند رسید</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
              metrics.missingReceiptCount > 0
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <FileQuestion className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-zinc-100 tracking-tight flex items-baseline gap-1.5">
            <span>{toPersianDigits(metrics.missingReceiptCount)}</span>
            <span className="text-xs font-normal text-zinc-400">هزینه بدون فاکتور</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span>پوشش مدارک: {toPersianDigits(metrics.receiptCoveragePct)}٪</span>
            <span className="text-amber-400/80 group-hover:text-amber-400 flex items-center gap-0.5">
              فاکتورها <ChevronLeft className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Daily Summary Card: Snapshot of Today's Expenses, Incomes, and Net Balance */}
      <DailySummaryCard
        onNavigate={onNavigate}
        onOpenQuickExpense={onOpenQuickExpense}
      />

      {/* Creative Micro-Section: نیازمند پیگیری (Needs Attention) */}
      {needsAttentionItems.length > 0 && (
        <div
          id="needs-attention-container"
          className="bg-[#181a1f] border border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-300">نیازمند پیگیری روزمره حسابداری</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {needsAttentionItems.map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
                    <span>{item.text}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {metrics.pendingReimbursementCount > 0 && (
              <button
                onClick={() => onNavigate('reports', 'reimbursements')}
                className="px-2.5 py-1 text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
              >
                تسویه طلب پرسنل
              </button>
            )}
            {metrics.missingReceiptCount > 0 && (
              <button
                onClick={() => onNavigate('reports', 'receipts')}
                className="px-2.5 py-1 text-xs bg-[#22252c] hover:bg-[#2b2e37] text-zinc-200 border border-[#333742] rounded-lg transition-colors cursor-pointer"
              >
                بررسی رسیدها
              </button>
            )}
            {metrics.pendingSettlementCount > 0 && (
              <button
                onClick={() => onNavigate('advances')}
                className="px-2.5 py-1 text-xs bg-[#22252c] hover:bg-[#2b2e37] text-zinc-200 border border-[#333742] rounded-lg transition-colors cursor-pointer"
              >
                تسویه تنخواه
              </button>
            )}
          </div>
        </div>
      )}

      {/* Highlights: Contracts, Sales Archive & Customer Master */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Contracts & Pacts Card (Phase 09A) */}
        <div
          onClick={() => onNavigate('contracts')}
          className="bg-[#17181d] border border-[#272932] hover:border-amber-500/40 p-4 rounded-xl transition-all cursor-pointer group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100">قراردادها و مبایعه‌نامه‌ها</h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {toPersianDigits(contracts.length)} قرارداد
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                تفکیک سود اقساطی، زمان‌بندی چک‌ها و تخصیص هوشمند مبالغ وصولی
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span>ورود به مدیریت قراردادها</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Archive Card */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-[#17181d] border border-[#272932] hover:border-sky-500/40 p-4 rounded-xl transition-all cursor-pointer group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100">پرونده‌های فروش و تحویل</h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  {toPersianDigits(saleDossiers.length)} پرونده
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                دسترسی به فرم‌های تحویل مدرکی (فرم الف)، فرم‌های تحویل خودرو (فرم ب) و دیاگرام‌ها
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-sky-400">
                <span>ورود به بایگانی فروش و تحویل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Master Card */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-[#17181d] border border-[#272932] hover:border-emerald-500/40 p-4 rounded-xl transition-all cursor-pointer group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100">بانک پرونده مشتریان</h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {toPersianDigits(customers.length)} خریدار
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                سوابق چندگانه خرید، پروفایل اعتباری، چک‌ها، اسناد و خط زمانی تعامل با خریداران
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>مشاهده پرونده مشتریان</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Latest Activity & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Latest Activity (5-7 events) */}
        <div
          id="recent-activities-panel"
          className="lg:col-span-2 bg-[#17181d] border border-[#26282e] rounded-xl p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#23252b]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs sm:text-sm font-bold text-zinc-200">رویدادها و فعالیت اخیر</h2>
            </div>
            <span className="text-[11px] text-zinc-500">آخرین عملیات ثبت‌شده</span>
          </div>

          <div className="divide-y divide-[#22242a]">
            {activities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="py-2.5 px-1 flex items-center justify-between text-xs hover:bg-[#1c1e24]/60 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                  <div>
                    <span className="font-medium text-zinc-200">{act.title}:</span>{' '}
                    <span className="text-zinc-400">{act.description}</span>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 shrink-0 mr-3 font-mono">
                  {act.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Card */}
        <div className="bg-[#17181d] border border-[#26282e] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-200 mb-1">اقدامات سریع حسابداری</h2>
            <p className="text-[11px] text-zinc-400 mb-3.5">عملیات پرتکرار روزمره نمایشگاه</p>

            <div className="space-y-2.5">
              <button
                onClick={onOpenQuickExpense}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>ثبت سریع هزینه (+ ثبت هزینه)</span>
                </div>
                <ArrowUpLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenCashAdvance}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#1e2027] hover:bg-[#252831] border border-[#2d3039] text-zinc-200 text-xs font-medium transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-sky-400" />
                  <span>تخصیص تنخواه به پرسنل</span>
                </div>
                <ArrowUpLeft className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigate('advances')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#1e2027] hover:bg-[#252831] border border-[#2d3039] text-zinc-200 text-xs font-medium transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>دستیار تسویه رسمی تنخواه</span>
                </div>
                <ArrowUpLeft className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#1e2027] hover:bg-[#252831] border border-[#2d3039] text-zinc-200 text-xs font-medium transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>مرکز گزارش‌های مالی و مدیریتی</span>
                </div>
                <ArrowUpLeft className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigate('vehicles')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#1e2027] hover:bg-[#252831] border border-[#2d3039] text-zinc-200 text-xs font-medium transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-zinc-400" />
                  <span>مشاهده پرونده و هزینه‌های خودروها</span>
                </div>
                <ArrowUpLeft className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#23252b] text-[11px] text-zinc-500 flex items-center justify-between">
            <span>کلیدهای میانبر فعال:</span>
            <span className="font-mono text-zinc-400">Ctrl+N • Ctrl+F</span>
          </div>
        </div>
      </div>
    </div>
  );
};
