import {
  SmartContract,
  ContractInstallment,
  ContractSeparateExpense,
  PaymentAllocationProposal,
  ContractClauses,
  InstallmentStatus,
  GuaranteeType,
  ContractFinancials,
  PaymentArrangement,
} from '../types/contract';

/**
 * Calculates separated financial terms for a contract
 * Supports both object params and positional params
 */
export function calculateContractFinancials(
  param1:
    | {
        baseVehiclePrice?: number;
        installmentProfit?: number;
        downPayment?: number;
        downPaymentPaid?: boolean;
        downPaymentDate?: string;
        downPaymentMethod?: string;
        paymentArrangement?: PaymentArrangement;
        separateExpenses?: ContractSeparateExpense[];
      }
    | number,
  installmentProfitArg?: number,
  separateExpensesArg?: ContractSeparateExpense[],
  downPaymentArg?: number
): ContractFinancials & {
  includedExpensesTotal: number;
  excludedExpensesTotal: number;
  totalAgreedAmount: number;
  remainingPayable: number;
} {
  let basePrice = 0;
  let installmentProfit = 0;
  let downPayment = 0;
  let downPaymentPaid = false;
  let downPaymentDate = '';
  let downPaymentMethod = '';
  let paymentArrangement: PaymentArrangement = 'installment';
  let separateExpenses: ContractSeparateExpense[] = [];

  if (typeof param1 === 'object') {
    basePrice = param1.baseVehiclePrice || 0;
    installmentProfit = param1.installmentProfit || 0;
    downPayment = param1.downPayment || 0;
    downPaymentPaid = param1.downPaymentPaid || false;
    downPaymentDate = param1.downPaymentDate || '';
    downPaymentMethod = param1.downPaymentMethod || '';
    paymentArrangement = param1.paymentArrangement || 'installment';
    separateExpenses = param1.separateExpenses || [];
  } else {
    basePrice = param1 || 0;
    installmentProfit = installmentProfitArg || 0;
    separateExpenses = separateExpensesArg || [];
    downPayment = downPaymentArg || 0;
    paymentArrangement = 'mixed';
  }

  let includedExpensesTotal = 0;
  let excludedExpensesTotal = 0;

  separateExpenses.forEach((exp) => {
    if (exp.isIncludedInTotal) {
      includedExpensesTotal += exp.amount || 0;
    } else {
      excludedExpensesTotal += exp.amount || 0;
    }
  });

  const totalAgreedPrice = Math.max(0, basePrice + installmentProfit + includedExpensesTotal);
  const remainingBalance = Math.max(0, totalAgreedPrice - downPayment);
  const paidSoFar = downPaymentPaid ? downPayment : 0;

  return {
    baseVehiclePrice: basePrice,
    installmentProfit,
    totalAgreedPrice,
    downPayment,
    downPaymentPaid,
    downPaymentDate,
    downPaymentMethod,
    remainingBalance,
    paidSoFar,
    paymentArrangement,
    separateExpenses,
    includedExpensesTotal,
    excludedExpensesTotal,
    totalAgreedAmount: totalAgreedPrice,
    remainingPayable: remainingBalance,
  };
}

/**
 * Helper to advance a Persian Date (YYYY/MM/DD) by N months
 */
export function addPersianMonths(dateStr: string, monthsToAdd: number): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;

  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  m += monthsToAdd;
  while (m > 12) {
    m -= 12;
    y += 1;
  }

  let maxDays = 30;
  if (m <= 6) maxDays = 31;
  else if (m === 12) maxDays = 29;

  const finalDay = Math.min(d, maxDays);
  return `${y}/${String(m).padStart(2, '0')}/${String(finalDay).padStart(2, '0')}`;
}

/**
 * Generates an installment schedule from remaining payable amount
 */
export function generateInstallmentSchedule(
  remainingAmount: number,
  installmentCount: number,
  startDate: string,
  defaultGuaranteeType: GuaranteeType = 'cheque',
  intervalMonths: number = 1
): ContractInstallment[] {
  if (installmentCount <= 0 || remainingAmount <= 0) return [];

  const baseInstAmount = Math.floor(remainingAmount / installmentCount);
  const remainder = remainingAmount - baseInstAmount * installmentCount;

  const result: ContractInstallment[] = [];

  for (let i = 0; i < installmentCount; i++) {
    const currentAmount = i === 0 ? baseInstAmount + remainder : baseInstAmount;
    const dueDate = addPersianMonths(startDate, i * intervalMonths);

    result.push({
      id: `inst-${Date.now()}-${i + 1}-${Math.floor(Math.random() * 1000)}`,
      installmentNumber: i + 1,
      dueDate,
      amount: currentAmount,
      paidAmount: 0,
      remainingAmount: currentAmount,
      status: 'upcoming',
      guaranteeType: defaultGuaranteeType,
      chequeNumber: '',
      bankName: '',
      allocations: [],
    });
  }

  return result;
}

/**
 * Smart Payment Allocation Proposal
 * Prioritizes oldest overdue installment first, then next outstanding installments.
 * Supports passing either a SmartContract or ContractInstallment[] directly.
 */
export function proposePaymentAllocation(
  contractOrInstallments: SmartContract | ContractInstallment[],
  paymentAmount: number,
  currentDateStr: string = '۱۴۰۵/۰۲/۱۵'
): PaymentAllocationProposal {
  const installments = Array.isArray(contractOrInstallments)
    ? contractOrInstallments
    : contractOrInstallments.installments || [];

  let available = Math.max(0, paymentAmount);
  const cleanCurrentDate = currentDateStr.replace(/[^\d/]/g, '');

  // Sort installments chronologically by dueDate
  const sorted = [...installments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const allocations: PaymentAllocationProposal['allocations'] = [];

  for (const inst of sorted) {
    const currentRemaining = Math.max(0, inst.amount - (inst.paidAmount || 0));

    if (currentRemaining <= 0) {
      continue;
    }

    if (available > 0) {
      const allocateForThis = Math.min(available, currentRemaining);
      const newRemaining = currentRemaining - allocateForThis;
      available -= allocateForThis;

      let resultingStatus: InstallmentStatus = 'upcoming';
      if (newRemaining === 0) {
        resultingStatus = 'paid';
      } else if ((inst.paidAmount || 0) + allocateForThis > 0) {
        resultingStatus = 'partially_paid';
      } else {
        const isOverdue = inst.dueDate < cleanCurrentDate;
        resultingStatus = isOverdue ? 'overdue' : 'upcoming';
      }

      allocations.push({
        installmentId: String(inst.id),
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        currentRemaining,
        allocatedAmount: allocateForThis,
        newRemaining,
        resultingStatus,
      });
    } else {
      break;
    }
  }

  return {
    paymentAmount,
    allocations,
    unappliedCredit: available,
    unallocatedAmount: available,
    message: available > 0 ? `مبلغ ${available} تومان به عنوان بستانکاری مازاد منظور خواهد شد.` : 'مبلغ پرداختی کاملاً به اقساط تخصیص یافت.',
  };
}

/**
 * Reconciles installment amounts with the remaining contract payable amount
 */
export function reconcileInstallmentSchedule(
  installments: ContractInstallment[],
  remainingPayable: number
): {
  isReconciled: boolean;
  totalScheduleAmount: number;
  difference: number;
  paidScheduleAmount: number;
  remainingScheduleAmount: number;
} {
  const totalScheduleAmount = installments.reduce((acc, it) => acc + (it.amount || 0), 0);
  const paidScheduleAmount = installments.reduce((acc, it) => acc + (it.paidAmount || 0), 0);
  const remainingScheduleAmount = totalScheduleAmount - paidScheduleAmount;
  const difference = remainingPayable - totalScheduleAmount;

  return {
    isReconciled: Math.abs(difference) === 0,
    totalScheduleAmount,
    difference,
    paidScheduleAmount,
    remainingScheduleAmount,
  };
}

/**
 * Default standard legal clauses for Iranian vehicle purchase/sale contract
 */
export function getDefaultContractClauses(type: 'sale' | 'purchase' = 'sale'): ContractClauses {
  return {
    vehicleConditionClause:
      'مورد معامله بر اساس رؤیت کامل، تست رانندگی و برگه کارشناسی فنی و تشخیص رنگ بدنه پیوست به خریدار تحویل داده شد و خریدار با علم و آگاهی کامل از مشخصات و وضعیت فعلی خودرو، اقدام به امضای این مبایعه‌نامه نمود.',
    ownershipTransferClause:
      'فروشنده متعهد و مکلف است در تاریخ تعیین‌شده در محل مرکز تعویض پلاک حاضر شده و اقدامات قانونی جهت فک پلاک و تعویض پلاک به نام خریدار را به عمل آورد و کلیه اسناد مالکیت شامل برگ سبز، کارت خودرو، فاکتور خرید و بیمه‌نامه را تحویل نماید.',
    paymentTermsClause:
      'خریدار متعهد می‌گردد ثمن معامله را دقیقاً بر اساس مبالغ و سررسیدهای مندرج در جدول اقساط و اسناد تجاری پیوست تسویه نماید. در صورت عدم وصول یا برگشت هر یک از اسناد پرداخت، فروشنده حق فسخ یکطرفه معامله و مطالبه خسارت را خواهد داشت.',
    penaltyDailyAmount: 500000,
    penaltyClause:
      'در صورت استنکاف یا تأخیر هر یک از طرفین از اجرای تعهدات قراردادی (اعم از تحویل خودرو، تعویض پلاک یا پرداخت اقساط)، طرف متخلف مکلف است به ازای هر روز تأخیر، مبلغ ۵۰۰,۰۰۰ تومان وجه التزام خسارت روزانه را به طرف مقابل پرداخت نماید.',
    deliveryDate: '۱۴۰۵/۰۲/۱۵',
    deliveryLocation: 'نمایشگاه اتومبیل عبدالهی',
    notaryNumber: '۴۲',
    notaryCity: 'تهران',
    notaryDeadlineDate: '۱۴۰۵/۰۳/۱۵',
    additionalTerms:
      'پرداخت کلیه عوارض شهرداری و مالیات نقل و انتقال تا زمان تحویل بر عهده فروشنده و هزینه تعویض پلاک بر عهده خریدار می‌باشد.',

    // UI fields
    deliveryTerms:
      'خودرو به انضمام کلیه متعلقات قانونی و اسناد (شامل برگ سبز، کارت خودرو، بیمه‌نامه شخص ثالث و کلیدهای اصلی) تحویل خریدار گردید و از تاریخ تحویل کلیه مسئولیت‌های کیفری، مدنی و تخلفات رانندگی متوجه خریدار خواهد بود.',
    ownershipTransfer:
      'طرفین متعهدند در تاریخ توافق‌شده جهت تنظیم و امضای سند رسمی و تعویض پلاک در مرکز تعویض پلاک و دفترخانه اسناد رسمی شماره ۴۲ تهران حضور بهم رسانند.',
    penaltiesAndDamages:
      'در صورت تأخیر در پرداخت هر یک از اقساط، روزانه مبلغ ۵۰۰,۰۰۰ تومان به عنوان وجه التزام و خسارت تأخیر تادیه بر عهده خریدار خواهد بود. اسقاط کافه خیارات ولو خیار غبن فاحش از طرفین به عمل آمد.',
    dailyPenaltyAmount: 500000,
  };
}
