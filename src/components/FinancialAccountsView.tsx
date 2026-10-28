import React, { useState, useMemo } from 'react';
import {
  FinancialAccount,
  FinancialAccountType,
  AccountTransfer,
} from '../types/finance09b';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  Landmark,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  ShieldCheck,
  History,
} from 'lucide-react';

export const FinancialAccountsView: React.FC = () => {
  const {
    liveFinancialAccounts,
    accountTransfers,
    addFinancialAccount,
    updateFinancialAccount,
    transferBetweenAccounts,
  } = useAccounting();

  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'transfers'>('accounts');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);

  // New Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<FinancialAccountType>('bank');
  const [newAccBankName, setNewAccBankName] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccShaba, setNewAccShaba] = useState('');
  const [newAccCardLastFour, setNewAccCardLastFour] = useState('');
  const [newAccOpeningBal, setNewAccOpeningBal] = useState<number>(0);
  const [newAccNotes, setNewAccNotes] = useState('');

  // Transfer Form State
  const [trfDate, setTrfDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [trfSourceId, setTrfSourceId] = useState('');
  const [trfDestId, setTrfDestId] = useState('');
  const [trfAmount, setTrfAmount] = useState<number>(0);
  const [trfRef, setTrfRef] = useState('');
  const [trfReason, setTrfReason] = useState('');
  const [trfNotes, setTrfNotes] = useState('');

  // Totals
  const metrics = useMemo(() => {
    let totalCash = 0;
    let totalBank = 0;
    let totalPos = 0;
    let grandTotal = 0;

    liveFinancialAccounts.forEach((acc) => {
      const bal = acc.currentBalance || 0;
      grandTotal += bal;
      if (acc.type === 'cash') totalCash += bal;
      else if (acc.type === 'bank') totalBank += bal;
      else if (acc.type === 'pos' || acc.type === 'card') totalPos += bal;
    });

    return {
      grandTotal,
      totalCash,
      totalBank,
      totalPos,
      activeCount: liveFinancialAccounts.filter((a) => a.isActive).length,
    };
  }, [liveFinancialAccounts]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return liveFinancialAccounts.filter((acc) => {
      if (filterType !== 'all' && acc.type !== filterType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchBank = acc.bankName?.toLowerCase().includes(q);
        const matchNum = acc.accountNumber?.includes(q);
        if (!matchName && !matchBank && !matchNum) return false;
      }
      return true;
    });
  }, [liveFinancialAccounts, filterType, searchTerm]);

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    return accountTransfers.filter((trf) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNum = trf.transferNumber.toLowerCase().includes(q);
        const matchSrc = trf.sourceAccountName.toLowerCase().includes(q);
        const matchDst = trf.destinationAccountName.toLowerCase().includes(q);
        const matchReason = trf.reason.toLowerCase().includes(q);
        if (!matchNum && !matchSrc && !matchDst && !matchReason) return false;
      }
      return true;
    });
  }, [accountTransfers, searchTerm]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    addFinancialAccount({
      name: newAccName.trim(),
      type: newAccType,
      bankName: newAccBankName.trim() || undefined,
      accountNumber: newAccNumber.trim() || undefined,
      shabaNumber: newAccShaba.trim() || undefined,
      cardLastFour: newAccCardLastFour.trim() || undefined,
      openingBalance: Number(newAccOpeningBal) || 0,
      isActive: true,
      notes: newAccNotes.trim() || undefined,
    });

    setIsNewAccountModalOpen(false);
    setNewAccName('');
    setNewAccBankName('');
    setNewAccNumber('');
    setNewAccShaba('');
    setNewAccCardLastFour('');
    setNewAccOpeningBal(0);
    setNewAccNotes('');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfSourceId || !trfDestId || trfAmount <= 0) return;

    const res = transferBetweenAccounts({
      date: trfDate,
      sourceAccountId: trfSourceId,
      destinationAccountId: trfDestId,
      amount: Number(trfAmount),
      referenceNumber: trfRef.trim() || undefined,
      reason: trfReason.trim() || 'انتقال داخلی بین حساب‌ها',
      notes: trfNotes.trim() || undefined,
    });

    if (res.success) {
      setIsTransferModalOpen(false);
      setTrfSourceId('');
      setTrfDestId('');
      setTrfAmount(0);
      setTrfRef('');
      setTrfReason('');
      setTrfNotes('');
    }
  };

  const getAccountTypeIcon = (type: FinancialAccountType) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-amber-400" />;
      case 'bank':
        return <Landmark className="w-5 h-5 text-sky-400" />;
      case 'pos':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      default:
        return <Building2 className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getAccountTypeLabel = (type: FinancialAccountType) => {
    switch (type) {
      case 'cash':
        return 'صندوق نقدی';
      case 'bank':
        return 'حساب بانکی';
      case 'pos':
        return 'دستگاه پوز';
      case 'card':
        return 'کارت تنخواه/شرکت';
      default:
        return 'سایر';
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* Top Banner & Header */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>دفتر حساب‌های مالی، بانکی و خزانه‌داری</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-en-num">
                  {toPersianDigits(liveFinancialAccounts.length)} حساب فعال
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                مدیریت صندوق‌های نقد، حساب‌های بانکی، کارت‌خوان‌ها و انتقال داخلی بین‌حسابی با حفظ اثر خنثی سود و زیان
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700 transition-all cursor-pointer shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <span>انتقال بین‌حسابی</span>
          </button>

          <button
            onClick={() => setIsNewAccountModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افتتاح حساب جدید</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidity */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>کل نقدینگی حساب‌های شرکت</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-white">
              {formatToman(metrics.grandTotal)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>مجموع تراز لحظه‌ای</span>
            <span className="font-en-num text-zinc-400">{toPersianDigits(metrics.activeCount)} حساب</span>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20 flex flex-col justify-between bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-300 text-xs">
            <span>موجودی حساب‌های بانکی</span>
            <Landmark className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-sky-200">
              {formatToman(metrics.totalBank)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-sky-400/70">
            حواله‌های ساتنا، پایا و چک‌ها
          </div>
        </div>

        {/* Cash Desks */}
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 flex flex-col justify-between bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>موجودی نقد صندوق‌ها</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-amber-200">
              {formatToman(metrics.totalCash)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/70">
            خزانه و صندوق‌های پذیرش
          </div>
        </div>

        {/* POS Cards */}
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span>کارت‌خوان‌ها و پوز</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-emerald-200">
              {formatToman(metrics.totalPos)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/70">
            تراکنش‌های ورودی پیشخوان
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('accounts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'accounts'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>حساب‌ها و صندوق‌ها ({toPersianDigits(liveFinancialAccounts.length)})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transfers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'transfers'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>تاریخچه جابجایی‌های داخلی ({toPersianDigits(accountTransfers.length)})</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {activeSubTab === 'accounts' && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">همه انواع حساب</option>
              <option value="bank">حساب‌های بانکی</option>
              <option value="cash">صندوق‌های نقدی</option>
              <option value="pos">کارت‌خوان‌ها</option>
              <option value="card">کارت شرکت</option>
            </select>
          )}

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در حساب‌ها..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pr-8 pl-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Accounts Cards Grid */}
      {activeSubTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => {
            const balance = account.currentBalance || 0;
            return (
              <div
                key={account.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-sky-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0">
                        {getAccountTypeIcon(account.type)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 group-hover:text-sky-300 transition-colors">
                          {account.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-zinc-400">
                            {account.bankName || getAccountTypeLabel(account.type)}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          account.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {account.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                  </div>

                  {/* Account Numbers Details */}
                  <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 text-xs font-mono">
                    {account.accountNumber && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-sans text-[11px]">شماره حساب:</span>
                        <span className="text-zinc-200 font-bold tracking-wider">{account.accountNumber}</span>
                      </div>
                    )}
                    {account.shabaNumber && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-sans text-[11px]">شماره شبا:</span>
                        <span className="text-sky-300 text-[11px] truncate max-w-[190px]">{account.shabaNumber}</span>
                      </div>
                    )}
                    {account.cardLastFour && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-sans text-[11px]">۴ رقم کارت:</span>
                        <span className="text-amber-300 font-bold">•••• {account.cardLastFour}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/50">
                      <span className="font-sans text-[11px]">مانده افتتاحیه:</span>
                      <span className="font-sans font-en-num text-zinc-400 text-[11px]">
                        {formatToman(account.openingBalance)}
                      </span>
                    </div>
                  </div>

                  {account.notes && (
                    <p className="text-[11px] text-zinc-500 mt-2.5 line-clamp-2 italic">
                      {account.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer: Live Balance */}
                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">موجودی لحظه‌ای:</span>
                    <span className="text-lg font-bold font-en-num text-emerald-400">
                      {formatToman(balance)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setTrfSourceId(account.id);
                      setIsTransferModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>انتقال وجه</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAccounts.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 glass-panel rounded-2xl">
              <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
              <p className="text-sm font-semibold">حساب مالی یافت نشد</p>
              <p className="text-xs text-zinc-500 mt-1">با معیارهای جستجوی فعلی حسابی مطابقت ندارد.</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content: Transfers Table */}
      {activeSubTab === 'transfers' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-zinc-200">
                دفتر ثبت انتقالات داخلی (Internal Transfers)
              </h2>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>تمام انتقالات با اثر صفر بر سود و زیان شرکت ثبت می‌شوند</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">شناسه انتقال</th>
                  <th className="py-3 px-4">تاریخ</th>
                  <th className="py-3 px-4">حساب مبدأ (کسر شد)</th>
                  <th className="py-3 px-4">حساب مقصد (افزوده شد)</th>
                  <th className="py-3 px-4">مبلغ انتقال</th>
                  <th className="py-3 px-4">شماره پیگیری / سند</th>
                  <th className="py-3 px-4">بابت و شرح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {trf.transferNumber}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-mono">
                      {toPersianDigits(trf.date)}
                    </td>
                    <td className="py-3 px-4 text-rose-300 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{trf.sourceAccountName}</span>
                    </td>
                    <td className="py-3 px-4 text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{trf.destinationAccountName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold font-en-num text-white">
                      {formatToman(trf.amount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {trf.referenceNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">
                      <span>{trf.reason}</span>
                      {trf.notes && <span className="text-zinc-500 text-[11px] block">{trf.notes}</span>}
                    </td>
                  </tr>
                ))}

                {filteredTransfers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-500">
                      هیچ انتقالی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Account */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-zinc-100">افتتاح حساب مالی جدید</h3>
              </div>
              <button
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">نوع حساب:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bank', 'cash', 'pos', 'card'] as FinancialAccountType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAccType(t)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                        newAccType === t
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {getAccountTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">نام حساب / صندوق:</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="مثلاً: حساب جاری بانک صادرات - شعبه بازار"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">نام بانک یا محل:</label>
                  <input
                    type="text"
                    value={newAccBankName}
                    onChange={(e) => setNewAccBankName(e.target.value)}
                    placeholder="مثلاً: بانک ملت"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">شماره حساب / پایانه:</label>
                  <input
                    type="text"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                    placeholder="شماره حساب یا سریال دستگاه"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">شماره شبا (اختیاری):</label>
                  <input
                    type="text"
                    value={newAccShaba}
                    onChange={(e) => setNewAccShaba(e.target.value)}
                    placeholder="IR..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-sky-500 text-left"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">۴ رقم آخر کارت (اختیاری):</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newAccCardLastFour}
                    onChange={(e) => setNewAccCardLastFour(e.target.value)}
                    placeholder="مثلاً ۶۱۰۴"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-sky-500 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">موجودی اولیه (تومان):</label>
                <input
                  type="number"
                  value={newAccOpeningBal || ''}
                  onChange={(e) => setNewAccOpeningBal(Number(e.target.value))}
                  placeholder="۰"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  معادل: {formatToman(newAccOpeningBal || 0)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات و یادداشت:</label>
                <textarea
                  rows={2}
                  value={newAccNotes}
                  onChange={(e) => setNewAccNotes(e.target.value)}
                  placeholder="کاربرد حساب، مدیر دسترسی..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-sky-950/40"
                >
                  تأیید و افتتاح حساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Between Accounts */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-zinc-100">انتقال داخلی وجه بین حساب‌ها</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">قاعده انتقال بدون درآمد و هزینه:</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  این جابجایی صرفاً تراز حساب مبدأ را کاهش و تراز حساب مقصد را افزایش می‌دهد؛ هیچ‌گونه سود، زیان، درآمد یا هزینه جدیدی برای نمایشگاه محاسبه نخواهد شد.
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">تاریخ انتقال:</label>
                  <input
                    type="text"
                    required
                    value={trfDate}
                    onChange={(e) => setTrfDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">شماره پیگیری فیش / سند:</label>
                  <input
                    type="text"
                    value={trfRef}
                    onChange={(e) => setTrfRef(e.target.value)}
                    placeholder="مثلاً: ساتنا ۸۹۳۱۴۵"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">حساب مبدأ (برداشت وجه):</label>
                  <select
                    required
                    value={trfSourceId}
                    onChange={(e) => setTrfSourceId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">انتخاب حساب مبدأ...</option>
                    {liveFinancialAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatToman(a.currentBalance || 0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">حساب مقصد (واریز وجه):</label>
                  <select
                    required
                    value={trfDestId}
                    onChange={(e) => setTrfDestId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">انتخاب حساب مقصد...</option>
                    {liveFinancialAccounts
                      .filter((a) => a.id !== trfSourceId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatToman(a.currentBalance || 0)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مبلغ انتقال (تومان):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={trfAmount || ''}
                  onChange={(e) => setTrfAmount(Number(e.target.value))}
                  placeholder="مبلغ را به تومان وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-amber-400 mt-1 block">
                  معادل: {formatToman(trfAmount || 0)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">بابت و دلیل انتقال:</label>
                <input
                  type="text"
                  required
                  value={trfReason}
                  onChange={(e) => setTrfReason(e.target.value)}
                  placeholder="مثلاً: تأمین تنخواه صندوق نقد از حساب جاری ملت"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات تکمیلی (اختیاری):</label>
                <textarea
                  rows={2}
                  value={trfNotes}
                  onChange={(e) => setTrfNotes(e.target.value)}
                  placeholder="توضیحات بیشتر..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!trfSourceId || !trfDestId || trfAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-950/40"
                >
                  ثبت و اجرای انتقال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
