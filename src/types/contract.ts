export type ContractType = 'sale' | 'purchase'; // مبایعه‌نامه فروش | قرارداد خرید
export type ContractStatus = 'draft' | 'ready_to_sign' | 'signed' | 'completed' | 'cancelled';
export type PaymentArrangement = 'cash' | 'installment' | 'installments' | 'mixed';
export type GuaranteeType = 'cheque' | 'promissory_note' | 'property' | 'guarantor' | 'none' | 'other';
export type InstallmentStatus = 'upcoming' | 'overdue' | 'partially_paid' | 'paid' | 'partial';

export interface ContractParty {
  name: string;
  nationalId: string;
  phone: string;
  fatherName?: string;
  idNumber?: string; // شماره شناسنامه
  issuePlace?: string; // محل صدور
  birthDate?: string;
  address?: string;
  postalCode?: string;
  isLegalEntity?: boolean; // شخص حقوقی
  companyName?: string;
  economicCode?: string;
  registrationNumber?: string;
}

export interface ContractSeparateExpense {
  id: string;
  title: string; // مالیات نقل و انتقال، عوارض، کارمزد، بیمه و...
  amount: number;
  payer?: 'buyer' | 'seller' | 'split';
  paidBy?: 'buyer' | 'seller' | 'split';
  isIncludedInTotal?: boolean;
  status?: 'pending' | 'settled';
}

export interface InstallmentPaymentAllocation {
  id: string;
  actualPaymentId?: string; // شناسه تراکنش واقعی دریافت وجه
  paymentDate: string;
  allocatedAmount?: number;
  amount?: number;
  trackingNumber?: string;
  method?: 'cash' | 'transfer' | 'pos' | 'check' | string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'pos' | string;
  notes?: string;
  allocatedAt?: string;
  recordedAt?: string;
}

export interface ContractInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string; // YYYY/MM/DD
  amount: number; // Toman
  paidAmount: number; // Toman
  remainingAmount?: number;
  status: InstallmentStatus;

  // Guarantee / instrument
  guaranteeType: GuaranteeType;
  instrumentNumber?: string; // شناسه صیادی ۱۶ رقمی یا شماره سفته
  chequeNumber?: string; // alias
  bankName?: string;
  issueDate?: string;
  guarantorName?: string;
  guarantorPhone?: string;

  allocations?: InstallmentPaymentAllocation[];
  notes?: string;
  paymentDate?: string;
}

export interface ContractClauses {
  vehicleConditionClause?: string;
  ownershipTransferClause?: string;
  paymentTermsClause?: string;
  penaltyDailyAmount?: number;
  penaltyClause?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  notaryNumber?: string;
  notaryCity?: string;
  notaryDeadlineDate?: string;
  additionalTerms?: string;

  // Additional clause fields used in UI
  deliveryTerms?: string;
  ownershipTransfer?: string;
  penaltiesAndDamages?: string;
  dailyPenaltyAmount?: number;
}

export interface ContractVersionSnapshot {
  versionNumber: number;
  savedAt: string;
  savedBy: string;
  changeReason?: string;
  changeSummary?: string;
  snapshotData?: string;
  snapshot?: any;
}

export interface ContractFinancials {
  baseVehiclePrice: number;
  installmentProfit: number;
  totalAgreedPrice: number;
  downPayment: number;
  downPaymentPaid?: boolean;
  downPaymentDate?: string;
  downPaymentMethod?: string;
  remainingBalance: number;
  paidSoFar: number;
  paymentArrangement?: PaymentArrangement;
  separateExpenses?: ContractSeparateExpense[];
}

export interface SmartContract {
  id: string; // e.g. "CNT-1405-001"
  contractNumber: string; // e.g. "م‌ب-۱۴۰۵-۰۱"
  contractType: ContractType; // sale | purchase
  title?: string;
  date?: string; // YYYY/MM/DD
  contractDate: string; // YYYY/MM/DD
  status: ContractStatus;
  cancellationReason?: string;
  cancelledAt?: string;

  // Linked Entities
  vehicleId: string;
  vehicleFullName?: string;
  vehicleLabel: string;
  customerId?: string; // Buyer in sale, Seller in purchase
  customerName?: string;
  buyerId?: string;
  sellerId?: string;
  saleDossierId?: string;

  // Parties
  seller?: ContractParty;
  buyer?: ContractParty;
  parties: {
    buyer: ContractParty;
    seller: ContractParty;
  };
  witnesses?: { name: string; nationalId: string; phone?: string }[];

  // Vehicle Snapshot at contract time
  vehicleSnapshot: {
    model?: string;
    fullName?: string;
    modelYear?: string;
    year?: number;
    color: string;
    plateNumber?: string;
    licensePlate?: string;
    chassisNumber: string;
    engineNumber?: string;
    vin?: string;
    mileage: number;
    fuelType?: string;
  };

  // Financial Terms (Strictly separated per Patch 09A spec)
  paymentArrangement?: PaymentArrangement;
  baseVehiclePrice?: number;
  installmentProfit?: number;
  separateExpenses?: ContractSeparateExpense[];
  totalAgreedAmount?: number;
  downPayment?: number;
  remainingPayable?: number;
  actualTotalPaid?: number;

  financials: ContractFinancials;
  unappliedCredit?: number;

  // Installment Schedule
  installments: ContractInstallment[];

  // Contractual Clauses & Legal Structure
  clauses: ContractClauses;

  notaryOffice?: string;
  notaryDate?: string;

  // Signed document and attachments
  signedContractUrl?: string;
  attachments?: { id: string; name: string; url: string; uploadedAt: string }[];
  versionHistory?: ContractVersionSnapshot[];

  notes?: string;
  periodId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocationProposal {
  paymentAmount?: number;
  allocations: {
    installmentId: string;
    installmentNumber: number;
    dueDate: string;
    currentRemaining: number;
    allocatedAmount: number;
    newRemaining: number;
    resultingStatus: InstallmentStatus;
  }[];
  unappliedCredit?: number;
  unallocatedAmount: number;
  message?: string;
}
