import { describe, it, expect } from 'vitest';
import { computeChildTaxCredit, computeForeignTaxCredit, computeAOTC } from '../../engine/credits.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeChildTaxCredit', () => {
  it('returns full credit when AGI is below phaseout', () => {
    expect(computeChildTaxCredit(1, 300000, config2025)).toBe(2200);
  });

  it('returns 0 for no children', () => {
    expect(computeChildTaxCredit(0, 300000, config2025)).toBe(0);
  });

  it('phases out credit for high earners', () => {
    // AGI $450k, excess = $50k, reduction = 50 × $50 = $2,500 > $2,200
    expect(computeChildTaxCredit(1, 450000, config2025)).toBe(0);
  });

  it('partially phases out for moderate excess', () => {
    // AGI $420k, excess = $20k, reduction = 20 × $50 = $1,000
    expect(computeChildTaxCredit(1, 420000, config2025)).toBe(1200);
  });

  it('rounds partial $1,000 up', () => {
    // excess $20,001 → 21 steps → $1,050
    expect(computeChildTaxCredit(1, 420001, config2025)).toBe(1150);
  });

  it('returns full credit at exactly phaseout start', () => {
    expect(computeChildTaxCredit(1, 400000, config2025)).toBe(2200);
  });
});

describe('computeForeignTaxCredit', () => {
  it('returns 0 when no foreign tax paid', () => {
    expect(computeForeignTaxCredit(0, 50000, 500000, 100000)).toBe(0);
  });

  it('limits credit by foreign income proportion of taxable income', () => {
    // Limitation = (50k / 500k) × 100k = $10,000
    expect(computeForeignTaxCredit(5000, 50000, 500000, 100000)).toBe(5000);
  });

  it('caps credit at limitation', () => {
    expect(computeForeignTaxCredit(20000, 50000, 500000, 100000)).toBe(10000);
  });

  it('allows de minimis foreign tax without limitation', () => {
    // $500 ≤ $600 MFJ de minimis — limitation would be (1k / 500k) × 100k = $200
    expect(computeForeignTaxCredit(500, 1000, 500000, 100000)).toBe(500);
  });
});

describe('computeAOTC', () => {
  it('gives the full $2,500 for $4,000 of expenses below phaseout', () => {
    expect(computeAOTC(4000, 100000, config2025)).toBe(2500);
  });

  it('gives 100% of first $2,000 + 25% of next $2,000', () => {
    expect(computeAOTC(3000, 100000, config2025)).toBe(2250);
  });

  it('phases out linearly between $160k and $180k', () => {
    expect(computeAOTC(4000, 170000, config2025)).toBe(1250);
    expect(computeAOTC(4000, 180000, config2025)).toBe(0);
  });
});
