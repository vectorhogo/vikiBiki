// Patch 09C: RBAC Access Control Engine & Audit Trail
import { UserRole, PermissionAction, DealershipUser, AuditLogEntry } from '../types/patch09c';

export const ROLE_DEFINITIONS: Record<
  UserRole,
  {
    title: string;
    description: string;
    badgeColor: string;
    permissions: PermissionAction[];
  }
> = {
  admin: {
    title: 'مدیر نمایشگاه',
    description: 'دسترسی نامحدود، مدیریت کاربران، بستن دوره مالی، تأیید و حذف اسناد، بازیابی داده‌ها و تنظیمات سیستمی.',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    permissions: [
      'view_financials',
      'edit_financials',
      'manage_contracts',
      'manage_commissions',
      'manage_investors',
      'manage_vehicles',
      'manage_customers',
      'close_reopen_period',
      'manage_presets',
      'delete_sensitive_records',
      'export_restore_backup',
      'view_sensitive_personal_data',
    ],
  },
  accountant: {
    title: 'حسابدار ارشد',
    description: 'مدیریت حساب‌های بانکی، ثبت هزینه‌ها و درآمدها، وصول اقساط، صدور فاکتور و کاردکس‌ها؛ بدون امکان حذف نهایی یا بستن دوره.',
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    permissions: [
      'view_financials',
      'edit_financials',
      'manage_contracts',
      'manage_commissions',
      'manage_investors',
      'manage_vehicles',
      'manage_customers',
      'manage_presets',
      'export_restore_backup',
      'view_sensitive_personal_data',
    ],
  },
  operator: {
    title: 'کاربر عملیاتی / کارشناس خودرو',
    description: 'ثبت خودروهای ورودی، ثبت کارشناسی و چک‌لیست تحویل، مشاهده پرونده‌ها؛ بدون دسترسی به ارقام سود خالص، ترازها و حذف اسناد.',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    permissions: [
      'manage_vehicles',
      'manage_customers',
      // No view_financials, no edit_financials, no close_reopen_period, no delete_sensitive_records
    ],
  },
};

export const INITIAL_USERS: DealershipUser[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    fullName: 'محمد امین عبداللهی',
    role: 'admin',
    phone: '09121112233',
    isActive: true,
  },
  {
    id: 'user-acc-1',
    username: 'accountant',
    fullName: 'علیرضا حسینی (حسابدار)',
    role: 'accountant',
    phone: '09123334455',
    isActive: true,
  },
  {
    id: 'user-op-1',
    username: 'operator',
    fullName: 'رضا کریمی (کارشناس پذیرش و فنی)',
    role: 'operator',
    phone: '09125556677',
    isActive: true,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '۱۴۰۵/۰۸/۰۱ ۱۱:۳۰',
    userId: 'user-admin-1',
    userName: 'محمد امین عبداللهی',
    userRole: 'admin',
    action: 'افتتاح دوره مالی جدید',
    entityType: 'period',
    entityTitle: 'دوره مالی ۱۴۰۵',
    details: 'ثبت سند افتتاحیه با تراز نقدی و بانکی منطبق با دوره قبل',
  },
  {
    id: 'audit-002',
    timestamp: '۱۴۰۵/۰۸/۰۱ ۱۲:۱۵',
    userId: 'user-admin-1',
    userName: 'محمد امین عبداللهی',
    userRole: 'admin',
    action: 'انتقال وجه بین‌حسابی',
    entityType: 'financial_account',
    entityTitle: 'بانک ملت به صندوق نقدی اصلی',
    details: 'انتقال مبلغ ۳۰,۰۰۰,۰۰۰ تومان بابت شارژ نقدی صندوق روزمره',
  },
  {
    id: 'audit-003',
    timestamp: '۱۴۰۵/۰۸/۰۱ ۱۴:۴۵',
    userId: 'user-acc-1',
    userName: 'علیرضا حسینی',
    userRole: 'accountant',
    action: 'ثبت وصول حق‌العمل کمیسیون',
    entityType: 'contract',
    entityTitle: 'کمیسیون قرارداد مبایعه‌نامه کمری ۲۰۲۵',
    details: 'وصول مبلغ ۲۵,۰۰۰,۰۰۰ تومان از خریدار به حساب پوز ملت',
  },
];

/**
 * Checks if a given role has a specific permission action
 */
export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  const roleDef = ROLE_DEFINITIONS[role];
  if (!roleDef) return false;
  return roleDef.permissions.includes(action);
}

/**
 * Masks sensitive national ID if not authorized
 */
export function maskSensitiveValue(value: string | undefined, hasAccess: boolean): string {
  if (!value) return '—';
  if (hasAccess) return value;
  if (value.length <= 4) return '****';
  return `***${value.slice(-4)}`;
}
