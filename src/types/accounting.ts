export type InspectionStatus =
  | 'not_inspected' // کارشناسی نشده
  | 'pending_inspection' // در انتظار کارشناسی
  | 'inspected' // کارشناسی انجام شد
  | 'cancelled'; // لغو شد

export type AdvanceStatus =
  | 'open' // باز
  | 'needs_settlement' // نیازمند تسویه
  | 'settled'; // تسویه شد

export type PaymentSource =
  | 'advance' // تنخواه
  | 'personal' // پرداخت شخصی
  | 'company_direct' // پرداخت مستقیم شرکت
  | 'other'; // سایر

export type ReimbursementStatus =
  | 'none'
  | 'needs_reimbursement' // نیازمند بازپرداخت
  | 'reimbursed'; // بازپرداخت شد

export type ExpenseCategory =
  | 'سوخت'
  | 'کارشناسی'
  | 'حمل و یدک‌کش'
  | 'تعمیر و سرویس'
  | 'شستشو و دیتیلینگ'
  | 'پذیرایی و مصرفی'
  | 'کمیسیون'
  | 'عوارض و خلافی'
  | 'سایر'
  | 'دسته‌بندی نشده';

export interface ReceiptAttachment {
  id: string;
  name: string;
  url: string; // base64 or blob url
  size?: number;
  uploadedAt: string;
}

export interface Expense {
  id: string;
  amount: number; // in Toman (pure integer)
  description: string; // بابت
  category: ExpenseCategory;
  personId: string; // شخص
  personName: string;
  paymentSource: PaymentSource; // منبع پرداخت (تنخواه، شخصی، شرکت، سایر)
  reimbursementStatus?: ReimbursementStatus; // وضعیت بازپرداخت برای پرداخت شخصی
  reimbursementAmount?: number; // مبلغ بازپرداخت شده یا نیازمند بازپرداخت
  reimbursementDate?: string; // تاریخ بازپرداخت
  reimbursementNote?: string; // یادداشت بازپرداخت
  vehicleId?: string; // خودرو (اختیاری)
  vehicleLabel?: string;
  cashAdvanceId?: string; // لینک به تنخواه خاص (اختیاری - فقط در صورت منبع تنخواه)
  date: string; // YYYY/MM/DD or ISO date string
  receipts: ReceiptAttachment[];
  hasReceipt: boolean;
  notes?: string;
  status: 'active' | 'archived';
  createdAt: string;

  // Integration compatibility fields (kept internal, invisible in UI)
  externalId?: string;
  syncStatus?: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface SettlementRecord {
  id: string;
  advanceId: string;
  personId: string;
  personName: string;
  advanceAmount: number;
  expenseAmount: number;
  expectedReturn: number;
  actualReturn: number;
  difference: number;
  differenceReason?: string;
  settledAt: string;
  notes?: string;
  createdAt: string;
  isReversed?: boolean;
  reversedAt?: string;
}

export interface CashAdvance {
  id: string;
  personId: string;
  personName: string;
  amount: number; // مبلغ تنخواه (Toman)
  date: string;
  reason: string; // بابت
  notes?: string; // توضیحات
  status: AdvanceStatus;
  settledAt?: string;
  settledAmount?: number;
  createdAt: string;

  // Integration compatibility fields
  externalId?: string;
  syncStatus?: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  fullName: string; // e.g. "Toyota Camry 2025" or "کی ام سی SR6"
  plate: string; // e.g. "۶۷الف۱۲۳ - ۲۱"
  vin: string; // e.g. "KMHDU41DAEU123456"
  color: string;
  year?: number;
  inspectionStatus: InspectionStatus;
  status: 'active' | 'archived';
  createdAt: string;

  // Future main software link fields
  localVehicleId: string;
  externalVehicleId?: string;
  syncStatus?: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  role: string; // سمت: مدیر داخلی، کارشناس فنی، راننده، تحصیل‌دار، حسابدار
  status: 'active' | 'archived';
  createdAt: string;

  // Integration compatibility fields
  externalId?: string;
  syncStatus?: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface ActivityEvent {
  id: string;
  type:
    | 'ExpenseCreated'
    | 'ExpenseUpdated'
    | 'ReceiptAdded'
    | 'AdvanceCreated'
    | 'AdvanceSettled'
    | 'ReimbursementRecorded'
    | 'VehicleCreated'
    | 'InspectionUpdated'
    | 'ExpenseArchived';
  title: string;
  description: string; // e.g. "محمد — ۲,۵۰۰,۰۰۰ تومان — سوخت"
  relatedId?: string;
  timestamp: string;
  actorName?: string;
}

export interface SettlementRecord {
  id: string;
  advanceId: string;
  personId: string;
  personName: string;
  advanceAmount: number;
  expenseAmount: number;
  expectedReturn: number;
  actualReturn: number;
  difference: number;
  differenceReason?: string;
  settledAt: string;
  notes?: string;
  createdAt: string;
}

export interface PersonnelBalance {
  personId: string;
  personName: string;
  role: string;
  totalAdvanced: number; // کل تنخواه دریافتی
  totalExpenses: number; // کل هزینه ثبت‌شده از تنخواه
  remainingBalance: number; // باقیمانده تنخواه (totalAdvanced - totalExpenses)
  personalExpensesTotal: number; // کل هزینه‌های پرداخت شخصی
  needsReimbursementTotal: number; // مبلغ نیازمند بازپرداخت
  openAdvancesCount: number;
}

export interface AccountingMetrics {
  totalActiveCashAdvance: number;
  todayExpenseTotal: number;
  monthlyExpenseTotal: number;
  openAdvancesCount: number;
  missingReceiptCount: number;
  receiptCoveragePct: number;
  needsReimbursementCount: number;
  totalNeedsReimbursementAmount: number;
  pendingReimbursementAmount: number;
  pendingReimbursementCount: number;
  incompleteExpensesCount: number;
  pendingSettlementCount: number;
}
