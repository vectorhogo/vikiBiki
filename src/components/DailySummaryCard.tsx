import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  ArrowUpLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Receipt,
  Scale,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Tag,
  Car,
  User,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { DEALERSHIP_CURRENT_DATE, formatToman, toPersianDigits } from '../utils/formatters';
import { NavigationTab } from './Sidebar';
import { NewIncomeModal } from './NewIncomeModal';

interface DailySummaryCardProps {
  onNavigate: (tab: NavigationTab, subTab?: string) => void;
  onOpenQuickExpense: () => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  onNavigate,
  onOpenQuickExpense,
}) => {
  const { metrics, expenses, incomes } = useAccounting();
  const [isNewIncomeModalOpen, setIsNewIncomeModalOpen] = useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);

  // Filter today's transactions
  const todayExpenses = expenses.filter(
    (e) =>
      e.status === 'active' &&
      (e.date === DEALERSHIP_CURRENT_DATE || e.date === '1405/06/29')
  );

  const todayIncomes = incomes.filter(
    (inc) => inc.date === DEALERSHIP_CURRENT_DATE || inc.date === '1405/06/29'
  );

  const totalTodayTransactions = todayExpenses.length + todayIncomes.length;

  // Breakdown of today's expenses by category
  const expenseCategoryBreakdown = todayExpenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  // Breakdown of today's incomes by category
  const incomeCategoryBreakdown = todayIncomes.reduce<Record<string, number>>((acc, inc) => {
    acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
    return acc;
  }, {});

  // Financial coverage ratio
  const incomeVsExpenseTotal = metrics.todayIncomeTotal + metrics.todayExpenseTotal;
  const incomePercentage = incomeVsExpenseTotal > 0 ? Math.round((metrics.todayIncomeTotal / incomeVsExpenseTotal) * 100) : 50;
  const expensePercentage = 100 - incomePercentage;

  const isNetPositive = metrics.todayNetBalance >= 0;

  return (
    <div
      id="daily-summary-card"
      className="bg-[#17181d] border border-[#272930] hover:border-[#323640] rounded-xl p-4 sm:p-5 transition-all shadow-sm"
      dir="rtl"
    >
      {/* Header with Title, Jalali Date, and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23252c]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-[#373a44] flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                خلاصه وضعیت مالی امروز
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                روز کاری فعال
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>امروز: شنبه {toPersianDigits(DEALERSHIP_CURRENT_DATE)}</span>
              <span className="text-zinc-500">•</span>
              <span>{toPersianDigits(totalTodayTransactions)} تراکنش ثبت‌شده</span>
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="daily-summary-add-income-btn"
            onClick={() => setIsNewIncomeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت دریافتی / درآمد</span>
          </button>
          <button
            id="daily-summary-add-expense-btn"
            onClick={onOpenQuickExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت سریع هزینه</span>
          </button>
        </div>
      </div>

      {/* Snapshot Cards Grid: Income vs Expense vs Net Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* 1. درآمد و دریافتی‌های امروز */}
        <div
          id="daily-summary-income-box"
          className="bg-[#141519] border border-emerald-500/20 rounded-xl p-3.5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-emerald-300/90 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>مجموع درآمدهای امروز</span>
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {toPersianDigits(metrics.todayIncomeCount)} فقره
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight font-mono">
            {formatToman(metrics.todayIncomeTotal)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>کمیسیون، قرارداد و خدمات</span>
            <span className="text-emerald-400 font-medium">ورودی نقدینگی</span>
          </div>
        </div>

        {/* 2. مخارج و هزینه‌های امروز */}
        <div
          id="daily-summary-expense-box"
          onClick={() => onNavigate('expenses')}
          className="bg-[#141519] border border-rose-500/20 rounded-xl p-3.5 relative overflow-hidden group hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-rose-300/90 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>مجموع هزینه‌های امروز</span>
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {toPersianDigits(metrics.todayExpenseCount)} فقره
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight font-mono">
            {formatToman(metrics.todayExpenseTotal)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>سوخت، کارشناسی، شستشو</span>
            <span className="text-rose-400/90 group-hover:text-rose-400 flex items-center gap-0.5">
              مشاهده اقلام <ArrowUpLeft className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. تراز و سود عملیاتی امروز */}
        <div
          id="daily-summary-net-box"
          className={`border rounded-xl p-3.5 relative overflow-hidden transition-colors ${
            isNetPositive
              ? 'bg-[#141519] border-sky-500/20 hover:border-sky-500/40'
              : 'bg-[#141519] border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${isNetPositive ? 'text-sky-400' : 'text-amber-400'}`} />
              <span>تراز خالص مالی امروز</span>
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                isNetPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
              }`}
            >
              {isNetPositive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {isNetPositive ? 'تراز مثبت (سود روز)' : 'تراز منفی (کسری)'}
            </span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive && metrics.todayNetBalance > 0 ? '+' : ''}
            {formatToman(metrics.todayNetBalance)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>تفاضل دریافتی‌ها و مخارج</span>
            <span className="text-zinc-300">
              {metrics.todayExpenseTotal > 0
                ? `${toPersianDigits(Math.round((metrics.todayIncomeTotal / metrics.todayExpenseTotal) * 100))}٪ پوشش مخارج`
                : 'بدون هزینه'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Cash Flow Ratio Bar */}
      {incomeVsExpenseTotal > 0 && (
        <div className="bg-[#131418] border border-[#23252c] rounded-lg p-3 my-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-medium">سهم درآمدها: {toPersianDigits(incomePercentage)}٪</span>
              <span className="text-zinc-600">•</span>
              <span className="text-rose-400 font-medium">سهم هزینه‌ها: {toPersianDigits(expensePercentage)}٪</span>
            </div>
            <span className="text-[11px] text-zinc-500">جریان گردش وجوه امروز</span>
          </div>

          <div className="w-full h-2 bg-[#22252c] rounded-full overflow-hidden flex">
            <div
              style={{ width: `${incomePercentage}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            />
            <div
              style={{ width: `${expensePercentage}%` }}
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
            />
          </div>
        </div>
      )}

      {/* Quick Category Summary Chips */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 ml-1">سرفصل‌های هزینه امروز:</span>
          {Object.keys(expenseCategoryBreakdown).length > 0 ? (
            Object.entries(expenseCategoryBreakdown).map(([cat, amt]) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-md bg-[#1f2128] border border-[#2e313b] text-zinc-300 text-[11px] flex items-center gap-1"
              >
                <span>{cat}:</span>
                <span className="font-mono text-zinc-200">{formatToman(amt, false)}</span>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-zinc-400">هنوز هزینه‌ای ثبت نشده است</span>
          )}
        </div>

        {/* Toggle details button */}
        <button
          onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
          className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#1e2026] transition-colors cursor-pointer"
        >
          <span>{isTransactionsExpanded ? 'بستن ریز تراکنش‌ها' : 'مشاهده ریز تراکنش‌های امروز'}</span>
          {isTransactionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Daily Transactions Feed */}
      {isTransactionsExpanded && (
        <div className="mt-4 pt-3 border-t border-[#23252c] space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold text-zinc-300">لیست تراکنش‌های ثبت‌شده برای امروز ({toPersianDigits(totalTodayTransactions)})</span>
            <span className="text-[11px] text-zinc-400">تاریخ: {toPersianDigits(DEALERSHIP_CURRENT_DATE)}</span>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {/* Incomes */}
            {todayIncomes.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs hover:border-emerald-500/35 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <span>{inc.description}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-300">
                        {inc.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                      {inc.vehicleLabel && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-zinc-400" />
                          <span>{inc.vehicleLabel}</span>
                        </span>
                      )}
                      {inc.personName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span>{inc.personName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono font-bold text-emerald-400 shrink-0">
                  +{formatToman(inc.amount)}
                </div>
              </div>
            ))}

            {/* Expenses */}
            {todayExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/15 border border-rose-500/20 text-xs hover:border-rose-500/35 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <TrendingDown className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <span>{exp.description}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/15 text-rose-300">
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{exp.personName}</span>
                      </span>
                      {exp.vehicleLabel && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-zinc-400" />
                          <span>{exp.vehicleLabel}</span>
                        </span>
                      )}
                      <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        {exp.paymentSource === 'advance'
                          ? 'تنخواه گردان'
                          : exp.paymentSource === 'personal'
                          ? 'پرداخت شخصی'
                          : 'صندوق شرکت'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono font-bold text-rose-400 shrink-0">
                  -{formatToman(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for registering new daily income */}
      <NewIncomeModal
        isOpen={isNewIncomeModalOpen}
        onClose={() => setIsNewIncomeModalOpen(false)}
      />
    </div>
  );
};
