import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Expense, ExpenseCategory, PaymentSource } from '../types/accounting';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Eye,
  Trash2,
  Calendar,
  Layers,
  Wallet,
  Building2,
  User,
  CreditCard,
  Edit,
} from 'lucide-react';
import { ExpenseDetailDrawer } from './ExpenseDetailDrawer';
import { RecordReimbursementModal } from './RecordReimbursementModal';
import { EditExpenseModal } from './EditExpenseModal';

interface ExpensesViewProps {
  onOpenQuickExpense: () => void;
  initialFilter?: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenQuickExpense, initialFilter }) => {
  const { expenses, archiveExpense, metrics } = useAccounting();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReceiptStatus, setSelectedReceiptStatus] = useState<'all' | 'with_receipt' | 'missing_receipt'>(
    initialFilter === 'missing_receipt' ? 'missing_receipt' : 'all'
  );
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today'>('all');

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reimbursingExpense, setReimbursingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.status === 'active')
      .filter((e) => {
        // Search
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchesDesc = e.description.toLowerCase().includes(q);
          const matchesPerson = e.personName.toLowerCase().includes(q);
          const matchesVehicle = e.vehicleLabel ? e.vehicleLabel.toLowerCase().includes(q) : false;
          const matchesCategory = (e.category || '').toLowerCase().includes(q);
          if (!matchesDesc && !matchesPerson && !matchesVehicle && !matchesCategory) return false;
        }

        // Category
        if (selectedCategory !== 'all' && e.category !== selectedCategory) {
          return false;
        }

        // Payment Source
        if (selectedPaymentSource !== 'all') {
          const actualSource = e.paymentSource || (e.cashAdvanceId ? 'advance' : 'company_direct');
          if (actualSource !== selectedPaymentSource) return false;
        }

        // Receipt status
        if (selectedReceiptStatus === 'with_receipt' && !e.hasReceipt) return false;
        if (selectedReceiptStatus === 'missing_receipt' && e.hasReceipt) return false;

        // Date filter
        if (selectedDateFilter === 'today' && e.date !== DEALERSHIP_CURRENT_DATE && e.date !== '1405/06/29') {
          return false;
        }

        return true;
      });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentSource, selectedReceiptStatus, selectedDateFilter]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto" dir="rtl">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#17181d] border border-[#26282e] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-zinc-100">فهرست هزینه‌های ثبت‌شده</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {toPersianDigits(filteredExpenses.length)} ردیف
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            مجموع مبالغ نمایش‌داده‌شده:{' '}
            <span className="font-bold text-amber-400 font-mono">{formatToman(totalFilteredAmount)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Receipt coverage indicator */}
          <div
            onClick={() => setSelectedReceiptStatus(selectedReceiptStatus === 'missing_receipt' ? 'all' : 'missing_receipt')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
              metrics.missingReceiptCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title="پوشش فاکتورها"
          >
            <span>پوشش فاکتورها:</span>
            <span className="font-bold font-mono text-sm">{toPersianDigits(metrics.receiptCoveragePct)}٪</span>
            {metrics.missingReceiptCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                {toPersianDigits(metrics.missingReceiptCount)} بدون رسید
              </span>
            )}
          </div>

          <button
            onClick={onOpenQuickExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت هزینه</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-[#17181d] border border-[#26282e] p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجو در شرح، شخص، خودرو یا دسته‌بندی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131417] border border-[#2b2d35] focus:border-amber-500 rounded-lg pr-9 pl-3 py-1.5 text-xs text-zinc-200 focus:outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Source Filter */}
          <select
            value={selectedPaymentSource}
            onChange={(e) => setSelectedPaymentSource(e.target.value)}
            className="bg-[#131417] border border-[#2b2d35] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
          >
            <option value="all">همه منابع پرداخت</option>
            <option value="advance">تنخواه</option>
            <option value="personal">پرداخت شخصی</option>
            <option value="company_direct">مستقیم شرکت</option>
            <option value="other">سایر</option>
          </select>

          {/* Date Filter */}
          <div className="flex items-center bg-[#131417] border border-[#2b2d35] rounded-lg p-0.5">
            <button
              onClick={() => setSelectedDateFilter('all')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedDateFilter === 'all' ? 'bg-[#22252c] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              همه تاریخ‌ها
            </button>
            <button
              onClick={() => setSelectedDateFilter('today')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedDateFilter === 'today' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              امروز
            </button>
          </div>

          {/* Receipt Filter */}
          <div className="flex items-center bg-[#131417] border border-[#2b2d35] rounded-lg p-0.5">
            <button
              onClick={() => setSelectedReceiptStatus('all')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedReceiptStatus === 'all' ? 'bg-[#22252c] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setSelectedReceiptStatus('with_receipt')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedReceiptStatus === 'with_receipt' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              با رسید
            </button>
            <button
              onClick={() => setSelectedReceiptStatus('missing_receipt')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedReceiptStatus === 'missing_receipt' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              بدون رسید
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#131417] border border-[#2b2d35] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
          >
            <option value="all">همه دسته‌ها</option>
            <option value="سوخت">سوخت</option>
            <option value="کارشناسی">کارشناسی</option>
            <option value="حمل و یدک‌کش">حمل و یدک‌کش</option>
            <option value="تعمیر و سرویس">تعمیر و سرویس</option>
            <option value="شستشو و دیتیلینگ">شستشو و دیتیلینگ</option>
            <option value="پذیرایی و مصرفی">پذیرایی و مصرفی</option>
            <option value="کمیسیون">کمیسیون</option>
            <option value="عوارض و خلافی">عوارض و خلافی</option>
            <option value="سایر">سایر</option>
            <option value="دسته‌بندی نشده">دسته‌بندی نشده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e] font-medium">
              <tr>
                <th className="py-3 px-4">تاریخ</th>
                <th className="py-3 px-4">شرح هزینه</th>
                <th className="py-3 px-4">دسته‌بندی</th>
                <th className="py-3 px-4">شخص</th>
                <th className="py-3 px-4">خودرو</th>
                <th className="py-3 px-4">منبع پرداخت</th>
                <th className="py-3 px-4 text-left">مبلغ (تومان)</th>
                <th className="py-3 px-4 text-center">وضعیت رسید</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22242a]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    موردی با شرایط انتخاب شده یافت نشد
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const source = expense.paymentSource || (expense.cashAdvanceId ? 'advance' : 'company_direct');

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-[#1f2128]/70 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                        {toPersianDigits(expense.date)}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 font-medium text-zinc-200 max-w-[200px]">
                        <div className="truncate">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-[10px] text-zinc-500 truncate">{expense.notes}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          expense.category === 'دسته‌بندی نشده'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800/80 text-zinc-300'
                        }`}>
                          {expense.category || 'دسته‌بندی نشده'}
                        </span>
                      </td>

                      {/* Person */}
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-300">
                        {expense.personName}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-300">
                        {expense.vehicleLabel ? (
                          <span className="text-zinc-200">{expense.vehicleLabel}</span>
                        ) : (
                          <span className="text-zinc-500">عمومی / بدون خودرو</span>
                        )}
                      </td>

                      {/* Payment Source */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {source === 'advance' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-medium">
                            <Wallet className="w-3 h-3" />
                            <span>تنخواه</span>
                          </span>
                        )}
                        {source === 'personal' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/25 text-sky-300 text-[10px] font-medium">
                              <User className="w-3 h-3" />
                              <span>پرداخت شخصی</span>
                            </span>
                            {expense.reimbursementStatus === 'reimbursed' ? (
                              <div className="text-[9px] text-emerald-400 font-medium">تسویه شد</div>
                            ) : (
                              <div className="text-[9px] text-amber-400 font-medium">نیازمند بازپرداخت</div>
                            )}
                          </div>
                        )}
                        {source === 'company_direct' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-medium">
                            <Building2 className="w-3 h-3" />
                            <span>مستقیم شرکت</span>
                          </span>
                        )}
                        {source === 'other' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                            <span>سایر</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-left font-mono font-bold text-amber-400 whitespace-nowrap">
                        {formatToman(expense.amount)}
                      </td>

                      {/* Receipt Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {expense.hasReceipt && expense.receipts.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>دارد ({toPersianDigits(expense.receipts.length)})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>بدون رسید</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reimburse action if personal & needs reimbursement */}
                          {source === 'personal' && expense.reimbursementStatus !== 'reimbursed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReimbursingExpense(expense);
                              }}
                              className="p-1 px-2 text-[11px] bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded transition-colors flex items-center gap-1"
                              title="ثبت بازپرداخت"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>بازپرداخت</span>
                            </button>
                          )}

                          {/* Edit / Complete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingExpense(expense);
                            }}
                            className="p-1 text-zinc-400 hover:text-amber-400 rounded hover:bg-[#282a32] transition-colors"
                            title="ویرایش و تکمیل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* View details drawer button */}
                          <button
                            onClick={() => setSelectedExpense(expense)}
                            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-[#282a32] transition-colors"
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <ExpenseDetailDrawer
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onArchive={archiveExpense}
      />

      {/* Reimbursement Modal */}
      <RecordReimbursementModal
        expense={reimbursingExpense}
        isOpen={Boolean(reimbursingExpense)}
        onClose={() => setReimbursingExpense(null)}
      />

      {/* Edit Modal */}
      <EditExpenseModal
        expense={editingExpense}
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
      />
    </div>
  );
};
