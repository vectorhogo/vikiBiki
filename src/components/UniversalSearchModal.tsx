import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Receipt, Car, User, Wallet, ArrowLeft } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { NavigationTab } from './Sidebar';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { expenses, vehicles, personnel, cashAdvances } = useAccounting();
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
        .slice(0, 5)
    : [];

  const matchedVehicles = q
    ? vehicles
        .filter((v) => v.status === 'active')
        .filter(
          (v) =>
            v.fullName.toLowerCase().includes(q) ||
            v.plate.toLowerCase().includes(q) ||
            v.vin.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchedPersonnel = q
    ? personnel
        .filter((p) => p.status === 'active')
        .filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.phone.includes(q))
        .slice(0, 3)
    : [];

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
    matchedExpenses.length > 0 ||
    matchedVehicles.length > 0 ||
    matchedPersonnel.length > 0 ||
    matchedAdvances.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-[#2e313a] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#26282e] flex items-center gap-3 bg-[#141519]">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="جستجوی سریع خودرو، پلاک، شاسی، شرح هزینه، پرسنل..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-[#202229] border border-[#2c2f38] text-[10px] text-zinc-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {!q ? (
            <div className="py-8 text-center text-zinc-500">
              کلمه یا عدد مورد نظر خود را برای جستجو تایپ کنید
              <div className="text-[11px] text-zinc-600 mt-1">مثال: بنزین، کمری، علی، ۸۲ب، 4T1B</div>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-zinc-500">
              نتیجه‌ای برای «{query}» یافت نشد
            </div>
          ) : (
            <>
              {/* Vehicles */}
              {matchedVehicles.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 mb-1.5 px-2 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-sky-400" />
                    <span>خودروها ({toPersianDigits(matchedVehicles.length)})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedVehicles.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          onNavigate('vehicles');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-[#141519] hover:bg-[#20222a] border border-transparent hover:border-[#2f323c] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{v.fullName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            پلاک: {toPersianDigits(v.plate)} • شاسی: {v.vin}
                          </div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses */}
              {matchedExpenses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 mb-1.5 px-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>هزینه‌ها ({toPersianDigits(matchedExpenses.length)})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() => {
                          onNavigate('expenses');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-[#141519] hover:bg-[#20222a] border border-transparent hover:border-[#2f323c] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{exp.description}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {exp.personName} • {exp.category} • {toPersianDigits(exp.date)}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">{formatToman(exp.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cash Advances */}
              {matchedAdvances.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 mb-1.5 px-2 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تنخواه‌ها ({toPersianDigits(matchedAdvances.length)})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedAdvances.map((adv) => (
                      <div
                        key={adv.id}
                        onClick={() => {
                          onNavigate('advances');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-[#141519] hover:bg-[#20222a] border border-transparent hover:border-[#2f323c] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{adv.personName}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{adv.reason}</div>
                        </div>
                        <div className="font-mono font-bold text-zinc-200">{formatToman(adv.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personnel */}
              {matchedPersonnel.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 mb-1.5 px-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>پرسنل ({toPersianDigits(matchedPersonnel.length)})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedPersonnel.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('settings');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-[#141519] hover:bg-[#20222a] border border-transparent hover:border-[#2f323c] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{p.name}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{p.role} • {p.phone}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" />
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
