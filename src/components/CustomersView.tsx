import React, { useState } from 'react';
import { Customer } from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  User,
  Users,
  Search,
  Plus,
  Car,
  Phone,
  Calendar,
  ChevronLeft,
  Tag,
  Star,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { NewCustomerModal } from './NewCustomerModal';

interface CustomersViewProps {
  onOpenSaleDossier: (saleId: string) => void;
  onCreateSaleForCustomer: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenSaleDossier,
  onCreateSaleForCustomer,
}) => {
  const { customers, saleDossiers } = useAccounting();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Filter customers by query (supports fuzzy / partial matching on name, phone, national ID, address)
  const q = searchQuery.trim().toLowerCase();
  const filteredCustomers = customers.filter((c) => {
    if (!q) return true;
    const nameMatch = c.fullName.toLowerCase().includes(q);
    const phoneMatch = c.phone.includes(q) || (c.phone2 && c.phone2.includes(q));
    const natIdMatch = c.nationalId && c.nationalId.includes(q);
    const fileNoMatch = c.fileNumber.toLowerCase().includes(q);
    const addressMatch = c.address.toLowerCase().includes(q);
    return nameMatch || phoneMatch || natIdMatch || fileNoMatch || addressMatch;
  });

  // Stats calculation
  const totalCustomers = customers.length;
  const vipCustomersCount = customers.filter(
    (c) => c.tags?.some((t) => t.includes('VIP') || t.includes('ویژه'))
  ).length;
  const totalDeliveredVehicles = saleDossiers.filter((s) => s.status === 'delivered').length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#141518] border border-[#252830] p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-zinc-100">
                پرونده مشتریان (Customer Master Dossiers)
              </h1>
              <p className="text-xs text-zinc-400">
                بانک اطلاعاتی یکپارچه خریداران خودرو، پرونده‌های فروش و مدارک تحویل
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsNewCustomerModalOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>تشکیل پرونده مشتری جدید</span>
          </button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#16171b] border border-[#26282f] p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">کل پرونده‌های ثبت‌شده</span>
            <span className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              {toPersianDigits(totalCustomers)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16171b] border border-[#26282f] p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">خودروهای تحویل داده شده</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {toPersianDigits(totalDeliveredVehicles)} دستگاه
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16171b] border border-[#26282f] p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">مشتریان ویژه (VIP)</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {toPersianDigits(vipCustomersCount)} نفر
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-[#15161a] border border-[#272932] p-3 rounded-xl flex items-center gap-3">
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در نام خریدار، کد ملی، شماره موبایل، آدرس یا شناسه پرونده (مثال: رضایی، ۰۹۱۲)..."
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

      {/* Customers List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-[#141519] border border-dashed border-[#292c36] rounded-2xl">
          <User className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-300 mb-1">مشتری مورد نظر یافت نشد</h3>
          <p className="text-xs text-zinc-500 mb-4">
            هیچ پرونده‌ای با مشخصات واردشده در سیستم یافت نشد.
          </p>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsNewCustomerModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-xs"
          >
            تشکیل پرونده برای این شخص
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((cust) => {
            // Find all vehicles purchased by this customer
            const custSales = saleDossiers.filter((s) => s.customerId === cust.id);
            const latestSale = custSales[custSales.length - 1];

            return (
              <div
                key={cust.id}
                className="p-4 sm:p-5 bg-[#16171b] border border-[#272932] hover:border-amber-500/40 rounded-2xl transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#20222a] border border-[#2e313c] flex items-center justify-center font-bold text-amber-400 text-sm group-hover:border-amber-500/30 transition-colors">
                        {cust.fullName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-zinc-100">{cust.fullName}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#20222a] text-zinc-400 border border-[#2c2f3a]">
                            {cust.fileNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span className="font-mono">{toPersianDigits(cust.phone)}</span>
                          {cust.nationalId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[11px]">کد ملی: {toPersianDigits(cust.nationalId)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {toPersianDigits(cust.createdAt)}
                      </span>
                      {cust.tags && cust.tags[0] && (
                        <span className="mt-1 text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {cust.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vehicle History Snippet */}
                  <div className="bg-[#121316] border border-[#22242c] rounded-xl p-3 mb-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-amber-400" />
                        <span>خودروهای خریداری‌شده:</span>
                      </span>
                      <span className="font-bold text-zinc-200 font-mono">
                        {toPersianDigits(custSales.length)} خودرو
                      </span>
                    </div>

                    {latestSale ? (
                      <div className="pt-1.5 border-t border-[#1c1e24] flex items-center justify-between">
                        <div>
                          <span className="text-zinc-200 font-semibold block">{latestSale.vehicleFullName}</span>
                          <span className="text-[10px] text-zinc-500">
                            پلاک: {toPersianDigits(latestSale.deliveryFormB.plateNumber || '—')} • تحویل: {toPersianDigits(latestSale.deliveryDate)}
                          </span>
                        </div>
                        <span className="text-amber-400 font-mono font-bold text-xs">
                          {formatToman(latestSale.salePrice)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic pt-1">
                        هنوز خودرویی برای این پرونده ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-[#23252c] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onCreateSaleForCustomer(cust.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1f2128] hover:bg-[#282a34] text-zinc-300 hover:text-white text-xs font-medium border border-[#2d303a] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>معامله جدید</span>
                  </button>

                  <button
                    onClick={() => setSelectedCustomer(cust)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>مشاهده پرونده کامل</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEditCustomer={(cust) => {
            setEditingCustomer(cust);
            setIsNewCustomerModalOpen(true);
          }}
          onCreateSaleForCustomer={(cId) => {
            setSelectedCustomer(null);
            onCreateSaleForCustomer(cId);
          }}
          onOpenSaleDossier={(sId) => {
            setSelectedCustomer(null);
            onOpenSaleDossier(sId);
          }}
        />
      )}

      {/* New or Edit Customer Modal */}
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => {
          setIsNewCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        initialCustomer={editingCustomer}
        onCustomerSaved={(saved) => {
          if (selectedCustomer && selectedCustomer.id === saved.id) {
            setSelectedCustomer(saved);
          }
        }}
      />
    </div>
  );
};
