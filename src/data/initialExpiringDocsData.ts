// Patch 09C: Initial Expiring Documents Data
import { VehicleExpiringDoc } from '../types/patch09c';

export const INITIAL_EXPIRING_DOCUMENTS: VehicleExpiringDoc[] = [
  // 1. Critical/Urgent: Third-Party Insurance for Toyota Camry 2025 expiring in 5 days!
  {
    id: 'DOC-EXP-001',
    vehicleId: 'veh-1',
    vehicleLabel: 'Toyota Camry 2025 (۶۷الف۱۲۳-۲۱)',
    category: 'third_party_insurance',
    title: 'بیمه‌نامه شخص ثالث بیمه ایران',
    documentNumber: 'IRN-984210398',
    startDate: '۱۴۰۴/۰۸/۰۵',
    expiryDate: '۱۴۰۵/۰۸/۰۵', // ~ 5 days left from current date ۱۴۰۵/۰۸/۰۱
    notes: 'تعهد مالی ۱۰۰ میلیون تومان، تخفیف ۵ درصد، نیازمند تمدید فوری قبل از تحویل خودرو به خریدار',
    createdAt: '2026-10-01T08:00:00Z',
    insuranceDetails: {
      insurerName: 'بیمه ایران',
      financialCoverageAmount: 100_000_000,
      hasDiscounts: true,
      discountPercent: 5,
    },
  },
  // 2. Urgent: Power of Attorney expiring in 6 days!
  {
    id: 'DOC-EXP-002',
    vehicleId: 'veh-1',
    vehicleLabel: 'Toyota Camry 2025 (۶۷الف۱۲۳-۲۱)',
    category: 'power_of_attorney',
    title: 'وکالت تعویض پلاک دفتر ۲۴ تهران',
    documentNumber: 'POA-1405-9981',
    startDate: '۱۴۰۵/۰۶/۰۱',
    expiryDate: '۱۴۰۵/۰۸/۰۷', // ~ 6 days left
    notes: 'وکالت تعویض پلاک با حق توکیل، صادر شده از مالک قبلی (مهدی حسینی) به نام نمایشگاه جهت انتقال سند',
    createdAt: '2026-09-15T10:00:00Z',
    poaDetails: {
      poaType: 'received',
      notaryOffice: 'دفترخانه اسناد رسمی شماره ۲۴ تهران',
      grantorName: 'مهدی حسینی',
      grantorNationalId: '0078129432',
      agentName: 'نمایشگاه اتو عبداللهی (محمد امین عبداللهی)',
      agentNationalId: '0069412389',
      subject: 'تعویض پلاک و فک پلاک و اخذ شناسنامه مالکیت',
      status: 'valid',
    },
  },
  // 3. Warning (< 30 days): Power of Attorney for KMC SR6 expiring in 22 days
  {
    id: 'DOC-EXP-003',
    vehicleId: 'veh-2',
    vehicleLabel: 'کی ام سی SR6 (۱۲ب۴۵۶-۲۲)',
    category: 'power_of_attorney',
    title: 'وکالت فروش بلاعزل دفتر ۱۰۵ کرج',
    documentNumber: 'POA-1405-7721',
    startDate: '۱۴۰۵/۰۵/۲۴',
    expiryDate: '۱۴۰۵/۰۸/۲۴', // ~ 23 days left
    notes: 'وکالت فروش قطعی بلاعزل همراه با حق اقرار وصول ثمن معامله',
    createdAt: '2026-09-20T12:00:00Z',
    poaDetails: {
      poaType: 'received',
      notaryOffice: 'دفترخانه اسناد رسمی شماره ۱۰۵ کرج',
      grantorName: 'سهراب احمدی',
      grantorNationalId: '0321948571',
      agentName: 'نمایشگاه اتو عبداللهی',
      subject: 'انتقال قطعی و فروش خودرو و امضای اسناد رسمی',
      status: 'valid',
    },
  },
  // 4. Safe: Third-Party Insurance for KMC SR6 expiring in 8 months
  {
    id: 'DOC-EXP-004',
    vehicleId: 'veh-2',
    vehicleLabel: 'کی ام سی SR6 (۱۲ب۴۵۶-۲۲)',
    category: 'third_party_insurance',
    title: 'بیمه‌نامه شخص ثالث بیمه آسیا',
    documentNumber: 'ASI-77412998',
    startDate: '۱۴۰۵/۰۴/۱۵',
    expiryDate: '۱۴۰۶/۰۴/۱۵',
    notes: 'پوشش مالی کامل، بدون خسارت',
    createdAt: '2026-08-10T09:00:00Z',
    insuranceDetails: {
      insurerName: 'بیمه آسیا',
      financialCoverageAmount: 150_000_000,
      hasDiscounts: true,
      discountPercent: 10,
    },
  },
  // 5. Expired: Old technical inspection for archival record
  {
    id: 'DOC-EXP-005',
    vehicleId: 'veh-1',
    vehicleLabel: 'Toyota Camry 2025 (۶۷الف۱۲۳-۲۱)',
    category: 'technical_inspection',
    title: 'معاینه فنی برتر مرکز بیهقی',
    documentNumber: 'TECH-1404-0012',
    startDate: '۱۴۰۴/۰۶/۱۰',
    expiryDate: '۱۴۰۵/۰۶/۱۰', // Expired
    notes: 'منقضی شده - گواهی معاینه فنی جدید در صف صدور می‌باشد',
    createdAt: '2026-09-01T11:00:00Z',
  },
];
