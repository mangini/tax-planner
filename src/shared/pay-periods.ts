export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export const PAY_FREQUENCIES: { value: PayFrequency; label: string; periodsPerYear: number }[] = [
  { value: 'weekly', label: 'Weekly (52)', periodsPerYear: 52 },
  { value: 'biweekly', label: 'Biweekly (26)', periodsPerYear: 26 },
  { value: 'semimonthly', label: 'Semi-monthly (24)', periodsPerYear: 24 },
  { value: 'monthly', label: 'Monthly (12)', periodsPerYear: 12 },
];

export function periodsPerYear(frequency: PayFrequency): number {
  return PAY_FREQUENCIES.find((f) => f.value === frequency)!.periodsPerYear;
}

/** Parse 'YYYY-MM-DD' as a calendar date (no timezone shifting). */
function parseDate(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month, day));
  if (d.getUTCMonth() !== month || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

/**
 * Number of pay periods in the calendar year that have ended on or before
 * `periodEnd` (the pay period end date printed on the payslip), counting that period.
 *
 * - weekly / biweekly: the n-th period of the year ends on day-of-year d0 + (n−1)·len
 *   with 1 ≤ d0 ≤ len, so the count is ceil(dayOfYear / len).
 * - semi-monthly: periods end on the 15th and the last day of the month.
 * - monthly: one period per month.
 *
 * Returns null for an invalid date.
 */
export function payPeriodsCompleted(periodEnd: string, frequency: PayFrequency): number | null {
  const p = parseDate(periodEnd);
  if (!p) return null;

  switch (frequency) {
    case 'weekly':
    case 'biweekly': {
      const len = frequency === 'weekly' ? 7 : 14;
      const dayOfYear =
        (Date.UTC(p.year, p.month, p.day) - Date.UTC(p.year, 0, 1)) / 86_400_000 + 1;
      return Math.min(periodsPerYear(frequency), Math.ceil(dayOfYear / len));
    }
    case 'semimonthly':
      return p.month * 2 + (p.day <= 15 ? 1 : 2);
    case 'monthly':
      return p.month + 1;
  }
}
