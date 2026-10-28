import React, { useMemo } from 'react';
import {
  X,
  Car,
  Plus,
  Calendar,
  ShieldCheck,
  Clock,
  AlertCircle,
  Wrench,
  Fuel,
  DollarSign,
  Tag,
  FileText,
  ChevronLeft,
  User,
  ArrowRightLeft,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { Vehicle, InspectionStatus } from '../types/accounting';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { useAccounting } from '../context/AccountingContext';

interface VehicleDetailDrawerProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onOpenQuickExpenseForVehicle: (vehicleId: string) => void;
  onOpenSaleDossier?: (saleId: string) => void;
  onCreateSaleForVehicle?: (vehicleId: string) => void;
}

export const VehicleDetailDrawer: React.FC<VehicleDetailDrawerProps> = ({
  vehicle,
  onClose,
  onOpenQuickExpenseForVehicle,
  onOpenSaleDossier,
  onCreateSaleForVehicle,
}) => {
  const {
    expenses,
    updateVehicleInspection,
    activities,
    isPeriodReadOnly,
    saleDossiers,
    consignmentAgreements,
    ownerSettlements,
    vehicleInspections,
    expiringDocs,
  } = useAccounting();

  if (!vehicle) return null;

  const isConsignment = vehicle.ownershipType === 'consignment';
  const agreement = consignmentAgreements.find((a) => a.vehicleId === vehicle.id);
  const settlement = ownerSettlements.find((s) => s.vehicleId === vehicle.id);
  const inspectionRecord = vehicleInspections.find((i) => i.vehicleId === vehicle.id);

  // Check if this vehicle is sold / has a sale dossier
  const vehicleSale = saleDossiers.find((s) => s.vehicleId === vehicle.id);

  // Expenses specifically tied to this vehicle
  const vehicleExpenses = useMemo(() => {
    return expenses.filter((e) => e.status === 'active' && e.vehicleId === vehicle.id);
  }, [expenses, vehicle.id]);

  const totalExpense = useMemo(() => {
    return vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [vehicleExpenses]);

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    vehicleExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [vehicleExpenses]);

  const inspectionLabels: Record<InspectionStatus, { label: string; color: string; bg: string }> = {
    inspected: { label: 'کارشناسی انجام شد', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    pending_inspection: { label: 'در انتظار کارشناسی', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    not_inspected: { label: 'کارشناسی نشده', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' },
    cancelled: { label: 'لغو شد', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  };

  const currentInspection = inspectionLabels[vehicle.inspectionStatus];

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div
        id="vehicle-detail-drawer"
        className="w-full max-w-lg bg-[#16171b] border-l border-[#282a31] h-full flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#26282e] flex items-center justify-between bg-[#131417]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                {vehicle.brand}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${currentInspection.bg} ${currentInspection.color}`}>
                {currentInspection.label}
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-100 mt-1">{vehicle.fullName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Vehicle Specs Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[#191b20] border border-[#26282e]">
            <div>
              <span className="text-zinc-500 block mb-0.5">شماره پلاک:</span>
              <span className="font-mono font-bold text-zinc-200 text-sm">{toPersianDigits(vehicle.plate)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5">رنگ بدنه:</span>
              <span className="font-medium text-zinc-200">{vehicle.color}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#23252b]">
              <span className="text-zinc-500 block mb-0.5">شماره شاسی (VIN):</span>
              <span className="font-mono text-zinc-300 select-all tracking-wider text-[11px]">{vehicle.vin}</span>
            </div>
          </div>

          {/* Phase 08: Ownership & Consignment Information Card */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              isConsignment
                ? 'bg-purple-950/20 border-purple-500/30'
                : 'bg-amber-950/15 border-amber-500/25'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-inherit">
              <div className="flex items-center gap-2">
                {isConsignment ? (
                  <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                ) : (
                  <Building className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-bold text-zinc-100">
                  نوع مالکیت: {isConsignment ? 'خودروی امانی' : 'مالکیت نمایشگاه'}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isConsignment
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {isConsignment ? 'امانی' : 'خرید نمایشگاه'}
              </span>
            </div>

            {isConsignment ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-zinc-300">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">مالک خودرو:</span>
                    <strong className="text-zinc-100">
                      {vehicle.ownerName || agreement?.ownerName || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">تلفن مالک:</span>
                    <span className="font-mono">{toPersianDigits(vehicle.ownerPhone || '—')}</span>
                  </div>
                  {agreement && (
                    <>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">شماره قرارداد امانی:</span>
                        <span className="font-mono text-indigo-300">{agreement.contractNumber}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">شروع امانی:</span>
                        <span className="font-mono">{toPersianDigits(agreement.startDate)}</span>
                      </div>
                    </>
                  )}
                  {vehicle.askingPrice ? (
                    <div className="col-span-2 pt-1 border-t border-purple-500/20 flex justify-between items-center">
                      <span className="text-zinc-400">قیمت پیشنهادی فروش:</span>
                      <strong className="font-mono text-amber-400">{formatToman(vehicle.askingPrice)}</strong>
                    </div>
                  ) : null}
                </div>

                {settlement && (
                  <div className="p-2.5 rounded-lg bg-[#14151e] border border-purple-500/20 text-[11px] space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>حق کمیسیون نمایشگاه:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatToman(settlement.dealershipCommission)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>مبلغ قابل تسویه مالک:</span>
                      <span className="font-mono text-zinc-200">
                        {formatToman(settlement.netPayableToOwner)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-[#232535]">
                      <span className="text-amber-400">مانده تسویه با مالک:</span>
                      <span className="font-mono text-amber-400">
                        {formatToman(settlement.remainingAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                <div>
                  <span className="text-zinc-500 block text-[11px]">طرف فروشنده:</span>
                  <span>{vehicle.sellerName || 'اتو عبداللهی'}</span>
                </div>
                {vehicle.purchasePrice ? (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">بهای خرید نمایشگاه:</span>
                    <strong className="font-mono text-amber-400">
                      {formatToman(vehicle.purchasePrice)}
                    </strong>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Inspection / 3D Damage Record Summary */}
          {inspectionRecord && (
            <div className="p-3 rounded-xl bg-[#191b20] border border-[#272932] space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#24262e] pb-1.5 font-bold text-zinc-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>فرم کارشناسی و چک‌لیست اقلام تحویلی</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {toPersianDigits(inspectionRecord.date)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <div>
                  اقلام بررسی شده:{' '}
                  <strong className="text-zinc-200 font-mono">
                    {toPersianDigits(
                      inspectionRecord.checklist.filter((c) => c.state !== 'uninspected').length
                    )}{' '}
                    / {toPersianDigits(inspectionRecord.checklist.length)}
                  </strong>
                </div>
                <div>
                  نقاط آسیب روی دیاگرام بدنه:{' '}
                  <strong className="text-amber-400 font-mono">
                    {toPersianDigits(inspectionRecord.damageMarkers.length)} مورد
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Inspection Status Selector */}
          <div className="p-3 rounded-lg bg-[#191b20] border border-[#26282e] space-y-2">
            <span className="font-semibold text-zinc-300 block">وضعیت کارشناسی خودرو:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['inspected', 'pending_inspection', 'not_inspected', 'cancelled'] as InspectionStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => updateVehicleInspection(vehicle.id, st)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] border transition-colors cursor-pointer text-center ${
                    vehicle.inspectionStatus === st
                      ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500'
                      : 'bg-[#141519] text-zinc-400 hover:text-zinc-200 border-[#2b2d35]'
                  }`}
                >
                  {inspectionLabels[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* Sale & Delivery Dossier Status */}
          <div className="p-3.5 rounded-xl bg-[#191b20] border border-[#282a32] text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-zinc-200 border-b border-[#24262e] pb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>پرونده فروش و تحویل خودرو</span>
              </span>
              {vehicleSale ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  فروخته شده ({vehicleSale.saleNumber})
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  موجود در انبار
                </span>
              )}
            </div>

            {vehicleSale ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div>خریدار: <strong className="text-zinc-100">{vehicleSale.customerName}</strong></div>
                  <div>مبلغ معامله: <strong className="text-amber-400 font-mono">{formatToman(vehicleSale.salePrice)}</strong></div>
                  <div>تاریخ تحویل: <span>{toPersianDigits(vehicleSale.deliveryDate)}</span></div>
                  <div>فرم مدارک و خودرو: <span className="text-emerald-400">تکمیل شده ✓</span></div>
                </div>

                <div className="pt-2 border-t border-[#23252b] flex items-center justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSaleDossier?.(vehicleSale.id);
                    }}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>مشاهده پرونده فروش و فرم‌های تحویل</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-zinc-400">این خودرو هنوز پرونده فروش و تحویل ثبت‌شده ندارد.</p>
                <button
                  onClick={() => {
                    onClose();
                    onCreateSaleForVehicle?.(vehicle.id);
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>ثبت فروش</span>
                </button>
              </div>
            )}
          </div>

          {/* Total Cost Banner & Action */}
          <div className="p-4 rounded-xl bg-[#1c1e24] border border-[#2b2e37] flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block mb-0.5">مجموع هزینه‌های مرتبط</span>
              <span className="text-lg font-extrabold text-amber-400 font-mono">
                {formatToman(totalExpense)}
              </span>
            </div>
            <button
              onClick={() => {
                if (isPeriodReadOnly) return;
                onOpenQuickExpenseForVehicle(vehicle.id);
                onClose();
              }}
              disabled={isPeriodReadOnly}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors flex items-center gap-1 ${
                isPeriodReadOnly
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer'
              }`}
              title={isPeriodReadOnly ? 'دوره مالی بسته شده است (فقط خواندنی)' : 'ثبت هزینه برای این خودرو'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت هزینه</span>
            </button>
          </div>

          {/* Cost Breakdown by Category */}
          {categoryBreakdown.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-zinc-300 block">تفکیک هزینه‌ها:</span>
              <div className="space-y-1.5">
                {categoryBreakdown.map(([cat, amount]) => (
                  <div
                    key={cat}
                    className="p-2 rounded-lg bg-[#191b20] border border-[#26282e] flex items-center justify-between"
                  >
                    <span className="text-zinc-300">{cat}</span>
                    <span className="font-mono font-semibold text-zinc-200">{formatToman(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Timeline / Activity */}
          <div className="space-y-2 pt-2">
            <span className="font-semibold text-zinc-300 block">
              سوابق و هزینه‌های این خودرو ({toPersianDigits(vehicleExpenses.length)} مورد):
            </span>

            {vehicleExpenses.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 bg-[#141519] rounded-lg border border-[#22242a]">
                هنوز هزینه‌ای برای این خودرو ثبت نشده است
              </div>
            ) : (
              <div className="divide-y divide-[#22242a] bg-[#141519] border border-[#26282e] rounded-xl overflow-hidden">
                {vehicleExpenses.map((exp) => (
                  <div key={exp.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-200">{exp.description}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {exp.category} • {exp.personName} • {toPersianDigits(exp.date)}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {formatToman(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#26282e] bg-[#131417] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-[#22252c] hover:bg-[#2b2e37] text-zinc-200 border border-[#333742] rounded-lg transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
