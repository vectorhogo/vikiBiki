import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Customer, SaleDossier } from '../types/customerSales';
import { Vehicle } from '../types/accounting';
import {
  formatToman,
  toPersianDigits,
  DEALERSHIP_CURRENT_DATE,
} from '../utils/formatters';
import {
  createDefaultFormAChecklist,
  createDefaultFormBEquipment,
} from '../data/initialCustomerSalesData';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Car,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ParsedLegacyRecord {
  id: string;
  contractNumber: string;
  customerName: string;
  nationalId: string;
  phone: string;
  phone2?: string;
  address?: string;
  vehicleName: string;
  brand: string;
  model: string;
  plate: string;
  vin: string;
  color?: string;
  year?: string;
  saleDate: string;
  deliveryDate: string;
  deliveryTime?: string;
  salePrice: number;
  downPayment: number;
  status: 'delivered' | 'pending_delivery';
  notes?: string;

  // Validation results
  isValid: boolean;
  errors: string[];
  warnings: string[];
  matchedExistingCustomer?: Customer;
  matchedExistingVehicle?: Vehicle;
  isDuplicateContract?: boolean;
}

export const LegacyImportCenter: React.FC = () => {
  const {
    customers,
    vehicles,
    saleDossiers,
    addCustomer,
    addVehicle,
    addSaleDossier,
    showToast,
  } = useAccounting();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRecords, setParsedRecords] = useState<ParsedLegacyRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    importedSales: number;
    createdCustomers: number;
    reusedCustomers: number;
    createdVehicles: number;
  } | null>(null);

  // Validate a single parsed record against business rules & current database
  const validateRecord = (
    rec: Omit<ParsedLegacyRecord, 'isValid' | 'errors' | 'warnings'>
  ): ParsedLegacyRecord => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Mandatory Field: Customer Name
    if (!rec.customerName || !rec.customerName.trim()) {
      errors.push('نام و نام خانوادگی خریدار الزامی است.');
    }

    // 2. Mandatory Field: Customer Phone or National ID
    if (!rec.phone?.trim() && !rec.nationalId?.trim()) {
      errors.push('ثبت حداقل یکی از اقلام شماره تماس یا کد ملی برای خریدار الزامی است.');
    }

    // 3. Mandatory Field: Vehicle Name or Brand/Model
    if (!rec.vehicleName?.trim() && (!rec.brand?.trim() || !rec.model?.trim())) {
      errors.push('عنوان یا مدل خودرو الزامی است.');
    }

    // 4. Mandatory Field: Sale Price
    if (!rec.salePrice || rec.salePrice <= 0 || isNaN(rec.salePrice)) {
      errors.push('مبلغ فروش خودرو باید عددی بزرگتر از صفر باشد.');
    }

    // 5. Mandatory Field: Sale Date
    if (!rec.saleDate || !rec.saleDate.trim()) {
      errors.push('تاریخ معامله الزامی است.');
    }

    // 6. Duplicate Customer Detection
    const cleanPhone = rec.phone ? rec.phone.replace(/\D/g, '') : '';
    const cleanNatId = rec.nationalId ? rec.nationalId.trim() : '';

    const matchedCustomer = customers.find((c) => {
      const existingPhone = c.phone.replace(/\D/g, '');
      const existingNatId = c.nationalId ? c.nationalId.trim() : '';
      return (
        (cleanNatId && cleanNatId.length >= 8 && existingNatId === cleanNatId) ||
        (cleanPhone && cleanPhone.length >= 10 && existingPhone === cleanPhone)
      );
    });

    if (matchedCustomer) {
      warnings.push(`شناسایی مشتری موجود: «${matchedCustomer.fullName}» (${matchedCustomer.fileNumber}) بازاستفاده خواهد شد.`);
    }

    // 7. Duplicate Vehicle Detection (by VIN or Plate)
    const cleanVin = rec.vin ? rec.vin.trim().toUpperCase() : '';
    const cleanPlate = rec.plate ? rec.plate.trim() : '';

    const matchedVehicle = vehicles.find((v) => {
      return (
        (cleanVin && cleanVin.length >= 6 && v.vin.toUpperCase() === cleanVin) ||
        (cleanPlate && v.plate === cleanPlate)
      );
    });

    if (matchedVehicle) {
      warnings.push(`خودرو قبلاً در سیستم ثبت شده: «${matchedVehicle.fullName}»`);
    }

    // 8. Duplicate Contract Number Detection
    const isDupContract = Boolean(
      rec.contractNumber &&
        saleDossiers.some(
          (s) => s.contractNumber.trim().toLowerCase() === rec.contractNumber.trim().toLowerCase()
        )
    );
    if (isDupContract) {
      warnings.push(`شماره قرارداد «${rec.contractNumber}» قبلاً در بایگانی ثبت شده است.`);
    }

    return {
      ...rec,
      isValid: errors.length === 0,
      errors,
      warnings,
      matchedExistingCustomer: matchedCustomer,
      matchedExistingVehicle: matchedVehicle,
      isDuplicateContract: isDupContract,
    };
  };

  // Convert raw text (CSV or TSV) to structured records
  const processCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      showToast('فایل بارگذاری‌شده خالی است یا ساختار سطر و ستون ندارد.', 'error');
      return;
    }

    // Detect delimiter: comma, semicolon, or tab
    const headerLine = lines[0];
    const delimiter = headerLine.includes('\t')
      ? '\t'
      : headerLine.includes(';')
      ? ';'
      : ',';

    const headers = headerLine
      .split(delimiter)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const records: ParsedLegacyRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV splitting with possible quotes
      const values = line.split(delimiter).map((v) => v.replace(/^["']|["']$/g, '').trim());

      const getVal = (possibleHeaders: string[]): string => {
        for (const ph of possibleHeaders) {
          const idx = headers.findIndex((h) => h.includes(ph));
          if (idx !== -1 && values[idx] !== undefined) {
            return values[idx];
          }
        }
        return '';
      };

      const rawPrice = getVal(['مبلغ', 'قیمت', 'price', 'total', 'ارزش']);
      const rawDown = getVal(['پیش پرداخت', 'پیش‌پرداخت', 'down', 'نقدی']);
      const priceNum = parseInt(rawPrice.replace(/[^\d]/g, ''), 10) || 0;
      const downNum = parseInt(rawDown.replace(/[^\d]/g, ''), 10) || priceNum;

      const brand = getVal(['برند', 'brand', 'کارخانه']);
      const model = getVal(['مدل', 'model', 'تیپ']);
      const vehicleName =
        getVal(['خودرو', 'عنوان', 'vehicle', 'car', 'نام خودرو']) ||
        `${brand} ${model}`.trim();

      const rawStatus = getVal(['وضعیت', 'تحویل', 'status']).toLowerCase();
      const status: 'delivered' | 'pending_delivery' =
        rawStatus.includes('انتظار') || rawStatus.includes('pending')
          ? 'pending_delivery'
          : 'delivered';

      const saleDate = getVal(['تاریخ معامله', 'تاریخ فروش', 'تاریخ', 'date']) || DEALERSHIP_CURRENT_DATE;
      const deliveryDate = getVal(['تاریخ تحویل', 'تحویل', 'delivery date']) || saleDate;

      const newRec = validateRecord({
        id: `legacy-${i}-${Date.now()}`,
        contractNumber: getVal(['قرارداد', 'مبایعه', 'contract']) || `CNT-LEGACY-${1000 + i}`,
        customerName: getVal(['خریدار', 'مشتری', 'نام', 'customer', 'name']),
        nationalId: getVal(['کد ملی', 'کدملی', 'national', 'id']),
        phone: getVal(['موبایل', 'تلفن', 'همراه', 'phone', 'mobile']),
        phone2: getVal(['تلفن دوم', 'ثابت']),
        address: getVal(['آدرس', 'نشانی', 'address']),
        vehicleName: vehicleName || 'خودروی وارداتی',
        brand: brand || 'سایر',
        model: model || '',
        plate: getVal(['پلاک', 'plate']) || '—',
        vin: getVal(['شاسی', 'vin', 'chassis']) || '',
        color: getVal(['رنگ', 'color']) || 'سفید',
        year: getVal(['سال', 'year']) || '۱۴۰۴',
        saleDate,
        deliveryDate,
        deliveryTime: getVal(['ساعت', 'time']) || '۱۷:۰۰',
        salePrice: priceNum,
        downPayment: downNum,
        status,
        notes: getVal(['توضیحات', 'یادداشت', 'notes']),
      });

      records.push(newRec);
    }

    setParsedRecords(records);
    setImportSummary(null);
    showToast(`${toPersianDigits(records.length)} سطر با موفقیت بازخوانی و اعتبارسنجی شد.`, 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        processCsvText(text);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Sample CSV generator & downloader
  const handleDownloadSampleCsv = () => {
    const sampleHeaders = [
      'شماره قرارداد',
      'نام خریدار',
      'کد ملی',
      'شماره موبایل',
      'عنوان خودرو',
      'برند',
      'مدل',
      'پلاک',
      'شماره شاسی',
      'تاریخ معامله',
      'تاریخ تحویل',
      'مبلغ فروش',
      'پیش پرداخت',
      'وضعیت تحویل',
      'نشانی خریدار',
      'توضیحات',
    ].join(',');

    const sampleRows = [
      'CNT-1404-881,رضا کمالی,0019876543,09124443322,لکسوس NX300h فول,لکسوس,NX300h,44ب123-10,JTJBL1194827104,1404/08/15,1404/08/18,4850000000,4850000000,تحویل شد,تهران زعفرانیه خ مقدس اردبیلی,تسویه نقدی کامل و تحویل کلیه مدارک فابریک',
      'CNT-1404-912,علی رضایی,0078945612,09121118822,بی ام و 530i اسپرت,بی ام و,530i,77ج982-22,WBA5A7194829104,1404/10/20,1404/10/22,6200000000,4000000000,تحویل شد,تهران خ آصف واحد 3,مشتری دارای پرونده قبلی در اتو عبداللهی',
      'CNT-1404-945,سارا نیک‌زاد,0056789123,09126665544,کیا سورنتو جی تی لاین,کیا,سورنتو,81د456-33,KNAKU8149827192,1404/11/10,1404/11/15,3900000000,2500000000,تحویل شد,تهران سعادت آباد خ بهزاد,تحویل با ریموت یدک و زاپاس نو',
    ].join('\n');

    const csvContent = '\uFEFF' + sampleHeaders + '\n' + sampleRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نمونه_سوابق_فروش_گذشته_اتو_عبداللهی.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('فایل نمونه استاندارد دانلود شد.', 'success');
  };

  // Pre-load demo test data for quick inspection
  const handleLoadDemoData = () => {
    setFileName('نمونه_سوابق_آرشیو_۱۴۰۴.csv');
    const demoData = [
      'شماره قرارداد,نام خریدار,کد ملی,شماره موبایل,عنوان خودرو,برند,مدل,پلاک,شماره شاسی,تاریخ معامله,تاریخ تحویل,مبلغ فروش,پیش پرداخت,وضعیت تحویل,نشانی خریدار,توضیحات',
      'CNT-1404-881,رضا کمالی,0019876543,09124443322,لکسوس NX300h فول,لکسوس,NX300h,44ب123-10,JTJBL1194827104,1404/08/15,1404/08/18,4850000000,4850000000,تحویل شد,تهران زعفرانیه خ مقدس اردبیلی,تسویه نقدی کامل و تحویل کلیه مدارک فابریک',
      'CNT-1404-912,علی رضایی,0078945612,09121118822,بی ام و 530i اسپرت,بی ام و,530i,77ج982-22,WBA5A7194829104,1404/10/20,1404/10/22,6200000000,4000000000,تحویل شد,تهران خ آصف واحد 3,مشتری دارای پرونده قبلی در اتو عبداللهی (آزمایش ضدتکرار)',
      'CNT-1404-945,سارا نیک‌زاد,0056789123,09126665544,کیا سورنتو جی تی لاین,کیا,سورنتو,81د456-33,KNAKU8149827192,1404/11/10,1404/11/15,3900000000,2500000000,تحویل شد,تهران سعادت آباد خ بهزاد,تحویل با ریموت یدک و زاپاس نو',
      'CNT-1404-980,,0099881122,,هیوندای سانتافه 2018,هیوندای,سانتافه,33الف111-10,,1404/12/01,,3200000000,0,تحویل شد,,(ردیف نمونه خطادار: بدون نام خریدار و شماره تماس جهت نمایش اعتبارسنجی)',
    ].join('\n');
    processCsvText(demoData);
  };

  // Perform the actual batch import into application state
  const handleConfirmImport = async () => {
    const validRecords = parsedRecords.filter((r) => r.isValid);
    if (validRecords.length === 0) {
      showToast('هیچ ردیف معتبری برای واردسازی وجود ندارد.', 'error');
      return;
    }

    setIsImporting(true);

    let createdCustomers = 0;
    let reusedCustomers = 0;
    let createdVehicles = 0;
    let importedSales = 0;

    for (let i = 0; i < validRecords.length; i++) {
      const rec = validRecords[i];

      // 1. Resolve Customer (Reuse existing or create new Master Customer)
      let customerId = '';
      let customerName = rec.customerName;

      if (rec.matchedExistingCustomer) {
        // Reuse existing customer!
        customerId = rec.matchedExistingCustomer.id;
        customerName = rec.matchedExistingCustomer.fullName;
        reusedCustomers++;
      } else {
        // Create new master customer
        const newFileNo = `C-1405-002${(customers.length + createdCustomers + 1).toString().padStart(2, '0')}`;
        const newCust: Customer = {
          id: `cust-legacy-${Date.now()}-${i}`,
          fileNumber: newFileNo,
          fullName: rec.customerName,
          nationalId: rec.nationalId || '',
          phone: rec.phone || 'ثبت نشده',
          phone2: rec.phone2,
          address: rec.address || 'تهران',
          notes: `وارد شده از آرشیو سوابق گذشته (${fileName || 'فایل اکسل'})`,
          tags: ['سوابق گذشته', 'وارد شده'],
          status: 'active',
          createdAt: rec.saleDate,
        };
        addCustomer(newCust);
        customerId = newCust.id;
        createdCustomers++;
      }

      // 2. Resolve Vehicle (Reuse or create)
      let vehicleId = '';
      if (rec.matchedExistingVehicle) {
        vehicleId = rec.matchedExistingVehicle.id;
      } else {
        const newVehId = `veh-legacy-${Date.now()}-${i}`;
        const newVeh: Omit<Vehicle, 'id' | 'createdAt' | 'status' | 'localVehicleId'> = {
          brand: rec.brand || 'سایر',
          model: rec.model || rec.vehicleName,
          fullName: rec.vehicleName,
          plate: rec.plate || '—',
          vin: rec.vin || `LEGACY-VIN-${1000 + i}`,
          color: rec.color || 'سفید',
          year: parseInt(rec.year || '1404', 10) || 1404,
          inspectionStatus: 'inspected',
        };
        addVehicle(newVeh);
        vehicleId = newVehId;
        createdVehicles++;
      }

      // 3. Create Sale Dossier with Form A & Form B
      const saleNumber = `S-1405-002${(saleDossiers.length + importedSales + 1).toString().padStart(2, '0')}`;
      const remainingBalance = Math.max(0, rec.salePrice - rec.downPayment);

      const dossier: SaleDossier = {
        id: `sale-legacy-${Date.now()}-${i}`,
        saleNumber,
        customerId,
        customerName,
        vehicleId,
        vehicleFullName: rec.vehicleName,
        contractNumber: rec.contractNumber || `CNT-LEGACY-${Date.now().toString().slice(-4)}`,
        saleDate: rec.saleDate,
        deliveryDate: rec.deliveryDate,
        deliveryTime: rec.deliveryTime || '۱۷:۰۰',
        salePrice: rec.salePrice,
        downPayment: rec.downPayment,
        remainingBalance,
        paymentMethod: remainingBalance === 0 ? 'cash' : 'installments',
        payments: [
          {
            id: `pay-leg-${Date.now()}-${i}-1`,
            title: 'پیش‌پرداخت نقد قرارداد گذشته',
            amount: rec.downPayment,
            type: 'transfer',
            dueDate: rec.saleDate,
            paymentDate: rec.saleDate,
            status: 'paid',
            trackingNumber: `LEGACY-${100000 + i}`,
          },
          ...(remainingBalance > 0
            ? [
                {
                  id: `pay-leg-${Date.now()}-${i}-2`,
                  title: 'مانده تسویه پرونده گذشته',
                  amount: remainingBalance,
                  type: 'check' as const,
                  dueDate: rec.deliveryDate,
                  status: 'paid' as const,
                },
              ]
            : []),
        ],
        deliveryFormA: {
          receiverName: customerName,
          receiverNationalId: rec.nationalId || '',
          receiverPhone: rec.phone || '',
          receiverAddress: rec.address || 'تهران',
          insuranceCompany: 'بیمه ایران',
          plateNumber: rec.plate || '—',
          checklist: createDefaultFormAChecklist(),
          deliveredAtDate: rec.deliveryDate,
          deliveredAtTime: rec.deliveryTime || '۱۷:۰۰',
          status: 'completed',
          generalNotes: rec.notes || 'سوابق وارد شده از بایگانی گذشته',
        },
        deliveryFormB: {
          vehicleName: rec.vehicleName,
          modelYear: rec.year || '۱۴۰۴',
          color: rec.color || 'سفید',
          mileageAtDelivery: 500,
          chassisNumber: rec.vin || '',
          plateNumber: rec.plate || '—',
          deliveryDate: rec.deliveryDate,
          deliveryTime: rec.deliveryTime || '۱۷:۰۰',
          fuelLevel: 'full',
          equipmentChecklist: createDefaultFormBEquipment(),
          diagramMarkers: [],
          photos: [],
          delivererSignature: {
            name: 'کارشناس تحویل اتو عبداللهی',
            phone: '۰۹۱۲-۳۳۳-۴۴۵۵',
            nationalId: '0054321987',
            date: rec.deliveryDate,
            time: rec.deliveryTime || '۱۷:۰۰',
          },
          receiverSignature: {
            name: customerName,
            phone: rec.phone || '',
            nationalId: rec.nationalId || '',
            date: rec.deliveryDate,
            time: rec.deliveryTime || '۱۷:۰۰',
          },
          deliveryNotes: rec.notes || 'خودرو با کلیه متعلقات تحویل گردید.',
          status: 'completed',
        },
        attachments: [],
        timeline: [
          {
            id: `tl-leg-${Date.now()}-${i}`,
            title: 'ورود اطلاعات از بایگانی گذشته',
            description: `پرونده فروش خودروی ${rec.vehicleName} از طریق فایل ${fileName || 'اکسل'} وارد سامانه شد.`,
            date: rec.saleDate,
            timestamp: `${rec.saleDate} ۰۰:۰۰`,
            type: 'deal_created',
          },
        ],
        notes: rec.notes,
        status: rec.status,
        createdAt: rec.saleDate,
      };

      addSaleDossier(dossier);
      importedSales++;
    }

    setIsImporting(false);
    setImportSummary({
      importedSales,
      createdCustomers,
      reusedCustomers,
      createdVehicles,
    });
    setParsedRecords([]);

    showToast(
      `عملیات با موفقیت انجام شد: ${toPersianDigits(importedSales)} پرونده فروش وارد شد. (${toPersianDigits(createdCustomers)} مشتری جدید، ${toPersianDigits(reusedCustomers)} مشتری بازاستفاده‌شده)`,
      'success'
    );
  };

  const validCount = parsedRecords.filter((r) => r.isValid).length;
  const errorCount = parsedRecords.filter((r) => !r.isValid).length;
  const warningCount = parsedRecords.filter((r) => r.warnings.length > 0).length;

  return (
    <div className="bg-[#17181d] border border-[#272932] rounded-xl overflow-hidden text-zinc-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="p-4 bg-[#141519] border-b border-[#252830] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">
              مرکز واردسازی سوابق گذشته (Legacy Import Center)
            </h2>
            <p className="text-xs text-zinc-400">
              بارگذاری فایل‌های اکسل و CSV سوابق فروش قدیمی همراه با اعتبارسنجی فیلدهای اجباری و جلوگیری از تکرار مشتریان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-1.5 bg-[#1f2128] hover:bg-[#282a34] text-zinc-300 hover:text-white border border-[#2e313c] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="دانلود فایل نمونه اکسل جهت مشاهده عناوین ستون‌ها"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>دانلود فایل نمونه CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>بارگذاری فایل سوابق</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4 text-xs">
        {/* Helper Banner & Test Sample Loader */}
        <div className="p-3.5 bg-[#121316] border border-[#22242c] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>قوانین اعتبارسنجی و تطبیق هوشمند سوابق:</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              ستون‌های اجباری: <strong>نام خریدار، شماره تماس یا کد ملی، مشخصات خودرو، تاریخ معامله و مبلغ فروش</strong>. در صورت وجود مشتری با شماره تلفن یا کد ملی یکسان در سیستم، پرونده قبلی مشتری مجدداً مورد استفاده قرار خواهد گرفت تا بانک مشتریان بدون تکرار حفظ شود.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemoData}
            className="px-3 py-1.5 bg-[#1c1e25] hover:bg-[#252832] text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs rounded-lg font-medium transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            بارگذاری داده‌های نمونه تستی
          </button>
        </div>

        {/* Import Success Summary Message */}
        {importSummary && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 space-y-2">
            <div className="font-bold flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>واردسازی سوابق با موفقیت تکمیل شد!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-300 pt-1">
              <div>پرونده‌های فروش ایجاد شده: <strong className="text-emerald-400 font-mono">{toPersianDigits(importSummary.importedSales)}</strong></div>
              <div>مشتریان جدید تشکیل پرونده: <strong className="text-zinc-100 font-mono">{toPersianDigits(importSummary.createdCustomers)}</strong></div>
              <div>مشتریان موجود بازاستفاده‌شده: <strong className="text-amber-400 font-mono">{toPersianDigits(importSummary.reusedCustomers)}</strong></div>
              <div>خودروهای اضافه شده: <strong className="text-zinc-100 font-mono">{toPersianDigits(importSummary.createdVehicles)}</strong></div>
            </div>
          </div>
        )}

        {/* Validation & Preview Panel */}
        {parsedRecords.length > 0 && (
          <div className="space-y-3">
            {/* Stats Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-[#141519] border border-[#252830] rounded-lg">
                <span className="text-[11px] text-zinc-500 block">کل سطرهای خوانده شده:</span>
                <span className="font-bold text-sm text-zinc-100 font-mono">
                  {toPersianDigits(parsedRecords.length)} سطر
                </span>
              </div>

              <div className="p-2.5 bg-[#141519] border border-emerald-500/30 rounded-lg">
                <span className="text-[11px] text-emerald-400 block">ردیف‌های معتبر و قابل ورود:</span>
                <span className="font-bold text-sm text-emerald-400 font-mono">
                  {toPersianDigits(validCount)} سطر
                </span>
              </div>

              <div className="p-2.5 bg-[#141519] border border-amber-500/30 rounded-lg">
                <span className="text-[11px] text-amber-400 block">هشدارهای تطبیق / تکرار:</span>
                <span className="font-bold text-sm text-amber-400 font-mono">
                  {toPersianDigits(warningCount)} مورد
                </span>
              </div>

              <div className="p-2.5 bg-[#141519] border border-red-500/30 rounded-lg">
                <span className="text-[11px] text-red-400 block">خطاهای اعتبارسنجی:</span>
                <span className="font-bold text-sm text-red-400 font-mono">
                  {toPersianDigits(errorCount)} سطر
                </span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-[#262832] rounded-xl overflow-hidden bg-[#131418]">
              <div className="p-3 bg-[#111215] border-b border-[#23252d] flex items-center justify-between">
                <span className="font-bold text-zinc-200">
                  پیش‌نمایش ردیف‌های فایل: {fileName || 'سوابق فروش'}
                </span>
                <button
                  type="button"
                  onClick={() => setParsedRecords([])}
                  className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>انصراف و حذف پیش‌نمایش</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-72 divide-y divide-[#22242c]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#181920] text-zinc-400 text-[11px] sticky top-0 border-b border-[#242630]">
                    <tr>
                      <th className="p-2.5">وضعیت</th>
                      <th className="p-2.5">شماره قرارداد</th>
                      <th className="p-2.5">خریدار / مشتری</th>
                      <th className="p-2.5">مشخصات خودرو</th>
                      <th className="p-2.5">تاریخ معامله</th>
                      <th className="p-2.5">مبلغ فروش</th>
                      <th className="p-2.5">جزئیات اعتبارسنجی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2028]">
                    {parsedRecords.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-[#1a1b22] ${
                          !r.isValid
                            ? 'bg-red-500/5'
                            : r.warnings.length > 0
                            ? 'bg-amber-500/5'
                            : ''
                        }`}
                      >
                        <td className="p-2.5 shrink-0">
                          {r.isValid ? (
                            r.warnings.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>هشدار</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>معتبر</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>خطا</span>
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 font-mono text-zinc-300">
                          {r.contractNumber}
                        </td>

                        <td className="p-2.5">
                          <div className="font-semibold text-zinc-200">{r.customerName || '—'}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {r.phone ? toPersianDigits(r.phone) : 'بدون تلفن'}
                            {r.nationalId && ` • ${toPersianDigits(r.nationalId)}`}
                          </div>
                        </td>

                        <td className="p-2.5">
                          <div className="font-medium text-zinc-200">{r.vehicleName}</div>
                          <div className="text-[10px] text-zinc-400">
                            پلاک: {toPersianDigits(r.plate || '—')}
                          </div>
                        </td>

                        <td className="p-2.5 font-mono text-zinc-300">
                          {toPersianDigits(r.saleDate)}
                        </td>

                        <td className="p-2.5 font-bold font-mono text-amber-400">
                          {formatToman(r.salePrice)}
                        </td>

                        <td className="p-2.5 text-[11px]">
                          {r.errors.length > 0 && (
                            <div className="text-red-400 space-y-0.5">
                              {r.errors.map((err, eIdx) => (
                                <div key={eIdx}>• {err}</div>
                              ))}
                            </div>
                          )}

                          {r.warnings.length > 0 && (
                            <div className="text-amber-300/90 space-y-0.5 mt-0.5">
                              {r.warnings.map((wrn, wIdx) => (
                                <div key={wIdx}>• {wrn}</div>
                              ))}
                            </div>
                          )}

                          {r.errors.length === 0 && r.warnings.length === 0 && (
                            <span className="text-emerald-400 text-[10px]">آماده واردسازی به بایگانی</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bottom Bar */}
            <div className="p-3 bg-[#131417] border border-[#252830] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-zinc-400 text-xs">
                <span>تعداد {toPersianDigits(validCount)} سطر معتبر آماده درج در پرونده‌های فروش و بانک مشتریان است.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParsedRecords([])}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  disabled={validCount === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت در پایگاه داده...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأیید و واردسازی {toPersianDigits(validCount)} پرونده به سیستم</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
