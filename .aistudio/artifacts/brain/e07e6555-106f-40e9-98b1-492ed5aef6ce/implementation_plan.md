# Implementation Plan — Patch 09B: Multiple Accounts, Direct/Indirect Transactions, Commissions & Investor Wallets

Continue from existing Phase 09A contracts and previous accounting features. Preserve all customer records, consignment agreements, 3D Camry inspection data, sale dossiers, and backup systems without data destruction or transaction duplication.

---

## 1. User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions Aligned with User Input:**
> 1. **Financial Accounts Registry:** A unified multi-account register (`FinancialAccount`) managing cash desks (صندوق‌ها), individual bank accounts (حساب‌های بانکی), POS cards (پوز), with live calculated balances and an internal transfer tool that moves money between accounts without creating false income or expenses.
> 2. **Direct vs. Indirect Transactions:** Direct transactions update company account balances. Indirect transactions (e.g. buyer directly paying a seller/owner) are recorded in the contract ledger and customer balance with a clear `zero-cash-flow` badge and audit trail, never inflating company cash flow.
> 3. **Commission Management (کمیسیون‌ها):** A dedicated management view and data model tracking agreed fees, payer assignment (خریدار، فروشنده، یا هر دو با درصد توافقی), receipt payments, and outstanding balances without creating duplicate vehicle expenses.
> 4. **Investor Wallet (کیف پول سرمایه‌گذاران):** Dedicated investor profiles reusing existing customer/person records. Separates capital contributions, deal-specific investment allocations, capital repayments, and profit distributions. Capital receipts are strictly segregated from business revenue.
> 5. **Strict 4-Way Entity Segregation:** Absolute segregation between: (1) Consignment Vehicle Owner, (2) Investor, (3) Customer, and (4) Deal Commission, even when referring to the same individual.

---

## 2. Proposed Changes

### Data Models & Types (`src/types/finance09b.ts`)
- `FinancialAccount`: Represents company cash desks, bank accounts, POS cards.
  - Fields: `id`, `name`, `type` (`cash_box` | `bank_account` | `pos_card` | `other`), `bankName?`, `accountNumber?`, `shabaNumber?`, `openingBalance`, `currentBalance`, `isActive`, `notes?`, `createdAt`.
- `AccountTransfer`: Internal transfers between company accounts (increases destination, decreases source, net zero company revenue/expense).
- `IndirectTransaction`: Bilateral payments between buyer and seller linked to a contract with zero impact on company accounts.
  - Fields: `id`, `contractId`, `contractNumber`, `payerName`, `payerNationalId?`, `receiverName`, `receiverNationalId?`, `amount`, `date`, `purpose`, `referenceNumber?`, `proofAttachmentUrl?`, `notes?`, `periodId`.
- `DealCommission`: Commission agreement and payment tracking.
  - Fields: `id`, `contractId`, `contractNumber`, `vehicleLabel`, `totalCommission`, `payer`: `'buyer' | 'seller' | 'both'`, `buyerShareAmount`, `sellerShareAmount`, `receivedAmount`, `outstandingAmount`, `status`: `'unpaid' | 'partially_settled' | 'fully_settled'`, `payments`: `CommissionPayment[]`.
- `InvestorProfile` & `InvestorTransaction`:
  - `InvestorProfile`: `id`, `personId`, `fullName`, `nationalId`, `phone`, `status`, `unallocatedCapital`, `activeInvestedCapital`, `totalProfitEarned`, `totalSettled`, `outstandingLiability`.
  - `InvestorContribution`: Direct to company account or indirect to vehicle seller.
  - `InvestorDealAllocation`: Capital tied to specific vehicle/deal with agreed profit % or fixed profit.
  - `InvestorSettlement`: Capital return vs. profit distribution.

### State & Context Layer (`src/context/AccountingContext.tsx`)
- Add states:
  - `financialAccounts: FinancialAccount[]`
  - `accountTransfers: AccountTransfer[]`
  - `indirectTransactions: IndirectTransaction[]`
  - `commissions: DealCommission[]`
  - `investors: InvestorProfile[]`
  - `investorContributions: InvestorContribution[]`
  - `investorDealAllocations: InvestorDealAllocation[]`
  - `investorSettlements: InvestorSettlement[]`
- Add context methods:
  - `addFinancialAccount`, `updateFinancialAccount`, `transferBetweenAccounts`
  - `recordIndirectTransaction`
  - `addDealCommission`, `registerCommissionPayment`
  - `addInvestor`, `recordInvestorContribution`, `allocateInvestorToDeal`, `settleInvestorProfitOrCapital`
- Update backup engine (`src/utils/backupEngine.ts`) and hourly checkpoint to include Patch 09B records in `FullDatabasePayload`.

### UI Components

#### 1. Financial Accounts Registry (`src/components/FinancialAccountsView.tsx`)
- Visual display of all cash boxes, bank accounts, and POS terminals with live calculated balances.
- "انتقال وجه بین‌حساب‌ها" (Internal Transfer Modal) with source, destination, amount, and reference.
- Account transaction ledger showing direct inflows and outflows.

#### 2. Commissions Management Section (`src/components/CommissionsView.tsx`)
- Dedicated section accessible via sidebar and dashboard.
- Summary metrics: کل کمیسیون‌های توافق‌شده، وصول‌شده، مانده معوق، کمیسیون‌های به عهده خریدار و فروشنده.
- Table of commission agreements with progress bar and "ثبت وصول کمیسیون" (records payment to a selected financial account and logs real income under `کمیسیون و حق‌العمل`).

#### 3. Investor Wallet & Ledger (`src/components/InvestorWalletView.tsx`)
- Investor directory with wallet metrics: کل سرمایه اولیه، سرمایه درگیر در معاملات، سود ناخالص تخصیصی، مبالغ بازپرداخت‌شده، مانده بدهی به سرمایه‌گذار.
- Modal to record new contribution (direct to bank or indirect to seller).
- Modal to allocate capital to vehicle inventory with target return rate.
- Modal to process capital withdrawal or profit distribution.
- Investor statement generator with printable ledger.

#### 4. Contract Indirect Payments Integration
- Update `ContractDetailDrawer.tsx` and `RegisterPaymentModal.tsx` to support recording **تراکنش غیرمستقیم (پرداخت مستقیم خریدار به فروشنده)** with badge `تسویه خارج از صندوق` that reduces contract balance without altering company cash.

#### 5. Advanced Financial Reports (`src/components/ReportsView.tsx`)
- Extend ReportsView with 6 required sub-reports:
  1. **گزارش کمیسیون‌های دریافتی و معوق** (Received & Pending Commissions)
  2. **صورتحساب و کاردکس سرمایه‌گذار** (Investor Statement)
  3. **گردش وجوه مستقیم و غیرمستقیم** (Direct vs. Indirect Flow Audit)
  4. **مانده حساب‌های بانکی و صندوق‌ها** (Bank & Cash Accounts Register)
  5. **تعهدات بازپرداخت به سرمایه‌گذاران** (Investor Liabilities)
  6. **تطبیق پرداخت‌های مرتبط با قرارداد** (Contract Reconciliation)

#### 6. Sidebar & Topbar Integration (`src/components/Sidebar.tsx` & `src/App.tsx`)
- Add `accounts`, `commissions`, and `investors` to navigation tabs with active badges.
- Wire views in `App.tsx`.

---

## 3. Verification Plan

### Automated Tests / Compile Checks
- Run `lint_applet` to ensure strict TypeScript type-checking across all new files.
- Run `compile_applet` to verify Vite build without warnings or errors.

### Manual Acceptance Verification
1. **Direct Payments & Multi-Account Registry:**
   - Create a direct payment of 50M Tomans into Bank Mellat; verify Bank Mellat balance increases by exactly 50M and total cash assets adjust.
   - Perform an internal transfer of 20M from Bank Mellat to Cash Box 1; verify source decreases, destination increases, and dealership net profit/loss is completely unaffected.
2. **Indirect Transactions:**
   - Record an indirect payment of 100M from Buyer directly to Seller on a contract.
   - Verify contract remaining balance decreases by 100M, but company cash/bank balance does not change by even 1 Toman.
3. **Commission Management:**
   - Link a 20M Toman commission split 50/50 between buyer and seller to a Camry contract.
   - Pay 10M from buyer into company POS; verify outstanding commission drops to 10M, status becomes `partially_settled`, and real income is logged under `کمیسیون و حق‌العمل`.
4. **Investor Wallet & Separation:**
   - Register an investor contribution of 500M Tomans; verify it is recorded in the investor's capital account and does NOT appear in dealership revenue.
   - Allocate 300M of investor capital to Vehicle A with 15% profit share.
   - Settle 50M capital return to investor; verify active capital and liability update accurately.
   - Confirm a person who is both a customer and an investor has distinct, unmerged balances.
5. **Backup & Persistence:**
   - Trigger a manual backup Zip and restore it; verify all financial accounts, indirect transactions, commissions, and investor wallets are completely preserved.
