import { describe, it, expect } from 'vitest';
import { computeAMT, type AMTInput } from '../../engine/amt.js';
import { config2025 } from '../../../shared/tax-config-2025.js';
import { config2026 } from '../../../shared/tax-config-2026.js';

function input(overrides: Partial<AMTInput>): AMTInput {
  return {
    taxableIncome: 0,
    usingItemized: true,
    saltDeducted: 0,
    itemizedReduction: 0,
    standardDeduction: 0,
    stateRefundIncome: 0,
    preferentialIncome: 0,
    ordinaryTaxableIncome: 0,
    regularTax: 0,
    ...overrides,
  };
}

describe('computeAMT', () => {
  it('returns 0 when regular tax exceeds tentative minimum tax', () => {
    const amt = computeAMT(input({ taxableIncome: 100000, saltDeducted: 10000, regularTax: 15000 }), config2025);
    expect(amt).toBe(0);
  });

  it('adds back the standard deduction when not itemizing', () => {
    // AMTI = 200,000 + 31,500 = 231,500; base = 94,500; TMT = 24,570 < 30,000
    const amt = computeAMT(
      input({ taxableIncome: 200000, usingItemized: false, standardDeduction: 31500, regularTax: 30000 }),
      config2025
    );
    expect(amt).toBe(0);
    // With a low regular tax the addback matters: TMT 24,570 − 20,000
    const amt2 = computeAMT(
      input({ taxableIncome: 200000, usingItemized: false, standardDeduction: 31500, regularTax: 20000 }),
      config2025
    );
    expect(amt2).toBe(4570);
  });

  it('computes AMT when SALT addback pushes over (2026)', () => {
    // AMTI = 400,000 + 40,400 = 440,400; base = 440,400 − 140,200 = 300,200
    // TMT = 244,500 × 26% + 55,700 × 28% = 63,570 + 15,596 = 79,166
    const amt = computeAMT(input({ taxableIncome: 400000, saltDeducted: 40400, regularTax: 60000 }), config2026);
    expect(amt).toBe(19166);
  });

  it('phases out the exemption at 50% from 2026', () => {
    // AMTI = 1,200,000; exemption = 140,200 − 50% × 200,000 = 40,200; base = 1,159,800
    // TMT = 63,570 + (1,159,800 − 244,500) × 28% = 63,570 + 256,284 = 319,854
    const amt = computeAMT(input({ taxableIncome: 1190000, saltDeducted: 10000, regularTax: 300000 }), config2026);
    expect(amt).toBe(19854);
  });

  it('taxes preferential income at capital gains rates', () => {
    // AMTI = 440,000; base = 303,000. Flat 26/28% would give 80,058.
    // Part III: 3,000 × 26% + 300,000 × 15% (ordinary 100k is above the 0% bracket) = 45,780
    const amt = computeAMT(
      input({
        taxableIncome: 400000,
        saltDeducted: 40000,
        preferentialIncome: 300000,
        ordinaryTaxableIncome: 100000,
        regularTax: 0,
      }),
      config2025
    );
    expect(amt).toBe(45780);
  });
});
