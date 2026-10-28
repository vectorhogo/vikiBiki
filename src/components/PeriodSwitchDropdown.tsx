import React, { useState, useRef, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Layers,
  ChevronDown,
  Check,
  Plus,
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

interface PeriodSwitchDropdownProps {
  onOpenNewOpeningDoc: () => void;
  onOpenOpeningDocsList: () => void;
  onOpenIntegrityModal?: () => void;
  onOpenPeriodManagementModal?: (mode: 'close' | 'reopen') => void;
}

export const PeriodSwitchDropdown: React.FC<PeriodSwitchDropdownProps> = ({
  onOpenNewOpeningDoc,
  onOpenOpeningDocsList,
  onOpenIntegrityModal,
  onOpenPeriodManagementModal,
}) => {
  const {
    periods,
    activePeriodId,
    viewingPeriodId,
    setViewingPeriodId,
    activePeriod,
    viewingPeriod,
    isViewingHistoricalPeriod,
  } = useAccounting();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPeriodTitle = viewingPeriod?.title || activePeriod?.title || 'دوره فعال';
  const isCurrentClosed = viewingPeriod?.status === 'closed' || viewingPeriod?.isLocked;

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Subtle Topbar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
          isViewingHistoricalPeriod || isCurrentClosed
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            : 'bg-[#181a20] border-[#2b2d37] text-zinc-300 hover:text-zinc-100 hover:bg-[#20222a]'
        }`}
        title="تغییر دوره مالی یا وضعیت دوره"
      >
        <Layers className={`w-3.5 h-3.5 ${isViewingHistoricalPeriod ? 'text-amber-400' : 'text-zinc-400'}`} />
        <span className="font-semibold text-[11px] sm:text-xs">
          دوره: {currentPeriodTitle}
          {isCurrentClosed && ' (بسته)'}
        </span>
        {isCurrentClosed && <Lock className="w-3 h-3 text-amber-400" />}
        <ChevronDown className={`w-3 h-3 transition-transform text-zinc-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 mt-2 w-72 bg-[#181a22] border border-[#2b2e3a] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-xs">
          <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 border-b border-[#242632] flex items-center justify-between">
            <span>مدیریت دوره‌های مالی</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {toPersianDigits(periods.length)} دوره
            </span>
          </div>

          {/* Periods List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-[#22242e]">
            {periods.map((p) => {
              const isActive = p.id === activePeriodId;
              const isSelected = p.id === viewingPeriodId;
              const isClosed = p.status === 'closed' || p.isLocked;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setViewingPeriodId(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-right flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-amber-500/15 text-amber-300' : 'hover:bg-[#21232d] text-zinc-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{p.title}</span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          جاری
                        </span>
                      )}
                      {isClosed ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>بسته</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-300">
                          فعال
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      شروع: {p.startDate} {p.endDate ? `تا ${p.endDate}` : ''}
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-1.5 mt-1 border-t border-[#242632] px-2 space-y-1">
            {/* Integrity Audit */}
            {onOpenIntegrityModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenIntegrityModal();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-right text-zinc-300 hover:bg-[#22242e] transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>بررسی صحت و یکپارچگی دوره‌ها</span>
              </button>
            )}

            {/* Close / Reopen Current Period */}
            {onOpenPeriodManagementModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPeriodManagementModal(isCurrentClosed ? 'reopen' : 'close');
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-right transition-colors flex items-center gap-2 ${
                  isCurrentClosed
                    ? 'text-amber-400 hover:bg-amber-500/10'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                {isCurrentClosed ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>بازگشایی و اصلاح دوره</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>بستن و قفل دوره جاری</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenNewOpeningDoc();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-right text-amber-400 hover:bg-amber-500/10 font-bold transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ سند افتتاحیه جدید (دوره جدید)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenOpeningDocsList();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-right text-zinc-300 hover:bg-[#22242e] transition-colors flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>مشاهده و چاپ اسناد افتتاحیه</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
