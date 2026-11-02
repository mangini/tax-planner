import { describe, it, expect } from 'vitest';
import { payPeriodsCompleted } from '../../shared/pay-periods.js';

describe('payPeriodsCompleted', () => {
  it('counts semi-monthly periods ending on the 15th and month end', () => {
    expect(payPeriodsCompleted('2026-01-15', 'semimonthly')).toBe(1);
    expect(payPeriodsCompleted('2026-01-31', 'semimonthly')).toBe(2);
    expect(payPeriodsCompleted('2026-10-15', 'semimonthly')).toBe(19);
    expect(payPeriodsCompleted('2026-12-31', 'semimonthly')).toBe(24);
  });

  it('counts monthly periods', () => {
    expect(payPeriodsCompleted('2026-01-31', 'monthly')).toBe(1);
    expect(payPeriodsCompleted('2026-09-30', 'monthly')).toBe(9);
  });

  it('counts biweekly periods regardless of the first period end date', () => {
    // First period ends Jan 3 → Jan 3 = 1, Jan 17 = 2, Oct 24 (day 297) = 22
    expect(payPeriodsCompleted('2026-01-03', 'biweekly')).toBe(1);
    expect(payPeriodsCompleted('2026-01-17', 'biweekly')).toBe(2);
    expect(payPeriodsCompleted('2026-10-24', 'biweekly')).toBe(22);
    // First period ends Jan 14 → Jan 14 = 1, Jan 28 = 2
    expect(payPeriodsCompleted('2026-01-14', 'biweekly')).toBe(1);
    expect(payPeriodsCompleted('2026-01-28', 'biweekly')).toBe(2);
  });

  it('counts weekly periods', () => {
    expect(payPeriodsCompleted('2026-01-07', 'weekly')).toBe(1);
    expect(payPeriodsCompleted('2026-01-08', 'weekly')).toBe(2);
    expect(payPeriodsCompleted('2026-12-30', 'weekly')).toBe(52);
  });

  it('handles leap years', () => {
    // 2028-03-01 is day 61 → ceil(61/14) = 5
    expect(payPeriodsCompleted('2028-03-01', 'biweekly')).toBe(5);
  });

  it('rejects invalid dates', () => {
    expect(payPeriodsCompleted('', 'biweekly')).toBeNull();
    expect(payPeriodsCompleted('2026-02-30', 'monthly')).toBeNull();
  });
});
