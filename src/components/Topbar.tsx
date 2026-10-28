import React, { useState } from 'react';
import { Plus, Search, Clock, ShieldCheck, Car, Wallet } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits } from '../utils/formatters';
import { PeriodSwitchDropdown } from './PeriodSwitchDropdown';

interface TopbarProps {
  onOpenQuickExpense: () => void;
  onOpenCashAdvance: () => void;
  onOpenNewVehicle: () => void;
  onOpenSearch: () => void;
  onOpenActivationModal: () => void;
  onOpenNewOpeningDoc?: () => void;
  onOpenOpeningDocsList?: () => void;
  onOpenIntegrityModal?: () => void;
  onOpenPeriodManagementModal?: (mode: 'close' | 'reopen') => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenQuickExpense,
  onOpenCashAdvance,
  onOpenNewVehicle,
  onOpenSearch,
  onOpenActivationModal,
  onOpenNewOpeningDoc,
  onOpenOpeningDocsList,
  onOpenIntegrityModal,
  onOpenPeriodManagementModal,
}) => {
  const { formatActivationTime, activationSecondsLeft } = useAccounting();

  return (
    <header
      id="topbar-container"
      className="h-14 glass-header px-4 flex items-center justify-between select-none z-20 sticky top-0 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      dir="rtl"
    >
      {/* Brand & Dealership Identity & Financial Period Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md border border-amber-400/40">
            <span className="text-black font-extrabold text-sm tracking-tight font-mono">AA</span>
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

        {/* Accounting Period Switcher */}
        <div className="hidden sm:block">
          <PeriodSwitchDropdown
            onOpenNewOpeningDoc={() => onOpenNewOpeningDoc?.()}
            onOpenOpeningDocsList={() => onOpenOpeningDocsList?.()}
            onOpenIntegrityModal={onOpenIntegrityModal}
            onOpenPeriodManagementModal={onOpenPeriodManagementModal}
          />
        </div>
      </div>

      {/* Center: Universal Search trigger */}
      <div className="hidden md:flex items-center max-w-md w-full mx-6">
        <button
          id="btn-universal-search-trigger"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 backdrop-blur-md rounded-lg text-zinc-400 text-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span>جستجو در مشتری، خودرو، پلاک، شاسی...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] text-zinc-300 font-mono">
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
          className="md:hidden p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-lg border border-transparent hover:border-white/10 transition-colors"
          title="جستجو"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 24-Hour Access Lease Timer Badge */}
        <button
          id="btn-activation-status"
          onClick={onOpenActivationModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 transition-all group cursor-pointer"
          title="مهلت استفاده ۲۴ ساعته - کلیک برای مدیریت امنیت"
        >
          <Clock className={`w-3.5 h-3.5 ${activationSecondsLeft < 3600 ? 'text-amber-400' : 'text-zinc-400 group-hover:text-amber-400'} transition-colors`} />
          <span className="text-[11px] text-zinc-400 font-normal">مهلت استفاده:</span>
          <span className="font-en-num font-bold text-[11px] text-zinc-200 dir-ltr">{formatActivationTime()}</span>
        </button>

        {/* Secondary: تنخواه جدید */}
        <button
          id="btn-new-advance-topbar"
          onClick={onOpenCashAdvance}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-minimal rounded-lg text-xs font-medium cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5 text-amber-400" />
          <span>تنخواه جدید</span>
        </button>

        {/* Secondary: خودرو جدید */}
        <button
          id="btn-new-vehicle-topbar"
          onClick={onOpenNewVehicle}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-minimal rounded-lg text-xs font-medium cursor-pointer"
        >
          <Car className="w-3.5 h-3.5 text-sky-400" />
          <span>خودرو</span>
        </button>

        {/* Primary Action: + ثبت هزینه */}
        <button
          id="btn-quick-expense-primary"
          onClick={onOpenQuickExpense}
          className="btn-minimal-amber inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ثبت هزینه</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 rounded bg-amber-950/20 text-zinc-950 text-[10px] font-mono mr-1">
            Ctrl+N
          </kbd>
        </button>
      </div>
    </header>
  );
};
