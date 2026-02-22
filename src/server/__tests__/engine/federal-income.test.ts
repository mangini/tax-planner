import { describe, it, expect } from 'vitest';
import { computeBracketTax, computeOrdinaryIncomeTax } from '../../engine/federal-income.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeBracketTax', () => {
  const brackets = config2025.federalBrackets;

  it('computes 0 tax for 0 income', () => {
    const { tax, marginalRate } = computeBracketTax(0, brackets);
    expect(tax).toBe(0);
    expect(marginalRate).toBe(0);
  });

  it('computes 10% bracket only', () => {
    const { tax, marginalRate } = computeBracketTax(10000, brackets);
    expect(tax).toBe(1000);
    expect(marginalRate).toBe(0.10);
  });

  it('computes through 12% bracket', () => {
    // $23,850 * 10% + ($50,000 - $23,850) * 12% = $2,385 + $3,138 = $5,523
    const { tax, marginalRate } = computeBracketTax(50000, brackets);
    expect(tax).toBe(5523);
    expect(marginalRate).toBe(0.12);
  });

  it('computes for high income through 35% bracket', () => {
    // Taxable income of $600,000
    const { tax, marginalRate } = computeBracketTax(600000, brackets);
    expect(marginalRate).toBe(0.35);
    // Verify tax is positive and reasonable
    expect(tax).toBeGreaterThan(100000);
    expect(tax).toBeLessThan(250000);
  });

  it('computes for income in top bracket', () => {
    const { tax, marginalRate } = computeBracketTax(1000000, brackets);
    expect(marginalRate).toBe(0.37);
    expect(tax).toBeGreaterThan(200000);
  });
});

describe('computeOrdinaryIncomeTax', () => {
  it('returns 0 for negative income', () => {
    const { tax } = computeOrdinaryIncomeTax(-5000, config2025.federalBrackets);
    expect(tax).toBe(0);
  });
});
