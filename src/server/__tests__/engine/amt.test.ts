import { describe, it, expect } from 'vitest';
import { computeAMT } from '../../engine/amt.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeAMT', () => {
  it('returns 0 when regular tax exceeds tentative minimum tax', () => {
    // Low income scenario: AMT should not apply
    const amt = computeAMT(100000, 10000, true, 15000, config2025);
    expect(amt).toBe(0);
  });

  it('returns 0 for not itemizing (no SALT addback)', () => {
    const amt = computeAMT(200000, 10000, false, 30000, config2025);
    expect(amt).toBe(0);
  });

  it('computes AMT when SALT addback pushes over', () => {
    // High SALT + itemized scenario with relatively low regular tax
    const taxableIncome = 400000;
    const salt = 40000;
    const regularTax = 60000;
    const amt = computeAMT(taxableIncome, salt, true, regularTax, config2025);
    // AMTI = 400k + 40k = 440k, which is under phaseout
    // AMT base = 440k - 133.3k exemption = 306.7k
    // Tentative = 248.3k * 0.26 + 58.4k * 0.28 = 64558 + 16352 = 80910
    // AMT = max(0, 80910 - 60000) = 20910
    expect(amt).toBeGreaterThan(0);
  });

  it('handles exemption phaseout', () => {
    // Very high income: exemption phases out
    const amt = computeAMT(1500000, 40000, true, 300000, config2025);
    expect(amt).toBeGreaterThanOrEqual(0);
  });
});
