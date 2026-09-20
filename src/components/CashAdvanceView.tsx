import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { CashAdvance } from '../types/accounting';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  Wallet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ArrowUpLeft,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { SettlementModal } from './SettlementModal';
import { NewCashAdvanceModal } from './NewCashAdvanceModal';

interface CashAdvanceViewProps {
  onOpenQuickExpenseWithPerson: (personId: string, cashAdvanceId?: string) => void;
}

export const CashAdvanceView: React.FC<CashAdvanceViewProps> = ({
  onOpenQuickExpenseWithPerson,
}) => {
  const { cashAdvances, personnelBalances, metrics, settleCashAdvance } = useAccounting();

  const [isNewAdvanceModalOpen, setIsNewAdvanceModalOpen] = useState(false);
  const [selectedPersonForNewAdvance, setSelectedPersonForNewAdvance] = useState<string | undefined>();
  const [settlementAdvance, setSettlementAdvance] = useState<CashAdvance | null>(null);

  const handleOpenNewAdvanceForPerson = (personId?: string) => {
    setSelectedPersonForNewAdvance(personId);
    setIsNewAdvanceModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#17181d] border border-[#26282e] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-zinc-100">مدیریت تنخواه پرسنل</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              کل نقدینگی فعال: {formatToman(metrics.totalActiveCashAdvance)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            کنترل لحظه‌ای مبالغ پرداختی، هزینه‌های فاکتور شده و باقیمانده تسویه نشده هر فرد
          </p>
        </div>

        <button
          onClick={() => handleOpenNewAdvanceForPerson()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تنخواه جدید</span>
        </button>
      </div>

      {/* Personnel Balance Cards Grid */}
      <div>
        <div className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>کارت وضعیت نقدینگی پرسنل</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {personnelBalances.map((pb) => {
            // Find if this person has an active advance ready for settlement
            const openAdvance = cashAdvances.find(
              (a) => a.personId === pb.personId && a.status !== 'settled'
            );

            return (
              <div
                key={pb.personId}
                className="bg-[#17181d] border border-[#26282e] hover:border-[#353945] rounded-xl p-4 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#23252c]">
                    <div>
                      <div className="font-bold text-sm text-zinc-100">{pb.personName}</div>
                      <div className="text-[11px] text-zinc-400">{pb.role}</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#1f2128] text-zinc-300 font-mono">
                      {toPersianDigits(pb.openAdvancesCount)} تنخواه باز
                    </span>
                  </div>

                  <div className="py-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>کل تنخواه دریافتی:</span>
                      <span className="font-mono text-zinc-200">{formatToman(pb.totalAdvanced)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>هزینه‌های ثبت‌شده:</span>
                      <span className="font-mono text-rose-400">-{formatToman(pb.totalExpenses)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#23252c] flex items-center justify-between">
                      <span className="font-semibold text-zinc-300">باقیمانده نقدینگی:</span>
                      <span className="font-mono font-extrabold text-amber-400 text-sm">
                        {formatToman(pb.remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contextual Actions */}
                <div className="pt-2.5 border-t border-[#23252c] flex items-center gap-2 text-xs">
                  {openAdvance ? (
                    <button
                      onClick={() => setSettlementAdvance(openAdvance)}
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 font-medium transition-colors cursor-pointer text-center"
                    >
                      تسویه
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenNewAdvanceForPerson(pb.personId)}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#21232b] hover:bg-[#2a2d37] text-zinc-300 border border-[#30333e] transition-colors cursor-pointer text-center"
                    >
                      + تنخواه جدید
                    </button>
                  )}

                  <button
                    onClick={() => onOpenQuickExpenseWithPerson(pb.personId, openAdvance?.id)}
                    className="flex-1 py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                    title="ثبت هزینه کسر از تنخواه این شخص"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>ثبت هزینه</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cash Advance Transactions Table */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
        <div className="p-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-zinc-200">سوابق تخصیص و تسویه تنخواه‌ها</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            {toPersianDigits(cashAdvances.length)} مورد
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#131417] text-zinc-400 border-b border-[#26282e] font-medium">
              <tr>
                <th className="py-3 px-4">تاریخ</th>
                <th className="py-3 px-4">پرسنل تنخواه‌دار</th>
                <th className="py-3 px-4">مبلغ تنخواه</th>
                <th className="py-3 px-4">بابت و توضیحات</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22242a]">
              {cashAdvances.map((adv) => {
                const statusBadges = {
                  open: (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Clock className="w-3 h-3" />
                      <span>باز</span>
                    </span>
                  ),
                  needs_settlement: (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      <AlertCircle className="w-3 h-3" />
                      <span>نیازمند تسویه</span>
                    </span>
                  ),
                  settled: (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>تسویه شد</span>
                    </span>
                  ),
                };

                return (
                  <tr key={adv.id} className="hover:bg-[#1e2027]/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                      {toPersianDigits(adv.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-200 whitespace-nowrap">
                      {adv.personName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
                      {formatToman(adv.amount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      <div>{adv.reason}</div>
                      {adv.notes && <div className="text-[10px] text-zinc-500">{adv.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {statusBadges[adv.status]}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {adv.status !== 'settled' ? (
                        <button
                          onClick={() => setSettlementAdvance(adv)}
                          className="px-2.5 py-1 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 rounded-lg transition-colors cursor-pointer"
                        >
                          تسویه
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {toPersianDigits(adv.settledAt || '')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewCashAdvanceModal
        isOpen={isNewAdvanceModalOpen}
        onClose={() => setIsNewAdvanceModalOpen(false)}
        initialPersonId={selectedPersonForNewAdvance}
      />

      <SettlementModal
        advance={settlementAdvance}
        onClose={() => setSettlementAdvance(null)}
        onConfirmSettlement={settleCashAdvance}
      />
    </div>
  );
};
