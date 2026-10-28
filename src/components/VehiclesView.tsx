import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Vehicle, InspectionStatus } from '../types/accounting';
import {
  OwnershipType,
  ConsignmentStatus,
  ConsignmentAgreement,
  OwnerSettlement,
  VehicleHandoverInspection,
  ConsignmentReturnRecord,
} from '../types/consignment';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  Car,
  Search,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  Eye,
  Receipt,
  CheckCircle2,
  Wallet,
  RotateCcw,
  User,
  SlidersHorizontal,
  Building,
  ArrowRightLeft,
  FileCheck,
  Filter,
  Rotate3d,
} from 'lucide-react';
import { VehicleDetailDrawer } from './VehicleDetailDrawer';
import { VehicleIntakeModal } from './VehicleIntakeModal';
import { VehicleHandoverModal } from './VehicleHandoverModal';
import { OwnerSettlementDrawer } from './OwnerSettlementDrawer';
import { ConsignmentReturnModal } from './ConsignmentReturnModal';

interface VehiclesViewProps {
  onOpenQuickExpenseForVehicle: (vehicleId: string) => void;
  onOpenSaleDossier?: (saleId: string) => void;
  onCreateSaleForVehicle?: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenQuickExpenseForVehicle,
  onOpenSaleDossier,
  onCreateSaleForVehicle,
}) => {
  const {
    vehicles,
    expenses,
    isPeriodReadOnly,
    consignmentAgreements,
    ownerSettlements,
    vehicleInspections,
    addVehicle,
    addConsignmentAgreement,
    saveVehicleHandoverInspection,
    updateOwnerSettlement,
    addConsignmentReturn,
  } = useAccounting();

  // Search & Ownership Tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [ownershipTab, setOwnershipTab] = useState<'all' | 'owned' | 'consignment'>('all');
  const [consignmentStatusFilter, setConsignmentStatusFilter] = useState<string>('all');
  const [selectedInspectionFilter, setSelectedInspectionFilter] = useState<string>('all');

  // Modals & Drawers state
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [handoverVehicle, setHandoverVehicle] = useState<Vehicle | null>(null);
  const [settlementVehicle, setSettlementVehicle] = useState<{
    vehicle: Vehicle;
    settlement: OwnerSettlement;
  } | null>(null);
  const [returnVehicle, setReturnVehicle] = useState<{
    vehicle: Vehicle;
    agreement?: ConsignmentAgreement;
  } | null>(null);

  // Compute expenses per vehicle and distinguish dealership vs owner-responsible
  const vehicleExpenseMap = useMemo(() => {
    const map: Record<string, { total: number; dealership: number; ownerDeductible: number }> = {};
    expenses.forEach((e) => {
      if (e.status === 'active' && e.vehicleId) {
        if (!map[e.vehicleId]) {
          map[e.vehicleId] = { total: 0, dealership: 0, ownerDeductible: 0 };
        }
        map[e.vehicleId].total += e.amount;
        if (e.expenseResponsibility === 'owner') {
          map[e.vehicleId].ownerDeductible += e.amount;
        } else {
          map[e.vehicleId].dealership += e.amount;
        }
      }
    });
    return map;
  }, [expenses]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => v.status === 'active')
      .filter((v) => {
        // Ownership filter
        const vOwnership: OwnershipType = (v.ownershipType as OwnershipType) || 'owned';
        if (ownershipTab === 'owned' && vOwnership !== 'owned') return false;
        if (ownershipTab === 'consignment' && vOwnership !== 'consignment') return false;

        // Consignment status filter
        if (ownershipTab === 'consignment' && consignmentStatusFilter !== 'all') {
          if (v.consignmentStatus !== consignmentStatusFilter) return false;
        }

        // Inspection filter
        if (selectedInspectionFilter !== 'all' && v.inspectionStatus !== selectedInspectionFilter) {
          return false;
        }

        // Search query
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = v.fullName.toLowerCase().includes(q);
          const matchPlate = v.plate.toLowerCase().includes(q);
          const matchVin = v.vin.toLowerCase().includes(q);
          const matchBrand = v.brand.toLowerCase().includes(q);
          const matchOwner = v.ownerName?.toLowerCase().includes(q);
          if (!matchName && !matchPlate && !matchVin && !matchBrand && !matchOwner) {
            return false;
          }
        }

        return true;
      });
  }, [vehicles, ownershipTab, consignmentStatusFilter, selectedInspectionFilter, searchTerm]);

  // Counts for tabs
  const ownedCount = vehicles.filter(
    (v) => v.status === 'active' && (v.ownershipType || 'owned') === 'owned'
  ).length;
  const consignmentCount = vehicles.filter(
    (v) => v.status === 'active' && v.ownershipType === 'consignment'
  ).length;

  const inspectionBadge = (status: InspectionStatus) => {
    switch (status) {
      case 'inspected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>کارشناسی انجام شد</span>
          </span>
        );
      case 'pending_inspection':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            <Clock className="w-3 h-3" />
            <span>در انتظار کارشناسی</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>لغو شد</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
            <span>کارشناسی نشده</span>
          </span>
        );
    }
  };

  const consignmentStatusBadge = (status?: ConsignmentStatus) => {
    switch (status) {
      case 'in_showroom':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            در نمایشگاه
          </span>
        );
      case 'ready_for_sale':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            آماده فروش
          </span>
        );
      case 'sold':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            فروخته‌شده
          </span>
        );
      case 'pending_settlement':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            در انتظار تسویه
          </span>
        );
      case 'settled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            تسویه کامل ✓
          </span>
        );
      case 'returned':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700 text-zinc-300 border border-zinc-600">
            مرجوع‌شده به مالک
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            پذیرش اولیه
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#17181d] border border-[#26282e] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-zinc-100">
              مدیریت خودروها و انبار نمایشگاه
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {toPersianDigits(filteredVehicles.length)} دستگاه
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            تفکیک ساختاری خودروهای مالکیت نمایشگاه در برابر خودروهای امانی، کارشناسی ۳ بعدی بدنه و تسویه حساب مالکین
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsIntakeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ورود خودرو (Intake)</span>
          </button>
        </div>
      </div>

      {/* Main Ownership Filter Tabs (Section 15, 16, 17) */}
      <div className="flex items-center gap-2 border-b border-[#252834] bg-[#14151a] p-1.5 rounded-xl border">
        <button
          onClick={() => setOwnershipTab('all')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            ownershipTab === 'all'
              ? 'bg-[#20222a] text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>همه خودروها</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
            {toPersianDigits(vehicles.length)}
          </span>
        </button>

        <button
          onClick={() => setOwnershipTab('owned')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            ownershipTab === 'owned'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>خودروهای نمایشگاه (خریداری‌شده)</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
            {toPersianDigits(ownedCount)}
          </span>
        </button>

        <button
          onClick={() => setOwnershipTab('consignment')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            ownershipTab === 'consignment'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>خودروهای امانی (تحویل از مالک)</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
            {toPersianDigits(consignmentCount)}
          </span>
        </button>
      </div>

      {/* Sub-Filters: Search + Status */}
      <div className="bg-[#17181d] border border-[#26282e] p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجو در مدل، پلاک، شاسی، مالک یا برند..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131417] border border-[#2b2d35] focus:border-amber-500 rounded-lg pr-9 pl-3 py-1.5 text-xs text-zinc-200 focus:outline-none transition-colors"
          />
        </div>

        {/* Consignment Status Filter (Shown when in Consignment or All tab) */}
        {ownershipTab === 'consignment' && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">وضعیت امانی:</span>
            <select
              value={consignmentStatusFilter}
              onChange={(e) => setConsignmentStatusFilter(e.target.value)}
              className="bg-[#131417] border border-[#2b2d35] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="in_showroom">داخل نمایشگاه</option>
              <option value="sold">فروخته‌شده</option>
              <option value="pending_settlement">در انتظار تسویه</option>
              <option value="settled">تسویه شده</option>
              <option value="returned">مرجوع‌شده به مالک</option>
            </select>
          </div>
        )}

        {/* Inspection Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">وضعیت کارشناسی:</span>
          <select
            value={selectedInspectionFilter}
            onChange={(e) => setSelectedInspectionFilter(e.target.value)}
            className="bg-[#131417] border border-[#2b2d35] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
          >
            <option value="all">همه موارد</option>
            <option value="pending_inspection">در انتظار کارشناسی</option>
            <option value="inspected">کارشناسی انجام شد</option>
            <option value="not_inspected">کارشناسی نشده</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e] font-medium">
              <tr>
                <th className="py-3 px-4">خودرو و مدل</th>
                <th className="py-3 px-4">نوع مالکیت</th>
                <th className="py-3 px-4">مالک / تامین‌کننده</th>
                <th className="py-3 px-4">شماره پلاک</th>
                <th className="py-3 px-4">شماره شاسی</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-left">هزینه‌ها / تسویه</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22242a]">
              {filteredVehicles.map((vehicle) => {
                const costs = vehicleExpenseMap[vehicle.id] || {
                  total: 0,
                  dealership: 0,
                  ownerDeductible: 0,
                };
                const isConsignment = vehicle.ownershipType === 'consignment';
                const agreement = consignmentAgreements.find(
                  (a) => a.vehicleId === vehicle.id || a.id === vehicle.consignmentAgreementId
                );
                const settlement = ownerSettlements.find(
                  (s) => s.vehicleId === vehicle.id || s.agreementId === agreement?.id
                );

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleForDetail(vehicle)}
                    className="hover:bg-[#1f2128]/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-zinc-100 whitespace-nowrap">
                      <div>{vehicle.fullName}</div>
                      <div className="text-[10px] text-zinc-500 font-normal font-mono">
                        {vehicle.color || 'رنگ ثبت‌نشده'} • سال {toPersianDigits(vehicle.year || '—')}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConsignment
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isConsignment ? 'امانی' : 'نمایشگاه'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                      {isConsignment ? (
                        <div>
                          <div className="font-semibold text-zinc-200">
                            {vehicle.ownerName || agreement?.ownerName || 'مالک امانی'}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {toPersianDigits(vehicle.ownerPhone || '—')}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-zinc-300">{vehicle.sellerName || 'اتو عبداللهی'}</div>
                          {vehicle.purchasePrice ? (
                            <div className="text-[10px] text-amber-400/90 font-mono">
                              خرید: {formatToman(vehicle.purchasePrice)}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-amber-400 whitespace-nowrap">
                      {toPersianDigits(vehicle.plate)}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400 text-[11px] whitespace-nowrap tracking-wider">
                      {vehicle.vin}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap space-y-1">
                      <div>{inspectionBadge(vehicle.inspectionStatus)}</div>
                      {isConsignment && <div>{consignmentStatusBadge(vehicle.consignmentStatus)}</div>}
                    </td>

                    <td className="py-3 px-4 text-left font-mono whitespace-nowrap">
                      <div>
                        <span className="font-bold text-zinc-200">
                          {costs.total > 0 ? formatToman(costs.total) : '۰'}
                        </span>
                        {costs.ownerDeductible > 0 && (
                          <div className="text-[10px] text-rose-400">
                            ({formatToman(costs.ownerDeductible)} سهم مالک)
                          </div>
                        )}
                      </div>
                    </td>

                    <td
                      className="py-3 px-4 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. Handover & 3D Damage Map Button */}
                        <button
                          onClick={() => setHandoverVehicle(vehicle)}
                          className="px-2.5 py-1 bg-[#1c1f2b] hover:bg-[#252a3a] text-amber-300 rounded-lg border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                          title="فرم تحویل اقلام و کارشناسی ۳ بعدی بدنه تویوتا کمری"
                        >
                          <Rotate3d className="w-3.5 h-3.5 text-amber-400" />
                          <span>کارشناسی ۳D بدنه</span>
                        </button>

                        {/* 2. Consignment Settlement Button */}
                        {isConsignment && settlement && (
                          <button
                            onClick={() =>
                              setSettlementVehicle({ vehicle, settlement })
                            }
                            className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded border border-purple-500/25 flex items-center gap-1 transition-colors"
                            title="مشاهده و ثبت تسویه حساب با مالک"
                          >
                            <Wallet className="w-3 h-3 text-purple-400" />
                            <span>تسویه مالک</span>
                          </button>
                        )}

                        {/* 3. Consignment Return Button */}
                        {isConsignment && vehicle.consignmentStatus !== 'returned' && (
                          <button
                            onClick={() =>
                              setReturnVehicle({ vehicle, agreement })
                            }
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/25 flex items-center gap-1 transition-colors"
                            title="عودت خودروی امانی به مالک"
                          >
                            <RotateCcw className="w-3 h-3 text-rose-400" />
                            <span>عودت</span>
                          </button>
                        )}

                        {/* 4. Quick Expense Button */}
                        <button
                          onClick={() =>
                            !isPeriodReadOnly && onOpenQuickExpenseForVehicle(vehicle.id)
                          }
                          disabled={isPeriodReadOnly}
                          className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                            isPeriodReadOnly
                              ? 'bg-zinc-800 text-zinc-600 border-zinc-700/40 cursor-not-allowed'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/25 cursor-pointer'
                          }`}
                          title="ثبت هزینه برای این خودرو"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>هزینه</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <VehicleDetailDrawer
        vehicle={selectedVehicleForDetail}
        onClose={() => setSelectedVehicleForDetail(null)}
        onOpenQuickExpenseForVehicle={onOpenQuickExpenseForVehicle}
        onOpenSaleDossier={onOpenSaleDossier}
        onCreateSaleForVehicle={onCreateSaleForVehicle}
      />

      {/* Vehicle Intake Modal */}
      <VehicleIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onVehicleCreated={(newVeh, newAgreement) => {
          addVehicle(newVeh);
          if (newAgreement) {
            addConsignmentAgreement(newAgreement);
          }
          // Automatically prompt to open Handover & Damage form
          setHandoverVehicle(newVeh);
        }}
      />

      {/* Handover & 3D Damage Master Form Modal */}
      {handoverVehicle && (
        <VehicleHandoverModal
          isOpen={Boolean(handoverVehicle)}
          onClose={() => setHandoverVehicle(null)}
          vehicle={handoverVehicle}
          existingInspection={vehicleInspections.find(
            (i) => i.vehicleId === handoverVehicle.id
          )}
          onSaveInspection={(savedInsp) => {
            saveVehicleHandoverInspection(savedInsp);
            setHandoverVehicle(null);
          }}
        />
      )}

      {/* Owner Settlement Drawer */}
      {settlementVehicle && (
        <OwnerSettlementDrawer
          settlement={settlementVehicle.settlement}
          onClose={() => setSettlementVehicle(null)}
          onUpdateSettlement={(updated) => {
            updateOwnerSettlement(updated);
            setSettlementVehicle(null);
          }}
        />
      )}

      {/* Consignment Return Modal */}
      {returnVehicle && (
        <ConsignmentReturnModal
          isOpen={Boolean(returnVehicle)}
          onClose={() => setReturnVehicle(null)}
          vehicle={returnVehicle.vehicle}
          agreement={returnVehicle.agreement}
          onConfirmReturn={(returnRec) => {
            addConsignmentReturn(returnRec);
            setReturnVehicle(null);
          }}
        />
      )}
    </div>
  );
};
