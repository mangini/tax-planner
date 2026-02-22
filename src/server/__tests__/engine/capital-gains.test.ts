import { describe, it, expect } from 'vitest';
import { computeCapitalGainsTax } from '../../engine/capital-gains.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeCapitalGainsTax', () => {
  const brackets = config2025.ltcgBrackets;

  it('returns 0 for no capital gains', () => {
    expect(computeCapitalGainsTax(0, 0, 50000, brackets)).toBe(0);
  });

  it('applies 0% rate when income is in 0% bracket', () => {
    // Ordinary income $50,000, LTCG $20,000 => total $70,000 < $96,700
    expect(computeCapitalGainsTax(0, 20000, 50000, brackets)).toBe(0);
  });

  it('applies 15% rate when stacked income lands in 15% bracket', () => {
    // Ordinary income $100,000, LTCG $50,000
    // LTCG sits from $100k to $150k, entirely in 15% bracket
    const tax = computeCapitalGainsTax(0, 50000, 100000, brackets);
    expect(tax).toBe(7500); // 50000 * 0.15
  });

  it('splits across 0% and 15% brackets', () => {
    // Ordinary income $80,000, LTCG $30,000
    // 0% bracket up to $96,700 => $16,700 at 0%
    // 15% bracket for remaining $13,300 at 15% = $1,995
    const tax = computeCapitalGainsTax(0, 30000, 80000, brackets);
    expect(tax).toBe(1995);
  });

  it('handles qualified dividends', () => {
    // $10,000 qualified dividends with $90,000 ordinary income
    // Qualified divs sit from $90k-$100k, $6,700 at 0%, $3,300 at 15%
    const tax = computeCapitalGainsTax(10000, 0, 90000, brackets);
    expect(tax).toBe(495); // 3300 * 0.15
  });
});
