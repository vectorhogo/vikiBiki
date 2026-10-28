import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Receipt,
  Car,
  User,
  Wallet,
  ArrowLeft,
  FileText,
  Calendar,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { NavigationTab } from './Sidebar';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenCustomer?: (customerId: string) => void;
  onOpenSaleDossier?: (saleId: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCustomer,
  onOpenSaleDossier,
}) => {
  const { expenses, vehicles, personnel, cashAdvances, customers, saleDossiers, contracts } = useAccounting();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // 1. Matched Customers (fuzzy / partial match on name, nationalId, phone, fileNumber)
  const matchedCustomers = q
    ? customers
        .filter((c) => c.status === 'active')
        .filter(
          (c) =>
            c.fullName.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.phone2 && c.phone2.includes(q)) ||
            (c.nationalId && c.nationalId.includes(q)) ||
            c.fileNumber.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  // 2. Matched Vehicles (brand, model, plate, VIN, color)
  const matchedVehicles = q
    ? vehicles
        .filter((v) => v.status === 'active')
        .filter(
          (v) =>
            v.fullName.toLowerCase().includes(q) ||
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.plate.toLowerCase().includes(q) ||
            v.vin.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  // 3. Matched Sale Dossiers & Deals
  const matchedSales = q
    ? saleDossiers
        .filter(
          (s) =>
            s.saleNumber.toLowerCase().includes(q) ||
            s.contractNumber.toLowerCase().includes(q) ||
            s.customerName.toLowerCase().includes(q) ||
            s.vehicleFullName.toLowerCase().includes(q) ||
            s.deliveryFormB?.plateNumber?.toLowerCase().includes(q) ||
            s.deliveryFormB?.chassisNumber?.toLowerCase().includes(q) ||
            s.deliveryDate.includes(q) ||
            s.saleDate.includes(q)
        )
        .slice(0, 4)
    : [];

  // 4. Matched Expenses
  const matchedExpenses = q
    ? expenses
        .filter((e) => e.status === 'active')
        .filter(
          (e) =>
            e.description.toLowerCase().includes(q) ||
            e.personName.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            (e.vehicleLabel && e.vehicleLabel.toLowerCase().includes(q)) ||
            e.amount.toString().includes(q)
        )
        .slice(0, 4)
    : [];

  // 5. Matched Contracts & Pacts
  const matchedContracts = q
    ? contracts
        .filter(
          (c) =>
            c.contractNumber.toLowerCase().includes(q) ||
            c.vehicleLabel.toLowerCase().includes(q) ||
            c.parties.buyer.name.toLowerCase().includes(q) ||
            c.parties.seller.name.toLowerCase().includes(q) ||
            (c.vehicleSnapshot.chassisNumber && c.vehicleSnapshot.chassisNumber.toLowerCase().includes(q))
        )
        .slice(0, 3)
    : [];

  // 6. Matched Cash Advances
  const matchedAdvances = q
    ? cashAdvances
        .filter(
          (a) =>
            a.personName.toLowerCase().includes(q) ||
            a.reason.toLowerCase().includes(q) ||
            a.amount.toString().includes(q)
        )
        .slice(0, 3)
    : [];

  const hasResults =
    matchedCustomers.length > 0 ||
    matchedVehicles.length > 0 ||
    matchedContracts.length > 0 ||
    matchedSales.length > 0 ||
    matchedExpenses.length > 0 ||
    matchedAdvances.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-[#17181d] border border-[#2e313b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#252830] flex items-center gap-3 bg-[#131417]">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="جستجو در مشتری، خودرو، پلاک، شاسی، قرارداد، پرونده فروش..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-500 hover:text-zinc-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#202229] border border-[#2c2f38] text-[10px] text-zinc-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {!q ? (
            <div className="py-10 text-center text-zinc-500">
              <p className="text-sm font-medium text-zinc-400 mb-1">
                جستجوی جامع در تمامی بخش‌های نمایشگاه اتو عبداللهی
              </p>
              <p className="text-xs text-zinc-600">
                مثال: علی رضایی، کمری، Toyota، پلاک ۶۷الف، شاسی 4T1B، یا شماره پرونده S-1405
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-10 text-center text-zinc-500">
              نتیجه‌ای برای «<strong className="text-zinc-300">{query}</strong>» یافت نشد.
            </div>
          ) : (
            <>
              {/* GROUP 1: CUSTOMERS (مشتریان) */}
              {matchedCustomers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <User className="w-4 h-4" />
                      <span>مشتریان (Customer Dossiers)</span>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('customers');
                      }}
                      className="text-[11px] text-zinc-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>همه مشتریان</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedCustomers.map((cust) => {
                      const custSales = saleDossiers.filter((s) => s.customerId === cust.id);
                      const latestSale = custSales[custSales.length - 1];

                      return (
                        <div
                          key={cust.id}
                          className="p-3 bg-[#131417] hover:bg-[#1a1b22] border border-[#262832] hover:border-amber-500/40 rounded-xl transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-1.5">
                              <div>
                                <h4 className="font-bold text-sm text-zinc-100">{cust.fullName}</h4>
                                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                  {toPersianDigits(cust.phone)}
                                  {cust.nationalId && ` • کد ملی: ${toPersianDigits(cust.nationalId)}`}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                {cust.fileNumber}
                              </span>
                            </div>

                            {latestSale && (
                              <div className="pt-1.5 border-t border-[#20222a] text-[11px] text-zinc-300">
                                <span className="text-zinc-500 block text-[10px]">آخرین خودرو خریداری‌شده:</span>
                                <div className="font-semibold text-zinc-200">{latestSale.vehicleFullName}</div>
                                <div className="text-zinc-400 text-[10px]">
                                  پلاک: {toPersianDigits(latestSale.deliveryFormB.plateNumber || '—')} • معامله: {toPersianDigits(latestSale.saleDate)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 mt-2 border-t border-[#20222a] flex items-center justify-end">
                            <button
                              onClick={() => {
                                onClose();
                                if (onOpenCustomer) {
                                  onOpenCustomer(cust.id);
                                } else {
                                  onNavigate('customers');
                                }
                              }}
                              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                            >
                              <span>مشاهده پرونده مشتری</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GROUP 2: VEHICLE SALES ARCHIVE (معاملات و پرونده‌های فروش) */}
              {matchedSales.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <FileText className="w-4 h-4" />
                      <span>پرونده‌های فروش و تحویل خودرو (Sales Archive)</span>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('sales');
                      }}
                      className="text-[11px] text-zinc-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>همه پرونده‌های فروش</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {matchedSales.map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => {
                          onClose();
                          if (onOpenSaleDossier) {
                            onOpenSaleDossier(sale.id);
                          } else {
                            onNavigate('sales');
                          }
                        }}
                        className="p-3 bg-[#131417] hover:bg-[#1a1b22] border border-[#262832] hover:border-sky-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100">{sale.vehicleFullName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                {sale.saleNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              خریدار: <strong className="text-zinc-200">{sale.customerName}</strong> • پلاک: {toPersianDigits(sale.deliveryFormB.plateNumber || '—')}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="font-bold text-amber-400 font-mono text-xs block">
                            {formatToman(sale.salePrice)}
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            {sale.status === 'delivered' ? 'تحویل شد ✓' : 'در انتظار تحویل'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GROUP 2.5: SMART CONTRACTS (قراردادها و مبایعه‌نامه‌ها) */}
              {matchedContracts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <FileText className="w-4 h-4" />
                      <span>قراردادها و مبایعه‌نامه‌ها</span>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('contracts');
                      }}
                      className="text-[11px] text-zinc-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>همه قراردادها</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {matchedContracts.map((cnt) => (
                      <div
                        key={cnt.id}
                        onClick={() => {
                          onClose();
                          onNavigate('contracts');
                        }}
                        className="p-3 bg-[#131417] hover:bg-[#1a1b22] border border-[#262832] hover:border-amber-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-mono text-xs font-bold">
                            {cnt.contractType === 'sale' ? 'فروش' : 'خرید'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100 font-mono">
                                {cnt.contractNumber}
                              </span>
                              <span className="text-zinc-400 font-medium text-xs">
                                — {cnt.vehicleLabel}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              خریدار: <strong className="text-zinc-200">{cnt.parties.buyer.name}</strong> • تاریخ: {toPersianDigits(cnt.contractDate)}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="font-bold text-emerald-400 font-mono text-xs block font-en-num">
                            {formatToman(cnt.financials.totalAgreedPrice)}
                          </span>
                          <span className="text-[10px] text-sky-400 font-en-num">
                            مانده: {formatToman(cnt.financials.remainingBalance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GROUP 3: VEHICLES (خودروها) */}
              {matchedVehicles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Car className="w-4 h-4 text-sky-400" />
                      <span>خودروهای نمایشگاه</span>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('vehicles');
                      }}
                      className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>مشاهده در انبار خودرو</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedVehicles.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          onClose();
                          onNavigate('vehicles');
                        }}
                        className="p-2.5 bg-[#131417] hover:bg-[#1a1b22] border border-[#262832] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-zinc-100">{v.fullName}</div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            پلاک: {toPersianDigits(v.plate)} • شاسی: {v.vin.slice(0, 10)}...
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-800">
                          {v.inspectionStatus === 'inspected' ? 'کارشناسی شده' : 'در انتظار'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GROUP 4: EXPENSES (هزینه‌ها) */}
              {matchedExpenses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>هزینه‌ها و اسناد مالی</span>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('expenses');
                      }}
                      className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>مشاهده در هزینه‌ها</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {matchedExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() => {
                          onClose();
                          onNavigate('expenses');
                        }}
                        className="p-2.5 bg-[#131417] hover:bg-[#1a1b22] border border-[#262832] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-zinc-200">{exp.description}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {exp.personName} • {toPersianDigits(exp.date)}
                            {exp.vehicleLabel && ` • ${exp.vehicleLabel}`}
                          </div>
                        </div>
                        <div className="font-bold font-mono text-zinc-200 text-xs">
                          {formatToman(exp.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
