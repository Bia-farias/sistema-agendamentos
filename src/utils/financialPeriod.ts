import { FinancialPeriod } from '../types/financeiro';

/**
 * Parses a YYYY-MM-DD date string into local calendar parts without UTC shift.
 */
function parseLocalDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function toLocalDate(dateStr: string): Date | null {
  const parts = parseLocalDateParts(dateStr);
  if (!parts) return null;
  return new Date(parts.year, parts.month, parts.day);
}

/**
 * Checks if a YYYY-MM-DD date falls inside the requested FinancialPeriod relative to `todayStr`.
 */
export function isDateInFinancialPeriod(
  dateStr: string,
  period: FinancialPeriod,
  todayStr: string
): boolean {
  if (!dateStr || period === 'all') return true;
  if (period === 'today') return dateStr.slice(0, 10) === todayStr;

  const target = toLocalDate(dateStr);
  const curr = toLocalDate(todayStr);
  if (!target || !curr) return true;

  if (period === 'week') {
    const diffDays = (curr.getTime() - target.getTime()) / (1000 * 3600 * 24);
    return diffDays >= -1 && diffDays <= 7;
  }

  if (period === 'month') {
    return (
      target.getFullYear() === curr.getFullYear() &&
      target.getMonth() === curr.getMonth()
    );
  }

  if (period === 'next_month') {
    const nextMonthDate = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    return (
      target.getFullYear() === nextMonthDate.getFullYear() &&
      target.getMonth() === nextMonthDate.getMonth()
    );
  }

  return true;
}

/**
 * Checks if a YYYY-MM-DD date occurs strictly BEFORE the start of the selected FinancialPeriod.
 * Used to compute the opening cash balance prior to the selected period.
 */
export function isDateBeforeFinancialPeriod(
  dateStr: string,
  period: FinancialPeriod,
  todayStr: string
): boolean {
  if (!dateStr || period === 'all') return false;

  const target = toLocalDate(dateStr);
  const curr = toLocalDate(todayStr);
  if (!target || !curr) return false;

  if (period === 'today') {
    return target.getTime() < curr.getTime();
  }

  if (period === 'week') {
    const weekStart = new Date(curr);
    weekStart.setDate(curr.getDate() - 7);
    return target.getTime() < weekStart.getTime();
  }

  if (period === 'month') {
    const monthStart = new Date(curr.getFullYear(), curr.getMonth(), 1);
    return target.getTime() < monthStart.getTime();
  }

  if (period === 'next_month') {
    const nextMonthStart = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    return target.getTime() < nextMonthStart.getTime();
  }

  return false;
}

