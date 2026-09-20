// Utilities for Iranian Toman formatting, Persian digits, and Jalali dates

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

export function formatToman(amount: number, showUnit: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showUnit ? `۰ تومان` : '۰';
  }
  const integerPart = Math.round(amount);
  const formatted = integerPart.toLocaleString('fa-IR');
  return showUnit ? `${formatted} تومان` : formatted;
}

export function parseTomanInput(value: string): number {
  // strip non-numeric except english/persian digits
  const persianToEnglish: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };

  const clean = value.replace(/[۰-۹٠-٩]/g, (char) => persianToEnglish[char] || char);
  const numericOnly = clean.replace(/[^0-9]/g, '');
  const parsed = parseInt(numericOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Current Persian dealership date
export const DEALERSHIP_CURRENT_DATE = '۱۴۰۵/۰۶/۲۹';

export function getTodayDateString(): string {
  return DEALERSHIP_CURRENT_DATE;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  // if it matches today
  if (dateStr === DEALERSHIP_CURRENT_DATE || dateStr === '1405/06/29') {
    return 'امروز';
  }
  return toPersianDigits(dateStr);
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
