import type { YearConfig } from '../../shared/types.js';

/**
 * Net Investment Income Tax: 3.8% on the lesser of:
 * - Net investment income, OR
 * - AGI in excess of threshold ($250k MFJ)
 */
export function computeNIIT(
  investmentIncome: number,
  agi: number,
  config: YearConfig
): number {
  if (agi <= config.niit.threshold) return 0;
  if (investmentIncome <= 0) return 0;

  const excess = agi - config.niit.threshold;
  const taxableBase = Math.min(investmentIncome, excess);
  return Math.round(taxableBase * config.niit.rate * 100) / 100;
}
