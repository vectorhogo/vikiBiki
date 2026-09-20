import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Vehicle, InspectionStatus } from '../types/accounting';
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
} from 'lucide-react';
import { VehicleDetailDrawer } from './VehicleDetailDrawer';
import { NewVehicleModal } from './NewVehicleModal';

interface VehiclesViewProps {
  onOpenQuickExpenseForVehicle: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenQuickExpenseForVehicle,
}) => {
  const { vehicles, expenses } = useAccounting();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspectionFilter, setSelectedInspectionFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);

  // Compute expenses per vehicle
  const vehicleExpenseMap = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.status === 'active' && e.vehicleId) {
        map[e.vehicleId] = (map[e.vehicleId] || 0) + e.amount;
      }
    });
    return map;
  }, [expenses]);

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => v.status === 'active')
      .filter((v) => {
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = v.fullName.toLowerCase().includes(q);
          const matchPlate = v.plate.toLowerCase().includes(q);
          const matchVin = v.vin.toLowerCase().includes(q);
          const matchBrand = v.brand.toLowerCase().includes(q);
          if (!matchName && !matchPlate && !matchVin && !matchBrand) return false;
        }

        if (selectedInspectionFilter !== 'all' && v.inspectionStatus !== selectedInspectionFilter) {
          return false;
        }

        return true;
      });
  }, [vehicles, searchTerm, selectedInspectionFilter]);

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

  return (
    <div className="space-y-4 max-w-6xl mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#17181d] border border-[#26282e] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-zinc-100">خودروها و کارشناسی</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {toPersianDigits(filteredVehicles.length)} دستگاه
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            ثبت خودروهای ورودی، رهگیری وضعیت کارشناسی رنگ و فنی، و تجمیع هزینه‌های هر خودرو
          </p>
        </div>

        <button
          onClick={() => setIsNewVehicleModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت خودرو جدید</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#17181d] border border-[#26282e] p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجو در مدل، پلاک، شماره شاسی یا برند..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131417] border border-[#2b2d35] focus:border-amber-500 rounded-lg pr-9 pl-3 py-1.5 text-xs text-zinc-200 focus:outline-none transition-colors"
          />
        </div>

        {/* Inspection Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">وضعیت کارشناسی:</span>
          <select
            value={selectedInspectionFilter}
            onChange={(e) => setSelectedInspectionFilter(e.target.value)}
            className="bg-[#131417] border border-[#2b2d35] rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none"
          >
            <option value="all">همه خودروها</option>
            <option value="pending_inspection">در انتظار کارشناسی</option>
            <option value="inspected">کارشناسی انجام شد</option>
            <option value="not_inspected">کارشناسی نشده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e] font-medium">
              <tr>
                <th className="py-3 px-4">برند و مدل</th>
                <th className="py-3 px-4">شماره پلاک</th>
                <th className="py-3 px-4">شماره شاسی (VIN)</th>
                <th className="py-3 px-4">رنگ بدنه</th>
                <th className="py-3 px-4 text-center">وضعیت کارشناسی</th>
                <th className="py-3 px-4 text-left">مجموع هزینه‌ها</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22242a]">
              {filteredVehicles.map((vehicle) => {
                const totalCost = vehicleExpenseMap[vehicle.id] || 0;

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="hover:bg-[#1f2128]/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-zinc-100 whitespace-nowrap">
                      {vehicle.fullName}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-amber-400 whitespace-nowrap">
                      {toPersianDigits(vehicle.plate)}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400 text-[11px] whitespace-nowrap tracking-wider">
                      {vehicle.vin}
                    </td>

                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                      {vehicle.color}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {inspectionBadge(vehicle.inspectionStatus)}
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-bold text-zinc-200 whitespace-nowrap">
                      {totalCost > 0 ? formatToman(totalCost) : <span className="text-zinc-600 font-normal">۰</span>}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="px-2 py-1 bg-[#202229] hover:bg-[#2a2d36] text-zinc-300 rounded border border-[#2e313c] transition-colors"
                          title="مشاهده پرونده و هزینه‌ها"
                        >
                          پرونده
                        </button>
                        <button
                          onClick={() => onOpenQuickExpenseForVehicle(vehicle.id)}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded border border-amber-500/25 transition-colors flex items-center gap-1"
                          title="ثبت هزینه برای این خودرو"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>ثبت هزینه</span>
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
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onOpenQuickExpenseForVehicle={onOpenQuickExpenseForVehicle}
      />

      {/* New Vehicle Modal */}
      <NewVehicleModal
        isOpen={isNewVehicleModalOpen}
        onClose={() => setIsNewVehicleModalOpen(false)}
      />
    </div>
  );
};
