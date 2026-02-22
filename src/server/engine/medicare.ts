import type { YearConfig } from '../../shared/types.js';

/**
 * Additional Medicare Tax: 0.9% on wages exceeding threshold ($250k MFJ).
 * Note: this is in addition to the regular 1.45% already withheld.
 */
export function computeAdditionalMedicareTax(
  wages: number,
  config: YearConfig
): number {
  const excess = wages - config.additionalMedicare.threshold;
  if (excess <= 0) return 0;
  return Math.round(excess * config.additionalMedicare.rate * 100) / 100;
}
