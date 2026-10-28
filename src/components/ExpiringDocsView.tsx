import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { VehicleExpiringDoc, DocumentTypeCategory, PoaStatus } from '../types/patch09c';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Plus,
  Car,
  Calendar,
  Building,
  User,
  ExternalLink,
  Trash2,
  X,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

interface ExpiringDocsViewProps {
  onOpenVehicleDrawer?: (vehicleId: string) => void;
}

export const ExpiringDocsView: React.FC<ExpiringDocsViewProps> = ({ onOpenVehicleDrawer }) => {
  const {
    expiringDocs,
    vehicles,
    addExpiringDoc,
    updateExpiringDoc,
    deleteExpiringDoc,
    presets,
    checkPermission,
    showToast,
  } = useAccounting();

  const [activeFilter, setActiveFilter] = useState<'all' | 'expired' | 'critical' | 'urgent' | 'warning' | 'safe'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for new document
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentTypeCategory>('third_party_insurance');
  const [newTitle, setNewTitle] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newStartDate, setNewStartDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Insurance details
  const [insurerName, setInsurerName] = useState('بیمه ایران');
  const [coverageAmount, setCoverageAmount] = useState('100000000');
  const [discountPercent, setDiscountPercent] = useState('5');

  // POA details
  const [poaType, setPoaType] = useState<'received' | 'issued'>('received');
  const [notaryOffice, setNotaryOffice] = useState('');
  const [grantorName, setGrantorName] = useState('');
  const [grantorNationalId, setGrantorNationalId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentNationalId, setAgentNationalId] = useState('');
  const [poaSubject, setPoaSubject] = useState('تعویض پلاک و فک پلاک و انتقال سند');

  // Days left calculation relative to current dealership date (۱۴۰۵/۰۸/۰۱)
  const getDaysLeft = (expiryDateStr: string): number => {
    // Jalali date comparison: YYYY/MM/DD
    const [ey, em, ed] = expiryDateStr.split('/').map((s) => parseInt(s, 10));
    const [cy, cm, cd] = DEALERSHIP_CURRENT_DATE.split('/').map((s) => parseInt(s, 10));

    if (!ey || !em || !ed) return 999;
    const expiryApproxDays = ey * 365 + em * 30 + ed;
    const currentApproxDays = cy * 365 + cm * 30 + cd;
    return expiryApproxDays - currentApproxDays;
  };

  const getAlertLevel = (daysLeft: number): 'expired' | 'critical' | 'urgent' | 'warning' | 'safe' => {
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 1) return 'critical';
    if (daysLeft <= 7) return 'urgent';
    if (daysLeft <= 30) return 'warning';
    return 'safe';
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    let expired = 0;
    let critical = 0; // <= 1 day
    let urgent = 0; // <= 7 days
    let warning = 0; // <= 30 days
    let safe = 0;

    expiringDocs.forEach((doc) => {
      const days = getDaysLeft(doc.expiryDate);
      const level = getAlertLevel(days);
      if (level === 'expired') expired++;
      else if (level === 'critical') critical++;
      else if (level === 'urgent') urgent++;
      else if (level === 'warning') warning++;
      else safe++;
    });

    return {
      total: expiringDocs.length,
      expired,
      critical,
      urgent,
      warning,
      safe,
    };
  }, [expiringDocs]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return expiringDocs.filter((doc) => {
      const days = getDaysLeft(doc.expiryDate);
      const level = getAlertLevel(days);

      if (activeFilter !== 'all' && level !== activeFilter) return false;
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchNum = doc.documentNumber.toLowerCase().includes(q);
        const matchVeh = doc.vehicleLabel.toLowerCase().includes(q);
        const matchNotary = doc.poaDetails?.notaryOffice.toLowerCase().includes(q) || false;
        const matchParty =
          doc.poaDetails?.grantorName.toLowerCase().includes(q) ||
          doc.poaDetails?.agentName.toLowerCase().includes(q) ||
          false;
        if (!matchTitle && !matchNum && !matchVeh && !matchNotary && !matchParty) return false;
      }

      return true;
    });
  }, [expiringDocs, activeFilter, categoryFilter, searchQuery]);

  // Insurance companies from presets
  const insuranceCompanies = useMemo(() => {
    return presets.filter((p) => p.category === 'insurance_companies' && p.isActive);
  }, [presets]);

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleId || !newTitle.trim() || !newExpiryDate.trim() || !newDocNumber.trim()) {
      showToast('لطفاً فیلدهای ستاره‌دار را تکمیل کنید.', 'error');
      return;
    }

    const veh = vehicles.find((v) => v.id === newVehicleId);
    const vehicleLabel = veh ? `${veh.fullName} (${veh.plate || 'بدون پلاک'})` : 'خودرو';

    addExpiringDoc({
      vehicleId: newVehicleId,
      vehicleLabel,
      category: newCategory,
      title: newTitle.trim(),
      documentNumber: newDocNumber.trim(),
      startDate: newStartDate,
      expiryDate: newExpiryDate.trim(),
      notes: newNotes.trim() || undefined,
      insuranceDetails:
        newCategory === 'third_party_insurance' || newCategory === 'body_insurance'
          ? {
              insurerName,
              financialCoverageAmount: parseInt(coverageAmount, 10) || 0,
              hasDiscounts: parseInt(discountPercent, 10) > 0,
              discountPercent: parseInt(discountPercent, 10) || 0,
            }
          : undefined,
      poaDetails:
        newCategory === 'power_of_attorney'
          ? {
              poaType,
              notaryOffice: notaryOffice.trim() || 'دفترخانه اسناد رسمی',
              grantorName: grantorName.trim() || 'نامشخص',
              grantorNationalId: grantorNationalId.trim() || undefined,
              agentName: agentName.trim() || 'نمایشگاه اتو عبداللهی',
              agentNationalId: agentNationalId.trim() || undefined,
              subject: poaSubject.trim(),
              status: 'valid',
            }
          : undefined,
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewDocNumber('');
    setNewExpiryDate('');
    setNewNotes('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-zinc-100">سامانه هشدارها و سررسید اسناد خودروها</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            رصد تاریخ انقضای بیمه‌نامه‌ها، وکالت‌نامه‌های تعویض پلاک، معاینه فنی و مدارک قانونی خودروها با هشدارهای چندسطحی
          </p>
        </div>

        {checkPermission('manage_vehicles') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-minimal-amber inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ثبت بیمه‌نامه / وکالت‌نامه جدید</span>
          </button>
        )}
      </div>

      {/* Threshold KPI Alert Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Expired */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'expired' ? 'all' : 'expired')}
          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
            activeFilter === 'expired'
              ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40'
              : 'bg-zinc-900/60 border-rose-500/30 hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400">منقضی‌شده</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-en-num text-rose-200 mt-1">{toPersianDigits(metrics.expired)}</div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">فاقد اعتبار قانونی</span>
        </button>

        {/* Critical (1 Day) */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'critical' ? 'all' : 'critical')}
          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
            activeFilter === 'critical'
              ? 'bg-rose-900/30 border-rose-400 shadow-md'
              : 'bg-zinc-900/60 border-rose-400/20 hover:border-rose-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300">بحرانی (۱ روز)</span>
            <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-en-num text-rose-100 mt-1">{toPersianDigits(metrics.critical)}</div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">انقضا تا ۲۴ ساعت آینده</span>
        </button>

        {/* Urgent (7 Days) */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'urgent' ? 'all' : 'urgent')}
          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
            activeFilter === 'urgent'
              ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/40'
              : 'bg-zinc-900/60 border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400">فوری (تا ۷ روز)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-en-num text-amber-200 mt-1">{toPersianDigits(metrics.urgent)}</div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">اقدام برای تمدید فوری</span>
        </button>

        {/* Warning (30 Days) */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'warning' ? 'all' : 'warning')}
          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
            activeFilter === 'warning'
              ? 'bg-yellow-950/30 border-yellow-500 shadow-md'
              : 'bg-zinc-900/60 border-yellow-500/20 hover:border-yellow-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-yellow-400">هشدار (تا ۳۰ روز)</span>
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl font-bold font-en-num text-yellow-200 mt-1">{toPersianDigits(metrics.warning)}</div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">برنامه‌ریزی تمدید</span>
        </button>

        {/* Safe (> 30 Days) */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'safe' ? 'all' : 'safe')}
          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeFilter === 'safe'
              ? 'bg-emerald-950/30 border-emerald-500 shadow-md'
              : 'bg-zinc-900/60 border-emerald-500/20 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400">معتبر (بیش از ۳۰ روز)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-en-num text-emerald-200 mt-1">{toPersianDigits(metrics.safe)}</div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">وضعیت پایدار</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="جستجو بر اساس خودرو، شماره بیمه، دفترخانه، نام موکل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-zinc-200 focus:outline-none placeholder-zinc-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400">نوع مدرک:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 text-xs cursor-pointer focus:outline-none"
          >
            <option value="all">همه اسناد و مدارک</option>
            <option value="third_party_insurance">بیمه شخص ثالث</option>
            <option value="body_insurance">بیمه بدنه</option>
            <option value="power_of_attorney">وکالت‌نامه</option>
            <option value="technical_inspection">معاینه فنی</option>
            <option value="green_card">برگ سبز / سند</option>
          </select>

          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-amber-400 hover:text-amber-300 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[11px]"
            >
              حذف فیلتر وضعیت ✕
            </button>
          )}
        </div>
      </div>

      {/* Documents Table / Card List */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-xs">
            هیچ سند یا هشداری با فیلترهای انتخابی مطابقت ندارد.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const daysLeft = getDaysLeft(doc.expiryDate);
            const level = getAlertLevel(daysLeft);

            const badgeStyles = {
              expired: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
              critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
              urgent: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
              safe: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            }[level];

            const statusText =
              daysLeft < 0
                ? `${toPersianDigits(Math.abs(daysLeft))} روز قبل منقضی شده`
                : daysLeft === 0
                ? 'امروز منقضی می‌شود!'
                : daysLeft === 1
                ? 'فردا منقضی می‌شود (بحرانی)'
                : `${toPersianDigits(daysLeft)} روز باقیمانده`;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border transition-all ${
                  level === 'expired' || level === 'critical'
                    ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
                    : level === 'urgent'
                    ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-zinc-100 text-sm">{doc.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badgeStyles}`}>
                        {statusText}
                      </span>
                      {doc.category === 'power_of_attorney' && doc.poaDetails && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          {doc.poaDetails.poaType === 'received' ? 'وکالت دریافتی' : 'وکالت اعطایی'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Car className="w-3.5 h-3.5 text-sky-400" />
                        <span>{doc.vehicleLabel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                        <span>شماره سند:</span>
                        <strong className="font-mono text-zinc-200">{doc.documentNumber}</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>تاریخ انقضا:</span>
                        <strong className="font-en-num text-amber-300">{toPersianDigits(doc.expiryDate)}</strong>
                      </div>
                    </div>

                    {/* Specific Insurance Info */}
                    {doc.insuranceDetails && (
                      <div className="text-[11px] text-zinc-400 flex flex-wrap gap-3 pt-1 border-t border-zinc-800/80">
                        <span>شرکت بیمه‌گر: <strong className="text-zinc-200">{doc.insuranceDetails.insurerName}</strong></span>
                        {doc.insuranceDetails.financialCoverageAmount ? (
                          <span>تعهد مالی: <strong className="font-en-num text-emerald-300">{formatToman(doc.insuranceDetails.financialCoverageAmount)}</strong></span>
                        ) : null}
                        {doc.insuranceDetails.discountPercent ? (
                          <span>تخفیف عدم خسارت: <strong className="font-en-num text-sky-300">%{toPersianDigits(doc.insuranceDetails.discountPercent)}</strong></span>
                        ) : null}
                      </div>
                    )}

                    {/* Specific POA Info */}
                    {doc.poaDetails && (
                      <div className="text-[11px] text-zinc-400 flex flex-wrap gap-3 pt-1 border-t border-zinc-800/80">
                        <span>دفترخانه: <strong className="text-zinc-200">{doc.poaDetails.notaryOffice}</strong></span>
                        <span>موکل: <strong className="text-zinc-200">{doc.poaDetails.grantorName}</strong></span>
                        <span>وکیل: <strong className="text-zinc-200">{doc.poaDetails.agentName}</strong></span>
                        <span>موضوع: <span className="text-zinc-300">{doc.poaDetails.subject}</span></span>
                        <span>وضعیت: <span className="font-bold text-amber-300">{doc.poaDetails.status === 'valid' ? 'معتبر' : doc.poaDetails.status === 'used' ? 'استفاده‌شده' : 'منقضی'}</span></span>
                      </div>
                    )}

                    {doc.notes && (
                      <p className="text-[11px] text-zinc-500 italic mt-0.5">{doc.notes}</p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {onOpenVehicleDrawer && (
                      <button
                        onClick={() => onOpenVehicleDrawer(doc.vehicleId)}
                        className="btn-minimal px-2.5 py-1.5 rounded-lg text-xs text-sky-300 hover:text-sky-200 inline-flex items-center gap-1 cursor-pointer"
                        title="مشاهده پرونده خودرو"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>پرونده خودرو</span>
                      </button>
                    )}

                    {/* If POA: Action to mark as Used */}
                    {doc.category === 'power_of_attorney' && doc.poaDetails?.status === 'valid' && (
                      <button
                        onClick={() => {
                          updateExpiringDoc(doc.id, {
                            poaDetails: {
                              ...doc.poaDetails!,
                              status: 'used',
                              usedDate: DEALERSHIP_CURRENT_DATE,
                            },
                          });
                          showToast('وضعیت وکالت‌نامه به «استفاده‌شده» تغییر یافت.', 'success');
                        }}
                        className="btn-minimal-amber px-2.5 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>ثبت تعویض پلاک / استفاده</span>
                      </button>
                    )}

                    {checkPermission('delete_sensitive_records') && (
                      <button
                        onClick={() => deleteExpiringDoc(doc.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف سند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-[#18191e] border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-zinc-100 text-sm">ثبت مدرک و سند با تاریخ انقضا</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  خودرو مربوطه <span className="text-amber-400">*</span>
                </label>
                <select
                  required
                  value={newVehicleId}
                  onChange={(e) => {
                    setNewVehicleId(e.target.value);
                    const v = vehicles.find((item) => item.id === e.target.value);
                    if (v && !newTitle) {
                      setNewTitle(`بیمه‌نامه شخص ثالث ${v.fullName}`);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 cursor-pointer focus:outline-none focus:border-amber-500"
                >
                  <option value="">انتخاب خودرو...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.fullName} ({v.plate || 'بدون پلاک'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">دسته‌بندی مدرک:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as DocumentTypeCategory;
                      setNewCategory(cat);
                      if (cat === 'power_of_attorney') setNewTitle('وکالت تعویض پلاک');
                      else if (cat === 'third_party_insurance') setNewTitle('بیمه‌نامه شخص ثالث');
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 cursor-pointer focus:outline-none focus:border-amber-500"
                  >
                    <option value="third_party_insurance">بیمه شخص ثالث</option>
                    <option value="body_insurance">بیمه بدنه</option>
                    <option value="power_of_attorney">وکالت‌نامه</option>
                    <option value="technical_inspection">معاینه فنی</option>
                    <option value="green_card">برگ سبز</option>
                    <option value="custom_document">سایر مدارک قانونی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    شماره سند / بیمه‌نامه <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: IRN-984210398"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  عنوان سند <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بیمه‌نامه شخص ثالث بیمه ایران"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">تاریخ شروع اعتبار:</label>
                  <input
                    type="text"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-en-num"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    تاریخ انقضا <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="۱۴۰۵/۰۹/۰۱"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-en-num"
                  />
                </div>
              </div>

              {/* Conditional Insurance Fields */}
              {(newCategory === 'third_party_insurance' || newCategory === 'body_insurance') && (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <span className="font-bold text-amber-400 block text-xs">مشخصات بیمه‌نامه:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">شرکت بیمه‌گر:</label>
                      <select
                        value={insurerName}
                        onChange={(e) => setInsurerName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200 cursor-pointer"
                      >
                        {insuranceCompanies.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">تعهد مالی (تومان):</label>
                      <input
                        type="number"
                        value={coverageAmount}
                        onChange={(e) => setCoverageAmount(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200 font-en-num"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional POA Fields */}
              {newCategory === 'power_of_attorney' && (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <span className="font-bold text-sky-400 block text-xs">مشخصات سند وکالت‌نامه:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">نوع وکالت:</label>
                      <select
                        value={poaType}
                        onChange={(e) => setPoaType(e.target.value as any)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200 cursor-pointer"
                      >
                        <option value="received">دریافتی از فروشنده</option>
                        <option value="issued">اعطایی به خریدار</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">دفترخانه اسناد رسمی:</label>
                      <input
                        type="text"
                        placeholder="دفترخانه شماره ۲۴ تهران"
                        value={notaryOffice}
                        onChange={(e) => setNotaryOffice(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">نام موکل:</label>
                      <input
                        type="text"
                        placeholder="نام و نام خانوادگی"
                        value={grantorName}
                        onChange={(e) => setGrantorName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">نام وکیل:</label>
                      <input
                        type="text"
                        placeholder="نام وکیل / نمایشگاه"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">یادداشت و توضیحات:</label>
                <textarea
                  rows={2}
                  placeholder="توضیحات و شرایط خاص سند..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-minimal px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="btn-minimal-amber px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ثبت سند و تنظیم هشدار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
