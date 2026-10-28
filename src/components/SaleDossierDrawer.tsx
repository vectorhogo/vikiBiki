import React, { useState } from 'react';
import {
  SaleDossier,
  DeliveryFormA,
  DeliveryFormB,
  DeliveryDocumentItem,
  EquipmentChecklistItem,
  VehicleDiagramMarker,
  DeliveryPhoto,
} from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  X,
  Printer,
  Car,
  User,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Camera,
  PenTool,
  Save,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { VehicleDiagramViewer } from './VehicleDiagramViewer';
import { SignaturePadModal } from './SignaturePadModal';
import { PrintableFormA } from './PrintableFormA';
import { PrintableFormB } from './PrintableFormB';
import { PrintableSaleDossier } from './PrintableSaleDossier';

interface SaleDossierDrawerProps {
  saleId: string | null;
  onClose: () => void;
  onOpenCustomerProfile?: (customerId: string) => void;
}

type DossierTab = 'overview' | 'formA' | 'formB' | 'payments' | 'attachments' | 'timeline';

export const SaleDossierDrawer: React.FC<SaleDossierDrawerProps> = ({
  saleId,
  onClose,
  onOpenCustomerProfile,
}) => {
  const { saleDossiers, updateSaleDossier, showToast } = useAccounting();

  const dossier = saleDossiers.find((s) => s.id === saleId);
  const [activeTab, setActiveTab] = useState<DossierTab>('overview');

  // Printable overlays
  const [isPrintFormAOpen, setIsPrintFormAOpen] = useState(false);
  const [isPrintFormBOpen, setIsPrintFormBOpen] = useState(false);
  const [isPrintFullDossierOpen, setIsPrintFullDossierOpen] = useState(false);

  // Digital Signature modal
  const [signatureModalSigner, setSignatureModalSigner] = useState<'deliverer' | 'receiver' | null>(null);

  // New custom checklist items
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newEquipmentTitle, setNewEquipmentTitle] = useState('');

  if (!dossier) return null;

  const handleUpdateFormA = (newFormA: DeliveryFormA) => {
    const updated: SaleDossier = {
      ...dossier,
      deliveryFormA: newFormA,
    };
    updateSaleDossier(updated);
  };

  const handleUpdateFormB = (newFormB: DeliveryFormB) => {
    const updated: SaleDossier = {
      ...dossier,
      deliveryFormB: newFormB,
    };
    updateSaleDossier(updated);
  };

  // Add custom item to Form A checklist
  const handleAddCustomDoc = () => {
    if (!newDocTitle.trim()) return;
    const newItem: DeliveryDocumentItem = {
      id: `custom-doc-${Date.now()}`,
      title: newDocTitle.trim(),
      status: 'delivered',
      count: 1,
      notes: '',
    };
    handleUpdateFormA({
      ...dossier.deliveryFormA,
      checklist: [...dossier.deliveryFormA.checklist, newItem],
    });
    setNewDocTitle('');
    showToast('مدرک جدید به چک‌لیست فرم الف افزوده شد.', 'success');
  };

  // Add custom equipment item to Form B checklist
  const handleAddCustomEquipment = () => {
    if (!newEquipmentTitle.trim()) return;
    const newItem: EquipmentChecklistItem = {
      id: `custom-eq-${Date.now()}`,
      title: newEquipmentTitle.trim(),
      status: 'present',
      notes: '',
    };
    handleUpdateFormB({
      ...dossier.deliveryFormB,
      equipmentChecklist: [...dossier.deliveryFormB.equipmentChecklist, newItem],
    });
    setNewEquipmentTitle('');
    showToast('تجهیز جدید به چک‌لیست اقلام خودرو افزوده شد.', 'success');
  };

  // Save Signature
  const handleSaveSignature = (dataUrl: string) => {
    if (signatureModalSigner === 'deliverer') {
      handleUpdateFormB({
        ...dossier.deliveryFormB,
        delivererSignature: {
          ...dossier.deliveryFormB.delivererSignature,
          signatureImage: dataUrl,
          signedAt: `${dossier.deliveryDate} ${dossier.deliveryTime || ''}`,
        },
      });
      showToast('امضای تحویل‌دهنده ثبت شد.', 'success');
    } else if (signatureModalSigner === 'receiver') {
      handleUpdateFormB({
        ...dossier.deliveryFormB,
        receiverSignature: {
          ...dossier.deliveryFormB.receiverSignature,
          signatureImage: dataUrl,
          signedAt: `${dossier.deliveryDate} ${dossier.deliveryTime || ''}`,
        },
      });
      showToast('امضای تحویل‌گیرنده ثبت شد.', 'success');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs flex justify-end animate-in fade-in"
        dir="rtl"
      >
        <div className="bg-[#141519] border-r border-[#272930] w-full max-w-3xl h-full shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in slide-in-from-left duration-200">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-[#171920] border-b border-[#252830] flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                    پرونده فروش و تحویل خودرو
                  </h2>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {dossier.saleNumber}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      dossier.status === 'delivered'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {dossier.status === 'delivered' ? 'تحویل نهایی شده ✓' : 'در انتظار تحویل'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-200 font-medium">{dossier.vehicleFullName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>خریدار: </span>
                    <button
                      type="button"
                      onClick={() => onOpenCustomerProfile?.(dossier.customerId)}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      {dossier.customerName}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>تحویل: {toPersianDigits(dossier.deliveryDate)} {dossier.deliveryTime && `(${toPersianDigits(dossier.deliveryTime)})`}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintFullDossierOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#20222a] hover:bg-[#282b35] text-zinc-200 rounded-lg text-xs font-semibold border border-[#2e313c] transition-colors cursor-pointer"
                title="چاپ کل پرونده فروش"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>چاپ پرونده</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#20222a] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Print & Action Banner */}
          <div className="px-4 py-2 bg-[#121316] border-b border-[#21232a] flex items-center justify-between text-xs overflow-x-auto gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintFormAOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                <Printer className="w-3 h-3" />
                <span>چاپ فرم الف (تحویل مدارک)</span>
              </button>

              <button
                onClick={() => setIsPrintFormBOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                <Printer className="w-3 h-3" />
                <span>چاپ فرم ب (تحویل خودرو)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-zinc-400 text-[11px]">
              <span>مبلغ: <strong className="text-amber-400">{formatToman(dossier.salePrice)}</strong></span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 px-4 border-b border-[#21232a] bg-[#141519] overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'overview'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>خلاصه پرونده</span>
            </button>

            <button
              onClick={() => setActiveTab('formA')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'formA'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>فرم الف — تحویل مدارک</span>
            </button>

            <button
              onClick={() => setActiveTab('formB')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'formB'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>فرم ب — تحویل خودرو و دیاگرام</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'payments'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>پرداخت‌ها و اقساط</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'timeline'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>سوابق و زمان‌بندی</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* 2-Column Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Card */}
                  <div className="p-3.5 bg-[#17181f] border border-[#272932] rounded-xl text-xs space-y-2">
                    <div className="font-bold text-zinc-200 border-b border-[#252730] pb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" />
                        <span>اطلاعات خریدار (پرونده مشتری)</span>
                      </span>
                      <button
                        onClick={() => onOpenCustomerProfile?.(dossier.customerId)}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        مشاهده پرونده کامل
                      </button>
                    </div>

                    <div className="space-y-1 text-zinc-300">
                      <div>نام و نام خانوادگی: <strong className="text-zinc-100">{dossier.customerName}</strong></div>
                      <div>کد ملی: <span className="font-mono">{toPersianDigits(dossier.deliveryFormA.receiverNationalId || '—')}</span></div>
                      <div>شماره تماس: <span className="font-mono">{toPersianDigits(dossier.deliveryFormA.receiverPhone || '—')}</span></div>
                      <div>آدرس: <span className="text-zinc-400">{dossier.deliveryFormA.receiverAddress || 'تهران'}</span></div>
                    </div>
                  </div>

                  {/* Vehicle Card */}
                  <div className="p-3.5 bg-[#17181f] border border-[#272932] rounded-xl text-xs space-y-2">
                    <div className="font-bold text-zinc-200 border-b border-[#252730] pb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-sky-400" />
                        <span>مشخصات خودروی فروخته‌شده</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">کد: {dossier.vehicleId}</span>
                    </div>

                    <div className="space-y-1 text-zinc-300">
                      <div>عنوان خودرو: <strong className="text-zinc-100">{dossier.vehicleFullName}</strong></div>
                      <div>پلاک: <strong className="text-amber-400 font-mono">{toPersianDigits(dossier.deliveryFormB.plateNumber || '—')}</strong></div>
                      <div>شماره شاسی: <span className="font-mono text-[11px] text-zinc-300">{dossier.deliveryFormB.chassisNumber || '—'}</span></div>
                      <div>کارکرد تحویل: <span className="font-mono">{toPersianDigits(dossier.deliveryFormB.mileageAtDelivery?.toLocaleString() || '۰')} کیلومتر</span></div>
                    </div>
                  </div>
                </div>

                {/* Deal Financials Overview */}
                <div className="p-4 bg-[#17181f] border border-[#272932] rounded-xl text-xs">
                  <h3 className="font-bold text-zinc-200 border-b border-[#252730] pb-2 mb-3 flex items-center justify-between">
                    <span>مبالغ و شرایط معامله</span>
                    <span className="text-zinc-400 font-normal">شماره قرارداد: {dossier.contractNumber}</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#22242c]">
                      <span className="text-[10px] text-zinc-500 block">مبلغ کل معامله</span>
                      <span className="font-bold text-sm text-zinc-100 font-mono">{formatToman(dossier.salePrice)}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#22242c]">
                      <span className="text-[10px] text-zinc-500 block">پیش‌پرداخت نقد</span>
                      <span className="font-bold text-sm text-emerald-400 font-mono">{formatToman(dossier.downPayment)}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#22242c]">
                      <span className="text-[10px] text-zinc-500 block">مانده بدهی</span>
                      <span className={`font-bold text-sm font-mono ${dossier.remainingBalance === 0 ? 'text-zinc-400' : 'text-amber-400'}`}>
                        {dossier.remainingBalance === 0 ? 'تسویه شد ✓' : formatToman(dossier.remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Status of Forms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#16171d] border border-[#262832] rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-amber-400">وضعیت فرم الف (تحویل مدارک)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-2">
                      {toPersianDigits(dossier.deliveryFormA.checklist.filter(c => c.status === 'delivered').length)} مورد مدرک از {toPersianDigits(dossier.deliveryFormA.checklist.length)} مورد تحویل داده شده است.
                    </p>
                    <button
                      onClick={() => setActiveTab('formA')}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      ویرایش و بررسی چک‌لیست مدارک ←
                    </button>
                  </div>

                  <div className="p-3 bg-[#16171d] border border-[#262832] rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sky-400">وضعیت فرم ب (تحویل فیزیکی خودرو)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-2">
                      {toPersianDigits(dossier.deliveryFormB.equipmentChecklist.filter(e => e.status === 'present').length)} مورد تجهیز فابریک تایید شده و دیاگرام با {toPersianDigits(dossier.deliveryFormB.diagramMarkers.length)} مورد ثبت است.
                    </p>
                    <button
                      onClick={() => setActiveTab('formB')}
                      className="text-xs text-sky-400 hover:underline font-semibold"
                    >
                      مشاهده دیاگرام بدنه و امضاها ←
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FORM A (DELIVERY DOCUMENTS) */}
            {activeTab === 'formA' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#171920] border border-[#282a34] rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100">فرم تحویل مدرکی (فرم الف)</h3>
                    <p className="text-[11px] text-zinc-400">بررسی، ویرایش و ثبت تعداد و وضعیت تحویل هر مدرک</p>
                  </div>
                  <button
                    onClick={() => setIsPrintFormAOpen(true)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>نسخه چاپی رسمی</span>
                  </button>
                </div>

                {/* Receiver Info Bar */}
                <div className="p-3 bg-[#16171c] border border-[#262830] rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">گیرنده مدارک:</span>
                    <span className="font-bold text-zinc-200">{dossier.deliveryFormA.receiverName || dossier.customerName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">شرکت بیمه و تاریخ اعتبار:</span>
                    <span className="font-medium text-zinc-200">
                      {dossier.deliveryFormA.insuranceCompany || 'بیمه ایران'} ({toPersianDigits(dossier.deliveryFormA.insuranceExpiryDate || '۱ سال')})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">شماره پلاک:</span>
                    <span className="font-bold text-zinc-200 font-mono">{toPersianDigits(dossier.deliveryFormA.plateNumber || '—')}</span>
                  </div>
                </div>

                {/* Checklist Items Table */}
                <div className="bg-[#16171c] border border-[#262830] rounded-xl overflow-hidden text-xs">
                  <div className="p-3 bg-[#121316] border-b border-[#23252b] flex items-center justify-between font-bold text-zinc-300">
                    <span>چک‌لیست اسناد و مدارک خودرو:</span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {toPersianDigits(dossier.deliveryFormA.checklist.length)} مورد
                    </span>
                  </div>

                  <div className="divide-y divide-[#22242c]">
                    {dossier.deliveryFormA.checklist.map((item, idx) => (
                      <div key={item.id} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#1a1c22]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-zinc-500 text-[11px] w-5 text-center">{toPersianDigits(idx + 1)}.</span>
                          <span className="font-medium text-zinc-200">{item.title}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Count input */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500">تعداد:</span>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={item.count}
                              onChange={(e) => {
                                const newCount = parseInt(e.target.value) || 1;
                                const updatedList = dossier.deliveryFormA.checklist.map((c) =>
                                  c.id === item.id ? { ...c, count: newCount } : c
                                );
                                handleUpdateFormA({ ...dossier.deliveryFormA, checklist: updatedList });
                              }}
                              className="w-12 bg-[#121316] border border-[#2b2d35] rounded px-1.5 py-0.5 text-center font-mono text-zinc-200 text-xs"
                            />
                          </div>

                          {/* Status dropdown */}
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as any;
                              const updatedList = dossier.deliveryFormA.checklist.map((c) =>
                                c.id === item.id ? { ...c, status: newStatus } : c
                              );
                              handleUpdateFormA({ ...dossier.deliveryFormA, checklist: updatedList });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-bold border ${
                              item.status === 'delivered'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : item.status === 'none'
                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            <option value="delivered">تحویل شد ✓</option>
                            <option value="not_delivered">تحویل نشد</option>
                            <option value="none">ندارد</option>
                            <option value="needs_review">نیازمند بررسی</option>
                          </select>

                          {/* Notes input */}
                          <input
                            type="text"
                            placeholder="توضیح..."
                            value={item.notes || ''}
                            onChange={(e) => {
                              const newNotes = e.target.value;
                              const updatedList = dossier.deliveryFormA.checklist.map((c) =>
                                c.id === item.id ? { ...c, notes: newNotes } : c
                              );
                              handleUpdateFormA({ ...dossier.deliveryFormA, checklist: updatedList });
                            }}
                            className="bg-[#121316] border border-[#2b2d35] rounded px-2 py-0.5 text-[11px] text-zinc-300 w-32 sm:w-44 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Document Input */}
                  <div className="p-3 bg-[#131417] border-t border-[#23252b] flex items-center gap-2">
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="+ افزودن مدرک یا سند سفارشی به این پرونده..."
                      className="flex-1 bg-[#16171b] border border-[#2b2d36] focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDoc}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      افزودن
                    </button>
                  </div>
                </div>

                {/* Form A General Notes */}
                <div className="p-3 bg-[#16171c] border border-[#262830] rounded-xl text-xs space-y-1.5">
                  <label className="font-bold text-zinc-300 block">یادداشت‌های کلی تحویل مدارک:</label>
                  <textarea
                    rows={2}
                    value={dossier.deliveryFormA.generalNotes || ''}
                    onChange={(e) => {
                      handleUpdateFormA({ ...dossier.deliveryFormA, generalNotes: e.target.value });
                    }}
                    placeholder="توضیحات تکمیلی یا شروط تحویل مدارک..."
                    className="w-full bg-[#121316] border border-[#292c36] focus:border-amber-500 rounded-lg p-2 text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: FORM B (VEHICLE DELIVERY, EQUIPMENT & DIAGRAM) */}
            {activeTab === 'formB' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#171920] border border-[#282a34] rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100">فرم تحویل خودرو و بازرسی فیزیکی (فرم ب)</h3>
                    <p className="text-[11px] text-zinc-400">بررسی اقلام فابریک، دیاگرام بازرسی ۵ جهته، تصاویر و امضاها</p>
                  </div>
                  <button
                    onClick={() => setIsPrintFormBOpen(true)}
                    className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>نسخه چاپی رسمی</span>
                  </button>
                </div>

                {/* Vehicle Delivery Specs Form */}
                <div className="p-3.5 bg-[#16171c] border border-[#262830] rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">کارکرد تحویل (km):</label>
                    <input
                      type="number"
                      value={dossier.deliveryFormB.mileageAtDelivery}
                      onChange={(e) => {
                        handleUpdateFormB({
                          ...dossier.deliveryFormB,
                          mileageAtDelivery: parseInt(e.target.value) || 0,
                        });
                      }}
                      className="w-full bg-[#121316] border border-[#292c36] rounded px-2 py-1 font-mono text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">میزان سوخت:</label>
                    <select
                      value={dossier.deliveryFormB.fuelLevel || 'full'}
                      onChange={(e) => {
                        handleUpdateFormB({
                          ...dossier.deliveryFormB,
                          fuelLevel: e.target.value as any,
                        });
                      }}
                      className="w-full bg-[#121316] border border-[#292c36] rounded px-2 py-1 text-zinc-100 text-xs"
                    >
                      <option value="full">باک پر (Full)</option>
                      <option value="3/4">۳/۴ باک</option>
                      <option value="1/2">۱/۲ باک</option>
                      <option value="1/4">۱/۴ باک</option>
                      <option value="reserve">باک رزرو</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">تاریخ تحویل:</label>
                    <input
                      type="text"
                      value={dossier.deliveryFormB.deliveryDate}
                      onChange={(e) => {
                        handleUpdateFormB({
                          ...dossier.deliveryFormB,
                          deliveryDate: e.target.value,
                        });
                      }}
                      className="w-full bg-[#121316] border border-[#292c36] rounded px-2 py-1 font-mono text-zinc-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">ساعت تحویل:</label>
                    <input
                      type="text"
                      value={dossier.deliveryFormB.deliveryTime}
                      onChange={(e) => {
                        handleUpdateFormB({
                          ...dossier.deliveryFormB,
                          deliveryTime: e.target.value,
                        });
                      }}
                      className="w-full bg-[#121316] border border-[#292c36] rounded px-2 py-1 font-mono text-zinc-100 text-xs"
                    />
                  </div>
                </div>

                {/* Section A: Interactive Vehicle Diagram */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>دیاگرام بازرسی بدنه و ثبت خط و خش (Handover Diagram)</span>
                    </span>
                  </div>

                  <VehicleDiagramViewer
                    markers={dossier.deliveryFormB.diagramMarkers}
                    onMarkersChange={(newMarkers) => {
                      handleUpdateFormB({
                        ...dossier.deliveryFormB,
                        diagramMarkers: newMarkers,
                      });
                    }}
                  />
                </div>

                {/* Section B: Equipment Checklist */}
                <div className="bg-[#16171c] border border-[#262830] rounded-xl overflow-hidden text-xs">
                  <div className="p-3 bg-[#121316] border-b border-[#23252b] flex items-center justify-between font-bold text-zinc-300">
                    <span>چک‌لیست اقلام و متعلقات خودرو (۲۰ قلم فابریک):</span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {toPersianDigits(dossier.deliveryFormB.equipmentChecklist.length)} قلم
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#22242c]">
                    {dossier.deliveryFormB.equipmentChecklist.map((item, idx) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-[#1a1c22] border-b border-[#22242c]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-zinc-500 text-[10px] w-4">{toPersianDigits(idx + 1)}.</span>
                          <span className="font-medium text-zinc-200 truncate">{item.title}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as any;
                              const updatedList = dossier.deliveryFormB.equipmentChecklist.map((eq) =>
                                eq.id === item.id ? { ...eq, status: newStatus } : eq
                              );
                              handleUpdateFormB({ ...dossier.deliveryFormB, equipmentChecklist: updatedList });
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.status === 'present'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : item.status === 'missing'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <option value="present">موجود ✓</option>
                            <option value="missing">ناموجود ✗</option>
                            <option value="not_delivered">تحویل نشد</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Equipment Input */}
                  <div className="p-3 bg-[#131417] border-t border-[#23252b] flex items-center gap-2">
                    <input
                      type="text"
                      value={newEquipmentTitle}
                      onChange={(e) => setNewEquipmentTitle(e.target.value)}
                      placeholder="+ افزودن تجهیز یا قلم سفارشی به این خودرو..."
                      className="flex-1 bg-[#16171b] border border-[#2b2d36] focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomEquipment}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      افزودن
                    </button>
                  </div>
                </div>

                {/* Section C: Dual Digital Signatures */}
                <div className="p-4 bg-[#16171c] border border-[#262830] rounded-xl text-xs space-y-3">
                  <div className="font-bold text-zinc-200 border-b border-[#252830] pb-2 flex items-center justify-between">
                    <span>ثبت و اخذ امضای دیجیتال طرفین معامله:</span>
                    <span className="text-[10px] text-zinc-500">مبتنی بر استانداردهای حقوقی تحویل</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Deliverer Signature Box */}
                    <div className="p-3 bg-[#121316] border border-[#252830] rounded-lg flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-400">تحویل‌دهنده (اتو عبداللهی)</span>
                          {dossier.deliveryFormB.delivererSignature.signatureImage && (
                            <span className="text-[10px] text-emerald-400 font-bold">امضا شده ✓</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          <div>نام: {dossier.deliveryFormB.delivererSignature.name || 'کارشناس رسمی'}</div>
                          <div>سمت: {dossier.deliveryFormB.delivererSignature.roleOrCompany || 'کارشناس فنی و تحویل'}</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#23252c] flex items-center justify-between">
                        {dossier.deliveryFormB.delivererSignature.signatureImage ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={dossier.deliveryFormB.delivererSignature.signatureImage}
                              alt="امضا"
                              className="h-9 bg-white px-2 py-0.5 rounded object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setSignatureModalSigner('deliverer')}
                              className="text-[10px] text-zinc-400 hover:text-white"
                            >
                              تغییر امضا
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSignatureModalSigner('deliverer')}
                            className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold text-xs flex items-center justify-center gap-1.5"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>ثبت امضای تحویل‌دهنده</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Receiver Signature Box */}
                    <div className="p-3 bg-[#121316] border border-[#252830] rounded-lg flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sky-400">تحویل‌گیرنده (خریدار)</span>
                          {dossier.deliveryFormB.receiverSignature.signatureImage && (
                            <span className="text-[10px] text-emerald-400 font-bold">امضا شده ✓</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          <div>نام: {dossier.customerName}</div>
                          <div>کد ملی: {toPersianDigits(dossier.deliveryFormA.receiverNationalId || '—')}</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#23252c] flex items-center justify-between">
                        {dossier.deliveryFormB.receiverSignature.signatureImage ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={dossier.deliveryFormB.receiverSignature.signatureImage}
                              alt="امضا"
                              className="h-9 bg-white px-2 py-0.5 rounded object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setSignatureModalSigner('receiver')}
                              className="text-[10px] text-zinc-400 hover:text-white"
                            >
                              تغییر امضا
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSignatureModalSigner('receiver')}
                            className="w-full py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-semibold text-xs flex items-center justify-center gap-1.5"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>ثبت امضای خریدار</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Notes */}
                <div className="p-3 bg-[#16171c] border border-[#262830] rounded-xl text-xs space-y-1.5">
                  <label className="font-bold text-zinc-300 block">توضیحات و یادداشت تحویل خودرو:</label>
                  <textarea
                    rows={2}
                    value={dossier.deliveryFormB.deliveryNotes || ''}
                    onChange={(e) => {
                      handleUpdateFormB({ ...dossier.deliveryFormB, deliveryNotes: e.target.value });
                    }}
                    placeholder="وضعیت روشویی، نظافت، سوخت، اقلام تحویلی دیگر..."
                    className="w-full bg-[#121316] border border-[#292c36] focus:border-amber-500 rounded-lg p-2 text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENTS & INSTALLMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#171920] border border-[#282a34] rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100">پرداخت‌ها، چک‌ها و تسویه‌حساب معامله</h3>
                    <p className="text-[11px] text-zinc-400">ثبت وضعیت وصولی چک‌ها و اقساط این خودرو</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {dossier.payments.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 bg-[#16171c] border border-[#262830] rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{p.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {p.type === 'check' ? 'چک صیادی' : p.type === 'cash' ? 'نقدی' : 'حواله'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 space-x-2 space-x-reverse">
                          <span>سررسید: {toPersianDigits(p.dueDate)}</span>
                          {p.trackingNumber && <span>کد پیگیری: {p.trackingNumber}</span>}
                          {p.checkNumber && <span>شماره چک: {p.checkNumber}</span>}
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="font-bold text-sm text-zinc-100 font-mono block">
                          {formatToman(p.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            p.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {p.status === 'paid' ? 'وصول شد ✓' : 'در انتظار سررسید'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="p-4 bg-[#16171c] border border-[#262830] rounded-xl text-xs space-y-3">
                <div className="font-bold text-zinc-200 border-b border-[#242630] pb-2">
                  رویدادهای ثبت‌شده در پرونده فروش {dossier.saleNumber}:
                </div>

                <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:right-2.5 before:w-0.5 before:bg-[#2e313c]">
                  {dossier.timeline.map((tl) => (
                    <div key={tl.id} className="relative pr-6">
                      <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-[#16171c]" />
                      <div className="text-zinc-500 font-mono text-[10px]">{toPersianDigits(tl.timestamp || tl.date)}</div>
                      <div className="font-bold text-zinc-200">{tl.title}</div>
                      <p className="text-[11px] text-zinc-400">{tl.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {signatureModalSigner && (
        <SignaturePadModal
          isOpen={true}
          onClose={() => setSignatureModalSigner(null)}
          title={signatureModalSigner === 'deliverer' ? 'امضای تحویل‌دهنده' : 'امضای تحویل‌گیرنده (خریدار)'}
          signerName={signatureModalSigner === 'deliverer' ? dossier.deliveryFormB.delivererSignature.name : dossier.customerName}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* Print Overlays */}
      {isPrintFormAOpen && (
        <PrintableFormA
          dossier={dossier}
          onClose={() => setIsPrintFormAOpen(false)}
        />
      )}

      {isPrintFormBOpen && (
        <PrintableFormB
          dossier={dossier}
          onClose={() => setIsPrintFormBOpen(false)}
        />
      )}

      {isPrintFullDossierOpen && (
        <PrintableSaleDossier
          dossier={dossier}
          onClose={() => setIsPrintFullDossierOpen(false)}
        />
      )}
    </>
  );
};
