import type { YearConfig } from '../../shared/types.js';

/**
 * Social Security tax computation.
 * Employee pays 6.2% on wages up to the wage base cap.
 * Medicare has no cap.
 */
export function computeSocialSecurityTax(
  wages: number,
  config: YearConfig
): { ssTax: number; medicareTax: number } {
  const ssWages = Math.min(wages, config.socialSecurity.wageBase);
  const ssTax = Math.round(ssWages * config.socialSecurity.employeeRate * 100) / 100;
  const medicareTax = Math.round(wages * config.socialSecurity.medicareRate * 100) / 100;
  return { ssTax, medicareTax };
}
