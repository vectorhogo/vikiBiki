import React, { useState, useMemo } from 'react';
import {
  DealCommission,
  CommissionPayment,
  CommissionPayer,
  CommissionStatus,
} from '../types/finance09b';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  Coins,
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Car,
  Search,
  Filter,
  X,
  FileCheck,
  ShieldCheck,
  ArrowDownLeft,
  ChevronDown,
  Building2,
  Users,
} from 'lucide-react';

export const CommissionsView: React.FC = () => {
  const {
    dealCommissions,
    liveFinancialAccounts,
    contracts,
    vehicles,
    addDealCommission,
    registerCommissionPayment,
  } = useAccounting();

  const [statusFilter, setStatusFilter] = useState<'all' | CommissionStatus>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isNewCommissionModalOpen, setIsNewCommissionModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedCommissionForCollection, setSelectedCommissionForCollection] = useState<DealCommission | null>(null);

  // New Commission Form State
  const [newCommContractId, setNewCommContractId] = useState('');
  const [newCommVehicleId, setNewCommVehicleId] = useState('');
  const [newCommVehicleLabel, setNewCommVehicleLabel] = useState('');
  const [newCommTotal, setNewCommTotal] = useState<number>(0);
  const [newCommPayer, setNewCommPayer] = useState<CommissionPayer>('both');
  const [newCommBuyerName, setNewCommBuyerName] = useState('');
  const [newCommBuyerShare, setNewCommBuyerShare] = useState<number>(0);
  const [newCommSellerName, setNewCommSellerName] = useState('');
  const [newCommSellerShare, setNewCommSellerShare] = useState<number>(0);
  const [newCommNotes, setNewCommNotes] = useState('');

  // Collect Commission Form State
  const [collectDate, setCollectDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [collectPayerRole, setCollectPayerRole] = useState<'buyer' | 'seller'>('buyer');
  const [collectPayerName, setCollectPayerName] = useState('');
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'pos' | 'bank_transfer' | 'cash' | 'cheque'>('pos');
  const [collectDestAccountId, setCollectDestAccountId] = useState('');
  const [collectTracking, setCollectTracking] = useState('');
  const [collectNotes, setCollectNotes] = useState('');

  // Metrics
  const metrics = useMemo(() => {
    let totalAgreed = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;

    dealCommissions.forEach((c) => {
      totalAgreed += c.totalAgreedCommission;
      totalReceived += c.receivedAmount;
      totalOutstanding += c.outstandingAmount;
    });

    const collectionRate = totalAgreed > 0 ? Math.round((totalReceived / totalAgreed) * 100) : 0;

    return {
      totalAgreed,
      totalReceived,
      totalOutstanding,
      collectionRate,
      count: dealCommissions.length,
      unsettledCount: dealCommissions.filter((c) => c.status !== 'settled').length,
    };
  }, [dealCommissions]);

  // Filtered Commissions
  const filteredCommissions = useMemo(() => {
    return dealCommissions.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchVeh = c.vehicleLabel.toLowerCase().includes(q);
        const matchNum = c.contractNumber?.toLowerCase().includes(q);
        const matchBuyer = c.buyerName?.toLowerCase().includes(q);
        const matchSeller = c.sellerName?.toLowerCase().includes(q);
        if (!matchVeh && !matchNum && !matchBuyer && !matchSeller) return false;
      }
      return true;
    });
  }, [dealCommissions, statusFilter, searchTerm]);

  const handleSelectContractForCommission = (cId: string) => {
    setNewCommContractId(cId);
    const contract = contracts.find((c) => c.id === cId);
    if (contract) {
      setNewCommVehicleId(contract.vehicleId);
      setNewCommVehicleLabel(contract.vehicleLabel);
      setNewCommBuyerName(contract.parties.buyer.name);
      setNewCommSellerName(contract.parties.seller.name);
    }
  };

  const handleTotalCommissionChange = (val: number, payer: CommissionPayer) => {
    setNewCommTotal(val);
    if (payer === 'both') {
      const half = Math.round(val / 2);
      setNewCommBuyerShare(half);
      setNewCommSellerShare(val - half);
    } else if (payer === 'buyer') {
      setNewCommBuyerShare(val);
      setNewCommSellerShare(0);
    } else {
      setNewCommBuyerShare(0);
      setNewCommSellerShare(val);
    }
  };

  const handleCreateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommVehicleLabel.trim() || newCommTotal <= 0) return;

    addDealCommission({
      contractId: newCommContractId || undefined,
      contractNumber: contracts.find((c) => c.id === newCommContractId)?.contractNumber,
      vehicleId: newCommVehicleId || undefined,
      vehicleLabel: newCommVehicleLabel.trim(),
      agreementDate: DEALERSHIP_CURRENT_DATE,
      totalAgreedCommission: Number(newCommTotal),
      payer: newCommPayer,
      buyerName: newCommBuyerName.trim() || undefined,
      buyerShare: Number(newCommBuyerShare) || 0,
      sellerName: newCommSellerName.trim() || undefined,
      sellerShare: Number(newCommSellerShare) || 0,
      notes: newCommNotes.trim() || undefined,
    });

    setIsNewCommissionModalOpen(false);
    setNewCommContractId('');
    setNewCommVehicleId('');
    setNewCommVehicleLabel('');
    setNewCommTotal(0);
    setNewCommBuyerShare(0);
    setNewCommSellerShare(0);
    setNewCommNotes('');
  };

  const openCollectionModal = (comm: DealCommission) => {
    setSelectedCommissionForCollection(comm);
    setCollectAmount(comm.outstandingAmount);
    setCollectPayerRole(comm.buyerShare > 0 ? 'buyer' : 'seller');
    setCollectPayerName(comm.buyerName || comm.sellerName || 'طرف معامله');
    if (liveFinancialAccounts.length > 0) {
      setCollectDestAccountId(liveFinancialAccounts[0].id);
    }
    setIsCollectModalOpen(true);
  };

  const handleExecuteCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommissionForCollection || collectAmount <= 0) return;

    const res = registerCommissionPayment({
      commissionId: selectedCommissionForCollection.id,
      date: collectDate,
      payerRole: collectPayerRole,
      payerName: collectPayerName.trim(),
      amount: Number(collectAmount),
      paymentMethod: collectMethod,
      destinationAccountId: collectDestAccountId || undefined,
      trackingNumber: collectTracking.trim() || undefined,
      notes: collectNotes.trim() || undefined,
    });

    if (res.success) {
      setIsCollectModalOpen(false);
      setSelectedCommissionForCollection(null);
      setCollectAmount(0);
      setCollectTracking('');
      setCollectNotes('');
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* Top Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>مدیریت کمیسیون‌ها و کارمزد معاملات</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-en-num">
                  {toPersianDigits(metrics.count)} پرونده توافق
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                تعیین دقیق سهم کمیسیون خریدار و فروشنده، پیگیری وصول اقساطی کارمزد و ثبت مستقیم درآمد در حساب‌های خزانه‌داری
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewCommissionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-950/40 transition-all cursor-pointer self-end md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>توافق کمیسیون جدید</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Agreed */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>کل کمیسیون توافق‌شده</span>
            <Coins className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-white">
              {formatToman(metrics.totalAgreed)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>مجموع توافق‌نامه‌ها</span>
            <span className="font-en-num text-zinc-400">{toPersianDigits(metrics.count)} فقره</span>
          </div>
        </div>

        {/* Collected Commission */}
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span>کمیسیون وصول‌شده (درآمد محقق)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-emerald-300">
              {formatToman(metrics.totalReceived)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/80">
            ثبت در سرفصل درآمد کمیسیون و حق‌العمل
          </div>
        </div>

        {/* Outstanding Commission */}
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 flex flex-col justify-between bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>کمیسیون معوق و در انتظار وصول</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-amber-300">
              {formatToman(metrics.totalOutstanding)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/80 flex items-center justify-between">
            <span>مطالبات باقی‌مانده</span>
            <span className="font-en-num">{toPersianDigits(metrics.unsettledCount)} پرونده</span>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20 flex flex-col justify-between bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-300 text-xs">
            <span>نرخ وصول کمیسیون</span>
            <FileCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-en-num text-sky-300">
              %{toPersianDigits(metrics.collectionRate)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-sky-400/80">
            نسبت مطالبات وصول‌شده به کل
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'همه کمیسیون‌ها' },
            { id: 'unpaid', label: 'کاملاً معوق' },
            { id: 'partially_paid', label: 'وصول جزئی' },
            { id: 'settled', label: 'تسویه کامل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در خودرو، قرارداد یا طرفین..."
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pr-8 pl-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Commissions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCommissions.map((comm) => {
          const isSettled = comm.status === 'settled';
          const isPartial = comm.status === 'partially_paid';

          return (
            <div
              key={comm.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{comm.vehicleLabel}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-mono">
                        {comm.contractNumber && (
                          <span className="text-amber-400 font-semibold">{comm.contractNumber}</span>
                        )}
                        <span>•</span>
                        <span>{toPersianDigits(comm.agreementDate)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSettled
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isPartial
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isSettled ? 'تسویه کامل' : isPartial ? 'وصول بخشی' : 'معوق'}
                  </span>
                </div>

                {/* Financial Breakdown Table */}
                <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>مبلغ کل توافق‌شده:</span>
                    <span className="font-bold font-en-num text-white text-sm">
                      {formatToman(comm.totalAgreedCommission)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-[11px]">
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <div className="text-zinc-400">سهم خریدار:</div>
                      <div className="font-bold font-en-num text-zinc-200 mt-0.5">
                        {formatToman(comm.buyerShare)}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {comm.buyerName || 'خریدار'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <div className="text-zinc-400">سهم فروشنده:</div>
                      <div className="font-bold font-en-num text-zinc-200 mt-0.5">
                        {formatToman(comm.sellerShare)}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {comm.sellerName || 'فروشنده / مالک'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>وصول‌شده: <strong className="font-en-num text-emerald-400">{formatToman(comm.receivedAmount)}</strong></span>
                      <span>مانده: <strong className="font-en-num text-amber-400">{formatToman(comm.outstandingAmount)}</strong></span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((comm.receivedAmount / comm.totalAgreedCommission) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Payments History in this commission */}
                {comm.payments && comm.payments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[11px] text-zinc-400 font-semibold">پرداختی‌های ثبت‌شده:</div>
                    {comm.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-zinc-300">{p.payerName} ({p.payerRole === 'buyer' ? 'خریدار' : 'فروشنده'})</span>
                          {p.destinationAccountName && (
                            <span className="text-zinc-500 text-[10px] truncate max-w-[120px]">
                              → {p.destinationAccountName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-en-num text-emerald-400">
                            +{formatToman(p.amount)}
                          </span>
                          <span className="text-zinc-500 font-mono text-[10px]">
                            {toPersianDigits(p.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {comm.notes && (
                  <p className="text-[11px] text-zinc-500 mt-2 italic">
                    {comm.notes}
                  </p>
                )}
              </div>

              {/* Card Footer: Action */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">مانده قابل وصول:</span>
                  <span className={`text-base font-bold font-en-num ${comm.outstandingAmount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {formatToman(comm.outstandingAmount)}
                  </span>
                </div>

                {comm.outstandingAmount > 0 ? (
                  <button
                    onClick={() => openCollectionModal(comm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30 transition-all cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>وصول کمیسیون</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تسویه و واریز شد</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredCommissions.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 glass-panel rounded-2xl">
            <Coins className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
            <p className="text-sm font-semibold">پرونده کمیسیونی یافت نشد</p>
            <p className="text-xs text-zinc-500 mt-1">با معیارهای فیلتر فعلی موردی وجود ندارد.</p>
          </div>
        )}
      </div>

      {/* Modal: New Commission Agreement */}
      {isNewCommissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-zinc-100">تنظیم توافق‌نامه کمیسیون معامله</h3>
              </div>
              <button
                onClick={() => setIsNewCommissionModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommission} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">اتصال به قرارداد (اختیاری):</label>
                <select
                  value={newCommContractId}
                  onChange={(e) => handleSelectContractForCommission(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">انتخاب از قراردادها و مبایعه‌نامه‌ها...</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contractNumber} — {c.vehicleLabel} ({c.contractType === 'sale' ? 'فروش' : 'خرید'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">عنوان خودرو / معامله:</label>
                <input
                  type="text"
                  required
                  value={newCommVehicleLabel}
                  onChange={(e) => setNewCommVehicleLabel(e.target.value)}
                  placeholder="مثلاً: تویوتا کمری گرند ۲۰۰۷"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">پرداخت‌کننده کمیسیون:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: 'خریدار و فروشنده (المناصفه)' },
                    { id: 'buyer', label: 'فقط خریدار' },
                    { id: 'seller', label: 'فقط فروشنده' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setNewCommPayer(p.id as CommissionPayer);
                        handleTotalCommissionChange(newCommTotal, p.id as CommissionPayer);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                        newCommPayer === p.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مبلغ کل کمیسیون (تومان):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newCommTotal || ''}
                  onChange={(e) => handleTotalCommissionChange(Number(e.target.value), newCommPayer)}
                  placeholder="مبلغ کل کارمزد را وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-amber-400 mt-1 block">
                  معادل: {formatToman(newCommTotal || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">نام خریدار و سهم:</label>
                  <input
                    type="text"
                    value={newCommBuyerName}
                    onChange={(e) => setNewCommBuyerName(e.target.value)}
                    placeholder="نام خریدار"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 mb-1 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newCommBuyerShare || ''}
                    onChange={(e) => setNewCommBuyerShare(Number(e.target.value))}
                    placeholder="سهم خریدار (تومان)"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-en-num focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">نام فروشنده و سهم:</label>
                  <input
                    type="text"
                    value={newCommSellerName}
                    onChange={(e) => setNewCommSellerName(e.target.value)}
                    placeholder="نام فروشنده"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 mb-1 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newCommSellerShare || ''}
                    onChange={(e) => setNewCommSellerShare(Number(e.target.value))}
                    placeholder="سهم فروشنده (تومان)"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-en-num focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات و شرایط توافق:</label>
                <textarea
                  rows={2}
                  value={newCommNotes}
                  onChange={(e) => setNewCommNotes(e.target.value)}
                  placeholder="شرایط زمان وصول، موکول به تعویض پلاک و..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewCommissionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={newCommTotal <= 0 || !newCommVehicleLabel.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-950/40"
                >
                  ثبت پرونده کمیسیون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect Commission Payment */}
      {isCollectModalOpen && selectedCommissionForCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">وصول و دریافت وجه کمیسیون</h3>
                  <p className="text-xs text-zinc-400">{selectedCommissionForCollection.vehicleLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">تأثیر مستقیم بر درآمدهای نمایشگاه:</p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  وصول این وجه به صورت مستقیم یک ردیف درآمد (Income) در سرفصل «کمیسیون و حق‌العمل» ثبت کرده و موجودی حساب انتخابی را افزایش می‌دهد.
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteCollection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">طرف پرداخت‌کننده:</label>
                  <select
                    value={collectPayerRole}
                    onChange={(e) => {
                      const role = e.target.value as 'buyer' | 'seller';
                      setCollectPayerRole(role);
                      setCollectPayerName(
                        role === 'buyer'
                          ? selectedCommissionForCollection.buyerName || 'خریدار'
                          : selectedCommissionForCollection.sellerName || 'فروشنده'
                      );
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="buyer">خریدار ({selectedCommissionForCollection.buyerName || 'بدون نام'})</option>
                    <option value="seller">فروشنده ({selectedCommissionForCollection.sellerName || 'بدون نام'})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">نام پرداخت‌کننده:</label>
                  <input
                    type="text"
                    required
                    value={collectPayerName}
                    onChange={(e) => setCollectPayerName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">تاریخ وصول:</label>
                  <input
                    type="text"
                    required
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">روش دریافت:</label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="pos">کارت‌خوان پوز نمایشگاه</option>
                    <option value="bank_transfer">حواله پایا / ساتنا</option>
                    <option value="cash">نقدی به صندوق</option>
                    <option value="cheque">چک صیادی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">واریز به حساب / صندوق مقصد:</label>
                <select
                  value={collectDestAccountId}
                  onChange={(e) => setCollectDestAccountId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {liveFinancialAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatToman(a.currentBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مبلغ وصولی (تومان):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={collectAmount || ''}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  placeholder="مبلغ را به تومان وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-en-num focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  معادل: {formatToman(collectAmount || 0)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">شماره پیگیری / ارجاع / فیش:</label>
                <input
                  type="text"
                  value={collectTracking}
                  onChange={(e) => setCollectTracking(e.target.value)}
                  placeholder="شماره پیگیری فیش کارت‌خوان یا ارجاع بانکی"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات (اختیاری):</label>
                <textarea
                  rows={2}
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="توضیحات تکمیلی..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={collectAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-950/40"
                >
                  تأیید و ثبت وصول درآمد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
