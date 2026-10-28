// Phase 08: Consignment Vehicles, Ownership Models, 3-State Handover Checklist, & 3D Damage Map

import { DeliveryPartySignature } from './customerSales';

export type OwnershipType = 'owned' | 'consignment';
// نوع مالکیت: مالکیت نمایشگاه | امانی

export type ConsignmentStatus =
  | 'pending_intake' // در انتظار دریافت
  | 'in_showroom' // در نمایشگاه
  | 'ready_for_sale' // آماده فروش
  | 'sold' // فروخته‌شده
  | 'pending_settlement' // در انتظار تسویه مالک
  | 'settled' // تسویه شده
  | 'returned' // مرجوع‌شده به مالک
  | 'archived'; // آرشیو

export type CommissionType = 'percentage' | 'fixed' | 'net_price';
// درصدی | مبلغ ثابت | قیمت توافقی / سهم خالص مالک

export interface ConsignmentAgreement {
  id: string; // e.g. "CON-1405-001"
  contractNumber: string; // شماره قرارداد امانی
  vehicleId: string;
  vehicleFullName: string;
  ownerPersonId: string; // لینک به مشتری یا شخص در سامانه
  ownerName: string;
  ownerPhone: string;
  ownerNationalId?: string;
  deliveryToDealershipDate: string; // تاریخ تحویل به نمایشگاه
  startDate: string; // تاریخ شروع امانی
  endDate?: string; // تاریخ پایان امانی
  commissionType: CommissionType;
  commissionValue: number; // درصد (مثلا ۲.۵) یا مبلغ ثابت (مثلا ۵۰,۰۰۰,۰۰۰ تومان)
  agreedMinPrice?: number; // حداقل قیمت مورد توافق مالک
  askingPrice?: number; // قیمت پیشنهادی فروش
  notes?: string;
  status: 'active' | 'sold' | 'returned' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export type SettlementStatus = 'unsettled' | 'partially_settled' | 'fully_settled';
// تسویه نشده | تسویه ناقص | تسویه کامل

export interface OwnerSettlementPayment {
  id: string;
  amount: number; // مبلغ واریزی به مالک (تومان)
  date: string; // تاریخ پرداخت
  method: 'transfer' | 'check' | 'cash'; // پایا / ساتنا / کارت به کارت | چک صیادی | نقدی
  trackingNumber?: string; // شماره پیگیری / ارجاع بانکی
  checkNumber?: string;
  notes?: string;
  receiptUrl?: string; // رسید پرداخت
  createdAt: string;
}

export interface OwnerSettlement {
  id: string; // e.g. "SETTLE-1405-001"
  agreementId: string;
  saleId?: string; // شناسه پرونده فروش در صورت فروش
  vehicleId: string;
  vehicleFullName: string;
  ownerPersonId: string;
  ownerName: string;
  grossSaleAmount: number; // مبلغ کل فروش
  dealershipCommission: number; // سهم یا کمیسیون نمایشگاه
  deductibleExpenseAmount: number; // هزینه‌های پرداخت‌شده توسط نمایشگاه به عهده مالک (قابل کسر)
  netPayableToOwner: number; // مبلغ خالص قابل تسویه = grossSale - commission - deductible
  paidAmount: number; // کل مبلغ پرداخت‌شده تا کنون
  remainingAmount: number; // مانده تسویه
  status: SettlementStatus;
  payments: OwnerSettlementPayment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsignmentReturnRecord {
  id: string;
  agreementId: string;
  vehicleId: string;
  vehicleFullName: string;
  ownerPersonId: string;
  ownerName: string;
  returnDate: string;
  returnTime?: string;
  vehicleConditionAtReturn: string; // وضعیت فنی و ظاهری هنگام عودت
  notes?: string;
  ownerSignature?: DeliveryPartySignature;
  dealershipSignature?: DeliveryPartySignature;
  createdAt: string;
}

// ----------------------------------------------------
// 3-State Handover Checklist (تحویل خودرو امانی و نمایشگاه)
// ----------------------------------------------------

export type ThreeStateCheck = 'present' | 'missing' | 'damaged' | 'uninspected';
// دارد ○ | ندارد ○ | خراب ○ | بررسی‌نشده

export type ChecklistGroup =
  | 'wipers'
  | 'cameras'
  | 'lighting_sensors'
  | 'tools_safety'
  | 'interior_comfort'
  | 'keys_electronics'
  | 'exterior_other';

export interface HandoverChecklistItem {
  id: string;
  title: string;
  group: ChecklistGroup;
  state: ThreeStateCheck;
  quantity: number; // تعداد (مثلا ریموت: ۲)
  quantityDetails?: string; // مثلا "ریموت ۱ سالم، ریموت ۲ خراب"
  notes?: string; // توضیحات
  photoUrl?: string; // عکس ضمیمه برای اثبات
  photoName?: string;
}

// ----------------------------------------------------
// 3D / Framed Vehicle Body Damage Map
// ----------------------------------------------------

export type VehicleBodyView = 'front' | 'rear' | 'left' | 'right' | 'top' | '3d';

export type BodyDamageType =
  | 'impact' // ضربه
  | 'dent' // فرورفتگی
  | 'scratch' // خط و خش
  | 'repaint' // رنگ‌شدگی
  | 'replaced_part' // تعویض قطعه
  | 'crack' // ترک
  | 'broken' // شکستگی
  | 'rust' // زنگ‌زدگی
  | 'other'; // سایر

export type BodyDamageSeverity = 'minor' | 'moderate' | 'severe';
// جزئی | متوسط | شدید

export type VehicleBodyPanel =
  | 'hood' // کاپوت
  | 'roof' // سقف
  | 'trunk' // در صندوق
  | 'front_bumper' // سپر جلو
  | 'rear_bumper' // سپر عقب
  | 'front_left_fender' // گلگیر جلو چپ
  | 'front_right_fender' // گلگیر جلو راست
  | 'rear_left_fender' // گلگیر عقب چپ
  | 'rear_right_fender' // گلگیر عقب راست
  | 'front_left_door' // درب جلو چپ
  | 'front_right_door' // درب جلو راست
  | 'rear_left_door' // درب عقب چپ
  | 'rear_right_door' // درب عقب راست
  | 'left_rocker_panel' // رکاب چپ
  | 'right_rocker_panel' // رکاب راست
  | 'windshield' // شیشه جلو
  | 'rear_windshield' // شیشه عقب
  | 'sunroof' // سانروف
  | 'left_mirror' // آینه چپ
  | 'right_mirror' // آینه راست
  | 'wheel_rim' // رینگ و لاستیک
  | 'other'; // سایر بخش‌ها

export interface VehicleDamageMarker {
  id: string;
  view: VehicleBodyView;
  x: number; // 0-100 percentage or model X
  y: number; // 0-100 percentage or model Y
  z?: number; // 3D depth coordinate
  point3D?: { x: number; y: number; z: number }; // Model-relative 3D coordinate
  normal3D?: { x: number; y: number; z: number }; // Surface normal vector
  panel: VehicleBodyPanel;
  panelLabelFa: string; // نام فارسی پنل (مثلا: "درب جلو چپ")
  damageType: BodyDamageType;
  severity: BodyDamageSeverity;
  notes?: string;
  photos: string[]; // Base64 or attachment URLs (multiple photos per damage)
  createdAt: string;
}

export interface VehicleHandoverInspection {
  id: string; // e.g. "INSP-1405-001"
  vehicleId: string;
  vehicleFullName: string;
  ownershipType: OwnershipType;
  deliveryType: 'consignment_intake' | 'purchase_intake' | 'sales_delivery' | 'return_to_owner';
  inspectionStage: 'intake' | 'delivery'; // هنگام دریافت | هنگام تحویل
  date: string;
  time: string;
  mileage: number;
  fuelLevel?: 'reserve' | '1/4' | '1/2' | '3/4' | 'full';
  color: string;
  plate: string;
  chassisNumber: string;

  // Signatures
  deliveredBy: DeliveryPartySignature;
  receivedBy: DeliveryPartySignature;

  // Equipment Checklist
  checklist: HandoverChecklistItem[];

  // 3D Damage Markers
  damageMarkers: VehicleDamageMarker[];

  // General Photos & Notes
  generalPhotos: { id: string; url: string; title: string }[];
  generalNotes?: string;

  // Status
  status: 'completed' | 'draft';
  createdAt: string;
  finalizedAt?: string;
}
