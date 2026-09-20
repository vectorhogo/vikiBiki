import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Expense,
  CashAdvance,
  Vehicle,
  Person,
  ActivityEvent,
  PersonnelBalance,
  ReceiptAttachment,
  InspectionStatus,
  PaymentSource,
  ReimbursementStatus,
  ExpenseCategory,
  SettlementRecord,
  AccountingMetrics,
} from '../types/accounting';
import {
  INITIAL_EXPENSES,
  INITIAL_CASH_ADVANCES,
  INITIAL_VEHICLES,
  INITIAL_PERSONNEL,
  INITIAL_ACTIVITIES,
} from '../data/initialAccountingData';
import { DEALERSHIP_CURRENT_DATE, formatToman, findPotentialDuplicate } from '../utils/formatters';
import {
  generateRandomBase32Secret,
  verifyTotpCode,
  loadAndDecryptSecret,
  encryptAndSaveSecret,
  getOrCreateDeviceId,
  loadPersistedLease,
  savePersistedLease,
  createNew24HourLease,
} from '../utils/security';
import {
  createConsistentBackupZip,
  restoreFromBackupZip,
  getBackupCatalog,
  calculateStorageMetrics,
  findDuplicateReceipt,
  StorageMetrics,
  FullDatabasePayload,
} from '../utils/backupEngine';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

const INITIAL_SETTLEMENTS: SettlementRecord[] = [
  {
    id: 'set-1',
    advanceId: 'adv-3',
    personId: 'per-3',
    personName: 'رضا نادری',
    advanceAmount: 8000000,
    expenseAmount: 8000000,
    expectedReturn: 0,
    actualReturn: 0,
    difference: 0,
    settledAt: '۱۴۰۵/۰۶/۲۴',
    notes: 'تسویه کامل هزینه‌های کفی و یدک‌کش',
    createdAt: '۱۴۰۵/۰۶/۲۴',
  },
];

export interface AddExpenseInput {
  amount: number;
  description?: string;
  category?: ExpenseCategory | 'دسته‌بندی نشده';
  personId: string;
  personName?: string;
  paymentSource?: PaymentSource;
  reimbursementStatus?: ReimbursementStatus;
  reimbursementAmount?: number;
  vehicleId?: string;
  vehicleLabel?: string;
  cashAdvanceId?: string;
  date?: string;
  receipts?: ReceiptAttachment[];
  notes?: string;
}

interface AccountingContextType {
  expenses: Expense[];
  cashAdvances: CashAdvance[];
  settlements: SettlementRecord[];
  settlementRecords: SettlementRecord[];
  vehicles: Vehicle[];
  personnel: Person[];
  activities: ActivityEvent[];
  toasts: Toast[];

  // Derived metrics
  personnelBalances: PersonnelBalance[];
  metrics: AccountingMetrics;
  needsAttentionItems: { text: string; actionTab?: string; count?: number; filterType?: string }[];

  // Operations
  addExpense: (
    expense: AddExpenseInput,
    ignoreDuplicate?: boolean
  ) => { success: boolean; duplicateWarning?: Expense; error?: string };
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  recordReimbursement: (
    expenseId: string,
    amount: number,
    date: string,
    note?: string
  ) => { success: boolean; error?: string };
  archiveExpense: (id: string) => void;
  addReceiptToExpense: (expenseId: string, receipt: Omit<ReceiptAttachment, 'id' | 'uploadedAt'>) => void;
  removeReceiptFromExpense: (expenseId: string, receiptId: string) => void;

  addCashAdvance: (advance: Omit<CashAdvance, 'id' | 'createdAt' | 'status'>) => void;
  settleCashAdvance: (id: string) => void;
  settleCashAdvanceWithDetails: (
    advanceId: string,
    actualReturn: number,
    differenceReason?: string,
    notes?: string
  ) => { success: boolean; error?: string };
  reverseSettlement: (settlementId: string) => void;

  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'status' | 'localVehicleId'>) => void;
  updateVehicleInspection: (id: string, inspectionStatus: InspectionStatus) => void;
  archiveVehicle: (id: string) => void;

  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'status'>) => void;
  archivePerson: (id: string) => void;

  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // 24-Hour Access & Security
  isUnlocked: boolean;
  isConfigured: boolean;
  activationSecondsLeft: number;
  formatActivationTime: () => string;
  unlockWithTotp: (code: string) => Promise<{ success: boolean; error?: string }>;
  setupTotp: (secret: string) => Promise<void>;
  lockApplication: () => void;
  lockoutRemainingSec: number;
  currentTotpSecret: string | null;
  clockTampered: boolean;

  // Auto-Save, Persistence & Backup
  saveError: string | null;
  lastCheckpointTime: string | null;
  lastBackupInfo: { date: string; status: 'valid' | 'failed' | 'corrupted' } | null;
  storageMetrics: StorageMetrics;
  createManualBackup: () => Promise<{ success: boolean; filename?: string; error?: string }>;
  restoreBackup: (file: File) => Promise<{ success: boolean; error?: string }>;
  checkDuplicateReceipt: (base64: string) => Promise<{ isDuplicate: boolean; matchedExpense?: Expense; receiptName?: string }>;
  resetAllData: () => void;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'auto_abdollahi_accounting_v3';

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial seed
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_advances`);
    return saved ? JSON.parse(saved) : INITIAL_CASH_ADVANCES;
  });

  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settlements`);
    return saved ? JSON.parse(saved) : INITIAL_SETTLEMENTS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vehicles`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [personnel, setPersonnel] = useState<Person[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_personnel`);
    return saved ? JSON.parse(saved) : INITIAL_PERSONNEL;
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_activities`);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // 24-Hour Access Lease & Security State
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [currentTotpSecret, setCurrentTotpSecret] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [activationSecondsLeft, setActivationSecondsLeft] = useState<number>(86400);
  const [lastTrustedTime, setLastTrustedTime] = useState<number>(Date.now());
  const [clockTampered, setClockTampered] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastCheckpointTime, setLastCheckpointTime] = useState<string | null>(null);

  const [lastBackupInfo, setLastBackupInfo] = useState<{ date: string; status: 'valid' | 'failed' | 'corrupted' } | null>(() => {
    const catalog = getBackupCatalog();
    if (catalog.length > 0 && catalog[0]) {
      return {
        date: new Date(catalog[0].createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        status: catalog[0].manifest.status,
      };
    }
    return null;
  });

  // Security Initialization on mount
  useEffect(() => {
    let isMounted = true;
    const initSecurity = async () => {
      let secret = await loadAndDecryptSecret(deviceId);
      if (!secret) {
        secret = generateRandomBase32Secret(20);
        await encryptAndSaveSecret(secret, deviceId);
      }
      if (!isMounted) return;
      setCurrentTotpSecret(secret);
      setIsConfigured(true);

      const lease = loadPersistedLease();
      const now = Date.now();

      // Clock rollback protection
      if (now < lease.lastTrustedTime - 120_000) {
        setClockTampered(true);
        setIsUnlocked(false);
        savePersistedLease(lease.activatedAt, lease.expiresAt, lease.lastTrustedTime);
        return;
      }

      if (!lease.expiresAt || !lease.activatedAt) {
        // Initial setup: create fresh 24h lease
        const newLease = createNew24HourLease(deviceId);
        setIsUnlocked(true);
        const secs = Math.floor((newLease.expiresAt - now) / 1000);
        setActivationSecondsLeft(Math.max(0, secs));
        setLastTrustedTime(now);
      } else if (now >= lease.expiresAt) {
        // Expired lease -> Lock app
        setIsUnlocked(false);
        setActivationSecondsLeft(0);
        setLastTrustedTime(Math.max(lease.lastTrustedTime, now));
      } else {
        // Active lease
        setIsUnlocked(true);
        const secs = Math.floor((lease.expiresAt - now) / 1000);
        setActivationSecondsLeft(Math.max(0, secs));
        const trusted = Math.max(lease.lastTrustedTime, now);
        setLastTrustedTime(trusted);
        savePersistedLease(lease.activatedAt, lease.expiresAt, trusted);
      }
    };

    initSecurity();
    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  // Monotonic Timer & Continuous Lease Verification
  useEffect(() => {
    const interval = setInterval(() => {
      const lease = loadPersistedLease();
      const now = Date.now();

      // Clock rollback protection: if clock moved backwards by > 2 minutes
      if (now < lease.lastTrustedTime - 120_000) {
        setClockTampered(true);
        setIsUnlocked(false);
        return;
      }

      const trustedNow = Math.max(lease.lastTrustedTime, now);
      setLastTrustedTime(trustedNow);

      if (lease.expiresAt) {
        savePersistedLease(lease.activatedAt, lease.expiresAt, trustedNow);
        const diffSecs = Math.floor((lease.expiresAt - trustedNow) / 1000);
        if (diffSecs <= 0) {
          setActivationSecondsLeft(0);
          if (isUnlocked) {
            setIsUnlocked(false);
          }
        } else {
          setActivationSecondsLeft(diffSecs);
        }
      }

      // Check rate-limit lockout
      const lockoutUntil = parseInt(localStorage.getItem('aa_sec_lockout_until') || '0', 10);
      if (lockoutUntil > now) {
        setLockoutRemainingSec(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        setLockoutRemainingSec(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isUnlocked]);

  const formatActivationTime = () => {
    const hours = Math.floor(activationSecondsLeft / 3600);
    const mins = Math.floor((activationSecondsLeft % 3600) / 60);
    const secs = activationSecondsLeft % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Safe Automatic Persistence with Error Detection
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اطلاعات با مشکل مواجه شد.');
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_advances`, JSON.stringify(cashAdvances));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اطلاعات با مشکل مواجه شد.');
    }
  }, [cashAdvances]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settlements`, JSON.stringify(settlements));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اطلاعات با مشکل مواجه شد.');
    }
  }, [settlements]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_vehicles`, JSON.stringify(vehicles));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اطلاعات با مشکل مواجه شد.');
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_personnel`, JSON.stringify(personnel));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اطلاعات با مشکل مواجه شد.');
    }
  }, [personnel]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_activities`, JSON.stringify(activities));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اطلاعات با مشکل مواجه شد.');
    }
  }, [activities]);

  // Hourly Lightweight Auto-Save Checkpoint
  useEffect(() => {
    const hourlyCheckpoint = async () => {
      try {
        const currentPayload: FullDatabasePayload = {
          version: '3.0.0',
          exportedAt: new Date().toISOString(),
          expenses,
          cashAdvances,
          settlements,
          vehicles,
          personnel,
          activities,
        };
        await createConsistentBackupZip(currentPayload, 'hourly_checkpoint');
        const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        setLastCheckpointTime(timeStr);
        setLastBackupInfo({ date: `امروز — ${timeStr}`, status: 'valid' });
      } catch (err) {
        console.error('Hourly checkpoint failed', err);
      }
    };

    // First checkpoint after 60 mins
    const interval = setInterval(hourlyCheckpoint, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [expenses, cashAdvances, settlements, vehicles, personnel, activities]);

  // Safe Backup on Close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_advances`, JSON.stringify(cashAdvances));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_settlements`, JSON.stringify(settlements));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_vehicles`, JSON.stringify(vehicles));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_personnel`, JSON.stringify(personnel));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_activities`, JSON.stringify(activities));
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [expenses, cashAdvances, settlements, vehicles, personnel, activities]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addActivity = (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newAct: ActivityEvent = {
      ...event,
      id: `act-${Date.now()}`,
      timestamp: 'لحظاتی پیش',
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 29)]);
  };

  // Strictly derived personnel balances:
  // ONLY expenses where paymentSource === 'advance' and cashAdvanceId matches an active advance reduce the advance.
  const personnelBalances = useMemo<PersonnelBalance[]>(() => {
    return personnel
      .filter((p) => p.status === 'active')
      .map((p) => {
        // sum of non-settled advances for this person
        const personAdvances = cashAdvances.filter((a) => a.personId === p.id && a.status !== 'settled');
        const totalAdvanced = personAdvances.reduce((sum, a) => sum + a.amount, 0);

        const activeAdvanceIds = new Set(personAdvances.map((a) => a.id));

        // only active expenses from advances
        const advanceExpenses = expenses.filter(
          (e) =>
            e.status === 'active' &&
            e.personId === p.id &&
            e.paymentSource === 'advance' &&
            e.cashAdvanceId &&
            activeAdvanceIds.has(e.cashAdvanceId)
        );

        const totalExpenses = advanceExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBalance = Math.max(0, totalAdvanced - totalExpenses);

        // Personal expenses
        const personalExpenses = expenses.filter(
          (e) => e.status === 'active' && e.personId === p.id && e.paymentSource === 'personal'
        );
        const personalExpensesTotal = personalExpenses.reduce((sum, e) => sum + e.amount, 0);

        const needsReimbursementTotal = personalExpenses
          .filter((e) => e.reimbursementStatus === 'needs_reimbursement')
          .reduce((sum, e) => sum + (e.reimbursementAmount ?? e.amount), 0);

        return {
          personId: p.id,
          personName: p.name,
          role: p.role,
          totalAdvanced,
          totalExpenses,
          remainingBalance,
          personalExpensesTotal,
          needsReimbursementTotal,
          openAdvancesCount: personAdvances.length,
        };
      });
  }, [personnel, cashAdvances, expenses]);

  // Key Dashboard & Report Metrics
  const metrics = useMemo<AccountingMetrics>(() => {
    // 1. موجودی تنخواه: Total active cash currently held by personnel
    const totalActiveCashAdvance = personnelBalances.reduce((acc, p) => acc + p.remainingBalance, 0);

    // 2. هزینه امروز: Total expenses recorded today
    const activeExpenses = expenses.filter((e) => e.status === 'active');
    const todayExpenses = activeExpenses.filter(
      (e) => e.date === DEALERSHIP_CURRENT_DATE || e.date === '1405/06/29'
    );
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. هزینه این ماه: Total expenses in current month
    const monthlyExpenses = activeExpenses.filter(
      (e) => e.date.startsWith('۱۴۰۵/۰۶') || e.date.startsWith('1405/06')
    );
    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. در انتظار تسویه: Number of open or needs_settlement cash advances
    const pendingSettlementCount = cashAdvances.filter(
      (a) => a.status === 'needs_settlement' || a.status === 'open'
    ).length;

    // 5. نیازمند رسید: Expenses without a receipt
    const missingReceiptCount = activeExpenses.filter((e) => !e.hasReceipt || e.receipts.length === 0).length;

    // 6. پوشش رسید: % of expense volume with receipts
    const totalExpenseAmount = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const receiptedAmount = activeExpenses
      .filter((e) => e.hasReceipt && e.receipts.length > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    const receiptCoveragePct =
      totalExpenseAmount > 0 ? Math.round((receiptedAmount / totalExpenseAmount) * 100) : 100;

    // 7. نیازمند بازپرداخت: Personal expenses awaiting reimbursement
    const personalNeedsReimb = activeExpenses.filter(
      (e) => e.paymentSource === 'personal' && e.reimbursementStatus === 'needs_reimbursement'
    );
    const needsReimbursementCount = personalNeedsReimb.length;
    const totalNeedsReimbursementAmount = personalNeedsReimb.reduce(
      (sum, e) => sum + (e.reimbursementAmount ?? e.amount),
      0
    );

    // 8. هزینه‌های ناقص: missing category (دسته‌بندی نشده), or missing receipt
    const incompleteExpensesCount = activeExpenses.filter(
      (e) =>
        e.category === 'دسته‌بندی نشده' ||
        !e.hasReceipt ||
        !e.description.trim() ||
        (e.paymentSource === 'personal' && !e.reimbursementStatus)
    ).length;

    return {
      totalActiveCashAdvance,
      todayExpenseTotal,
      monthlyExpenseTotal,
      openAdvancesCount: pendingSettlementCount,
      missingReceiptCount,
      receiptCoveragePct,
      needsReimbursementCount,
      totalNeedsReimbursementAmount,
      pendingReimbursementAmount: totalNeedsReimbursementAmount,
      pendingReimbursementCount: needsReimbursementCount,
      incompleteExpensesCount,
      pendingSettlementCount,
    };
  }, [personnelBalances, expenses, cashAdvances]);

  // "نیازمند پیگیری" (Needs Attention) items
  const needsAttentionItems = useMemo(() => {
    const items: { text: string; actionTab?: string; count?: number; filterType?: string }[] = [];

    if (metrics.missingReceiptCount > 0) {
      items.push({
        text: `${metrics.missingReceiptCount} هزینه بدون رسید ثبت شده`,
        actionTab: 'expenses',
        filterType: 'missing_receipt',
        count: metrics.missingReceiptCount,
      });
    }

    if (metrics.needsReimbursementCount > 0) {
      items.push({
        text: `${metrics.needsReimbursementCount} هزینه شخصی نیازمند بازپرداخت`,
        actionTab: 'reports',
        filterType: 'reimbursements',
        count: metrics.needsReimbursementCount,
      });
    }

    if (metrics.incompleteExpensesCount > 0) {
      items.push({
        text: `${metrics.incompleteExpensesCount} هزینه نیازمند تکمیل اطلاعات یا سرفصل`,
        actionTab: 'reports',
        filterType: 'incomplete',
        count: metrics.incompleteExpensesCount,
      });
    }

    const needsSettlementAdvances = cashAdvances.filter((a) => a.status === 'needs_settlement');
    if (needsSettlementAdvances.length > 0) {
      items.push({
        text: `${needsSettlementAdvances.length} تنخواه نیازمند تسویه قطعی`,
        actionTab: 'advances',
        filterType: 'settlement',
        count: needsSettlementAdvances.length,
      });
    }

    const pendingInspections = vehicles.filter(
      (v) => v.status === 'active' && v.inspectionStatus === 'pending_inspection'
    );
    if (pendingInspections.length > 0) {
      items.push({
        text: `${pendingInspections.length} خودرو در انتظار کارشناسی رنگ و فنی`,
        actionTab: 'vehicles',
        count: pendingInspections.length,
      });
    }

    return items;
  }, [metrics, cashAdvances, vehicles]);

  // Operations
  const addExpense = (
    expenseData: AddExpenseInput,
    ignoreDuplicate: boolean = false
  ) => {
    // 1. Data integrity check: Minimum required is Person, Amount, Date
    if (!expenseData.amount || expenseData.amount <= 0) {
      showToast('مبلغ هزینه باید بزرگتر از صفر باشد', 'error');
      return { success: false, error: 'مبلغ هزینه باید بزرگتر از صفر باشد' };
    }
    if (!expenseData.personId) {
      showToast('لطفاً شخص پرداخت‌کننده را انتخاب کنید', 'error');
      return { success: false, error: 'انتخاب شخص الزامی است' };
    }

    const paymentSource: PaymentSource = expenseData.paymentSource || (expenseData.cashAdvanceId ? 'advance' : 'company_direct');
    let cashAdvanceId = expenseData.cashAdvanceId;

    // Rule: if payment source is NOT advance, cashAdvanceId must be empty
    if (paymentSource !== 'advance') {
      cashAdvanceId = undefined;
    }

    // Rule: If payment source is advance, verify advance exists and has balance
    if (paymentSource === 'advance' && cashAdvanceId) {
      const adv = cashAdvances.find((a) => a.id === cashAdvanceId);
      if (adv) {
        if (adv.status === 'settled') {
          showToast('این تنخواه قبلاً تسویه شده است', 'error');
          return { success: false, error: 'این تنخواه قبلاً تسویه شده است' };
        }

        // Calculate remaining balance of this specific advance
        const used = expenses
          .filter((e) => e.status === 'active' && e.cashAdvanceId === adv.id)
          .reduce((sum, e) => sum + e.amount, 0);
        const rem = adv.amount - used;

        if (expenseData.amount > rem) {
          return {
            success: false,
            error: 'مبلغ این هزینه از مانده تنخواه بیشتر است. می‌توانید هزینه را خارج از تنخواه یا به صورت مستقیم ثبت کنید.',
          };
        }
      }
    }

    // Resolve person name
    const person = personnel.find((p) => p.id === expenseData.personId);
    const personName = expenseData.personName || person?.name || 'شخص نامشخص';

    // Resolve vehicle label
    let vehicleLabel = expenseData.vehicleLabel;
    if (expenseData.vehicleId && !vehicleLabel) {
      const v = vehicles.find((veh) => veh.id === expenseData.vehicleId);
      if (v) vehicleLabel = v.fullName;
    }

    const description = (expenseData.description && expenseData.description.trim()) || 'هزینه جاری';
    const category: ExpenseCategory | 'دسته‌بندی نشده' = expenseData.category || 'دسته‌بندی نشده';
    const date = expenseData.date || DEALERSHIP_CURRENT_DATE;

    // 2. Duplicate warning check
    if (!ignoreDuplicate) {
      const activeExpenses = expenses.filter((e) => e.status === 'active');
      const duplicate = findPotentialDuplicate(activeExpenses, {
        personId: expenseData.personId,
        amount: expenseData.amount,
        date,
        description,
      });

      if (duplicate) {
        return { success: false, duplicateWarning: duplicate };
      }
    }

    // Personal expense reimbursement status
    let reimbursementStatus: ReimbursementStatus | undefined = expenseData.reimbursementStatus;
    let reimbursementAmount = expenseData.reimbursementAmount;
    if (paymentSource === 'personal') {
      reimbursementStatus = reimbursementStatus || 'needs_reimbursement';
      reimbursementAmount = reimbursementAmount ?? expenseData.amount;
    } else {
      reimbursementStatus = 'none';
      reimbursementAmount = 0;
    }

    const receipts = expenseData.receipts || [];
    const hasReceipt = receipts.length > 0;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      amount: expenseData.amount,
      description,
      category,
      personId: expenseData.personId,
      personName,
      paymentSource,
      reimbursementStatus,
      reimbursementAmount,
      vehicleId: expenseData.vehicleId,
      vehicleLabel,
      cashAdvanceId,
      date,
      receipts,
      hasReceipt,
      notes: expenseData.notes,
      status: 'active',
      createdAt: `${date} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
      syncStatus: 'local',
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Toast feedback
    if (paymentSource === 'personal') {
      showToast('هزینه شخصی ثبت شد (نیازمند بازپرداخت)', 'info');
    } else if (!hasReceipt) {
      showToast('هزینه ثبت شد (بدون رسید)', 'warning');
    } else {
      showToast('هزینه با موفقیت ثبت شد', 'success');
    }

    // Log activity
    addActivity({
      type: 'ExpenseCreated',
      title: 'ثبت هزینه',
      description: `${newExpense.personName} — ${formatToman(newExpense.amount)} — ${newExpense.description}`,
      relatedId: newExpense.id,
      actorName: newExpense.personName,
    });

    return { success: true };
  };

  // Update existing expense without duplicating
  const updateExpense = (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          if (updates.receipts !== undefined) {
            updated.hasReceipt = updates.receipts.length > 0;
          }
          return updated;
        }
        return e;
      })
    );
    showToast('اطلاعات هزینه بروزرسانی شد', 'success');
  };

  // Record reimbursement for personal expense with safety check
  const recordReimbursement = (
    expenseId: string,
    amount: number,
    date: string,
    note?: string
  ): { success: boolean; error?: string } => {
    const exp = expenses.find((e) => e.id === expenseId);
    if (!exp) return { success: false, error: 'هزینه یافت نشد' };

    if (exp.paymentSource !== 'personal') {
      return { success: false, error: 'این هزینه پرداخت شخصی نبوده است' };
    }

    if (amount <= 0) {
      return { success: false, error: 'مبلغ بازپرداخت باید بزرگتر از صفر باشد' };
    }

    // Reimbursement safety: amount cannot exceed expense amount
    if (amount > exp.amount) {
      return { success: false, error: 'مبلغ بازپرداخت نمی‌تواند بیشتر از مبلغ هزینه باشد.' };
    }

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              reimbursementStatus: 'reimbursed',
              reimbursementAmount: amount,
              reimbursementDate: date || DEALERSHIP_CURRENT_DATE,
              reimbursementNote: note,
            }
          : e
      )
    );

    showToast(`بازپرداخت مبلغ ${formatToman(amount)} با موفقیت ثبت شد`, 'success');

    addActivity({
      type: 'ExpenseUpdated',
      title: 'ثبت بازپرداخت',
      description: `${exp.personName} — بازپرداخت ${formatToman(amount)} انجام شد`,
      relatedId: expenseId,
      actorName: exp.personName,
    });

    return { success: true };
  };

  const archiveExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'archived' } : e))
    );
    showToast('هزینه با موفقیت آرشیو شد', 'info');
    if (exp) {
      addActivity({
        type: 'ExpenseArchived',
        title: 'آرشیو هزینه',
        description: `هزینه ${formatToman(exp.amount)} (${exp.description}) آرشیو شد`,
        relatedId: id,
      });
    }
  };

  const addReceiptToExpense = (
    expenseId: string,
    receiptData: Omit<ReceiptAttachment, 'id' | 'uploadedAt'>
  ) => {
    const newReceipt: ReceiptAttachment = {
      ...receiptData,
      id: `rec-${Date.now()}`,
      uploadedAt: DEALERSHIP_CURRENT_DATE,
    };

    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === expenseId) {
          const updatedReceipts = [...e.receipts, newReceipt];
          return {
            ...e,
            receipts: updatedReceipts,
            hasReceipt: true,
          };
        }
        return e;
      })
    );

    showToast('رسید با موفقیت اضافه شد', 'success');
    const exp = expenses.find((e) => e.id === expenseId);
    addActivity({
      type: 'ReceiptAdded',
      title: 'افزودن رسید',
      description: `${exp?.vehicleLabel || exp?.description || 'هزینه'} — رسید ضمیمه شد`,
      relatedId: expenseId,
    });
  };

  const removeReceiptFromExpense = (expenseId: string, receiptId: string) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === expenseId) {
          const updatedReceipts = e.receipts.filter((r) => r.id !== receiptId);
          return {
            ...e,
            receipts: updatedReceipts,
            hasReceipt: updatedReceipts.length > 0,
          };
        }
        return e;
      })
    );
    showToast('رسید حذف شد', 'info');
  };

  const addCashAdvance = (advanceData: Omit<CashAdvance, 'id' | 'createdAt' | 'status'>) => {
    if (advanceData.amount <= 0) {
      showToast('مبلغ تنخواه باید بزرگتر از صفر باشد', 'error');
      return;
    }

    const newAdvance: CashAdvance = {
      ...advanceData,
      id: `adv-${Date.now()}`,
      status: 'open',
      createdAt: advanceData.date,
      syncStatus: 'local',
    };

    setCashAdvances((prev) => [newAdvance, ...prev]);
    showToast('تنخواه با موفقیت ثبت شد', 'success');

    addActivity({
      type: 'AdvanceCreated',
      title: 'تنخواه جدید',
      description: `${newAdvance.personName} — ${formatToman(newAdvance.amount)} تنخواه ثبت شد`,
      relatedId: newAdvance.id,
      actorName: newAdvance.personName,
    });
  };

  const settleCashAdvance = (id: string) => {
    const adv = cashAdvances.find((a) => a.id === id);
    if (!adv) return;

    // Calculate linked expenses
    const validExpenses = expenses.filter(
      (e) => e.status === 'active' && e.paymentSource === 'advance' && e.cashAdvanceId === id
    );
    const expenseAmount = validExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expectedReturn = Math.max(0, adv.amount - expenseAmount);

    settleCashAdvanceWithDetails(id, expectedReturn);
  };

  const settleCashAdvanceWithDetails = (
    advanceId: string,
    actualReturn: number,
    differenceReason?: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    const adv = cashAdvances.find((a) => a.id === advanceId);
    if (!adv) return { success: false, error: 'تنخواه یافت نشد' };
    if (adv.status === 'settled') return { success: false, error: 'این تنخواه قبلاً تسویه شده است' };

    const validExpenses = expenses.filter(
      (e) => e.status === 'active' && e.paymentSource === 'advance' && e.cashAdvanceId === advanceId
    );
    const expenseAmount = validExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expectedReturn = Math.max(0, adv.amount - expenseAmount);
    const difference = actualReturn - expectedReturn;

    if (difference !== 0 && !differenceReason?.trim()) {
      return { success: false, error: 'در صورت وجود اختلاف، ثبت دلیل اختلاف الزامی است' };
    }

    const settlementRecord: SettlementRecord = {
      id: `set-${Date.now()}`,
      advanceId,
      personId: adv.personId,
      personName: adv.personName,
      advanceAmount: adv.amount,
      expenseAmount,
      expectedReturn,
      actualReturn,
      difference,
      differenceReason,
      settledAt: DEALERSHIP_CURRENT_DATE,
      notes,
      createdAt: DEALERSHIP_CURRENT_DATE,
    };

    setSettlements((prev) => [settlementRecord, ...prev]);

    setCashAdvances((prev) =>
      prev.map((a) =>
        a.id === advanceId
          ? {
              ...a,
              status: 'settled',
              settledAt: DEALERSHIP_CURRENT_DATE,
              settledAmount: actualReturn,
            }
          : a
      )
    );

    showToast('تسویه تنخواه با موفقیت قطعی شد', 'success');

    addActivity({
      type: 'AdvanceSettled',
      title: 'تسویه قطعی تنخواه',
      description: `${adv.personName} — تنخواه ${formatToman(adv.amount)} تسویه شد`,
      relatedId: advanceId,
      actorName: adv.personName,
    });

    return { success: true };
  };

  const reverseSettlement = (settlementId: string) => {
    const setRecord = settlements.find((s) => s.id === settlementId);
    if (!setRecord) return;

    setSettlements((prev) =>
      prev.map((s) =>
        s.id === settlementId
          ? { ...s, isReversed: true, reversedAt: DEALERSHIP_CURRENT_DATE }
          : s
      )
    );

    setCashAdvances((prev) =>
      prev.map((a) =>
        a.id === setRecord.advanceId
          ? {
              ...a,
              status: 'open',
              settledAt: undefined,
              settledAmount: undefined,
            }
          : a
      )
    );

    showToast('تسویه بازگشت داده شد و تنخواه مجدداً باز شد', 'info');
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status' | 'localVehicleId'>) => {
    const id = `veh-${Date.now()}`;
    const newVehicle: Vehicle = {
      ...vehicleData,
      id,
      localVehicleId: id,
      status: 'active',
      createdAt: DEALERSHIP_CURRENT_DATE,
      syncStatus: 'local',
    };

    setVehicles((prev) => [newVehicle, ...prev]);
    showToast('خودرو با موفقیت اضافه شد', 'success');

    addActivity({
      type: 'VehicleCreated',
      title: 'ثبت خودرو جدید',
      description: `${newVehicle.fullName} (${newVehicle.plate}) اضافه شد`,
      relatedId: id,
    });
  };

  const updateVehicleInspection = (id: string, inspectionStatus: InspectionStatus) => {
    const veh = vehicles.find((v) => v.id === id);
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, inspectionStatus } : v))
    );

    const labelMap: Record<InspectionStatus, string> = {
      inspected: 'کارشناسی انجام شد',
      pending_inspection: 'در انتظار کارشناسی',
      not_inspected: 'کارشناسی نشده',
      cancelled: 'لغو شد',
    };

    showToast(`وضعیت کارشناسی: ${labelMap[inspectionStatus]}`, 'info');

    if (veh) {
      addActivity({
        type: 'InspectionUpdated',
        title: 'بروزرسانی کارشناسی',
        description: `${veh.fullName} — ${labelMap[inspectionStatus]}`,
        relatedId: id,
      });
    }
  };

  const archiveVehicle = (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'archived' } : v))
    );
    showToast('خودرو آرشیو شد', 'info');
  };

  const addPerson = (personData: Omit<Person, 'id' | 'createdAt' | 'status'>) => {
    const newPerson: Person = {
      ...personData,
      id: `per-${Date.now()}`,
      status: 'active',
      createdAt: DEALERSHIP_CURRENT_DATE,
      syncStatus: 'local',
    };
    setPersonnel((prev) => [...prev, newPerson]);
    showToast('شخص جدید اضافه شد', 'success');
  };

  const archivePerson = (id: string) => {
    setPersonnel((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'archived' } : p))
    );
    showToast('پرسنل آرشیو شد', 'info');
  };

  const unlockWithTotp = async (code: string): Promise<{ success: boolean; error?: string }> => {
    const now = Date.now();
    const lockoutUntil = parseInt(localStorage.getItem('aa_sec_lockout_until') || '0', 10);
    if (lockoutUntil > now) {
      const wait = Math.ceil((lockoutUntil - now) / 1000);
      return {
        success: false,
        error: `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${wait} ثانیه دیگر مجدداً تلاش کنید.`,
      };
    }

    const secret = currentTotpSecret || (await loadAndDecryptSecret(deviceId));
    if (!secret) {
      return { success: false, error: 'کلید امنیتی تنظیم نشده است.' };
    }

    const isValid = await verifyTotpCode(secret, code);
    if (!isValid) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockoutTime = now + 30_000;
        localStorage.setItem('aa_sec_lockout_until', lockoutTime.toString());
        setLockoutRemainingSec(30);
      }
      return { success: false, error: 'کد واردشده صحیح نیست. لطفاً کد جدید Google Authenticator را وارد کنید.' };
    }

    // Success!
    setFailedAttempts(0);
    localStorage.removeItem('aa_sec_lockout_until');
    setLockoutRemainingSec(0);
    setClockTampered(false);

    const newLease = createNew24HourLease(deviceId);
    setIsUnlocked(true);
    setActivationSecondsLeft(Math.floor((newLease.expiresAt - Date.now()) / 1000));
    setLastTrustedTime(Date.now());
    showToast('دسترسی ۲۴ ساعته با موفقیت تمدید شد.', 'success');
    return { success: true };
  };

  const setupTotp = async (newSecret: string): Promise<void> => {
    await encryptAndSaveSecret(newSecret, deviceId);
    setCurrentTotpSecret(newSecret);
    setIsConfigured(true);
    const newLease = createNew24HourLease(deviceId);
    setIsUnlocked(true);
    setActivationSecondsLeft(Math.floor((newLease.expiresAt - Date.now()) / 1000));
    setLastTrustedTime(Date.now());
    showToast('اتصال به Google Authenticator با موفقیت برقرار شد.', 'success');
  };

  const lockApplication = () => {
    setIsUnlocked(false);
    showToast('برنامه قفل شد.', 'info');
  };

  const createManualBackup = async (): Promise<{ success: boolean; filename?: string; error?: string }> => {
    try {
      const currentPayload: FullDatabasePayload = {
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        expenses,
        cashAdvances,
        settlements,
        vehicles,
        personnel,
        activities,
      };

      const result = await createConsistentBackupZip(currentPayload, 'manual');

      // Trigger browser download
      const url = URL.createObjectURL(result.zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setLastBackupInfo({ date: `امروز — ${timeStr}`, status: 'valid' });
      showToast('پشتیبان‌گیری با موفقیت انجام و ذخیره شد.', 'success');
      return { success: true, filename: result.filename };
    } catch (err: any) {
      console.error('Backup creation failed', err);
      setLastBackupInfo({ date: 'آخرین پشتیبان با مشکل مواجه شده', status: 'failed' });
      showToast(err?.message || 'خطا در ایجاد نسخه پشتیبان', 'error');
      return { success: false, error: err?.message };
    }
  };

  const restoreBackup = async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentPayload: FullDatabasePayload = {
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        expenses,
        cashAdvances,
        settlements,
        vehicles,
        personnel,
        activities,
      };

      const result = await restoreFromBackupZip(file, currentPayload);
      if (!result.success || !result.restoredData) {
        return {
          success: false,
          error: result.error || 'این نسخه پشتیبان با نسخه فعلی برنامه سازگار نیست.',
        };
      }

      // Overwrite state safely with restored data
      setExpenses(result.restoredData.expenses);
      setCashAdvances(result.restoredData.cashAdvances);
      setSettlements(result.restoredData.settlements);
      setVehicles(result.restoredData.vehicles);
      setPersonnel(result.restoredData.personnel);
      setActivities(result.restoredData.activities || []);

      showToast('بازیابی اطلاعات با موفقیت انجام شد.', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'این نسخه پشتیبان با نسخه فعلی برنامه سازگار نیست.' };
    }
  };

  const checkDuplicateReceipt = async (base64: string) => {
    return findDuplicateReceipt(base64, expenses);
  };

  const storageMetrics = useMemo<StorageMetrics>(() => {
    return calculateStorageMetrics({
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      expenses,
      cashAdvances,
      settlements,
      vehicles,
      personnel,
      activities,
    });
  }, [expenses, cashAdvances, settlements, vehicles, personnel, activities]);

  const resetAllData = () => {
    setExpenses(INITIAL_EXPENSES);
    setCashAdvances(INITIAL_CASH_ADVANCES);
    setSettlements(INITIAL_SETTLEMENTS);
    setVehicles(INITIAL_VEHICLES);
    setPersonnel(INITIAL_PERSONNEL);
    setActivities(INITIAL_ACTIVITIES);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_advances`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_settlements`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_vehicles`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_personnel`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_activities`);
    showToast('تمام داده‌ها به حالت اولیه بازنشانی شدند', 'info');
  };

  return (
    <AccountingContext.Provider
      value={{
        expenses,
        cashAdvances,
        settlements,
        settlementRecords: settlements,
        vehicles,
        personnel,
        activities,
        toasts,
        personnelBalances,
        metrics,
        needsAttentionItems,
        addExpense,
        updateExpense,
        recordReimbursement,
        archiveExpense,
        addReceiptToExpense,
        removeReceiptFromExpense,
        addCashAdvance,
        settleCashAdvance,
        settleCashAdvanceWithDetails,
        reverseSettlement,
        addVehicle,
        updateVehicleInspection,
        archiveVehicle,
        addPerson,
        archivePerson,
        showToast,
        removeToast,
        isUnlocked,
        isConfigured,
        activationSecondsLeft,
        formatActivationTime,
        unlockWithTotp,
        setupTotp,
        lockApplication,
        lockoutRemainingSec,
        currentTotpSecret,
        clockTampered,
        saveError,
        lastCheckpointTime,
        lastBackupInfo,
        storageMetrics,
        createManualBackup,
        restoreBackup,
        checkDuplicateReceipt,
        resetAllData,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
