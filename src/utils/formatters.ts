// Utilities for Iranian Toman formatting, Persian/English digits, and Jalali dates

const PERSIAN_TO_ENGLISH: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Normalizes input to English language digits (EN numerals 0-9).
 * Preserves standard number rendering per site-wide specification.
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/[۰-۹٠-٩]/g, (char) => PERSIAN_TO_ENGLISH[char] || char);
}

export function toEnglishDigits(input: string | number): string {
  return toPersianDigits(input);
}

export function formatToman(amount: number, showUnit: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showUnit ? `0 تومان` : '0';
  }
  const integerPart = Math.round(amount);
  const formatted = integerPart.toLocaleString('en-US');
  return showUnit ? `${formatted} تومان` : formatted;
}

export function parseTomanInput(value: string): number {
  // strip non-numeric except english/persian digits
  const clean = value.replace(/[۰-۹٠-٩]/g, (char) => PERSIAN_TO_ENGLISH[char] || char);
  const numericOnly = clean.replace(/[^0-9]/g, '');
  const parsed = parseInt(numericOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Current dealership date in English numerals
export const DEALERSHIP_CURRENT_DATE = '1405/06/29';

export function getTodayDateString(): string {
  return DEALERSHIP_CURRENT_DATE;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const normalized = toPersianDigits(dateStr);
  if (normalized === DEALERSHIP_CURRENT_DATE || normalized === '1405/06/29') {
    return 'امروز';
  }
  return normalized;
}

// Check duplicate expense signals:
// Same person + Same amount + Same date + similar description
export function findPotentialDuplicate<T extends { personId: string; amount: number; date: string; description: string; id: string }>(
  expenses: T[],
  newExpense: { personId: string; amount: number; date: string; description: string }
): T | undefined {
  const normDesc = (s: string) => s.trim().toLowerCase();
  return expenses.find(
    (exp) =>
      exp.personId === newExpense.personId &&
      exp.amount === newExpense.amount &&
      exp.date === newExpense.date &&
      (normDesc(exp.description) === normDesc(newExpense.description) ||
        normDesc(exp.description).includes(normDesc(newExpense.description)) ||
        normDesc(newExpense.description).includes(normDesc(exp.description)))
  );
}

// Convert Persian or Arabic digits in date string to English standard digits
export function normalizeJalaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const persianToEnglish: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  const clean = dateStr.replace(/[۰-۹٠-٩]/g, (char) => persianToEnglish[char] || char).trim();
  const parts = clean.split(/[/-]/).map((p) => p.trim());
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}/${m}/${d}`;
  }
  return clean;
}

// Compare two normalized Jalali dates: returns -1 if d1 < d2, 0 if equal, 1 if d1 > d2
export function compareJalaliDates(date1: string, date2: string): number {
  const norm1 = normalizeJalaliDate(date1);
  const norm2 = normalizeJalaliDate(date2);
  if (norm1 < norm2) return -1;
  if (norm1 > norm2) return 1;
  return 0;
}

// Check if transaction date is within accounting period boundaries
export function isDateWithinPeriod(
  dateStr: string,
  period?: { startDate: string; endDate?: string } | null
): { valid: boolean; error?: string } {
  if (!period || !period.startDate) {
    return { valid: true };
  }

  const normDate = normalizeJalaliDate(dateStr);
  const normStart = normalizeJalaliDate(period.startDate);

  if (compareJalaliDates(normDate, normStart) < 0) {
    return {
      valid: false,
      error: `تاریخ تراکنش (${toPersianDigits(dateStr)}) قبل از شروع دوره مالی (${toPersianDigits(period.startDate)}) است.`,
    };
  }

  if (period.endDate) {
    const normEnd = normalizeJalaliDate(period.endDate);
    if (compareJalaliDates(normDate, normEnd) > 0) {
      return {
        valid: false,
        error: `تاریخ تراکنش (${toPersianDigits(dateStr)}) بعد از پایان دوره مالی (${toPersianDigits(period.endDate)}) است.`,
      };
    }
  }

  return { valid: true };
}
