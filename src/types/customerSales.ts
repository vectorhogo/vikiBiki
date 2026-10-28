export interface Customer {
  id: string; // e.g. "cust-1"
  fileNumber: string; // e.g. "C-1405-00101"
  fullName: string; // نام و نام خانوادگی
  nationalId: string; // کد ملی (۱۰ رقمی)
  phone: string; // شماره تماس اصلی
  phone2?: string; // شماره تماس دوم
  address: string; // آدرس
  postalCode?: string; // کد پستی
  notes?: string; // توضیحات
  tags?: string[]; // برچسب‌ها
  status: 'active' | 'archived';
  createdAt: string; // YYYY/MM/DD
  updatedAt?: string;
}

export type DocumentChecklistStatus = 'delivered' | 'not_delivered' | 'none' | 'needs_review';
// تحویل شد | تحویل نشد | ندارد | نیازمند بررسی

export interface DeliveryDocumentItem {
  id: string;
  title: string;
  status: DocumentChecklistStatus;
  count: number; // تعداد (پیش‌فرض ۱)
  notes?: string;
  fileUrl?: string;
  fileName?: string;
}

export type EquipmentChecklistStatus = 'present' | 'missing' | 'not_delivered';
// موجود | ناموجود | تحویل نشد

export interface EquipmentChecklistItem {
  id: string;
  title: string;
  status: EquipmentChecklistStatus;
  notes?: string;
}

export type VehicleDiagramView = 'front' | 'rear' | 'left' | 'right' | 'top';

export type DamageType = 'scratch' | 'damage' | 'dent' | 'missing_part' | 'note';
// خط و خش | آسیب و شکستگی | فرورفتگی / لیسه | کمبود قطعه | توضیح

export interface VehicleDiagramMarker {
  id: string;
  view: VehicleDiagramView;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  point3D?: { x: number; y: number; z: number };
  normal3D?: { x: number; y: number; z: number };
  type: DamageType;
  description: string;
  severity?: 'minor' | 'moderate' | 'major';
}

export interface DeliveryPhoto {
  id: string;
  view: 'front' | 'rear' | 'left' | 'right' | 'interior' | 'other';
  url: string; // base64 or blob URL
  title: string;
  uploadedAt: string;
}

export interface DeliveryPartySignature {
  name: string;
  phone: string;
  nationalId: string;
  roleOrCompany?: string; // سمت / نمایندگی
  date: string;
  time?: string;
  signatureImage?: string; // Data URL of signature
  signedAt?: string;
}

export interface DeliveryFormA {
  receiverName: string;
  receiverNationalId: string;
  receiverPhone: string;
  receiverAddress?: string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  plateNumber: string;
  checklist: DeliveryDocumentItem[];
  generalNotes?: string;
  deliveredAtDate: string; // YYYY/MM/DD
  deliveredAtTime?: string; // HH:mm
  status: 'completed' | 'draft' | 'pending';
}

export interface DeliveryFormB {
  vehicleName: string;
  modelYear?: string;
  color: string;
  mileageAtDelivery: number; // کارکرد در زمان تحویل
  chassisNumber: string; // شماره شاسی
  plateNumber: string;
  deliveryDate: string; // YYYY/MM/DD
  deliveryTime: string; // HH:mm
  fuelLevel?: 'reserve' | '1/4' | '1/2' | '3/4' | 'full';
  equipmentChecklist: EquipmentChecklistItem[];
  diagramMarkers: VehicleDiagramMarker[];
  photos: DeliveryPhoto[];
  delivererSignature: DeliveryPartySignature;
  receiverSignature: DeliveryPartySignature;
  deliveryNotes?: string;
  status: 'completed' | 'draft' | 'pending';
}

export interface SalePaymentRecord {
  id: string;
  title: string; // پیش‌پرداخت، قسط ۱، چک صیادی و...
  amount: number;
  type: 'cash' | 'transfer' | 'check' | 'pos';
  dueDate: string;
  paymentDate?: string;
  status: 'paid' | 'pending' | 'bounced';
  trackingNumber?: string;
  checkNumber?: string;
  bankName?: string;
  notes?: string;
}

export interface SaleDossierAttachment {
  id: string;
  name: string;
  category: 'contract' | 'identity' | 'vehicle_doc' | 'inspection_sheet' | 'other';
  url: string;
  size?: number;
  uploadedAt: string;
}

export interface SaleTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  timestamp: string;
  type:
    | 'deal_created'
    | 'payment_received'
    | 'form_a_completed'
    | 'form_b_completed'
    | 'vehicle_handed_over'
    | 'note_added';
}

export interface SaleDossier {
  id: string;
  saleNumber: string; // e.g. "S-1405-00101"
  customerId: string; // لینک به مشتری مرجع
  customerName: string;
  vehicleId: string; // لینک به خودرو
  vehicleFullName: string;
  contractNumber: string; // شماره قرارداد / مبایعه‌نامه
  saleDate: string; // تاریخ معامله (YYYY/MM/DD)
  deliveryDate: string; // تاریخ تحویل (YYYY/MM/DD)
  deliveryTime: string; // ساعت تحویل (HH:mm)
  salePrice: number; // مبلغ معامله به تومان
  downPayment: number; // پیش‌پرداخت
  remainingBalance: number; // مانده حساب
  paymentMethod: 'cash' | 'installments' | 'checks' | 'combination';
  payments: SalePaymentRecord[];

  // Phase 08: Ownership & Consignment separation
  ownershipType?: 'owned' | 'consignment'; // پیش‌فرض نمایشگاه
  // If owned:
  purchasePrice?: number;
  dealResultProfit?: number; // سود / زیان معامله خودروی نمایشگاه
  // If consignment:
  consignmentAgreementId?: string;
  ownerPersonId?: string;
  ownerName?: string;
  dealershipCommission?: number; // سهم یا کمیسیون نمایشگاه
  deductibleExpenses?: number; // هزینه‌های کسر شده از مالک
  netPayableToOwner?: number; // مبلغ قابل تسویه با مالک
  ownerSettlementStatus?: 'unsettled' | 'partially_settled' | 'fully_settled';
  ownerSettlementId?: string;

  deliveryFormA: DeliveryFormA;
  deliveryFormB: DeliveryFormB;
  attachments: SaleDossierAttachment[];
  timeline: SaleTimelineEvent[];
  notes?: string;
  status: 'draft' | 'pending_delivery' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}
