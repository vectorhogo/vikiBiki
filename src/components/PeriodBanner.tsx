import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Info,
  Calendar,
} from 'lucide-react';

interface PeriodBannerProps {
  onOpenReopenModal?: () => void;
  onOpenIntegrityModal?: () => void;
}

export const PeriodBanner: React.FC<PeriodBannerProps> = ({
  onOpenReopenModal,
  onOpenIntegrityModal,
}) => {
  const {
    viewingPeriod,
    activePeriod,
    isViewingHistoricalPeriod,
    setViewingPeriodId,
    activePeriodId,
  } = useAccounting();

  if (!isViewingHistoricalPeriod && !viewingPeriod?.isLocked && viewingPeriod?.status !== 'closed') {
    return null;
  }

  const isClosed = viewingPeriod?.status === 'closed' || viewingPeriod?.isLocked;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs" dir="rtl">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          {isClosed ? <Lock className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
        </div>
        <div>
          <span className="font-bold text-amber-300">
            درحال مشاهده دوره مالی: «{viewingPeriod?.title || 'نامشخص'}»
          </span>
          <span className="text-zinc-400 text-[11px] mr-2">
            {isClosed
              ? '(این دوره بسته و در حالت فقط-خواندنی است؛ تراکنش‌ها قابل مشاهده و گزارش‌گیری هستند)'
              : '(دوره بایگانی شده)'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isClosed && onOpenReopenModal && (
          <button
            type="button"
            onClick={onOpenReopenModal}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition-colors cursor-pointer text-[11px]"
          >
            درخواست اصلاح دوره
          </button>
        )}

        {onOpenIntegrityModal && (
          <button
            type="button"
            onClick={onOpenIntegrityModal}
            className="px-2.5 py-1 rounded-lg bg-[#1e212b] hover:bg-[#272b38] border border-[#2f3343] text-zinc-300 transition-colors cursor-pointer text-[11px] flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>صحت دوره</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setViewingPeriodId(activePeriodId)}
          className="px-2.5 py-1 rounded-lg bg-[#1a1c24] hover:bg-[#222530] border border-[#2c2f3d] text-zinc-200 font-medium transition-colors cursor-pointer text-[11px] flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3 text-zinc-400" />
          <span>بازگشت به دوره فعال ({activePeriod.title})</span>
        </button>
      </div>
    </div>
  );
};
