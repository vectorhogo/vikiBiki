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
  AccountingPeriod,
  OpeningDocument,
  CreateOpeningDocumentInput,
  TransferredAdvanceItem,
  TransferredReimbursementItem,
  VehicleOpeningSummary,
  Income,
  IncomeCategory,
  PeriodIntegrityResult,
  PeriodIntegrityIssue,
  SmartOpeningSuggestions,
  ReconciliationResult,
  PeriodSnapshot,
  PeriodReopenRecord,
  Customer,
  SaleDossier,
  ConsignmentAgreement,
  OwnerSettlement,
  VehicleHandoverInspection,
  ConsignmentReturnRecord,
} from '../types/accounting';
import {
  INITIAL_EXPENSES,
  INITIAL_CASH_ADVANCES,
  INITIAL_VEHICLES,
  INITIAL_PERSONNEL,
  INITIAL_ACTIVITIES,
  INITIAL_INCOMES,
} from '../data/initialAccountingData';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SALE_DOSSIERS,
} from '../data/initialCustomerSalesData';
import {
  INITIAL_CONSIGNMENT_AGREEMENTS,
  INITIAL_OWNER_SETTLEMENTS,
  INITIAL_VEHICLE_INSPECTIONS,
} from '../data/initialConsignmentData';
import { SmartContract, ContractVersionSnapshot, InstallmentPaymentAllocation } from '../types/contract';
import { INITIAL_SMART_CONTRACTS } from '../data/initialContractsData';
import { proposePaymentAllocation } from '../utils/contractEngine';
import {
  FinancialAccount,
  AccountTransfer,
  IndirectTransaction,
  DealCommission,
  CommissionPayment,
  CommissionStatus,
  InvestorProfile,
  InvestorContribution,
  InvestorDealAllocation,
  InvestorSettlement,
  InvestorWalletSummary,
} from '../types/finance09b';
import {
  INITIAL_FINANCIAL_ACCOUNTS,
  INITIAL_ACCOUNT_TRANSFERS,
  INITIAL_INDIRECT_TRANSACTIONS,
  INITIAL_DEAL_COMMISSIONS,
  INITIAL_INVESTORS,
} from '../data/initialFinance09bData';
import {
  VehicleExpiringDoc,
  ReferencePreset,
  DealershipUser,
  UserRole,
  AuditLogEntry,
  PermissionAction,
} from '../types/patch09c';
import { INITIAL_REFERENCE_PRESETS } from '../data/initialPresetsData';
import { INITIAL_EXPIRING_DOCUMENTS } from '../data/initialExpiringDocsData';
import { INITIAL_USERS, INITIAL_AUDIT_LOGS, hasPermission as checkRbacPermission, ROLE_DEFINITIONS } from '../utils/rbacEngine';
import {
  DEALERSHIP_CURRENT_DATE,
  formatToman,
  toPersianDigits,
  findPotentialDuplicate,
  isDateWithinPeriod,
  compareJalaliDates,
  normalizeJalaliDate,
} from '../utils/formatters';
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
  expenseResponsibility?: 'dealership' | 'owner' | 'contract';
  ignorePeriodDateCheck?: boolean;
}

interface AccountingContextType {
  expenses: Expense[];
  incomes: Income[];
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
  ) => { success: boolean; duplicateWarning?: Expense; error?: string; periodDateMismatch?: boolean };
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

  addIncome: (
    income: Omit<Income, 'id' | 'createdAt'>,
    ignorePeriodDateCheck?: boolean
  ) => { success: boolean; error?: string; periodDateMismatch?: boolean };
  deleteIncome: (id: string) => void;

  addCashAdvance: (
    advance: Omit<CashAdvance, 'id' | 'createdAt' | 'status'>,
    ignorePeriodDateCheck?: boolean
  ) => { success: boolean; error?: string; periodDateMismatch?: boolean };
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

  // Phase 07: Customers & Vehicle Sales Archive
  customers: Customer[];
  saleDossiers: SaleDossier[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  archiveCustomer: (customerId: string) => void;
  addSaleDossier: (dossier: SaleDossier) => void;
  updateSaleDossier: (dossier: SaleDossier) => void;
  deleteSaleDossier: (saleId: string) => void;

  // Phase 08: Consignment, Ownership & Handover Inspections
  consignmentAgreements: ConsignmentAgreement[];
  ownerSettlements: OwnerSettlement[];
  vehicleInspections: VehicleHandoverInspection[];
  consignmentReturns: ConsignmentReturnRecord[];
  addConsignmentAgreement: (agreement: ConsignmentAgreement) => void;
  updateConsignmentAgreement: (agreement: ConsignmentAgreement) => void;
  addOwnerSettlement: (settlement: OwnerSettlement) => void;
  updateOwnerSettlement: (settlement: OwnerSettlement) => void;
  saveVehicleHandoverInspection: (inspection: VehicleHandoverInspection) => void;
  addConsignmentReturn: (returnRecord: ConsignmentReturnRecord) => void;

  // Phase 09A: Smart Contracts & Installment Management
  contracts: SmartContract[];
  addContract: (contract: SmartContract, recordDownPaymentIncome?: boolean) => void;
  updateContract: (contract: SmartContract, changeSummary?: string) => void;
  cancelContract: (contractId: string, reason: string) => void;
  registerInstallmentPayment: (params: {
    contractId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'pos';
    trackingNumber?: string;
    notes?: string;
    customAllocations?: { installmentId: string; amount: number }[];
    isIndirect?: boolean;
    indirectReceiverName?: string;
    supportingDoc?: string;
    financialAccountId?: string;
  }) => { success: boolean; incomeId?: string; indirectId?: string; error?: string };

  // Phase 09B: Multiple Financial Accounts, Transfers, Indirect Transactions, Commissions & Investor Wallets
  financialAccounts: FinancialAccount[];
  liveFinancialAccounts: FinancialAccount[];
  accountTransfers: AccountTransfer[];
  indirectTransactions: IndirectTransaction[];
  dealCommissions: DealCommission[];
  investorProfiles: InvestorProfile[];
  investorSummaries: InvestorWalletSummary[];

  addFinancialAccount: (account: Omit<FinancialAccount, 'id' | 'createdAt'>) => void;
  updateFinancialAccount: (account: FinancialAccount) => void;
  transferBetweenAccounts: (params: {
    date: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    referenceNumber?: string;
    reason: string;
    notes?: string;
  }) => { success: boolean; error?: string };

  recordIndirectTransaction: (params: Omit<IndirectTransaction, 'id' | 'createdAt' | 'trackingNumber'>) => {
    success: boolean;
    indirectId?: string;
    error?: string;
  };

  addDealCommission: (commission: Omit<DealCommission, 'id' | 'createdAt' | 'payments' | 'receivedAmount' | 'outstandingAmount' | 'status'>) => void;
  registerCommissionPayment: (params: {
    commissionId: string;
    date: string;
    payerRole: 'buyer' | 'seller';
    payerName: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'pos' | 'cheque';
    destinationAccountId?: string;
    trackingNumber?: string;
    notes?: string;
  }) => { success: boolean; error?: string };

  addInvestorProfile: (profile: Omit<InvestorProfile, 'id' | 'createdAt' | 'contributions' | 'allocations' | 'settlements'>) => void;
  updateInvestorProfile: (profile: InvestorProfile) => void;
  recordInvestorContribution: (params: {
    investorId: string;
    date: string;
    amount: number;
    channel: 'company_account' | 'direct_to_seller';
    destinationAccountId?: string;
    sellerOrOwnerName?: string;
    supportingDocument?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
  allocateInvestorToDeal: (params: {
    investorId: string;
    vehicleId: string;
    vehicleLabel: string;
    contractId?: string;
    contractNumber?: string;
    allocationDate: string;
    allocatedCapital: number;
    profitSharePercentage?: number;
    agreedFixedProfit?: number;
    notes?: string;
  }) => { success: boolean; error?: string };
  exitInvestorAllocation: (params: {
    investorId: string;
    allocationId: string;
    exitDate: string;
    realizedProfit: number;
    notes?: string;
  }) => { success: boolean; error?: string };
  settleInvestorProfitOrCapital: (params: {
    investorId: string;
    date: string;
    type: 'profit_distribution' | 'capital_repayment';
    amount: number;
    sourceAccountId?: string;
    paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'direct_reconciliation';
    trackingNumber?: string;
    notes?: string;
  }) => { success: boolean; error?: string };

  // Phase 09C: Vehicle Technical Data, Expiring Documents, Presets, RBAC & Audit Log
  expiringDocs: VehicleExpiringDoc[];
  presets: ReferencePreset[];
  currentUser: DealershipUser;
  auditLogs: AuditLogEntry[];
  addExpiringDoc: (doc: Omit<VehicleExpiringDoc, 'id' | 'createdAt'>) => VehicleExpiringDoc;
  updateExpiringDoc: (id: string, updates: Partial<VehicleExpiringDoc>) => void;
  deleteExpiringDoc: (id: string) => void;
  addPreset: (preset: Omit<ReferencePreset, 'id'>) => { success: boolean; preset?: ReferencePreset; error?: string };
  updatePreset: (id: string, updates: Partial<ReferencePreset>) => void;
  setCurrentUserRole: (role: UserRole) => void;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
  checkPermission: (action: PermissionAction) => boolean;

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

  // Periods & Opening Documents
  periods: AccountingPeriod[];
  openingDocuments: OpeningDocument[];
  activePeriodId: string;
  viewingPeriodId: string;
  activePeriod: AccountingPeriod;
  viewingPeriod: AccountingPeriod | undefined;
  isViewingHistoricalPeriod: boolean;
  isPeriodReadOnly: boolean;
  setViewingPeriodId: (periodId: string) => void;
  getOpenItemsForNewPeriod: () => {
    openAdvances: TransferredAdvanceItem[];
    openReimbursements: TransferredReimbursementItem[];
    vehicleSummaries: VehicleOpeningSummary[];
    openExpensesWithoutReceiptCount: number;
  };
  createOpeningPeriod: (input: CreateOpeningDocumentInput) => Promise<{ success: boolean; periodId?: string; error?: string }>;
  settleOpeningReimbursement: (
    openingDocId: string,
    personId: string,
    amount: number,
    notes?: string
  ) => { success: boolean; error?: string };
  checkPeriodIntegrity: () => PeriodIntegrityResult;
  reopenClosedPeriod: (periodId: string, reason: string) => { success: boolean; error?: string };
  closePeriodWithCheck: (periodId: string, notes?: string) => { success: boolean; warnings?: string[]; error?: string };
  correctClosedPeriodRecord: (
    type: 'expense' | 'advance' | 'settlement',
    recordId: string,
    updatedData: any,
    reason: string
  ) => { success: boolean; error?: string };
  getSmartOpeningSuggestions: (targetPeriodStartDate?: string) => SmartOpeningSuggestions;
  reconcileOpeningVsClosing: (
    previousPeriodId: string,
    proposedOpening: { cash: number; bank: number; advances: number; reimbursements: number }
  ) => ReconciliationResult;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'auto_abdollahi_accounting_v3';

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial seed
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_incomes`);
    return saved ? JSON.parse(saved) : INITIAL_INCOMES;
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

  // Phase 07: Customers and Sale Dossiers Master Data
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [saleDossiers, setSaleDossiers] = useState<SaleDossier[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_sale_dossiers`);
    return saved ? JSON.parse(saved) : INITIAL_SALE_DOSSIERS;
  });

  // Phase 08: Consignment, Ownership & Handover Inspections
  const [consignmentAgreements, setConsignmentAgreements] = useState<ConsignmentAgreement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_consignments`);
    return saved ? JSON.parse(saved) : INITIAL_CONSIGNMENT_AGREEMENTS;
  });

  const [ownerSettlements, setOwnerSettlements] = useState<OwnerSettlement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_owner_settlements`);
    return saved ? JSON.parse(saved) : INITIAL_OWNER_SETTLEMENTS;
  });

  const [vehicleInspections, setVehicleInspections] = useState<VehicleHandoverInspection[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_inspections`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_INSPECTIONS;
  });

  const [consignmentReturns, setConsignmentReturns] = useState<ConsignmentReturnRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_consignment_returns`);
    return saved ? JSON.parse(saved) : [];
  });

  const [contracts, setContracts] = useState<SmartContract[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_contracts`);
    return saved ? JSON.parse(saved) : INITIAL_SMART_CONTRACTS;
  });

  // Phase 09B: Multiple Financial Accounts, Transfers, Indirect Transactions, Commissions & Investor Wallets
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_financial_accounts`);
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_ACCOUNTS;
  });

  const [accountTransfers, setAccountTransfers] = useState<AccountTransfer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_account_transfers`);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_TRANSFERS;
  });

  const [indirectTransactions, setIndirectTransactions] = useState<IndirectTransaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_indirect_txs`);
    return saved ? JSON.parse(saved) : INITIAL_INDIRECT_TRANSACTIONS;
  });

  const [dealCommissions, setDealCommissions] = useState<DealCommission[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_commissions`);
    return saved ? JSON.parse(saved) : INITIAL_DEAL_COMMISSIONS;
  });

  const [investorProfiles, setInvestorProfiles] = useState<InvestorProfile[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_investors`);
    return saved ? JSON.parse(saved) : INITIAL_INVESTORS;
  });

  // Phase 09C: Vehicle Technical Data, Expiring Documents, Presets, RBAC & Audit Log
  const [expiringDocs, setExpiringDocs] = useState<VehicleExpiringDoc[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expiring_docs`);
    return saved ? JSON.parse(saved) : INITIAL_EXPIRING_DOCUMENTS;
  });

  const [presets, setPresets] = useState<ReferencePreset[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_presets`);
    return saved ? JSON.parse(saved) : INITIAL_REFERENCE_PRESETS;
  });

  const [currentUser, setCurrentUser] = useState<DealershipUser>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user`);
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit_logs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Periods & Opening Documents State
  const DEFAULT_INITIAL_PERIOD: AccountingPeriod = useMemo(
    () => ({
      id: 'period-1405-initial',
      title: 'سال ۱۴۰۵',
      startDate: '۱۴۰۵/۰۱/۰۱',
      status: 'active',
      createdAt: '۱۴۰۵/۰۱/۰۱',
    }),
    []
  );

  const [periods, setPeriods] = useState<AccountingPeriod[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_periods`);
    return saved ? JSON.parse(saved) : [{
      id: 'period-1405-initial',
      title: 'سال ۱۴۰۵',
      startDate: '۱۴۰۵/۰۱/۰۱',
      status: 'active',
      createdAt: '۱۴۰۵/۰۱/۰۱',
    }];
  });

  const [openingDocuments, setOpeningDocuments] = useState<OpeningDocument[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_opening_docs`);
    return saved ? JSON.parse(saved) : [];
  });

  const [activePeriodId, setActivePeriodId] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_active_period_id`);
    return saved || 'period-1405-initial';
  });

  const [viewingPeriodId, setViewingPeriodId] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_active_period_id`);
    return saved || 'period-1405-initial';
  });

  const activePeriod = useMemo(() => {
    return (
      periods.find((p) => p.id === activePeriodId) ||
      periods.find((p) => p.status === 'active') ||
      periods[0] ||
      DEFAULT_INITIAL_PERIOD
    );
  }, [periods, activePeriodId, DEFAULT_INITIAL_PERIOD]);

  const viewingPeriod = useMemo(() => {
    if (viewingPeriodId === 'all') return undefined;
    return periods.find((p) => p.id === viewingPeriodId) || activePeriod;
  }, [periods, viewingPeriodId, activePeriod]);

  const isViewingHistoricalPeriod = useMemo(() => {
    if (viewingPeriodId === 'all') return false;
    return viewingPeriodId !== activePeriodId;
  }, [viewingPeriodId, activePeriodId]);

  const isPeriodReadOnly = useMemo(() => {
    if (isViewingHistoricalPeriod) return true;
    if (viewingPeriod && (viewingPeriod.isLocked || viewingPeriod.status === 'closed')) return true;
    if (activePeriod && (activePeriod.isLocked || activePeriod.status === 'closed')) return true;
    return false;
  }, [isViewingHistoricalPeriod, viewingPeriod, activePeriod]);

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
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_incomes`, JSON.stringify(incomes));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره درآمدها با مشکل مواجه شد.');
    }
  }, [incomes]);

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

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_periods`, JSON.stringify(periods));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره دوره‌ها با مشکل مواجه شد.');
    }
  }, [periods]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_opening_docs`, JSON.stringify(openingDocuments));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره اسناد افتتاحیه با مشکل مواجه شد.');
    }
  }, [openingDocuments]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_customers`, JSON.stringify(customers));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره پرونده‌های مشتریان با مشکل مواجه شد.');
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_sale_dossiers`, JSON.stringify(saleDossiers));
      setSaveError(null);
    } catch {
      setSaveError('ذخیره پرونده‌های فروش با مشکل مواجه شد.');
    }
  }, [saleDossiers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_consignments`, JSON.stringify(consignmentAgreements));
    } catch {
      setSaveError('ذخیره قراردادهای امانی با مشکل مواجه شد.');
    }
  }, [consignmentAgreements]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_owner_settlements`, JSON.stringify(ownerSettlements));
    } catch {
      setSaveError('ذخیره تسویه‌های مالکین با مشکل مواجه شد.');
    }
  }, [ownerSettlements]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_inspections`, JSON.stringify(vehicleInspections));
    } catch {
      setSaveError('ذخیره کارشناسی‌های خودرو با مشکل مواجه شد.');
    }
  }, [vehicleInspections]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_consignment_returns`, JSON.stringify(consignmentReturns));
    } catch {
      // ignore
    }
  }, [consignmentReturns]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_contracts`, JSON.stringify(contracts));
    } catch {
      setSaveError('ذخیره قراردادها و مبایعه‌نامه‌ها با مشکل مواجه شد.');
    }
  }, [contracts]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_financial_accounts`, JSON.stringify(financialAccounts));
    } catch {
      setSaveError('ذخیره حساب‌های مالی با مشکل مواجه شد.');
    }
  }, [financialAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_account_transfers`, JSON.stringify(accountTransfers));
    } catch {
      setSaveError('ذخیره انتقالات حساب‌ها با مشکل مواجه شد.');
    }
  }, [accountTransfers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_indirect_txs`, JSON.stringify(indirectTransactions));
    } catch {
      setSaveError('ذخیره تراکنش‌های غیرمستقیم با مشکل مواجه شد.');
    }
  }, [indirectTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_commissions`, JSON.stringify(dealCommissions));
    } catch {
      setSaveError('ذخیره کمیسیون‌ها با مشکل مواجه شد.');
    }
  }, [dealCommissions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_investors`, JSON.stringify(investorProfiles));
    } catch {
      setSaveError('ذخیره پرونده سرمایه‌گذاران با مشکل مواجه شد.');
    }
  }, [investorProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_expiring_docs`, JSON.stringify(expiringDocs));
    } catch {
      // ignore
    }
  }, [expiringDocs]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_presets`, JSON.stringify(presets));
    } catch {
      // ignore
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(currentUser));
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit_logs`, JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_active_period_id`, activePeriodId);
    } catch {
      // ignore
    }
  }, [activePeriodId]);

  // Hourly Lightweight Auto-Save Checkpoint
  useEffect(() => {
    const hourlyCheckpoint = async () => {
      try {
        const currentPayload: FullDatabasePayload = {
          version: '3.0.0',
          exportedAt: new Date().toISOString(),
          expenses: expenses || [],
          incomes: incomes || [],
          cashAdvances: cashAdvances || [],
          settlements: settlements || [],
          vehicles: vehicles || [],
          personnel: personnel || [],
          activities: activities || [],
          periods: periods || [],
          openingDocuments: openingDocuments || [],
          activePeriodId: activePeriodId || 'period-1405-initial',
          customers: customers || [],
          saleDossiers: saleDossiers || [],
          consignmentAgreements: consignmentAgreements || [],
          ownerSettlements: ownerSettlements || [],
          vehicleInspections: vehicleInspections || [],
          consignmentReturns: consignmentReturns || [],
          contracts: contracts || [],
          financialAccounts: financialAccounts || [],
          accountTransfers: accountTransfers || [],
          indirectTransactions: indirectTransactions || [],
          dealCommissions: dealCommissions || [],
          investorProfiles: investorProfiles || [],
          expiringDocs: expiringDocs || [],
          presets: presets || [],
          auditLogs: auditLogs || [],
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
  }, [
    expenses,
    incomes,
    cashAdvances,
    settlements,
    vehicles,
    personnel,
    activities,
    periods,
    openingDocuments,
    activePeriodId,
    customers,
    saleDossiers,
    consignmentAgreements,
    ownerSettlements,
    vehicleInspections,
    consignmentReturns,
    contracts,
  ]);

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
    const effectivePeriodId = viewingPeriodId === 'all' ? activePeriodId : viewingPeriodId;
    const currentOpeningDoc = openingDocuments.find((d) => d.periodId === effectivePeriodId);

    return personnel
      .filter((p) => p.status === 'active')
      .map((p) => {
        // Transferred opening advance from opening document
        const openingAdvance =
          currentOpeningDoc?.transferredAdvances.find(
            (t) => t.personId === p.id && t.action === 'transfer'
          )?.remainingAmount || 0;

        // sum of non-settled advances for this person in this period
        const personAdvances = cashAdvances.filter(
          (a) =>
            a.personId === p.id &&
            a.status !== 'settled' &&
            (!a.periodId || a.periodId === effectivePeriodId || viewingPeriodId === 'all')
        );
        const totalAdvanced = openingAdvance + personAdvances.reduce((sum, a) => sum + a.amount, 0);

        const activeAdvanceIds = new Set(personAdvances.map((a) => a.id));

        // only active expenses from advances in this period
        const advanceExpenses = expenses.filter(
          (e) =>
            e.status === 'active' &&
            e.personId === p.id &&
            e.paymentSource === 'advance' &&
            (!e.periodId || e.periodId === effectivePeriodId || viewingPeriodId === 'all') &&
            ((e.cashAdvanceId && activeAdvanceIds.has(e.cashAdvanceId)) || openingAdvance > 0)
        );

        const totalExpenses = advanceExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBalance = Math.max(0, totalAdvanced - totalExpenses);

        // Personal expenses
        const openingReimbursement =
          currentOpeningDoc?.transferredReimbursements.find(
            (t) => t.personId === p.id && t.action === 'transfer'
          )?.amount || 0;

        const personalExpenses = expenses.filter(
          (e) =>
            e.status === 'active' &&
            e.personId === p.id &&
            e.paymentSource === 'personal' &&
            (!e.periodId || e.periodId === effectivePeriodId || viewingPeriodId === 'all')
        );
        const personalExpensesTotal = openingReimbursement + personalExpenses.reduce((sum, e) => sum + e.amount, 0);

        const needsReimbursementTotal =
          openingReimbursement +
          personalExpenses
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
          openAdvancesCount: personAdvances.length + (openingAdvance > 0 ? 1 : 0),
        };
      });
  }, [personnel, cashAdvances, expenses, viewingPeriodId, activePeriodId, openingDocuments]);

  // Key Dashboard & Report Metrics
  const metrics = useMemo<AccountingMetrics>(() => {
    const effectivePeriodId = viewingPeriodId === 'all' ? activePeriodId : viewingPeriodId;

    // 1. موجودی تنخواه: Total active cash currently held by personnel
    const totalActiveCashAdvance = personnelBalances.reduce((acc, p) => acc + p.remainingBalance, 0);

    // 2. هزینه امروز: Total expenses recorded today
    const activeExpenses = expenses.filter(
      (e) =>
        e.status === 'active' &&
        (!e.periodId || e.periodId === effectivePeriodId || viewingPeriodId === 'all')
    );
    const todayExpenses = activeExpenses.filter(
      (e) => e.date === DEALERSHIP_CURRENT_DATE || e.date === '1405/06/29'
    );
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayExpenseCount = todayExpenses.length;

    // 2.5. درآمد امروز و این دوره: Total incomes recorded today & active period
    const activeIncomes = incomes.filter(
      (inc) => !inc.periodId || inc.periodId === effectivePeriodId || viewingPeriodId === 'all'
    );
    const todayIncomes = activeIncomes.filter(
      (inc) => inc.date === DEALERSHIP_CURRENT_DATE || inc.date === '1405/06/29'
    );
    const todayIncomeTotal = todayIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const todayIncomeCount = todayIncomes.length;
    const monthlyIncomeTotal = activeIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const todayNetBalance = todayIncomeTotal - todayExpenseTotal;

    // 3. هزینه این دوره: Total expenses in current period
    const monthlyExpenses = activeExpenses;
    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. در انتظار تسویه: Number of open or needs_settlement cash advances in this period
    const pendingSettlementCount = cashAdvances.filter(
      (a) =>
        (a.status === 'needs_settlement' || a.status === 'open') &&
        (!a.periodId || a.periodId === effectivePeriodId || viewingPeriodId === 'all')
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
    const currentOpeningDoc = openingDocuments.find((d) => d.periodId === effectivePeriodId);
    const openingReimbTotal = currentOpeningDoc?.totalTransferredReimbursementAmount || 0;

    const needsReimbursementCount = personalNeedsReimb.length + (openingReimbTotal > 0 ? 1 : 0);
    const totalNeedsReimbursementAmount =
      openingReimbTotal +
      personalNeedsReimb.reduce((sum, e) => sum + (e.reimbursementAmount ?? e.amount), 0);

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
      todayIncomeTotal,
      todayNetBalance,
      todayExpenseCount,
      todayIncomeCount,
      monthlyExpenseTotal,
      monthlyIncomeTotal,
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
  }, [personnelBalances, expenses, incomes, cashAdvances, viewingPeriodId, activePeriodId, openingDocuments]);

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

    // Period Lock Check: Do not allow standard adds in closed/locked periods
    if (activePeriod?.isLocked || activePeriod?.status === 'closed') {
      const errorMsg = 'دوره مالی فعلی بسته یا قفل شده است. برای ثبت تراکنش ابتدا دوره را در حالت اصلاح قرار دهید یا دوره فعال را برگزینید.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    // Period Date Check
    const dateCheck = isDateWithinPeriod(date, activePeriod);
    if (!dateCheck.valid && !expenseData.ignorePeriodDateCheck) {
      showToast(dateCheck.error || 'تاریخ تراکنش خارج از بازه دوره مالی است', 'error');
      return { success: false, error: dateCheck.error, periodDateMismatch: true };
    }

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
      expenseResponsibility: expenseData.expenseResponsibility,
      status: 'active',
      periodId: activePeriodId,
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

  const addIncome = (
    incomeData: Omit<Income, 'id' | 'createdAt'>,
    ignorePeriodDateCheck: boolean = false
  ): { success: boolean; error?: string; periodDateMismatch?: boolean } => {
    if (incomeData.amount <= 0) {
      showToast('مبلغ درآمد یا دریافتی باید بزرگتر از صفر باشد', 'error');
      return { success: false, error: 'مبلغ باید بزرگتر از صفر باشد' };
    }

    if (activePeriod?.isLocked || activePeriod?.status === 'closed') {
      const errorMsg = 'دوره مالی فعلی بسته یا قفل شده است. برای ثبت درآمد ابتدا دوره را در حالت اصلاح قرار دهید.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const incomeDate = incomeData.date || DEALERSHIP_CURRENT_DATE;
    const dateCheck = isDateWithinPeriod(incomeDate, activePeriod);
    if (!dateCheck.valid && !ignorePeriodDateCheck) {
      showToast(dateCheck.error || 'تاریخ تراکنش خارج از بازه دوره مالی است', 'error');
      return { success: false, error: dateCheck.error, periodDateMismatch: true };
    }

    const newIncome: Income = {
      ...incomeData,
      id: `inc-${Date.now()}`,
      periodId: activePeriodId,
      createdAt: `${incomeDate} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    };

    setIncomes((prev) => [newIncome, ...prev]);
    showToast('درآمد / دریافتی با موفقیت ثبت شد', 'success');

    addActivity({
      type: 'AdvanceCreated',
      title: 'ثبت دریافتی و درآمد',
      description: `${incomeData.description} — ${formatToman(incomeData.amount)} (${incomeData.category})`,
      actorName: incomeData.personName || 'مدیریت مالی',
    });

    return { success: true };
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((inc) => inc.id !== id));
    showToast('رکورد درآمد حذف شد', 'info');
  };

  const addCashAdvance = (
    advanceData: Omit<CashAdvance, 'id' | 'createdAt' | 'status'>,
    ignorePeriodDateCheck: boolean = false
  ): { success: boolean; error?: string; periodDateMismatch?: boolean } => {
    if (advanceData.amount <= 0) {
      showToast('مبلغ تنخواه باید بزرگتر از صفر باشد', 'error');
      return { success: false, error: 'مبلغ تنخواه باید بزرگتر از صفر باشد' };
    }

    if (activePeriod?.isLocked || activePeriod?.status === 'closed') {
      const errorMsg = 'دوره مالی فعلی بسته یا قفل شده است. برای پرداخت تنخواه ابتدا دوره را در حالت اصلاح قرار دهید.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const dateCheck = isDateWithinPeriod(advanceData.date, activePeriod);
    if (!dateCheck.valid && !ignorePeriodDateCheck) {
      showToast(dateCheck.error || 'تاریخ تنخواه خارج از بازه دوره مالی است', 'error');
      return { success: false, error: dateCheck.error, periodDateMismatch: true };
    }

    const newAdvance: CashAdvance = {
      ...advanceData,
      id: `adv-${Date.now()}`,
      status: 'open',
      periodId: activePeriodId,
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

    return { success: true };
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
      periodId: adv.periodId || activePeriodId,
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

  // Phase 07: Customers & Vehicle Sales Archive Operations
  const addCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? customer : c))
    );
  };

  const archiveCustomer = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: 'archived' } : c))
    );
    showToast('پرونده مشتری بایگانی شد.', 'info');
  };

  const addSaleDossier = (dossier: SaleDossier) => {
    setSaleDossiers((prev) => [dossier, ...prev]);
  };

  const updateSaleDossier = (dossier: SaleDossier) => {
    setSaleDossiers((prev) =>
      prev.map((s) => (s.id === dossier.id ? dossier : s))
    );
  };

  const deleteSaleDossier = (saleId: string) => {
    setSaleDossiers((prev) => prev.filter((s) => s.id !== saleId));
    showToast('پرونده فروش حذف گردید.', 'info');
  };

  // Phase 08: Consignment, Ownership & Handover Inspections Operations
  const addConsignmentAgreement = (agreement: ConsignmentAgreement) => {
    setConsignmentAgreements((prev) => [agreement, ...prev]);
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === agreement.vehicleId
          ? {
              ...v,
              ownershipType: 'consignment',
              consignmentAgreementId: agreement.id,
              ownerPersonId: agreement.ownerPersonId,
              ownerName: agreement.ownerName,
              ownerPhone: agreement.ownerPhone,
              ownerNationalId: agreement.ownerNationalId,
              consignmentStatus: 'in_showroom',
            }
          : v
      )
    );
  };

  const updateConsignmentAgreement = (agreement: ConsignmentAgreement) => {
    setConsignmentAgreements((prev) =>
      prev.map((c) => (c.id === agreement.id ? agreement : c))
    );
  };

  const addOwnerSettlement = (settlement: OwnerSettlement) => {
    setOwnerSettlements((prev) => [settlement, ...prev]);
  };

  const updateOwnerSettlement = (settlement: OwnerSettlement) => {
    setOwnerSettlements((prev) =>
      prev.map((s) => (s.id === settlement.id ? settlement : s))
    );
  };

  const saveVehicleHandoverInspection = (inspection: VehicleHandoverInspection) => {
    setVehicleInspections((prev) => {
      const exists = prev.some((i) => i.id === inspection.id);
      if (exists) {
        return prev.map((i) => (i.id === inspection.id ? inspection : i));
      }
      return [inspection, ...prev];
    });

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === inspection.vehicleId
          ? {
              ...v,
              inspectionStatus: 'inspected',
              intakeInspectionId: inspection.id,
            }
          : v
      )
    );
  };

  const addConsignmentReturn = (returnRecord: ConsignmentReturnRecord) => {
    setConsignmentReturns((prev) => [returnRecord, ...prev]);
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === returnRecord.vehicleId
          ? {
              ...v,
              consignmentStatus: 'returned',
            }
          : v
      )
    );
    setConsignmentAgreements((prev) =>
      prev.map((a) =>
        a.id === returnRecord.agreementId || a.vehicleId === returnRecord.vehicleId
          ? { ...a, status: 'returned' }
          : a
      )
    );
  };

  const addContract = (contract: SmartContract, recordDownPaymentIncome: boolean = false) => {
    if (recordDownPaymentIncome && contract.financials.downPayment > 0 && contract.financials.downPaymentPaid) {
      const downIncome: Income = {
        id: `inc-contract-dp-${Date.now()}`,
        date: contract.financials.downPaymentDate || contract.contractDate || DEALERSHIP_CURRENT_DATE,
        category: 'بیعانه و قرارداد',
        description: `پیش‌پرداخت قرارداد ${contract.contractType === 'sale' ? 'فروش' : 'خرید'} ${contract.contractNumber} - ${contract.vehicleLabel}`,
        amount: contract.financials.downPayment,
        personName: 'صندوق نمایشگاه / حساب بانکی',
        vehicleId: contract.vehicleId,
        vehicleLabel: contract.vehicleLabel,
        notes: `ثبت خودکار پیش‌پرداخت به هنگام انعقاد قرارداد ${contract.contractNumber}${contract.financials.downPaymentMethod ? ` (${contract.financials.downPaymentMethod})` : ''}`,
        periodId: activePeriodId,
        createdAt: new Date().toISOString(),
      };
      setIncomes((prev) => [downIncome, ...prev]);
    }

    setContracts((prev) => [contract, ...prev]);

    addActivity({
      type: 'ContractCreated' as any,
      title: `انعقاد قرارداد ${contract.contractType === 'sale' ? 'فروش' : 'خرید'}`,
      description: `قرارداد شماره ${contract.contractNumber} برای خودروی ${contract.vehicleLabel} به ارزش ${formatToman(contract.financials.totalAgreedPrice)} ثبت شد.`,
      relatedId: contract.id,
      actorName: 'مدیریت قراردادها',
    });

    showToast(`قرارداد شماره ${contract.contractNumber} با موفقیت ثبت شد.`, 'success');
  };

  const updateContract = (updatedContract: SmartContract, changeSummary: string = 'ویرایش مفاد قرارداد') => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== updatedContract.id) return c;

        const newSnapshot: ContractVersionSnapshot = {
          versionNumber: (c.versionHistory?.length || 0) + 1,
          savedAt: new Date().toISOString(),
          savedBy: 'مدیر فروش و حسابداری',
          changeSummary,
          snapshot: {
            parties: { ...c.parties },
            financials: { ...c.financials },
            clauses: { ...c.clauses },
            installments: [...c.installments],
            status: c.status,
          },
        };

        return {
          ...updatedContract,
          updatedAt: new Date().toISOString(),
          versionHistory: [...(c.versionHistory || []), newSnapshot],
        };
      })
    );

    addActivity({
      type: 'ContractUpdated' as any,
      title: `ویرایش قرارداد ${updatedContract.contractNumber}`,
      description: `${changeSummary} (نسخه ${(updatedContract.versionHistory?.length || 0) + 1})`,
      relatedId: updatedContract.id,
      actorName: 'مدیریت قراردادها',
    });

    showToast(`تغییرات قرارداد ${updatedContract.contractNumber} ذخیره شد.`, 'success');
  };

  const cancelContract = (contractId: string, reason: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        return {
          ...c,
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: DEALERSHIP_CURRENT_DATE,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    addActivity({
      type: 'ContractCancelled' as any,
      title: 'فسخ / ابطال قرارداد',
      description: `قرارداد با شناسه ${contractId} فسخ شد. دلیل: ${reason}`,
      relatedId: contractId,
      actorName: 'مدیریت نمایشگاه',
    });

    showToast('قرارداد با موفقیت لغو شد و سوابق آن در بایگانی حفظ گردید.', 'info');
  };

  const registerInstallmentPayment = (params: {
    contractId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'pos';
    trackingNumber?: string;
    notes?: string;
    customAllocations?: { installmentId: string; amount: number }[];
    isIndirect?: boolean;
    indirectReceiverName?: string;
    supportingDoc?: string;
    financialAccountId?: string;
  }): { success: boolean; incomeId?: string; indirectId?: string; error?: string } => {
    const contract = contracts.find((c) => c.id === params.contractId);
    if (!contract) {
      return { success: false, error: 'قرارداد مورد نظر یافت نشد.' };
    }
    if (contract.status === 'cancelled') {
      return { success: false, error: 'امکان ثبت پرداخت برای قرارداد لغو شده وجود ندارد.' };
    }
    if (params.amount <= 0) {
      return { success: false, error: 'مبلغ پرداختی باید بزرگتر از صفر باشد.' };
    }

    let allocationsToApply: { installmentId: string; amount: number }[] = [];
    let unapplied = 0;

    if (params.customAllocations && params.customAllocations.length > 0) {
      allocationsToApply = params.customAllocations.filter((a) => a.amount > 0);
      const totalCustomAllocated = allocationsToApply.reduce((s, a) => s + a.amount, 0);
      if (totalCustomAllocated > params.amount) {
        return { success: false, error: 'مجموع مبالغ تخصیص‌یافته به اقساط نمی‌تواند از مبلغ کل پرداختی بیشتر باشد.' };
      }
      unapplied = params.amount - totalCustomAllocated;
    } else {
      const proposal = proposePaymentAllocation(contract, params.amount);
      allocationsToApply = proposal.allocations.map((a) => ({
        installmentId: a.installmentId,
        amount: a.allocatedAmount,
      }));
      unapplied = proposal.unallocatedAmount;
    }

    // 1. Update contract's installments
    const updatedInstallments = contract.installments.map((inst) => {
      const match = allocationsToApply.find((a) => a.installmentId === inst.id);
      if (!match) return inst;

      const newPaidAmount = inst.paidAmount + match.amount;
      const newStatus =
        newPaidAmount >= inst.amount
          ? ('paid' as const)
          : newPaidAmount > 0
          ? ('partial' as const)
          : inst.status;

      const newAllocationItem: InstallmentPaymentAllocation = {
        id: `alloc-${Date.now()}-${inst.id}`,
        paymentDate: params.paymentDate,
        amount: match.amount,
        paymentMethod: params.paymentMethod,
        trackingNumber: params.trackingNumber,
        notes: `${params.isIndirect ? '[تسویه مستقیم طرفین خارج از صندوق] ' : ''}${params.notes || ''}`,
        recordedAt: new Date().toISOString(),
      };

      return {
        ...inst,
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentDate: newStatus === 'paid' ? params.paymentDate : inst.paymentDate,
        allocations: [...(inst.allocations || []), newAllocationItem],
      };
    });

    // 2. Reconcile contract financials
    const totalInstPaid = updatedInstallments.reduce((s, inst) => s + inst.paidAmount, 0);
    const newPaidSoFar = (contract.financials.downPaymentPaid ? contract.financials.downPayment : 0) + totalInstPaid;
    const newRemainingBalance = Math.max(0, contract.financials.totalAgreedPrice - newPaidSoFar);

    const newContractStatus =
      newRemainingBalance === 0 && (contract.financials.downPaymentPaid || contract.financials.downPayment === 0)
        ? ('completed' as const)
        : contract.status === 'draft' || contract.status === 'ready_to_sign'
        ? ('signed' as const)
        : contract.status;

    const updatedContract: SmartContract = {
      ...contract,
      status: newContractStatus,
      installments: updatedInstallments,
      financials: {
        ...contract.financials,
        paidSoFar: newPaidSoFar,
        remainingBalance: newRemainingBalance,
      },
      unappliedCredit: (contract.unappliedCredit || 0) + unapplied,
      updatedAt: new Date().toISOString(),
    };

    setContracts((prev) => prev.map((c) => (c.id === contract.id ? updatedContract : c)));

    // 3. Handle DIRECT vs. INDIRECT Accounting Movement
    if (params.isIndirect) {
      // INDIRECT TRANSACTION: Strictly NO company cash or bank flow, NO Income creation!
      const newIndirect: IndirectTransaction = {
        id: `ind-${Date.now()}`,
        trackingNumber: `IND-${Math.floor(1000 + Math.random() * 9000)}`,
        date: params.paymentDate,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        vehicleLabel: contract.vehicleLabel,
        payerRole: 'buyer',
        payerName: contract.parties.buyer.name,
        receiverRole: 'seller',
        receiverName: params.indirectReceiverName || contract.parties.seller.name,
        amount: params.amount,
        purpose: `تسویه مستقیم ثمن معامله قرارداد ${contract.contractNumber} (${contract.vehicleLabel})`,
        supportingDocument: params.supportingDoc || params.trackingNumber,
        status: 'confirmed',
        notes: params.notes || 'تسویه مستقیم و بدون گردش در صندوق نمایشگاه (Zero Cash Flow)',
        createdAt: new Date().toISOString(),
      };

      setIndirectTransactions((prev) => [newIndirect, ...prev]);

      addActivity({
        type: 'PaymentMade' as any,
        title: `ثبت تراکنش غیرمستقیم قرارداد ${contract.contractNumber}`,
        description: `تسویه مستقیم مبلغ ${formatToman(params.amount)} از طرف ${contract.parties.buyer.name} به ${newIndirect.receiverName} (تسویه خارج از صندوق - بدون اثر بر نقدینگی)`,
        relatedId: contract.id,
        actorName: 'امور قراردادها',
      });

      showToast(`تسویه مستقیم به مبلغ ${formatToman(params.amount)} ثبت شد (بدون تغییر در موجودی صندوق).`, 'info');
      return { success: true, indirectId: newIndirect.id };
    } else {
      // DIRECT TRANSACTION: Creates REAL accounting transaction (Income) under category 'بیعانه و قرارداد'
      const targetAcc = financialAccounts.find((a) => a.id === params.financialAccountId);
      const accRefNote = targetAcc ? `حساب واریزی: ${targetAcc.name} (${targetAcc.id})` : 'صندوق نقد / حساب اصلی';

      const newIncome: Income = {
        id: `inc-contract-${Date.now()}`,
        date: params.paymentDate,
        category: 'بیعانه و قرارداد',
        description: `وصول اقساط قرارداد ${contract.contractType === 'sale' ? 'فروش' : 'خرید'} ${contract.contractNumber} (${contract.vehicleLabel})`,
        amount: params.amount,
        personName: targetAcc ? targetAcc.name : 'صندوق نمایشگاه / حساب بانکی',
        vehicleId: contract.vehicleId,
        vehicleLabel: contract.vehicleLabel,
        notes: `وصول مستقیم وجه قرارداد ${contract.contractNumber}. نحوه پرداخت: ${params.paymentMethod}${params.trackingNumber ? ` (پیگیری: ${params.trackingNumber})` : ''} - ${accRefNote}${params.notes ? ` - ${params.notes}` : ''}`,
        periodId: activePeriodId,
        createdAt: new Date().toISOString(),
      };

      setIncomes((prev) => [newIncome, ...prev]);

      addActivity({
        type: 'IncomeAdded' as any,
        title: `وصول مستقیم اقساط قرارداد ${contract.contractNumber}`,
        description: `مبلغ ${formatToman(params.amount)} به حساب ${targetAcc?.name || 'صندوق'} واریز شد.${unapplied > 0 ? ` (مبلغ ${formatToman(unapplied)} بستانکاری)` : ''}`,
        relatedId: contract.id,
        actorName: 'امور مالی و اقساط',
      });

      showToast(`پرداخت به مبلغ ${formatToman(params.amount)} وصول و در حساب ${targetAcc?.name || 'صندوق'} ثبت شد.`, 'success');
      return { success: true, incomeId: newIncome.id };
    }
  };

  // -------------------------------------------------------------
  // Phase 09B: Multiple Financial Accounts & Internal Transfers
  // -------------------------------------------------------------
  const liveFinancialAccounts = useMemo<FinancialAccount[]>(() => {
    return financialAccounts.map((acc) => {
      let balance = acc.openingBalance;

      // Inflows and outflows from Internal Transfers (Strictly neutral across dealership)
      accountTransfers.forEach((trf) => {
        if (trf.destinationAccountId === acc.id) {
          balance += trf.amount;
        }
        if (trf.sourceAccountId === acc.id) {
          balance -= trf.amount;
        }
      });

      // Inflows from Investor Contributions via company account
      investorProfiles.forEach((inv) => {
        inv.contributions.forEach((c) => {
          if (c.channel === 'company_account' && c.destinationAccountId === acc.id) {
            balance += c.amount;
          }
        });
        inv.settlements.forEach((s) => {
          if (s.sourceAccountId === acc.id) {
            balance -= s.amount;
          }
        });
      });

      // Inflows from Commission payments
      dealCommissions.forEach((comm) => {
        comm.payments.forEach((p) => {
          if (p.destinationAccountId === acc.id) {
            balance += p.amount;
          }
        });
      });

      // Inflows from Direct Incomes referencing this account
      incomes.forEach((inc) => {
        if (inc.notes?.includes(acc.id) || inc.notes?.includes(acc.name) || inc.personName?.includes(acc.name)) {
          balance += inc.amount;
        }
      });

      // Outflows from Direct Expenses referencing this account
      expenses.forEach((exp) => {
        if (exp.status === 'active' && (exp.notes?.includes(acc.id) || exp.notes?.includes(acc.name))) {
          balance -= exp.amount;
        }
      });

      // Outflows from Owner settlements referencing this account
      ownerSettlements.forEach((os) => {
        if (os.notes?.includes(acc.id) || os.notes?.includes(acc.name)) {
          balance -= os.paidAmount;
        }
      });

      return {
        ...acc,
        currentBalance: balance,
      };
    });
  }, [
    financialAccounts,
    accountTransfers,
    investorProfiles,
    dealCommissions,
    incomes,
    expenses,
    ownerSettlements,
  ]);

  const addFinancialAccount = (accountData: Omit<FinancialAccount, 'id' | 'createdAt'>) => {
    const newAccount: FinancialAccount = {
      ...accountData,
      id: `acc-${Date.now()}`,
      currentBalance: accountData.openingBalance,
      createdAt: DEALERSHIP_CURRENT_DATE,
    };
    setFinancialAccounts((prev) => [...prev, newAccount]);
    addActivity({
      type: 'AdvanceAdded' as any,
      title: 'افتتاح حساب مالی جدید',
      description: `حساب «${newAccount.name}» با مانده اولیه ${formatToman(newAccount.openingBalance)} ثبت شد.`,
      relatedId: newAccount.id,
      actorName: 'مدیریت مالی',
    });
    showToast(`حساب «${newAccount.name}» با موفقیت افزوده شد.`, 'success');
  };

  const updateFinancialAccount = (updatedAccount: FinancialAccount) => {
    setFinancialAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    showToast(`اطلاعات حساب «${updatedAccount.name}» به‌روزرسانی شد.`, 'success');
  };

  const transferBetweenAccounts = (params: {
    date: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    referenceNumber?: string;
    reason: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    if (params.amount <= 0) {
      return { success: false, error: 'مبلغ انتقال باید بزرگتر از صفر باشد.' };
    }
    if (params.sourceAccountId === params.destinationAccountId) {
      return { success: false, error: 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند.' };
    }

    const sourceAcc = financialAccounts.find((a) => a.id === params.sourceAccountId);
    const destAcc = financialAccounts.find((a) => a.id === params.destinationAccountId);

    if (!sourceAcc || !destAcc) {
      return { success: false, error: 'حساب مبدأ یا مقصد یافت نشد.' };
    }

    const newTransfer: AccountTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
      date: params.date,
      sourceAccountId: sourceAcc.id,
      sourceAccountName: sourceAcc.name,
      destinationAccountId: destAcc.id,
      destinationAccountName: destAcc.name,
      amount: params.amount,
      referenceNumber: params.referenceNumber,
      reason: params.reason,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    setAccountTransfers((prev) => [newTransfer, ...prev]);

    addActivity({
      type: 'AdvanceSettled' as any,
      title: `انتقال داخلی وجه بین حساب‌ها (${newTransfer.transferNumber})`,
      description: `انتقال مبلغ ${formatToman(params.amount)} از «${sourceAcc.name}» به «${destAcc.name}» (اثر خنثی بر سود/زیان شرکت)`,
      relatedId: newTransfer.id,
      actorName: 'امور خزانه‌داری',
    });

    showToast(`انتقال مبلغ ${formatToman(params.amount)} با موفقیت ثبت شد (بدون تغییر در درآمد/هزینه کل).`, 'success');
    return { success: true };
  };

  // -------------------------------------------------------------
  // Phase 09B: Indirect Transactions
  // -------------------------------------------------------------
  const recordIndirectTransaction = (
    params: Omit<IndirectTransaction, 'id' | 'createdAt' | 'trackingNumber'>
  ): { success: boolean; indirectId?: string; error?: string } => {
    if (params.amount <= 0) {
      return { success: false, error: 'مبلغ تراکنش باید بزرگتر از صفر باشد.' };
    }
    if (!params.payerName.trim() || !params.receiverName.trim()) {
      return { success: false, error: 'مشخصات پرداخت‌کننده و دریافت‌کننده الزامی است.' };
    }

    const newIndirect: IndirectTransaction = {
      ...params,
      id: `ind-${Date.now()}`,
      trackingNumber: `IND-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    setIndirectTransactions((prev) => [newIndirect, ...prev]);

    addActivity({
      type: 'PaymentMade' as any,
      title: `ثبت تراکنش غیرمستقیم (${newIndirect.trackingNumber})`,
      description: `تسویه مستقیم ${formatToman(params.amount)} بین ${params.payerName} و ${params.receiverName} (تسویه بدون گردش صندوق)`,
      relatedId: newIndirect.id,
      actorName: 'امور قراردادها',
    });

    showToast(`تراکنش غیرمستقیم ثبت گردید (حساب‌های صندوق نمایشگاه بدون تغییر ماند).`, 'success');
    return { success: true, indirectId: newIndirect.id };
  };

  // -------------------------------------------------------------
  // Phase 09B: Commission Management
  // -------------------------------------------------------------
  const addDealCommission = (
    commissionData: Omit<DealCommission, 'id' | 'createdAt' | 'payments' | 'receivedAmount' | 'outstandingAmount' | 'status'>
  ) => {
    const newCommission: DealCommission = {
      ...commissionData,
      id: `comm-${Date.now()}`,
      receivedAmount: 0,
      outstandingAmount: commissionData.totalAgreedCommission,
      status: 'unpaid',
      payments: [],
      createdAt: DEALERSHIP_CURRENT_DATE,
    };

    setDealCommissions((prev) => [newCommission, ...prev]);
    showToast(`توافق‌نامه کمیسیون معامله «${newCommission.vehicleLabel}» ثبت شد.`, 'success');
  };

  const registerCommissionPayment = (params: {
    commissionId: string;
    date: string;
    payerRole: 'buyer' | 'seller';
    payerName: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'pos' | 'cheque';
    destinationAccountId?: string;
    trackingNumber?: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const commission = dealCommissions.find((c) => c.id === params.commissionId);
    if (!commission) {
      return { success: false, error: 'پرونده کمیسیون مورد نظر یافت نشد.' };
    }
    if (params.amount <= 0) {
      return { success: false, error: 'مبلغ وصول کمیسیون باید بزرگتر از صفر باشد.' };
    }

    const targetAccount = financialAccounts.find((a) => a.id === params.destinationAccountId);

    // 1. Create real Income record under category 'کمیسیون و حق‌العمل'
    const newIncome: Income = {
      id: `inc-comm-${Date.now()}`,
      date: params.date,
      category: 'کمیسیون و حق‌العمل',
      description: `وصول کمیسیون معامله ${commission.vehicleLabel} از ${params.payerName} (${params.payerRole === 'buyer' ? 'خریدار' : 'فروشنده'})`,
      amount: params.amount,
      personName: targetAccount ? targetAccount.name : 'صندوق / حساب نمایشگاه',
      vehicleLabel: commission.vehicleLabel,
      vehicleId: commission.vehicleId,
      notes: `وصول حق‌العمل معامله. شیوه: ${params.paymentMethod} - پیگیری: ${params.trackingNumber || 'ثبت دستی'}${targetAccount ? ` - واریز به: ${targetAccount.name}` : ''}${params.notes ? ` - ${params.notes}` : ''}`,
      periodId: activePeriodId,
      createdAt: new Date().toISOString(),
    };

    setIncomes((prev) => [newIncome, ...prev]);

    // 2. Add payment to Commission record
    const newPayment: CommissionPayment = {
      id: `cp-${Date.now()}`,
      date: params.date,
      payerRole: params.payerRole,
      payerName: params.payerName,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      destinationAccountId: targetAccount?.id,
      destinationAccountName: targetAccount?.name,
      trackingNumber: params.trackingNumber,
      notes: params.notes,
      incomeId: newIncome.id,
      createdAt: new Date().toISOString(),
    };

    const newReceived = commission.receivedAmount + params.amount;
    const newOutstanding = Math.max(0, commission.totalAgreedCommission - newReceived);
    const newStatus: CommissionStatus =
      newOutstanding === 0 ? 'settled' : newReceived > 0 ? 'partially_paid' : 'unpaid';

    setDealCommissions((prev) =>
      prev.map((c) =>
        c.id === commission.id
          ? {
              ...c,
              receivedAmount: newReceived,
              outstandingAmount: newOutstanding,
              status: newStatus,
              payments: [...c.payments, newPayment],
            }
          : c
      )
    );

    addActivity({
      type: 'IncomeAdded' as any,
      title: `وصول کمیسیون معامله ${commission.vehicleLabel}`,
      description: `مبلغ ${formatToman(params.amount)} بابت کمیسیون ${params.payerName} وصول و به عنوان درآمد ثبت گردید.`,
      relatedId: commission.id,
      actorName: 'امور قراردادها و کمیسیون',
    });

    showToast(`کمیسیون به مبلغ ${formatToman(params.amount)} وصول و در دفاتر ثبت گردید.`, 'success');
    return { success: true };
  };

  // -------------------------------------------------------------
  // Phase 09B: Investor Wallets & Capital Management
  // -------------------------------------------------------------
  const investorSummaries = useMemo<InvestorWalletSummary[]>(() => {
    return investorProfiles.map((inv) => {
      const totalContributedCapital = inv.contributions.reduce((s, c) => s + c.amount, 0);
      const activeAllocatedCapital = inv.allocations
        .filter((a) => a.status === 'active')
        .reduce((s, a) => s + a.allocatedCapital, 0);

      const totalCapitalRepaid = inv.settlements
        .filter((s) => s.type === 'capital_repayment')
        .reduce((s, sItem) => s + sItem.amount, 0);

      const totalProfitSettled = inv.settlements
        .filter((s) => s.type === 'profit_distribution')
        .reduce((s, sItem) => s + sItem.amount, 0);

      const totalRealizedProfit = inv.allocations
        .filter((a) => a.status === 'exited')
        .reduce((s, a) => s + (a.realizedProfit || 0), 0);

      const unallocatedCapital = Math.max(
        0,
        totalContributedCapital - activeAllocatedCapital - totalCapitalRepaid
      );

      const unsettledProfit = Math.max(0, totalRealizedProfit - totalProfitSettled);
      const currentDealershipLiability = unallocatedCapital + activeAllocatedCapital + unsettledProfit;

      return {
        investorId: inv.id,
        investorName: inv.name,
        phone: inv.phone,
        totalContributedCapital,
        activeAllocatedCapital,
        unallocatedCapital,
        totalRealizedProfit,
        totalProfitSettled,
        totalCapitalRepaid,
        unsettledProfit,
        currentDealershipLiability,
      };
    });
  }, [investorProfiles]);

  const addInvestorProfile = (
    profileData: Omit<InvestorProfile, 'id' | 'createdAt' | 'contributions' | 'allocations' | 'settlements'>
  ) => {
    const newProfile: InvestorProfile = {
      ...profileData,
      id: `inv-${Date.now()}`,
      contributions: [],
      allocations: [],
      settlements: [],
      createdAt: DEALERSHIP_CURRENT_DATE,
    };

    setInvestorProfiles((prev) => [...prev, newProfile]);
    addActivity({
      type: 'AdvanceAdded' as any,
      title: 'افتتاح پرونده سرمایه‌گذار',
      description: `پرونده سرمایه‌گذار «${newProfile.name}» با موفقیت افتتاح شد.`,
      relatedId: newProfile.id,
      actorName: 'مدیریت سرمایه‌گذاری',
    });
    showToast(`پرونده سرمایه‌گذار «${newProfile.name}» تشکیل شد.`, 'success');
  };

  const updateInvestorProfile = (updatedProfile: InvestorProfile) => {
    setInvestorProfiles((prev) => prev.map((inv) => (inv.id === updatedProfile.id ? updatedProfile : inv)));
    showToast(`اطلاعات سرمایه‌گذار «${updatedProfile.name}» به‌روزرسانی شد.`, 'success');
  };

  const recordInvestorContribution = (params: {
    investorId: string;
    date: string;
    amount: number;
    channel: 'company_account' | 'direct_to_seller';
    destinationAccountId?: string;
    sellerOrOwnerName?: string;
    supportingDocument?: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const investor = investorProfiles.find((i) => i.id === params.investorId);
    if (!investor) return { success: false, error: 'سرمایه‌گذار مورد نظر یافت نشد.' };
    if (params.amount <= 0) return { success: false, error: 'مبلغ سرمایه‌گذاری باید بزرگتر از صفر باشد.' };

    const targetAccount = financialAccounts.find((a) => a.id === params.destinationAccountId);

    const newContribution: InvestorContribution = {
      id: `ic-${Date.now()}`,
      investorId: investor.id,
      date: params.date,
      amount: params.amount,
      channel: params.channel,
      destinationAccountId: targetAccount?.id,
      destinationAccountName: targetAccount?.name,
      sellerOrOwnerName: params.sellerOrOwnerName,
      supportingDocument: params.supportingDocument,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    // Note: NEVER create an Income record for capital contribution!
    setInvestorProfiles((prev) =>
      prev.map((i) =>
        i.id === investor.id
          ? {
              ...i,
              contributions: [newContribution, ...i.contributions],
            }
          : i
      )
    );

    addActivity({
      type: 'AdvanceAdded' as any,
      title: `واریز سرمایه توسط ${investor.name}`,
      description: `مبلغ ${formatToman(params.amount)} اصل سرمایه تأمین شد (بدون احتساب به عنوان درآمد نمایشگاه). کانال: ${params.channel === 'company_account' ? targetAccount?.name || 'حساب شرکت' : `مستقیم به ${params.sellerOrOwnerName || 'فروشنده'}`}`,
      relatedId: investor.id,
      actorName: 'امور سرمایه‌گذاری',
    });

    showToast(`واریز سرمایه به مبلغ ${formatToman(params.amount)} ثبت شد (مجزا از درآمدهای نمایشگاه).`, 'success');
    return { success: true };
  };

  const allocateInvestorToDeal = (params: {
    investorId: string;
    vehicleId: string;
    vehicleLabel: string;
    contractId?: string;
    contractNumber?: string;
    allocationDate: string;
    allocatedCapital: number;
    profitSharePercentage?: number;
    agreedFixedProfit?: number;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const investor = investorProfiles.find((i) => i.id === params.investorId);
    if (!investor) return { success: false, error: 'سرمایه‌گذار مورد نظر یافت نشد.' };
    if (params.allocatedCapital <= 0) return { success: false, error: 'مبلغ تخصیص سرمایه باید بزرگتر از صفر باشد.' };

    const summary = investorSummaries.find((s) => s.investorId === investor.id);
    if (summary && params.allocatedCapital > summary.unallocatedCapital) {
      return {
        success: false,
        error: `مبلغ تخصیص (${formatToman(params.allocatedCapital)}) از سرمایه آزاد سرمایه‌گذار (${formatToman(summary.unallocatedCapital)}) بیشتر است.`,
      };
    }

    const newAllocation: InvestorDealAllocation = {
      id: `ia-${Date.now()}`,
      investorId: investor.id,
      vehicleId: params.vehicleId,
      vehicleLabel: params.vehicleLabel,
      contractId: params.contractId,
      contractNumber: params.contractNumber,
      allocationDate: params.allocationDate,
      allocatedCapital: params.allocatedCapital,
      profitSharePercentage: params.profitSharePercentage,
      agreedFixedProfit: params.agreedFixedProfit,
      status: 'active',
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    setInvestorProfiles((prev) =>
      prev.map((i) =>
        i.id === investor.id
          ? {
              ...i,
              allocations: [newAllocation, ...i.allocations],
            }
          : i
      )
    );

    addActivity({
      type: 'AdvanceAdded' as any,
      title: `تخصیص سرمایه به معامله ${params.vehicleLabel}`,
      description: `تخصیص ${formatToman(params.allocatedCapital)} از سرمایه ${investor.name} به خودرو ${params.vehicleLabel}`,
      relatedId: investor.id,
      actorName: 'امور سرمایه‌گذاری',
    });

    showToast(`سرمایه به مبلغ ${formatToman(params.allocatedCapital)} به خودرو اختصاص یافت.`, 'success');
    return { success: true };
  };

  const exitInvestorAllocation = (params: {
    investorId: string;
    allocationId: string;
    exitDate: string;
    realizedProfit: number;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const investor = investorProfiles.find((i) => i.id === params.investorId);
    if (!investor) return { success: false, error: 'سرمایه‌گذار مورد نظر یافت نشد.' };

    const allocation = investor.allocations.find((a) => a.id === params.allocationId);
    if (!allocation) return { success: false, error: 'ردیف تخصیص سرمایه یافت نشد.' };

    setInvestorProfiles((prev) =>
      prev.map((i) => {
        if (i.id !== investor.id) return i;
        const updatedAllocations = i.allocations.map((a) => {
          if (a.id !== allocation.id) return a;
          return {
            ...a,
            status: 'exited' as const,
            exitDate: params.exitDate,
            realizedProfit: params.realizedProfit,
            capitalReturnedToUnallocated: true,
            notes: `${a.notes ? a.notes + ' | ' : ''}تسویه معامله در تاریخ ${params.exitDate} با سود محقق شده ${formatToman(params.realizedProfit)}`,
          };
        });
        return { ...i, allocations: updatedAllocations };
      })
    );

    addActivity({
      type: 'AdvanceSettled' as any,
      title: `تسویه و خروج سرمایه‌گذاری در معامله ${allocation.vehicleLabel}`,
      description: `اصل سرمایه (${formatToman(allocation.allocatedCapital)}) آزاد و سود ${formatToman(params.realizedProfit)} شناسایی گردید.`,
      relatedId: investor.id,
      actorName: 'امور سرمایه‌گذاری',
    });

    showToast(`معامله با موفقیت تسویه و سود ${formatToman(params.realizedProfit)} در کیف‌پول ثبت شد.`, 'success');
    return { success: true };
  };

  const settleInvestorProfitOrCapital = (params: {
    investorId: string;
    date: string;
    type: 'profit_distribution' | 'capital_repayment';
    amount: number;
    sourceAccountId?: string;
    paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'direct_reconciliation';
    trackingNumber?: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const investor = investorProfiles.find((i) => i.id === params.investorId);
    if (!investor) return { success: false, error: 'سرمایه‌گذار مورد نظر یافت نشد.' };
    if (params.amount <= 0) return { success: false, error: 'مبلغ پرداختی باید بزرگتر از صفر باشد.' };

    const sourceAccount = financialAccounts.find((a) => a.id === params.sourceAccountId);

    const newSettlement: InvestorSettlement = {
      id: `is-${Date.now()}`,
      settlementNumber: `STL-${Math.floor(100 + Math.random() * 900)}`,
      investorId: investor.id,
      investorName: investor.name,
      date: params.date,
      type: params.type,
      amount: params.amount,
      sourceAccountId: sourceAccount?.id,
      sourceAccountName: sourceAccount?.name,
      paymentMethod: params.paymentMethod,
      trackingNumber: params.trackingNumber,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    setInvestorProfiles((prev) =>
      prev.map((i) =>
        i.id === investor.id
          ? {
              ...i,
              settlements: [newSettlement, ...i.settlements],
            }
          : i
      )
    );

    addActivity({
      type: 'PaymentMade' as any,
      title: `${params.type === 'profit_distribution' ? 'پرداخت سود' : 'عودت اصل سرمایه'} به ${investor.name}`,
      description: `پرداخت مبلغ ${formatToman(params.amount)} از محل ${sourceAccount?.name || 'صندوق/بانک'} (سند ${newSettlement.settlementNumber})`,
      relatedId: investor.id,
      actorName: 'امور خزانه‌داری و سرمایه‌گذاران',
    });

    showToast(`پرداخت مبلغ ${formatToman(params.amount)} به ${investor.name} با موفقیت ثبت شد.`, 'success');
    return { success: true };
  };

  // ----------------------------------------------------
  // Phase 09C: Vehicle Technical Data, Expiring Documents, Presets, RBAC & Audit Log
  // ----------------------------------------------------
  const addExpiringDoc = (doc: Omit<VehicleExpiringDoc, 'id' | 'createdAt'>): VehicleExpiringDoc => {
    const newDoc: VehicleExpiringDoc = {
      ...doc,
      id: `DOC-EXP-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpiringDocs((prev) => [newDoc, ...prev]);

    addAuditLog({
      action: 'ثبت سند و مدرک خودرو',
      entityType: 'document',
      entityId: newDoc.id,
      entityTitle: `${newDoc.title} (${newDoc.vehicleLabel})`,
      details: `تاریخ انقضا: ${newDoc.expiryDate} - شماره سند: ${newDoc.documentNumber}`,
    });

    showToast(`سند «${newDoc.title}» با سررسید ${toPersianDigits(newDoc.expiryDate)} با موفقیت ثبت شد.`, 'success');
    return newDoc;
  };

  const updateExpiringDoc = (id: string, updates: Partial<VehicleExpiringDoc>) => {
    setExpiringDocs((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          const updated = { ...doc, ...updates };
          return updated;
        }
        return doc;
      })
    );

    addAuditLog({
      action: 'ویرایش مدرک / وضعیت انقضا',
      entityType: 'document',
      entityId: id,
      entityTitle: updates.title || 'سند خودرو',
      details: 'به‌روزرسانی مشخصات یا وضعیت سند در سامانه',
    });

    showToast('اطلاعات مدرک به‌روزرسانی شد.', 'info');
  };

  const deleteExpiringDoc = (id: string) => {
    const target = expiringDocs.find((d) => d.id === id);
    setExpiringDocs((prev) => prev.filter((d) => d.id !== id));

    addAuditLog({
      action: 'حذف مدرک از سامانه',
      entityType: 'document',
      entityId: id,
      entityTitle: target?.title || id,
      details: 'حذف دائم پرونده مدرک منقضی یا باطل‌شده',
    });

    showToast('مدرک از فهرست حذف شد.', 'info');
  };

  const addPreset = (preset: Omit<ReferencePreset, 'id'>): { success: boolean; preset?: ReferencePreset; error?: string } => {
    // Duplicate check within same category
    const isDup = presets.some(
      (p) => p.category === preset.category && p.name.trim().toLowerCase() === preset.name.trim().toLowerCase()
    );
    if (isDup) {
      showToast('عنوان واردشده در این دسته‌بندی قبلاً ثبت شده است.', 'error');
      return { success: false, error: 'عنوان تکراری است.' };
    }

    const newPreset: ReferencePreset = {
      ...preset,
      id: `pre-custom-${Date.now()}`,
    };

    setPresets((prev) => [...prev, newPreset]);

    addAuditLog({
      action: 'ایجاد مقدار مرجع در فهرست پایه‌ها',
      entityType: 'preset',
      entityId: newPreset.id,
      entityTitle: newPreset.name,
      details: `دسته‌بندی: ${newPreset.category}`,
    });

    showToast(`مقدار مرجع «${newPreset.name}» افزوده شد.`, 'success');
    return { success: true, preset: newPreset };
  };

  const updatePreset = (id: string, updates: Partial<ReferencePreset>) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('تغییرات مقدار مرجع ذخیره شد.', 'info');
  };

  const setCurrentUserRole = (newRole: UserRole) => {
    const roleDef = ROLE_DEFINITIONS[newRole];
    setCurrentUser((prev) => {
      const updated: DealershipUser = {
        ...prev,
        role: newRole,
      };
      return updated;
    });

    addAuditLog({
      action: 'تغییر نقش کاربری جاری',
      entityType: 'backup',
      entityTitle: roleDef.title,
      details: `جابجایی نقش امنیتی به ${roleDef.title}`,
    });

    showToast(`نقش کاربری به «${roleDef.title}» تغییر یافت.`, 'info');
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: `${DEALERSHIP_CURRENT_DATE} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  const checkPermission = (action: PermissionAction): boolean => {
    return checkRbacPermission(currentUser.role, action);
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
        incomes,
        cashAdvances,
        settlements,
        vehicles,
        personnel,
        activities,
        periods,
        openingDocuments,
        activePeriodId,
        customers,
        saleDossiers,
        consignmentAgreements,
        ownerSettlements,
        vehicleInspections,
        consignmentReturns,
        contracts: contracts || [],
        financialAccounts,
        accountTransfers,
        indirectTransactions,
        dealCommissions,
        investorProfiles,
        expiringDocs,
        presets,
        auditLogs,
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
        incomes,
        cashAdvances,
        settlements,
        vehicles,
        personnel,
        activities,
        periods,
        openingDocuments,
        activePeriodId,
        customers,
        saleDossiers,
        consignmentAgreements,
        ownerSettlements,
        vehicleInspections,
        consignmentReturns,
        contracts: contracts || [],
        financialAccounts,
        accountTransfers,
        indirectTransactions,
        dealCommissions,
        investorProfiles,
        expiringDocs,
        presets,
        auditLogs,
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
      if (result.restoredData.incomes) {
        setIncomes(result.restoredData.incomes);
      }
      setCashAdvances(result.restoredData.cashAdvances);
      setSettlements(result.restoredData.settlements);
      setVehicles(result.restoredData.vehicles);
      setPersonnel(result.restoredData.personnel);
      setActivities(result.restoredData.activities || []);
      if (result.restoredData.periods && result.restoredData.periods.length > 0) {
        setPeriods(result.restoredData.periods);
      }
      if (result.restoredData.openingDocuments) {
        setOpeningDocuments(result.restoredData.openingDocuments);
      }
      if (result.restoredData.activePeriodId) {
        setActivePeriodId(result.restoredData.activePeriodId);
        setViewingPeriodId(result.restoredData.activePeriodId);
      }
      if (result.restoredData.customers) {
        setCustomers(result.restoredData.customers);
      }
      if (result.restoredData.saleDossiers) {
        setSaleDossiers(result.restoredData.saleDossiers);
      }
      if (result.restoredData.consignmentAgreements) {
        setConsignmentAgreements(result.restoredData.consignmentAgreements);
      }
      if (result.restoredData.ownerSettlements) {
        setOwnerSettlements(result.restoredData.ownerSettlements);
      }
      if (result.restoredData.vehicleInspections) {
        setVehicleInspections(result.restoredData.vehicleInspections);
      }
      if (result.restoredData.consignmentReturns) {
        setConsignmentReturns(result.restoredData.consignmentReturns);
      }
      if (result.restoredData.contracts) {
        setContracts(result.restoredData.contracts);
      }
      if (result.restoredData.financialAccounts) {
        setFinancialAccounts(result.restoredData.financialAccounts);
      }
      if (result.restoredData.accountTransfers) {
        setAccountTransfers(result.restoredData.accountTransfers);
      }
      if (result.restoredData.indirectTransactions) {
        setIndirectTransactions(result.restoredData.indirectTransactions);
      }
      if (result.restoredData.dealCommissions) {
        setDealCommissions(result.restoredData.dealCommissions);
      }
      if (result.restoredData.investorProfiles) {
        setInvestorProfiles(result.restoredData.investorProfiles);
      }
      if (result.restoredData.expiringDocs) {
        setExpiringDocs(result.restoredData.expiringDocs);
      }
      if (result.restoredData.presets) {
        setPresets(result.restoredData.presets);
      }
      if (result.restoredData.auditLogs) {
        setAuditLogs(result.restoredData.auditLogs);
      }

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
      incomes,
      cashAdvances,
      settlements,
      vehicles,
      personnel,
      activities,
      periods,
      openingDocuments,
      activePeriodId,
      customers,
      saleDossiers,
      consignmentAgreements,
      ownerSettlements,
      vehicleInspections,
      consignmentReturns,
      contracts: contracts || [],
    });
  }, [
    expenses,
    incomes,
    cashAdvances,
    settlements,
    vehicles,
    personnel,
    activities,
    periods,
    openingDocuments,
    activePeriodId,
    customers,
    saleDossiers,
    consignmentAgreements,
    ownerSettlements,
    vehicleInspections,
    consignmentReturns,
    contracts,
  ]);

  const resetAllData = () => {
    setExpenses(INITIAL_EXPENSES);
    setIncomes(INITIAL_INCOMES);
    setCashAdvances(INITIAL_CASH_ADVANCES);
    setSettlements(INITIAL_SETTLEMENTS);
    setVehicles(INITIAL_VEHICLES);
    setPersonnel(INITIAL_PERSONNEL);
    setActivities(INITIAL_ACTIVITIES);
    setCustomers(INITIAL_CUSTOMERS);
    setSaleDossiers(INITIAL_SALE_DOSSIERS);
    setConsignmentAgreements(INITIAL_CONSIGNMENT_AGREEMENTS);
    setOwnerSettlements(INITIAL_OWNER_SETTLEMENTS);
    setVehicleInspections(INITIAL_VEHICLE_INSPECTIONS);
    setConsignmentReturns([]);
    setContracts(INITIAL_SMART_CONTRACTS);
    setFinancialAccounts(INITIAL_FINANCIAL_ACCOUNTS);
    setAccountTransfers(INITIAL_ACCOUNT_TRANSFERS);
    setIndirectTransactions(INITIAL_INDIRECT_TRANSACTIONS);
    setDealCommissions(INITIAL_DEAL_COMMISSIONS);
    setInvestorProfiles(INITIAL_INVESTORS);
    setPeriods([{
      id: 'period-1405-initial',
      title: 'سال ۱۴۰۵',
      startDate: '۱۴۰۵/۰۱/۰۱',
      status: 'active',
      createdAt: '۱۴۰۵/۰۱/۰۱',
    }]);
    setOpeningDocuments([]);
    setActivePeriodId('period-1405-initial');
    setViewingPeriodId('period-1405-initial');
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_incomes`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_advances`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_settlements`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_vehicles`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_personnel`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_activities`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_customers`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_sale_dossiers`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_consignments`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_owner_settlements`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_inspections`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_consignment_returns`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_contracts`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_financial_accounts`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_account_transfers`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_indirect_txs`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_commissions`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_investors`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_periods`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_opening_docs`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_period_id`);
    showToast('تمام داده‌ها به حالت اولیه بازنشانی شدند', 'info');
  };

  const getOpenItemsForNewPeriod = () => {
    // 1. Open advances per person
    const openAdvances: TransferredAdvanceItem[] = [];
    personnel
      .filter((p) => p.status === 'active')
      .forEach((p) => {
        const bal = personnelBalances.find((b) => b.personId === p.id);
        if (bal && bal.remainingBalance > 0) {
          openAdvances.push({
            personId: p.id,
            personName: p.name,
            originalAmount: bal.totalAdvanced,
            spentAmount: bal.totalExpenses,
            remainingAmount: bal.remainingBalance,
            action: 'transfer',
          });
        }
      });

    // 2. Open personal reimbursements
    const openReimbursements: TransferredReimbursementItem[] = [];
    personnel
      .filter((p) => p.status === 'active')
      .forEach((p) => {
        const bal = personnelBalances.find((b) => b.personId === p.id);
        if (bal && bal.needsReimbursementTotal > 0) {
          const personUnreimbExpenses = expenses.filter(
            (e) =>
              e.status === 'active' &&
              e.personId === p.id &&
              e.paymentSource === 'personal' &&
              e.reimbursementStatus === 'needs_reimbursement'
          );
          openReimbursements.push({
            personId: p.id,
            personName: p.name,
            amount: bal.needsReimbursementTotal,
            expenseCount: personUnreimbExpenses.length || 1,
            action: 'transfer',
          });
        }
      });

    // 3. Vehicle summaries
    const vehicleSummaries: VehicleOpeningSummary[] = vehicles
      .filter((v) => v.status === 'active')
      .map((v) => {
        const totalExpenses = expenses
          .filter((e) => e.status === 'active' && e.vehicleId === v.id)
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          vehicleId: v.id,
          vehicleLabel: v.fullName,
          totalExpensesBefore: totalExpenses,
        };
      });

    const openExpensesWithoutReceiptCount = expenses.filter(
      (e) => e.status === 'active' && (!e.hasReceipt || e.receipts.length === 0)
    ).length;

    return {
      openAdvances,
      openReimbursements,
      vehicleSummaries,
      openExpensesWithoutReceiptCount,
    };
  };

  const createOpeningPeriod = async (
    input: CreateOpeningDocumentInput
  ): Promise<{ success: boolean; periodId?: string; error?: string }> => {
    try {
      // 1. Mandatory Pre-Action Backup
      const currentPayload: FullDatabasePayload = {
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        expenses,
        cashAdvances,
        settlements,
        vehicles,
        personnel,
        activities,
        periods,
        openingDocuments,
        activePeriodId,
      };

      try {
        await createConsistentBackupZip(currentPayload, 'pre_new_period');
      } catch (backupErr: any) {
        const errorMsg = 'خطا در ایجاد نسخه پشتیبان خودکار پیش از شروع دوره جدید. عملیات به دلیل حفظ امنیت اطلاعات متوقف شد.';
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }

      // 2. Validate Document Data
      const finalPeriodTitle = (input.title || input.periodTitle || '').trim();
      if (!finalPeriodTitle) {
        return { success: false, error: 'عنوان دوره الزامی است.' };
      }
      if (!input.startDate.trim()) {
        return { success: false, error: 'تاریخ شروع دوره الزامی است.' };
      }

      const newPeriodId = `period-${Date.now()}`;
      const openingDocId = `opdoc-${Date.now()}`;

      // Calculate totals
      const totalTransferredAdvanceAmount = input.transferredAdvances
        .filter((a) => a.action === 'transfer')
        .reduce((sum, a) => sum + a.remainingAmount, 0);

      const totalTransferredReimbursementAmount = input.transferredReimbursements
        .filter((r) => r.action === 'transfer')
        .reduce((sum, r) => sum + r.amount, 0);

      // Snapshot for closing previous period
      const prevPeriodExpenses = expenses.filter(
        (e) => e.status === 'active' && (!e.periodId || e.periodId === activePeriodId)
      );
      const prevPeriodIncomes = incomes.filter((i) => !i.periodId || i.periodId === activePeriodId);
      const prevPeriodAdvances = cashAdvances.filter((a) => !a.periodId || a.periodId === activePeriodId);
      const prevOpDoc = openingDocuments.find((d) => d.periodId === activePeriodId);

      const prevExpensesTotal = prevPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
      const prevIncomesTotal = prevPeriodIncomes.reduce((sum, i) => sum + i.amount, 0);

      const prevSnapshot: PeriodSnapshot = {
        closingDate: input.startDate,
        totalExpenses: prevExpensesTotal,
        totalIncomes: prevIncomesTotal,
        netBalance: prevIncomesTotal - prevExpensesTotal,
        totalAdvances: prevPeriodAdvances.reduce((sum, a) => sum + a.amount, 0),
        outstandingAdvances: totalTransferredAdvanceAmount,
        outstandingReimbursements: totalTransferredReimbursementAmount,
        cashOpening: prevOpDoc?.cashBalance || 0,
        bankOpening: prevOpDoc?.bankBalance || 0,
        expenseCount: prevPeriodExpenses.length,
        incomeCount: prevPeriodIncomes.length,
        receiptCount: prevPeriodExpenses.filter((e) => e.hasReceipt && e.receipts.length > 0).length,
        vehiclesCount: vehicles.length,
        personnelCount: personnel.length,
      };

      const prevClosingCash = input.previousPeriodClosingCash ?? (prevOpDoc?.cashBalance || 0);
      const prevClosingBank = input.previousPeriodClosingBank ?? (prevOpDoc?.bankBalance || 0);
      const isReconciled =
        (input.cashBalance ?? 0) === prevClosingCash && (input.bankBalance ?? 0) === prevClosingBank;
      const discrepancyDiff = Math.abs(
        (prevClosingCash + prevClosingBank) - ((input.cashBalance ?? 0) + (input.bankBalance ?? 0))
      );

      // 3. Create Opening Document record
      const openingDoc: OpeningDocument = {
        id: openingDocId,
        periodId: newPeriodId,
        periodTitle: finalPeriodTitle,
        startDate: input.startDate,
        createdAt: DEALERSHIP_CURRENT_DATE,
        cashBalance: input.cashBalance || 0,
        bankBalance: input.bankBalance || 0,
        transferredAdvances: input.transferredAdvances,
        transferredReimbursements: input.transferredReimbursements,
        vehicleSummaries: input.vehicleSummaries || [],
        otherBalances: input.otherBalances || [],
        notes: input.notes,
        totalTransferredAdvanceAmount,
        totalTransferredReimbursementAmount,
        previousPeriodId: activePeriodId,
        previousPeriodClosingCash: prevClosingCash,
        previousPeriodClosingBank: prevClosingBank,
        reconciliationStatus: isReconciled ? 'matched' : 'discrepancy',
        reconciliationDifference: discrepancyDiff,
        status: 'active',
      };

      // 4. Archive previous active period(s) with locked status & snapshot
      const updatedPeriods: AccountingPeriod[] = periods.map((p) => {
        if (p.id === activePeriodId || p.status === 'active') {
          return {
            ...p,
            status: 'closed' as const,
            isLocked: true,
            closedAt: input.startDate,
            closingNotes: `بایگانی خودکار به هنگام افتتاح دوره «${finalPeriodTitle}»`,
            snapshot: prevSnapshot,
          };
        }
        return p;
      });

      // 5. Add new period
      const newPeriod: AccountingPeriod = {
        id: newPeriodId,
        title: finalPeriodTitle,
        startDate: input.startDate,
        status: 'active',
        isLocked: false,
        createdAt: DEALERSHIP_CURRENT_DATE,
        openingDocumentId: openingDocId,
      };

      updatedPeriods.unshift(newPeriod);

      // 6. Stamp historical expenses and advances that didn't have a periodId
      setExpenses((prev) =>
        prev.map((e) => {
          if (!e.periodId) {
            return { ...e, periodId: activePeriodId };
          }
          return e;
        })
      );

      // 7. Create explicit linked CashAdvances for transferred advances into the new period
      const newOpeningAdvances: CashAdvance[] = input.transferredAdvances
        .filter((a) => a.action === 'transfer' && a.remainingAmount > 0)
        .map((a, idx) => ({
          id: `adv-open-${Date.now()}-${idx}`,
          personId: a.personId,
          personName: a.personName,
          amount: a.remainingAmount,
          date: input.startDate,
          reason: `مانده تنخواه افتتاحیه منتقل‌شده از دوره قبل`,
          notes: `انتقال خودکار از سند افتتاحیه دوره «${finalPeriodTitle}»`,
          status: 'open' as const,
          periodId: newPeriodId,
          isOpeningBalance: true,
          sourceAdvanceId: a.advanceId,
          sourcePeriodId: activePeriodId,
          openingDocumentId: openingDocId,
          openingAmount: a.remainingAmount,
          createdAt: input.startDate,
          syncStatus: 'local' as const,
        }));

      setCashAdvances((prev) => [
        ...newOpeningAdvances,
        ...prev.map((a) => (!a.periodId ? { ...a, periodId: activePeriodId } : a)),
      ]);

      // 8. Archive previous opening docs
      setOpeningDocuments((prev) => [
        openingDoc,
        ...prev.map((d) => (d.status === 'active' ? { ...d, status: 'archived' as const } : d)),
      ]);

      setPeriods(updatedPeriods);
      setActivePeriodId(newPeriodId);
      setViewingPeriodId(newPeriodId);

      addActivity({
        type: 'OpeningDocumentCreated',
        title: 'ثبت سند افتتاحیه و دوره جدید',
        description: `دوره مالی «${finalPeriodTitle}» با موفقیت افتتاح و فعال گردید.`,
        relatedId: openingDocId,
      });

      showToast('سند افتتاحیه با موفقیت ثبت شد و دوره جدید آغاز گردید.', 'success');
      return { success: true, periodId: newPeriodId };
    } catch (err: any) {
      console.error('Error creating opening document:', err);
      const errorMsg = err?.message || 'خطای غیرمنتظره در ایجاد سند افتتاحیه.';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  };

  const settleOpeningReimbursement = (
    openingDocId: string,
    personId: string,
    amount: number,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (amount <= 0) return { success: false, error: 'مبلغ بازپرداخت باید بزرگتر از صفر باشد' };

    let found = false;
    setOpeningDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === openingDocId || (!openingDocId && doc.periodId === activePeriodId)) {
          const updatedReimbs = doc.transferredReimbursements.map((r) => {
            if (r.personId === personId && r.action === 'transfer') {
              found = true;
              const currentSettled = r.settledAmount || 0;
              return {
                ...r,
                settledAmount: currentSettled + amount,
                settledAt: DEALERSHIP_CURRENT_DATE,
              };
            }
            return r;
          });
          return { ...doc, transferredReimbursements: updatedReimbs };
        }
        return doc;
      })
    );

    if (!found) {
      return { success: false, error: 'مورد بازپرداخت افتتاحیه برای این شخص یافت نشد.' };
    }

    showToast(`مبلغ ${formatToman(amount)} بابت بدهی بازپرداخت افتتاحیه تسویه شد.`, 'success');
    addActivity({
      type: 'ExpenseUpdated',
      title: 'تسویه بازپرداخت افتتاحیه',
      description: `مبلغ ${formatToman(amount)} بابت بدهی بازپرداخت افتتاحیه تسویه شد (بدون ایجاد هزینه جدید).`,
      actorName: 'مدیریت مالی',
    });
    return { success: true };
  };

  const reopenClosedPeriod = (periodId: string, reason: string): { success: boolean; error?: string } => {
    if (!reason.trim()) {
      return { success: false, error: 'ثبت دلیل برای بازگشایی دوره بسته الزامی است.' };
    }

    const target = periods.find((p) => p.id === periodId);
    if (!target) return { success: false, error: 'دوره مورد نظر یافت نشد.' };

    const reopenRecord: PeriodReopenRecord = {
      reopenedAt: DEALERSHIP_CURRENT_DATE,
      reason: reason.trim(),
      actorName: 'مدیریت مالی',
    };

    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id === periodId) {
          const history = p.reopenHistory || [];
          return {
            ...p,
            status: 'active' as const,
            isLocked: false,
            reopenedAt: DEALERSHIP_CURRENT_DATE,
            reopenedReason: reason.trim(),
            reopenHistory: [reopenRecord, ...history],
          };
        }
        return p;
      })
    );

    addActivity({
      type: 'ExpenseUpdated',
      title: 'بازگشایی دوره مالی برای اصلاح',
      description: `دوره «${target.title}» جهت اصلاح با دلیل: ${reason.trim()} بازگشایی شد.`,
      actorName: 'مدیریت مالی',
    });

    showToast(`دوره «${target.title}» بازگشایی شد و قفل آن برداشته شد.`, 'info');
    return { success: true };
  };

  const closePeriodWithCheck = (
    periodId: string,
    notes?: string
  ): { success: boolean; warnings?: string[]; error?: string } => {
    const target = periods.find((p) => p.id === periodId);
    if (!target) return { success: false, error: 'دوره مورد نظر یافت نشد.' };

    // Run integrity check for this period
    const periodExpenses = expenses.filter(
      (e) => e.status === 'active' && (!e.periodId || e.periodId === periodId)
    );
    const periodIncomes = incomes.filter((i) => !i.periodId || i.periodId === periodId);
    const periodAdvances = cashAdvances.filter((a) => !a.periodId || a.periodId === periodId);

    const warnings: string[] = [];
    const openAdvancesCount = periodAdvances.filter((a) => a.status === 'open' || a.status === 'needs_settlement').length;
    if (openAdvancesCount > 0) {
      warnings.push(`${openAdvancesCount} تنخواه تسویه نشده در این دوره وجود دارد.`);
    }

    const unreceiptedExpensesCount = periodExpenses.filter((e) => !e.hasReceipt || e.receipts.length === 0).length;
    if (unreceiptedExpensesCount > 0) {
      warnings.push(`${unreceiptedExpensesCount} هزینه بدون پیوست رسید در این دوره ثبت شده است.`);
    }

    const opDoc = openingDocuments.find((d) => d.periodId === periodId);
    const expTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const incTotal = periodIncomes.reduce((sum, i) => sum + i.amount, 0);

    const snapshot: PeriodSnapshot = {
      closingDate: DEALERSHIP_CURRENT_DATE,
      totalExpenses: expTotal,
      totalIncomes: incTotal,
      netBalance: incTotal - expTotal,
      totalAdvances: periodAdvances.reduce((sum, a) => sum + a.amount, 0),
      outstandingAdvances: periodAdvances
        .filter((a) => a.status !== 'settled')
        .reduce((sum, a) => sum + a.amount, 0),
      outstandingReimbursements: periodExpenses
        .filter((e) => e.paymentSource === 'personal' && e.reimbursementStatus === 'needs_reimbursement')
        .reduce((sum, e) => sum + (e.reimbursementAmount || e.amount), 0),
      cashOpening: opDoc?.cashBalance || 0,
      bankOpening: opDoc?.bankBalance || 0,
      expenseCount: periodExpenses.length,
      incomeCount: periodIncomes.length,
      receiptCount: periodExpenses.filter((e) => e.hasReceipt && e.receipts.length > 0).length,
      vehiclesCount: vehicles.length,
      personnelCount: personnel.length,
    };

    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id === periodId) {
          return {
            ...p,
            status: 'closed' as const,
            isLocked: true,
            closedAt: DEALERSHIP_CURRENT_DATE,
            closingNotes: notes || p.closingNotes,
            snapshot,
          };
        }
        return p;
      })
    );

    addActivity({
      type: 'ExpenseUpdated',
      title: 'بستن دوره مالی',
      description: `دوره «${target.title}» با موفقیت بسته و قفل گردید.`,
      actorName: 'مدیریت مالی',
    });

    showToast(`دوره مالی «${target.title}» با موفقیت بسته و قفل شد.`, 'success');
    return { success: true, warnings };
  };

  const correctClosedPeriodRecord = (
    type: 'expense' | 'advance' | 'settlement',
    recordId: string,
    updatedData: any,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!reason.trim()) {
      return { success: false, error: 'ثبت دلیل اصلاح برای دوره‌های بسته الزامی است.' };
    }

    if (type === 'expense') {
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id === recordId) {
            return {
              ...e,
              ...updatedData,
              notes: `${e.notes ? e.notes + ' | ' : ''}اصلاح شده: ${reason.trim()} (${DEALERSHIP_CURRENT_DATE})`,
            };
          }
          return e;
        })
      );
    } else if (type === 'advance') {
      setCashAdvances((prev) =>
        prev.map((a) => {
          if (a.id === recordId) {
            return {
              ...a,
              ...updatedData,
              notes: `${a.notes ? a.notes + ' | ' : ''}اصلاح شده: ${reason.trim()} (${DEALERSHIP_CURRENT_DATE})`,
            };
          }
          return a;
        })
      );
    }

    addActivity({
      type: 'ExpenseUpdated',
      title: 'اصلاح رکورد در دوره بسته',
      description: `ثبت اصلاحیه با دلیل: ${reason.trim()}`,
      relatedId: recordId,
      actorName: 'مدیریت مالی',
    });

    showToast('اصلاحیه با موفقیت ثبت شد', 'success');
    return { success: true };
  };

  const checkPeriodIntegrity = (): PeriodIntegrityResult => {
    const issues: PeriodIntegrityIssue[] = [];

    // Check 1: Missing periodId in expenses
    const orphanExpenses = expenses.filter((e) => !e.periodId);
    if (orphanExpenses.length > 0) {
      issues.push({
        id: `issue-exp-orphan`,
        type: 'missing_period',
        title: 'هزینه‌های بدون دوره مالی',
        severity: 'error',
        description: `${orphanExpenses.length} هزینه بدون انتساب به دوره مالی یافت شد.`,
        relatedId: orphanExpenses[0]?.id,
      });
    }

    // Check 2: Missing periodId in cash advances
    const orphanAdvances = cashAdvances.filter((a) => !a.periodId);
    if (orphanAdvances.length > 0) {
      issues.push({
        id: `issue-adv-orphan`,
        type: 'missing_period',
        title: 'تنخواه‌های بدون دوره مالی',
        severity: 'error',
        description: `${orphanAdvances.length} تنخواه بدون انتساب به دوره مالی یافت شد.`,
        relatedId: orphanAdvances[0]?.id,
      });
    }

    // Check 3: Date boundary mismatches
    const dateMismatches: string[] = [];
    periods.forEach((p) => {
      const pExpenses = expenses.filter((e) => e.periodId === p.id);
      pExpenses.forEach((e) => {
        const check = isDateWithinPeriod(e.date, p);
        if (!check.valid) {
          dateMismatches.push(e.id);
        }
      });
    });
    if (dateMismatches.length > 0) {
      issues.push({
        id: `issue-date-mismatch`,
        type: 'period_mismatch',
        title: 'تاریخ خارج از بازه دوره',
        severity: 'warning',
        description: `${dateMismatches.length} هزینه دارای تاریخ خارج از بازه دوره انتسابی هستند.`,
        relatedId: dateMismatches[0],
      });
    }

    // Check 4: Cash advance balance integrity
    cashAdvances.forEach((adv) => {
      const used = expenses
        .filter((e) => e.status === 'active' && e.cashAdvanceId === adv.id)
        .reduce((sum, e) => sum + e.amount, 0);
      if (used > adv.amount) {
        issues.push({
          id: `issue-adv-${adv.id}`,
          type: 'invalid_balance',
          title: 'کسری منفی مانده تنخواه',
          severity: 'error',
          description: `تنخواه ${adv.personName} دارای کسری منفی است (مصرف ${formatToman(used)} از ${formatToman(adv.amount)}).`,
          relatedId: adv.id,
        });
      }
    });

    // Check 5: Duplicate opening docs
    const opDocPeriods = new Set<string>();
    openingDocuments.forEach((doc) => {
      if (opDocPeriods.has(doc.periodId)) {
        issues.push({
          id: `issue-opdoc-${doc.id}`,
          type: 'duplicate_opening',
          title: 'سند افتتاحیه تکراری',
          severity: 'warning',
          description: `بیش از یک سند افتتاحیه برای دوره ${doc.periodTitle} یافت شد.`,
          relatedId: doc.id,
        });
      }
      opDocPeriods.add(doc.periodId);
    });

    return {
      status: issues.length === 0 ? 'clean' : 'issues_found',
      checkedAt: DEALERSHIP_CURRENT_DATE,
      totalRecordsChecked: expenses.length + cashAdvances.length + incomes.length,
      issueCount: issues.length,
      issues,
    };
  };

  const getSmartOpeningSuggestions = (targetPeriodStartDate?: string): SmartOpeningSuggestions => {
    const openItems = getOpenItemsForNewPeriod();
    const prevOpDoc = openingDocuments.find((d) => d.periodId === activePeriodId);

    const prevExpenses = expenses.filter(
      (e) => e.status === 'active' && (!e.periodId || e.periodId === activePeriodId)
    );
    const prevIncomes = incomes.filter((i) => !i.periodId || i.periodId === activePeriodId);

    const expTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const incTotal = prevIncomes.reduce((sum, i) => sum + i.amount, 0);

    const suggestedCash = Math.max(0, (prevOpDoc?.cashBalance || 0) + incTotal - expTotal);
    const suggestedBank = prevOpDoc?.bankBalance || 0;

    return {
      suggestedCash,
      suggestedBank,
      suggestedAdvances: openItems.openAdvances,
      suggestedReimbursements: openItems.openReimbursements,
      previousPeriodExpensesTotal: expTotal,
      previousPeriodIncomesTotal: incTotal,
      previousPeriodOutstandingAdvances: openItems.openAdvances.reduce((s, a) => s + a.remainingAmount, 0),
      previousPeriodOutstandingReimbursements: openItems.openReimbursements.reduce((s, r) => s + r.amount, 0),
    };
  };

  const reconcileOpeningVsClosing = (
    previousPeriodId: string,
    proposedOpening: { cash: number; bank: number; advances: number; reimbursements: number }
  ): ReconciliationResult => {
    const prevDoc = openingDocuments.find((d) => d.periodId === previousPeriodId);
    const prevExpenses = expenses.filter(
      (e) => e.status === 'active' && (!e.periodId || e.periodId === previousPeriodId)
    );
    const prevIncomes = incomes.filter((i) => !i.periodId || i.periodId === previousPeriodId);

    const expTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const incTotal = prevIncomes.reduce((sum, i) => sum + i.amount, 0);

    const expectedCash = Math.max(0, (prevDoc?.cashBalance || 0) + incTotal - expTotal);
    const expectedBank = prevDoc?.bankBalance || 0;

    const cashDiff = proposedOpening.cash - expectedCash;
    const bankDiff = proposedOpening.bank - expectedBank;

    const items = [
      {
        title: 'موجودی نقد (صندوق)',
        previousClosing: expectedCash,
        newOpening: proposedOpening.cash,
        difference: Math.abs(cashDiff),
        status: (cashDiff === 0 ? 'matched' : 'discrepancy') as 'matched' | 'discrepancy',
      },
      {
        title: 'موجودی حساب‌های بانکی',
        previousClosing: expectedBank,
        newOpening: proposedOpening.bank,
        difference: Math.abs(bankDiff),
        status: (bankDiff === 0 ? 'matched' : 'discrepancy') as 'matched' | 'discrepancy',
      },
    ];

    const totalDiscrepancy = Math.abs(cashDiff) + Math.abs(bankDiff);
    const warnings: string[] = [];
    if (cashDiff !== 0) {
      warnings.push(`موجودی نقد افتتاحیه با مانده پایان دوره قبل مغایرت دارد (اختلاف: ${formatToman(Math.abs(cashDiff))}).`);
    }
    if (bankDiff !== 0) {
      warnings.push(`موجودی بانکی افتتاحیه با مانده پایان دوره قبل مغایرت دارد (اختلاف: ${formatToman(Math.abs(bankDiff))}).`);
    }

    return {
      items,
      overallStatus: totalDiscrepancy === 0 ? 'matched' : 'discrepancy',
      totalDiscrepancy,
      warnings,
    };
  };

  return (
    <AccountingContext.Provider
      value={{
        expenses,
        incomes,
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
        addIncome,
        deleteIncome,
        addCashAdvance,
        settleCashAdvance,
        settleCashAdvanceWithDetails,
        reverseSettlement,
        addVehicle,
        updateVehicleInspection,
        archiveVehicle,
        addPerson,
        archivePerson,
        customers,
        saleDossiers,
        addCustomer,
        updateCustomer,
        archiveCustomer,
        addSaleDossier,
        updateSaleDossier,
        deleteSaleDossier,
        consignmentAgreements,
        ownerSettlements,
        vehicleInspections,
        consignmentReturns,
        addConsignmentAgreement,
        updateConsignmentAgreement,
        addOwnerSettlement,
        updateOwnerSettlement,
        saveVehicleHandoverInspection,
        addConsignmentReturn,
        contracts,
        addContract,
        updateContract,
        cancelContract,
        registerInstallmentPayment,
        financialAccounts,
        liveFinancialAccounts,
        accountTransfers,
        indirectTransactions,
        dealCommissions,
        investorProfiles,
        investorSummaries,
        addFinancialAccount,
        updateFinancialAccount,
        transferBetweenAccounts,
        recordIndirectTransaction,
        addDealCommission,
        registerCommissionPayment,
        addInvestorProfile,
        updateInvestorProfile,
        recordInvestorContribution,
        allocateInvestorToDeal,
        exitInvestorAllocation,
        settleInvestorProfitOrCapital,
        // Phase 09C
        expiringDocs,
        presets,
        currentUser,
        auditLogs,
        addExpiringDoc,
        updateExpiringDoc,
        deleteExpiringDoc,
        addPreset,
        updatePreset,
        setCurrentUserRole,
        addAuditLog,
        checkPermission,
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
        periods,
        openingDocuments,
        activePeriodId,
        viewingPeriodId,
        activePeriod,
        viewingPeriod,
        isViewingHistoricalPeriod,
        isPeriodReadOnly,
        setViewingPeriodId,
        getOpenItemsForNewPeriod,
        createOpeningPeriod,
        settleOpeningReimbursement,
        checkPeriodIntegrity,
        reopenClosedPeriod,
        closePeriodWithCheck,
        correctClosedPeriodRecord,
        getSmartOpeningSuggestions,
        reconcileOpeningVsClosing,
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
