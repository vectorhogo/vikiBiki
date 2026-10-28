import React, { useState } from 'react';
import {
  VehicleHandoverInspection,
  HandoverChecklistItem,
  VehicleDamageMarker,
  OwnershipType,
} from '../types/consignment';
import { Vehicle } from '../types/accounting';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  X,
  Car,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  PenTool,
  Save,
  Rotate3d,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  User,
} from 'lucide-react';
import { Vehicle3DDamageViewer } from './Vehicle3DDamageViewer';
import { ThreeStateChecklist } from './ThreeStateChecklist';
import { SignaturePadModal } from './SignaturePadModal';
import { PrintableConditionReport } from './PrintableConditionReport';
import { createDefaultHandoverChecklist } from '../data/initialConsignmentData';

interface VehicleHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  existingInspection?: VehicleHandoverInspection;
  onSaveInspection: (inspection: VehicleHandoverInspection) => void;
  defaultDeliveryType?: 'consignment_intake' | 'purchase_intake' | 'sales_delivery' | 'return_to_owner';
}

export const VehicleHandoverModal: React.FC<VehicleHandoverModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  existingInspection,
  onSaveInspection,
  defaultDeliveryType = vehicle.ownershipType === 'consignment' ? 'consignment_intake' : 'purchase_intake',
}) => {
  const { showToast } = useAccounting();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'checklist' | 'damage_map' | 'photos_notes' | 'signatures'>('checklist');

  // Form state
  const [date, setDate] = useState(existingInspection?.date || DEALERSHIP_CURRENT_DATE);
  const [time, setTime] = useState(existingInspection?.time || '۱۱:۳۰');
  const [mileage, setMileage] = useState(existingInspection?.mileage || 120000);
  const [fuelLevel, setFuelLevel] = useState<'reserve' | '1/4' | '1/2' | '3/4' | 'full'>(
    existingInspection?.fuelLevel || '1/2'
  );
  const [color, setColor] = useState(existingInspection?.color || vehicle.color || 'سفید');
  const [plate, setPlate] = useState(existingInspection?.plate || vehicle.plate || '—');
  const [chassisNumber, setChassisNumber] = useState(
    existingInspection?.chassisNumber || vehicle.vin || '—'
  );

  // Deliverer and Receiver Signatures
  const [delivererName, setDelivererName] = useState(
    existingInspection?.deliveredBy?.name || vehicle.ownerName || 'مالک / فروشنده محترم'
  );
  const [delivererPhone, setDelivererPhone] = useState(
    existingInspection?.deliveredBy?.phone || vehicle.ownerPhone || ''
  );
  const [delivererNatId, setDelivererNatId] = useState(
    existingInspection?.deliveredBy?.nationalId || vehicle.ownerNationalId || ''
  );
  const [delivererSignatureImg, setDelivererSignatureImg] = useState<string | undefined>(
    existingInspection?.deliveredBy?.signatureImage
  );

  const [receiverName, setReceiverName] = useState(
    existingInspection?.receivedBy?.name || 'مهندس اکبری (کارشناس فنی نمایشگاه)'
  );
  const [receiverRole, setReceiverRole] = useState(
    existingInspection?.receivedBy?.roleOrCompany || 'کارشناس تحویل اتو عبداللهی'
  );
  const [receiverSignatureImg, setReceiverSignatureImg] = useState<string | undefined>(
    existingInspection?.receivedBy?.signatureImage
  );

  // 3-State Checklist
  const [checklist, setChecklist] = useState<HandoverChecklistItem[]>(
    existingInspection?.checklist || createDefaultHandoverChecklist()
  );

  // 3D Damage Markers
  const [damageMarkers, setDamageMarkers] = useState<VehicleDamageMarker[]>(
    existingInspection?.damageMarkers || []
  );

  // General Notes & Photos
  const [generalNotes, setGeneralNotes] = useState(existingInspection?.generalNotes || '');
  const [generalPhotos, setGeneralPhotos] = useState<{ id: string; url: string; title: string }[]>(
    existingInspection?.generalPhotos || []
  );

  // Signature modal states
  const [isSigningDeliverer, setIsSigningDeliverer] = useState(false);
  const [isSigningReceiver, setIsSigningReceiver] = useState(false);

  // Print overlay
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  if (!isOpen) return null;

  // Add marker handler
  const handleAddMarker = (newMarker: Omit<VehicleDamageMarker, 'id' | 'createdAt'>) => {
    const markerWithId: VehicleDamageMarker = {
      ...newMarker,
      id: `dmg-${Date.now()}`,
      createdAt: DEALERSHIP_CURRENT_DATE,
    };
    setDamageMarkers((prev) => [...prev, markerWithId]);
    showToast('آسیب بدنه با موفقیت بر روی نقشه ثبت شد.', 'info');
  };

  // Update marker handler
  const handleUpdateMarker = (updatedMarker: VehicleDamageMarker) => {
    setDamageMarkers((prev) =>
      prev.map((m) => (m.id === updatedMarker.id ? updatedMarker : m))
    );
    showToast('مشخصات آسیب بدنه با موفقیت به‌روزرسانی شد.', 'info');
  };

  // Delete marker handler
  const handleDeleteMarker = (id: string) => {
    setDamageMarkers((prev) => prev.filter((m) => m.id !== id));
    showToast('آسیب بدنه حذف گردید.', 'info');
  };

  // General photo upload
  const handleGeneralPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, title: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      if (url) {
        setGeneralPhotos((prev) => [
          ...prev,
          { id: `photo-${Date.now()}`, url, title: title || file.name },
        ]);
        showToast('تصویر با موفقیت بارگذاری شد.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // Build finalized inspection object
  const currentInspection: VehicleHandoverInspection = {
    id: existingInspection?.id || `INSP-${Date.now().toString().slice(-6)}`,
    vehicleId: vehicle.id,
    vehicleFullName: vehicle.fullName,
    ownershipType: (vehicle.ownershipType as OwnershipType) || 'owned',
    deliveryType: defaultDeliveryType,
    inspectionStage: 'intake',
    date,
    time,
    mileage,
    fuelLevel,
    color,
    plate,
    chassisNumber,
    deliveredBy: {
      name: delivererName,
      phone: delivererPhone,
      nationalId: delivererNatId,
      date,
      time,
      signatureImage: delivererSignatureImg,
    },
    receivedBy: {
      name: receiverName,
      phone: '۰۹۱۲-۲۲۲-۹۹۰۰',
      nationalId: '۰۰۶۵۴۳۲۱۸۹',
      roleOrCompany: receiverRole,
      date,
      time,
      signatureImage: receiverSignatureImg,
    },
    checklist,
    damageMarkers,
    generalPhotos,
    generalNotes,
    status: 'completed',
    createdAt: existingInspection?.createdAt || DEALERSHIP_CURRENT_DATE,
    finalizedAt: `${date} ${time}`,
  };

  const handleSave = () => {
    onSaveInspection(currentInspection);
    showToast('فرم جامع تحویل و کارشناسی وضعیت خودرو با موفقیت ذخیره شد.', 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-[#14151b] border border-[#2b2e3c] rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 bg-[#111216] border-b border-[#252834] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-zinc-100">{vehicle.fullName}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    vehicle.ownershipType === 'consignment'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {vehicle.ownershipType === 'consignment' ? 'خودروی امانی' : 'مالکیت نمایشگاه'}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  پلاک: {toPersianDigits(plate || '—')}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                فرم دیجیتال تحویل خودرو، چک‌لیست سه حالته اقلام، نقشه سه‌بعدی آسیب‌ها و امضای دیجیتال
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsPrintOpen(true)}
              className="px-3 py-1.5 bg-[#1f212a] hover:bg-[#282b36] text-zinc-300 border border-[#2e313e] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>پیش‌نمایش چاپ</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#20222a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vehicle Metadata Bar */}
        <div className="px-4 py-2.5 bg-[#171822] border-b border-[#252834] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 block mb-0.5">تاریخ تحویل:</span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#111216] border border-[#2b2e3c] rounded px-2 py-1 font-mono text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block mb-0.5">ساعت تحویل:</span>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#111216] border border-[#2b2e3c] rounded px-2 py-1 font-mono text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block mb-0.5">کیلومتر کارکرد:</span>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#111216] border border-[#2b2e3c] rounded px-2 py-1 font-mono text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block mb-0.5">سطح سوخت باک:</span>
            <select
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value as any)}
              className="w-full bg-[#111216] border border-[#2b2e3c] rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="reserve">چراغ بنزین / زاپاس</option>
              <option value="1/4">یک چهارم (۱/۴)</option>
              <option value="1/2">نصف باک (۱/۲)</option>
              <option value="3/4">سه چهارم (۳/۴)</option>
              <option value="full">باک پر (Full)</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block mb-0.5">تحویل‌دهنده / مالک:</span>
            <span className="text-zinc-200 font-bold truncate block pt-1">
              {delivererName || '—'}
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-[#252834] bg-[#14151b] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>۱. چک‌لیست تجهیزات (۳ حالته)</span>
          </button>

          <button
            onClick={() => setActiveTab('damage_map')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'damage_map'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Rotate3d className="w-4 h-4" />
            <span>۲. وضعیت بدنه و نقشه سه‌بعدی</span>
            {damageMarkers.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {toPersianDigits(damageMarkers.length)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('photos_notes')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'photos_notes'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>۳. تصاویر و یادداشت‌های تحویل</span>
            {generalPhotos.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-sky-500 text-black text-[10px] font-mono flex items-center justify-center font-bold">
                {toPersianDigits(generalPhotos.length)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('signatures')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'signatures'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>۴. امضا و تأیید نهایی</span>
            {delivererSignatureImg && receiverSignatureImg && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: 3-State Checklist */}
          {activeTab === 'checklist' && (
            <ThreeStateChecklist items={checklist} onChangeItems={setChecklist} />
          )}

          {/* TAB 2: 3D Body Damage Map */}
          {activeTab === 'damage_map' && (
            <Vehicle3DDamageViewer
              markers={damageMarkers}
              onAddMarker={handleAddMarker}
              onUpdateMarker={handleUpdateMarker}
              onDeleteMarker={handleDeleteMarker}
              vehicleName={vehicle.fullName}
              plateNumber={plate}
            />
          )}

          {/* TAB 3: General Photos & Notes */}
          {activeTab === 'photos_notes' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#171822] border border-[#272935] p-4 rounded-2xl space-y-3">
                <span className="font-bold text-zinc-200 block text-sm">
                  یادداشت‌ها و توافقات اختصاصی تحویل:
                </span>
                <textarea
                  rows={4}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="هرگونه توضیحات خاص در مورد سلامت موتور، گیربکس، سوئیچ یدک، کارت سوخت، یا توافقات خاص با مالک در اینجا درج شود..."
                  className="w-full bg-[#111216] border border-[#2b2e3c] rounded-xl p-3 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Photo Galleries */}
              <div className="bg-[#171822] border border-[#272935] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 block text-sm">
                    تصاویر کلی خودرو هنگام ورود به نمایشگاه:
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    نمای جلو، عقب، طرفین، کیلومترشمار و داخل کابین
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['نمای جلو', 'نمای عقب', 'داخل کابین', 'کیلومتر و داشبورد'].map((title, i) => {
                    const existing = generalPhotos[i];
                    return (
                      <div
                        key={title}
                        className="bg-[#121317] border border-[#2b2e3c] rounded-xl p-3 flex flex-col items-center justify-center space-y-2 text-center"
                      >
                        <span className="text-zinc-400 font-semibold text-[11px]">{title}</span>
                        {existing ? (
                          <div className="relative group">
                            <img
                              src={existing.url}
                              alt={title}
                              className="w-24 h-20 object-cover rounded-lg border border-amber-500/40"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setGeneralPhotos((prev) => prev.filter((p) => p.id !== existing.id))
                              }
                              className="absolute top-1 right-1 bg-black/70 text-rose-400 p-1 rounded hover:bg-black"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-full py-4 border border-dashed border-[#343748] hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                            <ImageIcon className="w-5 h-5 text-zinc-500 mb-1" />
                            <span className="text-[10px] text-zinc-400">بارگذاری عکس</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleGeneralPhotoUpload(e, title)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Signatures */}
          {activeTab === 'signatures' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#171822] border border-[#272935] p-4 rounded-2xl space-y-4">
                <span className="font-bold text-zinc-200 block text-sm">
                  تأییدیه و امضای دیجیتال طرفین تحویل خودرو:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Deliverer Box */}
                  <div className="p-4 bg-[#121317] border border-[#292c3a] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#242634]">
                      <span className="font-bold text-amber-300">تحویل‌دهنده / مالک خودرو:</span>
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">نام و نام خانوادگی:</span>
                        <input
                          type="text"
                          value={delivererName}
                          onChange={(e) => setDelivererName(e.target.value)}
                          className="w-full bg-[#181920] border border-[#2f3242] rounded px-2.5 py-1.5 text-xs text-zinc-100"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-0.5">شماره تماس:</span>
                          <input
                            type="text"
                            value={delivererPhone}
                            onChange={(e) => setDelivererPhone(e.target.value)}
                            className="w-full bg-[#181920] border border-[#2f3242] rounded px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-0.5">کد ملی:</span>
                          <input
                            type="text"
                            value={delivererNatId}
                            onChange={(e) => setDelivererNatId(e.target.value)}
                            className="w-full bg-[#181920] border border-[#2f3242] rounded px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Signature Preview / Pad button */}
                    <div className="pt-2 border-t border-[#242634] flex flex-col items-center justify-center space-y-2">
                      {delivererSignatureImg ? (
                        <div className="w-full flex flex-col items-center bg-white p-2 rounded-lg border">
                          <img
                            src={delivererSignatureImg}
                            alt="امضای تحویل‌دهنده"
                            className="h-16 object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setIsSigningDeliverer(true)}
                            className="text-[11px] text-amber-600 hover:underline mt-1 cursor-pointer"
                          >
                            تغییر امضا
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsSigningDeliverer(true)}
                          className="w-full py-3 bg-[#1e2029] hover:bg-[#282a36] text-amber-300 font-bold rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <PenTool className="w-4 h-4" />
                          <span>ثبت امضای دیجیتال تحویل‌دهنده</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dealership Receiver Box */}
                  <div className="p-4 bg-[#121317] border border-[#292c3a] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#242634]">
                      <span className="font-bold text-sky-300">
                        کارشناس تحویل / نماینده نمایشگاه:
                      </span>
                      <ShieldCheck className="w-4 h-4 text-zinc-400" />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">نام کارشناس:</span>
                        <input
                          type="text"
                          value={receiverName}
                          onChange={(e) => setReceiverName(e.target.value)}
                          className="w-full bg-[#181920] border border-[#2f3242] rounded px-2.5 py-1.5 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">سمت سازمانی:</span>
                        <input
                          type="text"
                          value={receiverRole}
                          onChange={(e) => setReceiverRole(e.target.value)}
                          className="w-full bg-[#181920] border border-[#2f3242] rounded px-2.5 py-1.5 text-xs text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Signature Preview / Pad button */}
                    <div className="pt-2 border-t border-[#242634] flex flex-col items-center justify-center space-y-2">
                      {receiverSignatureImg ? (
                        <div className="w-full flex flex-col items-center bg-white p-2 rounded-lg border">
                          <img
                            src={receiverSignatureImg}
                            alt="امضای نماینده نمایشگاه"
                            className="h-16 object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setIsSigningReceiver(true)}
                            className="text-[11px] text-sky-600 hover:underline mt-1 cursor-pointer"
                          >
                            تغییر امضا
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsSigningReceiver(true)}
                          className="w-full py-3 bg-[#1e2029] hover:bg-[#282a36] text-sky-300 font-bold rounded-xl border border-sky-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <PenTool className="w-4 h-4" />
                          <span>ثبت امضای دیجیتال نماینده نمایشگاه</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#111216] border-t border-[#252834] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-zinc-400">
              وضعیت بدنه: {toPersianDigits(damageMarkers.length)} مورد ثبت‌شده • اقلام: {toPersianDigits(checklist.filter(c => c.state === 'present').length)} موجود
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>ذخیره نهایی پرونده کارشناسی و تحویل</span>
            </button>
          </div>
        </div>

        {/* Deliverer Signature Pad Modal */}
        {isSigningDeliverer && (
          <SignaturePadModal
            isOpen={isSigningDeliverer}
            onClose={() => setIsSigningDeliverer(false)}
            title="امضای دیجیتال تحویل‌دهنده / مالک خودرو"
            signerName={delivererName}
            onSaveSignature={(dataUrl) => {
              setDelivererSignatureImg(dataUrl);
              setIsSigningDeliverer(false);
              showToast('امضای تحویل‌دهنده ثبت شد.', 'info');
            }}
          />
        )}

        {/* Receiver Signature Pad Modal */}
        {isSigningReceiver && (
          <SignaturePadModal
            isOpen={isSigningReceiver}
            onClose={() => setIsSigningReceiver(false)}
            title="امضای دیجیتال کارشناس تحویل / نماینده نمایشگاه"
            signerName={receiverName}
            onSaveSignature={(dataUrl) => {
              setReceiverSignatureImg(dataUrl);
              setIsSigningReceiver(false);
              showToast('امضای نماینده نمایشگاه ثبت شد.', 'info');
            }}
          />
        )}

        {/* Print Preview Overlay */}
        {isPrintOpen && (
          <PrintableConditionReport
            inspection={currentInspection}
            onClose={() => setIsPrintOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
