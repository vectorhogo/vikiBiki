import React from 'react';
import { VehicleHandoverInspection } from '../types/consignment';
import { toPersianDigits } from '../utils/formatters';
import { Printer, X, ShieldCheck, CheckCircle2, AlertTriangle, Car } from 'lucide-react';
import { DAMAGE_TYPE_CONFIG } from './Vehicle3DDamageViewer';

interface PrintableConditionReportProps {
  inspection: VehicleHandoverInspection;
  onClose: () => void;
}

export const PrintableConditionReport: React.FC<PrintableConditionReportProps> = ({
  inspection,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const presentItems = inspection.checklist.filter((it) => it.state === 'present');
  const missingItems = inspection.checklist.filter((it) => it.state === 'missing');
  const damagedItems = inspection.checklist.filter((it) => it.state === 'damaged');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white text-zinc-900 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl relative my-auto print:m-0 print:p-0 print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="sticky top-0 z-10 bg-zinc-900 text-white p-3 sm:px-6 flex items-center justify-between border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              پیش‌نمایش چاپ رسمی: برگه وضعیت و تحویل خودرو هنگام ورود
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>چاپ سند رسمی (Print / PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-xs font-sans print:p-6 print:text-[11px] leading-relaxed">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
                نمایشگاه و بازرگانی خودرو عبداللهی
              </h1>
              <p className="text-xs text-zinc-600 font-medium">
                برگه رسمی کارشناسی فنی، چک‌لیست اقلام و ثبت آسیب‌های بدنه هنگام ورود به نمایشگاه
              </p>
            </div>

            <div className="text-left font-mono space-y-1 border-r-2 border-zinc-300 pr-4">
              <div>
                <span className="text-zinc-500 text-[10px]">شماره برگه: </span>
                <strong className="text-zinc-900 font-bold">{inspection.id}</strong>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px]">تاریخ تنظیم: </span>
                <strong className="text-zinc-900">{toPersianDigits(inspection.date)}</strong>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px]">ساعت تحویل: </span>
                <strong className="text-zinc-900">{toPersianDigits(inspection.time)}</strong>
              </div>
            </div>
          </div>

          {/* Vehicle & Ownership Meta Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <div>
              <span className="text-zinc-500 text-[10px] block">خودرو:</span>
              <strong className="text-zinc-900 text-sm">{inspection.vehicleFullName}</strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">نوع مالکیت:</span>
              <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-zinc-200 text-zinc-800">
                {inspection.ownershipType === 'consignment' ? 'خودروی امانی' : 'مالکیت نمایشگاه'}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">شماره پلاک:</span>
              <strong className="text-zinc-900 font-mono text-sm">
                {toPersianDigits(inspection.plate || '—')}
              </strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">شماره شاسی (VIN):</span>
              <strong className="text-zinc-900 font-mono text-[11px]">
                {inspection.chassisNumber || '—'}
              </strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">رنگ بدنه:</span>
              <strong className="text-zinc-900">{inspection.color || 'سفید'}</strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">کارکرد هنگام ورود:</span>
              <strong className="text-zinc-900 font-mono">
                {toPersianDigits(inspection.mileage.toLocaleString())} کیلومتر
              </strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">تحویل‌دهنده / مالک:</span>
              <strong className="text-zinc-900">{inspection.deliveredBy.name}</strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] block">کارشناس تحویل نمایشگاه:</span>
              <strong className="text-zinc-900">{inspection.receivedBy.name}</strong>
            </div>
          </div>

          {/* Damage Map & Markers Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1.5">
              <h2 className="font-black text-sm text-zinc-900 flex items-center gap-1.5">
                <span>۱. گزارش آسیب‌ها، خط و خش و وضعیت رنگ بدنه خودرو</span>
              </h2>
              <span className="text-[11px] font-mono font-bold text-zinc-600">
                مجموع آسیب‌های ثبت‌شده: {toPersianDigits(inspection.damageMarkers.length)} مورد
              </span>
            </div>

            {inspection.damageMarkers.length === 0 ? (
              <div className="p-3 text-center bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600">
                بدنه خودرو کاملاً سالم و فاقد هرگونه خط و خش، لیسه‌گیری، فرورفتگی یا رنگ‌شدگی اعلام و تایید گردید.
              </div>
            ) : (
              <table className="w-full text-right border-collapse border border-zinc-300 text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700">
                    <th className="border border-zinc-300 p-2 w-10 text-center">ردیف</th>
                    <th className="border border-zinc-300 p-2">بخش / پنل بدنه</th>
                    <th className="border border-zinc-300 p-2">نوع آسیب</th>
                    <th className="border border-zinc-300 p-2">شدت</th>
                    <th className="border border-zinc-300 p-2">توضیحات تکمیلی کارشناسی</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.damageMarkers.map((m, idx) => {
                    const cfg = DAMAGE_TYPE_CONFIG[m.damageType] || DAMAGE_TYPE_CONFIG.other;
                    return (
                      <tr key={m.id} className="border border-zinc-300">
                        <td className="border border-zinc-300 p-2 text-center font-mono font-bold">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="border border-zinc-300 p-2 font-bold">{m.panelLabelFa}</td>
                        <td className="border border-zinc-300 p-2">{cfg.label}</td>
                        <td className="border border-zinc-300 p-2">
                          {m.severity === 'severe'
                            ? 'شدید / عمیق'
                            : m.severity === 'moderate'
                            ? 'متوسط'
                            : 'جزئی / سطحی'}
                        </td>
                        <td className="border border-zinc-300 p-2 text-zinc-700">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Three-State Checklist Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1.5">
              <h2 className="font-black text-sm text-zinc-900 flex items-center gap-1.5">
                <span>۲. صورت اقلام، ادوات و تجهیزات همراه خودرو</span>
              </h2>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-700 font-bold">
                  {toPersianDigits(presentItems.length)} موجود
                </span>
                <span className="text-rose-700 font-bold">
                  {toPersianDigits(missingItems.length)} ندارد
                </span>
                <span className="text-amber-700 font-bold">
                  {toPersianDigits(damagedItems.length)} خراب
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {inspection.checklist.map((it) => (
                <div
                  key={it.id}
                  className={`p-2 rounded border flex items-center justify-between ${
                    it.state === 'present'
                      ? 'bg-zinc-50 border-zinc-200'
                      : it.state === 'damaged'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="truncate pr-1">
                    {it.title} {it.quantity > 1 ? `(${toPersianDigits(it.quantity)})` : ''}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                      it.state === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : it.state === 'damaged'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {it.state === 'present' ? 'دارد' : it.state === 'damaged' ? 'خراب' : 'ندارد'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* General Notes */}
          {inspection.generalNotes && (
            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl space-y-1">
              <span className="font-bold text-zinc-800 block text-[11px]">توضیحات و توافقات طرفین:</span>
              <p className="text-zinc-700 leading-relaxed text-xs">{inspection.generalNotes}</p>
            </div>
          )}

          {/* Legal Acknowledgement & Signatures */}
          <div className="pt-4 border-t-2 border-zinc-900 space-y-6">
            <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
              این صورت‌جلسه در تاریخ فوق با حضور تحویل‌دهنده و کارشناس فنی نمایشگاه تنظیم و امضا گردید.
              تحویل‌دهنده بدین‌وسیله صحت اطلاعات فوق و وضعیت فیزیکی و اقلام تحویلی خودرو را تأیید نموده و
              نمایشگاه خودرو عبداللهی امانت‌داری خودرو و اقلام ثبت‌شده را متقبل می‌گردد.
            </p>

            <div className="grid grid-cols-2 gap-8 text-center pt-2">
              {/* Deliverer Signature */}
              <div className="border border-zinc-300 p-4 rounded-xl space-y-3 bg-zinc-50">
                <span className="font-bold text-zinc-800 block">
                  نام و امضای تحویل‌دهنده / مالک خودرو:
                </span>
                <div className="font-medium text-zinc-700">
                  {inspection.deliveredBy.name}
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    کد ملی: {toPersianDigits(inspection.deliveredBy.nationalId || '—')} • تلفن:{' '}
                    {toPersianDigits(inspection.deliveredBy.phone || '—')}
                  </div>
                </div>

                <div className="h-16 flex items-center justify-center border-t border-dashed border-zinc-300 pt-2">
                  {inspection.deliveredBy.signatureImage ? (
                    <img
                      src={inspection.deliveredBy.signatureImage}
                      alt="امضای تحویل‌دهنده"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-zinc-400 text-[10px] italic">محل امضا و اثر انگشت</span>
                  )}
                </div>
              </div>

              {/* Dealership Receiver Signature */}
              <div className="border border-zinc-300 p-4 rounded-xl space-y-3 bg-zinc-50">
                <span className="font-bold text-zinc-800 block">
                  نام و امضای کارشناس تحویل / نماینده نمایشگاه:
                </span>
                <div className="font-medium text-zinc-700">
                  {inspection.receivedBy.name}
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    سمت: {inspection.receivedBy.roleOrCompany || 'کارشناس تحویل اتو عبداللهی'}
                  </div>
                </div>

                <div className="h-16 flex items-center justify-center border-t border-dashed border-zinc-300 pt-2">
                  {inspection.receivedBy.signatureImage ? (
                    <img
                      src={inspection.receivedBy.signatureImage}
                      alt="امضای نماینده نمایشگاه"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-zinc-400 text-[10px] italic">مهر و امضای اتو عبداللهی</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
