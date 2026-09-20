import React, { useState } from 'react';
import { Plus, Search, Clock, ShieldCheck, Car, Wallet } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits } from '../utils/formatters';

interface TopbarProps {
  onOpenQuickExpense: () => void;
  onOpenCashAdvance: () => void;
  onOpenNewVehicle: () => void;
  onOpenSearch: () => void;
  onOpenActivationModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenQuickExpense,
  onOpenCashAdvance,
  onOpenNewVehicle,
  onOpenSearch,
  onOpenActivationModal,
}) => {
  const { formatActivationTime, activationSecondsLeft } = useAccounting();

  return (
    <header
      id="topbar-container"
      className="h-14 bg-[#141518] border-b border-[#26282e] px-4 flex items-center justify-between select-none z-20 sticky top-0"
      dir="rtl"
    >
      {/* Brand & Dealership Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm">
            <span className="text-black font-extrabold text-sm tracking-tight">AA</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-zinc-100 tracking-tight">اتو عبداللهی</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                شعبه مرکزی
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Universal Search trigger */}
      <div className="hidden md:flex items-center max-w-md w-full mx-6">
        <button
          id="btn-universal-search-trigger"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#1a1c21] hover:bg-[#20232a] border border-[#2e3138] hover:border-[#3d424c] rounded-lg text-zinc-400 text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span>جستجوی هزینه، خودرو، پلاک، شاسی، پرسنل...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#131417] border border-[#2b2d34] text-[10px] text-zinc-400 font-mono">
              Ctrl+F
            </kbd>
          </div>
        </button>
      </div>

      {/* Left side actions & 24h timer */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2127] rounded-lg border border-transparent hover:border-[#2e3138] transition-colors"
          title="جستجو"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 24-Hour Access Lease Timer Badge */}
        <button
          id="btn-activation-status"
          onClick={onOpenActivationModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191b20] hover:bg-[#22252c] border border-[#2c2f36] text-xs text-zinc-300 transition-colors group cursor-pointer"
          title="مهلت استفاده ۲۴ ساعته - کلیک برای مدیریت امنیت"
        >
          <Clock className={`w-3.5 h-3.5 ${activationSecondsLeft < 3600 ? 'text-amber-400' : 'text-zinc-400 group-hover:text-amber-400'} transition-colors`} />
          <span className="text-[11px] text-zinc-400 font-normal">مهلت استفاده:</span>
          <span className="font-mono text-[11px] text-zinc-200 font-medium dir-ltr">{formatActivationTime()}</span>
        </button>

        {/* Secondary: تنخواه جدید */}
        <button
          id="btn-new-advance-topbar"
          onClick={onOpenCashAdvance}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1c1e24] hover:bg-[#252830] text-zinc-300 hover:text-white border border-[#2d3038] rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5 text-amber-400" />
          <span>تنخواه جدید</span>
        </button>

        {/* Secondary: خودرو جدید */}
        <button
          id="btn-new-vehicle-topbar"
          onClick={onOpenNewVehicle}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1c1e24] hover:bg-[#252830] text-zinc-300 hover:text-white border border-[#2d3038] rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Car className="w-3.5 h-3.5 text-sky-400" />
          <span>خودرو</span>
        </button>

        {/* Primary Action: + ثبت هزینه */}
        <button
          id="btn-quick-expense-primary"
          onClick={onOpenQuickExpense}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ثبت هزینه</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 rounded bg-amber-600/30 text-zinc-900 text-[10px] font-mono mr-1">
            Ctrl+N
          </kbd>
        </button>
      </div>
    </header>
  );
};
