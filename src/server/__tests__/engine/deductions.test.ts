import { describe, it, expect } from 'vitest';
import { computeDeductions } from '../../engine/deductions.js';
import { config2025 } from '../../../shared/tax-config-2025.js';
import { config2026 } from '../../../shared/tax-config-2026.js';
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
    expect(result.deductionUsed).toBe(31500);
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
    // = $20k + $24k + $10k = $54k > $31.5k standard
    expect(result.usingItemized).toBe(true);
    expect(result.totalItemized).toBe(54000);
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

  it('phases the SALT cap down by 30% of MAGI over $500k, to a $10k floor', () => {
    const data = makeData({
      form1098: [{ id: '1', lender: 'Bank', mortgageInterest: 0, propertyTax: 30000, pmi: 0 }],
    });
    // 2025: cap 40,000 − 30% × (550,000 − 500,000) = 25,000
    expect(computeDeductions(data, 550000, config2025).saltCapped).toBe(25000);
    // Far above threshold: floor
    expect(computeDeductions(data, 700000, config2025).saltCapped).toBe(10000);
  });

  it('applies 2026 charitable floor and 2/37 itemized reduction', () => {
    const data = makeData({
      form1098: [{ id: '1', lender: 'Bank', mortgageInterest: 30000, propertyTax: 10000, pmi: 0 }],
      charitable: { donations: [{ description: 'Charity', amount: 20000, type: 'cash' as const }] },
      w2: [{
        id: '1', owner: 'self', employer: 'Co', wages: 1000000, federalWithheld: 0,
        socialSecurityWages: 0, socialSecurityWithheld: 0,
        medicareWages: 0, medicareWithheld: 0,
        stateWages: 1000000, stateWithheld: 40000,
        hsaEmployerContribution: 0,
      }],
    });
    const r = computeDeductions(data, 1000000, config2026);
    expect(r.saltCapped).toBe(10000);       // phased to floor
    expect(r.charitableTotal).toBe(15000);  // 20,000 − 0.5% × 1M
    // before limit 55,000; reduction = 2/37 × min(55,000, 1M − 768,700)
    expect(r.itemizedReduction).toBeCloseTo(2972.97, 2);
    expect(r.totalItemized).toBeCloseTo(52027.03, 2);
    expect(r.usingItemized).toBe(true);
  });

  it('gives non-itemizers up to $2,000 cash charitable deduction in 2026', () => {
    const data = makeData({
      charitable: { donations: [{ description: 'Charity', amount: 3000, type: 'cash' as const }] },
    });
    const r = computeDeductions(data, 100000, config2026);
    expect(r.usingItemized).toBe(false);
    expect(r.deductionUsed).toBe(32200 + 2000);
    // Not available in 2025
    expect(computeDeductions(data, 100000, config2025).deductionUsed).toBe(31500);
  });

  it('phases out mortgage insurance above $100k AGI (2026+)', () => {
    const data = makeData({
      form1098: [{ id: '1', lender: 'Bank', mortgageInterest: 0, propertyTax: 0, pmi: 2000 }],
    });
    expect(computeDeductions(data, 90000, config2026).mortgageInsurance).toBe(2000);
    expect(computeDeductions(data, 104500, config2026).mortgageInsurance).toBe(1000); // 5 steps × 10%
    expect(computeDeductions(data, 90000, config2025).mortgageInsurance).toBe(0);
  });
});
