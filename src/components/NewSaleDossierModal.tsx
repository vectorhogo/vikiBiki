import React, { useState } from 'react';
import {
  SaleDossier,
  Customer,
} from '../types/customerSales';
import { useAccounting } from '../context/AccountingContext';
import {
  X,
  Car,
  User,
  Plus,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Check,
  Search,
} from 'lucide-react';
import {
  DEALERSHIP_CURRENT_DATE,
  formatToman,
  toPersianDigits,
} from '../utils/formatters';
import {
  createDefaultFormAChecklist,
  createDefaultFormBEquipment,
} from '../data/initialCustomerSalesData';

interface NewSaleDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCustomerId?: string;
  preSelectedVehicleId?: string;
  onSaleCreated?: (sale: SaleDossier) => void;
}

export const NewSaleDossierModal: React.FC<NewSaleDossierModalProps> = ({
  isOpen,
  onClose,
  preSelectedCustomerId,
  preSelectedVehicleId,
  onSaleCreated,
}) => {
  const { customers, vehicles, saleDossiers, addSaleDossier, showToast } = useAccounting();

  // Customer Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preSelectedCustomerId || '');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Vehicle Selection
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(preSelectedVehicleId || '');
  const [customVehicleName, setCustomVehicleName] = useState('');
  const [customPlate, setCustomPlate] = useState('');
  const [customVin, setCustomVin] = useState('');

  // Deal Info
  const [contractNumber, setContractNumber] = useState(`CNT-1405-${(1050 + saleDossiers.length).toString()}`);
  const [saleDate, setSaleDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [deliveryDate, setDeliveryDate] = useState(DEALERSHIP_CURRENT_DATE);
  const [deliveryTime, setDeliveryTime] = useState('۱۷:۰۰');
  const [salePrice, setSalePrice] = useState<number>(3500000000);
  const [downPayment, setDownPayment] = useState<number>(2000000000);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'installments' | 'checks' | 'combination'>('combination');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Search filtered customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.phone.includes(customerSearchQuery) ||
      (c.nationalId && c.nationalId.includes(customerSearchQuery))
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('لطفاً خریدار (پرونده مشتری) را انتخاب کنید.', 'warning');
      return;
    }

    const vehicleFullName = selectedVehicle ? selectedVehicle.fullName : customVehicleName.trim();
    if (!vehicleFullName) {
      showToast('لطفاً خودروی مورد معامله را انتخاب کنید.', 'warning');
      return;
    }

    const plateNumber = selectedVehicle ? selectedVehicle.plate : customPlate.trim();
    const vinNumber = selectedVehicle ? selectedVehicle.vin : customVin.trim();

    const saleNumber = `S-1405-001${(saleDossiers.length + 1).toString().padStart(2, '0')}`;
    const remainingBalance = Math.max(0, salePrice - downPayment);

    const newDossier: SaleDossier = {
      id: `sale-${Date.now()}`,
      saleNumber,
      customerId: selectedCustomer!.id,
      customerName: selectedCustomer!.fullName,
      vehicleId: selectedVehicle?.id || `veh-custom-${Date.now()}`,
      vehicleFullName,
      contractNumber: contractNumber.trim() || `CNT-1405-${Date.now().toString().slice(-4)}`,
      saleDate: saleDate.trim(),
      deliveryDate: deliveryDate.trim(),
      deliveryTime: deliveryTime.trim(),
      salePrice,
      downPayment,
      remainingBalance,
      paymentMethod,
      payments: [
        {
          id: `pay-${Date.now()}-1`,
          title: 'پیش‌پرداخت اولیه قرارداد',
          amount: downPayment,
          type: 'transfer',
          dueDate: saleDate,
          paymentDate: saleDate,
          status: 'paid',
          trackingNumber: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: 'پرداخت نقدی قرارداد',
        },
        ...(remainingBalance > 0
          ? [
              {
                id: `pay-${Date.now()}-2`,
                title: 'مانده تسویه هنگام تحویل',
                amount: remainingBalance,
                type: 'check' as const,
                dueDate: deliveryDate,
                status: 'pending' as const,
                notes: 'چک صیادی روز تحویل',
              },
            ]
          : []),
      ],
      deliveryFormA: {
        receiverName: selectedCustomer!.fullName,
        receiverNationalId: selectedCustomer!.nationalId || '',
        receiverPhone: selectedCustomer!.phone,
        receiverAddress: selectedCustomer!.address,
        insuranceCompany: 'بیمه ایران',
        plateNumber,
        checklist: createDefaultFormAChecklist(),
        deliveredAtDate: deliveryDate,
        deliveredAtTime: deliveryTime,
        status: 'draft',
      },
      deliveryFormB: {
        vehicleName: vehicleFullName,
        modelYear: selectedVehicle?.year?.toString() || '۱۴۰۵',
        color: selectedVehicle?.color || 'سفید',
        mileageAtDelivery: 100,
        chassisNumber: vinNumber,
        plateNumber,
        deliveryDate,
        deliveryTime,
        fuelLevel: 'full',
        equipmentChecklist: createDefaultFormBEquipment(),
        diagramMarkers: [],
        photos: [],
        delivererSignature: {
          name: 'علی حسینی',
          phone: '۰۹۱۲-۳۳۳-۴۴۵۵',
          nationalId: '0054321987',
          roleOrCompany: 'کارشناس تحویل و فنی اتو عبداللهی',
          date: deliveryDate,
          time: deliveryTime,
        },
        receiverSignature: {
          name: selectedCustomer!.fullName,
          phone: selectedCustomer!.phone,
          nationalId: selectedCustomer!.nationalId || '',
          date: deliveryDate,
          time: deliveryTime,
        },
        deliveryNotes: notes.trim() || undefined,
        status: 'draft',
      },
      attachments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          title: 'تشکیل پرونده فروش و معامله',
          description: `قرارداد فروش ${vehicleFullName} با مبلغ ${formatToman(salePrice)} منعقد گردید.`,
          date: saleDate,
          timestamp: `${saleDate} ۱۰:۰۰`,
          type: 'deal_created',
        },
      ],
      notes: notes.trim() || undefined,
      status: 'pending_delivery',
      createdAt: DEALERSHIP_CURRENT_DATE,
    };

    addSaleDossier(newDossier);
    showToast(`پرونده فروش (${saleNumber}) با موفقیت ایجاد گردید.`, 'success');
    onSaleCreated?.(newDossier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto" dir="rtl">
      <div className="bg-[#17181d] border border-[#2c2f38] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#131417] border-b border-[#252830] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              افتتاح پرونده فروش و تحویل خودرو (New Vehicle Sale Dossier)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* STEP 1: Select Master Customer */}
          <div className="p-3.5 bg-[#131418] border border-[#262832] rounded-xl space-y-2">
            <label className="font-bold text-zinc-200 block text-xs flex items-center justify-between">
              <span>۱. انتخاب خریدار (پرونده مشتری مرجع) <span className="text-amber-400">*</span>:</span>
              <span className="text-[11px] text-zinc-400 font-normal">
                برای جلوگیری از تکرار، مشتری قبلی را انتخاب کنید
              </span>
            </label>

            {selectedCustomer ? (
              <div className="p-2.5 bg-[#1a1c22] border border-amber-500/40 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-zinc-100">{selectedCustomer.fullName}</span>
                  <span className="text-xs text-zinc-400 mr-2 font-mono">{selectedCustomer.phone}</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mr-2">
                    {selectedCustomer.fileNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('')}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  تغییر مشتری
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="جستجوی مشتری با نام یا تلفن (مثال: رضایی)..."
                    className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg pr-9 pl-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-[#22242c] border border-[#23252c] rounded-lg bg-[#15161a]">
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className="p-2 flex items-center justify-between hover:bg-[#1e2028] cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-zinc-200">{c.fullName}</span>
                        <span className="text-[11px] text-zinc-400 mr-2 font-mono">{toPersianDigits(c.phone)}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{c.fileNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Select Vehicle */}
          <div className="p-3.5 bg-[#131418] border border-[#262832] rounded-xl space-y-2">
            <label className="font-bold text-zinc-200 block text-xs">
              ۲. خودروی مورد معامله <span className="text-amber-400">*</span>:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- انتخاب از موجودی خودروهای نمایشگاه --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} (پلاک: {v.plate})
                  </option>
                ))}
              </select>

              {!selectedVehicleId && (
                <input
                  type="text"
                  value={customVehicleName}
                  onChange={(e) => setCustomVehicleName(e.target.value)}
                  placeholder="یا عنوان خودروی سفارشی (مثال: پورشه ماکان ۲۰۲۴)..."
                  className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            {!selectedVehicleId && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customPlate}
                  onChange={(e) => setCustomPlate(e.target.value)}
                  placeholder="شماره پلاک خودرو..."
                  className="bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs text-zinc-100"
                />
                <input
                  type="text"
                  value={customVin}
                  onChange={(e) => setCustomVin(e.target.value)}
                  placeholder="شماره شاسی (VIN)..."
                  className="bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs text-zinc-100 font-mono"
                />
              </div>
            )}
          </div>

          {/* STEP 3: Dates & Contract */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">شماره قرارداد / مبایعه‌نامه:</label>
              <input
                type="text"
                required
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs font-mono text-zinc-100"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">تاریخ معامله:</label>
              <input
                type="text"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs font-mono text-zinc-100"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">تاریخ و ساعت تحویل:</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  placeholder="۱۴۰۵/۰۵/۲۲"
                  className="w-2/3 bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs font-mono text-zinc-100"
                />
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="۱۷:۰۰"
                  className="w-1/3 bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs font-mono text-zinc-100 text-center"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">کل مبلغ معامله (تومان):</label>
              <input
                type="number"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(parseInt(e.target.value) || 0)}
                className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs font-mono text-zinc-100"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">{formatToman(salePrice)}</span>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">پیش‌پرداخت نقد (تومان):</label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(parseInt(e.target.value) || 0)}
                className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs font-mono text-zinc-100"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">{formatToman(downPayment)}</span>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">روش پرداخت:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs text-zinc-100"
              >
                <option value="combination">ترکیبی (نقد + چک صیادی)</option>
                <option value="cash">نقدی کامل</option>
                <option value="installments">اقساطی</option>
                <option value="checks">چک صیادی</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-zinc-400 block mb-1">توضیحات و یادداشت اولیه معامله:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط تحویل، توضیحات سند، ریموت‌ها یا آپشن‌های تحویلی..."
              className="w-full bg-[#16171b] border border-[#2b2e38] rounded-lg p-2 text-xs text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#252830] flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              * پس از ایجاد، فرم الف و فرم ب همراه با دیاگرام به طور خودکار آماده‌سازی می‌شوند.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>ثبت و بازگشایی پرونده فروش</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
