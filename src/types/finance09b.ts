/**
 * Phase 09B Data Models
 * Direct & Indirect Transactions, Multi-Account Registry, Commissions & Investor Wallets
 */

export type FinancialAccountType = 'cash' | 'bank' | 'pos' | 'card' | 'other';

export interface FinancialAccount {
  id: string;
  name: string; // e.g. "صندوق اصلی نمایشگاه", "حساب جاری بانک ملت"
  type: FinancialAccountType;
  accountNumber?: string;
  bankName?: string;
  shabaNumber?: string;
  cardLastFour?: string;
  openingBalance: number; // Toman
  currentBalance?: number; // Calculated dynamically
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface AccountTransfer {
  id: string;
  transferNumber: string;
  date: string; // YYYY/MM/DD
  sourceAccountId: string;
  sourceAccountName: string;
  destinationAccountId: string;
  destinationAccountName: string;
  amount: number; // Toman
  referenceNumber?: string; // شماره پیگیری فیش / انتقال
  reason: string; // بابت انتقال
  notes?: string;
  createdAt: string;
}

export type IndirectTransactionPayerRole = 'buyer' | 'seller' | 'investor' | 'other';
export type IndirectTransactionReceiverRole = 'buyer' | 'seller' | 'owner' | 'other';

export interface IndirectTransaction {
  id: string;
  trackingNumber: string;
  date: string; // YYYY/MM/DD
  contractId?: string;
  contractNumber?: string;
  vehicleLabel?: string;
  payerRole: IndirectTransactionPayerRole;
  payerName: string;
  receiverRole: IndirectTransactionReceiverRole;
  receiverName: string;
  amount: number; // Toman
  purpose: string; // بابت (e.g. "پرداخت مستقیم ثمن از خریدار به مالک امانی")
  supportingDocument?: string; // شماره پیگیری ساتنا/پایا یا شماره فیش
  documentAttachment?: string; // base64 / url
  status: 'confirmed' | 'pending' | 'rejected';
  notes?: string;
  createdAt: string;
}

export type CommissionPayer = 'buyer' | 'seller' | 'both';
export type CommissionStatus = 'unpaid' | 'partially_paid' | 'settled';

export interface CommissionPayment {
  id: string;
  date: string; // YYYY/MM/DD
  payerRole: 'buyer' | 'seller';
  payerName: string;
  amount: number; // Toman
  paymentMethod: 'cash' | 'bank_transfer' | 'pos' | 'cheque';
  destinationAccountId?: string;
  destinationAccountName?: string;
  trackingNumber?: string;
  notes?: string;
  incomeId?: string; // Direct link to company Income transaction
  createdAt: string;
}

export interface DealCommission {
  id: string;
  contractId?: string;
  contractNumber?: string;
  dealId?: string;
  vehicleId?: string;
  vehicleLabel: string;
  agreementDate: string; // YYYY/MM/DD
  totalAgreedCommission: number; // Toman
  payer: CommissionPayer;
  buyerName?: string;
  buyerShare: number; // Toman
  sellerName?: string;
  sellerShare: number; // Toman
  receivedAmount: number; // Toman
  outstandingAmount: number; // Toman
  status: CommissionStatus;
  payments: CommissionPayment[];
  notes?: string;
  createdAt: string;
}

export type InvestorContributionChannel = 'company_account' | 'direct_to_seller';

export interface InvestorContribution {
  id: string;
  investorId: string;
  date: string; // YYYY/MM/DD
  amount: number; // Toman (سرمایه واریزی - NEVER treated as company revenue)
  channel: InvestorContributionChannel;
  destinationAccountId?: string; // If deposited into company bank/cash
  destinationAccountName?: string;
  sellerOrOwnerName?: string; // If paid directly to seller
  supportingDocument?: string; // شماره فیش / پیگیری
  notes?: string;
  createdAt: string;
}

export type AllocationStatus = 'active' | 'exited' | 'liquidated';

export interface InvestorDealAllocation {
  id: string;
  investorId: string;
  vehicleId: string;
  vehicleLabel: string;
  contractId?: string;
  contractNumber?: string;
  allocationDate: string; // YYYY/MM/DD
  allocatedCapital: number; // Toman
  profitSharePercentage?: number; // e.g. 35% of deal gross margin
  agreedFixedProfit?: number; // Or fixed profit amount
  status: AllocationStatus;
  exitDate?: string;
  realizedProfit?: number; // Toman (when deal is sold/settled)
  capitalReturnedToUnallocated?: boolean;
  notes?: string;
  createdAt: string;
}

export type InvestorSettlementType = 'profit_distribution' | 'capital_repayment';

export interface InvestorSettlement {
  id: string;
  settlementNumber: string;
  investorId: string;
  investorName: string;
  date: string; // YYYY/MM/DD
  type: InvestorSettlementType;
  amount: number; // Toman
  sourceAccountId?: string; // Company bank/cash account paid from
  sourceAccountName?: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'direct_reconciliation';
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface InvestorProfile {
  id: string;
  name: string;
  nationalId?: string;
  phone: string;
  personId?: string; // Link to person record if exists
  customerId?: string; // Link to customer record if exists
  status: 'active' | 'inactive';
  joinedDate: string; // YYYY/MM/DD
  notes?: string;
  contributions: InvestorContribution[];
  allocations: InvestorDealAllocation[];
  settlements: InvestorSettlement[];
  createdAt: string;
}

export interface InvestorWalletSummary {
  investorId: string;
  investorName: string;
  phone: string;
  totalContributedCapital: number;
  activeAllocatedCapital: number;
  unallocatedCapital: number;
  totalRealizedProfit: number;
  totalProfitSettled: number;
  totalCapitalRepaid: number;
  unsettledProfit: number;
  currentDealershipLiability: number; // unallocatedCapital + activeAllocatedCapital + unsettledProfit
}
