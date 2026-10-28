import React from 'react';
import { SmartContract } from '../types/contract';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { X, Printer, ShieldCheck, CheckCircle2, Car } from 'lucide-react';

interface PrintableContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: SmartContract | null;
}

export const PrintableContractModal: React.FC<PrintableContractModalProps> = ({
  isOpen,
  onClose,
  contract,
}) => {
  if (!isOpen || !contract) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSale = contract.contractType === 'sale';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      {/* Top Floating Action Bar (hidden on print) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900/95 border border-zinc-700/80 px-4 py-2 rounded-xl shadow-2xl print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>چاپ نسخه رسمی مبایعه‌نامه</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>بستن</span>
        </button>
      </div>

      {/* Printable Sheet (Standard A4 Paper Dimensions) */}
      <div className="w-full max-w-4xl bg-white text-zinc-900 p-8 sm:p-12 rounded-lg shadow-2xl my-16 print:my-0 print:p-6 print:shadow-none print:w-full font-serif text-[13px] leading-relaxed border border-zinc-200 print:border-none">
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-xs text-zinc-600">جمهوری اسلامی ایران</div>
              <div className="text-xs text-zinc-600 font-semibold mt-0.5">
                اتحادیه صنف دارندگان نمایشگاه‌ها و فروشندگان خودرو
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-sans">
                {isSale ? 'مبایعه‌نامه قطعی فروش و انتقال خودرو' : 'قرارداد رسمی خرید خودرو'}
              </h1>
              <p className="text-xs text-zinc-600 mt-1 font-sans">
                نمایشگاه اتومبیل عبدالهی — مدیریت امور قراردادها
              </p>
            </div>
            <div className="text-left text-xs space-y-1 font-mono">
              <div>
                <span className="text-zinc-500">شماره قرارداد: </span>
                <span className="font-bold text-zinc-900">{contract.contractNumber}</span>
              </div>
              <div>
                <span className="text-zinc-500">تاریخ: </span>
                <span className="font-semibold text-zinc-900">{toPersianDigits(contract.contractDate)}</span>
              </div>
              <div>
                <span className="text-zinc-500">پیوست: </span>
                <span className="font-medium">دارد</span>
              </div>
            </div>
          </div>
        </div>

        {/* ماده ۱: طرفین قرارداد */}
        <div className="mb-5">
          <h2 className="text-sm font-bold bg-zinc-100 border border-zinc-300 px-3 py-1.5 rounded mb-2.5">
            ماده ۱ — طرفین قرارداد
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* فروشنده */}
            <div className="border border-zinc-300 rounded p-3 bg-zinc-50/50">
              <div className="font-bold text-xs text-zinc-800 mb-1.5 border-b border-zinc-200 pb-1">
                طرف اول (فروشنده):
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-zinc-500">نام و نام خانوادگی / شرکت: </span>
                  <span className="font-semibold text-zinc-900">{contract.parties.seller.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500">کد ملی / شناسه ملی: </span>
                  <span className="font-mono">{toPersianDigits(contract.parties.seller.nationalId || '---')}</span>
                </div>
                <div>
                  <span className="text-zinc-500">شماره تماس: </span>
                  <span className="font-mono">{toPersianDigits(contract.parties.seller.phone || '---')}</span>
                </div>
                <div>
                  <span className="text-zinc-500">نشانی اقامتگاه: </span>
                  <span>{contract.parties.seller.address || 'تهران، خیابان شریعتی، پلاک ۱۲'}</span>
                </div>
              </div>
            </div>

            {/* خریدار */}
            <div className="border border-zinc-300 rounded p-3 bg-zinc-50/50">
              <div className="font-bold text-xs text-zinc-800 mb-1.5 border-b border-zinc-200 pb-1">
                طرف دوم (خریدار):
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-zinc-500">نام و نام خانوادگی / شرکت: </span>
                  <span className="font-semibold text-zinc-900">{contract.parties.buyer.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500">کد ملی / شناسه ملی: </span>
                  <span className="font-mono">{toPersianDigits(contract.parties.buyer.nationalId || '---')}</span>
                </div>
                <div>
                  <span className="text-zinc-500">شماره تماس: </span>
                  <span className="font-mono">{toPersianDigits(contract.parties.buyer.phone || '---')}</span>
                </div>
                <div>
                  <span className="text-zinc-500">نشانی اقامتگاه: </span>
                  <span>{contract.parties.buyer.address || '---'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ماده ۲: موضوع معامله و مشخصات خودرو */}
        <div className="mb-5">
          <h2 className="text-sm font-bold bg-zinc-100 border border-zinc-300 px-3 py-1.5 rounded mb-2.5">
            ماده ۲ — موضوع معامله و مشخصات فنی خودرو
          </h2>
          <div className="border border-zinc-300 rounded p-3">
            <p className="text-xs mb-3 text-zinc-800">
              موضوع قرارداد عبارت است از انتقال قطعی یک دستگاه خودرو با مشخصات ذیل که به رؤیت کامل و کارشناسی خریدار رسیده است:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block">نوع و مدل:</span>
                <span className="font-bold text-zinc-900">{contract.vehicleLabel}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">سال ساخت / تولید:</span>
                <span className="font-bold font-mono">{toPersianDigits(contract.vehicleSnapshot.year || 1402)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">رنگ بدنه:</span>
                <span className="font-bold">{contract.vehicleSnapshot.color || 'سفید'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">شماره پلاک انتظامی:</span>
                <span className="font-bold font-mono">{toPersianDigits(contract.vehicleSnapshot.licensePlate || '---')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 block">شماره شاسی (VIN):</span>
                <span className="font-mono text-zinc-900 font-semibold">{contract.vehicleSnapshot.chassisNumber || '---'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">شماره موتور:</span>
                <span className="font-mono text-zinc-900 font-semibold">{contract.vehicleSnapshot.engineNumber || '---'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">کارکرد پیمایش:</span>
                <span className="font-mono">{toPersianDigits(contract.vehicleSnapshot.mileage ? `${contract.vehicleSnapshot.mileage.toLocaleString()} کیلومتر` : 'صفر')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ماده ۳: ثمن معامله و شرایط پرداخت */}
        <div className="mb-5">
          <h2 className="text-sm font-bold bg-zinc-100 border border-zinc-300 px-3 py-1.5 rounded mb-2.5">
            ماده ۳ — ثمن معامله و شرایط تسویه حساب (تفکیک مالی)
          </h2>
          <div className="border border-zinc-300 rounded p-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-zinc-50 p-2.5 rounded border border-zinc-200">
              <div>
                <span className="text-zinc-500 block">قیمت پایه خودرو:</span>
                <span className="font-bold text-zinc-900 font-mono">
                  {formatToman(contract.financials.baseVehiclePrice)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">سود توافق‌شده اقساط:</span>
                <span className="font-bold text-zinc-900 font-mono">
                  {formatToman(contract.financials.installmentProfit)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">مبلغ کل توافق‌شده قرارداد:</span>
                <span className="font-bold text-emerald-800 text-sm font-mono">
                  {formatToman(contract.financials.totalAgreedPrice)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">مبلغ پیش‌پرداخت نقدی:</span>
                <span className="font-semibold font-mono">
                  {formatToman(contract.financials.downPayment)}
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  ({contract.financials.downPaymentPaid ? 'دریافت شده' : 'توافق‌شده'})
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">مانده ثمن (اقساطی):</span>
                <span className="font-semibold text-zinc-900 font-mono">
                  {formatToman(contract.financials.remainingBalance)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">روش پرداخت:</span>
                <span className="font-semibold">
                  {contract.financials.paymentArrangement === 'cash'
                    ? 'نقدی کامل'
                    : contract.financials.paymentArrangement === 'installment'
                    ? 'اقساطی کامل'
                    : 'ترکیبی نقد و اقساط'}
                </span>
              </div>
            </div>

            {/* جدول زمان‌بندی اقساط در صورت وجود */}
            {contract.installments.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-zinc-800 mb-1.5">
                  جدول زمان‌بندی اقساط و اسناد تجاری تضمین:
                </div>
                <table className="w-full text-center border-collapse border border-zinc-300 text-xs">
                  <thead className="bg-zinc-100 text-zinc-700">
                    <tr>
                      <th className="border border-zinc-300 py-1 px-1.5 w-10">ردیف</th>
                      <th className="border border-zinc-300 py-1 px-2">تاریخ سررسید</th>
                      <th className="border border-zinc-300 py-1 px-2">مبلغ قسط (تومان)</th>
                      <th className="border border-zinc-300 py-1 px-2">نوع تضمین</th>
                      <th className="border border-zinc-300 py-1 px-2">شماره چک / صیادی</th>
                      <th className="border border-zinc-300 py-1 px-2">بانک عامل</th>
                      <th className="border border-zinc-300 py-1 px-2">وضعیت تسویه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.installments.map((inst) => (
                      <tr key={inst.id} className="hover:bg-zinc-50">
                        <td className="border border-zinc-300 py-1 font-mono">{toPersianDigits(inst.installmentNumber)}</td>
                        <td className="border border-zinc-300 py-1 font-mono">{toPersianDigits(inst.dueDate)}</td>
                        <td className="border border-zinc-300 py-1 font-mono font-semibold">{formatToman(inst.amount)}</td>
                        <td className="border border-zinc-300 py-1">{inst.guaranteeType === 'cheque' ? 'چک صیادی' : inst.guaranteeType === 'promissory_note' ? 'سفته' : 'سایر'}</td>
                        <td className="border border-zinc-300 py-1 font-mono">{inst.chequeNumber || '---'}</td>
                        <td className="border border-zinc-300 py-1">{inst.bankName || '---'}</td>
                        <td className="border border-zinc-300 py-1">
                          {inst.status === 'paid' ? 'تسویه شده' : inst.status === 'partial' ? 'پرداخت ناقص' : 'در انتظار سررسید'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ماده ۴، ۵ و ۶: شروط و تعهدات حقوقی */}
        <div className="mb-5 space-y-3">
          <div className="border border-zinc-300 rounded p-3">
            <h3 className="font-bold text-xs mb-1">ماده ۴ — تحویل مبیع و مدارک خودرو</h3>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {contract.clauses.deliveryTerms ||
                'خودرو به انضمام کلیه متعلقات قانونی و اسناد (شامل برگ سبز، کارت خودرو، بیمه‌نامه شخص ثالث و کلیدهای اصلی) تحویل خریدار گردید و از تاریخ تحویل کلیه مسئولیت‌های کیفری، مدنی و تخلفات رانندگی متوجه خریدار خواهد بود.'}
            </p>
          </div>

          <div className="border border-zinc-300 rounded p-3">
            <h3 className="font-bold text-xs mb-1">ماده ۵ — انتقال سند رسمی و دفترخانه</h3>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {contract.clauses.ownershipTransfer ||
                `طرفین متعهدند در تاریخ ${toPersianDigits(contract.notaryDate || 'توافق طرفین')} جهت تنظیم و امضای سند رسمی در دفترخانه شماره ${toPersianDigits(contract.notaryOffice || '---')} حضور بهم رسانند.`}
            </p>
          </div>

          <div className="border border-zinc-300 rounded p-3">
            <h3 className="font-bold text-xs mb-1">ماده ۶ — شروط ضمن عقد، خسارات و اسقاط خیارات</h3>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {contract.clauses.penaltiesAndDamages ||
                `در صورت تأخیر در پرداخت هر یک از اقساط، روزانه مبلغ ${toPersianDigits(contract.clauses.dailyPenaltyAmount ? contract.clauses.dailyPenaltyAmount.toLocaleString() : '۵۰۰,۰۰۰')} تومان به عنوان وجه التزام و خسارت تأخیر تادیه بر عهده خریدار خواهد بود. اسقاط کافه خیارات ولو خیار غبن فاحش از طرفین به عمل آمد.`}
            </p>
          </div>
        </div>

        {/* محل امضا و اثر انگشت طرفین */}
        <div className="mt-8 pt-6 border-t-2 border-zinc-800">
          <div className="grid grid-cols-4 gap-4 text-center text-xs">
            <div className="border border-zinc-300 rounded p-3 min-h-32 flex flex-col justify-between">
              <span className="font-bold text-zinc-800">امضا و اثر انگشت فروشنده</span>
              <span className="text-[10px] text-zinc-400">محل اثر انگشت و امضا</span>
            </div>
            <div className="border border-zinc-300 rounded p-3 min-h-32 flex flex-col justify-between">
              <span className="font-bold text-zinc-800">امضا و اثر انگشت خریدار</span>
              <span className="text-[10px] text-zinc-400">محل اثر انگشت و امضا</span>
            </div>
            <div className="border border-zinc-300 rounded p-3 min-h-32 flex flex-col justify-between">
              <span className="font-bold text-zinc-800">امضای شاهد اول و دوم</span>
              <span className="text-[10px] text-zinc-400">گواهی امضای شهود</span>
            </div>
            <div className="border border-zinc-300 rounded p-3 min-h-32 flex flex-col justify-between bg-zinc-50">
              <span className="font-bold text-zinc-800">مهر و امضای متصدی نمایشگاه</span>
              <div className="text-[11px] font-sans font-semibold text-zinc-700">
                اتومبیل عبدالهی
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
