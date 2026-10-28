import React, { useState } from 'react';
import { Customer, SaleDossier } from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  X,
  User,
  Car,
  FileText,
  DollarSign,
  Clock,
  Phone,
  MapPin,
  Tag,
  Plus,
  Edit2,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ArrowRightLeft,
  Wallet,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { PrintableFormA } from './PrintableFormA';
import { PrintableFormB } from './PrintableFormB';
import { PrintableSaleDossier } from './PrintableSaleDossier';

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  onClose: () => void;
  onEditCustomer: (customer: Customer) => void;
  onCreateSaleForCustomer: (customerId: string) => void;
  onOpenSaleDossier: (saleId: string) => void;
}

type CustomerTab = 'vehicles' | 'consignments' | 'contracts' | 'deals' | 'forms' | 'payments' | 'documents' | 'timeline';

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customer,
  onClose,
  onEditCustomer,
  onCreateSaleForCustomer,
  onOpenSaleDossier,
}) => {
  const { saleDossiers, vehicles, consignmentAgreements, ownerSettlements, contracts } = useAccounting();
  const [activeTab, setActiveTab] = useState<CustomerTab>('vehicles');

  // Print modals
  const [printFormADossier, setPrintFormADossier] = useState<SaleDossier | null>(null);
  const [printFormBDossier, setPrintFormBDossier] = useState<SaleDossier | null>(null);
  const [printFullDossier, setPrintFullDossier] = useState<SaleDossier | null>(null);

  if (!customer) return null;

  // Find all sales belonging to this master customer
  const customerSales = saleDossiers.filter((s) => s.customerId === customer.id);

  // Contracts linked to this customer
  const customerContracts = contracts.filter(
    (c) =>
      c.buyerId === customer.id ||
      c.sellerId === customer.id ||
      (customer.nationalId &&
        (c.parties.buyer.nationalId === customer.nationalId ||
          c.parties.seller.nationalId === customer.nationalId))
  );

  // Phase 08: Consignment vehicles owned by this customer
  const customerConsignmentVehicles = vehicles.filter(
    (v) =>
      v.ownershipType === 'consignment' &&
      (v.ownerPersonId === customer.id ||
        (customer.nationalId && v.ownerNationalId === customer.nationalId) ||
        v.ownerName === customer.fullName)
  );

  const consignmentInShowroom = customerConsignmentVehicles.filter(
    (v) =>
      v.consignmentStatus === 'in_showroom' ||
      v.consignmentStatus === 'pending_intake' ||
      v.consignmentStatus === 'ready_for_sale'
  ).length;

  const consignmentSold = customerConsignmentVehicles.filter(
    (v) =>
      v.consignmentStatus === 'sold' ||
      v.consignmentStatus === 'pending_settlement' ||
      v.consignmentStatus === 'settled'
  ).length;

  const consignmentReturned = customerConsignmentVehicles.filter(
    (v) => v.consignmentStatus === 'returned'
  ).length;

  // Settlements related to customer's consignment vehicles
  const customerConsignmentVehicleIds = new Set(customerConsignmentVehicles.map((v) => v.id));
  const customerSettlements = ownerSettlements.filter(
    (s) =>
      s.ownerPersonId === customer.id ||
      customerConsignmentVehicleIds.has(s.vehicleId) ||
      s.ownerName === customer.fullName
  );

  const totalOwnerSettlementPayable = customerSettlements.reduce(
    (sum, s) => sum + s.netPayableToOwner,
    0
  );
  const totalOwnerSettlementPaid = customerSettlements.reduce(
    (sum, s) => sum + s.paidAmount,
    0
  );
  const totalOwnerSettlementRemaining = customerSettlements.reduce(
    (sum, s) => sum + s.remainingAmount,
    0
  );

  // Calculate totals
  const totalVehiclesPurchased = customerSales.length;
  const totalSpent = customerSales.reduce((acc, s) => acc + s.salePrice, 0);
  const totalPaid = customerSales.reduce(
    (acc, s) =>
      acc +
      s.payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    0
  );
  const pendingBalance = totalSpent - totalPaid;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in"
        dir="rtl"
      >
        <div className="bg-[#141519] border-r border-[#26282e] w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in slide-in-from-left duration-200">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-[#171920] border-b border-[#252830] flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 font-black text-xl shadow-md shrink-0">
                {customer.fullName.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-zinc-100">{customer.fullName}</h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#20222b] text-amber-400 border border-[#2f3340]">
                    {customer.fileNumber}
                  </span>
                  {customer.tags &&
                    customer.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-mono text-zinc-300">{toPersianDigits(customer.phone)}</span>
                  </div>
                  {customer.nationalId && (
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">کد ملی:</span>
                      <span className="font-mono text-zinc-300">{toPersianDigits(customer.nationalId)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>تشکیل پرونده: {toPersianDigits(customer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditCustomer(customer)}
                className="p-1.5 rounded-lg bg-[#20222a] hover:bg-[#282b35] text-zinc-300 hover:text-white border border-[#2e313c] transition-colors"
                title="ویرایش پرونده مشتری"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#20222a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#111216] border-b border-[#21232a] text-center">
            <div className="bg-[#17181f] p-2 rounded-lg border border-[#262832]">
              <span className="text-[10px] text-zinc-500 block">خودروهای خریداری‌شده</span>
              <span className="font-bold text-sm text-zinc-100 font-mono">
                {toPersianDigits(totalVehiclesPurchased)} دستگاه
              </span>
            </div>
            <div className="bg-[#17181f] p-2 rounded-lg border border-[#262832]">
              <span className="text-[10px] text-zinc-500 block">مجموع معاملات</span>
              <span className="font-bold text-sm text-zinc-100">
                {formatToman(totalSpent)}
              </span>
            </div>
            <div className="bg-[#17181f] p-2 rounded-lg border border-[#262832]">
              <span className="text-[10px] text-zinc-500 block">مانده بدهی / چک‌ها</span>
              <span
                className={`font-bold text-sm ${
                  pendingBalance === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {pendingBalance === 0 ? 'تسویه کامل' : formatToman(pendingBalance)}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="p-3 bg-[#131418] border-b border-[#21232a] flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              پرونده مرجع مشتری (قابل اتصال به خریدهای متعدد)
            </span>
            <button
              onClick={() => onCreateSaleForCustomer(customer.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ثبت معامله / فروش جدید</span>
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 px-4 border-b border-[#21232a] bg-[#121316] overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'vehicles'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>خودروهای خریداری‌شده ({toPersianDigits(customerSales.length)})</span>
            </button>

            {/* Phase 08: Consignment Owner Tab */}
            <button
              onClick={() => setActiveTab('consignments')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'consignments'
                  ? 'border-indigo-400 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>
                خودروهای امانی مالک ({toPersianDigits(customerConsignmentVehicles.length)})
              </span>
            </button>

            {/* Phase 09A: Contracts & Installments Tab */}
            <button
              onClick={() => setActiveTab('contracts')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'contracts'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                قراردادها و اقساط ({toPersianDigits(customerContracts.length)})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'deals'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>معاملات و پرونده‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab('forms')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'forms'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>فرم‌های تحویل (الف و ب)</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'payments'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>پرداخت‌ها و تسویه</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'timeline'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>تاریخچه و رویدادها</span>
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Customer Details Box */}
            <div className="p-3.5 bg-[#17181f] border border-[#272932] rounded-xl text-xs space-y-2">
              <div className="font-bold text-zinc-300 pb-1 border-b border-[#252730] flex items-center justify-between">
                <span>اطلاعات تماس و نشانی مشتری</span>
                <span className="text-[11px] text-zinc-500 font-mono">شناسه: {customer.id}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block text-[11px]">شماره تماس اول:</span>
                  <span className="font-mono">{toPersianDigits(customer.phone)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">شماره تماس دوم:</span>
                  <span className="font-mono">{customer.phone2 ? toPersianDigits(customer.phone2) : '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500 block text-[11px]">آدرس اقامتگاه:</span>
                  <span>{customer.address || 'ثبت نشده'}</span>
                </div>
                {customer.notes && (
                  <div className="sm:col-span-2 bg-[#121317] p-2 rounded border border-[#22242c] text-zinc-400">
                    <span className="text-zinc-500 block text-[10px]">توضیحات پرونده:</span>
                    <span>{customer.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* TAB 1: VEHICLES PURCHASED HISTORY */}
            {activeTab === 'vehicles' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                  <span>سوابق خودروهای تحویل داده شده به این مشتری:</span>
                  <span>{toPersianDigits(customerSales.length)} خودرو</span>
                </div>

                {customerSales.length === 0 ? (
                  <div className="p-8 text-center bg-[#15161b] border border-dashed border-[#292c36] rounded-xl">
                    <Car className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">هنوز خودرویی برای این مشتری ثبت یا تحویل نشده است.</p>
                    <button
                      onClick={() => onCreateSaleForCustomer(customer.id)}
                      className="mt-3 px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-xs font-semibold"
                    >
                      ثبت اولین معامله
                    </button>
                  </div>
                ) : (
                  customerSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-3.5 bg-[#181920] border border-[#2b2e38] hover:border-amber-500/40 rounded-xl transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-100">{sale.vehicleFullName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {sale.saleNumber}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                            <span>پلاک: <strong className="text-zinc-200">{toPersianDigits(sale.deliveryFormB.plateNumber || '—')}</strong></span>
                            <span>تحویل در: <strong className="text-zinc-200">{toPersianDigits(sale.deliveryDate)}</strong></span>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="font-bold text-sm text-amber-400 font-mono block">
                            {formatToman(sale.salePrice)}
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {sale.status === 'delivered' ? 'تحویل شد ✓' : 'در انتظار تحویل'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#232630] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPrintFormADossier(sale)}
                            className="px-2 py-1 bg-[#1f2129] hover:bg-[#282b35] text-zinc-300 rounded text-[11px] flex items-center gap-1 border border-[#2d303a]"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>فرم تحویل مدارک</span>
                          </button>
                          <button
                            onClick={() => setPrintFormBDossier(sale)}
                            className="px-2 py-1 bg-[#1f2129] hover:bg-[#282b35] text-zinc-300 rounded text-[11px] flex items-center gap-1 border border-[#2d303a]"
                          >
                            <Car className="w-3 h-3 text-sky-400" />
                            <span>فرم تحویل خودرو</span>
                          </button>
                        </div>

                        <button
                          onClick={() => onOpenSaleDossier(sale.id)}
                          className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>مشاهده پرونده فروش</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: CONSIGNMENT OWNER DASHBOARD (Phase 08) */}
            {activeTab === 'consignments' && (
              <div className="space-y-4">
                {/* Consignment Owner Summary Card */}
                <div className="p-4 bg-gradient-to-br from-[#1a1b26] to-[#14151e] border border-indigo-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-zinc-100 text-sm">
                        داشبورد خودروهای امانی {customer.fullName}
                      </span>
                    </div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                      {toPersianDigits(customerConsignmentVehicles.length)} خودرو امانی
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-[#12131a] rounded-lg border border-[#252738]">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">در نمایشگاه</span>
                      <span className="font-bold text-sm text-indigo-300 font-mono">
                        {toPersianDigits(consignmentInShowroom)} دستگاه
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#12131a] rounded-lg border border-[#252738]">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">فروخته‌شده</span>
                      <span className="font-bold text-sm text-emerald-400 font-mono">
                        {toPersianDigits(consignmentSold)} دستگاه
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#12131a] rounded-lg border border-[#252738]">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">مرجوع‌شده</span>
                      <span className="font-bold text-sm text-zinc-400 font-mono">
                        {toPersianDigits(consignmentReturned)} دستگاه
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#12131a] rounded-lg border border-[#252738]">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">مانده تسویه با مالک</span>
                      <span
                        className={`font-bold text-xs sm:text-sm font-mono ${
                          totalOwnerSettlementRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {totalOwnerSettlementRemaining > 0
                          ? formatToman(totalOwnerSettlementRemaining)
                          : 'تسویه‌شده'}
                      </span>
                    </div>
                  </div>

                  {totalOwnerSettlementPayable > 0 && (
                    <div className="p-2.5 bg-[#12131a] rounded-lg border border-[#252738] flex items-center justify-between text-xs text-zinc-300">
                      <div>
                        <span className="text-zinc-500 ml-1">کل سهم خالص مالک:</span>
                        <strong className="text-zinc-100 font-mono">
                          {formatToman(totalOwnerSettlementPayable)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 ml-1">واریز شده:</span>
                        <strong className="text-emerald-400 font-mono">
                          {formatToman(totalOwnerSettlementPaid)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* List of Consignment Vehicles for this Owner */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                    <span>خودروهای ثبت‌شده تحت امانت:</span>
                    <span>{toPersianDigits(customerConsignmentVehicles.length)} خودرو</span>
                  </div>

                  {customerConsignmentVehicles.length === 0 ? (
                    <div className="p-8 text-center bg-[#15161b] border border-dashed border-[#292c36] rounded-xl">
                      <ArrowRightLeft className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">
                        هیچ خودروی امانی به نام این مالک در سیستم ثبت نشده است.
                      </p>
                    </div>
                  ) : (
                    customerConsignmentVehicles.map((v) => {
                      const agreement = consignmentAgreements.find((a) => a.vehicleId === v.id);
                      const settlement = ownerSettlements.find((s) => s.vehicleId === v.id);

                      return (
                        <div
                          key={v.id}
                          className="p-3.5 bg-[#181920] border border-[#2b2e38] rounded-xl space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-[#242630] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100">
                                {v.brand} {v.model} {v.year ? `(${toPersianDigits(v.year)})` : ''}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                خودروی امانی
                              </span>
                            </div>
                            <div className="text-left font-mono">
                              <span className="text-[10px] text-zinc-500 block">پلاک:</span>
                              <span className="text-xs text-zinc-300">{toPersianDigits(v.plate)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                            <div>
                              <span>وضعیت امانی: </span>
                              <strong className="text-zinc-200">
                                {v.consignmentStatus === 'in_showroom' && 'در نمایشگاه'}
                                {v.consignmentStatus === 'sold' && 'فروخته‌شده'}
                                {v.consignmentStatus === 'pending_settlement' && 'در انتظار تسویه مالک'}
                                {v.consignmentStatus === 'settled' && 'تسویه‌شده'}
                                {v.consignmentStatus === 'returned' && 'مرجوع‌شده به مالک'}
                                {v.consignmentStatus === 'ready_for_sale' && 'آماده فروش'}
                                {v.consignmentStatus === 'pending_intake' && 'در انتظار دریافت'}
                                {!v.consignmentStatus && 'در نمایشگاه'}
                              </strong>
                            </div>
                            <div>
                              <span>قیمت پیشنهادی: </span>
                              <strong className="text-amber-400 font-mono">
                                {v.askingPrice ? formatToman(v.askingPrice) : 'توافقی'}
                              </strong>
                            </div>
                            {agreement && (
                              <>
                                <div>
                                  <span>تاریخ شروع امانی: </span>
                                  <strong className="text-zinc-200 font-mono">
                                    {toPersianDigits(agreement.startDate)}
                                  </strong>
                                </div>
                                <div>
                                  <span>قرارداد: </span>
                                  <strong className="text-zinc-200 font-mono">
                                    {agreement.contractNumber}
                                  </strong>
                                </div>
                              </>
                            )}
                          </div>

                          {settlement && (
                            <div className="p-2.5 bg-[#131418] rounded-lg border border-[#242630] flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[11px] text-zinc-500 block">وضعیت مالی تسویه:</span>
                                <span
                                  className={`font-semibold ${
                                    settlement.status === 'fully_settled'
                                      ? 'text-emerald-400'
                                      : settlement.status === 'partially_settled'
                                      ? 'text-amber-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {settlement.status === 'fully_settled' && 'تسویه کامل ✓'}
                                  {settlement.status === 'partially_settled' && 'تسویه ناقص (بخشی واریز شده)'}
                                  {settlement.status === 'unsettled' && 'تسویه نشده'}
                                </span>
                              </div>
                              <div className="text-left font-mono">
                                <span className="text-[11px] text-zinc-500 block">مانده تسویه:</span>
                                <span className="font-bold text-amber-400">
                                  {formatToman(settlement.remainingAmount)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Phase 09A: SMART CONTRACTS & INSTALLMENTS TAB */}
            {activeTab === 'contracts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                  <span>قراردادها و مبایعه‌نامه‌های مرتبط با این مشتری:</span>
                  <span>{toPersianDigits(customerContracts.length)} فقره قرارداد</span>
                </div>

                {customerContracts.length === 0 ? (
                  <div className="p-8 text-center bg-[#15161b] border border-dashed border-[#292c36] rounded-xl">
                    <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">هیچ قرارداد یا مبایعه‌نامه‌ای به نام این مشتری ثبت نشده است.</p>
                  </div>
                ) : (
                  customerContracts.map((cnt) => {
                    const isSale = cnt.contractType === 'sale';
                    const isBuyer = cnt.buyerId === customer.id || cnt.parties.buyer.nationalId === customer.nationalId;
                    const paidCount = cnt.installments.filter((i) => i.status === 'paid').length;

                    return (
                      <div
                        key={cnt.id}
                        className="p-3.5 bg-[#181920] border border-[#2b2e38] rounded-xl text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-[#242630] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-100 font-mono">{cnt.contractNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300">
                              {isSale ? 'فروش' : 'خرید'} ({isBuyer ? 'خریدار' : 'فروشنده'})
                            </span>
                            <span className="text-zinc-400 text-[11px]">— {cnt.vehicleLabel}</span>
                          </div>
                          <span className="font-bold text-emerald-400 font-mono font-en-num">
                            {formatToman(cnt.financials.totalAgreedPrice)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#121318] p-2.5 rounded-lg border border-[#21232a]">
                          <div>
                            <span className="text-zinc-500 block mb-0.5">قیمت خودرو:</span>
                            <span className="font-semibold text-zinc-200 font-en-num">
                              {formatToman(cnt.financials.baseVehiclePrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block mb-0.5">سود اقساطی:</span>
                            <span className="font-semibold text-amber-400 font-en-num">
                              {formatToman(cnt.financials.installmentProfit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block mb-0.5">وصول شده:</span>
                            <span className="font-bold text-emerald-400 font-en-num">
                              {formatToman(cnt.financials.paidSoFar)}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block mb-0.5">مانده اقساط:</span>
                            <span className="font-bold text-sky-400 font-en-num">
                              {formatToman(cnt.financials.remainingBalance)}
                            </span>
                          </div>
                        </div>

                        {cnt.installments.length > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                            <span>
                              وضعیت اقساط: {toPersianDigits(paidCount)} از {toPersianDigits(cnt.installments.length)} قسط تسویه شده
                            </span>
                            <span className="text-zinc-300 font-mono">
                              تاریخ انعقاد: {toPersianDigits(cnt.contractDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: DEALS & CONTRACTS */}
            {activeTab === 'deals' && (
              <div className="space-y-3">
                {customerSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3.5 bg-[#181920] border border-[#2a2c36] rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-[#242630] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100">{sale.contractNumber}</span>
                        <span className="text-[11px] font-mono text-zinc-400">({sale.saleNumber})</span>
                      </div>
                      <span className="font-bold text-amber-400 font-mono">{formatToman(sale.salePrice)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px]">
                      <div>تاریخ معامله: <strong className="text-zinc-200">{toPersianDigits(sale.saleDate)}</strong></div>
                      <div>تاریخ تحویل: <strong className="text-zinc-200">{toPersianDigits(sale.deliveryDate)}</strong></div>
                      <div>روش پرداخت: <strong className="text-zinc-200">{sale.paymentMethod === 'cash' ? 'نقدی' : 'اقساط / چکی'}</strong></div>
                      <div>مانده حساب: <strong className="text-emerald-400">{sale.remainingBalance === 0 ? 'تسویه کامل' : formatToman(sale.remainingBalance)}</strong></div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPrintFullDossier(sale)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ کل پرونده فروش</span>
                      </button>
                      <button
                        onClick={() => onOpenSaleDossier(sale.id)}
                        className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded text-xs font-semibold"
                      >
                        ورود به پرونده معامله
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: DELIVERY FORMS PREVIEW */}
            {activeTab === 'forms' && (
              <div className="space-y-3">
                {customerSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3.5 bg-[#181920] border border-[#2a2c36] rounded-xl text-xs space-y-3"
                  >
                    <div className="font-bold text-zinc-100 border-b border-[#242630] pb-2 flex items-center justify-between">
                      <span>{sale.vehicleFullName}</span>
                      <span className="font-mono text-zinc-400">{sale.saleNumber}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Form A Card */}
                      <div className="p-3 bg-[#141519] border border-[#272932] rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                            <FileText className="w-4 h-4" />
                            <span>فرم الف — تحویل مدارک</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mb-2">
                            {toPersianDigits(sale.deliveryFormA.checklist.filter(c => c.status === 'delivered').length)} مورد مدرک تحویل شد
                          </p>
                        </div>
                        <button
                          onClick={() => setPrintFormADossier(sale)}
                          className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>مشاهده و چاپ فرم الف</span>
                        </button>
                      </div>

                      {/* Form B Card */}
                      <div className="p-3 bg-[#141519] border border-[#272932] rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
                            <Car className="w-4 h-4" />
                            <span>فرم ب — تحویل فیزیکی خودرو</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mb-2">
                            {toPersianDigits(sale.deliveryFormB.equipmentChecklist.filter(e => e.status === 'present').length)} مورد اقلام فابریک + دیاگرام بدنه
                          </p>
                        </div>
                        <button
                          onClick={() => setPrintFormBDossier(sale)}
                          className="w-full py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-semibold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>مشاهده و چاپ فرم ب</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: PAYMENTS & CHECKS */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#181920] border border-[#282a34] rounded-xl text-xs">
                  <div className="font-bold text-zinc-200 border-b border-[#242630] pb-2 mb-2">
                    ریز کلیه واریزی‌ها، چک‌های صیادی و اقساط خریدار:
                  </div>

                  <div className="space-y-2">
                    {customerSales.flatMap((s) =>
                      s.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-[#131418] border border-[#23252d] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-zinc-200">{p.title}</div>
                            <div className="text-[11px] text-zinc-400">
                              سررسید: {toPersianDigits(p.dueDate)} — خودرو: {s.vehicleFullName}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-bold font-mono text-zinc-100">{formatToman(p.amount)}</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {p.status === 'paid' ? 'پرداخت شده ✓' : 'در انتظار وصول'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="p-3 bg-[#181920] border border-[#282a34] rounded-xl text-xs space-y-3">
                <div className="font-bold text-zinc-200 border-b border-[#242630] pb-2">
                  خط زمانی سوابق مشتری:
                </div>

                <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:right-2.5 before:w-0.5 before:bg-[#2e313c]">
                  <div className="relative pr-6">
                    <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-[#181920]" />
                    <div className="text-zinc-400 font-mono text-[10px]">{toPersianDigits(customer.createdAt)}</div>
                    <div className="font-bold text-zinc-200">افتتاح پرونده مشتری در اتو عبداللهی</div>
                    <p className="text-[11px] text-zinc-400">ثبت اطلاعات هویتی و تشکیل پرونده اعتباری</p>
                  </div>

                  {customerSales.flatMap((s) =>
                    s.timeline.map((tl) => (
                      <div key={tl.id} className="relative pr-6">
                        <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-[#181920]" />
                        <div className="text-zinc-400 font-mono text-[10px]">{toPersianDigits(tl.date)}</div>
                        <div className="font-bold text-zinc-200">{tl.title} ({s.vehicleFullName})</div>
                        <p className="text-[11px] text-zinc-400">{tl.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Overlays */}
      {printFormADossier && (
        <PrintableFormA
          dossier={printFormADossier}
          onClose={() => setPrintFormADossier(null)}
        />
      )}

      {printFormBDossier && (
        <PrintableFormB
          dossier={printFormBDossier}
          onClose={() => setPrintFormBDossier(null)}
        />
      )}

      {printFullDossier && (
        <PrintableSaleDossier
          dossier={printFullDossier}
          onClose={() => setPrintFullDossier(null)}
        />
      )}
    </>
  );
};
