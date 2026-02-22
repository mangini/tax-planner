import { describe, it, expect } from 'vitest';
import { computeAdditionalMedicareTax } from '../../engine/medicare.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeAdditionalMedicareTax', () => {
  it('returns 0 when wages below threshold', () => {
    expect(computeAdditionalMedicareTax(200000, config2025)).toBe(0);
  });

  it('taxes excess wages at 0.9%', () => {
    // Wages $350k, excess = $100k, tax = $900
    expect(computeAdditionalMedicareTax(350000, config2025)).toBe(900);
  });

  it('returns 0 at exact threshold', () => {
    expect(computeAdditionalMedicareTax(250000, config2025)).toBe(0);
  });
});
