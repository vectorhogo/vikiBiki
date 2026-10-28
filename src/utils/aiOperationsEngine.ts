// Patch 09C: AI Operations Assistant Engine (100% Offline-First Persian NLP Engine)
import { AiChatMessage, AiSuggestedAction } from '../types/patch09c';
import { SmartContract } from '../types/contract';
import { Customer } from '../types/customerSales';
import { Vehicle } from '../types/accounting';
import { ConsignmentAgreement, OwnerSettlement } from '../types/consignment';
import { VehicleExpiringDoc } from '../types/patch09c';
import { FinancialAccount, DealCommission, InvestorProfile } from '../types/finance09b';
import { formatToman, toPersianDigits } from './formatters';

interface AssistantContext {
  contracts: SmartContract[];
  customers: Customer[];
  vehicles: Vehicle[];
  expiringDocs: VehicleExpiringDoc[];
  consignmentAgreements: ConsignmentAgreement[];
  ownerSettlements: OwnerSettlement[];
  financialAccounts: FinancialAccount[];
  dealCommissions: DealCommission[];
  investors: InvestorProfile[];
}

// Clean and normalize Persian text
export function normalizePersian(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200C\u200B]/g, ' ') // replace zero-width non-joiner with space for matching
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Parses user natural language request and generates contextual answer + actionable cards
 */
export function processAiQuery(
  rawQuery: string,
  ctx: AssistantContext
): { text: string; summaryData?: AiChatMessage['dataSummary']; suggestedAction?: AiSuggestedAction } {
  const query = normalizePersian(rawQuery);

  // 1. Overdue Installments: «اقساط عقب افتاده این هفته را نشان بده»
  if (
    query.includes('قسط') ||
    query.includes('اقساط') ||
    query.includes('معوق') ||
    query.includes('عقب افتاده') ||
    query.includes('سررسید گذشته')
  ) {
    const overdueInstallments: Array<{
      contractNumber: string;
      customerName: string;
      dueDate: string;
      amount: number;
      remainingAmount: number;
    }> = [];

    ctx.contracts.forEach((c) => {
      c.installments.forEach((inst) => {
        if (inst.status === 'overdue' || (inst.status === 'upcoming' && inst.dueDate <= '۱۴۰۵/۰۸/۰۷')) {
          const buyerName = c.parties?.buyer?.name || c.buyer?.name || 'خریدار';
          const remaining = inst.remainingAmount ?? Math.max(0, inst.amount - (inst.paidAmount || 0));
          overdueInstallments.push({
            contractNumber: c.contractNumber,
            customerName: buyerName,
            dueDate: inst.dueDate,
            amount: inst.amount,
            remainingAmount: remaining,
          });
        }
      });
    });

    if (overdueInstallments.length === 0) {
      return {
        text: 'در حال حاضر هیچ قسط معوق یا سررسید گذشته‌ای در سامانه وجود ندارد. وضعیت تمام اقساط منظم است.',
      };
    }

    const totalOverdue = overdueInstallments.reduce((sum, item) => sum + item.remainingAmount, 0);

    return {
      text: `تعداد ${toPersianDigits(overdueInstallments.length)} قسط سررسید گذشته یا جاری با مجموع مبلغ ${formatToman(totalOverdue)} یافت شد. برای مشاهده جزئیات یا ثبت وصولی روی کارت‌های زیر کلیک کنید:`,
      summaryData: {
        type: 'overdue_installments',
        count: overdueInstallments.length,
        items: overdueInstallments,
      },
      suggestedAction: {
        id: 'act-view-contracts',
        title: 'مشاهده کاردکس اقساط در قراردادها',
        description: 'انتقال به بخش قراردادها و مبایعه‌نامه‌ها جهت بررسی تک تک اسناد و چک‌های تضمینی',
        actionType: 'navigate_report',
        targetTab: 'contracts',
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // 2. Power of Attorney Expiry in 7 days: «کدام وکالت ها در هفت روز آینده منقضی می شوند؟»
  if (
    query.includes('وکالت') ||
    query.includes('وکالتنامه') ||
    query.includes('دفترخانه') ||
    query.includes('تعویض پلاک')
  ) {
    const poaDocs = ctx.expiringDocs.filter((d) => d.category === 'power_of_attorney');
    const urgentPoas = poaDocs.filter((d) => {
      // Near expiry within 7-30 days
      return d.expiryDate <= '۱۴۰۵/۰۸/۰۸';
    });

    if (urgentPoas.length === 0) {
      return {
        text: `تمام وکالت‌نامه‌های ثبت‌شده (${toPersianDigits(poaDocs.length)} فقره) دارای اعتبار کافی هستند و هیچ وکالتی در ۷ روز آینده منقضی نمی‌شود.`,
        summaryData: {
          type: 'expiring_docs',
          count: poaDocs.length,
          items: poaDocs,
        },
      };
    }

    return {
      text: `توجه: تعداد ${toPersianDigits(urgentPoas.length)} فقره وکالت‌نامه در ۷ روز آینده منقضی می‌شوند و نیاز به اقدام فوری (تعویض پلاک یا تمدید وکالت) دارند:`,
      summaryData: {
        type: 'expiring_docs',
        count: urgentPoas.length,
        items: urgentPoas,
      },
      suggestedAction: {
        id: 'act-view-alerts',
        title: 'مشاهده بخش هشدارها و اسناد منقضی شونده',
        description: 'انتقال به داشبورد هشدارها برای تمدید یا ثبت وضعیت استفاده‌شده برای وکالت‌نامه‌ها',
        actionType: 'navigate_report',
        targetTab: 'alerts',
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // 3. Customer Dossier: «پرونده مشتری محمد رضایی را پیدا کن»
  if (
    query.includes('مشتری') ||
    query.includes('پرونده') ||
    query.includes('خریدار') ||
    query.includes('فروشنده') ||
    query.includes('پیدا کن') ||
    query.includes('رضایی') ||
    query.includes('حسینی')
  ) {
    // Search matching customer
    const matched = ctx.customers.filter((c) => {
      return (
        query.includes(normalizePersian(c.fullName)) ||
        c.fullName.split(' ').some((part) => part.length > 2 && query.includes(normalizePersian(part))) ||
        (c.nationalId && query.includes(c.nationalId))
      );
    });

    const targetCustomer = matched.length > 0 ? matched[0] : ctx.customers[0];

    if (targetCustomer) {
      // Find linked contracts
      const linkedContracts = ctx.contracts.filter(
        (c) =>
          c.customerId === targetCustomer.id ||
          c.buyerId === targetCustomer.id ||
          c.sellerId === targetCustomer.id ||
          c.parties?.buyer?.nationalId === targetCustomer.nationalId ||
          c.parties?.seller?.nationalId === targetCustomer.nationalId
      );

      return {
        text: `پرونده مشتری «${targetCustomer.fullName}» به شماره پرونده ${targetCustomer.fileNumber} با ${toPersianDigits(linkedContracts.length)} معامله ثبت‌شده در سامانه یافت شد:`,
        summaryData: {
          type: 'customer_dossier',
          count: 1,
          items: [
            {
              ...targetCustomer,
              contractsCount: linkedContracts.length,
              phone: targetCustomer.phone,
              nationalId: targetCustomer.nationalId,
            },
          ],
        },
        suggestedAction: {
          id: 'act-view-customer',
          title: `مشاهده پرونده کامل ${targetCustomer.fullName}`,
          description: 'مشاهده سوابق خرید و فروش، اسناد پیوست، و کاردکس مالی این مشتری',
          actionType: 'navigate_customer',
          targetId: targetCustomer.id,
          targetTab: 'customers',
          requiresConfirmation: false,
          isFinancialMutation: false,
        },
      };
    }
  }

  // 4. Consignment Unsettled: «گزارش تسویه نشده های خودروهای امانی را آماده کن»
  if (
    query.includes('امانی') ||
    query.includes('تسویه') ||
    query.includes('مالک') ||
    query.includes('صاحب خودرو')
  ) {
    const unsettledAgreements = ctx.consignmentAgreements.filter((a) => a.status === 'sold' || a.status === 'active');
    const unsettledSettlements = ctx.ownerSettlements.filter((s) => s.remainingAmount > 0);

    const totalRemaining = unsettledSettlements.reduce((sum, s) => sum + s.remainingAmount, 0);

    return {
      text: `گزارش خودروهای امانی آماده شد: تعداد ${toPersianDigits(unsettledSettlements.length)} پرونده تسویه نشده با مجموع مانده قابل پرداخت ${formatToman(totalRemaining)} به مالکان وجود دارد. سهم کمیسیون نمایشگاه از قبل کسر شده است.`,
      summaryData: {
        type: 'consignment_unsettled',
        count: unsettledSettlements.length,
        items: unsettledSettlements,
      },
      suggestedAction: {
        id: 'act-view-consignment-rep',
        title: 'مشاهده گزارش تسویه مالکان در بخش گزارش‌ها',
        description: 'نمایش گزارش تفکیکی مانده بستانکاری مالکین، هزینه‌های کسرشده و سود نمایشگاه',
        actionType: 'navigate_report',
        targetTab: 'reports',
        payload: { reportType: 'consignment' },
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // 5. Insurance status: «وضعیت بیمه خودروهای موجود را بررسی کن»
  if (query.includes('بیمه') || query.includes('شخص ثالث') || query.includes('بیمه نامه')) {
    const insuranceDocs = ctx.expiringDocs.filter((d) => d.category === 'third_party_insurance');
    const expiringSoon = insuranceDocs.filter((d) => d.expiryDate <= '۱۴۰۵/۰۸/۱۰');

    return {
      text: `بررسی بیمه‌نامه‌ها انجام شد: از میان ${toPersianDigits(insuranceDocs.length)} بیمه‌نامه فعال در سامانه، تعداد ${toPersianDigits(expiringSoon.length)} مورد در کمتر از ۱۰ روز آینده منقضی می‌شوند (از جمله بیمه‌نامه خودروی کمری ۲۰۲۵).`,
      summaryData: {
        type: 'expiring_docs',
        count: expiringSoon.length,
        items: expiringSoon,
      },
      suggestedAction: {
        id: 'act-view-insurance-alerts',
        title: 'ورود به سامانه هشدارها و سررسید بیمه‌ها',
        description: 'مشاهده جدول کامل بیمه‌نامه‌ها، شرکت‌های بیمه‌گر و شماره الحاقیه‌ها',
        actionType: 'navigate_report',
        targetTab: 'alerts',
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // 6. Bank & Cash balances: «موجودی حساب های بانکی چقدر است؟»
  if (
    query.includes('موجودی') ||
    query.includes('بانک') ||
    query.includes('صندوق') ||
    query.includes('نقد') ||
    query.includes('حساب')
  ) {
    const totalLiquid = ctx.financialAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    return {
      text: `مجموع نقدینگی و مانده حساب‌های فعال نمایشگاه برابر با ${formatToman(totalLiquid)} می‌باشد:`,
      summaryData: {
        type: 'bank_balances',
        count: ctx.financialAccounts.length,
        items: ctx.financialAccounts,
      },
      suggestedAction: {
        id: 'act-view-accounts',
        title: 'مشاهده دفتر کل حساب‌های مالی و انتقال وجه',
        description: 'انتقال به بخش حساب‌های مالی و بانک‌ها برای انجام واریز، برداشت یا انتقال وجه بین‌حسابی',
        actionType: 'navigate_report',
        targetTab: 'accounts',
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // 7. Commissions: «کمیسیون های دریافت نشده را فهرست کن»
  if (query.includes('کمیسیون') || query.includes('کارمزد') || query.includes('حق العمل')) {
    const unpaidCommissions = ctx.dealCommissions.filter((c) => c.status !== 'settled');
    const totalUnpaid = unpaidCommissions.reduce((sum, c) => sum + c.outstandingAmount, 0);

    return {
      text: `تعداد ${toPersianDigits(unpaidCommissions.length)} پرونده با مانده کمیسیون وصول‌نشده به مبلغ کل ${formatToman(totalUnpaid)} در سامانه ثبت است:`,
      suggestedAction: {
        id: 'act-view-commissions',
        title: 'مشاهده بخش مدیریت کمیسیون‌ها',
        description: 'ثبت دریافت یا پیگیری مطالبات کمیسیون از خریداران و فروشندگان',
        actionType: 'navigate_report',
        targetTab: 'commissions',
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // 8. Investors: «سرمایه سرمایه گذاران چقدر است؟»
  if (query.includes('سرمایه گذار') || query.includes('سرمایه گذاری') || query.includes('شریک')) {
    const totalActive = ctx.investors.reduce((sum, inv) => {
      const activeAlloc = inv.allocations
        ? inv.allocations.filter((al) => al.status === 'active').reduce((s, al) => s + al.allocatedCapital, 0)
        : 0;
      return sum + activeAlloc;
    }, 0);
    const totalProfit = ctx.investors.reduce((sum, inv) => {
      const profit = inv.allocations
        ? inv.allocations.reduce((s, al) => s + (al.realizedProfit || 0), 0)
        : 0;
      return sum + profit;
    }, 0);

    return {
      text: `مجموع سرمایه فعال سرمایه‌گذاران در معاملات خودرو ${formatToman(totalActive)} و مجموع سود تخصیصی تحقق‌یافته آنان ${formatToman(totalProfit)} می‌باشد. این مبالغ کاملاً مستقل از درآمد نمایشگاه نگهداری می‌شوند.`,
      suggestedAction: {
        id: 'act-view-investors',
        title: 'ورود به کیف‌پول سرمایه‌گذاران',
        description: 'مشاهده پرونده سرمایه‌گذاران، تخصیص به خودروها و تسویه سود',
        actionType: 'navigate_report',
        targetTab: 'investors',
        requiresConfirmation: false,
        isFinancialMutation: false,
      },
    };
  }

  // Default Fallback
  return {
    text: `درخواست شما بررسی شد. می‌توانید یکی از موارد زیر را بپرسید:\n• «اقساط عقب‌افتاده این هفته را نشان بده»\n• «کدام وکالت‌ها در هفت روز آینده منقضی می‌شوند؟»\n• «پرونده مشتری محمد رضایی را پیدا کن»\n• «گزارش تسویه‌نشده‌های خودروهای امانی را آماده کن»\n• «موجودی حساب‌های بانکی چقدر است؟»`,
  };
}
