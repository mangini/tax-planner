import { describe, it, expect } from 'vitest';
import { computeNIIT } from '../../engine/niit.js';
import { config2025 } from '../../../shared/tax-config-2025.js';

describe('computeNIIT', () => {
  it('returns 0 when AGI is below threshold', () => {
    expect(computeNIIT(50000, 200000, config2025)).toBe(0);
  });

  it('returns 0 when investment income is 0', () => {
    expect(computeNIIT(0, 500000, config2025)).toBe(0);
  });

  it('taxes lesser of investment income and excess AGI', () => {
    // AGI $350k, investment income $50k
    // Excess = $100k, min(50k, 100k) = 50k
    // NIIT = 50k * 3.8% = $1,900
    expect(computeNIIT(50000, 350000, config2025)).toBe(1900);
  });

  it('taxes full investment income when excess AGI is larger', () => {
    // AGI $500k, investment income $30k
    // Excess = $250k, min(30k, 250k) = 30k
    // NIIT = 30k * 3.8% = $1,140
    expect(computeNIIT(30000, 500000, config2025)).toBe(1140);
  });

  it('taxes based on excess AGI when investment income is larger', () => {
    // AGI $300k, investment income $200k
    // Excess = $50k, min(200k, 50k) = 50k
    // NIIT = 50k * 3.8% = $1,900
    expect(computeNIIT(200000, 300000, config2025)).toBe(1900);
  });
});
