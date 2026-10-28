import {
  ConsignmentAgreement,
  OwnerSettlement,
  HandoverChecklistItem,
  VehicleHandoverInspection,
} from '../types/consignment';

export const DEFAULT_HANDOVER_CHECKLIST_ITEMS: Omit<HandoverChecklistItem, 'id'>[] = [
  // برف‌پاک‌کن‌ها
  {
    title: 'برف‌پاک‌کن جلو',
    group: 'wipers',
    state: 'present',
    quantity: 1,
    notes: 'تیغه‌ها سالم و فابریک',
  },
  {
    title: 'برف‌پاک‌کن عقب',
    group: 'wipers',
    state: 'present',
    quantity: 1,
  },

  // دوربین‌ها
  {
    title: 'دوربین جلو',
    group: 'cameras',
    state: 'present',
    quantity: 1,
    notes: 'تصویر شفاف و بدون خط',
  },
  {
    title: 'دوربین عقب (دنده عقب)',
    group: 'cameras',
    state: 'present',
    quantity: 1,
    notes: 'خطوط راهنما فعال',
  },

  // روشنایی و سنسورها
  {
    title: 'سنسورهای پارک جلو و عقب',
    group: 'lighting_sensors',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'آنتن خودرو (کوسه‌ای / میله‌ای)',
    group: 'lighting_sensors',
    state: 'present',
    quantity: 1,
  },

  // ابزار، زاپاس و تجهیزات اضطراری
  {
    title: 'لاستیک زاپاس',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
    notes: 'رینگ فابریک و باد مجاز',
  },
  {
    title: 'جک بالابر خودرو',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'دسته جک',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'آچار چرخ',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'مثلث خطر شبرنگ',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'کپسول آتش‌نشانی',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
    notes: 'دارای درجه فشار استاندارد',
  },
  {
    title: 'کیف کمک‌های اولیه',
    group: 'tools_safety',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'درپوش بکسل‌بند جلو و عقب',
    group: 'tools_safety',
    state: 'present',
    quantity: 2,
  },
  {
    title: 'کاپ / کاور رینگ‌ها',
    group: 'tools_safety',
    state: 'present',
    quantity: 4,
  },

  // ریموت‌ها و تجهیزات الکترونیکی
  {
    title: 'ریموت و کلید اصلی',
    group: 'keys_electronics',
    state: 'present',
    quantity: 1,
    notes: 'قاب چرمی فابریک و باتری نو',
  },
  {
    title: 'ریموت یدک / کلید دوم',
    group: 'keys_electronics',
    state: 'present',
    quantity: 1,
    notes: 'ریموت یدک تحویل شد',
  },
  {
    title: 'ریموت ضبط / مالتی‌مدیا',
    group: 'keys_electronics',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'مانیتور و سیستم صوتی لمسی',
    group: 'keys_electronics',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'درب و درپوش جعبه فیوز',
    group: 'keys_electronics',
    state: 'present',
    quantity: 1,
  },

  // کابین و راحتی سرنشین
  {
    title: 'دفترچه راهنمای فارسی/انگلیسی و گارانتی',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'سیستم تهویه مطبوع و کولر',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
    notes: 'سرمایش و گرمایش تست شد',
  },
  {
    title: 'سردنده و کاور دسته دنده',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'درپوش شیفت‌لاک دنده',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'کفپوش کامل ۵ تکه فابریک',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'فندک خودرو',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'زیرسیگاری پرتابل',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'پرده‌ها و توری محافظ جانبی و عقب',
    group: 'interior_comfort',
    state: 'present',
    quantity: 1,
  },
  {
    title: 'سانروف / سقف پانوراما',
    group: 'exterior_other',
    state: 'present',
    quantity: 1,
    notes: 'حرکت برقی و پرده تست شد',
  },
];

export const createDefaultHandoverChecklist = (): HandoverChecklistItem[] => {
  return DEFAULT_HANDOVER_CHECKLIST_ITEMS.map((item, idx) => ({
    id: `chk-handover-${idx + 1}-${Date.now().toString().slice(-4)}`,
    ...item,
  }));
};

// Initial Consignment Agreements
export const INITIAL_CONSIGNMENT_AGREEMENTS: ConsignmentAgreement[] = [
  {
    id: 'con-1',
    contractNumber: 'CON-1405-001',
    vehicleId: 'veh-5', // هیوندای سوناتا YF
    vehicleFullName: 'هیوندای سوناتا YF 2014',
    ownerPersonId: 'cust-1', // علی رضایی
    ownerName: 'علی رضایی',
    ownerPhone: '۰۹۱۲-۱۱۱-۲۲۳۳',
    ownerNationalId: '۰۰۷۶۵۴۳۲۱۰',
    deliveryToDealershipDate: '۱۴۰۵/۰۲/۱۰',
    startDate: '۱۴۰۵/۰۲/۱۰',
    endDate: '۱۴۰۵/۰۵/۱۰',
    commissionType: 'percentage',
    commissionValue: 2.5, // 2.5%
    agreedMinPrice: 2200000000,
    askingPrice: 2350000000,
    notes: 'خودرو امانی از طرف آقای رضایی جهت فروش با کمیسیون ۲.۵ درصد توافقی.',
    status: 'sold',
    createdAt: '۱۴۰۵/۰۲/۱۰',
  },
  {
    id: 'con-2',
    contractNumber: 'CON-1405-002',
    vehicleId: 'veh-6', // بی ام و 528i
    vehicleFullName: 'بی ام و 528i M Sport 2016',
    ownerPersonId: 'cust-2', // محمد مهدوی
    ownerName: 'محمد مهدوی',
    ownerPhone: '۰۹۱۲-۴۴۴-۵۵۶۶',
    ownerNationalId: '۰۰۴۳۲۱۸۷۶۵',
    deliveryToDealershipDate: '۱۴۰۵/۰۴/۱۵',
    startDate: '۱۴۰۵/۰۴/۱۵',
    endDate: '۱۴۰۵/۰۷/۱۵',
    commissionType: 'fixed',
    commissionValue: 120000000, // ۱۲۰ میلیون تومان مقطوع
    agreedMinPrice: 4800000000,
    askingPrice: 5100000000,
    notes: 'خودرو بدون رنگ و خط و خش، تحویل نمایشگاه با کمیسیون ثابت ۱۲۰ میلیون تومان.',
    status: 'active',
    createdAt: '۱۴۰۵/۰۴/۱۵',
  },
  {
    id: 'con-3',
    contractNumber: 'CON-1405-003',
    vehicleId: 'veh-7', // لکسوس RX350
    vehicleFullName: 'لکسوس RX350 فیس جدید 2013',
    ownerPersonId: 'cust-3', // سارا حسینی
    ownerName: 'سارا حسینی',
    ownerPhone: '۰۹۱۲-۷۷۷-۸۸۹۹',
    ownerNationalId: '۰۰۹۸۷۶۵۴۳۲',
    deliveryToDealershipDate: '۱۴۰۵/۰۵/۰۱',
    startDate: '۱۴۰۵/۰۵/۰۱',
    endDate: '۱۴۰۵/۰۸/۰۱',
    commissionType: 'percentage',
    commissionValue: 2.0, // 2%
    agreedMinPrice: 4500000000,
    askingPrice: 4750000000,
    notes: 'تحویل با لاستیک‌های نو و کارت سوخت.',
    status: 'active',
    createdAt: '۱۴۰۵/۰۵/۰۱',
  },
];

// Initial Owner Settlements
export const INITIAL_OWNER_SETTLEMENTS: OwnerSettlement[] = [
  {
    id: 'settle-1',
    agreementId: 'con-1',
    saleId: 'sale-3',
    vehicleId: 'veh-5',
    vehicleFullName: 'هیوندای سوناتا YF 2014',
    ownerPersonId: 'cust-1',
    ownerName: 'علی رضایی',
    grossSaleAmount: 2320000000,
    dealershipCommission: 58000000, // 2.5% of 2,320,000,000
    deductibleExpenseAmount: 8500000, // کارواش VIP و پولیش و واکس به عهده مالک
    netPayableToOwner: 2253500000, // 2,320,000,000 - 58,000,000 - 8,500,000
    paidAmount: 2000000000,
    remainingAmount: 253500000,
    status: 'partially_settled',
    payments: [
      {
        id: 'osp-1',
        amount: 2000000000,
        date: '۱۴۰۵/۰۵/۲۲',
        method: 'transfer',
        trackingNumber: 'TRF-SATNA-984120',
        notes: 'واریز ساتنا مرحله اول پس از وصول پیش‌پرداخت خریدار',
        createdAt: '۱۴۰۵/۰۵/۲۲',
      },
    ],
    notes: 'مانده تسویه ۲۵۳,۵۰۰,۰۰۰ تومان پس از تعویض پلاک به حساب مالک واریز می‌شود.',
    createdAt: '۱۴۰۵/۰۵/۲۰',
    updatedAt: '۱۴۰۵/۰۵/۲۲',
  },
];

// Initial Inspections with 3D Damage Markers
export const INITIAL_VEHICLE_INSPECTIONS: VehicleHandoverInspection[] = [
  {
    id: 'insp-1',
    vehicleId: 'veh-5',
    vehicleFullName: 'هیوندای سوناتا YF 2014',
    ownershipType: 'consignment',
    deliveryType: 'consignment_intake',
    inspectionStage: 'intake',
    date: '۱۴۰۵/۰۲/۱۰',
    time: '۱۱:۳۰',
    mileage: 142000,
    fuelLevel: '1/2',
    color: 'سفید صدفی',
    plate: '۵۵ج۴۴۴ - ۱۱',
    chassisNumber: 'KMHEU41CADU982104',
    deliveredBy: {
      name: 'علی رضایی',
      phone: '۰۹۱۲-۱۱۱-۲۲۳۳',
      nationalId: '۰۰۷۶۵۴۳۲۱۰',
      date: '۱۴۰۵/۰۲/۱۰',
      time: '۱۱:۳۰',
    },
    receivedBy: {
      name: 'مهندس اکبری (کارشناس فنی نمایشگاه)',
      phone: '۰۹۱۲-۲۲۲-۹۹۰۰',
      nationalId: '۰۰۶۵۴۳۲۱۸۹',
      roleOrCompany: 'کارشناس تحویل اتو عبداللهی',
      date: '۱۴۰۵/۰۲/۱۰',
      time: '۱۱:۳۰',
    },
    checklist: createDefaultHandoverChecklist(),
    damageMarkers: [
      {
        id: 'dmg-1',
        view: 'left',
        x: 48,
        y: 62,
        z: 0.1,
        point3D: { x: 0.35, y: 0.85, z: 0.92 },
        normal3D: { x: 0, y: 0, z: 1 },
        panel: 'front_left_door',
        panelLabelFa: 'درب جلو چپ',
        damageType: 'scratch',
        severity: 'minor',
        notes: 'خط و خش مویی سطحی به طول ۸ سانتی‌متر زیر دستگیره',
        photos: [],
        createdAt: '۱۴۰۵/۰۲/۱۰',
      },
      {
        id: 'dmg-2',
        view: 'rear',
        x: 52,
        y: 75,
        z: -0.2,
        point3D: { x: -2.38, y: 0.50, z: 0.35 },
        normal3D: { x: -1, y: 0, z: 0.2 },
        panel: 'rear_bumper',
        panelLabelFa: 'سپر عقب',
        damageType: 'dent',
        severity: 'minor',
        notes: 'فرورفتگی جزئی بدون ریزش رنگ گوشه راست سپر',
        photos: [],
        createdAt: '۱۴۰۵/۰۲/۱۰',
      },
    ],
    generalPhotos: [],
    generalNotes: 'بدنه خودرو تمیز و فابریک، با دو مورد خط و خش جزئی طبق کروکی دیجیتال پذیرش شد.',
    status: 'completed',
    createdAt: '۱۴۰۵/۰۲/۱۰',
    finalizedAt: '۱۴۰۵/۰۲/۱۰ ۱۲:۰۰',
  },
];
