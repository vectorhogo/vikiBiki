import React from 'react';
import { SaleDossier } from '../types/customerSales';
import { toPersianDigits } from '../utils/formatters';
import { Printer, X } from 'lucide-react';

interface PrintableFormBProps {
  dossier: SaleDossier;
  onClose: () => void;
}

export const PrintableFormB: React.FC<PrintableFormBProps> = ({ dossier, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const form = dossier.deliveryFormB;

  const getEquipmentStatusText = (st: string) => {
    switch (st) {
      case 'present':
        return 'موجود ✓';
      case 'missing':
        return 'ناموجود ✗';
      case 'not_delivered':
        return 'تحویل نشد';
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
          <span>چاپ فرم تحویل خودرو (A4)</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>بستن</span>
        </button>
      </div>

      {/* Printable Sheet (Standard A4 White Layout) */}
      <div
        id="printable-form-b"
        className="w-full max-w-[210mm] min-h-[297mm] my-10 bg-white text-zinc-900 p-8 sm:p-10 shadow-2xl border border-zinc-200 font-sans print:m-0 print:p-6 print:shadow-none print:border-none print:w-full"
      >
        {/* Header */}
        <div className="border-b-2 border-zinc-900 pb-3 mb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black text-amber-400 flex items-center justify-center font-black text-xl border-2 border-black">
                AA
              </div>
              <div>
                <h1 className="text-xl font-black text-zinc-950 tracking-tight">اتو گالری عبداللهی</h1>
                <p className="text-xs text-zinc-600 font-medium">برگه رسمی تحویل فیزیکی خودرو و بازرسی فنی و بدنه</p>
              </div>
            </div>

            <div className="text-left font-mono text-xs space-y-1">
              <div className="font-bold text-sm text-zinc-900">فرم ب — تحویل فیزیکی خودرو</div>
              <div>شماره پرونده: <span className="font-bold">{dossier.saleNumber}</span></div>
              <div>تاریخ تحویل: <span>{toPersianDigits(form.deliveryDate || dossier.deliveryDate)}</span></div>
              <div>ساعت تحویل: <span>{toPersianDigits(form.deliveryTime || dossier.deliveryTime || '—')}</span></div>
            </div>
          </div>
        </div>

        {/* Vehicle Specs Header Box */}
        <div className="border border-zinc-400 rounded-md p-3 mb-3 bg-zinc-50 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <div>
              <span className="text-zinc-500 block text-[11px]">خودرو و تیپ:</span>
              <span className="font-bold text-zinc-900">{form.vehicleName || dossier.vehicleFullName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">مدل / سال ساخت:</span>
              <span className="font-medium text-zinc-900">{toPersianDigits(form.modelYear || '—')}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">رنگ بدنه:</span>
              <span className="font-medium text-zinc-900">{form.color || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">کارکرد هنگام تحویل:</span>
              <span className="font-bold font-mono text-zinc-900">{toPersianDigits(form.mileageAtDelivery?.toLocaleString() || '۰')} کیلومتر</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200">
            <div>
              <span className="text-zinc-500 block text-[11px]">شماره شاسی (VIN):</span>
              <span className="font-bold font-mono text-zinc-900 tracking-wider text-[11px]">{form.chassisNumber || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">شماره پلاک انتظامی:</span>
              <span className="font-bold text-zinc-900">{toPersianDigits(form.plateNumber || '—')}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">میزان سوخت / بنزین:</span>
              <span className="font-medium text-zinc-900">
                {form.fuelLevel === 'full' ? 'باک پر (Full)' : form.fuelLevel === '3/4' ? '۳/۴ باک' : form.fuelLevel === '1/2' ? '۱/۲ باک' : form.fuelLevel === '1/4' ? '۱/۴ باک' : 'باک رزرو'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">نام خریدار:</span>
              <span className="font-bold text-zinc-900">{dossier.customerName}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Equipment Checklist (Compact 2-column or 3-column table) */}
        <div className="mb-3">
          <div className="bg-zinc-900 text-white px-3 py-1 rounded text-xs font-bold mb-2 flex items-center justify-between">
            <span>چک‌لیست اقلام و متعلقات همراه خودرو (۲۰ قلم فابریک)</span>
            <span className="text-[10px] font-mono">
              {toPersianDigits(form.equipmentChecklist.filter((i) => i.status === 'present').length)} مورد موجود
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {form.equipmentChecklist.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1 px-2 border-b border-zinc-200 text-[11px] bg-zinc-50/50 rounded"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-zinc-400 text-[10px] w-4">{toPersianDigits(idx + 1)}.</span>
                  <span className="font-medium text-zinc-800 truncate">{item.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      item.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'missing'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {getEquipmentStatusText(item.status)}
                  </span>
                  {item.notes && <span className="text-[10px] text-zinc-500 italic max-w-[90px] truncate">({item.notes})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Vehicle Inspection & Diagram Summary */}
        <div className="mb-3 border border-zinc-400 rounded-md p-3 bg-zinc-50 text-xs">
          <div className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-2 flex items-center justify-between">
            <span>نتیجه بازرسی ظاهری و بدنه در لحظه تحویل:</span>
            <span className="text-[11px] text-zinc-600 font-mono">
              {form.diagramMarkers.length === 0
                ? 'بدنه خودرو بدون هرگونه خط و خش یا ایراد ظاهری تحویل گردید.'
                : `${toPersianDigits(form.diagramMarkers.length)} مورد ثبت گردید`}
            </span>
          </div>

          {form.diagramMarkers.length === 0 ? (
            <div className="text-center py-2 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 rounded">
              ✓ وضعیت بدنه: کاملاً سالم، بدون خط و خش، فرورفتگی، یا آسیب ظاهری
            </div>
          ) : (
            <div className="space-y-1.5">
              {form.diagramMarkers.map((m, idx) => {
                const viewName =
                  m.view === 'front'
                    ? 'نمای جلو'
                    : m.view === 'rear'
                    ? 'نمای عقب'
                    : m.view === 'left'
                    ? 'نمای چپ'
                    : m.view === 'right'
                    ? 'نمای راست'
                    : 'سقف و بالا';
                const typeName =
                  m.type === 'scratch'
                    ? 'خط و خش'
                    : m.type === 'damage'
                    ? 'شکستگی / آسیب'
                    : m.type === 'dent'
                    ? 'فرورفتگی'
                    : m.type === 'missing_part'
                    ? 'کمبود قطعه'
                    : 'توضیحات';

                return (
                  <div key={m.id} className="flex items-center gap-2 text-[11px] border-b border-zinc-200 pb-1">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-white font-mono text-[9px] flex items-center justify-center shrink-0">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <span className="font-bold text-zinc-800">[{viewName}]</span>
                    <span className="text-amber-800 font-semibold">{typeName}:</span>
                    <span className="text-zinc-700">{m.description}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery Notes */}
        {form.deliveryNotes && (
          <div className="border border-zinc-300 rounded p-2.5 mb-3 text-xs bg-zinc-50">
            <span className="font-bold text-zinc-800 block mb-1">یادداشت‌ها و شروط تحویل:</span>
            <p className="text-zinc-700 leading-relaxed text-[11px]">{form.deliveryNotes}</p>
          </div>
        )}

        {/* Customer Statement */}
        <div className="border border-zinc-400 rounded p-2 mb-3 text-[10px] leading-relaxed text-zinc-700 bg-zinc-50">
          اینجانب تحویل‌گیرنده خودرو، بدینوسیله تایید می‌نمایم خودروی موصوف را با مشخصات شاسی، موتور، کارکرد و رنگ فوق به همراه متعلقات درج‌شده در چک‌لیست، پس از رویت کامل و تست فنی و آپشن‌ها در وضعیت سلامت تحویل گرفتم.
        </div>

        {/* Dual Signature Block */}
        <div className="grid grid-cols-2 gap-4 border-t-2 border-zinc-900 pt-3 mt-auto">
          {/* Deliverer Signature */}
          <div className="border border-zinc-300 rounded-lg p-3 text-xs flex flex-col justify-between min-h-[135px] bg-zinc-50">
            <div>
              <div className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-1.5">
                مشخصات و امضای تحویل‌دهنده (کارشناس خودرو)
              </div>
              <div className="space-y-0.5 text-[11px] text-zinc-700">
                <div>نام کارشناس: <span className="font-bold">{form.delivererSignature.name || 'کارشناس رسمی'}</span></div>
                <div>سمت: <span>{form.delivererSignature.roleOrCompany || 'کارشناس فنی و تحویل'}</span></div>
                <div>شماره تماس: <span className="font-mono">{toPersianDigits(form.delivererSignature.phone || '—')}</span></div>
                <div>تاریخ و ساعت: <span>{toPersianDigits(form.deliveryDate || dossier.deliveryDate)} {toPersianDigits(form.deliveryTime || '')}</span></div>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-dashed border-zinc-300 flex items-center justify-between text-[10px] text-zinc-500">
              <span>محل امضا:</span>
              {form.delivererSignature.signatureImage && (
                <img
                  src={form.delivererSignature.signatureImage}
                  alt="امضای تحویل‌دهنده"
                  className="h-10 object-contain"
                />
              )}
            </div>
          </div>

          {/* Receiver Signature */}
          <div className="border border-zinc-300 rounded-lg p-3 text-xs flex flex-col justify-between min-h-[135px] bg-zinc-50">
            <div>
              <div className="font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-1.5">
                مشخصات و امضای تحویل‌گیرنده (خریدار خودرو)
              </div>
              <div className="space-y-0.5 text-[11px] text-zinc-700">
                <div>نام و نام خانوادگی: <span className="font-bold">{form.receiverSignature.name || dossier.customerName}</span></div>
                <div>کد ملی: <span className="font-mono">{toPersianDigits(form.receiverSignature.nationalId || '—')}</span></div>
                <div>شماره تماس: <span className="font-mono">{toPersianDigits(form.receiverSignature.phone || '—')}</span></div>
                <div>تاریخ و ساعت: <span>{toPersianDigits(form.deliveryDate || dossier.deliveryDate)} {toPersianDigits(form.deliveryTime || '')}</span></div>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-dashed border-zinc-300 flex items-center justify-between text-[10px] text-zinc-500">
              <span>محل امضا و اثر انگشت:</span>
              {form.receiverSignature.signatureImage && (
                <img
                  src={form.receiverSignature.signatureImage}
                  alt="امضای خریدار"
                  className="h-10 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-zinc-300 text-center text-[10px] text-zinc-500 flex items-center justify-between font-mono">
          <span>سامانه مدیریت و تحویل خودرو اتو عبداللهی</span>
          <span>شناسه یکتای تحویل: {dossier.saleNumber}-CAR</span>
          <span>نسخه رسمی تحویل خودرو</span>
        </div>
      </div>
    </div>
  );
};
