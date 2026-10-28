// Patch 09C: Initial Presets Data
import { ReferencePreset } from '../types/patch09c';

export const INITIAL_REFERENCE_PRESETS: ReferencePreset[] = [
  // 1. Vehicle Brands
  { id: 'pre-br-1', category: 'vehicle_brands', code: 'toyota', name: 'تویوتا (Toyota)', isActive: true, order: 1 },
  { id: 'pre-br-2', category: 'vehicle_brands', code: 'hyundai', name: 'هیوندای (Hyundai)', isActive: true, order: 2 },
  { id: 'pre-br-3', category: 'vehicle_brands', code: 'kia', name: 'کیا (Kia)', isActive: true, order: 3 },
  { id: 'pre-br-4', category: 'vehicle_brands', code: 'kmc', name: 'کی‌ام‌سی (KMC / کرمان موتور)', isActive: true, order: 4 },
  { id: 'pre-br-5', category: 'vehicle_brands', code: 'fownix', name: 'فونیکس (Fownix / مدیران خودرو)', isActive: true, order: 5 },
  { id: 'pre-br-6', category: 'vehicle_brands', code: 'chery', name: 'چری (Chery / MVM)', isActive: true, order: 6 },
  { id: 'pre-br-7', category: 'vehicle_brands', code: 'nissan', name: 'نیسان (Nissan)', isActive: true, order: 7 },
  { id: 'pre-br-8', category: 'vehicle_brands', code: 'peugeot', name: 'پژو (ایران‌خودرو)', isActive: true, order: 8 },
  { id: 'pre-br-9', category: 'vehicle_brands', code: 'bahman', name: 'بهمن موتور (دیگنیتی/فیدلیتی)', isActive: true, order: 9 },

  // 2. Vehicle Transmissions
  { id: 'pre-tr-1', category: 'transmissions', code: 'at_auto', name: 'اتوماتیک تیپ‌ترونیک (AT)', isActive: true, order: 1 },
  { id: 'pre-tr-2', category: 'transmissions', code: 'wet_dct', name: 'دوکلاچه تر (Wet DCT)', isActive: true, order: 2 },
  { id: 'pre-tr-3', category: 'transmissions', code: 'dry_dct', name: 'دوکلاچه خشک (Dry DCT)', isActive: true, order: 3 },
  { id: 'pre-tr-4', category: 'transmissions', code: 'cvt', name: 'متغیر پیوسته (CVT)', isActive: true, order: 4 },
  { id: 'pre-tr-5', category: 'transmissions', code: 'ecvt', name: 'هیبریدی هوشمند (E-CVT)', isActive: true, order: 5 },
  { id: 'pre-tr-6', category: 'transmissions', code: 'manual_6', name: 'دستی ۶ سرعته', isActive: true, order: 6 },
  { id: 'pre-tr-7', category: 'transmissions', code: 'manual_5', name: 'دستی ۵ سرعته', isActive: true, order: 7 },

  // 3. Colors
  { id: 'pre-col-1', category: 'colors', code: 'white_pearl', name: 'سفید صدفی', isActive: true, order: 1 },
  { id: 'pre-col-2', category: 'colors', code: 'white_pure', name: 'سفید روغنی', isActive: true, order: 2 },
  { id: 'pre-col-3', category: 'colors', code: 'black_metallic', name: 'مشکی متالیک آبنوسی', isActive: true, order: 3 },
  { id: 'pre-col-4', category: 'colors', code: 'gray_titanium', name: 'خاکستری تیتانیوم / متالیک', isActive: true, order: 4 },
  { id: 'pre-col-5', category: 'colors', code: 'silver', name: 'نقره‌ای متالیک', isActive: true, order: 5 },
  { id: 'pre-col-6', category: 'colors', code: 'carbon_black', name: 'کربن بلک', isActive: true, order: 6 },
  { id: 'pre-col-7', category: 'colors', code: 'navy_blue', name: 'سرمه‌ای هفت‌رنگ', isActive: true, order: 7 },
  { id: 'pre-col-8', category: 'colors', code: 'red_ruby', name: 'قرمز یاقوتی متالیک', isActive: true, order: 8 },

  // 4. Fuel Types
  { id: 'pre-fl-1', category: 'fuel_types', code: 'petrol', name: 'بنزینی (تنفس طبیعی / توربوشارژ)', isActive: true, order: 1 },
  { id: 'pre-fl-2', category: 'fuel_types', code: 'hybrid', name: 'هیبریدی (بنزین + الکتریک HEV)', isActive: true, order: 2 },
  { id: 'pre-fl-3', category: 'fuel_types', code: 'plugin_hybrid', name: 'پلاگین هیبرید (PHEV)', isActive: true, order: 3 },
  { id: 'pre-fl-4', category: 'fuel_types', code: 'electric', name: 'تمام الکتریکی (EV)', isActive: true, order: 4 },
  { id: 'pre-fl-5', category: 'fuel_types', code: 'diesel', name: 'گازوئیل / دیزل توربو', isActive: true, order: 5 },
  { id: 'pre-fl-6', category: 'fuel_types', code: 'cng_bifuel', name: 'دوگانه‌سوز گازسوز فابریک (CNG)', isActive: true, order: 6 },

  // 5. Insurance Companies
  { id: 'pre-ins-1', category: 'insurance_companies', code: 'iran', name: 'بیمه ایران', isActive: true, order: 1 },
  { id: 'pre-ins-2', category: 'insurance_companies', code: 'asia', name: 'بیمه آسیا', isActive: true, order: 2 },
  { id: 'pre-ins-3', category: 'insurance_companies', code: 'dana', name: 'بیمه دانا', isActive: true, order: 3 },
  { id: 'pre-ins-4', category: 'insurance_companies', code: 'alborz', name: 'بیمه البرز', isActive: true, order: 4 },
  { id: 'pre-ins-5', category: 'insurance_companies', code: 'pasargad', name: 'بیمه پاسارگاد', isActive: true, order: 5 },
  { id: 'pre-ins-6', category: 'insurance_companies', code: 'parsian', name: 'بیمه پارسیان', isActive: true, order: 6 },
  { id: 'pre-ins-7', category: 'insurance_companies', code: 'kowsar', name: 'بیمه کوثر', isActive: true, order: 7 },
  { id: 'pre-ins-8', category: 'insurance_companies', code: 'saman', name: 'بیمه سامان', isActive: true, order: 8 },
  { id: 'pre-ins-9', category: 'insurance_companies', code: 'razi', name: 'بیمه رازی', isActive: true, order: 9 },
  { id: 'pre-ins-10', category: 'insurance_companies', code: 'dey', name: 'بیمه دی', isActive: true, order: 10 },

  // 6. Document Types
  { id: 'pre-doc-1', category: 'document_types', code: 'third_party_ins', name: 'بیمه‌نامه شخص ثالث معتبر', isActive: true, order: 1 },
  { id: 'pre-doc-2', category: 'document_types', code: 'poa_plate_transfer', name: 'وکالت‌نامه تعویض پلاک با حق توکیل', isActive: true, order: 2 },
  { id: 'pre-doc-3', category: 'document_types', code: 'poa_sale', name: 'وکالت‌نامه فروش قطعی بلاعزل', isActive: true, order: 3 },
  { id: 'pre-doc-4', category: 'document_types', code: 'green_card', name: 'برگ سبز راهور (سند مالکیت خودرو)', isActive: true, order: 4 },
  { id: 'pre-doc-5', category: 'document_types', code: 'company_contract', name: 'سند قطعی کارخانه / کمپانی', isActive: true, order: 5 },
  { id: 'pre-doc-6', category: 'document_types', code: 'tech_inspection', name: 'گواهی معاینه فنی معتبر', isActive: true, order: 6 },
  { id: 'pre-doc-7', category: 'document_types', code: 'fuel_card', name: 'کارت سوخت هوشمند خودرو', isActive: true, order: 7 },
  { id: 'pre-doc-8', category: 'document_types', code: 'tax_clearance', name: 'مفاصا حساب مالیات نقل و انتقال و عوارض شهرداری', isActive: true, order: 8 },

  // 7. Expense Categories
  { id: 'pre-exp-1', category: 'expense_categories', code: 'fuel', name: 'سوخت و بنزین', isActive: true, order: 1 },
  { id: 'pre-exp-2', category: 'expense_categories', code: 'inspection', name: 'کارشناسی رنگ و فنی بدنه', isActive: true, order: 2 },
  { id: 'pre-exp-3', category: 'expense_categories', code: 'towing', name: 'حمل با خودروبر و یدک‌کش', isActive: true, order: 3 },
  { id: 'pre-exp-4', category: 'expense_categories', code: 'service', name: 'سرویس‌های دوره‌ای، روغن و تعمیرگاه', isActive: true, order: 4 },
  { id: 'pre-exp-5', category: 'expense_categories', code: 'detailing', name: 'کارواش، پولیش، سرامیک و دیتیلینگ', isActive: true, order: 5 },
  { id: 'pre-exp-6', category: 'expense_categories', code: 'consumable', name: 'پذیرایی و مصرفی دفتر نمایشگاه', isActive: true, order: 6 },
  { id: 'pre-exp-7', category: 'expense_categories', code: 'commission', name: 'کارمزد و کمیسیون متفرقه', isActive: true, order: 7 },
  { id: 'pre-exp-8', category: 'expense_categories', code: 'traffic_tax', name: 'خلافی راهور، عوارض آزادراهی و نقل و انتقال', isActive: true, order: 8 },

  // 8. Commission Categories
  { id: 'pre-com-1', category: 'commission_categories', code: 'full_deal', name: 'کمیسیون کامل معامله طرفین', isActive: true, order: 1 },
  { id: 'pre-com-2', category: 'commission_categories', code: 'buyer_only', name: 'حق‌العمل خالص از خریدار', isActive: true, order: 2 },
  { id: 'pre-com-3', category: 'commission_categories', code: 'seller_only', name: 'حق‌العمل خالص از فروشنده', isActive: true, order: 3 },
  { id: 'pre-com-4', category: 'commission_categories', code: 'consignment_sale', name: 'کارمزد فروش امانی خودرو', isActive: true, order: 4 },
];
