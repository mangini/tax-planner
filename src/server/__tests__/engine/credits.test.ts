import { describe, it, expect } from 'vitest';
import { computeChildTaxCredit, computeForeignTaxCredit } from '../../engine/credits.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeChildTaxCredit', () => {
  it('returns full credit when AGI is below phaseout', () => {
    expect(computeChildTaxCredit(1, 300000, config2025)).toBe(2000);
  });

  it('returns 0 for no children', () => {
    expect(computeChildTaxCredit(0, 300000, config2025)).toBe(0);
  });

  it('phases out credit for high earners', () => {
    // AGI $450k, excess = $50k, reduction = ceil(50) * $50 = $2,500
    // Credit for 1 child = $2,000 - $2,500 = $0
    expect(computeChildTaxCredit(1, 450000, config2025)).toBe(0);
  });

  it('partially phases out for moderate excess', () => {
    // AGI $420k, excess = $20k, reduction = 20 * $50 = $1,000
    // Credit = $2,000 - $1,000 = $1,000
    expect(computeChildTaxCredit(1, 420000, config2025)).toBe(1000);
  });

  it('returns full credit at exactly phaseout start', () => {
    expect(computeChildTaxCredit(1, 400000, config2025)).toBe(2000);
  });
});

describe('computeForeignTaxCredit', () => {
  it('returns 0 when no foreign tax paid', () => {
    expect(computeForeignTaxCredit(0, 50000, 500000, 100000)).toBe(0);
  });

  it('limits credit by foreign income proportion', () => {
    // Foreign tax $5,000, foreign income $50,000, total income $500,000, US tax $100,000
    // Limitation = (50k / 500k) * 100k = $10,000
    // Credit = min(5000, 10000) = $5,000
    expect(computeForeignTaxCredit(5000, 50000, 500000, 100000)).toBe(5000);
  });

  it('caps credit at limitation', () => {
    // Foreign tax $20,000 but limitation is only $10,000
    expect(computeForeignTaxCredit(20000, 50000, 500000, 100000)).toBe(10000);
  });
});
