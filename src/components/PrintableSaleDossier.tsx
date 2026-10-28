import React from 'react';
import { SaleDossier } from '../types/customerSales';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface PrintableSaleDossierProps {
  dossier: SaleDossier;
  onClose: () => void;
}

export const PrintableSaleDossier: React.FC<PrintableSaleDossierProps> = ({ dossier, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto animate-in fade-in" dir="rtl">
      {/* Control Bar */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#181920] border border-[#2e313c] px-4 py-2 rounded-xl shadow-2xl print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>چاپ پرونده جامع فروش خودرو (A4)</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>بستن</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        id="printable-sale-dossier"
        className="w-full max-w-[210mm] min-h-[297mm] my-10 bg-white text-zinc-900 p-8 sm:p-10 shadow-2xl border border-zinc-200 font-sans print:m-0 print:p-6 print:shadow-none print:border-none print:w-full text-xs"
      >
        {/* Header */}
        <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-black text-amber-400 flex items-center justify-center font-black text-xl">
              AA
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-950">اتو گالری عبداللهی</h1>
              <p className="text-xs text-zinc-600">پرونده جامع فروش و تحویل خودرو</p>
            </div>
          </div>

          <div className="text-left font-mono space-y-1">
            <div className="text-base font-black text-zinc-950">پرونده: {dossier.saleNumber}</div>
            <div>تاریخ معامله: {toPersianDigits(dossier.saleDate)}</div>
            <div>تاریخ تحویل: {toPersianDigits(dossier.deliveryDate)} {toPersianDigits(dossier.deliveryTime || '')}</div>
            <div className="text-emerald-700 font-bold">وضعیت: تحویل نهایی شده</div>
          </div>
        </div>

        {/* Section: Customer & Vehicle */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-zinc-400 rounded-lg p-3 bg-zinc-50">
            <h3 className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">اطلاعات خریدار (پرونده مشتری)</h3>
            <div className="space-y-1 text-[11px]">
              <div>نام و نام خانوادگی: <span className="font-bold">{dossier.customerName}</span></div>
              <div>کد ملی: <span className="font-mono">{toPersianDigits(dossier.deliveryFormA.receiverNationalId || '—')}</span></div>
              <div>شماره تماس: <span className="font-mono">{toPersianDigits(dossier.deliveryFormA.receiverPhone || '—')}</span></div>
              <div>نشانی: <span>{dossier.deliveryFormA.receiverAddress || 'تهران'}</span></div>
            </div>
          </div>

          <div className="border border-zinc-400 rounded-lg p-3 bg-zinc-50">
            <h3 className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">مشخصات خودروی فروخته‌شده</h3>
            <div className="space-y-1 text-[11px]">
              <div>عنوان خودرو: <span className="font-bold">{dossier.vehicleFullName}</span></div>
              <div>پلاک انتظامی: <span className="font-bold text-zinc-900">{toPersianDigits(dossier.deliveryFormB.plateNumber || '—')}</span></div>
              <div>شماره شاسی (VIN): <span className="font-mono text-[10px] font-bold">{dossier.deliveryFormB.chassisNumber || '—'}</span></div>
              <div>کارکرد هنگام تحویل: <span className="font-mono">{toPersianDigits(dossier.deliveryFormB.mileageAtDelivery?.toLocaleString() || '۰')} کیلومتر</span></div>
            </div>
          </div>
        </div>

        {/* Section: Financials & Payments */}
        <div className="border border-zinc-400 rounded-lg p-3 bg-zinc-50 mb-4">
          <h3 className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2 flex items-center justify-between">
            <span>اطلاعات مالی و پرداخت‌های معامله</span>
            <span className="text-zinc-600 font-normal">شماره قرارداد: {dossier.contractNumber}</span>
          </h3>

          <div className="grid grid-cols-3 gap-2 mb-3 bg-white p-2 border border-zinc-300 rounded text-center">
            <div>
              <span className="text-[10px] text-zinc-500 block">مبلغ کل معامله:</span>
              <span className="font-bold text-sm text-zinc-950">{formatToman(dossier.salePrice)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">پیش‌پرداخت / نقد:</span>
              <span className="font-bold text-sm text-emerald-800">{formatToman(dossier.downPayment)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">مانده حساب:</span>
              <span className={`font-bold text-sm ${dossier.remainingBalance === 0 ? 'text-zinc-600' : 'text-amber-800'}`}>
                {dossier.remainingBalance === 0 ? 'تسویه کامل' : formatToman(dossier.remainingBalance)}
              </span>
            </div>
          </div>

          <table className="w-full text-right border-collapse border border-zinc-300 text-[11px]">
            <thead>
              <tr className="bg-zinc-200">
                <th className="p-1.5 border-l border-zinc-300">ردیف</th>
                <th className="p-1.5 border-l border-zinc-300">شرح واریزی / قسط</th>
                <th className="p-1.5 border-l border-zinc-300">مبلغ</th>
                <th className="p-1.5 border-l border-zinc-300">نوع پرداخت</th>
                <th className="p-1.5 border-l border-zinc-300">سررسید / تاریخ پرداخت</th>
                <th className="p-1.5">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {dossier.payments.map((p, idx) => (
                <tr key={p.id} className="border-b border-zinc-200">
                  <td className="p-1.5 border-l border-zinc-200 font-mono text-center">{toPersianDigits(idx + 1)}</td>
                  <td className="p-1.5 border-l border-zinc-200 font-medium">{p.title}</td>
                  <td className="p-1.5 border-l border-zinc-200 font-bold">{formatToman(p.amount)}</td>
                  <td className="p-1.5 border-l border-zinc-200">{p.type === 'check' ? 'چک صیادی' : p.type === 'cash' ? 'نقدی' : 'حواله بانکی'}</td>
                  <td className="p-1.5 border-l border-zinc-200 font-mono">{toPersianDigits(p.paymentDate || p.dueDate)}</td>
                  <td className="p-1.5 font-bold text-emerald-800">{p.status === 'paid' ? 'پرداخت شد ✓' : 'در انتظار سررسید'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section: Delivery Status Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-zinc-400 rounded-lg p-3 bg-zinc-50 text-[11px]">
            <h4 className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">خلاصه فرم الف (تحویل مدارک)</h4>
            <div className="space-y-1">
              <div>وضعیت فرم: <span className="font-bold text-emerald-800">تکمیل و امضا شده</span></div>
              <div>اقلام تحویلی: <span>{toPersianDigits(dossier.deliveryFormA.checklist.filter(c => c.status === 'delivered').length)} مورد سند و مدرک</span></div>
              <div>ریموت‌های تحویلی: <span className="font-bold">۲ عدد فابریک</span></div>
              <div>توضیحات: <span>{dossier.deliveryFormA.generalNotes || 'مدارک کامل تحویل شد.'}</span></div>
            </div>
          </div>

          <div className="border border-zinc-400 rounded-lg p-3 bg-zinc-50 text-[11px]">
            <h4 className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">خلاصه فرم ب (تحویل خودرو)</h4>
            <div className="space-y-1">
              <div>وضعیت بازرسی بدنه: <span className="font-bold text-emerald-800">سالم و تایید شده</span></div>
              <div>اقلام فابریک: <span>{toPersianDigits(dossier.deliveryFormB.equipmentChecklist.filter(e => e.status === 'present').length)} مورد موجود</span></div>
              <div>میزان سوخت: <span>{dossier.deliveryFormB.fuelLevel === 'full' ? 'باک پر' : 'سالم'}</span></div>
              <div>توضیحات تحویل: <span>{dossier.deliveryFormB.deliveryNotes || 'خودرو تمیز و بدون نقص تحویل گردید.'}</span></div>
            </div>
          </div>
        </div>

        {/* Section: Timeline */}
        <div className="border border-zinc-400 rounded-lg p-3 bg-zinc-50 mb-4 text-[11px]">
          <h4 className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2">رویدادها و سوابق زمانی پرونده</h4>
          <div className="space-y-1.5">
            {dossier.timeline.map((tl) => (
              <div key={tl.id} className="flex items-center gap-2">
                <span className="font-mono text-zinc-500 w-24">{toPersianDigits(tl.date)}</span>
                <span className="font-bold text-zinc-900">{tl.title}:</span>
                <span className="text-zinc-700">{tl.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4 border-t-2 border-zinc-900 pt-3 mt-auto">
          <div className="border border-zinc-300 rounded p-2.5 bg-zinc-50">
            <div className="font-bold text-zinc-900 mb-1">امضای کارشناس فروش اتو عبداللهی:</div>
            <div className="text-[11px] text-zinc-600 mb-2">{dossier.deliveryFormB.delivererSignature.name || 'کارشناس رسمی'}</div>
            {dossier.deliveryFormB.delivererSignature.signatureImage && (
              <img src={dossier.deliveryFormB.delivererSignature.signatureImage} alt="امضا" className="h-10 object-contain" />
            )}
          </div>

          <div className="border border-zinc-300 rounded p-2.5 bg-zinc-50">
            <div className="font-bold text-zinc-900 mb-1">امضای خریدار / تحویل‌گیرنده:</div>
            <div className="text-[11px] text-zinc-600 mb-2">{dossier.customerName}</div>
            {dossier.deliveryFormB.receiverSignature.signatureImage && (
              <img src={dossier.deliveryFormB.receiverSignature.signatureImage} alt="امضا" className="h-10 object-contain" />
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-zinc-300 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>بایگانی دیجیتال اسناد و پرونده‌های اتو عبداللهی</span>
          <span>پرونده فروش: {dossier.saleNumber}</span>
          <span>چاپ شده در سامانه</span>
        </div>
      </div>
    </div>
  );
};
