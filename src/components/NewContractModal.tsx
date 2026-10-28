import React, { useState, useMemo } from 'react';
import {
  SmartContract,
  ContractType,
  PaymentArrangement,
  ContractInstallment,
  ContractSeparateExpense,
} from '../types/contract';
import { useAccounting } from '../context/AccountingContext';
import { formatToman, toPersianDigits, DEALERSHIP_CURRENT_DATE } from '../utils/formatters';
import {
  calculateContractFinancials,
  generateInstallmentSchedule,
  getDefaultContractClauses,
} from '../utils/contractEngine';
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  Car,
  User,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVehicleId?: string;
  initialCustomerId?: string;
  initialType?: ContractType;
  onContractCreated?: (contract: SmartContract) => void;
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  initialVehicleId,
  initialCustomerId,
  initialType = 'sale',
  onContractCreated,
}) => {
  const { vehicles, customers, contracts, addContract, showToast } = useAccounting();

  // Basic Details
  const [contractType, setContractType] = useState<ContractType>(initialType);
  const [contractNumber, setContractNumber] = useState<string>(() => {
    const nextSeq = contracts.length + 1;
    return `CNT-1405-${nextSeq.toString().padStart(3, '0')}`;
  });
  const [contractDate, setContractDate] = useState<string>(DEALERSHIP_CURRENT_DATE);

  // Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || (vehicles[0]?.id || ''));

  // Parties
  const [buyerType, setBuyerType] = useState<'existing' | 'manual'>('existing');
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(initialCustomerId || (customers[0]?.id || ''));
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerNationalId, setBuyerNationalId] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');

  const [sellerType, setSellerType] = useState<'dealership' | 'customer'>('dealership');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');

  // Financial Terms
  const [paymentArrangement, setPaymentArrangement] = useState<PaymentArrangement>('installment');
  const [basePrice, setBasePrice] = useState<number>(1_800_000_000);
  const [installmentProfit, setInstallmentProfit] = useState<number>(150_000_000);
  const [downPayment, setDownPayment] = useState<number>(600_000_000);
  const [downPaymentPaid, setDownPaymentPaid] = useState<boolean>(true);
  const [recordDownPaymentIncome, setRecordDownPaymentIncome] = useState<boolean>(true);
  const [separateExpenses, setSeparateExpenses] = useState<ContractSeparateExpense[]>([]);

  // Installment Generator state
  const [installmentCount, setInstallmentCount] = useState<number>(6);
  const [firstDueDate, setFirstDueDate] = useState<string>('۱۴۰۵/۰۲/۱۵');
  const [installments, setInstallments] = useState<ContractInstallment[]>([]);

  // Legal Clauses & Notary
  const [clauses, setClauses] = useState(getDefaultContractClauses('sale'));
  const [notaryOffice, setNotaryOffice] = useState<string>('دفترخانه رسمی شماره ۴۲ تهران');
  const [notaryDate, setNotaryDate] = useState<string>('۱۴۰۵/۰۳/۰۱');
  const [notes, setNotes] = useState<string>('');
  const [contractStatus, setContractStatus] = useState<'draft' | 'ready_to_sign' | 'signed'>('ready_to_sign');

  // Multi-step tab
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Derived target vehicle
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Derived financial calculation
  const calculatedFinancials = useMemo(() => {
    return calculateContractFinancials({
      baseVehiclePrice: basePrice,
      installmentProfit: paymentArrangement === 'cash' ? 0 : installmentProfit,
      downPayment,
      downPaymentPaid,
      downPaymentDate: contractDate,
      paymentArrangement,
      separateExpenses,
    });
  }, [basePrice, installmentProfit, downPayment, downPaymentPaid, contractDate, paymentArrangement, separateExpenses]);

  // Handle auto-generation of installments
  const handleGenerateInstallments = () => {
    if (calculatedFinancials.remainingBalance <= 0) {
      showToast('مانده اقساط صفر است. نیازی به تعریف قسط نیست.', 'info');
      setInstallments([]);
      return;
    }
    const generated = generateInstallmentSchedule(
      calculatedFinancials.remainingBalance,
      installmentCount,
      firstDueDate,
      'cheque'
    );
    setInstallments(generated);
    showToast(`${installmentCount} قسط با موفقیت محاسبه و زمان‌بندی شد.`, 'success');
  };

  if (!isOpen) return null;

  const handleAddExpenseRow = () => {
    setSeparateExpenses((prev) => [
      ...prev,
      {
        id: `exp-${Date.now()}`,
        title: 'کمیسیون و حق‌التحریر',
        amount: 5_000_000,
        payer: 'buyer',
        status: 'pending',
      },
    ]);
  };

  const handleRemoveExpenseRow = (id: string) => {
    setSeparateExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateInstallment = (id: string, field: keyof ContractInstallment, val: any) => {
    setInstallments((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, [field]: val } : inst))
    );
  };

  const handleSaveContract = (statusToSave: 'draft' | 'ready_to_sign' | 'signed') => {
    if (!selectedVehicle) {
      showToast('لطفاً یک خودرو برای قرارداد انتخاب نمایید.', 'error');
      return;
    }

    // Resolve Buyer
    let buyerObj = {
      name: 'مشتری بدون نام',
      nationalId: '',
      phone: '',
      address: '',
    };
    let resolvedBuyerId: string | undefined = undefined;

    if (buyerType === 'existing') {
      const cust = customers.find((c) => c.id === selectedBuyerId);
      if (cust) {
        resolvedBuyerId = cust.id;
        buyerObj = {
          name: cust.fullName,
          nationalId: cust.nationalId,
          phone: cust.phone,
          address: cust.address || '',
        };
      }
    } else {
      buyerObj = {
        name: buyerName || 'خریدار محترم',
        nationalId: buyerNationalId,
        phone: buyerPhone,
        address: buyerAddress,
      };
    }

    // Resolve Seller
    let sellerObj = {
      name: 'نمایشگاه اتومبیل عبدالهی',
      nationalId: '۱۰۱۰۲۸۳۴۹۰۲',
      phone: '۰۲۱-۲۲۰۰۳۳۴۴',
      address: 'تهران، خیابان شریعتی، پلاک ۱۲',
    };
    let resolvedSellerId: string | undefined = undefined;

    if (sellerType === 'customer') {
      const cust = customers.find((c) => c.id === selectedSellerId);
      if (cust) {
        resolvedSellerId = cust.id;
        sellerObj = {
          name: cust.fullName,
          nationalId: cust.nationalId,
          phone: cust.phone,
          address: cust.address || '',
        };
      }
    }

    const newContract: SmartContract = {
      id: `cnt-${Date.now()}`,
      contractNumber,
      contractDate,
      contractType,
      status: statusToSave,
      vehicleId: selectedVehicle.id,
      vehicleLabel: selectedVehicle.fullName,
      buyerId: resolvedBuyerId,
      sellerId: resolvedSellerId,
      parties: {
        buyer: buyerObj,
        seller: sellerObj,
      },
      vehicleSnapshot: {
        fullName: selectedVehicle.fullName,
        chassisNumber: selectedVehicle.vin || '---',
        engineNumber: '---',
        licensePlate: selectedVehicle.plate || '---',
        color: selectedVehicle.color,
        year: selectedVehicle.year || 1402,
        mileage: 15000,
      },
      financials: calculatedFinancials,
      installments,
      clauses,
      notaryOffice,
      notaryDate,
      notes,
      unappliedCredit: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionHistory: [],
    };

    addContract(newContract, recordDownPaymentIncome);
    if (onContractCreated) {
      onContractCreated(newContract);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl bg-zinc-900/95 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                تنظیم قرارداد و مبایعه‌نامه هوشمند
                <span className="text-xs font-normal text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                  {contractNumber}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                مدیریت تفکیک مالی، سود اقساطی، زمان‌بندی و اسناد تضمین
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {[
              { num: 1, label: 'مشخصات و طرفین' },
              { num: 2, label: 'شرایط و تفکیک مالی' },
              { num: 3, label: 'زمان‌بندی اقساط و چک‌ها' },
              { num: 4, label: 'مواد قرارداد و دفترخانه' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  currentStep === step.num
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold font-en-num">
                  {toPersianDigits(step.num)}
                </span>
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-en-num font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            <span>مبلغ کل:</span>
            <span>{formatToman(calculatedFinancials.totalAgreedPrice)}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Basic & Parties */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Type, Number, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    نوع قرارداد
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setContractType('sale')}
                      className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                        contractType === 'sale'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      فروش خودرو به مشتری
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractType('purchase')}
                      className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                        contractType === 'purchase'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      خرید خودرو از مشتری
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    شماره قرارداد (قابل استناد)
                  </label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    تاریخ انعقاد قرارداد
                  </label>
                  <input
                    type="text"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>انتخاب خودروی موضوع معامله</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">خودرو</label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.fullName} — پلاک: {v.plate || 'فاقد پلاک'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedVehicle && (
                    <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>شماره شاسی:</span>
                        <span className="font-mono text-zinc-200">{selectedVehicle.vin || '---'}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>رنگ و سال:</span>
                        <span className="text-zinc-200">{selectedVehicle.color || 'سفید'} ({toPersianDigits(selectedVehicle.year || 1402)})</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>پلاک:</span>
                        <span className="font-mono text-zinc-200">{toPersianDigits(selectedVehicle.plate || '---')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parties: Buyer & Seller */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buyer */}
                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      طرف دوم (خریدار)
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBuyerType('existing')}
                        className={`cursor-pointer ${buyerType === 'existing' ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}
                      >
                        پرونده موجود
                      </button>
                      <span className="text-zinc-600">|</span>
                      <button
                        type="button"
                        onClick={() => setBuyerType('manual')}
                        className={`cursor-pointer ${buyerType === 'manual' ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}
                      >
                        ورود دستی
                      </button>
                    </div>
                  </div>

                  {buyerType === 'existing' ? (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">انتخاب مشتری</label>
                      <select
                        value={selectedBuyerId}
                        onChange={(e) => setSelectedBuyerId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} — کد ملی: {c.nationalId}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="نام و نام خانوادگی خریدار"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="کد ملی (۱۰ رقم)"
                          value={buyerNationalId}
                          onChange={(e) => setBuyerNationalId(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                        />
                        <input
                          type="text"
                          placeholder="شماره همراه"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="نشانی اقامتگاه و کد پستی"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                      />
                    </div>
                  )}
                </div>

                {/* Seller */}
                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-sky-400" />
                      طرف اول (فروشنده)
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSellerType('dealership')}
                        className={`cursor-pointer ${sellerType === 'dealership' ? 'text-sky-400 font-bold' : 'text-zinc-500'}`}
                      >
                        نمایشگاه عبدالهی
                      </button>
                      <span className="text-zinc-600">|</span>
                      <button
                        type="button"
                        onClick={() => setSellerType('customer')}
                        className={`cursor-pointer ${sellerType === 'customer' ? 'text-sky-400 font-bold' : 'text-zinc-500'}`}
                      >
                        مشتری / مالک قبلی
                      </button>
                    </div>
                  </div>

                  {sellerType === 'dealership' ? (
                    <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs text-zinc-300 space-y-1">
                      <div className="font-semibold text-zinc-100">اتومبیل عبدالهی</div>
                      <div className="text-[11px] text-zinc-400">شناسه ملی: ۱۰۱۰۲۸۳۴۹۰۲</div>
                      <div className="text-[11px] text-zinc-400">تهران، خیابان شریعتی، پلاک ۱۲</div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">انتخاب مالک / فروشنده</label>
                      <select
                        value={selectedSellerId}
                        onChange={(e) => setSelectedSellerId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">انتخاب از بین مشتریان ثبت‌شده...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} — کد ملی: {c.nationalId}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Financial Terms & Segregation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Payment Arrangement */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  شیوه تسویه و ساختار پرداخت
                </label>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {[
                    { id: 'installment', label: 'فروش اقساطی (چک/سفته)' },
                    { id: 'mixed', label: 'ترکیبی (پیش‌پرداخت + اقساط)' },
                    { id: 'cash', label: 'نقدی کامل (تسویه یکجا)' },
                  ].map((arr) => (
                    <button
                      type="button"
                      key={arr.id}
                      onClick={() => setPaymentArrangement(arr.id as any)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                        paymentArrangement === arr.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                          : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {arr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Inputs (Strictly Segregated) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    قیمت اصلی خودرو (تومان) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    step={1000000}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <span className="text-[11px] text-zinc-500 mt-0.5 block font-en-num">
                    {formatToman(basePrice)}
                  </span>
                </div>

                {paymentArrangement !== 'cash' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      سود توافق‌شده اقساط (تومان)
                    </label>
                    <input
                      type="number"
                      value={installmentProfit}
                      onChange={(e) => setInstallmentProfit(Number(e.target.value))}
                      step={1000000}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-amber-400/80 mt-0.5 block font-en-num">
                      {formatToman(installmentProfit)}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    پیش‌پرداخت نقدی (تومان)
                  </label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    step={1000000}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-500 mt-0.5 block font-en-num">
                    {formatToman(downPayment)}
                  </span>
                </div>
              </div>

              {/* Down Payment Options */}
              {downPayment > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="downPaymentPaid"
                      checked={downPaymentPaid}
                      onChange={(e) => setDownPaymentPaid(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="downPaymentPaid" className="text-zinc-200 cursor-pointer">
                      پیش‌پرداخت در زمان انعقاد قرارداد وصول و دریافت گردیده است
                    </label>
                  </div>

                  {downPaymentPaid && (
                    <div className="flex items-center gap-2 pr-6">
                      <input
                        type="checkbox"
                        id="recordIncome"
                        checked={recordDownPaymentIncome}
                        onChange={(e) => setRecordDownPaymentIncome(e.target.checked)}
                        className="rounded border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="recordIncome" className="text-emerald-400 cursor-pointer">
                        ثبت خودکار تراکنش دریافت وجه نقد (Income) در حسابداری نمایشگاه
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Separate Expenses */}
              <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    هزینه‌های جداگانه قرارداد (حق‌التحریر، کمیسیون، مالیات نقل و انتقال)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddExpenseRow}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن هزینه جداگانه</span>
                  </button>
                </div>

                {separateExpenses.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">
                    هزینه جداگانه‌ای برای این معامله ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {separateExpenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSeparateExpenses((prev) =>
                              prev.map((i) => (i.id === exp.id ? { ...i, title: val } : i))
                            );
                          }}
                          placeholder="عنوان هزینه"
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200"
                        />
                        <input
                          type="number"
                          value={exp.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSeparateExpenses((prev) =>
                              prev.map((i) => (i.id === exp.id ? { ...i, amount: val } : i))
                            );
                          }}
                          className="w-32 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200 font-mono"
                        />
                        <select
                          value={exp.payer}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setSeparateExpenses((prev) =>
                              prev.map((i) => (i.id === exp.id ? { ...i, payer: val } : i))
                            );
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                        >
                          <option value="buyer">به عهده خریدار</option>
                          <option value="seller">به عهده فروشنده</option>
                          <option value="split">تسهیم بالمناصفه (۵۰-۵۰)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpenseRow(exp.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Financial Separation Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1">قیمت پایه خودرو:</span>
                  <span className="font-semibold text-zinc-200 font-en-num">
                    {formatToman(calculatedFinancials.baseVehiclePrice)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">سود اقساطی:</span>
                  <span className="font-semibold text-amber-400 font-en-num">
                    {formatToman(calculatedFinancials.installmentProfit)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">مبلغ کل قرارداد:</span>
                  <span className="font-bold text-emerald-400 font-en-num text-sm">
                    {formatToman(calculatedFinancials.totalAgreedPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">مانده اقساط در جریان:</span>
                  <span className="font-bold text-sky-400 font-en-num text-sm">
                    {formatToman(calculatedFinancials.remainingBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Installment Schedule & Guarantees */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {paymentArrangement === 'cash' ? (
                <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-950/40 text-xs text-zinc-400">
                  روش پرداخت «نقدی کامل» انتخاب شده است و نیازی به تعریف اقساط وجود ندارد.
                </div>
              ) : (
                <>
                  {/* Schedule Generator Controls */}
                  <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        تعداد اقساط
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(Number(e.target.value))}
                        className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        تاریخ سررسید قسط اول
                      </label>
                      <input
                        type="text"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateInstallments}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>محاسبه و زمان‌بندی خودکار اقساط</span>
                    </button>
                  </div>

                  {/* Installments Table */}
                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                    <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-200">
                        جدول اقساط، سررسیدها و مشخصات اسناد تضمین (چک صیادی / سفته)
                      </span>
                      <span className="text-zinc-400 font-en-num">
                        مجموع: {formatToman(installments.reduce((s, i) => s + i.amount, 0))}
                      </span>
                    </div>

                    {installments.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        برای تولید اقساط روی دکمه «محاسبه و زمان‌بندی خودکار» کلیک نمایید.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs border-collapse">
                          <thead className="bg-zinc-900/40 text-zinc-400 border-b border-zinc-800">
                            <tr>
                              <th className="p-2 w-10">ردیف</th>
                              <th className="p-2">سررسید</th>
                              <th className="p-2">مبلغ قسط (تومان)</th>
                              <th className="p-2">نوع تضمین</th>
                              <th className="p-2">شماره چک / صیادی</th>
                              <th className="p-2">بانک صادرکننده</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {installments.map((inst) => (
                              <tr key={inst.id} className="hover:bg-zinc-900/30">
                                <td className="p-2 font-mono font-bold text-zinc-400">
                                  {toPersianDigits(inst.installmentNumber)}
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={inst.dueDate}
                                    onChange={(e) => handleUpdateInstallment(inst.id, 'dueDate', e.target.value)}
                                    className="w-28 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center font-mono text-zinc-100"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={inst.amount}
                                    onChange={(e) => handleUpdateInstallment(inst.id, 'amount', Number(e.target.value))}
                                    className="w-32 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-left font-mono text-emerald-400 font-bold"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={inst.guaranteeType}
                                    onChange={(e) => handleUpdateInstallment(inst.id, 'guaranteeType', e.target.value)}
                                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                                  >
                                    <option value="cheque">چک صیادی</option>
                                    <option value="promissory_note">سفته</option>
                                    <option value="other">سایر</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={inst.chequeNumber || ''}
                                    onChange={(e) => handleUpdateInstallment(inst.id, 'chequeNumber', e.target.value)}
                                    placeholder="شناسه ۱۶ رقمی"
                                    className="w-32 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center font-mono text-zinc-100"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={inst.bankName || ''}
                                    onChange={(e) => handleUpdateInstallment(inst.id, 'bankName', e.target.value)}
                                    placeholder="مثلاً: ملت"
                                    className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center text-zinc-100"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Contract Clauses & Notary Terms */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    دفترخانه اسناد رسمی جهت انتقال قطعی سند
                  </label>
                  <input
                    type="text"
                    value={notaryOffice}
                    onChange={(e) => setNotaryOffice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    تاریخ حضور در دفترخانه
                  </label>
                  <input
                    type="text"
                    value={notaryDate}
                    onChange={(e) => setNotaryDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {/* Editable Legal Clauses */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    ماده ۴: شرایط تحویل خودرو و مدارک
                  </label>
                  <textarea
                    rows={2}
                    value={clauses.deliveryTerms}
                    onChange={(e) => setClauses({ ...clauses, deliveryTerms: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    ماده ۵: انتقال سند رسمی و وکالتنامه
                  </label>
                  <textarea
                    rows={2}
                    value={clauses.ownershipTransfer}
                    onChange={(e) => setClauses({ ...clauses, ownershipTransfer: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    ماده ۶: خسارات تاخیر، شروط ضمن عقد و ضمانت اجراها
                  </label>
                  <textarea
                    rows={2}
                    value={clauses.penaltiesAndDamages}
                    onChange={(e) => setClauses({ ...clauses, penaltiesAndDamages: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    یادداشت‌های داخلی پرونده قرارداد (محرمانه)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="توافقات تلفنی، مشخصات ضامن یا ملاحظات..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
            )}
            {currentStep < 4 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep + 1) as any)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>مرحله بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveContract('draft')}
              className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              ذخیره به عنوان پیش‌نویس
            </button>
            <button
              type="button"
              onClick={() => handleSaveContract('ready_to_sign')}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-950/40 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت نهایی و آماده امضا</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
