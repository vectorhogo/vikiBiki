import React, { useState } from 'react';
import { Vehicle } from '../types/accounting';
import { ConsignmentAgreement, ConsignmentReturnRecord } from '../types/consignment';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  X,
  RotateCcw,
  Car,
  User,
  Calendar,
  Clock,
  PenTool,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';

interface ConsignmentReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  agreement?: ConsignmentAgreement;
  onConfirmReturn: (record: ConsignmentReturnRecord) => void;
}

export const ConsignmentReturnModal: React.FC<ConsignmentReturnModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  agreement,
  onConfirmReturn,
}) => {
  const { showToast } = useAccounting();

  const [returnDate, setReturnDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [returnTime, setReturnTime] = useState('۱۶:۰۰');
  const [vehicleConditionAtReturn, setVehicleConditionAtReturn] = useState(
    'خودرو مطابق وضعیت پذیرش اولیه بدون عیب و نقص جدید و با کلیه اقلام فابریک عودت گردید.'
  );
  const [notes, setNotes] = useState(
    'انصراف مالک از فروش امانی و تحویل کامل خودرو به ایشان.'
  );

  // Signatures
  const [ownerName, setOwnerName] = useState(vehicle.ownerName || agreement?.ownerName || 'مالک محترم');
  const [ownerSignatureImg, setOwnerSignatureImg] = useState<string | undefined>();
  const [dealershipRepName, setDealershipRepName] = useState('مدیر داخلی اتو عبداللهی');
  const [dealershipSignatureImg, setDealershipSignatureImg] = useState<string | undefined>();

  const [isSigningOwner, setIsSigningOwner] = useState(false);
  const [isSigningRep, setIsSigningRep] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: ConsignmentReturnRecord = {
      id: `ret-${Date.now()}`,
      agreementId: agreement?.id || vehicle.consignmentAgreementId || `con-${vehicle.id}`,
      vehicleId: vehicle.id,
      vehicleFullName: vehicle.fullName,
      ownerPersonId: vehicle.ownerPersonId || agreement?.ownerPersonId || 'cust-1',
      ownerName,
      returnDate,
      returnTime,
      vehicleConditionAtReturn: vehicleConditionAtReturn.trim(),
      notes: notes.trim() || undefined,
      ownerSignature: {
        name: ownerName,
        phone: vehicle.ownerPhone || '',
        nationalId: vehicle.ownerNationalId || '',
        date: returnDate,
        time: returnTime,
        signatureImage: ownerSignatureImg,
      },
      dealershipSignature: {
        name: dealershipRepName,
        phone: '۰۹۱۲-۲۲۲-۹۹۰۰',
        nationalId: '۰۰۶۵۴۳۲۱۸۹',
        roleOrCompany: 'نماینده اتو عبداللهی',
        date: returnDate,
        time: returnTime,
        signatureImage: dealershipSignatureImg,
      },
      createdAt: DEALERSHIP_CURRENT_DATE,
    };

    onConfirmReturn(record);
    showToast(`خودروی امانی «${vehicle.fullName}» با موفقیت به مالک عودت داده شد.`, 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-[#14151b] border border-[#2b2e3c] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 bg-[#111216] border-b border-[#252834] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">
                عودت خودروی امانی به مالک (Return to Owner)
              </h3>
              <p className="text-xs text-zinc-400">
                ثبت رسمی تحویل خودرو به مالک، وضعیت ظاهری و امضای طرفین
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#20222a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Vehicle info card */}
          <div className="p-3.5 bg-[#171822] border border-[#272938] rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-sm text-zinc-100">{vehicle.fullName}</div>
              <div className="text-zinc-400 text-xs">
                پلاک: {toPersianDigits(vehicle.plate)} • شاسی: {vehicle.vin}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block">مالک خودرو:</span>
              <span className="font-bold text-amber-300 text-xs">{ownerName}</span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-zinc-400 text-[10px] block mb-1">تاریخ عودت:</span>
              <input
                type="text"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block mb-1">ساعت عودت:</span>
              <input
                type="text"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Condition upon return */}
          <div>
            <span className="text-zinc-300 font-semibold block mb-1">
              وضعیت بدنه و اقلام خودرو هنگام عودت:
            </span>
            <textarea
              rows={3}
              value={vehicleConditionAtReturn}
              onChange={(e) => setVehicleConditionAtReturn(e.target.value)}
              className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl p-2.5 text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <span className="text-zinc-300 font-semibold block mb-1">توضیحات و علت عودت:</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Dual Signatures */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#252834]">
            {/* Owner Signature Box */}
            <div className="p-3 bg-[#111216] border border-[#272935] rounded-xl text-center space-y-2">
              <span className="text-zinc-300 font-bold block text-[11px]">
                امضای مالک (تحویل‌گیرنده):
              </span>
              <span className="text-amber-300 text-xs block">{ownerName}</span>

              {ownerSignatureImg ? (
                <div className="bg-white p-1.5 rounded border">
                  <img src={ownerSignatureImg} alt="امضا" className="h-12 mx-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => setIsSigningOwner(true)}
                    className="text-[10px] text-amber-600 hover:underline mt-0.5 block"
                  >
                    تغییر امضا
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSigningOwner(true)}
                  className="w-full py-2 bg-[#1a1c24] hover:bg-[#252836] text-amber-300 font-bold rounded-lg border border-amber-500/30 text-xs cursor-pointer"
                >
                  ثبت امضای مالک
                </button>
              )}
            </div>

            {/* Dealership Rep Signature Box */}
            <div className="p-3 bg-[#111216] border border-[#272935] rounded-xl text-center space-y-2">
              <span className="text-zinc-300 font-bold block text-[11px]">
                امضای نماینده نمایشگاه:
              </span>
              <span className="text-sky-300 text-xs block">{dealershipRepName}</span>

              {dealershipSignatureImg ? (
                <div className="bg-white p-1.5 rounded border">
                  <img src={dealershipSignatureImg} alt="امضا" className="h-12 mx-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => setIsSigningRep(true)}
                    className="text-[10px] text-sky-600 hover:underline mt-0.5 block"
                  >
                    تغییر امضا
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSigningRep(true)}
                  className="w-full py-2 bg-[#1a1c24] hover:bg-[#252836] text-sky-300 font-bold rounded-lg border border-sky-500/30 text-xs cursor-pointer"
                >
                  ثبت امضای نماینده
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#252834]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl"
            >
              انصراف
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>تأیید و ثبت نهایی عودت خودرو به مالک</span>
            </button>
          </div>
        </form>

        {isSigningOwner && (
          <SignaturePadModal
            isOpen={isSigningOwner}
            onClose={() => setIsSigningOwner(false)}
            title="امضای دیجیتال مالک خودرو"
            signerName={ownerName}
            onSaveSignature={(dataUrl) => {
              setOwnerSignatureImg(dataUrl);
              setIsSigningOwner(false);
            }}
          />
        )}

        {isSigningRep && (
          <SignaturePadModal
            isOpen={isSigningRep}
            onClose={() => setIsSigningRep(false)}
            title="امضای نماینده نمایشگاه اتو عبداللهی"
            signerName={dealershipRepName}
            onSaveSignature={(dataUrl) => {
              setDealershipSignatureImg(dataUrl);
              setIsSigningRep(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
