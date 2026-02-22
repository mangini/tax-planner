import type { TaxYearData, FBARResult } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

/**
 * FBAR: Required if aggregate max balance > $10,000 at any point during the year.
 * Form 8938 (FATCA): Required if EITHER threshold is met:
 *   - End of year: aggregate year-end balance > $50,000 single / $100,000 MFJ
 *   - At any time: aggregate max balance > $75,000 single / $150,000 MFJ
 */
export function computeFBAR(data: TaxYearData): FBARResult {
  const accounts = data.foreignAccounts.map((a) => ({
    institution: a.institution,
    country: a.country,
    maxValue: amountValue(a.maxValue),
    yearEndValue: amountValue(a.yearEndValue),
  }));

  const aggregateMaxBalance = accounts.reduce((sum, a) => sum + a.maxValue, 0);
  const aggregateYearEndBalance = accounts.reduce((sum, a) => sum + a.yearEndValue, 0);

  const isMFJ = data.filing.status === 'mfj';
  const yearEndThreshold = isMFJ ? 100000 : 50000;
  const anyTimeThreshold = isMFJ ? 150000 : 75000;

  return {
    aggregateMaxBalance,
    aggregateYearEndBalance,
    fbarRequired: aggregateMaxBalance > 10000,
    form8938Required:
      aggregateYearEndBalance > yearEndThreshold ||
      aggregateMaxBalance > anyTimeThreshold,
    accounts,
  };
}
