import { describe, it, expect } from 'vitest';
import { computeDeductions } from '../../engine/deductions.js';
import { config2025 } from '../../../shared/tax-config-2025.js';
import type { TaxYearData } from '../../../shared/types.js';

function makeData(overrides: Partial<TaxYearData> = {}): TaxYearData {
  return {
    year: 2025,
    filing: { status: 'mfj', numChildren: 1 },
    w2: [],
    form1099INT: [],
    form1099DIV: [],
    form1099B: [],
    form1099G: [],
    form1099R: [],
    form1098: [],
    scheduleK1: [],
    foreignAccounts: [],
    ...overrides,
  };
}

describe('computeDeductions', () => {
  it('uses standard deduction when no itemized deductions', () => {
    const result = computeDeductions(makeData(), 300000, config2025);
    expect(result.usingItemized).toBe(false);
    expect(result.deductionUsed).toBe(30000);
  });

  it('uses itemized when total exceeds standard', () => {
    const data = makeData({
      form1098: [{ id: '1', lender: 'Bank', mortgageInterest: 20000, propertyTax: 12000, pmi: 0 }],
      charitable: { donations: [{ description: 'Charity', amount: 10000, type: 'cash' as const }] },
      w2: [{
        id: '1', owner: 'self', employer: 'Co', wages: 300000, federalWithheld: 50000,
        socialSecurityWages: 176100, socialSecurityWithheld: 10918,
        medicareWages: 300000, medicareWithheld: 4350,
        stateWages: 300000, stateWithheld: 12000,
        hsaEmployerContribution: 0,
      }],
    });
    const result = computeDeductions(data, 300000, config2025);
    // Mortgage $20k + SALT (12k property + 12k state = $24k, under $40k cap) + Charitable $10k
    // = $20k + $24k + $10k = $54k > $30k standard
    expect(result.usingItemized).toBe(true);
    expect(result.totalItemized).toBeGreaterThan(30000);
  });

  it('caps SALT at configured limit', () => {
    const data = makeData({
      form1098: [{ id: '1', lender: 'Bank', mortgageInterest: 0, propertyTax: 30000, pmi: 0 }],
      w2: [{
        id: '1', owner: 'self', employer: 'Co', wages: 500000, federalWithheld: 0,
        socialSecurityWages: 0, socialSecurityWithheld: 0,
        medicareWages: 0, medicareWithheld: 0,
        stateWages: 500000, stateWithheld: 25000,
        hsaEmployerContribution: 0,
      }],
    });
    const result = computeDeductions(data, 500000, config2025);
    // SALT total = $30k property + $25k state = $55k, capped at $40k
    expect(result.saltTotal).toBe(55000);
    expect(result.saltCapped).toBe(40000);
  });
});
