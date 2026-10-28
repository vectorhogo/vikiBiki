import React from 'react';
import { SaleDossier } from '../types/customerSales';
import { toPersianDigits } from '../utils/formatters';
import { Printer, X } from 'lucide-react';

interface PrintableFormAProps {
  dossier: SaleDossier;
  onClose: () => void;
}

export const PrintableFormA: React.FC<PrintableFormAProps> = ({ dossier, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const form = dossier.deliveryFormA;

  const getStatusBadgeText = (st: string) => {
    switch (st) {
      case 'delivered':
        return 'تحویل شد ✓';
      case 'not_delivered':
        return 'تحویل نشد';
      case 'none':
        return 'ندارد';
      case 'needs_review':
        return 'نیازمند بررسی';
      default:
        return st;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto animate-in fade-in" dir="rtl">
      {/* Control Bar (hidden during print) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#181920] border border-[#2e313c] px-4 py-2 rounded-xl shadow-2xl print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>چاپ فرم تحویل مدارک (A4)</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>بستن</span>
        </button>
      </div>

      {/* Printable Sheet (White standard A4 document layout) */}
      <div
        id="printable-form-a"
        className="w-full max-w-[210mm] min-h-[297mm] my-10 bg-white text-zinc-900 p-8 sm:p-10 shadow-2xl border border-zinc-200 font-sans print:m-0 print:p-6 print:shadow-none print:border-none print:w-full"
      >
        {/* Official Header */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black text-amber-400 flex items-center justify-center font-black text-xl border-2 border-black">
                AA
              </div>
              <div>
                <h1 className="text-xl font-black text-zinc-950 tracking-tight">اتو گالری عبداللهی</h1>
                <p className="text-xs text-zinc-600 font-medium">مرکز تخصصی کارشناسی، خرید و فروش خودروهای وارداتی و لوکس</p>
              </div>
            </div>

            <div className="text-left font-mono text-xs space-y-1">
              <div className="font-bold text-sm text-zinc-900">فرم الف — تحویل مدارک</div>
              <div>شماره پرونده: <span className="font-bold">{dossier.saleNumber}</span></div>
              <div>تاریخ تحویل: <span>{toPersianDigits(form.deliveredAtDate || dossier.deliveryDate)}</span></div>
              {form.deliveredAtTime && (
                <div>ساعت تحویل: <span>{toPersianDigits(form.deliveredAtTime)}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Header Box */}
        <div className="border border-zinc-400 rounded-md p-3 mb-4 bg-zinc-50 text-xs space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-zinc-500 block text-[11px]">نام خریدار / گیرنده:</span>
              <span className="font-bold text-zinc-900">{form.receiverName || dossier.customerName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">کد ملی گیرنده:</span>
              <span className="font-bold font-mono text-zinc-900">{toPersianDigits(form.receiverNationalId || '—')}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">شماره تماس:</span>
              <span className="font-bold font-mono text-zinc-900">{toPersianDigits(form.receiverPhone || '—')}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">شماره پلاک انتظامی:</span>
              <span className="font-bold text-zinc-900">{toPersianDigits(form.plateNumber || '—')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200">
            <div>
              <span className="text-zinc-500 block text-[11px]">خودروی معامله‌شده:</span>
              <span className="font-bold text-zinc-900">{dossier.vehicleFullName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">شرکت بیمه‌گر:</span>
              <span className="font-medium text-zinc-900">{form.insuranceCompany || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">شماره بیمه‌نامه / تاریخ انقضا:</span>
              <span className="font-medium text-zinc-900 font-mono">
                {form.insuranceExpiryDate ? toPersianDigits(form.insuranceExpiryDate) : '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">شماره قرارداد / مبایعه‌نامه:</span>
              <span className="font-bold font-mono text-zinc-900">{dossier.contractNumber}</span>
            </div>
          </div>

          {form.receiverAddress && (
            <div className="pt-1 text-[11px]">
              <span className="text-zinc-500">نشانی اقامتگاه خریدار: </span>
              <span className="text-zinc-800">{form.receiverAddress}</span>
            </div>
          )}
        </div>

        {/* Form Title Banner */}
        <div className="bg-zinc-900 text-white px-3 py-1.5 rounded text-xs font-bold mb-3 flex items-center justify-between">
          <span>صورت‌جلسه تحویل مدارک و اسناد خودرو (چک‌لیست ۱۵ گانه)</span>
          <span className="text-[11px] font-normal font-mono">
            {toPersianDigits(form.checklist.filter((i) => i.status === 'delivered').length)} از {toPersianDigits(form.checklist.length)} مورد تحویل گردید
          </span>
        </div>

        {/* Checklist Table */}
        <table className="w-full text-right border-collapse border border-zinc-400 text-xs mb-4">
          <thead>
            <tr className="bg-zinc-200 text-zinc-900 font-bold border-b border-zinc-400">
              <th className="p-2 border-l border-zinc-400 w-10 text-center">ردیف</th>
              <th className="p-2 border-l border-zinc-400">شرح سند / مدرک تحویلی</th>
              <th className="p-2 border-l border-zinc-400 w-28 text-center">وضعیت تحویل</th>
              <th className="p-2 border-l border-zinc-400 w-16 text-center">تعداد</th>
              <th className="p-2">توضیحات و مشخصات مدرک</th>
            </tr>
          </thead>
          <tbody>
            {form.checklist.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-zinc-300 ${idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}`}
              >
                <td className="p-2 border-l border-zinc-300 text-center font-mono text-[11px]">
                  {toPersianDigits(idx + 1)}
                </td>
                <td className="p-2 border-l border-zinc-300 font-medium text-zinc-900">
                  {item.title}
                </td>
                <td className="p-2 border-l border-zinc-300 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.status === 'none'
                        ? 'bg-zinc-100 text-zinc-600'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {getStatusBadgeText(item.status)}
                  </span>
                </td>
                <td className="p-2 border-l border-zinc-300 text-center font-mono font-bold">
                  {toPersianDigits(item.count || 1)}
                </td>
                <td className="p-2 text-zinc-700 text-[11px]">
                  {item.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* General Notes */}
        {form.generalNotes && (
          <div className="border border-zinc-300 rounded p-2.5 mb-4 text-xs bg-zinc-50">
            <span className="font-bold text-zinc-800 block mb-1">توضیحات تکمیلی تحویل مدارک:</span>
            <p className="text-zinc-700 leading-relaxed">{form.generalNotes}</p>
          </div>
        )}

        {/* Acknowledgement Statement */}
        <div className="border border-zinc-400 rounded p-2.5 mb-4 text-[11px] leading-relaxed text-zinc-700 bg-zinc-50">
          اینجانب تحویل‌گیرنده فوق‌الذکر، بدینوسیله اقرار و تایید می‌نمایم که کلیه مدارک، اسناد، کارت‌ها و ریموت‌های قیدشده در جدول فوق را در کمال صحت و سلامت و بدون هرگونه مغایرت از اتو گالری عبداللهی تحویل گرفتم و از این پس مسئولیت نگهداری و عواقب قانونی آن‌ها بر عهده اینجانب می‌باشد.
        </div>

        {/* Signatures Dual Block */}
        <div className="grid grid-cols-2 gap-4 border-t-2 border-zinc-900 pt-4 mt-auto">
          {/* Deliverer Box */}
          <div className="border border-zinc-300 rounded-lg p-3 text-xs flex flex-col justify-between min-h-[140px] bg-zinc-50">
            <div>
              <div className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">
                مشخصات و امضای تحویل‌دهنده (اتو عبداللهی)
              </div>
              <div className="space-y-1 text-[11px] text-zinc-700">
                <div>نام نماینده: <span className="font-bold">{dossier.deliveryFormB.delivererSignature.name || 'کارشناس رسمی'}</span></div>
                <div>سمت: <span>{dossier.deliveryFormB.delivererSignature.roleOrCompany || 'کارشناس تحویل و ترابری'}</span></div>
                <div>تاریخ: <span>{toPersianDigits(form.deliveredAtDate || dossier.deliveryDate)}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-dashed border-zinc-300 flex items-center justify-between text-[11px] text-zinc-500">
              <span>محل امضا و مهر نمایندگی:</span>
              {dossier.deliveryFormB.delivererSignature.signatureImage && (
                <img
                  src={dossier.deliveryFormB.delivererSignature.signatureImage}
                  alt="امضای تحویل‌دهنده"
                  className="h-12 object-contain"
                />
              )}
            </div>
          </div>

          {/* Receiver Box */}
          <div className="border border-zinc-300 rounded-lg p-3 text-xs flex flex-col justify-between min-h-[140px] bg-zinc-50">
            <div>
              <div className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">
                مشخصات و امضای تحویل‌گیرنده (خریدار)
              </div>
              <div className="space-y-1 text-[11px] text-zinc-700">
                <div>نام و نام خانوادگی: <span className="font-bold">{form.receiverName || dossier.customerName}</span></div>
                <div>کد ملی: <span className="font-mono">{toPersianDigits(form.receiverNationalId || '—')}</span></div>
                <div>تاریخ و ساعت: <span>{toPersianDigits(form.deliveredAtDate || dossier.deliveryDate)} {toPersianDigits(form.deliveredAtTime || '')}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-dashed border-zinc-300 flex items-center justify-between text-[11px] text-zinc-500">
              <span>محل امضا و اثر انگشت خریدار:</span>
              {dossier.deliveryFormB.receiverSignature.signatureImage && (
                <img
                  src={dossier.deliveryFormB.receiverSignature.signatureImage}
                  alt="امضای خریدار"
                  className="h-12 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-2 border-t border-zinc-300 text-center text-[10px] text-zinc-500 flex items-center justify-between font-mono">
          <span>سامانه جامع بایگانی اسناد اتو عبداللهی</span>
          <span>شناسه یکتای فرم: {dossier.saleNumber}-DOC</span>
          <span>نسخه رسمی چاپ</span>
        </div>
      </div>
    </div>
  );
};
