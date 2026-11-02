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

/**
 * Number of pay periods in the year that ended strictly before `date` (any calendar day).
 * Weekly/biweekly need `anchorEnd`, a known period end date in the same year
 * (e.g. the payslip date used in the YTD estimator); without it the count is approximate.
 */
export function payPeriodsEndedBefore(
  date: string,
  frequency: PayFrequency,
  anchorEnd?: string
): number | null {
  const p = parseDate(date);
  if (!p) return null;
  const total = periodsPerYear(frequency);
  const clamp = (n: number) => Math.max(0, Math.min(total, n));

  switch (frequency) {
    case 'semimonthly':
      return clamp(p.month * 2 + (p.day > 15 ? 1 : 0));
    case 'monthly':
      return clamp(p.month);
    case 'weekly':
    case 'biweekly': {
      const len = frequency === 'weekly' ? 7 : 14;
      const dayMs = 86_400_000;
      const t = Date.UTC(p.year, p.month, p.day);
      const a = anchorEnd ? parseDate(anchorEnd) : null;
      if (!a || a.year !== p.year) {
        const dayOfYear = (t - Date.UTC(p.year, 0, 1)) / dayMs + 1;
        return clamp(Math.floor((dayOfYear - 1) / len));
      }
      const anchorCount = payPeriodsCompleted(anchorEnd!, frequency)!;
      const diffDays = (t - Date.UTC(a.year, a.month, a.day)) / dayMs;
      // Period ends are anchor + k·len; count those strictly before date
      const k = diffDays > 0 ? Math.ceil(diffDays / len) - 1 : -Math.floor(-diffDays / len) - 1;
      return clamp(anchorCount + k);
    }
  }
}
