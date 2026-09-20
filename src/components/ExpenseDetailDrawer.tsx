import React, { useRef, useState } from 'react';
import {
  X,
  Paperclip,
  Trash2,
  Calendar,
  User,
  Car,
  Tag,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  CreditCard,
  Building2,
  Wallet,
  Layers,
  Edit,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { Expense } from '../types/accounting';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { RecordReimbursementModal } from './RecordReimbursementModal';
import { EditExpenseModal } from './EditExpenseModal';

interface ExpenseDetailDrawerProps {
  expense: Expense | null;
  onClose: () => void;
  onArchive: (id: string) => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  expense,
  onClose,
  onArchive,
}) => {
  const { addReceiptToExpense, removeReceiptFromExpense, checkDuplicateReceipt } = useAccounting();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [duplicateReceiptPrompt, setDuplicateReceiptPrompt] = useState<{
    file: File;
    url: string;
    matchedDesc?: string;
  } | null>(null);

  if (!expense) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (loadEvt) => {
        const url = loadEvt.target?.result as string;
        const dupCheck = await checkDuplicateReceipt(url);
        if (dupCheck.isDuplicate) {
          setDuplicateReceiptPrompt({
            file,
            url,
            matchedDesc: dupCheck.matchedExpense?.description,
          });
        } else {
          addReceiptToExpense(expense.id, {
            name: file.name,
            url,
            size: file.size,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const paymentSourceConfig = {
    advance: { label: 'تنخواه گردان', icon: Wallet, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    personal: { label: 'پرداخت شخصی (پرسنل)', icon: User, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    company_direct: { label: 'مستقیم شرکت / نمایشگاه', icon: Building2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    other: { label: 'سایر منابع', icon: Layers, color: 'text-zinc-300 bg-zinc-700/20 border-zinc-600' },
  }[expense.paymentSource || (expense.cashAdvanceId ? 'advance' : 'company_direct')];

  const PaymentIcon = paymentSourceConfig.icon;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
        <div
          id="expense-detail-drawer"
          className="w-full max-w-lg bg-[#16171b] border-l border-[#282a31] h-full flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#26282e] flex items-center justify-between bg-[#131417]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {expense.category || 'دسته‌بندی نشده'}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {expense.createdAt}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-100 mt-1">{expense.description}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-[#22242a] transition-colors"
                title="ویرایش و تکمیل هزینه"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Amount Banner */}
            <div className="p-4 rounded-xl bg-[#1c1e24] border border-[#2b2e37] flex items-center justify-between">
              <span className="text-zinc-400">مبلغ قطعی هزینه</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono">
                {formatToman(expense.amount)}
              </span>
            </div>

            {/* Payment Source Card */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${paymentSourceConfig.color}`}>
              <div className="flex items-center gap-2">
                <PaymentIcon className="w-4 h-4" />
                <span className="font-semibold">منبع پرداخت: {paymentSourceConfig.label}</span>
              </div>
              {expense.paymentSource === 'personal' && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  expense.reimbursementStatus === 'reimbursed'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {expense.reimbursementStatus === 'reimbursed' ? 'بازپرداخت شد' : 'نیازمند بازپرداخت'}
                </span>
              )}
            </div>

            {/* Reimbursement Details if Personal */}
            {expense.paymentSource === 'personal' && (
              <div className="p-3.5 bg-[#1a1c22] border border-[#282a32] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">وضعیت بازپرداخت به پرسنل:</span>
                  <span className="font-semibold text-zinc-200">
                    {expense.reimbursementStatus === 'reimbursed' ? 'تسویه شده' : 'در انتظار واریز'}
                  </span>
                </div>
                {expense.reimbursementStatus === 'reimbursed' ? (
                  <div className="pt-2 border-t border-[#24262e] space-y-1 text-[11px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>مبلغ واریز شده:</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatToman(expense.reimbursementAmount || expense.amount)}</span>
                    </div>
                    {expense.reimbursementDate && (
                      <div className="flex justify-between">
                        <span>تاریخ واریز:</span>
                        <span className="font-mono">{toPersianDigits(expense.reimbursementDate)}</span>
                      </div>
                    )}
                    {expense.reimbursementNote && (
                      <div className="flex justify-between">
                        <span>یادداشت:</span>
                        <span className="text-zinc-300">{expense.reimbursementNote}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsReimburseModalOpen(true)}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>ثبت بازپرداخت به پرسنل</span>
                  </button>
                )}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#191b20] border border-[#26282e]">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>شخص مسئول</span>
                </div>
                <div className="font-semibold text-zinc-200">{expense.personName}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#191b20] border border-[#26282e]">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>تاریخ ثبت</span>
                </div>
                <div className="font-semibold text-zinc-200 font-mono">{toPersianDigits(expense.date)}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#191b20] border border-[#26282e] col-span-2">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Car className="w-3.5 h-3.5 text-zinc-500" />
                  <span>خودرو مرتبط</span>
                </div>
                <div className="font-semibold text-zinc-200">
                  {expense.vehicleLabel || 'بدون ارتباط به خودروی خاص'}
                </div>
              </div>

              {expense.notes && (
                <div className="p-3 rounded-lg bg-[#191b20] border border-[#26282e] col-span-2">
                  <div className="text-zinc-400 mb-1">توضیحات تکمیلی:</div>
                  <div className="text-zinc-300">{expense.notes}</div>
                </div>
              )}
            </div>

            {/* Receipt Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-200">رسیدها و مدارک فاکتور</span>
                  {expense.receipts.length > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{toPersianDigits(expense.receipts.length)} رسید ضمیمه شده</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>بدون رسید</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs bg-[#23262e] hover:bg-[#2d313c] text-zinc-200 border border-[#353945] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                  <span>افزودن رسید</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                multiple
                className="hidden"
              />

              {duplicateReceiptPrompt && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>این فایل قبلاً ثبت شده است.</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    فایل انتخاب‌شده ({duplicateReceiptPrompt.file.name}) مشابه رسیدی است که قبلاً در سامانه
                    {duplicateReceiptPrompt.matchedDesc ? ` برای «${duplicateReceiptPrompt.matchedDesc}»` : ''} ثبت شده است.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDuplicateReceiptPrompt(null)}
                      className="px-2.5 py-1 text-xs bg-[#242730] hover:bg-[#2e323e] text-zinc-200 rounded-md transition-colors"
                    >
                      لغو
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addReceiptToExpense(expense.id, {
                          name: duplicateReceiptPrompt.file.name,
                          url: duplicateReceiptPrompt.url,
                          size: duplicateReceiptPrompt.file.size,
                        });
                        setDuplicateReceiptPrompt(null);
                      }}
                      className="px-2.5 py-1 text-xs bg-[#292c36] hover:bg-[#343846] text-amber-300 border border-amber-500/30 rounded-md transition-colors"
                    >
                      استفاده از فایل قبلی
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addReceiptToExpense(expense.id, {
                          name: duplicateReceiptPrompt.file.name,
                          url: duplicateReceiptPrompt.url,
                          size: duplicateReceiptPrompt.file.size,
                        });
                        setDuplicateReceiptPrompt(null);
                      }}
                      className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-md transition-colors"
                    >
                      ثبت به هر حال
                    </button>
                  </div>
                </div>
              )}

              {expense.receipts.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border border-dashed border-[#2e313a] hover:border-amber-500/40 rounded-xl text-center cursor-pointer bg-[#141519] transition-colors"
                >
                  <Paperclip className="w-5 h-5 mx-auto text-zinc-500 mb-1.5" />
                  <div className="text-xs font-medium text-zinc-300">هنوز رسیدی برای این هزینه ثبت نشده است</div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    جهت تکمیل مدارک، فاکتور کاغذی یا رسید پوز را بارگذاری نمایید
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {expense.receipts.map((rec) => (
                    <div
                      key={rec.id}
                      className="group relative bg-[#141519] border border-[#2b2e37] rounded-lg p-2 flex flex-col gap-2 overflow-hidden"
                    >
                      <div
                        onClick={() => setSelectedPreviewImage(rec.url)}
                        className="w-full h-28 rounded-md overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer relative"
                      >
                        <img src={rec.url} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="truncate max-w-[120px] text-zinc-300">{rec.name}</span>
                        <button
                          onClick={() => removeReceiptFromExpense(expense.id, rec.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1 rounded"
                          title="حذف رسید"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#26282e] bg-[#131417] flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('آیا از آرشیو این ردیف هزینه اطمینان دارید؟')) {
                  onArchive(expense.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>آرشیو هزینه</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-1.5 bg-[#23262e] hover:bg-[#2d313c] text-zinc-200 border border-[#353945] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-amber-400" />
              <span>ویرایش جزئیات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="max-w-2xl max-h-[85vh] bg-[#1a1b20] border border-[#2d3039] rounded-xl overflow-hidden p-2 flex flex-col">
            <div className="flex justify-end p-1">
              <button
                onClick={() => setSelectedPreviewImage(null)}
                className="p-1 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedPreviewImage}
              alt="رسید بزرگنمایی شده"
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Record Reimbursement Modal */}
      <RecordReimbursementModal
        expense={expense}
        isOpen={isReimburseModalOpen}
        onClose={() => setIsReimburseModalOpen(false)}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        expense={expense}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};
