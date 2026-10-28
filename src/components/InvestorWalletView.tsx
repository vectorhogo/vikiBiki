import React, { useState, useMemo } from 'react';
import {
  InvestorProfile,
  InvestorContribution,
  InvestorDealAllocation,
  InvestorSettlement,
  InvestorWalletSummary,
  InvestorContributionChannel,
  InvestorSettlementType,
} from '../types/finance09b';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  WalletCards,
  TrendingUp,
  Plus,
  Building2,
  Car,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Search,
  X,
  FileText,
  Users,
  ChevronLeft,
  BadgePercent,
  CheckCircle,
} from 'lucide-react';

export const InvestorWalletView: React.FC = () => {
  const {
    investorProfiles,
    investorSummaries,
    liveFinancialAccounts,
    vehicles,
    contracts,
    addInvestorProfile,
    recordInvestorContribution,
    allocateInvestorToDeal,
    exitInvestorAllocation,
    settleInvestorProfitOrCapital,
  } = useAccounting();

  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeProfileTab, setActiveProfileTab] = useState<'statement' | 'contributions' | 'allocations' | 'settlements'>('statement');

  // Modals
  const [isNewInvestorModalOpen, setIsNewInvestorModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isExitAllocationModalOpen, setIsExitAllocationModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Target item states for modals
  const [targetAllocationForExit, setTargetAllocationForExit] = useState<InvestorDealAllocation | null>(null);

  // New Investor Form State
  const [newInvName, setNewInvName] = useState('');
  const [newInvPhone, setNewInvPhone] = useState('');
  const [newInvNationalId, setNewInvNationalId] = useState('');
  const [newInvNotes, setNewInvNotes] = useState('');

  // Contribution Form State
  const [contribDate, setContribDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [contribAmount, setContribAmount] = useState<number>(0);
  const [contribChannel, setContribChannel] = useState<InvestorContributionChannel>('company_account');
  const [contribDestAccountId, setContribDestAccountId] = useState('');
  const [contribSellerName, setContribSellerName] = useState('');
  const [contribDoc, setContribDoc] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  // Allocation Form State
  const [allocVehId, setAllocVehId] = useState('');
  const [allocVehLabel, setAllocVehLabel] = useState('');
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocProfitShare, setAllocProfitShare] = useState<number>(35);
  const [allocFixedProfit, setAllocFixedProfit] = useState<number>(0);
  const [allocDate, setAllocDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [allocNotes, setAllocNotes] = useState('');

  // Exit Allocation Form State
  const [exitDate, setExitDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [exitRealizedProfit, setExitRealizedProfit] = useState<number>(0);
  const [exitNotes, setExitNotes] = useState('');

  // Settlement Form State
  const [stlType, setStlType] = useState<InvestorSettlementType>('profit_distribution');
  const [stlAmount, setStlAmount] = useState<number>(0);
  const [stlDate, setStlDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [stlSourceAccountId, setStlSourceAccountId] = useState('');
  const [stlMethod, setStlMethod] = useState<'bank_transfer' | 'cash' | 'cheque'>('bank_transfer');
  const [stlTracking, setStlTracking] = useState('');
  const [stlNotes, setStlNotes] = useState('');

  // Selected Investor
  const selectedInvestor = useMemo(() => {
    if (!selectedInvestorId) return investorProfiles[0] || null;
    return investorProfiles.find((i) => i.id === selectedInvestorId) || investorProfiles[0] || null;
  }, [investorProfiles, selectedInvestorId]);

  const selectedSummary = useMemo(() => {
    if (!selectedInvestor) return null;
    return investorSummaries.find((s) => s.investorId === selectedInvestor.id) || null;
  }, [investorSummaries, selectedInvestor]);

  // Overall Dealership Capital Metrics
  const dealershipTotals = useMemo(() => {
    let totalCap = 0;
    let activeAlloc = 0;
    let unallocated = 0;
    let totalProfit = 0;
    let totalLiability = 0;

    investorSummaries.forEach((s) => {
      totalCap += s.totalContributedCapital;
      activeAlloc += s.activeAllocatedCapital;
      unallocated += s.unallocatedCapital;
      totalProfit += s.totalRealizedProfit;
      totalLiability += s.currentDealershipLiability;
    });

    return {
      totalCap,
      activeAlloc,
      unallocated,
      totalProfit,
      totalLiability,
      investorCount: investorProfiles.length,
    };
  }, [investorSummaries, investorProfiles]);

  const handleCreateInvestor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim() || !newInvPhone.trim()) return;

    addInvestorProfile({
      name: newInvName.trim(),
      phone: newInvPhone.trim(),
      nationalId: newInvNationalId.trim() || undefined,
      status: 'active',
      joinedDate: DEALERSHIP_CURRENT_DATE,
      notes: newInvNotes.trim() || undefined,
    });

    setIsNewInvestorModalOpen(false);
    setNewInvName('');
    setNewInvPhone('');
    setNewInvNationalId('');
    setNewInvNotes('');
  };

  const handleRecordContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || contribAmount <= 0) return;

    const res = recordInvestorContribution({
      investorId: selectedInvestor.id,
      date: contribDate,
      amount: Number(contribAmount),
      channel: contribChannel,
      destinationAccountId: contribChannel === 'company_account' ? contribDestAccountId || undefined : undefined,
      sellerOrOwnerName: contribChannel === 'direct_to_seller' ? contribSellerName.trim() || undefined : undefined,
      supportingDocument: contribDoc.trim() || undefined,
      notes: contribNotes.trim() || undefined,
    });

    if (res.success) {
      setIsContributionModalOpen(false);
      setContribAmount(0);
      setContribDoc('');
      setContribNotes('');
      setContribSellerName('');
    }
  };

  const handleAllocateToDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || allocAmount <= 0 || !allocVehLabel.trim()) return;

    const res = allocateInvestorToDeal({
      investorId: selectedInvestor.id,
      vehicleId: allocVehId || `veh-custom-${Date.now()}`,
      vehicleLabel: allocVehLabel.trim(),
      allocationDate: allocDate,
      allocatedCapital: Number(allocAmount),
      profitSharePercentage: allocProfitShare > 0 ? Number(allocProfitShare) : undefined,
      agreedFixedProfit: allocFixedProfit > 0 ? Number(allocFixedProfit) : undefined,
      notes: allocNotes.trim() || undefined,
    });

    if (res.success) {
      setIsAllocateModalOpen(false);
      setAllocVehId('');
      setAllocVehLabel('');
      setAllocAmount(0);
      setAllocNotes('');
    }
  };

  const handleExitAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !targetAllocationForExit) return;

    const res = exitInvestorAllocation({
      investorId: selectedInvestor.id,
      allocationId: targetAllocationForExit.id,
      exitDate,
      realizedProfit: Number(exitRealizedProfit),
      notes: exitNotes.trim() || undefined,
    });

    if (res.success) {
      setIsExitAllocationModalOpen(false);
      setTargetAllocationForExit(null);
      setExitRealizedProfit(0);
      setExitNotes('');
    }
  };

  const handleExecuteSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || stlAmount <= 0) return;

    const res = settleInvestorProfitOrCapital({
      investorId: selectedInvestor.id,
      date: stlDate,
      type: stlType,
      amount: Number(stlAmount),
      sourceAccountId: stlSourceAccountId || undefined,
      paymentMethod: stlMethod,
      trackingNumber: stlTracking.trim() || undefined,
      notes: stlNotes.trim() || undefined,
    });

    if (res.success) {
      setIsSettlementModalOpen(false);
      setStlAmount(0);
      setStlTracking('');
      setStlNotes('');
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* Top Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <WalletCards className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>کیف پول و حساب سرمایه‌گذاران (تأمین مالی خودرو)</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-en-num">
                  {toPersianDigits(dealershipTotals.investorCount)} سرمایه‌گذار
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                تأمین مالی مشارکتی، تخصیص اصل سرمایه به معاملات خودرویی، تسویه سود قطعی و عودت سرمایه بدون اختلاط با درآمدهای جاری نمایشگاه
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewInvestorModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer self-end md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>افتتاح پرونده سرمایه‌گذار جدید</span>
        </button>
      </div>

      {/* Accounting Compliance Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">
            ضوابط تفکیک ۴ گانه اشخاص و عدم تورم درآمدها:
          </p>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            ۱. واریز اصل سرمایه سرمایه‌گذار هرگز به عنوان درآمد فروش یا سود نمایشگاه شناسایی نمی‌شود.
            ۲. شخصیت حقوقی و مالی سرمایه‌گذار کاملاً از مالک خودروی امانی و مشتری خریدار مجزا نگهداری می‌گردد.
          </p>
        </div>
      </div>

      {/* Dealership Capital Macro Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capital */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>کل سرمایه تأمین‌شده</span>
            <WalletCards className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-white">
              {formatToman(dealershipTotals.totalCap)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>مجموع اصل سرمایه‌ها</span>
            <span className="font-en-num text-zinc-400">{toPersianDigits(dealershipTotals.investorCount)} پرونده</span>
          </div>
        </div>

        {/* Active Allocated */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20 flex flex-col justify-between bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-300 text-xs">
            <span>سرمایه در گردش معاملات فعال</span>
            <Car className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-sky-300">
              {formatToman(dealershipTotals.activeAlloc)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-sky-400/80">
            تخصیص‌یافته به خودروهای موجود نمایشگاه
          </div>
        </div>

        {/* Unallocated Capital */}
        <div className="glass-panel p-4 rounded-xl border border-teal-500/20 flex flex-col justify-between bg-teal-950/10">
          <div className="flex items-center justify-between text-teal-300 text-xs">
            <span>سرمایه آزاد و آماده به‌کار</span>
            <Coins className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-teal-300">
              {formatToman(dealershipTotals.unallocated)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-teal-400/80">
            سرمایه راکد آماده تخصیص به خودروهای جدید
          </div>
        </div>

        {/* Total Dealership Liability */}
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 flex flex-col justify-between bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>مجموع تعهدات باز به سرمایه‌گذاران</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-amber-300">
              {formatToman(dealershipTotals.totalLiability)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/80">
            مجموع اصل سرمایه + سودهای پرداخت‌نشده
          </div>
        </div>
      </div>

      {/* Main Layout: Investor List & Detailed Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Sidebar: Investors List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="glass-panel p-3 rounded-xl flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>فهرست سرمایه‌گذاران</span>
            </span>
            <span className="text-[11px] font-en-num text-zinc-500">
              {toPersianDigits(investorProfiles.length)} نفر
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {investorProfiles.map((inv) => {
              const summary = investorSummaries.find((s) => s.investorId === inv.id);
              const isSelected = selectedInvestor?.id === inv.id;

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvestorId(inv.id)}
                  className={`glass-panel p-3.5 rounded-xl border transition-all cursor-pointer text-right flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">{inv.name}</h4>
                      <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                        {toPersianDigits(inv.phone)}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        inv.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {inv.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>

                  {summary && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">سرمایه در گردش:</span>
                      <span className="font-bold font-en-num text-emerald-400">
                        {formatToman(summary.totalContributedCapital)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Investor Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedInvestor && selectedSummary ? (
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 space-y-5">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                      {selectedInvestor.name}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      سرمایه‌گذار تجاری
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                    <span>همراه: {toPersianDigits(selectedInvestor.phone)}</span>
                    {selectedInvestor.nationalId && <span>• کدملی: {toPersianDigits(selectedInvestor.nationalId)}</span>}
                    <span>• پیوستن: {toPersianDigits(selectedInvestor.joinedDate)}</span>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      if (liveFinancialAccounts.length > 0) {
                        setContribDestAccountId(liveFinancialAccounts[0].id);
                      }
                      setIsContributionModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>واریز سرمایه</span>
                  </button>

                  <button
                    onClick={() => setIsAllocateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600/80 hover:bg-sky-500 text-white transition-all cursor-pointer"
                  >
                    <Car className="w-3.5 h-3.5 text-sky-200" />
                    <span>تخصیص به معامله</span>
                  </button>

                  <button
                    onClick={() => {
                      if (liveFinancialAccounts.length > 0) {
                        setStlSourceAccountId(liveFinancialAccounts[0].id);
                      }
                      setIsSettlementModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>تسویه و پرداخت</span>
                  </button>
                </div>
              </div>

              {/* Investor Micro Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-400 block text-[11px]">سرمایه کل واریزی:</span>
                  <span className="text-sm sm:text-base font-bold font-en-num text-white mt-1 block">
                    {formatToman(selectedSummary.totalContributedCapital)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20">
                  <span className="text-sky-300 block text-[11px]">سرمایه در گردش خودرو:</span>
                  <span className="text-sm sm:text-base font-bold font-en-num text-sky-200 mt-1 block">
                    {formatToman(selectedSummary.activeAllocatedCapital)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/20">
                  <span className="text-teal-300 block text-[11px]">سرمایه آزاد (آماده):</span>
                  <span className="text-sm sm:text-base font-bold font-en-num text-teal-200 mt-1 block">
                    {formatToman(selectedSummary.unallocatedCapital)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <span className="text-amber-300 block text-[11px]">سود محقق‌شده کل:</span>
                  <span className="text-sm sm:text-base font-bold font-en-num text-amber-200 mt-1 block">
                    {formatToman(selectedSummary.totalRealizedProfit)}
                  </span>
                </div>
              </div>

              {/* Sub-tabs inside profile */}
              <div className="flex items-center gap-1 border-b border-white/10 pb-2">
                {[
                  { id: 'statement', label: 'صورت‌حساب و بیلان مالی' },
                  { id: 'contributions', label: `واریزی‌های سرمایه (${toPersianDigits(selectedInvestor.contributions.length)})` },
                  { id: 'allocations', label: `تخصیص به معاملات (${toPersianDigits(selectedInvestor.allocations.length)})` },
                  { id: 'settlements', label: `تسویه‌ها و پرداختی‌ها (${toPersianDigits(selectedInvestor.settlements.length)})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeProfileTab === tab.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Statement */}
              {activeProfileTab === 'statement' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>مجموع سرمایه تأمین‌شده:</span>
                      <span className="font-bold font-en-num text-white">
                        {formatToman(selectedSummary.totalContributedCapital)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>اصل سرمایه عودت‌داده‌شده تاکنون:</span>
                      <span className="font-bold font-en-num text-rose-300">
                        -{formatToman(selectedSummary.totalCapitalRepaid)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300 pt-2 border-t border-zinc-800">
                      <span>کل سود محقق‌شده از معاملات خودرویی:</span>
                      <span className="font-bold font-en-num text-emerald-400">
                        +{formatToman(selectedSummary.totalRealizedProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>سود پرداخت‌شده به سرمایه‌گذار:</span>
                      <span className="font-bold font-en-num text-sky-300">
                        -{formatToman(selectedSummary.totalProfitSettled)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-amber-300 pt-2 border-t border-zinc-800 font-bold">
                      <span>سود معوق در انتظار تسویه:</span>
                      <span className="font-en-num text-amber-200">
                        {formatToman(selectedSummary.unsettledProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white pt-2 border-t border-zinc-700/80 font-bold text-sm bg-zinc-950/40 p-2.5 rounded-lg">
                      <span>مانده کل تعهد نمایشگاه به این سرمایه‌گذار:</span>
                      <span className="font-en-num text-emerald-400">
                        {formatToman(selectedSummary.currentDealershipLiability)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Contributions */}
              {activeProfileTab === 'contributions' && (
                <div className="space-y-2">
                  {selectedInvestor.contributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-200">
                              {c.channel === 'company_account'
                                ? `واریز به ${c.destinationAccountName || 'حساب شرکت'}`
                                : `پرداخت مستقیم به ${c.sellerOrOwnerName || 'فروشنده'}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {c.channel === 'company_account' ? 'حساب نمایشگاه' : 'مستقیم به فروشنده'}
                            </span>
                          </div>
                          {c.supportingDocument && (
                            <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                              سند: {c.supportingDocument}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="font-bold font-en-num text-emerald-400 text-sm block">
                          +{formatToman(c.amount)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {toPersianDigits(c.date)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {selectedInvestor.contributions.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      هیچ واریز سرمایه‌ای ثبت نشده است.
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Allocations */}
              {activeProfileTab === 'allocations' && (
                <div className="space-y-3">
                  {selectedInvestor.allocations.map((a) => {
                    const isActive = a.status === 'active';
                    return (
                      <div
                        key={a.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 text-xs ${
                          isActive
                            ? 'bg-zinc-900/80 border-sky-500/30'
                            : 'bg-zinc-900/40 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <Car className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-zinc-500'}`} />
                            <div>
                              <h4 className="font-bold text-zinc-100">{a.vehicleLabel}</h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-mono">
                                {a.contractNumber && <span>قرارداد: {a.contractNumber}</span>}
                                <span>• تاریخ: {toPersianDigits(a.allocationDate)}</span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isActive ? 'در جریان معامله' : 'خروج و تسویه شده'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px]">
                          <div>
                            <span className="text-zinc-500 block">سرمایه اختصاص‌یافته:</span>
                            <span className="font-bold font-en-num text-zinc-200 mt-0.5 block">
                              {formatToman(a.allocatedCapital)}
                            </span>
                          </div>

                          <div>
                            <span className="text-zinc-500 block">سهم سود توافقی:</span>
                            <span className="font-bold font-en-num text-amber-300 mt-0.5 block">
                              {a.profitSharePercentage ? `%${toPersianDigits(a.profitSharePercentage)} از سود` : `${formatToman(a.agreedFixedProfit || 0)} ثابت`}
                            </span>
                          </div>

                          <div>
                            <span className="text-zinc-500 block">سود شناسایی‌شده:</span>
                            <span className="font-bold font-en-num text-emerald-400 mt-0.5 block">
                              {a.realizedProfit ? formatToman(a.realizedProfit) : 'در حال فروش'}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <div className="flex items-center justify-end pt-1">
                            <button
                              onClick={() => {
                                setTargetAllocationForExit(a);
                                setExitRealizedProfit(Math.round(a.allocatedCapital * 0.08)); // default sample 8%
                                setIsExitAllocationModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>خروج معامله و شناسایی سود</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {selectedInvestor.allocations.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      هیچ تخصیص معامله‌ای برای این سرمایه‌گذار ثبت نشده است.
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 4: Settlements */}
              {activeProfileTab === 'settlements' && (
                <div className="space-y-2">
                  {selectedInvestor.settlements.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-4 h-4 text-sky-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-200">
                              {s.type === 'profit_distribution' ? 'پرداخت سود معامله' : 'عودت اصل سرمایه'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                              سند: {s.settlementNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                            {s.sourceAccountName || 'حساب بانکی'} • پیگیری: {s.trackingNumber || 'ثبت دستی'}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="font-bold font-en-num text-sky-300 text-sm block">
                          -{formatToman(s.amount)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {toPersianDigits(s.date)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {selectedInvestor.settlements.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      هیچ پرداخت یا تسویه‌ای ثبت نشده است.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-zinc-500 rounded-2xl">
              سرمایه‌گذاری برای نمایش انتخاب نشده است.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Investor */}
      {isNewInvestorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-100">افتتاح پرونده سرمایه‌گذار جدید</h3>
              </div>
              <button
                onClick={() => setIsNewInvestorModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvestor} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">نام و نام خانوادگی سرمایه‌گذار:</label>
                <input
                  type="text"
                  required
                  value={newInvName}
                  onChange={(e) => setNewInvName(e.target.value)}
                  placeholder="مثلاً: حاج احمد عبدالهی"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">شماره همراه:</label>
                <input
                  type="text"
                  required
                  value={newInvPhone}
                  onChange={(e) => setNewInvPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 text-left"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">کد ملی (اختیاری):</label>
                <input
                  type="text"
                  value={newInvNationalId}
                  onChange={(e) => setNewInvNationalId(e.target.value)}
                  placeholder="کد ملی ۱۰ رقمی"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 text-center"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">یادداشت و توافقات اولیه:</label>
                <textarea
                  rows={2}
                  value={newInvNotes}
                  onChange={(e) => setNewInvNotes(e.target.value)}
                  placeholder="شرایط شراکت و سرمایه‌گذاری..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewInvestorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  تشکیل پرونده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Contribution */}
      {isContributionModalOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">واریز سرمایه جدید</h3>
                  <p className="text-xs text-zinc-400">{selectedInvestor.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsContributionModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">عدم شناسایی درآمد برای شرکت:</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  این مبلغ صرفاً اصل سرمایه است و در سرفصل بدهی‌های نمایشگاه به سرمایه‌گذار می‌نشیند و به هیچ‌عنوان درآمد معامله خودرویی محسوب نمی‌شود.
                </p>
              </div>
            </div>

            <form onSubmit={handleRecordContribution} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">تاریخ واریز:</label>
                  <input
                    type="text"
                    required
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">کانال واریز وجه:</label>
                  <select
                    value={contribChannel}
                    onChange={(e) => setContribChannel(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="company_account">واریز به حساب بانکی / صندوق نمایشگاه</option>
                    <option value="direct_to_seller">پرداخت مستقیم به فروشنده خودرو (خارج از صندوق)</option>
                  </select>
                </div>
              </div>

              {contribChannel === 'company_account' ? (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">واریز به کدام حساب نمایشگاه:</label>
                  <select
                    value={contribDestAccountId}
                    onChange={(e) => setContribDestAccountId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {liveFinancialAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatToman(a.currentBalance || 0)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">نام فروشنده یا مالک دریافت‌کننده وجه:</label>
                  <input
                    type="text"
                    required
                    value={contribSellerName}
                    onChange={(e) => setContribSellerName(e.target.value)}
                    placeholder="مثلاً: نمایندگی مدیران خودرو"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مبلغ واریز سرمایه (تومان):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={contribAmount || ''}
                  onChange={(e) => setContribAmount(Number(e.target.value))}
                  placeholder="مبلغ را به تومان وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  معادل: {formatToman(contribAmount || 0)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">شماره سند / فیش بانکی / پیگیری:</label>
                <input
                  type="text"
                  value={contribDoc}
                  onChange={(e) => setContribDoc(e.target.value)}
                  placeholder="شماره فیش ساتنا، پایا یا چک"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات (اختیاری):</label>
                <textarea
                  rows={2}
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  placeholder="توضیحات تکمیلی..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsContributionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={contribAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-950/40"
                >
                  ثبت واریز سرمایه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Investor Capital to Deal */}
      {isAllocateModalOpen && selectedInvestor && selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">تخصیص سرمایه به خودرو / معامله</h3>
                  <p className="text-xs text-zinc-400">سرمایه‌گذار: {selectedInvestor.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-between">
              <span>سرمایه آزاد و در دسترس برای تخصیص:</span>
              <span className="font-bold font-en-num text-teal-200 text-sm">
                {formatToman(selectedSummary.unallocatedCapital)}
              </span>
            </div>

            <form onSubmit={handleAllocateToDeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">انتخاب خودرو از موجودی نمایشگاه:</label>
                <select
                  value={allocVehId}
                  onChange={(e) => {
                    const vId = e.target.value;
                    setAllocVehId(vId);
                    const v = vehicles.find((item) => item.id === vId);
                    if (v) setAllocVehLabel(v.fullName);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="">انتخاب خودرو...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.fullName} ({v.plate || 'بدون پلاک'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">عنوان خودرو / معامله:</label>
                <input
                  type="text"
                  required
                  value={allocVehLabel}
                  onChange={(e) => setAllocVehLabel(e.target.value)}
                  placeholder="مثلاً: هیوندای سانتافه ۲۰۱۷ مشکی"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مبلغ سرمایه تخصیصی (تومان):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedSummary.unallocatedCapital}
                  value={allocAmount || ''}
                  onChange={(e) => setAllocAmount(Number(e.target.value))}
                  placeholder="مبلغ را وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-sky-400 mt-1 block">
                  معادل: {formatToman(allocAmount || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">درصد سهم سود سرمایه‌گذار (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={allocProfitShare}
                    onChange={(e) => setAllocProfitShare(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-sky-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">یا سود مقطوع/ثابت (تومان):</label>
                  <input
                    type="number"
                    min={0}
                    value={allocFixedProfit || ''}
                    onChange={(e) => setAllocFixedProfit(Number(e.target.value))}
                    placeholder="در صورت توافق سود ثابت"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-sky-500 text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات و شرایط اختصاص:</label>
                <textarea
                  rows={2}
                  value={allocNotes}
                  onChange={(e) => setAllocNotes(e.target.value)}
                  placeholder="شرایط معامله، موعد خروج و..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={allocAmount <= 0 || allocAmount > selectedSummary.unallocatedCapital || !allocVehLabel.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-950/40"
                >
                  ثبت تخصیص سرمایه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Exit Allocation and Realize Profit */}
      {isExitAllocationModalOpen && targetAllocationForExit && selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">تسویه معامله و خروج سرمایه‌گذاری</h3>
                  <p className="text-xs text-zinc-400">{targetAllocationForExit.vehicleLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExitAllocationModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <p className="font-semibold">آزادسازی اصل سرمایه و محاسبه سود:</p>
              <p className="text-[11px] text-amber-200/80">
                اصل سرمایه به مبلغ <strong className="font-en-num">{formatToman(targetAllocationForExit.allocatedCapital)}</strong> به حساب سرمایه آزاد برگردانده شده و سود محقق‌شده به کیف‌پول طلب سرمایه‌گذار اضافه خواهد شد.
              </p>
            </div>

            <form onSubmit={handleExitAllocation} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">تاریخ خروج و تسویه معامله:</label>
                <input
                  type="text"
                  required
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500 text-center"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">سود قطعی و محقق‌شده سرمایه‌گذار (تومان):</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={exitRealizedProfit || ''}
                  onChange={(e) => setExitRealizedProfit(Number(e.target.value))}
                  placeholder="مبلغ سود قطعی را وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-amber-400 mt-1 block">
                  معادل: {formatToman(exitRealizedProfit || 0)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات خروج:</label>
                <textarea
                  rows={2}
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                  placeholder="نحوه فروش خودرو، تسویه خریدار و..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsExitAllocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  تأیید خروج و ثبت سود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Settlement / Payout to Investor */}
      {isSettlementModalOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">پرداخت وجه به سرمایه‌گذار</h3>
                  <p className="text-xs text-zinc-400">{selectedInvestor.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSettlement} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">نوع پرداختی:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStlType('profit_distribution')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      stlType === 'profit_distribution'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    پرداخت سود معامله
                  </button>

                  <button
                    type="button"
                    onClick={() => setStlType('capital_repayment')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      stlType === 'capital_repayment'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    عودت اصل سرمایه
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">تاریخ پرداخت:</label>
                  <input
                    type="text"
                    required
                    value={stlDate}
                    onChange={(e) => setStlDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-sky-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">روش پرداخت:</label>
                  <select
                    value={stlMethod}
                    onChange={(e) => setStlMethod(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="bank_transfer">حواله پایا / ساتنا</option>
                    <option value="cash">نقدی از صندوق</option>
                    <option value="cheque">چک بانکی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">پرداخت از کدام حساب نمایشگاه:</label>
                <select
                  value={stlSourceAccountId}
                  onChange={(e) => setStlSourceAccountId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {liveFinancialAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatToman(a.currentBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مبلغ پرداختی (تومان):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={stlAmount || ''}
                  onChange={(e) => setStlAmount(Number(e.target.value))}
                  placeholder="مبلغ را وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-sky-400 mt-1 block">
                  معادل: {formatToman(stlAmount || 0)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">شماره سند / پیگیری بانکی:</label>
                <input
                  type="text"
                  value={stlTracking}
                  onChange={(e) => setStlTracking(e.target.value)}
                  placeholder="شماره پیگیری فیش ساتنا، پایا یا شماره چک"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات و بابت پرداخت:</label>
                <textarea
                  rows={2}
                  value={stlNotes}
                  onChange={(e) => setStlNotes(e.target.value)}
                  placeholder="توضیحات تکمیلی..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={stlAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-950/40"
                >
                  تأیید و ثبت پرداخت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
