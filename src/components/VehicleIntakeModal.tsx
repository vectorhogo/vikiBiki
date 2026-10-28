import React, { useState } from 'react';
import { Vehicle } from '../types/accounting';
import { OwnershipType, CommissionType, ConsignmentAgreement } from '../types/consignment';
import { Customer } from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits, formatToman, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  X,
  Car,
  User,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Percent,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface VehicleIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleCreated: (vehicle: Vehicle, consignmentAgreement?: ConsignmentAgreement) => void;
}

export const VehicleIntakeModal: React.FC<VehicleIntakeModalProps> = ({
  isOpen,
  onClose,
  onVehicleCreated,
}) => {
  const { customers, addCustomer, showToast } = useAccounting();

  // Step 1: Ownership Type Choice
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('owned');

  // Common Vehicle Fields
  const [brand, setBrand] = useState('تویوتا');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2024');
  const [color, setColor] = useState('سفید صدفی');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');

  // Owned Vehicle Purchase Info
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');

  // Consignment Vehicle Info
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('new');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerNationalId, setOwnerNationalId] = useState('');

  // Consignment Agreement Info
  const [contractNumber, setContractNumber] = useState(
    `CON-1405-00${Math.floor(Math.random() * 90 + 10)}`
  );
  const [startDate, setStartDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [endDate, setEndDate] = useState('۱۴۰۵/۰۸/۳۰');
  const [commissionType, setCommissionType] = useState<CommissionType>('percentage');
  const [commissionValue, setCommissionValue] = useState('2.5'); // 2.5% or fixed amount
  const [agreedMinPrice, setAgreedMinPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId !== 'new') {
      const found = customers.find((c) => c.id === custId);
      if (found) {
        setOwnerName(found.fullName);
        setOwnerPhone(found.phone);
        setOwnerNationalId(found.nationalId || '');
      }
    } else {
      setOwnerName('');
      setOwnerPhone('');
      setOwnerNationalId('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!model.trim()) {
      showToast('لطفاً مدل یا تیپ خودرو را وارد نمایید.', 'error');
      return;
    }

    const fullName = `${brand} ${model} ${year}`.trim();
    const cleanPlate = plate.trim() || '—';
    const cleanVin = vin.trim() || `VIN-${Date.now().toString().slice(-6)}`;
    const newVehId = `veh-${Date.now()}`;

    // Handle Owner for Consignment
    let finalOwnerId = selectedCustomerId;
    let agreement: ConsignmentAgreement | undefined = undefined;

    if (ownershipType === 'consignment') {
      if (!ownerName.trim()) {
        showToast('لطفاً نام مالک خودروی امانی را مشخص نمایید.', 'error');
        return;
      }

      if (selectedCustomerId === 'new') {
        const newCustId = `cust-${Date.now()}`;
        const newCust: Customer = {
          id: newCustId,
          fileNumber: `C-1405-00${customers.length + 10}`,
          fullName: ownerName.trim(),
          phone: ownerPhone.trim() || 'ثبت نشده',
          nationalId: ownerNationalId.trim(),
          address: 'تهران',
          tags: ['مالک امانی'],
          status: 'active',
          createdAt: DEALERSHIP_CURRENT_DATE,
        };
        addCustomer(newCust);
        finalOwnerId = newCustId;
      }

      const parsedCommission = parseFloat(commissionValue) || 0;
      const parsedMinPrice = parseInt(agreedMinPrice.replace(/[^\d]/g, ''), 10) || 0;
      const parsedAskingPrice = parseInt(askingPrice.replace(/[^\d]/g, ''), 10) || 0;

      agreement = {
        id: `con-${Date.now()}`,
        contractNumber: contractNumber.trim() || `CON-1405-${Date.now().toString().slice(-4)}`,
        vehicleId: newVehId,
        vehicleFullName: fullName,
        ownerPersonId: finalOwnerId,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerNationalId: ownerNationalId.trim(),
        deliveryToDealershipDate: startDate,
        startDate,
        endDate,
        commissionType,
        commissionValue: parsedCommission,
        agreedMinPrice: parsedMinPrice > 0 ? parsedMinPrice : undefined,
        askingPrice: parsedAskingPrice > 0 ? parsedAskingPrice : undefined,
        notes: notes.trim() || undefined,
        status: 'active',
        createdAt: DEALERSHIP_CURRENT_DATE,
      };
    }

    const newVehicle: Vehicle = {
      id: newVehId,
      localVehicleId: newVehId,
      brand,
      model: model.trim(),
      fullName,
      plate: cleanPlate,
      vin: cleanVin,
      color: color.trim(),
      year: parseInt(year, 10) || 1404,
      inspectionStatus: 'pending_inspection',
      status: 'active',
      createdAt: DEALERSHIP_CURRENT_DATE,
      ownershipType,
      purchasePrice:
        ownershipType === 'owned'
          ? parseInt(purchasePrice.replace(/[^\d]/g, ''), 10) || 0
          : undefined,
      purchaseDate: ownershipType === 'owned' ? purchaseDate : undefined,
      sellerName: ownershipType === 'owned' ? sellerName.trim() : undefined,
      sellerPhone: ownershipType === 'owned' ? sellerPhone.trim() : undefined,
      consignmentAgreementId: agreement?.id,
      ownerPersonId: ownershipType === 'consignment' ? finalOwnerId : undefined,
      ownerName: ownershipType === 'consignment' ? ownerName.trim() : undefined,
      ownerPhone: ownershipType === 'consignment' ? ownerPhone.trim() : undefined,
      ownerNationalId: ownershipType === 'consignment' ? ownerNationalId.trim() : undefined,
      consignmentStatus: ownershipType === 'consignment' ? 'in_showroom' : undefined,
    };

    onVehicleCreated(newVehicle, agreement);
    showToast(
      ownershipType === 'consignment'
        ? `خودروی امانی «${fullName}» با موفقیت ثبت شد.`
        : `خودروی نمایشگاه «${fullName}» با موفقیت به انبار افزوده شد.`,
      'success'
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-[#14151b] border border-[#2b2e3c] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 bg-[#111216] border-b border-[#252834] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">ورود خودرو به نمایشگاه (Vehicle Intake)</h3>
              <p className="text-xs text-zinc-400">
                تفکیک دقیق فرآیند ورود: خرید قطعی نمایشگاه در برابر پذیرش خودروی امانی
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
          {/* STEP 1: Ownership Selection Banner */}
          <div className="p-3.5 bg-[#171822] border border-[#282b3a] rounded-2xl space-y-2">
            <span className="text-xs font-bold text-zinc-200 block">
              این خودرو متعلق به کیست؟ (نوع مالکیت):
            </span>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex flex-col items-start gap-1.5 cursor-pointer transition-all ${
                  ownershipType === 'owned'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-[#121317] border-[#292c3a] text-zinc-400 hover:bg-[#1a1c24]'
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="font-bold text-sm text-zinc-100">مالکیت نمایشگاه (خرید قطعی)</span>
                  <input
                    type="radio"
                    name="ownershipType"
                    checked={ownershipType === 'owned'}
                    onChange={() => setOwnershipType('owned')}
                    className="accent-amber-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  خودرو توسط نمایشگاه خریداری شده، بهای تمام‌شده و سود/زیان معامله محاسبه می‌شود.
                </p>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex flex-col items-start gap-1.5 cursor-pointer transition-all ${
                  ownershipType === 'consignment'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-[#121317] border-[#292c3a] text-zinc-400 hover:bg-[#1a1c24]'
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="font-bold text-sm text-zinc-100">خودروی امانی (مالک دیگر)</span>
                  <input
                    type="radio"
                    name="ownershipType"
                    checked={ownershipType === 'consignment'}
                    onChange={() => setOwnershipType('consignment')}
                    className="accent-purple-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  خودرو به امانت سپرده شده و پس از فروش، کمیسیون نمایشگاه و تسویه مالک جداگانه محاسبه می‌شود.
                </p>
              </label>
            </div>
          </div>

          {/* Vehicle General Info Card */}
          <div className="p-4 bg-[#131418] border border-[#252834] rounded-2xl space-y-3">
            <span className="font-bold text-zinc-200 text-xs sm:text-sm block">
              مشخصات عمومی خودرو:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">برند / کارخانه:</span>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                >
                  {[
                    'تویوتا',
                    'ب‌ام‌و',
                    'لکسوس',
                    'مرسدس بنز',
                    'هیوندای',
                    'کیا',
                    'پورشه',
                    'نیسان',
                    'فولکس‌واگن',
                    'اکستریم',
                    'هاوال',
                    'وویا',
                    'سوزوکی',
                    'فونیکس',
                    'سایر',
                  ].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">مدل و تیپ خودرو:</span>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="مثال: کمری گرند، 530i، سوناتا..."
                  className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">سال تولید / مدل:</span>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="مثال: 2024 یا 1403"
                  className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">رنگ بدنه:</span>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="مثال: مشکی آبنوسی، سفید صدفی..."
                  className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">شماره پلاک انتظامی:</span>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="مثال: ۶۷الف۱۲۳ - ۲۱"
                  className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">شماره شاسی (VIN):</span>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="۱۷ رقم شاسی..."
                  className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC SECTION A: Owned Vehicle Purchase Details */}
          {ownershipType === 'owned' && (
            <div className="p-4 bg-[#131418] border border-amber-500/30 rounded-2xl space-y-3">
              <span className="font-bold text-amber-300 text-xs sm:text-sm block">
                اطلاعات خرید خودروی نمایشگاه:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">قیمت خرید (تومان):</span>
                  <input
                    type="text"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="مثال: ۳,۵۰۰,۰۰۰,۰۰۰"
                    className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 font-mono text-amber-300 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  {purchasePrice && (
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      {formatToman(parseInt(purchasePrice.replace(/[^\d]/g, ''), 10) || 0)}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">تاریخ خرید:</span>
                  <input
                    type="text"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">فروشنده / تامین‌کننده:</span>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="نام شخص یا شرکت فروشنده..."
                    className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">شماره تماس فروشنده:</span>
                  <input
                    type="text"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="۰۹۱۲..."
                    className="w-full bg-[#181920] border border-[#2c2f3d] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC SECTION B: Consignment Agreement & Owner Details */}
          {ownershipType === 'consignment' && (
            <div className="p-4 bg-[#15141d] border border-purple-500/30 rounded-2xl space-y-3">
              <span className="font-bold text-purple-300 text-xs sm:text-sm block">
                مشخصات مالک و قرارداد امانی:
              </span>

              {/* Owner Selection / Creation */}
              <div className="space-y-2 pb-3 border-b border-[#252233]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[10px]">مالک خودرو (شخص):</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="bg-[#1f1d2c] border border-[#37324c] rounded-lg px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value="new">+ ثبت مالک جدید</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} — {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-zinc-500 text-[10px] block mb-0.5">نام و نام خانوادگی:</span>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="نام مالک خودرو..."
                      className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                      required={ownershipType === 'consignment'}
                    />
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] block mb-0.5">شماره موبایل:</span>
                    <input
                      type="text"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="۰۹۱۲..."
                      className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-1.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] block mb-0.5">کد ملی:</span>
                    <input
                      type="text"
                      value={ownerNationalId}
                      onChange={(e) => setOwnerNationalId(e.target.value)}
                      placeholder="۱۰ رقم کد ملی..."
                      className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-1.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Consignment Terms */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">شماره قرارداد امانی:</span>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">نوع کمیسیون نمایشگاه:</span>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                    className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value="percentage">درصدی (از قیمت فروش)</option>
                    <option value="fixed">مبلغ ثابت و مقطوع (تومان)</option>
                    <option value="net_price">قیمت توافقی خالص مالک</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">
                    {commissionType === 'percentage'
                      ? 'درصد کمیسیون (مثلاً ۲.۵):'
                      : 'مبلغ کمیسیون (تومان):'}
                  </span>
                  <input
                    type="text"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    placeholder={commissionType === 'percentage' ? '2.5' : '۵۰,۰۰۰,۰۰۰'}
                    className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-2 font-mono text-purple-300 font-bold text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">حداقل قیمت توافقی (تومان):</span>
                  <input
                    type="text"
                    value={agreedMinPrice}
                    onChange={(e) => setAgreedMinPrice(e.target.value)}
                    placeholder="حداقل قیمت مورد رضایت مالک"
                    className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">قیمت پیشنهادی فروش (تومان):</span>
                  <input
                    type="text"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                    placeholder="قیمت در برگه قیمت‌گذاری"
                    className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] block mb-1">تاریخ شروع و تحویل:</span>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#191824] border border-[#302c42] rounded-xl px-2.5 py-2 font-mono text-zinc-100 text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#252834]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>ثبت خودرو و ورود به انبار</span>
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
