import { describe, it, expect } from 'vitest';
import { projectYTD, type YTDProjectionInput } from '../../shared/ytd-projection.js';

// Semi-monthly, 20 of 24 periods done. Salary $10k/period, $100k of RSUs vested so far.
const base: YTDProjectionInput = {
  periodsCompleted: 20,
  periodsPerYear: 24,
  ytdGrossPay: 300000,
  ytdSalary: 200000,
  ytdPreTaxDeductions: 20000,        // $1k/period
  ytdFederalTax: 72000,              // $2.5k/period salary + 22% × $100k RSU
  ytdStateTax: 12400,                // $400/period salary + 4.4% × $100k RSU
  ytdOasdi: 11439,                   // wage base already hit
  ytdMedicare: 5250,                 // 1.45% × 300k + 0.9% × 100k
  ytdHsaEmployer: 1000,
  remainingRsuVests: 50000,
  supplementalFederalRate: 0.22,
  supplementalStateRate: 0.044,
  ssWageBase: 184500,
  ssRate: 0.062,
  medicareRate: 0.0145,
};

describe('projectYTD', () => {
  it('extrapolates only salary and adds remaining RSU vests once', () => {
    const p = projectYTD(base)!;
    // gross = 300k + 4 × 10k + 50k = 390k; pre-tax = 24k
    expect(p.wages).toBe(366000);
    expect(p.stateWages).toBe(366000);
    expect(p.medicareWages).toBe(390000);
    // 72k + 4 × 2.5k + 22% × 50k
    expect(p.federalWithheld).toBe(93000);
    // 12.4k + 4 × 400 + 4.4% × 50k
    expect(p.stateWithheld).toBe(16200);
    expect(p.hsaEmployerContribution).toBe(1200);
  });

  it('caps Social Security at the wage base', () => {
    const p = projectYTD(base)!;
    expect(p.socialSecurityWages).toBe(184500);
    expect(p.socialSecurityWithheld).toBe(11439);
  });

  it('adds 0.9% Medicare withholding over $200k', () => {
    // 5,250 + 90k × 1.45% + 90k × 0.9%
    expect(projectYTD(base)!.medicareWithheld).toBe(7365);
  });

  it('withholds 37% on supplemental wages above $1M', () => {
    const p = projectYTD({
      ...base,
      ytdGrossPay: 1100000,
      ytdFederalTax: 50000 + 0.22 * 900000,
      remainingRsuVests: 200000,
    })!;
    // salary part: 4 × 2.5k = 10k; RSU: 100k × 22% + 100k × 37% = 59k
    expect(p.federalWithheld).toBe(50000 + 198000 + 10000 + 59000);
  });

  it('matches a plain extrapolation when there is no RSU income', () => {
    const p = projectYTD({
      ...base,
      ytdGrossPay: 100000,
      ytdSalary: 100000,
      ytdFederalTax: 20000,
      ytdStateTax: 4000,
      ytdOasdi: 6200,
      ytdMedicare: 1450,
      remainingRsuVests: 0,
    })!;
    expect(p.wages).toBe(120000 - 24000);
    expect(p.federalWithheld).toBe(24000);
    expect(p.stateWithheld).toBe(4800);
    expect(p.socialSecurityWithheld).toBe(7440);
    expect(p.medicareWithheld).toBe(1740);
  });

  it('returns null with no completed periods', () => {
    expect(projectYTD({ ...base, periodsCompleted: 0 })).toBeNull();
  });

  it('uses an elected supplemental rate between 22% and 37%', () => {
    // YTD RSU withholding at 23%: salary part 50k + 23k; future vests 50k × 23%
    const p = projectYTD({ ...base, ytdFederalTax: 50000 + 23000, supplementalFederalRate: 0.23 })!;
    expect(p.federalWithheld).toBe(73000 + 4 * 2500 + 11500);
  });
});
