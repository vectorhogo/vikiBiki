// Patch 09C: Vehicle Technical Data, Expiring Documents, Presets, RBAC Access Control, and AI Assistant

export type TransmissionType =
  | 'automatic'
  | 'manual'
  | 'cvt'
  | 'dual_clutch'
  | 'hybrid_ecvt'
  | 'other';

export type FuelType =
  | 'petrol'
  | 'diesel'
  | 'hybrid'
  | 'plugin_hybrid'
  | 'ev'
  | 'cng'
  | 'other';

export interface VehicleTechnicalSpecs {
  trim?: string; // تیپ یا تریم e.g. "XLE", "پرمیوم", "توربو"
  modelYear?: number; // سال ساخت شمسی یا میلادی
  transmission?: TransmissionType | string;
  fuelType?: FuelType | string;
  engineCapacity?: string; // e.g. "2500 cc" or "2.0L"
  iranianChassisNumber?: string; // شماره شاسی ساخت داخل یا پلاک مشخصات
  engineNumber?: string; // شماره موتور
  bodyNumber?: string; // شماره اتاق / بدنه
}

// ----------------------------------------------------
// 2. Expiring Documents (بیمه شخص ثالث، وکالت‌نامه‌ها و مدارک با تاریخ انقضا)
// ----------------------------------------------------

export type DocumentTypeCategory =
  | 'third_party_insurance' // بیمه شخص ثالث
  | 'body_insurance' // بیمه بدنه
  | 'power_of_attorney' // وکالت‌نامه (تعویض پلاک، فروش، کاری)
  | 'technical_inspection' // معاینه فنی
  | 'green_card' // برگ سبز / سند مالکیت
  | 'fuel_card' // کارت سوخت
  | 'tax_clearance' // مفاصا حساب مالیات خودرو
  | 'custom_document'; // سایر مدارک

export type ExpiryAlertLevel = 'expired' | 'critical' | 'urgent' | 'warning' | 'safe';
// expired (منقضی شده) | critical (۱ روز باقی‌مانده) | urgent (کمتر از ۷ روز) | warning (کمتر از ۳۰ روز) | safe (بیش از ۳۰ روز)

export type PoaStatus = 'valid' | 'expired' | 'used' | 'cancelled';
// معتبر | منقضی | استفاده‌شده / اعمال‌شده | باطل‌شده

export interface VehicleExpiringDoc {
  id: string; // e.g. "DOC-EXP-001"
  vehicleId: string;
  vehicleLabel: string; // e.g. "Toyota Camry 2025 (۶۷الف۱۲۳-۲۱)"
  category: DocumentTypeCategory;
  title: string; // e.g. "بیمه‌نامه شخص ثالث بیمه ایران" or "وکالت تعویض پلاک دفتر ۲۴"
  documentNumber: string; // شماره بیمه‌نامه یا شماره سند وکالت
  startDate?: string; // تاریخ صدور / شروع
  expiryDate: string; // تاریخ انقضا / پایان اعتبار (YYYY/MM/DD)
  notes?: string;
  fileAttachmentUrl?: string;
  fileName?: string;
  createdAt: string;

  // Specific to Third-Party Insurance:
  insuranceDetails?: {
    insurerName: string; // نام شرکت بیمه: ایران، آسیا، دانا، البرز و...
    financialCoverageAmount?: number; // تعهد مالی (تومان)
    hasDiscounts?: boolean;
    discountPercent?: number; // درصد تخفیف عدم خسارت
  };

  // Specific to Power of Attorney (وکالت‌نامه):
  poaDetails?: {
    poaType: 'received' | 'issued'; // وکالت دریافتی از فروشنده | وکالت اعطایی به خریدار
    notaryOffice: string; // شماره و شهر دفترخانه e.g. "دفترخانه اسناد رسمی شماره ۱۲۳ تهران"
    grantorName: string; // موکل
    grantorNationalId?: string;
    agentName: string; // وکیل
    agentNationalId?: string;
    subject: string; // موضوع وکالت: تعویض پلاک، فروش قطعی، اسقاط، امور اداری
    status: PoaStatus;
    usedDate?: string; // تاریخ استفاده
  };
}

// ----------------------------------------------------
// 3. Preset Lists (فهرست‌های مرجع و پیش‌تنظیم‌ها)
// ----------------------------------------------------

export type PresetCategory =
  | 'vehicle_brands' // برندهای خودرو
  | 'vehicle_models' // مدل‌ها و تیپ‌ها
  | 'colors' // رنگ‌ها
  | 'transmissions' // گیربکس‌ها
  | 'fuel_types' // انواع سوخت
  | 'insurance_companies' // شرکت‌های بیمه
  | 'expense_categories' // دسته‌بندی‌های هزینه
  | 'document_types' // انواع مدارک خودرو
  | 'commission_categories'; // دسته‌بندی‌های کمیسیون

export interface ReferencePreset {
  id: string;
  category: PresetCategory;
  code: string; // شناسه کوتاه
  name: string; // عنوان نمایشی فارسی
  description?: string;
  isActive: boolean;
  order: number;
  metadata?: Record<string, any>;
}

// ----------------------------------------------------
// 4. Access Control (RBAC) & Audit Log
// ----------------------------------------------------

export type UserRole = 'admin' | 'accountant' | 'operator';
// مدیر | حسابدار | کاربر عملیاتی

export interface DealershipUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export type PermissionAction =
  | 'view_financials' // مشاهده سود، ترازها، حساب‌های بانکی و ارقام حساس
  | 'edit_financials' // ثبت، ویرایش، حذف هزینه، درآمد، تنخواه
  | 'manage_contracts' // ثبت، ویرایش و نهایی‌سازی قراردادها و اقساط
  | 'manage_commissions' // مدیریت و وصول کمیسیون‌ها
  | 'manage_investors' // مدیریت کیف‌پول و تسویه سرمایه‌گذاران
  | 'manage_vehicles' // ثبت و ویرایش مشخصات خودروها و کارشناسی
  | 'manage_customers' // ایجاد و ویرایش پرونده مشتریان
  | 'close_reopen_period' // بستن و بازگشایی دوره مالی و سند افتتاحیه (فقط مدیر)
  | 'manage_presets' // ویرایش فهرست‌های مرجع
  | 'delete_sensitive_records' // حذف پرونده، قرارداد یا ابطال اسناد (فقط مدیر)
  | 'export_restore_backup' // پشتیبان‌گیری و بازیابی داده‌ها
  | 'view_sensitive_personal_data'; // مشاهده کد ملی و تلفن‌های حساس

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g. "ثبت سند افتتاحیه", "انتقال وجه بین‌حسابی", "ویرایش وکالت‌نامه"
  entityType: 'vehicle' | 'contract' | 'financial_account' | 'investor' | 'period' | 'preset' | 'document' | 'backup';
  entityId?: string;
  entityTitle?: string;
  details?: string;
  ipAddress?: string;
}

// ----------------------------------------------------
// 5. AI Operations Assistant (دستیار عملیاتی هوشمند)
// ----------------------------------------------------

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  queryIntent?: string;
  dataSummary?: {
    type: 'overdue_installments' | 'expiring_docs' | 'customer_dossier' | 'consignment_unsettled' | 'bank_balances' | 'investor_report' | 'vehicle_search' | 'general';
    count?: number;
    items?: any[];
  };
  suggestedAction?: AiSuggestedAction;
}

export interface AiSuggestedAction {
  id: string;
  title: string;
  description: string;
  actionType: 'navigate_report' | 'navigate_vehicle' | 'navigate_customer' | 'draft_payment' | 'mark_poa_used' | 'export_pdf';
  targetId?: string;
  targetTab?: string;
  requiresConfirmation: boolean;
  isFinancialMutation: boolean;
  payload?: any;
}
