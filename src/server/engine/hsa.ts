import type { YearConfig, TaxYearData } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

/**
 * Compute HSA above-the-line deduction.
 * Limit depends on coverage type. Employer contributions reduce the limit.
 * Catch-up contributions for age 55+.
 */
export function computeHSADeduction(data: TaxYearData, config: YearConfig): number {
  if (!data.hsa) return 0;

  const coverageLimit =
    data.hsa.coverageType === 'self-only'
      ? config.hsa.selfOnlyLimit
      : config.hsa.familyLimit;

  // Catch-up for each spouse aged 55+
  let catchUp = 0;
  if (data.hsa.selfAge >= config.hsa.catchUpAge) catchUp += config.hsa.catchUpAmount;
  if (data.hsa.spouseAge >= config.hsa.catchUpAge) catchUp += config.hsa.catchUpAmount;

  const totalLimit = coverageLimit + catchUp;

  const selfContrib = amountValue(data.hsa.selfContribution);
  const employerContrib = amountValue(data.hsa.employerContribution);
  let w2EmployerHSA = 0;
  for (const w of data.w2) w2EmployerHSA += amountValue(w.hsaEmployerContribution);

  const totalEmployer = employerContrib + w2EmployerHSA;
  const maxDeductible = Math.max(0, totalLimit - totalEmployer);

  return Math.min(selfContrib, maxDeductible);
}
