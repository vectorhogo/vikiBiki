import React, { useState, useMemo } from 'react';
import { SaleDossier } from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  FileText,
  Search,
  Plus,
  Car,
  User,
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { SaleDossierDrawer } from './SaleDossierDrawer';
import { NewSaleDossierModal } from './NewSaleDossierModal';
import { PrintableFormA } from './PrintableFormA';
import { PrintableFormB } from './PrintableFormB';
import { PrintableSaleDossier } from './PrintableSaleDossier';

interface SalesArchiveViewProps {
  onOpenCustomerProfile: (customerId: string) => void;
}

export const SalesArchiveView: React.FC<SalesArchiveViewProps> = ({
  onOpenCustomerProfile,
}) => {
  const { saleDossiers, customers, vehicles } = useAccounting();

  // Basic filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'pending' | 'today' | 'cancelled'>('all');
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('all');
  const [filterDateType, setFilterDateType] = useState<'saleDate' | 'deliveryDate'>('deliveryDate');
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  const [filterMinPrice, setFilterMinPrice] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');

  // Modals & Drawers
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  // Print overlays
  const [printFormADossier, setPrintFormADossier] = useState<SaleDossier | null>(null);
  const [printFormBDossier, setPrintFormBDossier] = useState<SaleDossier | null>(null);
  const [printFullDossier, setPrintFullDossier] = useState<SaleDossier | null>(null);

  // Collect unique brands from sales and vehicles
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    vehicles.forEach((v) => {
      if (v.brand) brandsSet.add(v.brand.trim());
    });
    saleDossiers.forEach((s) => {
      // Try to extract brand if vehicleFullName starts with a known brand or word
      const parts = s.vehicleFullName.split(' ');
      if (parts.length > 0) {
        brandsSet.add(parts[0]);
      }
    });
    // Add common dealership brands
    ['تویوتا', 'ب‌ام‌و', 'لکسوس', 'مرسدس بنز', 'هیوندای', 'کیا', 'پورشه', 'نیسان'].forEach((b) => brandsSet.add(b));
    return Array.from(brandsSet).filter(Boolean).sort();
  }, [vehicles, saleDossiers]);

  // Count active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (filterBrand !== 'all') count++;
    if (filterModel.trim()) count++;
    if (filterCustomerId !== 'all') count++;
    if (filterFromDate.trim()) count++;
    if (filterToDate.trim()) count++;
    if (filterMinPrice.trim()) count++;
    if (filterMaxPrice.trim()) count++;
    return count;
  }, [filterBrand, filterModel, filterCustomerId, filterFromDate, filterToDate, filterMinPrice, filterMaxPrice]);

  // Reset all filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setFilterBrand('all');
    setFilterModel('');
    setFilterCustomerId('all');
    setFilterFromDate('');
    setFilterToDate('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
  };

  // Filter sales list
  const q = searchQuery.trim().toLowerCase();
  const minPriceNum = filterMinPrice ? parseInt(filterMinPrice.replace(/[^\d]/g, ''), 10) : 0;
  const maxPriceNum = filterMaxPrice ? parseInt(filterMaxPrice.replace(/[^\d]/g, ''), 10) : 0;

  const filteredSales = useMemo(() => {
    return saleDossiers.filter((s) => {
      // 1. Status Filter
      if (statusFilter === 'delivered' && s.status !== 'delivered') return false;
      if (statusFilter === 'pending' && s.status !== 'pending_delivery' && s.status !== 'draft') return false;
      if (statusFilter === 'today' && s.deliveryDate !== DEALERSHIP_CURRENT_DATE) return false;
      if (statusFilter === 'cancelled' && s.status !== 'cancelled') return false;

      // 2. Search query (fuzzy & partial)
      if (q) {
        const matchNumber = s.saleNumber.toLowerCase().includes(q);
        const matchContract = s.contractNumber.toLowerCase().includes(q);
        const matchCustomer = s.customerName.toLowerCase().includes(q);
        const matchVehicle = s.vehicleFullName.toLowerCase().includes(q);
        const matchPlate = s.deliveryFormB?.plateNumber?.toLowerCase().includes(q);
        const matchVin = s.deliveryFormB?.chassisNumber?.toLowerCase().includes(q);
        const matchDate = s.deliveryDate.includes(q) || s.saleDate.includes(q);
        if (!matchNumber && !matchContract && !matchCustomer && !matchVehicle && !matchPlate && !matchVin && !matchDate) {
          return false;
        }
      }

      // 3. Brand Filter
      if (filterBrand !== 'all') {
        const lowerBrand = filterBrand.toLowerCase();
        const matchesBrand = s.vehicleFullName.toLowerCase().includes(lowerBrand);
        if (!matchesBrand) return false;
      }

      // 4. Model Filter
      if (filterModel.trim()) {
        const lowerModel = filterModel.trim().toLowerCase();
        if (!s.vehicleFullName.toLowerCase().includes(lowerModel)) {
          return false;
        }
      }

      // 5. Customer Filter
      if (filterCustomerId !== 'all') {
        if (s.customerId !== filterCustomerId) {
          return false;
        }
      }

      // 6. Date Range Filter
      const targetDate = filterDateType === 'saleDate' ? s.saleDate : s.deliveryDate;
      if (filterFromDate.trim() && targetDate < filterFromDate.trim()) {
        return false;
      }
      if (filterToDate.trim() && targetDate > filterToDate.trim()) {
        return false;
      }

      // 7. Price Range Filter
      if (minPriceNum > 0 && s.salePrice < minPriceNum) {
        return false;
      }
      if (maxPriceNum > 0 && s.salePrice > maxPriceNum) {
        return false;
      }

      return true;
    });
  }, [
    saleDossiers,
    statusFilter,
    q,
    filterBrand,
    filterModel,
    filterCustomerId,
    filterDateType,
    filterFromDate,
    filterToDate,
    minPriceNum,
    maxPriceNum,
  ]);

  // Metrics
  const totalSalesCount = saleDossiers.length;
  const deliveredCount = saleDossiers.filter((s) => s.status === 'delivered').length;
  const pendingCount = saleDossiers.filter((s) => s.status === 'pending_delivery' || s.status === 'draft').length;
  const todayDeliveriesCount = saleDossiers.filter((s) => s.deliveryDate === DEALERSHIP_CURRENT_DATE).length;
  const totalVolume = filteredSales.reduce((sum, s) => sum + s.salePrice, 0);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#141518] border border-[#252830] p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-zinc-100">
                بایگانی پرونده‌های فروش و تحویل خودرو (Vehicle Sales Archive)
              </h1>
              <p className="text-xs text-zinc-400">
                جستجو، فیلتر پیشرفته بر اساس بازه تاریخ، برند، مدل، خریدار و وضعیت خودرو، همراه با دسترسی سریع به پرونده کامل فروش و فرم‌های رسمی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setIsNewSaleModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ثبت معامله و پرونده تحویل جدید</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#16171b] border border-[#26282f] p-3.5 rounded-xl">
          <span className="text-xs text-zinc-400 block mb-1">کل پرونده‌های ثبت‌شده</span>
          <span className="text-xl font-black text-zinc-100 font-mono">
            {toPersianDigits(totalSalesCount)} پرونده
          </span>
        </div>

        <div className="bg-[#16171b] border border-[#26282f] p-3.5 rounded-xl">
          <span className="text-xs text-zinc-400 block mb-1">تحویل‌های امروز</span>
          <span className="text-xl font-black text-sky-400 font-mono">
            {toPersianDigits(todayDeliveriesCount)} خودرو
          </span>
        </div>

        <div className="bg-[#16171b] border border-[#26282f] p-3.5 rounded-xl">
          <span className="text-xs text-zinc-400 block mb-1">تحویل نهایی شده</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            {toPersianDigits(deliveredCount)} خودرو
          </span>
        </div>

        <div className="bg-[#16171b] border border-[#26282f] p-3.5 rounded-xl">
          <span className="text-xs text-zinc-400 block mb-1">
            {activeAdvancedFilterCount > 0 || statusFilter !== 'all' || q ? 'مجموع فیلترشده' : 'گردش فروش خودرو'}
          </span>
          <span className="text-base sm:text-lg font-black text-amber-400 font-mono truncate block">
            {formatToman(totalVolume)}
          </span>
        </div>
      </div>

      {/* Search & Main Filter Bar */}
      <div className="bg-[#15161a] border border-[#272932] p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره پرونده (S-1405...)، قرارداد، خریدار، خودرو، پلاک یا شاسی..."
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Filter Pills + Advanced Toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:bg-[#1f2129]'
            }`}
          >
            همه ({toPersianDigits(totalSalesCount)})
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'delivered'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:bg-[#1f2129]'
            }`}
          >
            تحویل‌شده ({toPersianDigits(deliveredCount)})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:bg-[#1f2129]'
            }`}
          >
            در انتظار تحویل ({toPersianDigits(pendingCount)})
          </button>
          <button
            onClick={() => setStatusFilter('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'today'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-zinc-400 hover:bg-[#1f2129]'
            }`}
          >
            تحویل امروز ({toPersianDigits(todayDeliveriesCount)})
          </button>

          {/* Advanced Filter Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
              showAdvancedFilters || activeAdvancedFilterCount > 0
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                : 'bg-[#1c1e26] text-zinc-300 border-[#2f3240] hover:bg-[#252834]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فیلترهای پیشرفته</span>
            {activeAdvancedFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-black/20 text-black text-[10px] font-mono flex items-center justify-center font-bold">
                {toPersianDigits(activeAdvancedFilterCount)}
              </span>
            )}
            {showAdvancedFilters ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Expandable Panel */}
      {showAdvancedFilters && (
        <div className="p-4 sm:p-5 bg-[#17181f] border border-[#2b2e3b] rounded-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#262835]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100">
                فیلترهای تخصصی و بازه زمانی بایگانی خودروها
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {activeAdvancedFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>پاکسازی فیلترها</span>
                </button>
              )}
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#252834]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* 1. Date Range: Type + From + To */}
            <div className="space-y-1.5 sm:col-span-2 bg-[#121317] p-3 rounded-xl border border-[#252833]">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>بازه زمانی:</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                    <input
                      type="radio"
                      name="dateType"
                      checked={filterDateType === 'deliveryDate'}
                      onChange={() => setFilterDateType('deliveryDate')}
                      className="accent-amber-500 text-xs"
                    />
                    <span>تاریخ تحویل</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                    <input
                      type="radio"
                      name="dateType"
                      checked={filterDateType === 'saleDate'}
                      onChange={() => setFilterDateType('saleDate')}
                      className="accent-amber-500 text-xs"
                    />
                    <span>تاریخ معامله</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-0.5">از تاریخ:</span>
                  <input
                    type="text"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۴/۰۱/۰۱"
                    className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-0.5">تا تاریخ:</span>
                  <input
                    type="text"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۵/۱۲/۲۹"
                    className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>

            {/* 2. Brand Filter */}
            <div className="space-y-1.5 bg-[#121317] p-3 rounded-xl border border-[#252833]">
              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span>برند خودرو (Brand):</span>
              </label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="all">همه برندها</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Model Filter */}
            <div className="space-y-1.5 bg-[#121317] p-3 rounded-xl border border-[#252833]">
              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>مدل یا تیپ خودرو:</span>
              </label>
              <input
                type="text"
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                placeholder="مثال: کمری، 530i، سانتافه..."
                className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* 4. Customer Filter */}
            <div className="space-y-1.5 bg-[#121317] p-3 rounded-xl border border-[#252833] sm:col-span-2">
              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>فیلتر بر اساس خریدار (Customer):</span>
              </label>
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="all">همه مشتریان</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} — {c.phone} {c.nationalId ? `(کد ملی: ${c.nationalId})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Price Range */}
            <div className="space-y-1.5 sm:col-span-2 bg-[#121317] p-3 rounded-xl border border-[#252833]">
              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>محدوده مبلغ معامله (تومان):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  placeholder="حداقل قیمت (تومان)"
                  className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="text"
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  placeholder="حداکثر قیمت (تومان)"
                  className="w-full bg-[#1b1c23] border border-[#2c2f3d] rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Active filter summary pill row */}
          {activeAdvancedFilterCount > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400">فیلترهای فعال:</span>
              {filterBrand !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  برند: {filterBrand}
                  <button onClick={() => setFilterBrand('all')} className="hover:text-white">
                    ×
                  </button>
                </span>
              )}
              {filterModel.trim() && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  مدل: {filterModel}
                  <button onClick={() => setFilterModel('')} className="hover:text-white">
                    ×
                  </button>
                </span>
              )}
              {filterCustomerId !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  خریدار: {customers.find((c) => c.id === filterCustomerId)?.fullName || filterCustomerId}
                  <button onClick={() => setFilterCustomerId('all')} className="hover:text-white">
                    ×
                  </button>
                </span>
              )}
              {(filterFromDate.trim() || filterToDate.trim()) && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono">
                  بازه: {filterFromDate || '...'} تا {filterToDate || '...'}
                  <button
                    onClick={() => {
                      setFilterFromDate('');
                      setFilterToDate('');
                    }}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {(filterMinPrice.trim() || filterMaxPrice.trim()) && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono">
                  قیمت: {filterMinPrice || '۰'} تا {filterMaxPrice || '...'}
                  <button
                    onClick={() => {
                      setFilterMinPrice('');
                      setFilterMaxPrice('');
                    }}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter status banner if filtered */}
      {(activeAdvancedFilterCount > 0 || statusFilter !== 'all' || q) && (
        <div className="p-3 bg-[#171922] border border-[#282b3a] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              نمایش <strong className="text-amber-400 font-mono">{toPersianDigits(filteredSales.length)}</strong> پرونده از مجموع <strong className="text-zinc-100 font-mono">{toPersianDigits(totalSalesCount)}</strong> پرونده موجود
            </span>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پاکسازی تمام فیلترها</span>
          </button>
        </div>
      )}

      {/* Sale Dossier Cards List */}
      {filteredSales.length === 0 ? (
        <div className="p-12 text-center bg-[#141519] border border-dashed border-[#292c36] rounded-2xl">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-300 mb-1">پرونده‌ای با این مشخصات یافت نشد</h3>
          <p className="text-xs text-zinc-500 mb-4">
            فیلترها را تغییر دهید یا برای ثبت پرونده جدید روی دکمه زیر کلیک نمایید.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#20222a] hover:bg-[#282a34] text-zinc-200 border border-[#2f3240] font-semibold rounded-lg text-xs cursor-pointer"
            >
              پاکسازی فیلترها
            </button>
            <button
              onClick={() => setIsNewSaleModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs cursor-pointer"
            >
              ثبت معامله جدید
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="p-4 sm:p-5 bg-[#16171b] border border-[#272932] hover:border-amber-500/40 rounded-2xl transition-all shadow-sm flex flex-col gap-3 group"
            >
              {/* Top Row: Sale No + Vehicle + Customer + Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#20222a] border border-[#2e313c] flex items-center justify-center font-mono font-bold text-amber-400 text-sm shrink-0 group-hover:border-amber-500/30 transition-colors">
                    <Car className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                        {sale.vehicleFullName}
                      </h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                        {sale.saleNumber}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        قرارداد: {sale.contractNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span>خریدار: </span>
                        <button
                          onClick={() => onOpenCustomerProfile(sale.customerId)}
                          className="text-zinc-200 hover:text-amber-400 font-semibold underline underline-offset-4 decoration-zinc-700 hover:decoration-amber-400 cursor-pointer"
                          title="مشاهده پرونده کامل مشتری"
                        >
                          {sale.customerName}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>پلاک: </span>
                        <strong className="text-zinc-200 font-mono">
                          {toPersianDigits(sale.deliveryFormB?.plateNumber || '—')}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>معامله: {toPersianDigits(sale.saleDate)}</span>
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          تحویل: {toPersianDigits(sale.deliveryDate)} {sale.deliveryTime && `(${toPersianDigits(sale.deliveryTime)})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#23252c]">
                  <span className="font-bold text-base text-amber-400 font-mono">
                    {formatToman(sale.salePrice)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1 ${
                      sale.status === 'delivered'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : sale.status === 'cancelled'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {sale.status === 'delivered'
                      ? 'تحویل شد ✓'
                      : sale.status === 'cancelled'
                      ? 'ابطال‌شده'
                      : 'در انتظار تحویل'}
                  </span>
                </div>
              </div>

              {/* Middle Row: Form Statuses summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#121316] p-2.5 rounded-xl border border-[#21232a]">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">فرم الف (تحویل مدارک):</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {toPersianDigits(sale.deliveryFormA.checklist.filter(c => c.status === 'delivered').length)} از {toPersianDigits(sale.deliveryFormA.checklist.length)} مدرک تحویل شد
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">فرم ب (تحویل خودرو):</span>
                  <span className="text-[11px] font-mono text-sky-400">
                    {toPersianDigits(sale.deliveryFormB.equipmentChecklist.filter(e => e.status === 'present').length)} قلم موجود • {toPersianDigits(sale.deliveryFormB.diagramMarkers.length)} مورد در دیاگرام بدنه
                  </span>
                </div>
              </div>

              {/* Bottom Action Row: Quick Links to full dossier and forms */}
              <div className="pt-2 border-t border-[#23252c] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setPrintFormADossier(sale)}
                    className="px-2.5 py-1 rounded-lg bg-[#1a1c22] hover:bg-[#232630] text-zinc-300 text-xs font-medium border border-[#2c2f3a] flex items-center gap-1 transition-colors cursor-pointer"
                    title="چاپ فرم الف - تحویل مدارک"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>فرم الف (مدارک)</span>
                  </button>

                  <button
                    onClick={() => setPrintFormBDossier(sale)}
                    className="px-2.5 py-1 rounded-lg bg-[#1a1c22] hover:bg-[#232630] text-zinc-300 text-xs font-medium border border-[#2c2f3a] flex items-center gap-1 transition-colors cursor-pointer"
                    title="چاپ فرم ب - تحویل خودرو و دیاگرام"
                  >
                    <Car className="w-3.5 h-3.5 text-sky-400" />
                    <span>فرم ب (تجهیزات و دیاگرام)</span>
                  </button>

                  <button
                    onClick={() => setPrintFullDossier(sale)}
                    className="px-2.5 py-1 rounded-lg bg-[#1a1c22] hover:bg-[#232630] text-zinc-300 text-xs font-medium border border-[#2c2f3a] flex items-center gap-1 transition-colors cursor-pointer"
                    title="چاپ برگه خلاصه پرونده کامل فروش"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-400" />
                    <span>چاپ خلاصه پرونده</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCustomerProfile(sale.customerId)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#232630] text-zinc-300 text-xs font-medium border border-[#2c2f3a] flex items-center gap-1 transition-colors cursor-pointer"
                    title="مشاهده پروفایل خریدار"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>پروفایل خریدار</span>
                  </button>

                  <button
                    onClick={() => setSelectedSaleId(sale.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <span>مشاهده پرونده کامل فروش</span>
                    <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sale Dossier Drawer */}
      {selectedSaleId && (
        <SaleDossierDrawer
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onOpenCustomerProfile={(cId) => {
            setSelectedSaleId(null);
            onOpenCustomerProfile(cId);
          }}
        />
      )}

      {/* New Sale Dossier Modal */}
      <NewSaleDossierModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        onSaleCreated={(newSale) => {
          setSelectedSaleId(newSale.id);
        }}
      />

      {/* Print Form A Overlay */}
      {printFormADossier && (
        <PrintableFormA
          dossier={printFormADossier}
          onClose={() => setPrintFormADossier(null)}
        />
      )}

      {/* Print Form B Overlay */}
      {printFormBDossier && (
        <PrintableFormB
          dossier={printFormBDossier}
          onClose={() => setPrintFormBDossier(null)}
        />
      )}

      {/* Print Full Dossier Overlay */}
      {printFullDossier && (
        <PrintableSaleDossier
          dossier={printFullDossier}
          onClose={() => setPrintFullDossier(null)}
        />
      )}
    </div>
  );
};
