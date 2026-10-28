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

export type IncomeCategory =
  | 'کمیسیون و حق‌العمل'
  | 'خدمات و کارشناسی'
  | 'بیعانه و قرارداد'
  | 'سود معامله خودرو'
  | 'واریز به صندوق'
  | 'سایر دریافتی‌ها';

export interface Income {
  id: string;
  amount: number; // in Toman
  description: string; // بابت
  category: IncomeCategory;
  personId?: string; // شخص دریافت‌کننده
  personName?: string;
  vehicleId?: string; // خودرو مرتبط (اختیاری)
  vehicleLabel?: string;
  date: string; // YYYY/MM/DD
  notes?: string;
  periodId?: string; // شناسه دوره مالی
  createdAt: string;
}

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
  periodId?: string; // شناسه دوره مالی
  date: string; // YYYY/MM/DD or ISO date string
  receipts: ReceiptAttachment[];
  hasReceipt: boolean;
  notes?: string;
  status: 'active' | 'archived';
  createdAt: string;

  // Phase 08: Consignment Expense Responsibility
  expenseResponsibility?: 'dealership' | 'owner' | 'contract'; // بر عهده نمایشگاه | بر عهده مالک (قابل کسر از تسویه) | طبق قرارداد
  isDeductedFromOwnerSettlement?: boolean;
  ownerSettlementId?: string;

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
  periodId?: string; // شناسه دوره مالی
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
  periodId?: string; // شناسه دوره مالی
  isOpeningBalance?: boolean; // نشان‌دهنده مانده منتقل‌شده از دوره قبل
  sourceAdvanceId?: string; // ارجاع به تنخواه مبدا در دوره قبل
  sourcePeriodId?: string; // دوره مبدا
  openingDocumentId?: string; // سند افتتاحیه مرتبط
  openingAmount?: number; // مبلغ اولیه در شروع دوره
  createdAt: string;

  // Integration compatibility fields
  externalId?: string;
  syncStatus?: 'local' | 'synced' | 'pending' | 'conflict';
}

export interface Vehicle {
  id: string;
  brand: string;
  make?: string; // alias for brand
  model: string;
  fullName: string; // e.g. "Toyota Camry 2025" or "کی ام سی SR6"
  plate: string; // e.g. "۶۷الف۱۲۳ - ۲۱"
  vin: string; // e.g. "KMHDU41DAEU123456"
  color: string;
  year?: number;
  inspectionStatus: InspectionStatus;
  status: 'active' | 'archived';
  createdAt: string;

  // Phase 08: Ownership & Consignment
  ownershipType?: 'owned' | 'consignment'; // مالکیت نمایشگاه | امانی (پیش‌فرض نمایشگاه)
  purchasePrice?: number; // قیمت خرید برای خودروهای نمایشگاه
  purchaseDate?: string; // تاریخ خرید
  sellerName?: string; // فروشنده / تامین‌کننده
  sellerPhone?: string;

  // Consignment fields
  consignmentAgreementId?: string; // شناسه قرارداد امانی مرتبط
  ownerPersonId?: string; // شناسه مالک خودرو
  ownerName?: string; // نام مالک
  ownerPhone?: string; // تلفن مالک
  ownerNationalId?: string;
  askingPrice?: number; // قیمت پیشنهادی فروش امانی
  agreedMinPrice?: number; // حداقل قیمت مورد توافق
  consignmentStatus?: 'pending_intake' | 'in_showroom' | 'ready_for_sale' | 'sold' | 'pending_settlement' | 'settled' | 'returned' | 'archived';
  intakeInspectionId?: string; // شناسه کارشناسی و تحویل بدنه هنگام ورود

  // Patch 09C: Technical Data
  trim?: string; // تیپ یا تریم e.g. "XLE", "پرمیوم"
  transmission?: string; // گیربکس
  fuelType?: string; // نوع سوخت
  engineCapacity?: string; // حجم موتور e.g. "2500 cc"
  iranianChassisNumber?: string; // شماره شاسی ایران
  engineNumber?: string; // شماره موتور
  bodyNumber?: string; // شماره اتاق / بدنه

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
    | 'ExpenseArchived'
    | 'OpeningDocumentCreated'
    | 'PeriodClosed';
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
  todayIncomeTotal: number;
  todayNetBalance: number;
  todayExpenseCount: number;
  todayIncomeCount: number;
  monthlyExpenseTotal: number;
  monthlyIncomeTotal?: number;
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

// ---------------------------------------------------------
// Accounting Period & Opening Document Interfaces
// ---------------------------------------------------------

export type PeriodStatus = 'active' | 'closed' | 'archived';

export interface PeriodSnapshot {
  closingDate: string;
  totalExpenses: number;
  totalIncomes: number;
  netBalance: number;
  totalAdvances: number;
  outstandingAdvances: number;
  outstandingReimbursements: number;
  cashOpening: number;
  bankOpening: number;
  expenseCount: number;
  incomeCount: number;
  receiptCount: number;
  vehiclesCount: number;
  personnelCount: number;
}

export interface PeriodReopenRecord {
  reopenedAt: string;
  reason: string;
  actorName?: string;
  closedAt?: string;
}

export interface AccountingPeriod {
  id: string; // e.g. "period_1405"
  title: string; // e.g. "سال ۱۴۰۵"
  startDate: string; // e.g. "۱۴۰۵/۰۱/۰۱"
  endDate?: string;
  status: PeriodStatus;
  openingDocumentId?: string;
  isLocked?: boolean;
  notes?: string;
  closingNotes?: string;
  createdAt: string;
  closedAt?: string;
  snapshot?: PeriodSnapshot;
  reopenHistory?: PeriodReopenRecord[];
}

export interface TransferredAdvanceItem {
  personId: string;
  personName: string;
  advanceId?: string;
  originalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  action: 'transfer' | 'settle';
}

export interface TransferredReimbursementItem {
  personId: string;
  personName: string;
  amount: number;
  expenseCount: number;
  action: 'transfer' | 'settle';
  settledAmount?: number;
  settledAt?: string;
}

export interface VehicleOpeningSummary {
  vehicleId: string;
  vehicleLabel: string;
  totalExpensesBefore: number;
}

export interface OtherOpeningBalance {
  id: string;
  title: string;
  amount: number;
  type: 'asset' | 'liability';
  notes?: string;
}

export interface OpeningDocument {
  id: string;
  periodId: string;
  periodTitle: string;
  startDate: string;
  notes?: string;
  cashBalance: number; // موجودی نقد در شروع دوره
  bankBalance: number; // موجودی حساب / بانک
  transferredAdvances: TransferredAdvanceItem[];
  transferredReimbursements: TransferredReimbursementItem[];
  vehicleSummaries?: VehicleOpeningSummary[];
  otherBalances?: OtherOpeningBalance[];
  totalTransferredAdvanceAmount: number;
  totalTransferredReimbursementAmount: number;
  previousPeriodId?: string;
  previousPeriodClosingCash?: number;
  previousPeriodClosingBank?: number;
  reconciliationStatus?: 'matched' | 'discrepancy';
  reconciliationDifference?: number;
  correctionHistory?: {
    editedAt: string;
    reason: string;
    previousValues?: any;
  }[];
  createdAt: string;
  createdBy?: string;
  status: 'active' | 'archived';
}

export interface CreateOpeningDocumentInput {
  title: string; // عنوان دوره e.g. "سال ۱۴۰۶"
  periodTitle?: string; // alias
  startDate: string; // تاریخ شروع e.g. "۱۴۰۵/۰۷/۰۱"
  endDate?: string;
  notes?: string;
  cashBalance: number;
  bankBalance: number;
  transferredAdvances: TransferredAdvanceItem[];
  transferredReimbursements: TransferredReimbursementItem[];
  vehicleSummaries?: VehicleOpeningSummary[];
  otherBalances?: OtherOpeningBalance[];
  previousPeriodClosingCash?: number;
  previousPeriodClosingBank?: number;
}

export interface PeriodIntegrityIssue {
  id: string;
  type: 'period_mismatch' | 'missing_period' | 'invalid_balance' | 'broken_ref' | 'duplicate_opening';
  title: string;
  description: string;
  severity: 'warning' | 'error';
  relatedId?: string;
}

export interface PeriodIntegrityResult {
  status: 'clean' | 'issues_found';
  checkedAt: string;
  totalRecordsChecked: number;
  issueCount: number;
  issues: PeriodIntegrityIssue[];
}

export interface SmartOpeningSuggestions {
  suggestedCash: number;
  suggestedBank: number;
  suggestedAdvances: TransferredAdvanceItem[];
  suggestedReimbursements: TransferredReimbursementItem[];
  previousPeriodExpensesTotal: number;
  previousPeriodIncomesTotal: number;
  previousPeriodOutstandingAdvances: number;
  previousPeriodOutstandingReimbursements: number;
}

export interface ReconciliationComparisonItem {
  title: string;
  previousClosing: number;
  newOpening: number;
  difference: number;
  status: 'matched' | 'discrepancy';
}

export interface ReconciliationResult {
  items: ReconciliationComparisonItem[];
  overallStatus: 'matched' | 'discrepancy';
  totalDiscrepancy: number;
  warnings?: string[];
}

export * from './customerSales';
export * from './consignment';
export * from './finance09b';
export * from './patch09c';
