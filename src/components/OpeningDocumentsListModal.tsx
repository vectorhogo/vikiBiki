import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { OpeningDocument } from '../types/accounting';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { X, Layers, Plus, Eye, Printer, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { OpeningDocumentViewModal } from './OpeningDocumentViewModal';

interface OpeningDocumentsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewModal: () => void;
}

export const OpeningDocumentsListModal: React.FC<OpeningDocumentsListModalProps> = ({
  isOpen,
  onClose,
  onOpenNewModal,
}) => {
  const { openingDocuments, periods, activePeriodId } = useAccounting();
  const [selectedDoc, setSelectedDoc] = useState<OpeningDocument | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
        <div className="bg-[#15161b] border border-[#2b2e38] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#262832] bg-[#1a1c23] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>سوابق و فهرست اسناد افتتاحیه</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {toPersianDigits(openingDocuments.length)} سند
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  مشاهده، بررسی و چاپ اسناد افتتاحیه دوره‌های مالی گذشته و حال
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewModal();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ سند افتتاحیه جدید</span>
              </button>

              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#252834] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
            {openingDocuments.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-[#131419] border border-[#232530] rounded-xl p-6">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
                <div className="font-bold text-zinc-300">هنوز هیچ سند افتتاحیه‌ای ثبت نشده است</div>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  سیستم در حال حاضر بر روی دوره مالی اولیه فعالیت می‌کند. هر زمان مایل باشید می‌توانید با کلیک
                  روی «سند افتتاحیه جدید»، دوره مالی جدیدی را با حفظ کامل تمام سوابق قبلی آغاز کنید.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewModal();
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ایجاد اولین سند افتتاحیه</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#22242e] border border-[#262832] rounded-xl overflow-hidden bg-[#181a21]">
                {openingDocuments.map((doc) => {
                  const isCurrent = doc.periodId === activePeriodId || doc.status === 'active';
                  const totalLiquidity = doc.cashBalance + doc.bankBalance;
                  return (
                    <div
                      key={doc.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1f212a] transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-100 text-sm">{doc.periodTitle}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {isCurrent ? 'دوره فعال' : 'بایگانی‌شده'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            تاریخ شروع: {doc.startDate}
                          </span>
                          <span>•</span>
                          <span>
                            نقدینگی کل: <strong className="text-zinc-200">{formatToman(totalLiquidity)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            تنخواه‌های انتقالی: <strong className="text-amber-400">{formatToman(doc.totalTransferredAdvanceAmount)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            بدهی بازپرداخت: <strong className="text-sky-400">{formatToman(doc.totalTransferredReimbursementAmount)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1.5 bg-[#252834] hover:bg-[#2f3342] text-zinc-200 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>مشاهده و چاپ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#262832] bg-[#1a1c23] flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#252834] hover:bg-[#2e3240] text-zinc-300 font-semibold rounded-lg text-xs transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>

      {/* View/Print Modal */}
      <OpeningDocumentViewModal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </>
  );
};
