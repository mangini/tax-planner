import { describe, it, expect } from 'vitest';
import {
  computeEstimatedTax,
  installmentDueDates,
  simulatePenalty,
  type EstimatedTaxInput,
} from '../../engine/estimated-tax.js';
import { config2026 } from '../../../shared/tax-config-2026.js';

const rate = 0.07 / 365;

function input(overrides: Partial<EstimatedTaxInput> = {}): EstimatedTaxInput {
  return {
    jurisdiction: 'federal',
    year: 2026,
    currentYearTax: 200000,
    projectedWithholding: 120000,
    estimates: [0, 0, 0, 0],
    priorYear: { tax: 150000, agi: 500000, source: 'entered' },
    rules: config2026.estimatedTax.federal,
    asOf: '2026-11-01',
    remainingPaychecks: 4,
    ...overrides,
  };
}

describe('installmentDueDates', () => {
  it('uses Apr 15, Jun 15, Sep 15, Jan 15', () => {
    expect(installmentDueDates(2026)).toEqual(['2026-04-15', '2026-06-15', '2026-09-15', '2027-01-15']);
  });

  it('moves weekend due dates to Monday', () => {
    // Jan 15, 2028 is a Saturday
    expect(installmentDueDates(2027)[3]).toBe('2028-01-17');
  });
});

describe('computeEstimatedTax', () => {
  it('uses 110% of prior-year tax when it is lower and prior AGI > $150k', () => {
    const r = computeEstimatedTax(input());
    // min(90% × 200k = 180k, 110% × 150k = 165k)
    expect(r.requiredAnnualPayment).toBe(165000);
    expect(r.basis).toBe('prior-year');
    expect(r.exempt).toBe(false);
  });

  it('uses 100% of prior-year tax when prior AGI ≤ $150k', () => {
    const r = computeEstimatedTax(input({ priorYear: { tax: 150000, agi: 140000, source: 'entered' } }));
    expect(r.requiredAnnualPayment).toBe(150000);
  });

  it('falls back to the current-year test without prior-year data', () => {
    const r = computeEstimatedTax(input({ priorYear: null }));
    expect(r.requiredAnnualPayment).toBe(180000);
    expect(r.basis).toBe('current-year');
    expect(r.priorYearSource).toBe('none');
  });

  it('credits withholding evenly and rolls past shortfalls into the next installment', () => {
    const r = computeEstimatedTax(input());
    // installment 41,250; withholding 30,000 per quarter
    expect(r.quarters.map((q) => q.shortfall)).toEqual([11250, 22500, 33750, 45000]);
    expect(r.quarters.map((q) => q.isPast)).toEqual([true, true, true, false]);
    expect(r.nextDue).toEqual({ label: 'Q4', dueDate: '2027-01-15', amount: 45000 });
  });

  it('estimates the penalty with and without catching up', () => {
    const r = computeEstimatedTax(input());
    // Nothing more paid: FIFO application of the 30k quarterly withholding, rest paid 2027-04-15
    const nothing = rate * (11250 * 61 + 22500 * 92 + 30000 * 122 + 3750 * 212 + 41250 * 90);
    expect(r.penaltyIfNothingPaid).toBeCloseTo(nothing, 1);
    // Pay the 33,750 past shortfall today (Nov 1) and 11,250 more by Jan 15
    const suggested = rate * (11250 * 61 + 22500 * 92 + 33750 * 47);
    expect(r.penaltyIfSuggestedPaid).toBeCloseTo(suggested, 1);
  });

  it('offers the W-4 alternative per remaining paycheck', () => {
    // gap 165k − 120k = 45k over 4 paychecks
    expect(computeEstimatedTax(input()).extraWithholdingPerPaycheck).toBe(11250);
  });

  it('counts estimates already paid', () => {
    const r = computeEstimatedTax(input({ estimates: [11250, 11250, 11250, 0] }));
    expect(r.quarters.map((q) => q.shortfall)).toEqual([0, 0, 0, 11250]);
    expect(r.nextDue?.amount).toBe(11250);
    expect(r.penaltyIfSuggestedPaid).toBe(0);
  });

  it('is exempt when the balance due is under $1,000', () => {
    const r = computeEstimatedTax(input({ projectedWithholding: 199500 }));
    expect(r.exempt).toBe(true);
    expect(r.nextDue?.amount).toBe(0);
    expect(r.penaltyIfNothingPaid).toBe(0);
  });

  it('is exempt when withholding covers the safe harbor even with a balance due', () => {
    const r = computeEstimatedTax(input({ projectedWithholding: 170000 }));
    expect(r.projectedBalanceDue).toBe(30000);
    expect(r.exempt).toBe(true);
  });

  it('uses 70% of current-year tax for Colorado', () => {
    const r = computeEstimatedTax(input({
      jurisdiction: 'colorado',
      rules: config2026.estimatedTax.colorado,
      currentYearTax: 30000,
      projectedWithholding: 10000,
      priorYear: { tax: 25000, agi: 500000, source: 'entered' },
    }));
    // min(70% × 30k = 21k, 110% × 25k = 27.5k)
    expect(r.requiredAnnualPayment).toBe(21000);
    expect(r.basis).toBe('current-year');
  });
});

describe('simulatePenalty', () => {
  it('charges nothing when every installment is paid on time', () => {
    const inst = installmentDueDates(2026).map((dueDate) => ({ dueDate, amount: 1000 }));
    const pays = inst.map((i) => ({ date: i.dueDate, amount: 1000 }));
    expect(simulatePenalty(inst, pays, 0.07, '2027-04-15')).toBe(0);
  });
});
